'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Heart, Database, AlertTriangle, Copy, Check, LogOut, Coffee, ExternalLink, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
    created_at?: string;
  };
}

const SQL_MIGRATION = `-- ============================================================
-- Synap — Supabase Database Performance Indexes
-- Copy and paste these into your Supabase SQL Editor
-- ============================================================

-- Uploads & Transcripts foreign key indexing
CREATE INDEX IF NOT EXISTS uploads_user_id_idx ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS transcripts_upload_id_idx ON public.transcripts(upload_id);
CREATE INDEX IF NOT EXISTS transcripts_user_id_idx ON public.transcripts(user_id);

-- Study Notes & Spaced Repetition Flashcards indexes
CREATE INDEX IF NOT EXISTS notes_upload_id_idx ON public.notes(upload_id);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS flashcards_note_id_idx ON public.flashcards(note_id);
CREATE INDEX IF NOT EXISTS flashcards_user_id_idx ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS flashcards_due_date_idx ON public.flashcards(due_date);

-- Active Recall Quizzes & Exam Attempt indexes
CREATE INDEX IF NOT EXISTS quizzes_note_id_idx ON public.quizzes(note_id);
CREATE INDEX IF NOT EXISTS quizzes_user_id_idx ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON public.quiz_attempts(user_id);

-- Curriculum Syllabus Roadmap & Practice Exams indexes
CREATE INDEX IF NOT EXISTS syllabus_topics_syllabus_id_idx ON public.syllabus_topics(syllabus_id);
CREATE INDEX IF NOT EXISTS syllabus_topics_user_id_idx ON public.syllabus_topics(user_id);
CREATE INDEX IF NOT EXISTS sample_papers_syllabus_id_idx ON public.sample_papers(syllabus_id);
CREATE INDEX IF NOT EXISTS sample_papers_user_id_idx ON public.sample_papers(user_id);`;

