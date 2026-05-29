import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { 
  FileText, 
  Upload, 
  ArrowRight, 
  Mic, 
  Globe
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ResetDataButton from '@/components/ResetDataButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Recent notes
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('id, title, summary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

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

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-12">
      
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Create new notes and explore resources</p>
        </div>
        <ResetDataButton />
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
                className={`glass border border-border/80 rounded-2xl p-5 hover:border-primary/40 transition-colors duration-300 flex flex-col justify-between min-h-[140px] group glass-hover active-press animate-scale-in delay-${idx + 1}`}
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
