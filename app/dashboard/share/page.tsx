'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Download, Copy, Sparkles, Trophy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserStats {
  name: string;
  streak: number;
  notesCount: number;
  flashcardsCount: number;
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
}

export default function ShareMilestonePage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [notesRes, cardsRes, topicsRes, completedRes] = await Promise.all([
          supabase.from('notes').select('id', { count: 'exact', head: true }),
          supabase.from('flashcards').select('id', { count: 'exact', head: true }),
          supabase.from('syllabus_topics').select('id', { count: 'exact', head: true }),
          supabase.from('syllabus_topics').select('id', { count: 'exact', head: true }).eq('status', 'completed')
        ]);

        const streak = user.user_metadata?.study_streak || 0;
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
        
        const notesCount = notesRes.count || 0;
        const flashcardsCount = cardsRes.count || 0;
        const totalTopics = topicsRes.count || 0;
        const completedTopics = completedRes.count || 0;
        const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        const userStats = {
          name,
          streak,
          notesCount,
          flashcardsCount,
          progressPercent,
          completedTopics,
          totalTopics
        };

        setStats(userStats);
        
        // Trigger canvas drawing once stats are loaded
        setTimeout(() => {
          drawCanvasCard(userStats);
        }, 100);

      } catch (err) {
        console.error('Failed to load stats for sharing:', err);
        toast.error('Could not load achievement data');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const drawCanvasCard = (data: UserStats) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res backing dimensions (1200x800) for crisp retina export
    canvas.width = 1200;
    canvas.height = 800;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── 1. BACKGROUND (Pristine Academic Light Ivory Theme) ──
    ctx.fillStyle = '#FCFAF6'; // Luxurious warm ivory
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Elegant Geometric Security Watermark (Centered)
    const drawWatermark = (x: number, y: number, r: number) => {
      ctx.strokeStyle = 'rgba(197, 168, 128, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, r - 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, r - 40, 0, Math.PI * 2);
      ctx.stroke();
    };
    drawWatermark(canvas.width / 2, canvas.height / 2, 220);

    // ── 2. MINIMALIST BORDERS & CORNER TRIMS ──
    // Outer thin border (Slate/Navy)
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Inner thin border (Muted Gold Accent)
    ctx.strokeStyle = '#C5A880';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

    // Classy Corner Brackets
    const drawCornerBracket = (startX: number, startY: number, dx: number, dy: number) => {
      ctx.strokeStyle = '#C5A880';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY + dy);
      ctx.lineTo(startX, startY);
      ctx.lineTo(startX + dx, startY);
      ctx.stroke();
    };
    drawCornerBracket(44, 44, 30, 30); // Top-left
    drawCornerBracket(1156, 44, -30, 30); // Top-right
    drawCornerBracket(44, 756, 30, -30); // Bottom-left
    drawCornerBracket(1156, 756, -30, -30); // Bottom-right

    // ── 3. HEADER LOGO & REGISTRY DETAIL ──
    const logoX = canvas.width / 2;
    const logoY = 110;

    // Draw minimalist clean golden crest shield
    ctx.strokeStyle = '#C5A880';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(logoX, logoY - 15);
    ctx.lineTo(logoX + 12, logoY - 6);
    ctx.lineTo(logoX + 12, logoY + 8);
    ctx.quadraticCurveTo(logoX, logoY + 18, logoX, logoY + 20);
    ctx.quadraticCurveTo(logoX, logoY + 18, logoX - 12, logoY + 8);
    ctx.lineTo(logoX - 12, logoY - 6);
    ctx.closePath();
    ctx.stroke();

    // Small star inside the crest
    ctx.fillStyle = '#C5A880';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', logoX, logoY + 1);

    // Spaced Registry Header Text
    ctx.fillStyle = '#475569'; // Muted Slate
    ctx.font = 'bold 11px monospace';
    ctx.letterSpacing = '5px';
    ctx.fillText('S Y N A P   A C A D E M I C   R E G I S T R Y', logoX, logoY + 42);

    // ── 4. MAIN STATEMENT (Elegant Serif Typography) ──
    ctx.fillStyle = '#0F172A'; // Deep Slate
    ctx.font = 'bold 34px Georgia, serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('Certificate of Achievement', canvas.width / 2, 215);

    ctx.fillStyle = '#475569';
    ctx.font = 'italic 16px Georgia, serif';
    ctx.letterSpacing = '0px';
    ctx.fillText('This is proudly presented to', canvas.width / 2, 265);

    // Large Elegant Midnight Navy Recipient Name
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText(data.name, canvas.width / 2, 325);

    // Gold accent underline under the name
    ctx.strokeStyle = 'rgba(197, 168, 128, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(logoX - 150, 345);
    ctx.lineTo(logoX + 150, 345);
    ctx.stroke();

    // Achievement description
    ctx.fillStyle = '#475569';
    ctx.font = 'normal 14px sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.fillText('for successfully meeting and maintaining their daily study milestones on the Synap platform,', canvas.width / 2, 385);
    ctx.fillText('demonstrating outstanding academic commitment, active recall discipline, and knowledge retention.', canvas.width / 2, 410);

    // ── 5. CLEAN INFOGRAPHIC CARD ROW (Minimalist slate-50 box) ──
    const cardW = 840;
    const cardH = 100;
    const cardX = canvas.width / 2 - cardW / 2;
    const cardY = 460;

    // Draw minimalist clean box
    ctx.fillStyle = '#F8FAFC'; // slate-50
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 12);
    ctx.fill();

    ctx.strokeStyle = '#E2E8F0'; // slate-200 border
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw three vertical columns inside the stats box
    const drawCol = (colX: number, title: string, value: string) => {
      ctx.fillStyle = '#64748B'; // slate-500
      ctx.font = 'bold 9px monospace';
      ctx.letterSpacing = '2px';
      ctx.fillText(title.toUpperCase(), colX, cardY + 36);

      ctx.fillStyle = '#0F172A'; // deep slate
      ctx.font = 'bold 18px sans-serif';
      ctx.letterSpacing = '0px';
      ctx.fillText(value, colX, cardY + 68);
    };

    ctx.textAlign = 'center';
    drawCol(cardX + cardW / 6, 'Study Streak', `🔥 ${data.streak} Days Active`);
    
    // Draw column separator
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + cardW / 3, cardY + 25);
    ctx.lineTo(cardX + cardW / 3, cardY + 75);
    ctx.stroke();

    drawCol(cardX + cardW / 2, 'Knowledge Assets', `📚 ${data.notesCount} Notes / ${data.flashcardsCount} Cards`);

    // Draw column separator
    ctx.beginPath();
    ctx.moveTo(cardX + (cardW / 3) * 2, cardY + 25);
    ctx.lineTo(cardX + (cardW / 3) * 2, cardY + 75);
    ctx.stroke();

    drawCol(cardX + (cardW / 6) * 5, 'Curriculum Progress', `🎯 ${data.progressPercent}% Syllabus Mastery`);

    // ── 6. SECURED VERIFICATION & SIGNATURES ──
    const footerY = 640;

    // Left Signature Line
    ctx.strokeStyle = '#C5A880';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(180, footerY);
    ctx.lineTo(430, footerY);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px monospace';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.fillText('SYNAP VERIFICATION COMMITTEE', 305, footerY + 20);

    // Right Signature Line (Credential Hash)
    const credHash = 'VERIFIED-SYN-' + 
      Math.abs(data.streak * 17 + data.notesCount * 13 + 1047).toString(16).toUpperCase() + '-' + 
      Math.abs(data.flashcardsCount * 29 + 829).toString(16).toUpperCase();

    ctx.strokeStyle = '#C5A880';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(770, footerY);
    ctx.lineTo(1020, footerY);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px monospace';
    ctx.letterSpacing = '0px';
    ctx.fillText(`CREDENTIAL ID: ${credHash}`, 895, footerY + 20);

    // Center Gold Embossed Foil Seal Stamp
    const stampX = canvas.width / 2;
    const stampY = 635;

    // Solid gold gradient fill
    const goldGrad = ctx.createRadialGradient(stampX, stampY, 5, stampX, stampY, 32);
    goldGrad.addColorStop(0, '#FFFBEB'); // Bright reflective center
    goldGrad.addColorStop(0.3, '#F59E0B'); // Warm Amber Gold
    goldGrad.addColorStop(0.8, '#D97706'); // Deep Bronze
    goldGrad.addColorStop(1, '#B45309'); // Dark Shadow Gold

    ctx.fillStyle = goldGrad;
    ctx.shadowColor = 'rgba(217, 119, 6, 0.15)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(stampX, stampY, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Embossed inner border ring
    ctx.strokeStyle = '#FEF3C7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(stampX, stampY, 26, 0, Math.PI * 2);
    ctx.stroke();

    // Central Star inside the gold stamp
    ctx.fillStyle = '#FEF3C7';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('★', stampX, stampY + 2);

    // ── 7. LEGAL FOOTER STAMP ──
    ctx.fillStyle = '#94A3B8'; // light slate-400
    ctx.font = 'bold 10px monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText('VERIFIED ACADEMIC PROGRESS RECORD  •  WWW.SYNAP.BOND', canvas.width / 2, 725);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `synap-milestone-${stats.streak}-days.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Study milestone downloaded! 🚀');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export certificate image');
    }
  };

  const handleCopyText = () => {
    if (!stats) return;
    setCopying(true);

    const shareText = `🔥 Dealt with my study plan on Synap! Streak: ${stats.streak} Days! \n📚 Notes processed: ${stats.notesCount}\n🃏 Cards reviewed: ${stats.flashcardsCount}\n⚡ Learn more at: https://www.synap.bond`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        toast.success('Progress summary copied to clipboard! 📋');
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      })
      .finally(() => {
        setCopying(false);
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Analyzing study achievements…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <h2 className="text-lg font-bold text-red-500">Failed to load statistics</h2>
        <p className="text-muted-foreground">Unable to fetch dashboard details.</p>
        <Link href="/dashboard" className="text-primary hover:underline font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Back link */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-400 animate-bounce-dot" /> Share Your Study Milestones
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Download your verified credential card to post on Reddit, Discord, or share in college student groups!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Exporter Preview Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-border/80 bg-card rounded-2xl overflow-hidden shadow-2xl p-4 flex justify-center items-center">
            {/* Visual HTML Preview of Canvas output */}
            <canvas 
              ref={canvasRef} 
              style={{ width: '100%', height: 'auto', borderRadius: '12px', maxWidth: '600px' }}
              className="border border-border/40 shadow"
            />
          </div>
          <p className="text-[10px] text-center text-muted-foreground">
            💡 High-resolution 1200x800 PNG format optimized for desktop & mobile devices.
          </p>
        </div>

        {/* Action Panel Column (1/3 width) */}
        <div className="glass rounded-3xl border border-border/60 bg-card p-6 space-y-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Exporter Panel</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-muted/40 border border-border/40 rounded-xl space-y-1">
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Daily Flame</span>
              <span className="text-sm font-bold text-foreground">🔥 {stats.streak} Days Streak</span>
            </div>
            
            <div className="p-3 bg-muted/40 border border-border/40 rounded-xl space-y-1">
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Syllabus Complete</span>
              <span className="text-sm font-bold text-foreground">🎯 {stats.progressPercent}% ({stats.completedTopics}/{stats.totalTopics} topics)</span>
            </div>

            <div className="p-3 bg-muted/40 border border-border/40 rounded-xl space-y-1">
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Study Materials</span>
              <span className="text-sm font-bold text-foreground">📚 {stats.notesCount} Notes / {stats.flashcardsCount} Cards</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press hover:shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Image Card</span>
            </button>

            <button
              onClick={handleCopyText}
              disabled={copying}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border border-border text-foreground hover:bg-muted cursor-pointer active-press"
            >
              <Copy className="w-4 h-4 text-primary" />
              <span>Copy Progress Text</span>
            </button>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-2.5">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5 animate-pulse-soft" />
            <p className="text-[10px] text-muted-foreground leading-normal">
              Sharing accomplishments inside Discord student servers or engineering WhatsApp subgroups directly expands Synap's organic community growth!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
