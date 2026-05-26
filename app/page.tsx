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
} from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-[100px] animate-orb-float-1"
          style={{ background: 'radial-gradient(circle, hsl(255 85% 68%), transparent)' }}
        />
        <div
          className="absolute bottom-1/4 left-0 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] animate-orb-float-2"
          style={{ background: 'radial-gradient(circle, hsl(280 70% 65%), transparent)' }}
        />
      </div>

      {/* Nav Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-white"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl tracking-tight gradient-text">Synap</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#about" className="hover:text-foreground transition-colors">
              Our Vision
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 glow-on-hover flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200 glow-on-hover"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="space-y-4 max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary animate-pulse-soft"
            style={{ color: 'hsl(var(--primary))' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powering Active Learning with Premium 70B AI</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Study Smarter with <br />
            <span className="gradient-text">AI-Powered</span> Notes
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed pt-2">
            Upload lecture audio, PDFs, or paste YouTube links. Synap instantly generates highly detailed 
            study notes, flashcard decks, interactive quizzes, and gives you a personalized AI Tutor.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-all duration-200 glow-on-hover flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-all duration-200 glow-on-hover flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl font-bold border border-border text-foreground hover:bg-muted text-sm transition-all duration-200 flex items-center justify-center cursor-pointer"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Feature pills */}
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

        {/* Dashboard Visual Mockup */}
        <div className="pt-16 max-w-5xl mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-all duration-500 pointer-events-none" />
          <div className="relative glass border border-border/80 rounded-2xl overflow-hidden shadow-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Mock Card 1: Notes preview */}
            <div className="rounded-xl border border-border/60 bg-card/60 p-5 flex flex-col justify-between min-h-[220px] animate-float-1">
              <div>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-3">
                  <BookOpen className="w-4 h-4" />
                  <span>Interactive Study Notes</span>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-base">## CS50: Python Functions</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A **function** is a block of code that only runs when called. You define one with the <strong>def</strong> keyword.
                </p>
                <div className="space-y-1.5 mt-3">
                  <div className="text-[10px] text-muted-foreground/90 font-mono">def hello(to="world"):</div>
                  <div className="text-[10px] text-primary/95 font-mono pl-4">print(f"hello, {'{to}'}")</div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Section 1 of 5
              </span>
            </div>

            {/* Mock Card 2: AI Chat Preview */}
            <div className="rounded-xl border border-border/60 bg-card/60 p-5 flex flex-col justify-between min-h-[220px] animate-float-2">
              <div>
                <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-3">
                  <MessageSquare className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
                  <span>Context-Aware AI Tutor</span>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground leading-snug">
                    "How do parameters work in Python?"
                  </div>
                  <div className="rounded-lg bg-primary/10 border border-primary/10 p-2.5 text-xs text-foreground leading-snug">
                    💡 **Tutor:** Parameters act as placeholders. When calling <code>hello("Alice")</code>, "Alice" is passed as the argument.
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Live AI Assistant
              </span>
            </div>

            {/* Mock Card 3: Quiz/Flashcard Preview */}
            <div className="rounded-xl border border-border/60 bg-card/60 p-5 flex flex-col justify-between min-h-[220px] animate-float-3">
              <div>
                <div className="flex items-center gap-2 text-success font-semibold text-sm mb-3">
                  <Brain className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} />
                  <span>Flashcards & Quizzes</span>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/30 text-center space-y-3">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Question 4 of 10
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">
                    What is the default argument in our hello() function?
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1 text-[10px]">
                    <div className="py-1 px-3 rounded bg-primary/15 border border-primary/30 text-primary font-medium">
                      ✓ "world"
                    </div>
                    <div className="py-1 px-3 rounded bg-muted/60 text-muted-foreground">
                      ✗ "to"
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Self-Review Active
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-24 border-y border-border/40 relative z-10 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Fully Equipped for Active Recall
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Synap integrates standard studying science utilities in one screen, allowing you to study 
              more thoroughly and save dozens of review hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass border border-border/60 rounded-2xl p-6 space-y-4 hover:border-primary/40 transition-colors duration-300">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Lecture Transcriptions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide audio uploads, PDFs, or YouTube links. Synap utilizes advanced speech-to-text models 
                to construct exact, logical lecture transcripts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass border border-border/60 rounded-2xl p-6 space-y-4 hover:border-primary/40 transition-colors duration-300">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Premium 70B Study Notes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Divided into client-coordinated segments to guarantee zero serverless timeouts, returning 
                dense, reason-rich study sheets made by Groq's premium 70B model.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass border border-border/60 rounded-2xl p-6 space-y-4 hover:border-primary/40 transition-colors duration-300">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Autogenerated Flashcards</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reinforce spaced-repetition. Review autogenerated decks linked directly to your notes 
                to practice vocabulary, concepts, and definitions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass border border-border/60 rounded-2xl p-6 space-y-4 hover:border-primary/40 transition-colors duration-300">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Interactive Quizzes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Test your knowledge retention. Take multiple-choice review quizzes made from your uploads, 
                featuring explanations for correct answers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass border border-border/60 rounded-2xl p-6 space-y-4 hover:border-primary/40 transition-colors duration-300">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">AI Chat Companion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Engage with your materials directly. An AI chatbot sits next to your notes, letting you 
                clarify sections, ask definitions, and explain code instantly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass border border-border/60 rounded-2xl p-6 space-y-4 hover:border-primary/40 transition-colors duration-300">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Custom API Key Integration</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Save your own free Groq API Key locally in your browser. Bypass default quotas and enjoy 
                unlimited generations completely for free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How Synap Works
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Go from a raw file or video to an active self-study dashboard in three simple, beautiful steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative glass border border-border p-8 rounded-2xl text-center space-y-4">
            <div className="absolute top-4 right-6 text-3xl font-extrabold opacity-15 text-primary">01</div>
            <h3 className="text-base font-bold">1. Upload Lecture</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drop an MP3 or WAV audio lecture, drag in a textbook PDF, or paste any YouTube video link. 
              Synap extracts the transcript and compiles metadata.
            </p>
          </div>

          <div className="relative glass border border-border p-8 rounded-2xl text-center space-y-4">
            <div className="absolute top-4 right-6 text-3xl font-extrabold opacity-15 text-primary">02</div>
            <h3 className="text-base font-bold">2. Segment Process</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our coordinator splits transcripts into short sections. Your browser processes each segment sequentially, 
              guaranteeing zero serverless timeouts!
            </p>
          </div>

          <div className="relative glass border border-border p-8 rounded-2xl text-center space-y-4">
            <div className="absolute top-4 right-6 text-3xl font-extrabold opacity-15 text-primary">03</div>
            <h3 className="text-base font-bold">3. Study & Master</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instantly study beautifully formatted markdown notes, review autogenerated flashcard decks, 
              test your memory with quizzes, and chat with your notes!
            </p>
          </div>
        </div>
      </section>

      {/* Credit & Vision Section */}
      <section id="about" className="py-24 border-t border-border/40 relative z-10 bg-muted/5">
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

          <div className="pt-6">
            <div className="inline-block glass border border-border/80 px-6 py-3 rounded-full text-xs font-semibold tracking-wide text-foreground">
              Built with <span className="text-red-500 mx-0.5">❤️</span> by a Student, for Students.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card py-12 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              ⚡
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">Synap</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground hover:underline transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground hover:underline transition-colors">
              Terms of Service
            </Link>
            <span>&copy; {new Date().getFullYear()} Synap. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
