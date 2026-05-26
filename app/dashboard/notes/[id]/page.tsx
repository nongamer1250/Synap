import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NoteActions from '@/components/notes/NoteActions';
import NoteContent from '@/components/notes/NoteContent';
import { ArrowLeft, CreditCard, HelpCircle, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back button */}
      <Link href="/dashboard/notes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Notes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{note.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(note.created_at)}</p>
        </div>
        <NoteActions noteId={id} />
      </div>

      {/* Summary */}
      {note.summary && (
        <div className="glass rounded-xl p-4 border border-border mb-6"
          style={{ borderLeft: '3px solid hsl(var(--primary))' }}>
          <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
          <p className="text-sm leading-relaxed">{note.summary}</p>
        </div>
      )}

      {/* Key concepts */}
      {note.key_concepts && note.key_concepts.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Key Concepts</p>
          <div className="flex flex-wrap gap-2">
            {(note.key_concepts as string[]).map((c: string) => (
              <span key={c} className="px-3 py-1 rounded-full text-sm font-medium border border-border bg-muted">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action shortcuts */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link href={`/dashboard/flashcards?note_id=${id}`}
          className="glass rounded-xl p-3 border border-border hover:border-primary transition-all flex items-center gap-2 text-sm">
          <CreditCard className="w-4 h-4 shrink-0" style={{ color: 'hsl(38 92% 65%)' }} />
          <span>{flashcardsRes.count ?? 0} Flashcards</span>
        </Link>
        <Link href={`/dashboard/quiz?note_id=${id}`}
          className="glass rounded-xl p-3 border border-border hover:border-primary transition-all flex items-center gap-2 text-sm">
          <HelpCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(280 70% 65%)' }} />
          <span>{quizzesRes.count ?? 0} Quizzes</span>
        </Link>
        <Link href={`/dashboard/chat?note_id=${id}`}
          className="glass rounded-xl p-3 border border-border hover:border-primary transition-all flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
          <span>Chat with AI</span>
        </Link>
      </div>

      {/* Note content (markdown) */}
      <div className="glass rounded-2xl p-6 border border-border">
        <NoteContent content={note.content} />
      </div>
    </div>
  );
}
