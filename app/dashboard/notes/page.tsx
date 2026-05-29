import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';
import NotesFolderView from '@/components/notes/NotesFolderView';

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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer active-press"
          style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
        >
          <Plus className="w-4 h-4" />
          New Upload
        </Link>
      </div>

      {notes && notes.length > 0 ? (
        <NotesFolderView notes={notes} />
      ) : (
        <div className="glass rounded-2xl p-16 border border-border text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
          <p className="text-muted-foreground mb-6">Upload a lecture audio or PDF to generate your first study notes</p>
          <Link href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white active-press"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
            <Plus className="w-4 h-4" />
            Upload First Lecture
          </Link>
        </div>
      )}
    </div>
  );
}
