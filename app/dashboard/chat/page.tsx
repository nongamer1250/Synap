'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Send, Loader2, Plus, Bot, User, BookOpen } from 'lucide-react';
import type { Note, ChatSession, ChatMessage } from '@/types';

import { useDashboardCache } from '@/components/providers/DashboardCacheProvider';

interface StreamedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ content: string; similarity: number }>;
  isStreaming?: boolean;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get('note_id');

  const { notes, sessions, setSessions, refreshNotes, refreshSessions } = useDashboardCache();
  const [selectedNoteId, setSelectedNoteId] = useState<string>(noteIdParam || '');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<StreamedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Silently revalidate in background on mount
  useEffect(() => {
    refreshNotes();
    refreshSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSession = useCallback(async (session: ChatSession) => {
    setCurrentSession(session);
    setSelectedNoteId(session.note_id || '');
    const res = await fetch(`/api/chat?session_id=${session.id}`);
    const data = await res.json();
    setMessages((data.data || []).map((m: ChatMessage) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: m.sources,
    })));
  }, []);

  const createNewSession = async () => {
    const note = selectedNoteId ? notes.find(n => n.id === selectedNoteId) : null;
    const res = await fetch('/api/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note_id: selectedNoteId || null,
        title: note ? `Chat: ${note.title}` : 'General Chat',
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSessions(s => [data.data, ...s]);
      setCurrentSession(data.data);
      setMessages([]);
    } else {
      toast.error('Failed to create session');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    if (!currentSession) {
      toast.error('Start a new chat session first');
      return;
    }

    const userMessage: StreamedMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(m => [...m, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantMsg: StreamedMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    setMessages(m => [...m, assistantMsg]);

    try {
      localStorage.setItem('synap_has_chatted', 'true');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.id,
          message: userMessage.content,
          note_id: selectedNoteId || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let sources: StreamedMessage['sources'] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.sources) {
              sources = json.sources;
            } else if (json.text) {
              fullText += json.text;
              setMessages(m =>
                m.map(msg =>
                  msg.id === assistantMsg.id
                    ? { ...msg, content: fullText, sources }
                    : msg
                )
              );
            }
          } catch { /* ignore parse errors */ }
        }
      }

      setMessages(m =>
        m.map(msg =>
          msg.id === assistantMsg.id
            ? { ...msg, content: fullText, sources, isStreaming: false }
            : msg
        )
      );
    } catch (err) {
      console.error(err);
      toast.error('Chat failed — please try again');
      setMessages(m => m.filter(msg => msg.id !== assistantMsg.id));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full gap-4 max-h-[calc(100vh-8rem)]">
      {/* Sessions sidebar (hidden on mobile, visible on desktop) */}
      <div className="hidden md:flex w-56 shrink-0 flex flex-col gap-3">
        <select
          value={selectedNoteId}
          onChange={(e) => setSelectedNoteId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-xs"
        >
          <option value="">All notes</option>
          {notes.map(n => <option key={n.id} value={n.id}>{n.title.slice(0, 30)}</option>)}
        </select>

        <button
          id="new-chat-session"
          onClick={createNewSession}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map(s => (
            <button key={s.id}
              onClick={() => loadSession(s)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                currentSession?.id === s.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <p className="truncate font-medium">{s.title || 'Chat'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col glass rounded-2xl border border-border overflow-hidden min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border shrink-0 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">Synap AI</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {selectedNoteId
                ? `Notes: ${notes.find(n => n.id === selectedNoteId)?.title?.slice(0, 30) || 'Note'}`
                : 'Ask about your notes'}
            </p>
          </div>

          {/* Mobile Chat Controls (visible only on small screens) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0 ml-auto min-w-0">
            {/* Note Selector */}
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="px-1.5 py-1.5 rounded-lg bg-muted border border-border focus:outline-none text-[9px] font-medium max-w-[80px] truncate"
            >
              <option value="">All Notes</option>
              {notes.map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>

            {/* Session Selector */}
            <select
              value={currentSession?.id || ''}
              onChange={(e) => {
                const s = sessions.find(sess => sess.id === e.target.value);
                if (s) loadSession(s);
              }}
              className="px-1.5 py-1.5 rounded-lg bg-muted border border-border focus:outline-none text-[9px] font-medium max-w-[80px] truncate"
            >
              <option value="">Select Chat…</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.title || 'Chat'}</option>
              ))}
            </select>

            {/* New Chat Button */}
            <button
              onClick={createNewSession}
              className="p-1.5 rounded-lg text-white shrink-0 hover:opacity-90 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              title="New Chat Session"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!currentSession ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-4">
              <div className="text-4xl">🤖</div>
              <div className="space-y-4 w-full max-w-xs">
                <div>
                  <p className="font-semibold mb-1">Start a conversation</p>
                  <p className="text-sm text-muted-foreground">Select a note (optional) and click New Chat (+)</p>
                </div>
                
                {/* Prominent mobile-only note selector in empty state */}
                <div className="block md:hidden">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 text-left">
                    Target Study Note:
                  </label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="">General Chat (All Notes)</option>
                    {notes.map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 animate-scale-in">
              <div className="text-4xl animate-bounce-dot">💬</div>
              <p className="text-sm text-muted-foreground">Ask me anything about your study notes!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 animate-message-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  msg.role === 'assistant'
                    ? 'text-white'
                    : 'bg-muted border border-border'
                }`}
                  style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' } : {}}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-3.5 h-3.5" />
                    : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className={`flex flex-col gap-1.5 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-tr-sm shadow-md'
                      : 'bg-muted border border-border rounded-tl-sm shadow-sm'
                  }`}
                    style={msg.role === 'user' ? { background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' } : {}}>
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-4 ml-1 animate-pulse-soft bg-primary"
                        style={{ borderRadius: '1px', boxShadow: '0 0 8px hsl(var(--primary))' }} />
                    )}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap animate-slide-up">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">Sources:</span>
                      {msg.sources.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground hover:border-primary/30 transition-colors">
                          Chunk {i + 1} ({Math.round(s.similarity * 100)}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-border shrink-0 bg-card/10">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentSession ? "Ask about your notes… (Enter to send, Shift+Enter for new line)" : "Start a new chat first →"}
              disabled={!currentSession || isStreaming}
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-sm resize-none disabled:opacity-50 text-foreground"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              id="send-message"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || !currentSession}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all duration-200 active-press hover:scale-105 hover:shadow-md hover:shadow-primary/20 shrink-0 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              {isStreaming
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
