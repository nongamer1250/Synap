'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  HelpCircle,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Syllabus, SyllabusTopic } from '@/types';

interface ExamPrepWorkspaceProps {
  syllabus: Syllabus;
  topics: SyllabusTopic[];
}

interface PredictedQuestion {
  id: number;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  concepts: string[];
  answer: string;
}

export default function ExamPrepWorkspace({ syllabus, topics }: ExamPrepWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'predictor' | 'revision' | 'cheatsheet'>('predictor');
  
  // Predictor State
  const [predictions, setPredictions] = useState<PredictedQuestion[]>([]);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Spaced Revision State
  const [revisionDays, setRevisionDays] = useState<Record<string, boolean>>({});

  // Cheat Sheet State
  const [cheatSheet, setCheatSheet] = useState<string>('');
  const [loadingCheatSheet, setLoadingCheatSheet] = useState(false);

  // Initialize/Load saved states from localStorage
  useEffect(() => {
    if (syllabus?.id) {
      // Load saved Spaced Revision Calendar checkmarks
      const savedRevision = localStorage.getItem(`synap_spaced_revision_${syllabus.id}`);
      if (savedRevision) {
        try {
          setRevisionDays(JSON.parse(savedRevision));
        } catch (e) {
          console.error('Failed to parse revision calendar state', e);
        }
      }

      // Load saved AI Predictions
      const savedPredictions = localStorage.getItem(`synap_ai_predictions_${syllabus.id}`);
      if (savedPredictions) {
        try {
          setPredictions(JSON.parse(savedPredictions));
        } catch (e) {
          console.error('Failed to parse saved predictions', e);
        }
      }

      // Load saved Cheat Sheet
      const savedCheatSheet = localStorage.getItem(`synap_cheat_sheet_${syllabus.id}`);
      if (savedCheatSheet) {
        setCheatSheet(savedCheatSheet);
      }
    }
  }, [syllabus?.id]);

  // Handle Spaced Revision Day toggle
  const toggleRevisionDay = (dayKey: string) => {
    const updated = {
      ...revisionDays,
      [dayKey]: !revisionDays[dayKey]
    };
    setRevisionDays(updated);
    if (syllabus?.id) {
      localStorage.setItem(`synap_spaced_revision_${syllabus.id}`, JSON.stringify(updated));
    }
    toast.success(`${dayKey.replace('_', ' ').toUpperCase()} status updated!`);
  };

  // Call `/api/syllabus/predict`
  const handleGeneratePredictions = async () => {
    try {
      setLoadingPredict(true);
      const res = await fetch('/api/syllabus/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusTitle: syllabus.title,
          topics: topics.map(t => ({ title: t.title, description: t.description }))
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to predict exam questions');

      const data = json.data || [];
      setPredictions(data);
      if (syllabus?.id) {
        localStorage.setItem(`synap_ai_predictions_${syllabus.id}`, JSON.stringify(data));
      }
      toast.success('Generated Top 10 predicted exam questions!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not predict questions');
    } finally {
      setLoadingPredict(false);
    }
  };

  // Call `/api/syllabus/cheatsheet`
  const handleGenerateCheatSheet = async () => {
    try {
      setLoadingCheatSheet(true);
      const res = await fetch('/api/syllabus/cheatsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusTitle: syllabus.title,
          topics: topics.map(t => ({ title: t.title, description: t.description }))
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to compile cheatsheet');

      const data = json.data || '';
      setCheatSheet(data);
      if (syllabus?.id) {
        localStorage.setItem(`synap_cheat_sheet_${syllabus.id}`, data);
      }
      toast.success('Last-Minute Cheat Sheet generated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not generate cheatsheet');
    } finally {
      setLoadingCheatSheet(false);
    }
  };

  // Basic custom markdown-to-JSX compiler to avoid dependency issues
  const renderMarkdown = (mdText: string) => {
    if (!mdText) return null;
    const lines = mdText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // H1 Header
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl font-black text-foreground mt-6 mb-3 border-b border-border/40 pb-2">
            {trimmed.slice(2)}
          </h1>
        );
      }
      // H2 Header
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-extrabold text-foreground mt-5 mb-2.5">
            {trimmed.slice(3)}
          </h2>
        );
      }
      // H3 Header
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-md font-bold text-foreground mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      }
      // Bold items in bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.slice(2);
        // Look for **bold** format
        const parts = content.split('**');
        return (
          <li key={idx} className="text-xs text-muted-foreground list-disc ml-5 mb-1.5 leading-relaxed">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-foreground font-bold">{part}</strong> : part)}
          </li>
        );
      }
      // Numbered Lists
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, '');
        const parts = content.split('**');
        return (
          <li key={idx} className="text-xs text-muted-foreground list-decimal ml-5 mb-1.5 leading-relaxed">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-foreground font-bold">{part}</strong> : part)}
          </li>
        );
      }
      // Empty Line
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      // Standard Paragraph Text
      const parts = trimmed.split('**');
      return (
        <p key={idx} className="text-xs text-muted-foreground leading-relaxed mb-2">
          {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-foreground font-bold">{part}</strong> : part)}
        </p>
      );
    });
  };

  // Calculate study intervals relative to exam date
  const getSpacedIntervals = () => {
    if (!syllabus.exam_date) return null;
    const examDate = new Date(syllabus.exam_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const intervals = [
      { key: 'day_1', name: 'Day 1: Initial Recall', desc: 'Focus on high-yield term definitions and basic layouts.' },
      { key: 'day_3', name: 'Day 3: Deep Mastery', desc: 'Generate quizzes and review key structural steps.' },
      { key: 'day_7', name: 'Day 7: Active Spacing', desc: 'Review flashcards and close missing knowledge gaps.' },
      { key: 'day_14', name: 'Day 14: Mock Assessment', desc: 'Attempt custom mock papers under exam conditions.' },
      { key: 'day_30', name: 'Day 30: Final Polishing', desc: 'Quick overview of last-minute formulas & high-yield cheat sheets.' }
    ];

    return intervals.map(interval => {
      // Show checkmark state
      const isChecked = revisionDays[interval.key] || false;
      return {
        ...interval,
        isChecked
      };
    });
  };

  const spacedRoadmap = getSpacedIntervals();

  return (
    <div className="glass rounded-3xl border border-border bg-card/60 backdrop-blur-md p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Visual background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" />
            <span>AI Exam Prep Workspace</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Gamified exam forecasting, active recall schedules, and hyper-condensed cheat sheets.
          </p>
        </div>

        {/* Workspace Switcher Tabs */}
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('predictor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'predictor'
                ? 'bg-card text-primary shadow-sm border border-border/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🎯 Predictor
          </button>
          <button
            onClick={() => setActiveSubTab('revision')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'revision'
                ? 'bg-card text-primary shadow-sm border border-border/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📅 Spaced Revision
          </button>
          <button
            onClick={() => setActiveSubTab('cheatsheet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'cheatsheet'
                ? 'bg-card text-primary shadow-sm border border-border/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ⚡ Cheat Sheet
          </button>
        </div>
      </div>

      {/* Render Tab Contents */}
      
      {/* 1. AI EXAM PREDICTOR */}
      {activeSubTab === 'predictor' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-border/40">
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Top 10 Predicted Exam Questions</h3>
              <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                Our model maps your curriculum outline and generates mock exam questions complete with academic evaluation matrices.
              </p>
            </div>
            <button
              onClick={handleGeneratePredictions}
              disabled={loadingPredict}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/95 flex items-center justify-center gap-2 active-press transition-all shrink-0 cursor-pointer self-start sm:self-auto"
            >
              {loadingPredict ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Syllabus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{predictions.length > 0 ? 'Regenerate Questions' : 'Predict Questions'}</span>
                </>
              )}
            </button>
          </div>

          {predictions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border bg-card/40 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm">No Forecasted Questions Yet</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Click the predict button above to generate 10 university-grade exam questions for this subject.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {predictions.map((q) => {
                const isExpanded = expandedQuestion === q.id;
                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border transition-all duration-200 bg-card overflow-hidden ${
                      isExpanded
                        ? 'border-primary/70 shadow-md shadow-primary/5 bg-primary/[0.01]'
                        : 'border-border hover:border-primary/40 hover:bg-muted/10'
                    }`}
                  >
                    <div
                      onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                      className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-5 h-5 rounded bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs">
                            {q.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              q.difficulty === 'Hard'
                                ? 'bg-red-500/15 border-red-500/30 text-red-500'
                                : q.difficulty === 'Medium'
                                ? 'bg-orange-500/15 border-orange-500/30 text-orange-500'
                                : 'bg-success/15 border-success/30 text-success'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          {q.concepts.map((concept, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border/50"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-normal pr-4">
                          {q.question}
                        </h4>
                      </div>
                      <div className="shrink-0 mt-0.5 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border/40 p-5 bg-muted/10 space-y-3.5 animate-slide-down">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider block">
                            🎓 Exemplary Evaluator Model Answer:
                          </span>
                          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line text-justify bg-card p-4 rounded-xl border border-border/60">
                            {q.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. SPACED REVISION CALENDAR */}
      {activeSubTab === 'revision' && (
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-2">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Cognitive Recall Roadmap</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We structure your subject mastery using a **1-3-7-14 Spacing Frequency**. Check off each active recall checkpoint to confirm neural retention.
            </p>
          </div>

          {!spacedRoadmap ? (
            <div className="text-center py-10 border border-dashed border-border bg-card/40 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm">Exam Date Required</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Please set your target exam date in the syllabus header page to map out the countdown intervals!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spacedRoadmap.map((day) => (
                <div
                  key={day.key}
                  onClick={() => toggleRevisionDay(day.key)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-start justify-between gap-4 relative overflow-hidden ${
                    day.isChecked
                      ? 'border-success/60 bg-success/[0.02] shadow-sm'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/5'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          day.isChecked ? 'bg-success animate-pulse-soft' : 'bg-primary'
                        }`}
                      />
                      <h4 className={`font-bold text-sm ${day.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {day.name}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pr-2">
                      {day.desc}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        day.isChecked
                          ? 'border-success bg-success text-white'
                          : 'border-border bg-muted/30 text-transparent'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. LAST-MINUTE CHEAT SHEET */}
      {activeSubTab === 'cheatsheet' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-border/40">
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Hyper-Condensed Revision Sheet</h3>
              <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                Generates a single, compact page of the top 20 facts, formulas, and critical terminology for quick recall.
              </p>
            </div>
            <button
              onClick={handleGenerateCheatSheet}
              disabled={loadingCheatSheet}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/95 flex items-center justify-center gap-2 active-press transition-all shrink-0 cursor-pointer self-start sm:self-auto"
            >
              {loadingCheatSheet ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compiling Sheet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{cheatSheet ? 'Regenerate Cheat Sheet' : 'Compile Cheat Sheet'}</span>
                </>
              )}
            </button>
          </div>

          {!cheatSheet ? (
            <div className="text-center py-12 border border-dashed border-border bg-card/40 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm">No Cheat Sheet Generated</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Click the compile button to digest all study material topics into a high-yield formulaic summary.
                </p>
              </div>
            </div>
          ) : (
            <div className="glass bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar animate-fade-in relative">
              {/* Copy button */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cheatSheet);
                    toast.success('Copied Cheat Sheet to clipboard!');
                  }}
                  className="p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/80 active-press transition-all"
                  title="Copy Cheat Sheet"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="prose prose-sm prose-invert max-w-none text-left">
                {renderMarkdown(cheatSheet)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
