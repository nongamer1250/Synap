import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Zap,
  BookOpen,
  Sparkles,
  Brain,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  UploadCloud,
  Layers,
  Heart,
  Play,
  FileText,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import Logo from '@/components/layout/Logo';
import InteractiveShowcase from '@/components/layout/InteractiveShowcase';
import Mascot from '@/components/layout/Mascot';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased overflow-x-hidden relative">
      
      {/* Ambient background glow beams clipped perfectly to avoid vertical scrolling overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute left-1/2 -top-[10%] -translate-x-1/2 w-[90%] h-[60%] bg-gradient-beam-top blur-[120px] pointer-events-none" />
        <div className="absolute left-1/2 -bottom-[20%] -translate-x-1/2 w-[80%] h-[40%] bg-gradient-beam-bottom blur-[100px] pointer-events-none" />
      </div>
      
      {/* ── STICKY NAVIGATION HEADER ──────────────────────── */}
      <header data-nosnippet className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2.5 active-press">
            <Logo size={32} />
            <span className="font-bold text-xl tracking-tight gradient-text">Synap™</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              Common Questions
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 glow-on-hover flex items-center gap-2 active-press"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors active-press"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 glow-on-hover active-press"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION & MASCOT ────────────────────────── */}
      <section className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-10 animate-fade-in">
        
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Sparkles tag */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary animate-pulse-soft"
            style={{ color: 'hsl(var(--primary))' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Powering Active Learning with Premium 70B AI Models</span>
          </div>

          {/* Heading H1 with Mascot */}
          <div className="flex flex-col items-center justify-center gap-4">
            
            {/* The interactive brand mascot */}
            <Mascot />

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none">
              Turn Any Lecture Into <br />
              <span className="gradient-text animate-pulse-soft">Exam-Ready Notes</span> in Minutes.
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed pt-2">
            Upload lecture audio, syllabi PDFs, or paste YouTube links. Synap instantly generates highly detailed 
            study notes, active-recall flashcard decks, practice quizzes, and gives you a personalized AI Tutor.
          </p>
        </div>

        {/* Call to Actions */}
        <div data-nosnippet className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-all duration-200 glow-on-hover flex items-center justify-center gap-2 cursor-pointer active-press"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-all duration-200 glow-on-hover flex items-center justify-center gap-2 cursor-pointer active-press"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl font-bold border border-border text-foreground hover:bg-muted text-sm transition-all duration-200 flex items-center justify-center cursor-pointer active-press"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2.5 justify-center max-w-3xl mx-auto pt-6">
          {[
            '🎙️ Audio Transcription',
            '📝 AI Study Notes',
            '🃏 Smart Flashcards',
            '📊 Dynamic Quizzes',
            '🤖 Contextual AI Chat',
            '📄 PDF Upload',
            '🎥 YouTube Subtitles',
          ].map((feat) => (
            <span
              key={feat}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground border border-border/80 bg-muted/30"
            >
              {feat}
            </span>
          ))}
        </div>

        {/* ── CLIENT SIDE DYNAMIC UPLOAD INTERACTIVE SHOWCASE ──── */}
        <div className="pt-12">
          <InteractiveShowcase />
        </div>

      </section>

      {/* ── TRUSTED BY LOGO INFINITE SCROLL MARQUEE ────────── */}
      <section className="py-12 border-y border-border/30 bg-muted/10 relative z-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Designed for & trusted by top students from
          </span>
        </div>
        
        <div className="relative w-full h-[48px] overflow-hidden mt-6" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <div className="absolute flex animate-infinite-scroll">
            
            {/* Scroll item block 1 */}
            <div className="flex gap-16 items-center px-8 min-w-max select-none">
              <div className="flex items-center gap-3">
                <img src="/logos/iit-delhi.png" alt="IIT Delhi Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Delhi</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iit-bombay.png" alt="IIT Bombay Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Bombay</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iit-madras.png" alt="IIT Madras Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Madras</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/bits-pilani.png" alt="BITS Pilani Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">BITS Pilani</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/delhi-university.png" alt="Delhi University Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">Delhi University</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iit-kharagpur.png" alt="IIT Kharagpur Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Kharagpur</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iisc-bangalore.png" alt="IISc Bangalore Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IISc Bangalore</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/aiims-delhi.png" alt="AIIMS Delhi Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">AIIMS Delhi</span>
              </div>
            </div>
            
            {/* Scroll item block 2 (Duplicate for loop) */}
            <div className="flex gap-16 items-center px-8 min-w-max select-none">
              <div className="flex items-center gap-3">
                <img src="/logos/iit-delhi.png" alt="IIT Delhi Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Delhi</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iit-bombay.png" alt="IIT Bombay Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Bombay</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iit-madras.png" alt="IIT Madras Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Madras</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/bits-pilani.png" alt="BITS Pilani Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">BITS Pilani</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/delhi-university.png" alt="Delhi University Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">Delhi University</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iit-kharagpur.png" alt="IIT Kharagpur Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IIT Kharagpur</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/iisc-bangalore.png" alt="IISc Bangalore Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">IISc Bangalore</span>
              </div>
              <div className="flex items-center gap-3">
                <img src="/logos/aiims-delhi.png" alt="AIIMS Delhi Logo" className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 animate-fade-in" />
                <span className="text-sm font-bold text-muted-foreground/60">AIIMS Delhi</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BENTO GRID FEATURES OVERHAUL ───────────────────── */}
      <section id="features" className="py-24 border-b border-border/30 relative z-10 bg-muted/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto reveal-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Fully Equipped for Active Recall
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Synap integrates standard studying science utilities in one screen, allowing you to study 
              more thoroughly and save dozens of review hours.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
            
            {/* Bento Card 1: Study Notes (Double Width) */}
            <div className="md:col-span-2 glass border border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-colors duration-300 flex flex-col justify-between glass-hover reveal-left">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Premium 70B Study Notes</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Transcribe materials into dense, reason-rich study sheets made by Groq's premium 70B model. 
                  Divided into client-coordinated segments to guarantee zero serverless timeouts!
                </p>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono">
                <span className="px-2.5 py-1 rounded bg-muted">Markdown Formatting</span>
                <span className="px-2.5 py-1 rounded bg-muted">Key Concept Extraction</span>
                <span className="px-2.5 py-1 rounded bg-muted">Parallel Map-Reduce</span>
              </div>
            </div>

            {/* Bento Card 2: AI Chat Companion */}
            <div className="glass border border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-colors duration-300 flex flex-col justify-between glass-hover reveal-right">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">AI Chat Tutor</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  An AI chatbot sits directly next to your study notes, letting you clarify sections, ask definitions, and explain code instantly.
                </p>
              </div>
              
              <div className="mt-6 text-[10px] text-accent flex items-center gap-1 font-semibold font-mono">
                ⚡ RAG-based context parsing
              </div>
            </div>

            {/* Bento Card 3: Autogenerated Flashcards */}
            <div className="glass border border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-colors duration-300 flex flex-col justify-between glass-hover reveal-left">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Autogenerated Decks</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reinforce spaced-repetition. Review autogenerated decks linked directly to your notes to practice vocabulary, concepts, and definitions.
                </p>
              </div>
              
              <div className="mt-6 text-[10px] text-primary flex items-center gap-1 font-semibold font-mono">
                🧠 SM-2 Spaced repetition recall
              </div>
            </div>

            {/* Bento Card 4: Custom API Key (Double Width) */}
            <div className="md:col-span-2 glass border border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-colors duration-300 flex flex-col justify-between glass-hover neon-border-pulse reveal-right">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-success/15 border border-success/30 text-success">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Custom API Key Integration</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Save your own free Groq API Key locally in your browser. Bypass default rate limits completely, 
                  accessing unlimited generations completely for free, without subscription walls!
                </p>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] text-success font-semibold font-mono">
                <span>✓ 100% Free & Unlimited</span>
                <span>✓ Direct browser-secure local storage</span>
                <span>✓ No KYC Required</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ─────────────────────────── */}
      <section id="how-it-works" className="py-24 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto reveal-scale">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How Synap Works
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Go from a raw file or video to an active self-study dashboard in three simple, beautiful steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative glass border border-border p-8 rounded-2xl text-center space-y-4 glass-hover reveal-left">
            <div className="absolute top-4 right-6 text-3xl font-extrabold opacity-15 text-primary font-mono">01</div>
            <h3 className="text-base font-bold">1. Upload Lecture</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drop an MP3 or WAV audio lecture, drag in a textbook PDF, or paste any YouTube video link. 
              Synap extracts the transcript and compiles metadata.
            </p>
          </div>

          <div className="relative glass border border-border p-8 rounded-2xl text-center space-y-4 glass-hover reveal-on-scroll">
            <div className="absolute top-4 right-6 text-3xl font-extrabold opacity-15 text-primary font-mono">02</div>
            <h3 className="text-base font-bold">2. Segment Process</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our coordinator splits transcripts into short sections. Your browser processes each segment sequentially, 
              guaranteeing zero serverless timeouts!
            </p>
          </div>

          <div className="relative glass border border-border p-8 rounded-2xl text-center space-y-4 glass-hover reveal-right">
            <div className="absolute top-4 right-6 text-3xl font-extrabold opacity-15 text-primary font-mono">03</div>
            <h3 className="text-base font-bold">3. Study & Master</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instantly study beautifully formatted markdown notes, review autogenerated flashcard decks, 
              test your memory with quizzes, and chat with your notes!
            </p>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE FAQ SECTION ─────────────────────── */}
      <section id="faq" className="py-24 border-t border-border/30 bg-muted/5 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto reveal-scale">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Everything you need to know about Synap study tools, limits, and integrations.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* FAQ 1 */}
            <details className="group glass border border-border/60 rounded-2xl p-6 transition-all duration-300 open:bg-card/40 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-foreground list-none select-none">
                <span>Is Synap really free to use?</span>
                <span className="transition duration-300 group-open:-rotate-180">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </span>
              </summary>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed pl-1 animate-scale-in">
                Yes, completely! Synap is built by a student, for students. We operate on a generous free tier of **5 notes per day** using our shared API keys. If you want unlimited study materials, you can easily save your own free Groq API key in the settings, allowing you to use Synap infinitely for free!
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="group glass border border-border/60 rounded-2xl p-6 transition-all duration-300 open:bg-card/40 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-foreground list-none select-none">
                <span>What kinds of files can I upload for transcription?</span>
                <span className="transition duration-300 group-open:-rotate-180">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </span>
              </summary>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed pl-1 animate-scale-in">
                Synap supports standard audio formats (MP3, WAV, M4A), course slides and textbook PDFs, and public YouTube video links. For visual learners, our Syllabus Exam Prep engine even processes uploaded curriculum images using high-end Llama Vision OCR models!
              </p>
            </details>

            {/* FAQ 3 */}
            <details className="group glass border border-border/60 rounded-2xl p-6 transition-all duration-300 open:bg-card/40 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-foreground list-none select-none">
                <span>Are my custom API keys secure?</span>
                <span className="transition duration-300 group-open:-rotate-180">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </span>
              </summary>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed pl-1 animate-scale-in">
                Absolutely. Your custom Groq API keys are stored entirely inside your browser's local sandbox storage (`localStorage`). They never leave your device and are sent directly to the AI inference engine over HTTPS, ensuring your credentials remain 100% private.
              </p>
            </details>

            {/* FAQ 4 */}
            <details className="group glass border border-border/60 rounded-2xl p-6 transition-all duration-300 open:bg-card/40 cursor-pointer">
              <summary className="flex items-center justify-between font-bold text-sm text-foreground list-none select-none">
                <span>Does the study note generator suffer from time outs?</span>
                <span className="transition duration-300 group-open:-rotate-180">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </span>
              </summary>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed pl-1 animate-scale-in">
                No! Most AI study tools crash on long lectures due to serverless execution limits. Synap utilizes a proprietary client-side segmentation pipeline that breaks long transcripts into smaller chunks and compiles them sequentially, ensuring reliable, timeout-free note generation.
              </p>
            </details>

          </div>
        </div>
      </section>

      {/* ── FUND THE DEVELOPER & VISION SECTION ──────────── */}
      <section id="about" className="py-24 border-t border-border/30 relative z-10 bg-muted/5 reveal-scale">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
          >
            <Heart className="w-6 h-6 fill-current animate-pulse-soft text-red-500" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">Our Mission</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Synap was created out of a simple need: to make premium academic study aids accessible to 
              everyone, completely for free, without high paywalls or constant loading timeouts. 
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We leverage client-side segmentation and Groq's open weights inference engine to deliver 
              unmatched note quality without requiring expensive subscriptions. Synap is built to help 
              students take control of their learning.
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="inline-block glass border border-border/80 px-6 py-3 rounded-full text-xs font-semibold tracking-wide text-foreground">
              Built with <span className="text-red-500 mx-0.5">❤️</span> by a Student, for Students.
            </div>
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold tracking-wide transition-all active-press cursor-pointer"
            >
              ☕ Fund the Developer
            </Link>
          </div>
        </div>
      </section>

      {/* ── HIGH-INTENT FINAL CTA CARD ────────────────────── */}
      <section className="py-20 relative z-10 px-4 max-w-5xl mx-auto reveal-scale">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 p-8 sm:p-12 md:p-16 text-center space-y-6 shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(0, 0, 0, 0.6) 100%)' }}>
          <div className="absolute inset-0 bg-gradient-beam-top opacity-50 pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight max-w-xl mx-auto leading-tight">
            Unlock Your Academic Superpowers Today
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Join thousands of active students and professionals mastering their courses with Synap study tools. Free to start.
          </p>

          <div className="pt-4 flex justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-all duration-200 glow-on-hover flex items-center justify-center gap-2 cursor-pointer active-press"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-card py-12 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-6">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2 active-press">
              <Logo size={24} />
              <span className="font-bold text-sm tracking-tight text-foreground">Synap™</span>
            </Link>

            <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              <Link href="/support" className="hover:text-rose-400 font-semibold transition-colors">
                ☕ Support Us
              </Link>
              <Link href="/privacy" className="hover:text-foreground hover:underline transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground hover:underline transition-colors">
                Terms of Service
              </Link>
              <span>&copy; {new Date().getFullYear()} Synap™ . All rights reserved.</span>
            </div>
          </div>

          {/* Trademark Disclaimer */}
          <div className="w-full border-t border-border/20 pt-6 text-center">
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed max-w-3xl mx-auto">
              Disclaimer: Synap™ is an independent, student-built educational helper tool. All university names, logos, and trademarks displayed on this website are the sole property of their respective owners. Their display on this page does not imply, represent, or constitute any official affiliation, endorsement, or sponsorship by the institutions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
