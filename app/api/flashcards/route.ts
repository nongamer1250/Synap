import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/llm';

export const maxDuration = 30;

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note_id, count = 10 } = await request.json();

    if (!note_id) {
      return NextResponse.json({ error: 'note_id is required' }, { status: 400 });
    }

    // Fetch the note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('content, title')
      .eq('id', note_id)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Generate flashcards
    const response = await complete(
      [
        { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create ${count} flashcards from these study notes titled "${note.title}":\n\n${note.content}`,
        },
      ],
      { temperature: 0.6, maxTokens: 1500, jsonMode: true }
    );

    let cards: Array<{ question: string; answer: string; difficulty: string }>;

    try {
      const parsed = JSON.parse(response);
      // Handle both { flashcards: [...] } and [...] shapes
      cards = Array.isArray(parsed) ? parsed : parsed.flashcards ?? [];
    } catch {
      return NextResponse.json({ error: 'Failed to parse flashcard response' }, { status: 500 });
    }

    // Insert all flashcards
    const { data: flashcards, error: insertError } = await supabase
      .from('flashcards')
      .insert(
        cards.map((card) => ({
          note_id,
          user_id: user.id,
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty || 'medium',
        }))
      )
      .select();

    if (insertError) {
      console.error('Flashcard insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save flashcards' }, { status: 500 });
    }

    return NextResponse.json({ data: flashcards });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 });
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
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (noteId) {
      query = query.eq('note_id', noteId);
    }

    const { data: flashcards, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: flashcards });
  } catch (error) {
    console.error('Flashcards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }
}
