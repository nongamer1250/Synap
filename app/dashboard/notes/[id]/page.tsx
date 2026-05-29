import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NoteClientContainer from '@/components/notes/NoteClientContainer';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !note) {
    notFound();
  }

  // Fetch related counts
  const [flashcardsRes, quizzesRes] = await Promise.all([
    supabase.from('flashcards').select('id', { count: 'exact' }).eq('note_id', id),
    supabase.from('quizzes').select('id', { count: 'exact' }).eq('note_id', id),
  ]);

  return (
    <NoteClientContainer
      note={note}
      flashcardsCount={flashcardsRes.count ?? 0}
      quizzesCount={quizzesRes.count ?? 0}
    />
  );
}

