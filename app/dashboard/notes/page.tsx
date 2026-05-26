import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { FileText, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Notes</h1>
          <p className="text-muted-foreground mt-1">{notes?.length ?? 0} note{notes?.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
        >
          <Plus className="w-4 h-4" />
          New Upload
        </Link>
      </div>

      {notes && notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/dashboard/notes/${note.id}`}
              className="glass rounded-2xl p-5 border border-border hover:border-primary transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(255 85% 68% / 0.12)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold group-hover:text-primary transition-colors">{note.title}</h2>
                  {note.summary && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.summary}</p>
                  )}
                  {note.key_concepts && note.key_concepts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(note.key_concepts as string[]).slice(0, 4).map((c: string) => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border">
                          {c}
                        </span>
                      ))}
                      {note.key_concepts.length > 4 && (
                        <span className="px-2 py-0.5 rounded-full text-xs text-muted-foreground">
                          +{note.key_concepts.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(note.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-16 border border-border text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
          <p className="text-muted-foreground mb-6">Upload a lecture audio or PDF to generate your first study notes</p>
          <Link href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
            <Plus className="w-4 h-4" />
            Upload First Lecture
          </Link>
        </div>
      )}
    </div>
  );
}
