'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  GraduationCap, 
  Cpu, 
  Lightbulb, 
  Award, 
  Zap, 
  Globe, 
  Landmark,
  BookmarkPlus 
} from 'lucide-react';

const UNIVERSITIES = [
  // Global
  {
    id: 'stanford',
    title: 'Stanford University',
    type: 'Global',
    icon: GraduationCap,
    gradient: 'from-rose-500/10 to-red-500/10',
    border: 'border-rose-500/20',
    badge: '🌲 Stanford',
    desc: 'Computer Science, Engineering & Business curated guides',
    color: 'hsl(354 70% 54%)'
  },
  {
    id: 'harvard',
    title: 'Harvard University',
    type: 'Global',
    icon: Landmark,
    gradient: 'from-amber-500/10 to-red-500/10',
    border: 'border-red-500/20',
    badge: '🏛️ Harvard',
    desc: 'Economics, Law & Humanities expert collections',
    color: 'hsl(354 85% 44%)'
  },
  {
    id: 'mit',
    title: 'Massachusetts Institute of Technology',
    type: 'Global',
    icon: Cpu,
    gradient: 'from-cyan-500/10 to-blue-500/10',
    border: 'border-blue-500/20',
    badge: '💻 MIT',
    desc: 'Advanced Physics, AI & Mathematics research notes',
    color: 'hsl(217 91% 60%)'
  },
  {
    id: 'oxford',
    title: 'Oxford University',
    type: 'Global',
    icon: BookOpen,
    gradient: 'from-indigo-500/10 to-blue-500/10',
    border: 'border-blue-500/20',
    badge: '📘 Oxford',
    desc: 'Philosophy, Politics & Classical Literature guides',
    color: 'hsl(224 76% 48%)'
  },
  // Indian
  {
    id: 'iit-delhi',
    title: 'IIT Delhi',
    type: 'Indian',
    icon: Award,
    gradient: 'from-teal-500/10 to-emerald-500/10',
    border: 'border-emerald-500/20',
    badge: '🎓 IIT Delhi',
    desc: 'Mechanical, Electrical Engineering & Coding resources',
    color: 'hsl(142 71% 45%)'
  },
  {
    id: 'iit-bombay',
    title: 'IIT Bombay',
    type: 'Indian',
    icon: Lightbulb,
    gradient: 'from-yellow-500/10 to-amber-500/10',
    border: 'border-amber-500/20',
    badge: '⚡ IIT Bombay',
    desc: 'Aerospace, Chemical Engineering & Startup bootcamps',
    color: 'hsl(38 92% 50%)'
  },
  {
    id: 'bits-pilani',
    title: 'BITS Pilani',
    type: 'Indian',
    icon: Zap,
    gradient: 'from-purple-500/10 to-violet-500/10',
    border: 'border-violet-500/20',
    badge: '💡 BITS Pilani',
    desc: 'Computer Science, Electronics & Finance guides',
    color: 'hsl(271 91% 65%)'
  },
  {
    id: 'delhi-university',
    title: 'Delhi University',
    type: 'Indian',
    icon: Globe,
    gradient: 'from-pink-500/10 to-rose-500/10',
    border: 'border-rose-500/20',
    badge: '🌺 Delhi University',
    desc: 'Commerce, Political Science & English Literature prep',
    color: 'hsl(330 81% 60%)'
  }
];

export default function UniversityGuides() {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Global' | 'Indian'>('All');

  const filteredUniversities = UNIVERSITIES.filter(
    (uni) => selectedFilter === 'All' || uni.type === selectedFilter
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1 pl-0.5">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
          <span>🏫 University Libraries</span>
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Explore curated study guides from top global and Indian universities!
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(['All', 'Global', 'Indian'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition cursor-pointer active-press ${
              selectedFilter === filter
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {filter === 'All' ? 'All' : filter === 'Global' ? 'Global Universities' : 'Indian Universities'}
          </button>
        ))}
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {filteredUniversities.map((uni, idx) => {
          const Icon = uni.icon;
          return (
            <div
              key={uni.id}
              className={`glass border border-border/80 rounded-2xl p-6 hover:border-primary/40 transition-colors duration-300 flex flex-col justify-between min-h-[180px] group glass-hover active-press animate-scale-in delay-${(idx % 4) + 1}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] uppercase tracking-widest text-primary font-bold font-mono">
                    {uni.badge}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${uni.gradient} border ${uni.border} text-primary`}>
                    <Icon className="w-4.5 h-4.5" style={{ color: uni.color }} />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                  {uni.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                  {uni.desc}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {uni.type === 'Global' ? 'Global' : 'Indian'} Curated
                </span>
                
                <Link 
                  href={`/dashboard/upload?uni=${uni.id}`}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-accent transition-colors cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Add to Dashboard
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
