'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NoteActions from './NoteActions';
import NoteContent from './NoteContent';
import RevisionPanel from './RevisionPanel';
import { 
  ArrowLeft, 
  CreditCard, 
  HelpCircle, 
  MessageSquare, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  key_concepts: any;
  created_at: string;
}

interface NoteClientContainerProps {
  note: Note;
  flashcardsCount: number;
  quizzesCount: number;
}

export default function NoteClientContainer({ note, flashcardsCount, quizzesCount }: NoteClientContainerProps) {
  const [showRevision, setShowRevision] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    if (note) {
      import('@/lib/offline-cache').then((cache) => {
        cache.saveOfflineNote({
          id: note.id,
          title: note.title,
          content: note.content,
          summary: note.summary || undefined,
          key_concepts: note.key_concepts,
          updated_at: new Date().toISOString()
        }).then(() => {
          setIsCached(true);
        });
      });
    }
  }, [note]);

  return (
    <div className={`mx-auto transition-all duration-300 ${showRevision ? 'max-w-7xl' : 'max-w-4xl'} animate-fade-in`}>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Main note content column */}
        <div className={`w-full transition-all duration-300 ${showRevision ? 'lg:w-[60%] shrink-0' : 'w-full'}`}>
          {/* Back button */}
          <Link href="/dashboard/notes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Notes
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-foreground">{note.title}</h1>
                {isCached && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-success/10 border border-success/20 text-success tracking-wide animate-scale-in">
                    ✓ Cached Offline
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{formatDate(note.created_at)}</p>
            </div>
            <NoteActions noteId={note.id} />
          </div>

          {/* Summary */}
          {note.summary && (
            <div className="glass rounded-xl p-4 border border-border mb-6"
              style={{ borderLeft: '3px solid hsl(var(--primary))' }}>
              <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
              <p className="text-sm leading-relaxed text-foreground/90">{note.summary}</p>
            </div>
          )}

          {/* Key concepts */}
          {note.key_concepts && note.key_concepts.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Key Concepts</p>
              <div className="flex flex-wrap gap-2">
                {(note.key_concepts as string[]).map((c: string) => (
                  <span key={c} className="px-3 py-1 rounded-full text-xs font-medium border border-border bg-muted text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action shortcuts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Link href={`/dashboard/flashcards?note_id=${note.id}`}
              className="glass rounded-xl p-3 border border-border hover:border-primary transition-all flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 shrink-0" style={{ color: 'hsl(38 92% 65%)' }} />
              <div className="flex flex-col text-left">
                <span className="font-bold text-[11px] sm:text-xs">Flashcards</span>
                <span className="text-[10px] text-muted-foreground">{flashcardsCount} items</span>
              </div>
            </Link>

            <Link href={`/dashboard/quiz?note_id=${note.id}`}
              className="glass rounded-xl p-3 border border-border hover:border-primary transition-all flex items-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(280 70% 65%)' }} />
              <div className="flex flex-col text-left">
                <span className="font-bold text-[11px] sm:text-xs">Quizzes</span>
                <span className="text-[10px] text-muted-foreground">{quizzesCount} items</span>
              </div>
            </Link>

            <Link href={`/dashboard/chat?note_id=${note.id}`}
              className="glass rounded-xl p-3 border border-border hover:border-primary transition-all flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <div className="flex flex-col text-left">
                <span className="font-bold text-[11px] sm:text-xs">AI Chat</span>
                <span className="text-[10px] text-muted-foreground">Q&A Assistant</span>
              </div>
            </Link>

            <button 
              onClick={() => setShowRevision(!showRevision)}
              className={`glass rounded-xl p-3 border hover:border-primary transition-all flex items-center gap-2 text-sm text-left cursor-pointer ${showRevision ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-yellow-400 animate-pulse-soft" />
              <div className="flex flex-col">
                <span className="font-bold text-[11px] sm:text-xs">Active Recall</span>
                <span className="text-[10px] text-muted-foreground">Revision Mode</span>
              </div>
            </button>
          </div>

          {/* Note content (markdown) */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Study Notes</span>
              </div>
              {!showRevision && (
                <button
                  onClick={() => setShowRevision(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Start active recall study session</span>
                </button>
              )}
            </div>
            <NoteContent content={note.content} />
          </div>
        </div>

        {/* Revision examiner sidebar/overlay panel */}
        {showRevision && (
          <>
            {/* Desktop Revision Panel - side-by-side sticky layout */}
            <div className="hidden lg:block lg:w-[40%] sticky top-6 h-[calc(100vh-140px)] shrink-0 animate-slide-in-right">
              <RevisionPanel noteId={note.id} onClose={() => setShowRevision(false)} />
            </div>

            {/* Mobile/Tablet Revision Panel - floating overlay */}
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="w-full max-h-[85vh] bg-card rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-bottom">
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-3 shrink-0" onClick={() => setShowRevision(false)} />
                <div className="flex-1 overflow-hidden h-[75vh]">
                  <RevisionPanel noteId={note.id} onClose={() => setShowRevision(false)} />
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
