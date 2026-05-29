import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen,
  ArrowDownToLine
} from 'lucide-react';
import Logo from '@/components/layout/Logo';

export const metadata = {
  title: 'Free PDF to Study Notes AI Generator | Convert Files Instantly | Synap',
  description: 'Upload textbook PDF chapters, class slides, or course outlines and instantly generate detailed, concept-structured active study notes. Completely free.',
};

export default function PdfToNotesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased overflow-x-hidden relative">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute left-1/2 -top-[10%] -translate-x-1/2 w-[90%] h-[60%] bg-gradient-beam-top blur-[120px] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 active-press">
            <Logo size={32} />
            <span className="font-bold text-xl tracking-tight gradient-text">Synap™</span>
          </Link>
          <div className="flex items-center gap-4">
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
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Sparkles tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary animate-pulse-soft">
            <FileText className="w-3.5 h-3.5" />
            <span>Premium PDF Text Mining & Structuring</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Free Online <br />
            <span className="gradient-text animate-pulse-soft">PDF to Study Notes AI</span>
          </h1>

          <div className="flex justify-center pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-success/10 border border-success/20 text-success text-xs font-bold shadow-sm">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Converts large, dense lecture slides or textbooks in seconds.</span>
            </div>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop highlighting endless lines in textbooks. Synap extracts core facts from uploaded documents and 
            structures them into beautifully styled, markdown study guides complete with conceptual tables.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl font-bold text-white text-sm transition-all duration-200 glow-on-hover flex items-center justify-center gap-2 cursor-pointer active-press"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
          >
            Upload PDF & Generate Notes <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="/synap-study.apk"
            download="synap-study.apk"
            className="px-8 py-4 rounded-xl font-bold border border-border text-foreground hover:bg-muted text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active-press"
          >
            📱 Download Android App
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <section className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          <div className="glass border border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-colors duration-300">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4" style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">No Timeout Extraction</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our unique client-side text extraction processes textbooks seamlessly, avoiding server timeouts and file size upload boundaries.
            </p>
          </div>

          <div className="glass border border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-colors duration-300">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4" style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Semantic Structure</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We do not just summarize. We extract high-yield concepts, core theories, detailed evaluation steps, and autogenerated key summaries.
            </p>
          </div>

          <div className="glass border border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-colors duration-300">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4" style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Download & Export</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keep your generated notes secure. Export to high-quality formatted PDFs or copy beautiful markdown to Anki and Notion.
            </p>
          </div>
        </section>

        {/* Live Mock Showcase Card */}
        <section className="pt-8 max-w-4xl mx-auto">
          <div className="glass border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden bg-card/60 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-xs font-black uppercase tracking-wider">Concept-Structured study guide preview</span>
              </div>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                autogenerated notes
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">💡 Concept 1: MapReduce Parallel Architecture</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  MapReduce is a programming model designed for processing massive datasets with a parallel, distributed algorithm on a cluster.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-border/40 pt-3">
                <div>
                  <span className="font-bold text-foreground uppercase block">Phase 1: MAP</span>
                  <span className="text-muted-foreground leading-relaxed">Filters and sorts data (e.g. groups student IDs by subject).</span>
                </div>
                <div>
                  <span className="font-bold text-foreground uppercase block">Phase 2: REDUCE</span>
                  <span className="text-muted-foreground leading-relaxed">Aggregates sorted results (e.g. sums up subject grades to calculate final average).</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card py-12 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Synap™ . All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
