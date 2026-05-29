'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Folder, FolderOpen, ChevronDown, ChevronRight, FileText, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  key_concepts: any;
  created_at: string;
  course_name?: string | null;
}

interface NotesFolderViewProps {
  notes: Note[];
}

export default function NotesFolderView({ notes }: NotesFolderViewProps) {
  // Group notes dynamically by course_name (default to 'General Notes')
  const groupedNotes = useMemo(() => {
    return notes.reduce((acc, note) => {
      const subjectName = note.course_name || 'General Notes';
      if (!acc[subjectName]) {
        acc[subjectName] = [];
      }
      acc[subjectName].push(note);
      return acc;
    }, {} as Record<string, Note[]>);
  }, [notes]);

  // Keep track of which folders are open (default all open)
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(groupedNotes).forEach(subject => {
      initial[subject] = true;
    });
    return initial;
  });

  const toggleFolder = (subject: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedNotes).map(([subject, subjectNotes]) => {
        const isOpen = openFolders[subject] ?? true;
        
        return (
          <div 
            key={subject} 
            className="glass rounded-3xl border border-border/80 bg-card/45 overflow-hidden transition-all duration-300 shadow-sm"
          >
            {/* Folder Header Row */}
            <div 
              onClick={() => toggleFolder(subject)}
              className="flex items-center justify-between px-6 py-4.5 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors border-b border-border/40 select-none"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {isOpen ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground tracking-wide">{subject}</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {subjectNotes.length} Note{subjectNotes.length !== 1 ? 's' : ''} folder
                  </span>
                </div>
              </div>
              
              <div className="text-muted-foreground p-1 hover:text-foreground transition-colors">
                {isOpen ? <ChevronDown className="w-4.5 h-4.5" /> : <ChevronRight className="w-4.5 h-4.5" />}
              </div>
            </div>

            {/* Folder Content Panel (Notes list) */}
            {isOpen && (
              <div className="p-4 space-y-3 animate-scale-in">
                {subjectNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/dashboard/notes/${note.id}`}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-border/40 bg-card hover:border-primary/40 hover:bg-muted/15 transition-all group cursor-pointer"
                  >
                    <div className="w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'hsl(255 85% 68% / 0.1)' }}>
                      <FileText className="w-4.5 h-4.5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span>{note.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                      </h4>
                      
                      {note.summary && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {note.summary}
                        </p>
                      )}
                      
                      {note.key_concepts && note.key_concepts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(note.key_concepts as string[]).slice(0, 3).map((c) => (
                            <span key={c} className="px-2 py-0.5 rounded text-[9px] bg-muted/80 text-muted-foreground border border-border/50">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {formatDate(note.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
