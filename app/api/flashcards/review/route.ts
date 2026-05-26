import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Flashcard active recall review endpoint.
 * Implements the SuperMemo-2 (SM-2) Spaced Repetition Algorithm.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flashcard_id, rating } = await request.json();

    if (!flashcard_id || rating === undefined || rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: 'flashcard_id and recall rating (0-5) are required' },
        { status: 400 }
      );
    }

    // Fetch the active flashcard
    const { data: card, error: cardError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', flashcard_id)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    // Load defaults if they do not exist
    let easeFactor = card.ease_factor ?? 2.5;
    let intervalDays = card.interval_days ?? 1;
    let reviewCount = card.review_count ?? 0;

    if (rating < 3) {
      // Recall failed: reset consecutive reviews and set interval to 1 day
      reviewCount = 0;
      intervalDays = 1;
    } else {
      // Recall succeeded: calculate new interval days
      if (reviewCount === 0) {
        intervalDays = 1;
      } else if (reviewCount === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      reviewCount += 1;
    }

    // Update Ease Factor (EF) according to SM-2 formula
    easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    // Set new due date (now + intervalDays)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + intervalDays);

    // Save updated values to database
    const { data: updatedCard, error: updateError } = await supabase
      .from('flashcards')
      .update({
        ease_factor: easeFactor,
        interval_days: intervalDays,
        review_count: reviewCount,
        due_date: dueDate.toISOString(),
      })
      .eq('id', flashcard_id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update flashcard review stats:', updateError);
      return NextResponse.json({ error: 'Failed to save review stats' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedCard });
  } catch (error) {
    console.error('Flashcard review error:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
