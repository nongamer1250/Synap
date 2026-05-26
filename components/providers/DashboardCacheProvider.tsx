'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Note, ChatSession } from '@/types';

interface CacheContextProps {
  notes: Note[];
  sessions: ChatSession[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  refreshNotes: () => Promise<Note[]>;
  refreshSessions: () => Promise<ChatSession[]>;
  notesLoaded: boolean;
  sessionsLoaded: boolean;
}

const CacheContext = createContext<CacheContextProps | undefined>(undefined);

/**
 * Shared Client-Side Cache Provider.
 * Eliminates loading spinners during dashboard tab navigation by caching
 * notes and chat sessions, silently revalidating data in the background.
 */
export function DashboardCacheProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const refreshNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (data.data) {
        setNotes(data.data);
        setNotesLoaded(true);
        return data.data;
      }
    } catch (e) {
      console.error('[Dashboard Cache] Failed to refresh notes:', e);
    }
    return [];
  };

  const refreshSessions = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (data.data) {
        setSessions(data.data);
        setSessionsLoaded(true);
        return data.data;
      }
    } catch (e) {
      console.error('[Dashboard Cache] Failed to refresh sessions:', e);
    }
    return [];
  };

  // Prefetch data immediately on mount
  useEffect(() => {
    refreshNotes();
    refreshSessions();
  }, []);

  return (
    <CacheContext.Provider
      value={{
        notes,
        sessions,
        setNotes,
        setSessions,
        refreshNotes,
        refreshSessions,
        notesLoaded,
        sessionsLoaded,
      }}
    >
      {children}
    </CacheContext.Provider>
  );
}

export function useDashboardCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useDashboardCache must be used within a DashboardCacheProvider');
  }
  return context;
}
