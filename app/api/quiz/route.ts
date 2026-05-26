import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/llm';

export const maxDuration = 30;

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note_id, difficulty = 'medium', count = 8 } = await request.json();

    if (!note_id) {
      return NextResponse.json({ error: 'note_id is required' }, { status: 400 });
    }

    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('content, title')
      .eq('id', note_id)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const response = await complete(
      [
        { role: 'system', content: QUIZ_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a ${difficulty} difficulty quiz with ${count} questions from these notes titled "${note.title}":\n\n${note.content}`,
        },
      ],
      { temperature: 0.5, maxTokens: 2000, jsonMode: true }
    );

    let parsed: { title: string; questions: unknown[] };
    try {
      parsed = JSON.parse(response);
    } catch {
      return NextResponse.json({ error: 'Failed to parse quiz response' }, { status: 500 });
    }

    const { data: quiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        note_id,
        user_id: user.id,
        title: parsed.title || `${note.title} Quiz`,
        questions: parsed.questions,
        difficulty,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Quiz insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save quiz' }, { status: 500 });
    }

    return NextResponse.json({ data: quiz });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('note_id');

    let query = supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (noteId) {
      query = query.eq('note_id', noteId);
    }

    const { data: quizzes, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: quizzes });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}
