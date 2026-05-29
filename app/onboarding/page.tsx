'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Search, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  'English',
  'Arabic',
  'Bengali',
  'Bulgarian',
  'Chinese',
  'Czech',
  'Danish',
  'Dutch',
  'French',
  'German',
  'Greek Modern (1453-)',
  'Hindi',
  'Indonesian',
  'Italian',
  'Japanese',
  'Korean',
  'Polish',
  'Portuguese',
  'Russian',
  'Spanish',
  'Swedish',
  'Turkish',
  'Urdu',
  'Vietnamese',
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState('');
  const [source, setSource] = useState('');
  const [language, setLanguage] = useState('English');
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);

  // Verify authentication first
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to complete onboarding');
        router.push('/login');
      } else {
        setSessionLoading(false);
      }
    }
    checkUser();
  }, []);

  // Step 4 Loader redirect
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const handleSourceSelect = (selectedSource: string) => {
    setSource(selectedSource);
  };

  const handleCompleteOnboarding = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          role,
          source,
          language,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setStep(4); // Move to loading screen
    } catch (e: any) {
      toast.error('An error occurred during onboarding: ' + e.message);
    }
  };

  const filteredLanguages = LANGUAGES.filter((lang) =>
    lang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#09070f] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09070f] text-foreground flex flex-col justify-between py-12 px-4 relative overflow-hidden before:content-[''] before:absolute before:left-1/2 before:-bottom-[20%] before:-translate-x-1/2 before:w-[80%] before:h-[40%] before:bg-gradient-beam-bottom before:pointer-events-none after:content-[''] after:absolute after:left-1/2 after:-top-[10%] after:-translate-x-1/2 after:w-[90%] after:h-[60%] after:bg-gradient-beam-top before:blur-[100px] after:blur-[120px] after:pointer-events-none select-none">
      
      {/* ── TOP PROGRESS BAR ──────────────────────────────── */}
      {step < 4 && (
        <div className="max-w-xl w-full mx-auto space-y-2 relative z-10 animate-fade-in">
          <div className="w-full bg-muted border border-border/60 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
            <span>Step {step} of 3</span>
            <span>Personalizing Synap</span>
          </div>
        </div>
      )}

      {/* ── MAIN PORTAL CARD ──────────────────────────────── */}
      <div className="flex-grow flex items-center justify-center py-8 relative z-10">
        
        {/* Step 1: Role Select */}
        {step === 1 && (
          <div className="w-full max-w-xl glass border border-border rounded-2xl p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">What describes you best?</h2>
              <p className="text-xs text-muted-foreground">We use this to personalize your experience - should only take 15 seconds! :)</p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { key: 'undergrad', label: 'Undergraduate Student', emoji: '📚' },
                { key: 'grad', label: 'Graduate Student', emoji: '🎓' },
                { key: 'pro', label: 'Working Professional', emoji: '💼' },
                { key: 'teacher', label: 'Teacher / Professor', emoji: '👨‍🏫' },
                { key: 'high', label: 'High School Student', emoji: '🎓' },
                { key: 'middle', label: 'Middle School Student', emoji: '🎒' },
                { key: 'other', label: 'Other', emoji: '❓' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleRoleSelect(item.key)}
                  className={`w-full py-3.5 px-6 rounded-xl border text-left text-sm font-semibold tracking-wide transition active-press cursor-pointer flex items-center gap-3 ${
                    role === item.key
                      ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-lg shadow-primary/5'
                      : 'border-border/60 hover:bg-muted bg-card/20 text-foreground'
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-between gap-4">
              <button
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide py-2 active-press cursor-pointer"
              >
                Skip Question
              </button>
              
              <button
                disabled={!role}
                onClick={() => setStep(2)}
                className="px-8 py-3 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Referral Source */}
        {step === 2 && (
          <div className="w-full max-w-xl glass border border-border rounded-2xl p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">How did you hear about Synap?</h2>
              <p className="text-xs text-muted-foreground">This helps us understand how students find us!</p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { key: 'tiktok', label: 'TikTok', emoji: '📱' },
                { key: 'youtube', label: 'YouTube', emoji: '🎥' },
                { key: 'instagram', label: 'Instagram', emoji: '📸' },
                { key: 'twitter', label: 'Twitter / X', emoji: '🐦' },
                { key: 'friend', label: 'A Friend', emoji: '👥' },
                { key: 'search', label: 'Google Search', emoji: '🔍' },
                { key: 'store', label: 'App Store', emoji: '🏪' },
                { key: 'other', label: 'Other', emoji: '❓' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleSourceSelect(item.key)}
                  className={`w-full py-3.5 px-6 rounded-xl border text-left text-sm font-semibold tracking-wide transition active-press cursor-pointer flex items-center gap-3 ${
                    source === item.key
                      ? 'bg-accent/10 border-accent/40 text-accent font-bold shadow-lg shadow-accent/5'
                      : 'border-border/60 hover:bg-muted bg-card/20 text-foreground'
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-between gap-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide py-2 active-press cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide py-2 active-press cursor-pointer"
                >
                  Skip Question
                </button>
              </div>
              
              <button
                disabled={!source}
                onClick={() => setStep(3)}
                className="px-8 py-3 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Language Select */}
        {step === 3 && (
          <div className="w-full max-w-xl glass border border-border rounded-2xl p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">What language do you study in?</h2>
              <p className="text-xs text-muted-foreground">We'll generate notes, flashcards, and quizzes in your language.</p>
            </div>

            <div className="space-y-4">
              
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                />
              </div>

              {/* Scrollable list */}
              <div className="max-h-60 overflow-y-auto border border-border/80 rounded-xl divide-y divide-border/40 bg-card/20">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`w-full py-3 px-6 text-left text-xs font-semibold tracking-wide transition active-press cursor-pointer flex justify-between items-center ${
                        language === lang
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span>{lang}</span>
                      {language === lang && <span>✓ Selected</span>}
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No matching languages found
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide py-2 active-press cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleCompleteOnboarding}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide py-2 active-press cursor-pointer"
                >
                  Skip Question
                </button>
              </div>
              
              <button
                onClick={handleCompleteOnboarding}
                className="px-8 py-3 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 glow-on-hover active-press cursor-pointer"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Loading Personalization Spinner */}
        {step === 4 && (
          <div className="w-full max-w-md glass border border-border rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-scale-in">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span className="text-3xl animate-mascot-float">⚡</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Welcome to Synap!</h3>
              <p className="text-xs text-muted-foreground">Almost done... personalizing your dashboard :)</p>
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER COMPLIANCE ──────────────────────────────── */}
      {step < 4 && (
        <div className="text-center text-[9px] uppercase tracking-widest text-muted-foreground/30 relative z-10">
          Synap Onboarding Setup • Secure Client Session
        </div>
      )}

    </div>
  );
}
