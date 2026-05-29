'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, Loader2 } from 'lucide-react';

export default function ResetDataButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Are you absolutely sure you want to delete all your uploads, study notes, flashcards, quizzes, and chat history? This action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch('/api/reset-data', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset data');
      }

      toast.success('All dashboard data has been reset!');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to reset data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 active:bg-red-500/15 disabled:opacity-50 transition-all cursor-pointer shadow-sm duration-200"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      Reset My Data
    </button>
  );
}
