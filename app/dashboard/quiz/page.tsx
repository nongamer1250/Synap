'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, Zap, RotateCcw } from 'lucide-react';
import type { Note, Quiz, QuizQuestion } from '@/types';

import { useDashboardCache } from '@/components/providers/DashboardCacheProvider';

type Phase = 'setup' | 'quiz' | 'results';

function checkIsCorrect(q: QuizQuestion, userAnsRaw: string): boolean {
  const userAns = (userAnsRaw || '').toLowerCase().trim();
  const correctAns = q.correct_answer.toLowerCase().trim();
  if (q.type === 'mcq') {
    return userAns === correctAns;
  }
  
  const cleanUser = userAns.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  const cleanCorrect = correctAns.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  
  if (cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
    return true;
  }
  
  const keywords = cleanCorrect.split(/\s+/).filter(w => w.length >= 3);
  return keywords.length > 0 && keywords.some(kw => cleanUser.includes(kw));
}

export default function QuizPage() {
  const searchParams = useSearchParams();
  const noteId = searchParams.get('note_id');

  const { notes, refreshNotes } = useDashboardCache();
  const [selectedNoteId, setSelectedNoteId] = useState<string>(noteId || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [score, setScore] = useState(0);

  // Silently revalidate in background on mount
  useEffect(() => {
    refreshNotes();
  }, []);

  const handleGenerate = async () => {
    if (!selectedNoteId) { toast.error('Select a note first'); return; }
    setGenerating(true);
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: selectedNoteId, difficulty, count: 8 }),
    });
    const data = await res.json();
    if (res.ok) {
      setQuiz(data.data);
      setAnswers({});
      setPhase('quiz');
    } else {
      toast.error(data.error || 'Failed to generate quiz');
    }
    setGenerating(false);
  };

  const handleSubmit = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q: QuizQuestion) => {
      if (checkIsCorrect(q, answers[q.id] || '')) {
        correct++;
      }
    });
    setScore(correct);
    setPhase('results');
  };

  const resetQuiz = () => {
    setPhase('setup');
    setQuiz(null);
    setAnswers({});
  };

  const diffColors: Record<string, string> = {
    easy: 'hsl(142 71% 65%)',
    medium: 'hsl(38 92% 65%)',
    hard: 'hsl(0 72% 65%)',
  };

  if (phase === 'results' && quiz) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="glass rounded-2xl p-8 border border-border text-center mb-6">
          <div className="text-6xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-4">
            You got <span className="font-bold text-foreground">{score}</span> out of{' '}
            <span className="font-bold text-foreground">{quiz.questions.length}</span> correct
          </p>
          <div className="text-5xl font-bold gradient-text mb-6">{pct}%</div>
          <div className="progress-bar mb-6">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <button onClick={resetQuiz}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>

        {/* Answer review */}
        <div className="space-y-3">
          {quiz.questions.map((q: QuizQuestion) => {
            const userAns = answers[q.id] || '';
            const isCorrect = checkIsCorrect(q, userAns);
            return (
              <div key={q.id} className={`glass rounded-xl p-4 border transition-all ${isCorrect ? 'border-success/30' : 'border-destructive/30'}`}>
                <div className="flex items-start gap-3">
                  {isCorrect
                    ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--success))' }} />
                    : <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--destructive))' }} />
                  }
                  <div>
                    <p className="font-medium text-sm">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ <span style={{ color: 'hsl(var(--success))' }}>{q.correct_answer}</span>
                    </p>
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && quiz) {
    return (
      <div className="max-w-2xl mx-auto animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">{quiz.questions.length} questions • {difficulty}</p>
          </div>
          <button onClick={resetQuiz} className="text-sm text-muted-foreground hover:text-foreground active-press p-1 rounded hover:bg-muted cursor-pointer transition-colors">
            ✕ Cancel
          </button>
        </div>

        <div className="space-y-5">
          {quiz.questions.map((q: QuizQuestion, idx: number) => (
            <div 
              key={q.id} 
              className={`glass rounded-2xl p-5 border border-border glass-hover animate-slide-up delay-${(idx % 4) + 1}`}
            >
              <p className="font-medium mb-4 text-foreground">
                <span className="text-muted-foreground text-sm mr-2">Q{idx + 1}.</span>
                {q.question}
              </p>

              {q.type === 'mcq' && q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt: string) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <label key={opt}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer active-press transition-all duration-300 ${
                          isSelected 
                            ? 'border-primary bg-primary/10 shadow-md shadow-primary/5 scale-[1.005]' 
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        }`}>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={isSelected}
                          onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                          isSelected ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full animate-scale-in" style={{ background: 'hsl(var(--primary))' }} />
                          )}
                        </div>
                        <span className={`text-sm transition-colors duration-300 ${isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Type your answer here…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-sm resize-none text-foreground"
                />
              )}
            </div>
          ))}
        </div>

        <button
          id="submit-quiz"
          onClick={handleSubmit}
          className="mt-6 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 glow-on-hover active-press cursor-pointer hover:shadow-lg hover:shadow-primary/25"
          style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
        >
          Submit Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-scale-in">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl font-bold">Generate Quiz</h1>
        <p className="text-muted-foreground mt-1">Test your knowledge with AI-generated questions</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-border space-y-5 animate-slide-up delay-1 glass-hover">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/95">Select Note</label>
          <select
            value={selectedNoteId}
            onChange={(e) => setSelectedNoteId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus-ring-glow focus:outline-none text-sm transition-all text-foreground"
          >
            <option value="">Choose a note…</option>
            {notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/95">Difficulty</label>
          <div className="flex gap-3">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all active-press cursor-pointer hover:scale-[1.01] ${
                  difficulty === d ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
                style={difficulty === d ? { background: diffColors[d], borderColor: diffColors[d], boxShadow: `0 0 12px ${diffColors[d]}40` } : {}}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          id="generate-quiz"
          onClick={handleGenerate}
          disabled={!selectedNoteId || generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50 transition-all duration-200 glow-on-hover active-press cursor-pointer hover:shadow-lg hover:shadow-primary/20"
          style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 animate-bounce-dot" />}
          {generating ? 'Generating Quiz…' : 'Generate Quiz'}
        </button>
      </div>
    </div>
  );
}
