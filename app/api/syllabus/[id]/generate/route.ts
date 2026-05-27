import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/llm';

export const maxDuration = 60; // Max timeout on Vercel Hobby

const NOTES_SYSTEM_PROMPT = `You are an expert academic note-taker and tutor.
Your task is to generate comprehensive, well-structured study notes on the topic provided by the user.

RULES:
- Use clear markdown formatting with headings (##, ###)
- Extract and emphasize KEY CONCEPTS in bold
- Use bullet points for lists and sub-concepts
- Include a brief summary at the top
- Identify important DEFINITIONS and label them clearly
- Keep notes detailed, high-quality, and complete. Since this is generated from scratch, provide as much depth as possible.
- Group related information logically

OUTPUT FORMAT (JSON):
{
  "title": "Topic title",
  "summary": "2-3 sentence overview of this topic",
  "content": "Full markdown notes here...",
  "key_concepts": ["concept1", "concept2", "concept3", ...]
}`;

const FLASHCARD_SYSTEM_PROMPT = `You are an expert at creating educational flashcards.
Generate high-quality question-answer flashcards from the provided study notes.

RULES:
- Create clear, specific questions (not vague or too broad)
- Answers should be concise (1-3 sentences max)
- Cover the most important concepts, definitions, and facts
- Vary the difficulty (easy, medium, hard)
- Avoid trivial or obvious questions
- Use "What is...", "Explain...", "How does...", "Why is..." formats

OUTPUT FORMAT (JSON array):
[
  {
    "question": "Question text here?",
    "answer": "Answer text here.",
    "difficulty": "easy" | "medium" | "hard"
  },
  ...
]`;

const QUIZ_SYSTEM_PROMPT = `You are an expert at creating educational quizzes.
Generate challenging but fair quiz questions from the provided study notes.

RULES:
- Mix MCQ (multiple choice) and short_answer questions
- MCQ: provide exactly 4 options, only one correct
- Short answer: questions should have clear, specific answers
- Include an explanation for each answer
- Match difficulty to the specified level
- Focus on understanding, not just memorization

OUTPUT FORMAT (JSON):
{
  "title": "Quiz title",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explanation why this is correct"
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question": "Question text?",
      "correct_answer": "Expected answer",
      "explanation": "Full explanation"
    }
  ]
}`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: syllabusId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic_id, type } = body;
    const customApiKey = request.headers.get('x-groq-api-key') || undefined;

    if (!topic_id || !type || !['notes', 'flashcards', 'quiz'].includes(type)) {
      return NextResponse.json({ error: 'topic_id and valid type are required' }, { status: 400 });
    }

    // Verify topic belongs to the syllabus and user
    const { data: topic, error: topicError } = await supabase
      .from('syllabus_topics')
      .select('*')
      .eq('id', topic_id)
      .eq('syllabus_id', syllabusId)
      .eq('user_id', user.id)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    let noteId = topic.note_id;

    // Helper to generate notes for the topic
    const generateNotesForTopic = async () => {
      const response = await complete(
        [
          { role: 'system', content: NOTES_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Please generate comprehensive study notes for this topic:\nTitle: ${topic.title}\nDescription/Context: ${topic.description || 'General curriculum topic'}`,
          },
        ],
        {
          temperature: 0.4,
          maxTokens: 2500,
          jsonMode: true,
          model: 'llama-3.3-70b-versatile',
          apiKey: customApiKey,
        }
      );

      const parsed = JSON.parse(response);

      const { data: note, error: insertError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: parsed.title || topic.title,
          summary: parsed.summary || null,
          content: parsed.content || '',
          key_concepts: parsed.key_concepts || [],
        })
        .select()
        .single();

      if (insertError || !note) {
        console.error('Notes generation insert error:', insertError);
        throw new Error('Failed to save generated notes.');
      }

      // Link notes back to topic and set status to completed
      await supabase
        .from('syllabus_topics')
        .update({ note_id: note.id, status: 'completed' })
        .eq('id', topic_id);

      return note;
    };

    if (type === 'notes') {
      // If notes already generated, return them. Otherwise generate new ones.
      if (noteId) {
        const { data: existingNote } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();
        if (existingNote) {
          return NextResponse.json({ data: existingNote, message: 'Notes already generated' });
        }
      }

      const newNote = await generateNotesForTopic();
      return NextResponse.json({ data: newNote });
    }

    // For flashcards & quizzes, we MUST have a note first
    let currentNote;
    if (!noteId) {
      currentNote = await generateNotesForTopic();
      noteId = currentNote.id;
    } else {
      const { data: existingNote } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();
      currentNote = existingNote;
    }

    if (!currentNote) {
      return NextResponse.json({ error: 'Failed to retrieve notes for generation context' }, { status: 500 });
    }

    if (type === 'flashcards') {
      const count = 10;
      const response = await complete(
        [
          { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create ${count} flashcards from these study notes titled "${currentNote.title}":\n\n${currentNote.content}`,
          },
        ],
        {
          temperature: 0.6,
          maxTokens: 1500,
          jsonMode: true,
          model: 'llama-3.3-70b-versatile',
          apiKey: customApiKey,
        }
      );

      let cards: Array<{ question: string; answer: string; difficulty: string }>;
      try {
        const parsed = JSON.parse(response);
        cards = Array.isArray(parsed) ? parsed : parsed.flashcards ?? [];
      } catch {
        return NextResponse.json({ error: 'Failed to parse flashcards AI response' }, { status: 500 });
      }

      const { data: flashcards, error: insertError } = await supabase
        .from('flashcards')
        .insert(
          cards.map((card) => ({
            note_id: noteId,
            user_id: user.id,
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty || 'medium',
          }))
        )
        .select();

      if (insertError) {
        console.error('Flashcard insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save generated flashcards' }, { status: 500 });
      }

      return NextResponse.json({ data: flashcards });
    }

    if (type === 'quiz') {
      const difficulty = 'medium';
      const count = 8;
      const response = await complete(
        [
          { role: 'system', content: QUIZ_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create a ${difficulty} difficulty quiz with ${count} questions from these notes titled "${currentNote.title}":\n\n${currentNote.content}`,
          },
        ],
        {
          temperature: 0.5,
          maxTokens: 2000,
          jsonMode: true,
          model: 'llama-3.3-70b-versatile',
          apiKey: customApiKey,
        }
      );

      let parsed: { title: string; questions: any[] };
      try {
        parsed = JSON.parse(response);
      } catch {
        return NextResponse.json({ error: 'Failed to parse quiz response' }, { status: 500 });
      }

      const { data: quiz, error: insertError } = await supabase
        .from('quizzes')
        .insert({
          note_id: noteId,
          user_id: user.id,
          title: parsed.title || `${currentNote.title} Quiz`,
          questions: parsed.questions,
          difficulty,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Quiz insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save generated quiz' }, { status: 500 });
      }

      return NextResponse.json({ data: quiz });
    }

    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  } catch (error) {
    console.error('Syllabus generation route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
