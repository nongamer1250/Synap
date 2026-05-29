'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, RotateCcw, Loader2, Zap, Brain, CheckCircle, Calendar, RefreshCw,
  Download, Copy
} from 'lucide-react';
import type { Flashcard, Note } from '@/types';

export default function FlashcardsPage() {
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get('note_id');

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(noteIdParam || '');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'due'>('all');
  const [reviewing, setReviewing] = useState(false);

  // Fetch all notes on mount
  useEffect(() => {
    fetch('/api/notes')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setNotes(d.data);
      });
  }, []);

  // Fetch flashcards for selected note
  const loadFlashcards = useCallback(async (nid: string) => {
    setLoading(true);
    setFlipped(false);
    setCurrentIndex(0);
    try {
      const res = await fetch(`/api/flashcards?note_id=${nid}`);
      const data = await res.json();
      const cards = data.data || [];
      setFlashcards(cards);
      
      // Save success response to local IndexedDB cache
      import('@/lib/offline-cache').then((cache) => {
        cache.saveOfflineDeck(nid, cards);
      });
    } catch (err) {
      console.error(err);
      // Attempt load from IndexedDB offline store on failure
      try {
        const cache = await import('@/lib/offline-cache');
        const cachedCards = await cache.getOfflineDeck(nid);
        if (cachedCards && cachedCards.length > 0) {
          setFlashcards(cachedCards);
          toast.success('Offline mode: Loaded deck from local cache! 🔌');
        } else {
          toast.error('Failed to load flashcards');
        }
      } catch (cacheErr) {
        console.error('IndexedDB fetch error:', cacheErr);
        toast.error('Failed to load flashcards');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedNoteId) {
      loadFlashcards(selectedNoteId);
    } else {
      setFlashcards([]);
    }
  }, [selectedNoteId, loadFlashcards]);

  // Generate new flashcards
  const handleGenerate = async () => {
    if (!selectedNoteId) {
      toast.error('Select a note first');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: selectedNoteId, count: 12 }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.data.length} new flashcards generated!`);
        await loadFlashcards(selectedNoteId);
      } else {
        toast.error(data.error || 'Failed to generate');
      }
    } catch {
      toast.error('Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  // Filter flashcards based on active tab
  const filteredCards = useMemo(() => {
    if (filterMode === 'all') return flashcards;
    const now = new Date();
    return flashcards.filter(
      (card) => !card.due_date || new Date(card.due_date) <= now
    );
  }, [flashcards, filterMode]);

  // Statistics
  const stats = useMemo(() => {
    const total = flashcards.length;
    const now = new Date();
    const due = flashcards.filter(
      (card) => !card.due_date || new Date(card.due_date) <= now
    ).length;
    const mastered = flashcards.filter(
      (card) => (card.ease_factor ?? 2.5) > 2.8 && (card.review_count ?? 0) > 3
    ).length;

    return { total, due, mastered };
  }, [flashcards]);

  // Automatic filter correction
  useEffect(() => {
    if (filteredCards.length === 0 && filterMode === 'due' && flashcards.length > 0) {
      setFilterMode('all');
    }
  }, [filteredCards.length, filterMode, flashcards.length]);

  // Key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCards.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setFlipped(false);
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setFlipped(false);
        setCurrentIndex((i) => Math.min(filteredCards.length - 1, i + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredCards.length]);

  const card = filteredCards[currentIndex];
  const progress = filteredCards.length > 0 ? ((currentIndex + 1) / filteredCards.length) * 100 : 0;

  const prev = () => {
    setFlipped(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  };
  const next = () => {
    setFlipped(false);
    setCurrentIndex((i) => Math.min(filteredCards.length - 1, i + 1));
  };

  // Spaced Repetition (SRS) Review handler
  const handleReview = async (rating: number) => {
    if (!card || reviewing) return;
    setReviewing(true);

    try {
      const res = await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcard_id: card.id, rating }),
      });
      const data = await res.json();

      if (res.ok) {
        // Show success indicator based on timing
        const nextInt = data.data.interval_days;
        const note = rating === 0 
          ? 'Card scheduled for immediate review!'
          : `Recall saved! Next review in ${nextInt} day${nextInt > 1 ? 's' : ''}.`;
        
        toast.success(note, { duration: 2500 });

        // Update local state with the newly updated card metrics
        setFlashcards((prevCards) =>
          prevCards.map((c) => (c.id === card.id ? { ...c, ...data.data } : c))
        );

        // Move to the next card or loop back
        setFlipped(false);
        if (currentIndex < filteredCards.length - 1) {
          setTimeout(() => setCurrentIndex((i) => i + 1), 250);
        } else if (filteredCards.length > 1) {
          setTimeout(() => setCurrentIndex(0), 250);
        }
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Connection failure');
    } finally {
      setReviewing(false);
    }
  };

  const handleExportQuizlet = () => {
    if (flashcards.length === 0) return;
    
    const content = flashcards.map(card => {
      const q = card.question.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const a = card.answer.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      return `${q}\t${a}`;
    }).join('\n');

    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success('Deck copied to clipboard! Paste it into Quizlet\'s Import page. 📋');
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  const handleExportAnki = () => {
    if (flashcards.length === 0) return;

    const content = flashcards.map(card => {
      const q = card.question.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const a = card.answer.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      return `${q}\t${a}`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const selectedNote = notes.find(n => n.id === selectedNoteId);
    const title = selectedNote ? selectedNote.title.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'deck';

    link.href = url;
    link.download = `synap-anki-${title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Anki import file downloaded! 🃏');
  };

  const diffColor: Record<string, string> = {
    easy: 'hsl(142 71% 65%)',
    medium: 'hsl(38 92% 65%)',
    hard: 'hsl(0 72% 65%)',
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground mt-1 text-sm">Practice active recall with SM-2 Spaced Repetition</p>
        </div>
        {selectedNoteId && flashcards.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 animate-scale-in">
            <button
              onClick={handleExportQuizlet}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer hover:border-primary active-press"
              title="Copy deck to clipboard for Quizlet import"
            >
              <Copy className="w-3.5 h-3.5 text-primary" />
              <span>Quizlet Export</span>
            </button>
            <button
              onClick={handleExportAnki}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer hover:border-primary active-press"
              title="Download deck as .txt file for Anki import"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Anki Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Note Selector & Generate */}
      <div className="flex gap-3 mb-6 animate-slide-up">
        <select
          value={selectedNoteId}
          onChange={(e) => setSelectedNoteId(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border focus-ring-glow focus:outline-none text-sm transition-all"
        >
          <option value="">Select a note…</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
        <button
          id="generate-flashcards"
          onClick={handleGenerate}
          disabled={!selectedNoteId || generating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-all active-press hover:shadow-md hover:shadow-primary/20 shrink-0 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 animate-bounce-dot" />}
          Generate
        </button>
      </div>

      {selectedNoteId && flashcards.length > 0 && (
        /* Spaced Repetition Stats Card */
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-xl p-3.5 border border-border glass-hover active-press animate-scale-in delay-1 flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-transform hover:scale-105">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Deck</p>
              <p className="text-lg font-bold">{stats.total} cards</p>
            </div>
          </div>
          <div className="glass rounded-xl p-3.5 border border-border glass-hover active-press animate-scale-in delay-2 flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Due for Review</p>
              <p className="text-lg font-bold">{stats.due} cards</p>
            </div>
          </div>
          <div className="glass rounded-xl p-3.5 border border-border glass-hover active-press animate-scale-in delay-3 flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Mastered</p>
              <p className="text-lg font-bold">{stats.mastered} cards</p>
            </div>
          </div>
        </div>
      )}

      {selectedNoteId && flashcards.length > 0 && (
        /* Filters */
        <div className="flex gap-2 mb-6 border-b border-border pb-3 shrink-0 animate-slide-up delay-2">
          <button
            onClick={() => {
              setFilterMode('all');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active-press cursor-pointer ${
              filterMode === 'all'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Cards ({stats.total})
          </button>
          <button
            onClick={() => {
              if (stats.due === 0) {
                toast.success("Awesome! You are all caught up for today! 🎉");
                return;
              }
              setFilterMode('due');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 active-press cursor-pointer ${
              filterMode === 'due'
                ? 'bg-orange-500/15 text-orange-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Due for Review ({stats.due})
            {stats.due > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping shrink-0" />
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCards.length > 0 ? (
        <>
          {/* Progress fill */}
          <div className="flex items-center gap-3 mb-4 shrink-0 animate-slide-up delay-3">
            <div className="progress-bar flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="progress-fill h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: filterMode === 'due' ? 'hsl(38 92% 65%)' : 'hsl(var(--primary))'
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentIndex + 1} / {filteredCards.length}
            </span>
          </div>

          {/* 3D Flashcard */}
          <div className="card-3d-container mb-6 relative" style={{ height: 350, borderRadius: 'var(--radius-lg)', transformStyle: 'preserve-3d' }}>
            <div
              className="card-3d w-full h-full cursor-pointer relative"
              style={{
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                transformStyle: 'preserve-3d'
              }}
              onClick={() => setFlipped((f) => !f)}
            >
              {/* Card Front face */}
              <div
                className="card-face bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center text-center absolute top-0 left-0 w-full h-full shadow-lg"
                style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)' }}
              >
                <div className="flex items-center gap-2 mb-4 absolute top-6">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider"
                    style={{
                      color: diffColor[card.difficulty],
                      borderColor: diffColor[card.difficulty] + '40',
                      background: diffColor[card.difficulty] + '15'
                    }}
                  >
                    {card.difficulty}
                  </span>
                  {card.review_count && card.review_count > 0 ? (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Reviewed {card.review_count}x
                    </span>
                  ) : (
                    <span className="text-[10px] text-primary/80 font-semibold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 animate-pulse-soft">
                      New Card
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold leading-relaxed text-foreground px-4 mt-4 select-none">
                  {card.question}
                </p>
                <p className="text-[10px] text-muted-foreground mt-8 absolute bottom-6 uppercase font-bold tracking-wider animate-pulse-soft">
                  Click card to reveal answer
                </p>
              </div>

              {/* Card Back face */}
              <div
                className="card-face bg-card rounded-2xl border p-8 flex flex-col items-center justify-center text-center absolute top-0 left-0 w-full h-full shadow-lg"
                style={{
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(1px)',
                  borderColor: 'hsl(255 85% 68% / 0.45)',
                  boxShadow: '0 0 20px hsl(255 85% 68% / 0.05)'
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider absolute top-6 text-primary">
                  Answer Model
                </p>
                <p className="text-base font-semibold leading-relaxed text-foreground px-4 overflow-y-auto max-h-[180px] select-none">
                  {card.answer}
                </p>
                <p className="text-[10px] text-muted-foreground mt-8 absolute bottom-6 uppercase font-bold tracking-wider">
                  Select your active recall rating below
                </p>
              </div>
            </div>
          </div>

          {/* Active Recall SM-2 buttons - ONLY visible when flipped! */}
          {flipped ? (
            <div className="grid grid-cols-4 gap-2 mb-6 animate-message-in">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReview(0);
                }}
                disabled={reviewing}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500 hover:scale-[1.03] active-press text-red-400 font-semibold transition-all text-xs cursor-pointer"
              >
                <span className="text-base mb-1">❌</span>
                <span>Again</span>
                <span className="text-[9px] font-normal text-red-400/70 mt-0.5">Soon</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReview(3);
                }}
                disabled={reviewing}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/15 hover:border-orange-500 hover:scale-[1.03] active-press text-orange-400 font-semibold transition-all text-xs cursor-pointer"
              >
                <span className="text-base mb-1">⏳</span>
                <span>Hard</span>
                <span className="text-[9px] font-normal text-orange-400/70 mt-0.5">1d</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReview(4);
                }}
                disabled={reviewing}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/15 hover:border-green-500 hover:scale-[1.03] active-press text-green-400 font-semibold transition-all text-xs cursor-pointer"
              >
                <span className="text-base mb-1">👍</span>
                <span>Good</span>
                <span className="text-[9px] font-normal text-green-400/70 mt-0.5">
                  {card.review_count && card.review_count > 1 ? 'Mult. Days' : '4d'}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReview(5);
                }}
                disabled={reviewing}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 hover:border-blue-500 hover:scale-[1.03] active-press text-blue-400 font-semibold transition-all text-xs cursor-pointer"
              >
                <span className="text-base mb-1">⚡</span>
                <span>Easy</span>
                <span className="text-[9px] font-normal text-blue-400/70 mt-0.5">
                  {card.review_count && card.review_count > 1 ? 'Ext. Days' : '6d'}
                </span>
              </button>
            </div>
          ) : (
            /* Carousel arrows - visible when card is unflipped */
            <div className="flex items-center justify-center gap-4 mb-6 animate-slide-up">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted active-press disabled:opacity-30 transition-all shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setFlipped(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted active-press transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={next}
                disabled={currentIndex === filteredCards.length - 1}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted active-press disabled:opacity-30 transition-all shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Keyboard help hint */}
          <p className="text-center text-[10px] text-muted-foreground">
            Press <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[9px] font-mono">Space</kbd> to flip,
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[9px] font-mono mx-1">←</kbd>
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-[9px] font-mono">→</kbd> to navigate
          </p>
        </>
      ) : (
        <div className="glass rounded-2xl p-16 border border-border text-center">
          <div className="text-5xl mb-4">🃏</div>
          <h2 className="text-xl font-bold mb-2">No flashcards matching active selection</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            {filterMode === 'due'
              ? 'Excellent! You reviewed all due cards for this note today!'
              : 'Select a note and click Generate to create flashcards.'}
          </p>
          {filterMode === 'due' && (
            <button
              onClick={() => setFilterMode('all')}
              className="px-4 py-2 rounded-xl font-semibold text-xs border border-border hover:bg-muted transition-all"
            >
              Review All Cards Instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
