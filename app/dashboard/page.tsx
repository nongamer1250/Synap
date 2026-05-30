import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { 
  FileText, 
  Upload, 
  ArrowRight, 
  Mic, 
  Globe,
  Calendar,
  Brain,
  GraduationCap,
  Clock,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Trophy
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import MasteryDashboard from '@/components/dashboard/MasteryDashboard';

// Helper to format countdown
const getExamCountdown = (examDateStr: string | null) => {
  if (!examDateStr) return null;
  const examDate = new Date(examDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = examDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Exam passed', isPassed: true };
  if (diffDays === 0) return { label: 'EXAM IS TODAY! 🚨', isCritical: true };
  if (diffDays === 1) return { label: 'Exam tomorrow! ⏳', isCritical: true };
  if (diffDays <= 7) return { label: `${diffDays} days left ⏳`, isWarning: true };
  return { label: `${diffDays} days left`, isNormal: true };
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch stats and lists in parallel to optimize load performance
  const [
    notesRes,
    flashcardsRes,
    attemptsRes,
    completedTopicsRes,
    totalTopicsRes,
    srsDueRes,
    syllabiRes,
    recentNotesRes,
  ] = await Promise.all([
    supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('syllabus_topics').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('syllabus_topics').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('flashcards').select('id', { count: 'exact', head: true }).eq('user_id', user.id).lte('due_date', new Date().toISOString()),
    supabase.from('syllabi').select('id, title, exam_date').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    supabase.from('notes').select('id, title, summary, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4)
  ]);

  const recentNotes = recentNotesRes.data || [];
  const notesCount = notesRes.count || 0;
  const flashcardsCount = flashcardsRes.count || 0;
  const quizAttemptsCount = attemptsRes.count || 0;
  const completedTopicsCount = completedTopicsRes.count || 0;
  const totalTopicsCount = totalTopicsRes.count || 0;
  const srsDueCount = srsDueRes.count || 0;

  // Process latest syllabus exam tracker
  let nextStudyTopic = null;
  let currentSyllabus = null;
  let syllabusProgressPercent = 0;
  if (syllabiRes.data && syllabiRes.data.length > 0) {
    currentSyllabus = syllabiRes.data[0];
    const { data: topics } = await supabase
      .from('syllabus_topics')
      .select('id, title, description, status, note_id')
      .eq('syllabus_id', currentSyllabus.id)
      .order('sort_order', { ascending: true });
    
    if (topics && topics.length > 0) {
      nextStudyTopic = topics.find(t => t.status !== 'completed') || null;
      const completed = topics.filter(t => t.status === 'completed').length;
      syllabusProgressPercent = Math.round((completed / topics.length) * 100);
    }
  }

  const creationCards = [
    { 
      title: 'Blank document', 
      desc: 'Start from scratch', 
      icon: FileText, 
      color: 'hsl(255 85% 68%)', 
      href: '/dashboard/upload' 
    },
    { 
      title: 'Record or upload audio', 
      desc: 'Upload an audio file', 
      icon: Mic, 
      color: 'hsl(280 70% 65%)', 
      href: '/dashboard/upload' 
    },
    { 
      title: 'Document upload', 
      desc: 'Any PDF, DOC, PPT, etc.', 
      icon: Upload, 
      color: 'hsl(142 71% 65%)', 
      href: '/dashboard/upload' 
    },
    { 
      title: 'Website link', 
      desc: 'YouTube or website link', 
      icon: Globe, 
      color: 'hsl(38 92% 65%)', 
      href: '/dashboard/upload' 
    },
  ];

  const streak = user.user_metadata?.study_streak || 0;
  const countdown = currentSyllabus ? getExamCountdown(currentSyllabus.exam_date) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-12">
      
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Create new notes and monitor your study goals</p>
          </div>
          {streak > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold animate-pulse-soft">
              🔥 <span className="font-semibold">{streak}</span> Day Streak
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border/60 text-muted-foreground text-xs font-medium">
              🔥 <span className="font-semibold">0</span> Day Streak
            </div>
          )}
        </div>
      </div>

      {/* ── VISUAL ONBOARDING CHECKLIST ── */}
      <OnboardingChecklist 
        notesCount={notesCount}
        flashcardsCount={flashcardsCount}
        quizzesCount={quizAttemptsCount}
        syllabusCount={syllabiRes.data ? syllabiRes.data.length : 0}
      />

      {/* ── PROGRESS & MASTERY DASHBOARD ── */}
      <MasteryDashboard 
        notesCount={notesCount}
        flashcardsCount={flashcardsCount}
        quizzesCount={quizAttemptsCount}
        syllabusCount={syllabiRes.data ? syllabiRes.data.length : 0}
        topicsCompleted={completedTopicsCount}
        totalTopics={totalTopicsCount}
      />

      {/* ── RETENTION LOOP: STUDY PLANNER REMINDER & STATS OVERVIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Up Next Target Card */}
        <div className="lg:col-span-2 flex flex-col">
          {currentSyllabus ? (
            <div className="glass rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between h-full relative overflow-hidden group shadow-md hover:border-primary/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5" /> Study Roadmap
                  </span>
                  {countdown && (
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      countdown.isPassed ? 'text-muted-foreground' : countdown.isCritical ? 'text-red-500 animate-pulse-soft' : 'text-primary'
                    }`}>
                      <Clock className="w-3 h-3" /> {countdown.label}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Target Exam Plan</span>
                  <Link href={`/dashboard/syllabus/${currentSyllabus.id}`} className="font-bold text-base hover:text-primary transition-colors block leading-tight">
                    {currentSyllabus.title}
                  </Link>
                </div>

                {nextStudyTopic ? (
                  <div className="bg-muted/30 border border-border/40 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded font-black">
                        🎯 Today's Focus
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Syllabus {syllabusProgressPercent}% Complete
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{nextStudyTopic.title}</h4>
                      {nextStudyTopic.description && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                          {nextStudyTopic.description}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end pt-1">
                      {nextStudyTopic.note_id ? (
                        <Link
                          href={`/dashboard/notes/${nextStudyTopic.note_id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press shadow-sm"
                        >
                          <span>Review Notes</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/syllabus/${currentSyllabus.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-primary border border-primary/20 hover:bg-primary/5 cursor-pointer active-press"
                        >
                          <Sparkles className="w-3 h-3 text-yellow-400" />
                          <span>Generate Notes</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-success/5 border border-success/15 rounded-2xl p-4 text-center space-y-2">
                    <span className="text-xl">🏆</span>
                    <h4 className="font-bold text-xs text-success">Syllabus Fully Studied!</h4>
                    <p className="text-[10px] text-muted-foreground">All study topics completed. Head back to construct custom mock papers.</p>
                    <Link
                      href={`/dashboard/syllabus/${currentSyllabus.id}`}
                      className="inline-block text-[10px] font-bold text-success hover:underline"
                    >
                      Generate Mock Exams
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between h-full relative overflow-hidden group shadow-md hover:border-primary/30 transition-all duration-300">
              <div className="space-y-4">
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider w-max">
                  <GraduationCap className="w-3.5 h-3.5" /> Exam Scheduler
                </span>
                <div className="space-y-2">
                  <h3 className="font-bold text-sm sm:text-base leading-snug">No active study calendar found</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload your syllabus PDF or syllabus images in the Exam Prep tab to construct an automated spaced-distribution study schedule leading up to your exams!
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <Link
                  href="/dashboard/syllabus"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press hover:shadow-md"
                >
                  <span>Build Study Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Weekly Stats & Flashcards Spaced Repetition Panel */}
        <div className="flex flex-col gap-4">
          {/* Spaced repetition review card */}
          <div className="glass rounded-3xl border border-border/60 bg-card p-5 space-y-3.5 shadow-md flex-1 flex flex-col justify-between hover:border-primary/30 transition-all">
            <div className="space-y-2">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Spaced Repetition</span>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg leading-tight flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span>Review Tasks</span>
                </h3>
                {srsDueCount > 0 ? (
                  <span className="text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full animate-pulse-soft">
                    {srsDueCount} Due
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-success/10 border border-success/20 text-success px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {srsDueCount > 0 
                  ? `You have ${srsDueCount} study cards due for review based on the SM-2 algorithm.`
                  : "Excellent job! You are all caught up on your spaced repetition decks for today."}
              </p>
            </div>
            
            {srsDueCount > 0 && (
              <Link 
                href="/dashboard/flashcards"
                className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press shadow-sm"
              >
                Start Review Session
              </Link>
            )}
          </div>

          {/* Quick study performance stats */}
          <div className="glass rounded-3xl border border-border/60 bg-card p-5 space-y-3.5 shadow-md hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-3">Performance Log</span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-muted/30 border border-border/40 p-2.5 rounded-xl">
                  <span className="block text-xs font-bold text-foreground">{notesCount}</span>
                  <span className="text-[9px] text-muted-foreground">Study Notes</span>
                </div>
                <div className="bg-muted/30 border border-border/40 p-2.5 rounded-xl">
                  <span className="block text-xs font-bold text-foreground">{flashcardsCount}</span>
                  <span className="text-[9px] text-muted-foreground">Flashcards</span>
                </div>
                <div className="bg-muted/30 border border-border/40 p-2.5 rounded-xl">
                  <span className="block text-xs font-bold text-foreground">{quizAttemptsCount}</span>
                  <span className="text-[9px] text-muted-foreground">Quizzes</span>
                </div>
                <div className="bg-muted/30 border border-border/40 p-2.5 rounded-xl flex flex-col justify-center items-center">
                  <span className={`block text-xs font-bold ${streak > 0 ? 'text-orange-500 font-extrabold' : 'text-muted-foreground'}`}>
                    🔥 {streak}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Study Streak</span>
                </div>
              </div>
            </div>
            
            <Link 
              href="/dashboard/share"
              className="w-full flex items-center justify-center gap-1.5 py-2 mt-4 rounded-xl text-[10px] sm:text-xs font-bold border border-border text-foreground hover:bg-muted cursor-pointer active-press transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Share Accomplishments</span>
            </Link>
          </div>

        </div>

      </div>

      {/* ── CREATION CARDS ROW ────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase pl-0.5">Create New Notes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creationCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`glass border border-border/85 rounded-2xl p-5 hover:border-primary/40 transition-colors duration-300 flex flex-col justify-between min-h-[140px] group glass-hover active-press animate-scale-in delay-${idx + 1}`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${card.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {card.title}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── RECENT NOTES ──────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pl-0.5">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Recent Notes</h2>
          {recentNotes && recentNotes.length > 0 && (
            <Link href="/dashboard/notes" className="text-xs text-primary font-bold hover:underline transition-all active-press">
              View all →
            </Link>
          )}
        </div>

        {recentNotes && recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentNotes.map((note, index) => (
              <Link 
                key={note.id} 
                href={`/dashboard/notes/${note.id}`}
                className={`glass rounded-2xl p-5 border border-border glass-hover active-press animate-slide-up delay-${(index % 3) + 1} flex items-start gap-4 group cursor-pointer`}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'hsl(255 85% 68% / 0.15)' }}>
                  <FileText className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{note.title}</h3>
                  {note.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{note.summary}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground/60 block mt-2 font-mono">{formatDate(note.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 border border-border text-center animate-slide-up">
            <div className="text-3xl mb-3 animate-bounce-dot">📚</div>
            <h3 className="font-bold text-sm mb-1">No notes yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Create a document or upload a lecture to get started</p>
            <Link href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white active-press hover:shadow-lg hover:shadow-primary/25 transition-all"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              Create Now
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}
