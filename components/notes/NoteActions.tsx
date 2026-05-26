'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, Loader2 } from 'lucide-react';

export default function NoteActions({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this note? This will also remove its flashcards, quizzes, and chat history.')) return;

    setDeleting(true);
    const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });

    if (res.ok) {
      toast.success('Note deleted');
      router.push('/dashboard/notes');
    } else {
      toast.error('Failed to delete note');
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete
    </button>
  );
}
