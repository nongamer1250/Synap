import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { FileText, Upload, CreditCard, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ResetDataButton from '@/components/ResetDataButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch stats in parallel
  const [uploadsRes, notesRes, flashcardsRes, quizzesRes] = await Promise.all([
    supabase.from('uploads').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('flashcards').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('quizzes').select('id', { count: 'exact' }).eq('user_id', user.id),
  ]);

  // Recent notes
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('id, title, summary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = [
    { label: 'Uploads', value: uploadsRes.count ?? 0, icon: Upload, color: 'hsl(255 85% 68%)' },
    { label: 'Study Notes', value: notesRes.count ?? 0, icon: FileText, color: 'hsl(142 71% 65%)' },
    { label: 'Flashcards', value: flashcardsRes.count ?? 0, icon: CreditCard, color: 'hsl(38 92% 65%)' },
    { label: 'Quizzes', value: quizzesRes.count ?? 0, icon: HelpCircle, color: 'hsl(280 70% 65%)' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Overview</h1>
          <ResetDataButton />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }, index) => (
            <div 
              key={label} 
              className={`glass rounded-2xl p-5 border border-border glass-hover active-press animate-scale-in delay-${(index % 4) + 1} flex items-center sm:block gap-4 cursor-pointer`}
            >
              <div className="w-12 h-12 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110"
                style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5 sm:w-4.5 sm:h-4.5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
 
      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-4 animate-slide-up delay-2">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/upload"
            className="glass rounded-2xl p-5 border border-border glass-hover active-press animate-slide-up delay-2 group flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold transition-colors group-hover:text-primary">Upload & Transcribe</h3>
              <p className="text-sm text-muted-foreground">Upload audio or PDF to get started</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
 
          <Link href="/dashboard/chat"
            className="glass rounded-2xl p-5 border border-border glass-hover active-press animate-slide-up delay-3 group flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, hsl(142 71% 65%), hsl(158 64% 52%))' }}>
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold transition-colors group-hover:text-success">Chat with Notes</h3>
              <p className="text-sm text-muted-foreground">Ask questions about your lecture</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-success transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      </section>
 
      {/* Recent Notes */}
      <section>
        <div className="flex items-center justify-between mb-4 animate-slide-up delay-3">
          <h2 className="text-lg font-semibold">Recent Notes</h2>
          <Link href="/dashboard/notes" className="text-sm text-primary hover:underline transition-all active-press">
            View all →
          </Link>
        </div>
 
        {recentNotes && recentNotes.length > 0 ? (
          <div className="space-y-3">
            {recentNotes.map((note, index) => (
              <Link key={note.id} href={`/dashboard/notes/${note.id}`}
                className={`glass rounded-xl p-4 border border-border glass-hover active-press animate-slide-up delay-${(index % 3) + 3} flex items-start gap-4 group cursor-pointer`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'hsl(255 85% 68% / 0.15)' }}>
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium group-hover:text-primary transition-colors truncate">{note.title}</h3>
                  {note.summary && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{note.summary}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-1">{formatDate(note.created_at)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 border border-border text-center animate-slide-up delay-4">
            <div className="text-4xl mb-3 animate-bounce-dot">📚</div>
            <h3 className="font-semibold mb-1">No notes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload your first lecture to get started</p>
            <Link href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white active-press hover:shadow-lg hover:shadow-primary/25 transition-all"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              Upload Now
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
