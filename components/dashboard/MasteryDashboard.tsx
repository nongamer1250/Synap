'use client';

import React, { useMemo } from 'react';
import { Brain, Calendar, CheckCircle2, TrendingUp, Trophy, GraduationCap, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';

interface MasteryDashboardProps {
  notesCount: number;
  flashcardsCount: number;
  quizzesCount: number;
  syllabusCount: number;
  topicsCompleted: number;
  totalTopics: number;
}

export default function MasteryDashboard({
  notesCount,
  flashcardsCount,
  quizzesCount,
  syllabusCount,
  topicsCompleted,
  totalTopics
}: MasteryDashboardProps) {
  
  // Calculate dynamic exam readiness score out of 100
  const examReadiness = useMemo(() => {
    if (notesCount === 0) return 0;
    
    // Weighted logic: notes count (15%), flashcards (25%), quizzes completed (20%), syllabus progress (40%)
    const notesWeight = Math.min(15, notesCount * 3);
    const flashcardsWeight = Math.min(25, flashcardsCount * 1.5);
    const quizzesWeight = Math.min(20, quizzesCount * 4);
    const syllabusWeight = totalTopics > 0 ? (topicsCompleted / totalTopics) * 40 : 0;
    
    return Math.min(100, Math.round(notesWeight + flashcardsWeight + quizzesWeight + syllabusWeight));
  }, [notesCount, flashcardsCount, quizzesCount, topicsCompleted, totalTopics]);

  // Default subject folders shown if they haven't uploaded a custom syllabus yet
  const defaultCourses = [
    { title: 'Computer Science (DSA)', progress: notesCount > 0 ? 65 : 0, topics: '5/8 topics' },
    { title: 'Database Systems (DBMS)', progress: flashcardsCount > 0 ? 48 : 0, topics: '4/10 topics' },
    { title: 'Operating Systems (OS)', progress: quizzesCount > 0 ? 30 : 0, topics: '3/10 topics' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
      
      {/* 1. Subject Mastery Progress Panel (Col-span 2) */}
      <div className="lg:col-span-2 glass rounded-3xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-sm">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>Subject Mastery Progress</span>
            </h4>
            <Link href="/dashboard/syllabus" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
              <span>Exam Prep tab</span> <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3.5 pt-2">
            {syllabusCount > 0 && totalTopics > 0 ? (
              /* Custom dynamic syllabus courses */
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground">Active Curriculum Tracker</span>
                  <span className="text-primary font-mono">{topicsCompleted} / {totalTopics} Topics Done</span>
                </div>
                <div className="bg-muted/20 border border-border/40 p-4.5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Syllabus Completion</span>
                    <span className="text-xs font-black text-primary font-mono">{Math.round((topicsCompleted / totalTopics) * 100)}%</span>
                  </div>
                  <div className="progress-bar w-full">
                    <div 
                      className="progress-fill h-full"
                      style={{ width: `${(topicsCompleted / totalTopics) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Default onboarding courses to show structure */
              <div className="space-y-3.5">
                {defaultCourses.map((c, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground truncate max-w-[200px] sm:max-w-xs">{c.title}</span>
                      <span className="text-foreground/75 text-[10px] font-mono">{c.progress > 0 ? c.topics : '0 topics completed'}</span>
                    </div>
                    <div className="progress-bar w-full h-1.5">
                      <div 
                        className="progress-fill h-full transition-all duration-500"
                        style={{ 
                          width: `${c.progress}%`,
                          background: idx === 1 ? 'hsl(var(--accent))' : idx === 2 ? 'hsl(38 92% 65%)' : 'hsl(var(--primary))'
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed pt-2">
                  💡 *Upload your course syllabus PDF inside the **Exam Prep** tab to auto-track custom subjects here.*
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Exam Readiness Score Dial */}
      <div className="glass rounded-3xl border border-border/80 bg-card p-6 flex flex-col items-center justify-between text-center shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1.5 w-full">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Target Readiness</span>
          <h4 className="font-extrabold text-sm text-foreground">Exam Readiness Score</h4>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center my-5">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              className="text-muted/40"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="50"
              cx="64"
              cy="64"
            />
            <circle
              className="text-primary transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 50}
              strokeDashoffset={2 * Math.PI * 50 - (examReadiness / 100) * (2 * Math.PI * 50)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="50"
              cx="64"
              cy="64"
              style={{ color: examReadiness > 80 ? 'hsl(142 71% 65%)' : examReadiness > 50 ? 'hsl(var(--primary))' : 'hsl(38 92% 65%)' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-foreground font-mono">{examReadiness}%</span>
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold">Ready</span>
          </div>
        </div>

        {/* Readiness Level Description */}
        <div className="w-full">
          {examReadiness === 0 ? (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Upload notes and take quizzes to calculate score.
            </p>
          ) : examReadiness >= 80 ? (
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 py-1.5 rounded-xl">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>EXAM PREPARED! 🏆</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 py-1.5 rounded-xl">
              <TrendingUp className="w-3.5 h-3.5 text-accent animate-pulse-soft" />
              <span>Progressing steadily</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
