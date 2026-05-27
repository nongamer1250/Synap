'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Key, ExternalLink, Sparkles, CheckCircle2, Copy } from 'lucide-react';
import Logo from '@/components/layout/Logo';

export default function GroqGuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased overflow-x-hidden relative py-16 px-4">
      
      {/* Background ambient orbs (Static for extreme mobile performance) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.07] blur-[80px]"
          style={{ background: 'radial-gradient(circle, hsl(255 85% 68%), transparent)' }}
        />
        <div
          className="absolute bottom-1/4 left-0 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px]"
          style={{ background: 'radial-gradient(circle, hsl(280 70% 65%), transparent)' }}
        />
      </div>

      <div className="w-full max-w-3xl mx-auto relative z-10 space-y-8 animate-fade-in">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <Link href="/dashboard/upload" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium group active-press">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Upload
          </Link>
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-bold text-sm tracking-tight gradient-text">Synap™</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse-soft" />
            <span>100% Free & Unlimited Generations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How to Get a Free <br />
            <span className="gradient-text">Groq API Key</span> in 60 Seconds
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            By default, Synap has a daily limit of 2 notes. Adding your own free API Key unlocks unlimited notes, flashcards, and quizzes! Follow this easy guide.
          </p>
        </div>

        {/* Visual Screenshot Container */}
        <div className="glass border border-border rounded-2xl overflow-hidden shadow-2xl p-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50 pointer-events-none rounded-2xl" />
          <img
            src="/groq_guide.png"
            alt="Groq console screenshot showing how to create API key"
            className="w-full h-auto rounded-xl object-cover"
          />
          <div className="p-4 bg-card/60 backdrop-blur-sm border-t border-border/40 rounded-b-xl text-xs text-muted-foreground text-center">
            📸 Illustration of the Groq Developer Console API Keys creation screen.
          </div>
        </div>

        {/* Step by Step Guide Cards */}
        <div className="space-y-4">
          
          {/* Step 1 */}
          <div className="glass border border-border/80 rounded-2xl p-6 flex gap-4 items-start hover:border-primary/20 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
              1
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base">Open the Groq Developer Console</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Click this link to open the portal in a new window:{' '}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  console.groq.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground/80 italic">
                💡 Log in with your existing **Google account** (it takes 1 click and is completely free).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass border border-border/80 rounded-2xl p-6 flex gap-4 items-start hover:border-primary/20 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
              2
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base">Go to "API Keys" in the Left Menu</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Look at the left sidebar menu on your screen. Tap on the option called **"API Keys"** (it is next to the key icon 🔑).
              </p>
              <p className="text-xs text-muted-foreground/80 italic">
                📱 If you are on a mobile phone, tap the three-line menu icon in the top corner to show the sidebar first.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass border border-border/80 rounded-2xl p-6 flex gap-4 items-start hover:border-primary/20 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
              3
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base">Click "Create API Key"</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                In the middle of the screen, tap the prominent purple or white button labeled **"Create API Key"**.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="glass border border-border/80 rounded-2xl p-6 flex gap-4 items-start hover:border-primary/20 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
              4
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base">Name Your Key and Copy it</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Type <code className="text-primary bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">Synap</code> as the name and hit submit. 
                A long secret key starting with <code className="text-primary font-mono">gsk_...</code> will pop up on your screen. 
              </p>
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mt-2 text-xs text-yellow-200/90 leading-relaxed">
                ⚠️ **Crucial step**: Tap the **"Copy"** button immediately! For your privacy, Groq will never show this key to you again. If you close the box without copying it, just delete that key and click "Create API Key" again.
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="glass border border-border/80 rounded-2xl p-6 flex gap-4 items-start hover:border-primary/20 transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
              5
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base">Paste and Save in Synap!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Head back to the Synap dashboard upload page. Expand the **Daily Free Tier** settings, paste your key in the input box, and tap **"Save"**.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Done! Your account now has unlimited high-speed AI note generations.
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="text-center pt-8 border-t border-border/40">
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 glow-on-hover cursor-pointer active-press"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
          >
            Go to Upload Screen & Paste Key
          </Link>
          <p className="text-[10px] text-muted-foreground mt-3">
            Your key is saved 100% locally in your own browser's cache. We never send or save it on our servers.
          </p>
        </div>

      </div>
    </div>
  );
}
