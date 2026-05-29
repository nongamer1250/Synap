'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, FileText, Play, Brain, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';

export default function InteractiveShowcase() {
  const [step, setStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [fileType, setFileType] = useState<'pdf' | 'youtube'>('pdf');
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz'>('notes');
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  // Simulation effect
  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('success'), 600);
            return 100;
          }
          return prev + 8;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleStartSimulation = (type: 'pdf' | 'youtube') => {
    setFileType(type);
    setProgress(0);
    setStep('processing');
  };

  const handleReset = () => {
    setStep('idle');
    setProgress(0);
    setQuizAnswer(null);
    setFlashcardFlipped(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto relative group reveal-scale">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-accent/15 rounded-3xl blur-3xl opacity-60 group-hover:opacity-85 transition-all duration-500 pointer-events-none" />

      {/* Main glass box */}
      <div className="relative glass border border-border/80 rounded-3xl overflow-hidden shadow-2xl p-6 min-h-[460px] flex flex-col justify-between">
        
        {/* Top bar control / header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive/80" />
            <span className="w-3 h-3 rounded-full bg-warning/80" />
            <span className="w-3 h-3 rounded-full bg-success/80" />
            <span className="text-xs text-muted-foreground ml-2 font-mono">SynapStudio_Sandbox.ts</span>
          </div>
          
          {step !== 'idle' && (
            <button
              onClick={handleReset}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-muted/60 hover:bg-secondary transition active-press cursor-pointer"
            >
              🔄 Reset Demo
            </button>
          )}
        </div>

        {/* ── SCREEN 1: IDLE / START UPLOAD ─────────────────── */}
        {step === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-8 animate-scale-in">
            <div className="text-center max-w-md space-y-2">
              <h3 className="text-lg font-bold text-foreground">Try the Synap AI Engine</h3>
              <p className="text-xs text-muted-foreground">
                Select an input type below to simulate how Synap processes and outputs study materials in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              
              {/* Option A: PDF Upload */}
              <div
                onClick={() => handleStartSimulation('pdf')}
                className="glass-hover border border-border/80 bg-card/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UploadCloud className="w-6 h-6 animate-pulse-soft" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Drop Lecture PDF</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">Upload slides, syllabi, or textbook chapters</p>
                </div>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  Simulate PDF
                </span>
              </div>

              {/* Option B: YouTube URL */}
              <div
                onClick={() => handleStartSimulation('youtube')}
                className="glass-hover border border-border/80 bg-card/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Play className="w-6 h-6 animate-pulse-soft" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Paste YouTube Link</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">Transcribe lectures, tutorials, or crash courses</p>
                </div>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                  Simulate YouTube
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ── SCREEN 2: PROCESSING / LOAD SCREEN ────────────── */}
        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-6 animate-scale-in">
            <div className="relative">
              {/* Circular processing spinner */}
              <div className="w-20 h-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xl">
                ⚡
              </div>
            </div>

            <div className="text-center space-y-3 w-full max-w-sm">
              <h4 className="text-sm font-bold text-foreground">
                {fileType === 'pdf' ? 'Extracting PDF & Segmenting...' : 'Fetching Subtitles & Transcribing...'}
              </h4>
              
              {/* Progress bar */}
              <div className="w-full bg-muted border border-border/60 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-150" 
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Staggered process checkmarks */}
              <div className="flex flex-col items-start gap-2 pt-4 px-8 text-xs text-muted-foreground/80 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Initialized Synap API Engine
                </div>
                <div className="flex items-center gap-2">
                  {progress > 30 ? <span className="text-green-400">✓</span> : <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />} 
                  {fileType === 'pdf' ? 'Extracted text characters' : 'Whisper speech model loaded'}
                </div>
                <div className="flex items-center gap-2">
                  {progress > 65 ? <span className="text-green-400">✓</span> : <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />} 
                  Created 5 logical course segments
                </div>
                <div className="flex items-center gap-2">
                  {progress >= 95 ? <span className="text-green-400">✓</span> : <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />} 
                  Running parallel LLM note consolidation
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SCREEN 3: SUCCESS / INTERACTIVE RESULTS ──────── */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col justify-between animate-scale-in">
            {/* Tabs Selector */}
            <div className="flex gap-2 mb-6 border-b border-border/20 pb-4">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition active-press cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-primary/10 border border-primary/30 text-primary'
                    : 'border border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Study Notes
              </button>

              <button
                onClick={() => setActiveTab('flashcards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition active-press cursor-pointer ${
                  activeTab === 'flashcards'
                    ? 'bg-accent/10 border border-accent/30 text-accent'
                    : 'border border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                Flashcards
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition active-press cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-success/10 border border-success/30 text-success'
                    : 'border border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Practice Quiz
              </button>
            </div>

            {/* TAB VIEWPORTS */}
            <div className="flex-grow flex items-center justify-center py-2 min-h-[220px]">
              
              {/* Tab A: Notes */}
              {activeTab === 'notes' && (
                <div className="w-full text-left rounded-xl border border-border bg-card/40 p-5 space-y-4 animate-scale-in">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm">## CS50: Python Memory Management</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                      Section 1 of 4
                    </span>
                  </div>
                  <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                    <p>
                      In Python, **memory management** is automated by the runtime system. Python uses a private heap containing all objects and data structures.
                    </p>
                    <p>
                      The **Garbage Collector (GC)** monitors the reference counts of objects. When an object's reference count drops to <code>0</code>, its memory is instantly deallocated:
                    </p>
                    <pre className="bg-muted border border-border/60 p-3 rounded-lg text-[10px] text-primary/95 font-mono overflow-x-auto">
                      import sys{"\n"}
                      x = [1, 2, 3] # count is 1{"\n"}
                      y = x         # count is 2{"\n"}
                      print(sys.getrefcount(x) - 1)
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab B: Flashcard */}
              {activeTab === 'flashcards' && (
                <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-scale-in">
                  <div 
                    onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                    className="w-full h-40 card-3d-container cursor-pointer select-none"
                  >
                    <div className={`w-full h-full card-3d ${flashcardFlipped ? 'flipped' : ''}`}>
                      
                      {/* Front face */}
                      <div className="card-face card-front rounded-2xl border border-border bg-card/85 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-xl">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                          Question Card — Click to Flip
                        </span>
                        <p className="text-sm font-bold leading-relaxed px-4">
                          What is the main algorithm used in Python's garbage collection?
                        </p>
                        <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                          🔄 Click to reveal answer
                        </span>
                      </div>

                      {/* Back face */}
                      <div className="card-face card-back rounded-2xl border border-accent/40 bg-card/85 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-xl">
                        <span className="text-[9px] uppercase tracking-widest text-accent font-semibold">
                          Autogenerated Answer
                        </span>
                        <p className="text-sm font-semibold leading-relaxed text-foreground px-4">
                          **Reference Counting** (with a cyclic garbage collector to detect circular reference chains).
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          💡 Spaced Repetition Activated
                        </span>
                      </div>

                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFlashcardFlipped(!flashcardFlipped)} className="text-[10px] font-semibold bg-muted hover:bg-secondary border border-border px-3 py-1.5 rounded-lg active-press transition cursor-pointer">
                      Flip Card
                    </button>
                  </div>
                </div>
              )}

              {/* Tab C: Quiz */}
              {activeTab === 'quiz' && (
                <div className="w-full max-w-md text-left rounded-xl border border-border bg-card/40 p-5 space-y-4 animate-scale-in">
                  <div className="space-y-1 text-center border-b border-border/20 pb-3">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Self-Test Practice Quiz
                    </span>
                    <h4 className="text-sm font-bold">What happens when an object's reference count falls to 0 in Python?</h4>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 text-xs">
                    
                    <button
                      onClick={() => setQuizAnswer(0)}
                      className={`w-full py-2.5 px-4 rounded-xl border text-left transition active-press cursor-pointer flex justify-between items-center ${
                        quizAnswer === 0
                          ? 'bg-success/15 border-success/40 text-success font-semibold'
                          : 'border-border/60 hover:bg-muted bg-card/20'
                      }`}
                    >
                      <span>A) It remains active in memory until the program terminates.</span>
                      {quizAnswer === 0 && <span className="text-xs font-mono">✓ Correct</span>}
                    </button>

                    <button
                      onClick={() => setQuizAnswer(1)}
                      className={`w-full py-2.5 px-4 rounded-xl border text-left transition active-press cursor-pointer flex justify-between items-center ${
                        quizAnswer === 1
                          ? 'bg-destructive/15 border-destructive/40 text-destructive font-semibold'
                          : 'border-border/60 hover:bg-muted bg-card/20'
                      }`}
                    >
                      <span>B) It triggers a server-side syntax error immediately.</span>
                      {quizAnswer === 1 && <span className="text-xs font-mono">✗ Wrong</span>}
                    </button>

                    <button
                      onClick={() => setQuizAnswer(2)}
                      className={`w-full py-2.5 px-4 rounded-xl border text-left transition active-press cursor-pointer flex justify-between items-center ${
                        quizAnswer === 2
                          ? 'bg-destructive/15 border-destructive/40 text-destructive font-semibold'
                          : 'border-border/60 hover:bg-muted bg-card/20'
                      }`}
                    >
                      <span>C) It is compiled dynamically into a C-extension module.</span>
                      {quizAnswer === 2 && <span className="text-xs font-mono">✗ Wrong</span>}
                    </button>

                  </div>

                  {quizAnswer !== null && (
                    <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60 animate-scale-in">
                      💡 **Explanation:** Reference counting counts how many pointers refer to an object. When it drops to zero, the object is immediately swept from the memory heap, freeing storage.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
