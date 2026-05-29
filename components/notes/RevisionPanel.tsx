'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface RevisionPanelProps {
  noteId: string;
  onClose: () => void;
}

interface HistoryItem {
  question: string;
  answer: string;
  grade: 'Correct' | 'Partial' | 'Incorrect';
  feedback: string;
}

export default function RevisionPanel({ noteId, onClose }: RevisionPanelProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'graded' | 'finished'>('idle');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<'Correct' | 'Partial' | 'Incorrect' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [nextQuestionText, setNextQuestionText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics
  const [correctCount, setCorrectCount] = useState(0);

  const startSession = async () => {
    try {
      setStatus('loading');
      setHistory([]);
      setCorrectCount(0);
      setAnswer('');
      setGrade(null);
      setFeedback('');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const savedKey = localStorage.getItem('user_groq_api_key');
      if (savedKey) {
        headers['x-groq-api-key'] = savedKey;
      }

      const res = await fetch('/api/notes/revision', {
        method: 'POST',
        headers,
        body: JSON.stringify({ note_id: noteId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start revision session');

      setQuestion(json.data.question);
      setStatus('active');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not start revision session');
      setStatus('idle');
    }
  };

  useEffect(() => {
    startSession();
  }, [noteId]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const savedKey = localStorage.getItem('user_groq_api_key');
      if (savedKey) {
        headers['x-groq-api-key'] = savedKey;
      }

      const res = await fetch('/api/notes/revision', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          note_id: noteId,
          latest_answer: answer,
          last_question: question,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to evaluate answer');

      const evaluation = json.data;
      setGrade(evaluation.grade);
      setFeedback(evaluation.feedback);
      setNextQuestionText(evaluation.next_question);

      if (evaluation.grade === 'Correct') {
        setCorrectCount((prev) => prev + 1);
        toast.success('Excellent answer! 🌟');
      } else if (evaluation.grade === 'Partial') {
        toast.success('Good effort! Check feedback to see what you missed.');
      } else {
        toast.error('Not quite right. Review the feedback to learn!');
      }

      setStatus('graded');

      // Update study streak on first revision action
      try {
        const { updateStudyStreak } = await import('@/lib/streak');
        const { streak, updated } = await updateStudyStreak();
        if (updated) {
          toast.success(`Study streak updated! 🔥 ${streak} days!`);
        }
      } catch (streakErr) {
        console.error(streakErr);
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not evaluate answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    // Add current to history
    if (grade) {
      setHistory((prev) => [
        ...prev,
        {
          question,
          answer,
          grade,
          feedback,
        },
      ]);
    }

    // Load next question
    setQuestion(nextQuestionText);
    setAnswer('');
    setGrade(null);
    setFeedback('');
    setStatus('active');
  };

  const handleFinishSession = () => {
    if (grade) {
      setHistory((prev) => [
        ...prev,
        {
          question,
          answer,
          grade,
          feedback,
        },
      ]);
    }
    setStatus('finished');
  };

  const getGradeIcon = (g: HistoryItem['grade']) => {
    if (g === 'Correct') return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
    if (g === 'Partial') return <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />;
    return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  };

  const getGradeClass = (g: HistoryItem['grade']) => {
    if (g === 'Correct') return 'border-green-500/20 bg-green-500/5 text-green-400';
    if (g === 'Partial') return 'border-orange-500/20 bg-orange-500/5 text-orange-400';
    return 'border-red-500/20 bg-red-500/5 text-red-400';
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden shadow-2xl relative">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Active Recall Examiner</h3>
            <p className="text-[10px] text-muted-foreground">Test your understanding with real-time grading</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewport content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Loading state */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Generating recall questions…</p>
          </div>
        )}

        {/* Idle/Error state */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <p className="text-xs text-muted-foreground max-w-xs">Failed to initialize the examiner session.</p>
            <button onClick={startSession} className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white cursor-pointer active-press">
              Try Again
            </button>
          </div>
        )}

        {/* Active Question Panel */}
        {(status === 'active' || status === 'graded') && (
          <div className="space-y-4 animate-scale-in">
            {/* Question display */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4.5 space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Question {history.length + 1}</span>
              <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed">
                {question}
              </p>
            </div>

            {/* Answer Input or Evaluated feedback */}
            {status === 'active' ? (
              <form onSubmit={handleSubmitAnswer} className="space-y-3">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your explanation here. Be detailed to earn a 'Correct' grade!"
                  rows={4}
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-muted border border-border focus-ring-glow focus:outline-none resize-none leading-relaxed text-foreground"
                  disabled={isSubmitting}
                  required
                />
                <div className="flex justify-between items-center gap-4">
                  <button
                    type="button"
                    onClick={handleFinishSession}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Finish Revision
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !answer.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Graded result display */
              <div className="space-y-4 animate-scale-in">
                {/* Grade bubble */}
                <div className={`border rounded-xl p-4 space-y-2 ${getGradeClass(grade!)}`}>
                  <div className="flex items-center gap-2">
                    {grade === 'Correct' ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : grade === 'Partial' ? (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 shrink-0" />
                    )}
                    <span className="font-bold text-sm">Evaluation: {grade}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {feedback}
                  </p>
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    onClick={handleFinishSession}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Finish & View Score
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press hover:shadow-md"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finished / Score summary view */}
        {status === 'finished' && (
          <div className="space-y-6 animate-scale-in py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <TrendingUp className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-base font-bold">Revision Complete!</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Active recall testing completed. You correctly answered **{correctCount}** out of **{history.length}** questions.
              </p>
            </div>

            {/* Score circle */}
            <div className="inline-flex flex-col items-center justify-center p-6 bg-muted/40 border border-border/40 rounded-full min-w-[120px]">
              <span className="text-3xl font-black text-primary">
                {history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0}%
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wide">Accuracy</span>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={startSession}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-border text-foreground hover:bg-muted cursor-pointer active-press"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Session</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press"
              >
                Close Examiner
              </button>
            </div>
          </div>
        )}

        {/* Scrollable history review of past questions/answers */}
        {history.length > 0 && (
          <div className="space-y-3 border-t border-border/40 pt-5">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Session Review ({history.length} answers)</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border/60 p-3 space-y-2 text-xs bg-muted/10">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-bold text-foreground truncate max-w-[200px]">Q{idx + 1}: {item.question}</span>
                    <div className="flex items-center gap-1 text-[10px] font-semibold">
                      {getGradeIcon(item.grade)}
                      <span className={item.grade === 'Correct' ? 'text-green-400' : item.grade === 'Partial' ? 'text-orange-400' : 'text-red-400'}>
                        {item.grade}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed italic pl-1 border-l border-border">
                    " {item.answer} "
                  </p>
                  <p className="text-muted-foreground text-[10px] leading-normal pt-1 pl-1">
                    💡 **Feedback:** {item.feedback}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
