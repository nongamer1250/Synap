'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, UploadCloud, BookOpen, Layers, HelpCircle, GraduationCap, MessageSquare, Award } from 'lucide-react';
import Link from 'next/link';

interface OnboardingChecklistProps {
  notesCount: number;
  flashcardsCount: number;
  quizzesCount: number;
  syllabusCount: number;
}

export default function OnboardingChecklist({
  notesCount,
  flashcardsCount,
  quizzesCount,
  syllabusCount
}: OnboardingChecklistProps) {
  const [hasChatted, setHasChatted] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const chatted = localStorage.getItem('synap_has_chatted') === 'true';
      setHasChatted(chatted);
    }
  }, []);

  const tasks = [
    {
      id: 'upload',
      label: 'Upload your first lecture slides or PDF',
      desc: 'Drag in slides or website links to start.',
      completed: notesCount > 0,
      icon: UploadCloud,
      href: '/dashboard/upload'
    },
    {
      id: 'notes',
      label: 'Generate detailed study notes',
      desc: 'Let Synap AI extract core study insights.',
      completed: notesCount > 0,
      icon: BookOpen,
      href: '/dashboard/notes'
    },
    {
      id: 'flashcards',
      label: 'Create active recall flashcards',
      desc: 'Generate smart decks for spaced repetition reviews.',
      completed: flashcardsCount > 0,
      icon: Layers,
      href: '/dashboard/flashcards'
    },
    {
      id: 'quizzes',
      label: 'Complete your first memory quiz',
      desc: 'Simulate short-form questions to test comprehension.',
      completed: quizzesCount > 0,
      icon: HelpCircle,
      href: '/dashboard/quiz'
    },
    {
      id: 'syllabus',
      label: 'Build an automated syllabus study roadmap',
      desc: 'Upload a syllabus to distribute daily exam targets.',
      completed: syllabusCount > 0,
      icon: GraduationCap,
      href: '/dashboard/syllabus'
    },
    {
      id: 'chat',
      label: 'Chat with your personal AI Tutor',
      desc: 'Solve hard equations or get concepts explained.',
      completed: hasChatted,
      icon: MessageSquare,
      href: '/dashboard/chat'
    }
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const percentCompleted = Math.round((completedCount / tasks.length) * 100);

  useEffect(() => {
    if (percentCompleted === 100 && !celebrated) {
      setCelebrated(true);
    }
  }, [percentCompleted, celebrated]);

  // Hide the checklist if it is completely done to keep the dashboard clutter-free
  if (percentCompleted === 100) {
    return (
      <div className="glass rounded-3xl border border-primary/20 bg-card p-6 relative overflow-hidden animate-scale-in shadow-lg"
        style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(21, 15, 46, 0.95) 100%)' }}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 animate-bounce-dot">
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 justify-center sm:justify-start">
              Academic Activation Accomplished! 🏆
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              You completed your entire onboarding roadmap. You are fully equipped to study 3x faster and master your subjects.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-border/80 bg-card/60 p-6 relative overflow-hidden animate-slide-up shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-5">
        <div>
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
            🎯 Guided Study Checklist
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            Complete these milestone tasks to activate your academic dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-32 bg-muted/60 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-primary font-mono">{percentCompleted}%</span>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Link
              key={task.id}
              href={task.href}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300 active-press cursor-pointer ${
                task.completed
                  ? 'border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-muted/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {task.completed ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 fill-emerald-400/10" />
                ) : (
                  <Circle className="w-4.5 h-4.5 text-muted-foreground/60" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <h4 className={`text-xs font-bold leading-snug truncate ${
                  task.completed ? 'text-emerald-400/90 line-through' : 'text-foreground hover:text-primary transition-colors'
                }`}>
                  {task.label}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 leading-normal">
                  {task.desc}
                </p>
              </div>

              <div className={`p-1.5 rounded-lg shrink-0 ${
                task.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
