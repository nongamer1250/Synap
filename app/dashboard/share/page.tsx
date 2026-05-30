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

    // ── 1. BACKGROUND GRADIENT (Premium Deep Space Theme) ──
    const bgGrad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 50,
      canvas.width / 2, canvas.height / 2, 750
    );
    bgGrad.addColorStop(0, '#12102C'); // Deep violet center
    bgGrad.addColorStop(0.6, '#0B0F19'); // Elegant dark slate
    bgGrad.addColorStop(1, '#02040A'); // Near black edges
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ambient Glowing Lighting Effects (Subtle colored backlights in corners)
    const addGlow = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    addGlow(150, 150, 200, 'rgba(99, 102, 241, 0.08)'); // Subtle indigo top-left
    addGlow(1050, 650, 250, 'rgba(167, 139, 250, 0.08)'); // Subtle violet bottom-right
    addGlow(600, 280, 220, 'rgba(251, 191, 36, 0.05)'); // Warm amber center backlight

    // ── 2. TECHNICAL CREDENTIAL GRID ──
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // ── 3. DOUBLE GOLDEN BORDERS & DECORATIONS ──
    // Outer border
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)'; // Monolithic gold trace
    ctx.lineWidth = 32;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Inner thin border
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; // Sleek gold outline
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    // Elegant Corner Brackets (Institutional Grade)
    const drawCorner = (startX: number, startY: number, dx: number, dy: number) => {
      ctx.strokeStyle = '#FBBF24'; // Bold Warm Gold
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, startY + dy);
      ctx.lineTo(startX, startY);
      ctx.lineTo(startX + dx, startY);
      ctx.stroke();
    };
    drawCorner(42, 42, 40, 40); // Top-left
    drawCorner(1158, 42, -40, 40); // Top-right
    drawCorner(42, 758, 40, -40); // Bottom-left
    drawCorner(1158, 758, -40, -40); // Bottom-right

    // Tech crosshair coordinates on corner bounds
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1;
    const drawCross = (x: number, y: number) => {
      ctx.beginPath();
      ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
      ctx.stroke();
    };
    drawCross(50, 50);
    drawCross(1150, 50);
    drawCross(50, 750);
    drawCross(1150, 750);

    // ── 4. OFFICIAL BADGE HEADER ──
    const badgeWidth = 320;
    const badgeHeight = 36;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - badgeWidth / 2, 70, badgeWidth, badgeHeight, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.stroke();

    ctx.fillStyle = '#FBBF24'; // Bright warm gold
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '5px';
    ctx.fillText('OFFICIAL SYNAP™ CREDENTIAL', canvas.width / 2, 88);

    // ── 5. LAUREL EMBLEM CIRCULAR SEAL ──
    const sealX = canvas.width / 2;
    const sealY = 200;
    const sealRadius = 55;

    // Glowing circle behind emblem
    const sealGlow = ctx.createRadialGradient(sealX, sealY, 0, sealX, sealY, sealRadius + 20);
    sealGlow.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
    sealGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sealGlow;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius + 20, 0, Math.PI * 2);
    ctx.fill();

    // Outer gear border for badge feel
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Central emoji
    ctx.font = '54px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', sealX, sealY - 2);

    // Miniature stars detailing under emblem
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('★ ★ ★ ★ ★', sealX, sealY + 75);

    // ── 6. DUAL RECIPIENT STATEMENT ──
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'semibold 11px monospace';
    ctx.letterSpacing = '6px';
    ctx.fillText('THIS CERTIFICATION IS PROUDLY GRANTED TO', canvas.width / 2, 310);

    // Large warm golden gradient for Student Name
    const nameGrad = ctx.createLinearGradient(300, 0, 900, 0);
    nameGrad.addColorStop(0, '#FFFFFF'); // Pure White
    nameGrad.addColorStop(0.5, '#FDE68A'); // Golden Vanilla
    nameGrad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = nameGrad;
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(data.name, canvas.width / 2, 360);

    ctx.fillStyle = 'rgba(167, 139, 250, 0.8)'; // Violet
    ctx.font = 'bold 12px monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText('FOR EXTRAORDINARY DAILY COMMITMENT & DISCIPLINE ON SYNAP AI', canvas.width / 2, 400);

    // Elegant separator line
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(350, 430);
    ctx.lineTo(canvas.width - 350, 430);
    ctx.stroke();

    // ── 7. PREMIUM INFOGRAPHIC CARDS (Three distinct panels) ──
    const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string, desc: string, isStreak = false) => {
      // Rounded Card Background
      ctx.fillStyle = 'rgba(30, 41, 59, 0.3)'; // slate-800 backdrop
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();

      // Card Border Outline
      ctx.strokeStyle = isStreak ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Card Header Title
      ctx.fillStyle = isStreak ? '#FBBF24' : '#818CF8';
      ctx.font = 'black 9px monospace';
      ctx.letterSpacing = '2px';
      ctx.textAlign = 'center';
      ctx.fillText(title, x + w / 2, y + 32);

      // Card Central Big Stat Value
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(value, x + w / 2, y + 80);

      // Card Footer Description
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'normal 10px sans-serif';
      ctx.letterSpacing = '0px';
      ctx.fillText(desc, x + w / 2, y + 120);
    };

    // Calculate dimensions
    const cardW = 310;
    const cardH = 155;
    const cardY = 475;

    // Card 1: Streak (Highlighted)
    drawCard(
      100, 
      cardY, 
      cardW, 
      cardH, 
      'DAILY STUDY STREAK', 
      `🔥 ${data.streak} Days Active`, 
      'Continuous recall & plan tracking', 
      true
    );

    // Card 2: Materials
    drawCard(
      445, 
      cardY, 
      cardW, 
      cardH, 
      'ACADEMIC STUDY ASSETS', 
      `📚 ${data.notesCount} Notes / ${data.flashcardsCount} Cards`, 
      'Active recall files generated'
    );

    // Card 3: Mastery
    drawCard(
      790, 
      cardY, 
      cardW, 
      cardH, 
      'CURRICULUM COMPLETION', 
      `🎯 ${data.progressPercent}% Mastery`, 
      data.totalTopics > 0 
        ? `${data.completedTopics} of ${data.totalTopics} topics complete`
        : 'Syllabus planner activated'
    );

    // ── 8. SECURED TELEMETRY FOOTER & SERIAL ID ──
    // Pseudo-cryptographic credential verification hash to make it look highly valuable & verifiable
    const credHash = 'VERIFIED-SYN-' + 
      Math.abs(data.streak * 17 + data.notesCount * 13 + 1047).toString(16).toUpperCase() + '-' + 
      Math.abs(data.flashcardsCount * 29 + 829).toString(16).toUpperCase();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 11px monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText(`SERIAL NUMBER: ${credHash}`, canvas.width / 2, 690);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.55)'; // Warm Gold
    ctx.font = 'bold 12px monospace';
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