export default function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'support' | 'database' | 'danger'>('profile');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Donation links from environment variables or defaults
  const kofiUrl = process.env.NEXT_PUBLIC_COFEED_URL || 'https://ko-fi.com/synap';
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'santa24559@okhdfcbank';
  const paymentLink = process.env.NEXT_PUBLIC_PAYMENT_LINK || '';

  const upiUri = `upi://pay?pa=${upiId}&pn=Synap%20AI&cu=INR&tn=Support%20Synap%20AI`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=255-255-255&bgcolor=21-15-46&data=${encodeURIComponent(upiUri)}`;

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('profile');
      setShowQr(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION);
    setCopiedSql(true);
    toast.success('SQL migration script copied! Paste it in Supabase SQL editor.');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleResetData = async () => {
    const confirmed = window.confirm(
      'CRITICAL ACTION WARNING: Are you absolutely sure you want to delete all study notes, flashcard review statistics, syllabus roadmap plans, quizzes, and chat history? This cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setResetLoading(true);
      const res = await fetch('/api/reset-data', { method: 'POST' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to wipe data');
      }

      toast.success('All database study statistics and records wiped!');
      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Wipe failed. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />

      {/* Glow highlight */}
      <div className={`absolute w-[400px] h-[400px] rounded-full blur-[90px] opacity-25 pointer-events-none transition-all duration-500 z-0 ${
        activeTab === 'danger' ? 'bg-red-500/25' : activeTab === 'database' ? 'bg-primary/20' : 'bg-rose-500/20'
      }`} />

      {/* Modal Dialog Card Container */}
      <div className="relative w-full max-w-2xl bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] z-10 animate-scale-in flex flex-col md:flex-row overflow-hidden min-h-[460px]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors z-20"
          aria-label="Close settings"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* 1. Left Sidebar Navigation tabs */}
        <div className="w-full md:w-48 bg-muted/20 border-b md:border-b-0 md:border-r border-border/40 p-4 pt-10 flex flex-col gap-1.5 shrink-0">
          <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 px-2.5">Settings Hub</h3>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all active-press cursor-pointer ${
              activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>General Profile</span>
          </button>
          
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all active-press cursor-pointer ${
              activeTab === 'support' ? 'bg-rose-500/10 text-rose-400' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Support Developer</span>
          </button>
          
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all active-press cursor-pointer ${
              activeTab === 'database' ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>SQL Migrations</span>
          </button>
          
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all active-press cursor-pointer ${
              activeTab === 'danger' ? 'bg-red-500/10 text-red-400' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* 2. Right Workspace Content Panel */}
        <div className="flex-1 p-6 pt-10 overflow-y-auto max-h-[500px] md:max-h-none flex flex-col justify-between">
          
          {/* Active Tab View */}
          <div className="flex-1">
            {/* GENERAL PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-5 animate-scale-in">
                <div>
                  <h4 className="text-base font-bold text-foreground">General Profile</h4>
                  <p className="text-xs text-muted-foreground">Manage your student credentials and workspace plan</p>
                </div>
                <div className="flex items-center gap-4 bg-muted/40 p-4 border border-border/40 rounded-2xl">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
                    {(user.full_name || 'Student')[0].toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-foreground">{user.full_name || 'Student'}</h5>
                    <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-bold bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider">
                      Free Lifetime Plan
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="border border-border/45 bg-muted/20 p-3 rounded-xl">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Platform Host</span>
                      <span className="text-xs font-semibold text-foreground mt-1 block">Capacitor Webview</span>
                    </div>
                    <div className="border border-border/45 bg-muted/20 p-3 rounded-xl">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Client Cache</span>
                      <span className="text-xs font-semibold text-emerald-400 mt-1 block">IndexedDB Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DEVELOPER SUPPORT */}
            {activeTab === 'support' && (
              <div className="space-y-4 animate-scale-in">
                <div>
                  <h4 className="text-base font-bold text-foreground">Support Synap's Developer</h4>
                  <p className="text-xs text-muted-foreground">Synap is built by a student, completely for free. We pay monthly server and API costs out of pocket. Your support keeps us alive!</p>
                </div>
                
                <div className="space-y-3">
                  {paymentLink ? (
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs">₹</span>
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">UPI, Cards, Netbanking Checkout</h4>
                          <p className="text-[10px] text-muted-foreground">Gateway Payment Page (Cosmofeed/Razorpay)</p>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-400" />
                    </a>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold">₹</span>
                        <div className="text-left flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground">UPI support (India Only)</h4>
                          <p className="text-[10px] text-muted-foreground truncate">Pay via GPay, PhonePe, Paytm</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={upiUri} className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                          ⚡ Pay Instantly
                        </a>
                        <button onClick={() => setShowQr(!showQr)} className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-foreground transition-all cursor-pointer">
                          📷 {showQr ? 'Hide QR' : 'Show QR'}
                        </button>
                      </div>
                      {showQr && (
                        <div className="flex flex-col items-center justify-center py-3 bg-muted/40 rounded-xl border border-border/60 animate-scale-in text-center gap-2">
                          <div className="p-2 bg-[#150f2e] border border-emerald-500/30 rounded-lg">
                            <img src={qrCodeUrl} alt="UPI QR Code" className="w-[120px] h-[120px] object-contain rounded" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 border-t border-border/40 pt-2.5">
                        <div className="flex-1 bg-muted/60 border border-border px-3 py-1.5 rounded-lg font-mono text-[10px] text-foreground select-all truncate">{upiId}</div>
                        <button onClick={handleCopyUpi} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0">
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <a
                    href={kofiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[#FF5E5B]/20 bg-[#FF5E5B]/5 hover:bg-[#FF5E5B]/10 hover:border-[#FF5E5B]/40 group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF5E5B]/20 text-[#FF5E5B]"><Heart className="w-4 h-4 fill-current" /></span>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-foreground group-hover:text-[#FF5E5B] transition-colors">Support on Ko-fi (PayPal / International)</h4>
                        <p className="text-[10px] text-muted-foreground">Credit Cards, PayPal, and Wallet payments</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#FF5E5B]" />
                  </a>
                </div>
              </div>
            )}

            {/* DATABASE SQL MIGRATIONS */}
            {activeTab === 'database' && (
              <div className="space-y-4 animate-scale-in">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Database Index Migrations</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Optimize your production Supabase database performance. Running these performance indexes on your Supabase dashboard speeds up flashcard due-date calculations and foreign key search queries by up to 10x.
                    </p>
                  </div>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white active-press transition-all cursor-pointer shrink-0"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
                
                <div className="relative rounded-xl border border-border overflow-hidden bg-muted/40 max-h-[220px] overflow-y-auto">
                  <pre className="p-4 text-[9px] font-mono text-muted-foreground leading-relaxed text-left whitespace-pre select-all">
                    {SQL_MIGRATION}
                  </pre>
                </div>
                <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-primary" />
                  <span>To run: Go to Supabase Dashboard &rarr; SQL Editor &rarr; Paste and click Run.</span>
                </div>
              </div>
            )}

            {/* DANGER ZONE */}
            {activeTab === 'danger' && (
              <div className="space-y-5 animate-scale-in">
                <div>
                  <h4 className="text-base font-bold text-red-400">Danger Zone</h4>
                  <p className="text-xs text-muted-foreground">Irreversible and destructive account operations</p>
                </div>
                
                <div className="border border-red-500/20 bg-red-500/5 p-5 rounded-2xl space-y-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-red-400 uppercase tracking-wide">Wipe Study Records</h5>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        This operation wipes all study materials including lecture transcripts, summarized study notes, flashcard decks, spaced repetition review timers, syllabus roadmaps, and AI tutor conversation records.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleResetData}
                      disabled={resetLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer active-press shadow-md shadow-red-500/10"
                    >
                      {resetLoading ? 'Wiping all data...' : 'Reset My Entire Data'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Close */}
          <div className="mt-8 pt-4 border-t border-border/40 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            >
              Close Settings
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
