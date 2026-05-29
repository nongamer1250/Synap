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

    // 1. Radial Background Gradient (Startup Theme)
    const bgGrad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 100,
      canvas.width / 2, canvas.height / 2, 700
    );
    bgGrad.addColorStop(0, '#1e1b4b'); // deep indigo
    bgGrad.addColorStop(0.5, '#0f172a'); // slate-900
    bgGrad.addColorStop(1, '#020617'); // slate-950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Visual design elements (Background grid/lines)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 3. Glowing Outer Borders
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)'; // purple glow
    ctx.lineWidth = 24;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)'; // indigo border
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // 4. Header Badge
    ctx.fillStyle = 'rgba(167, 139, 250, 0.15)';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 150, 80, 300, 40, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText('SYNAP™ STUDY CREDENTIAL', canvas.width / 2, 100);

    // 5. Fire streak icon
    ctx.font = '84px Arial';
    ctx.fillText('🔥', canvas.width / 2, 220);

    // 6. Streak Number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'extrabold 72px sans-serif';
    ctx.fillText(`${data.streak} Day Streak`, canvas.width / 2, 330);

    // 7. Student Name
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(data.name, canvas.width / 2, 420);

    // 8. Separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(250, 470);
    ctx.lineTo(canvas.width - 250, 470);
    ctx.stroke();

    // 9. Study Accomplishments
    ctx.fillStyle = '#cbd5e1'; // slate-300
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Study Notes Generated: ${data.notesCount}  |  Active Flashcards: ${data.flashcardsCount}`, canvas.width / 2, 530);
    ctx.fillText(`Syllabus Modules Completed: ${data.completedTopics}/${data.totalTopics} (${data.progressPercent}%)`, canvas.width / 2, 580);

    // 10. Sparkle decoration
    ctx.font = '32px Arial';
    ctx.fillText('✨', canvas.width / 2 - 250, 330);
    ctx.fillText('✨', canvas.width / 2 + 250, 330);

    // 11. Footer verified credential stamp
    ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
    ctx.font = 'bold 16px monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText('VERIFIED ACADEMIC PROGRESS RECORD  •  WWW.SYNAP.BOND', canvas.width / 2, 700);
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
