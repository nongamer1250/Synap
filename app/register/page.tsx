'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      toast.success('Account created successfully!');
      router.push('/dashboard');
      router.refresh();
      return;
    }

    setLoading(false);
    setShowOtpScreen(true);
    toast.success('Sign up successful! Please check your email for the 6-digit confirmation code.');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup'
    });

    if (error) {
      toast.error(error.message);
      setVerifying(false);
      return;
    }

    toast.success('Email confirmed successfully! Welcome to Synap!');
    router.push('/dashboard');
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    const isApp = typeof window !== 'undefined' && (window.navigator.userAgent.includes('SynapAndroid') || !!(window as any).Capacitor);
    const redirectTo = isApp 
      ? 'bond.synap.app://auth/callback' 
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-[#09070f] text-foreground flex items-center justify-center px-4 relative overflow-hidden before:content-[''] before:absolute before:left-1/2 before:-bottom-[20%] before:-translate-x-1/2 before:w-[80%] before:h-[40%] before:bg-gradient-beam-bottom before:pointer-events-none after:content-[''] after:absolute after:left-1/2 after:-top-[10%] after:-translate-x-1/2 after:w-[90%] after:h-[60%] after:bg-gradient-beam-top before:blur-[100px] after:blur-[120px] after:pointer-events-none">
      
      <div className="w-full max-w-md animate-fade-in relative z-10 space-y-6">
        
        {/* Logo Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:scale-[1.02] active-press transition">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-primary/20"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              ⚡
            </div>
            <span className="font-bold text-xl tracking-tight gradient-text">Synap</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Sign Up</h1>
          <p className="text-xs text-muted-foreground mt-1.5">Create notes in minutes. No credit card required.</p>
        </div>

        {/* Clean Center Card */}
        <div className="glass border border-border/80 rounded-2xl p-8 shadow-2xl relative">
          {showOtpScreen ? (
            <div className="space-y-6 animate-scale-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg">
                  📧
                </div>
                <h2 className="text-lg font-bold text-foreground">Confirm your Email</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We've sent a 6-digit confirmation code to <strong className="text-foreground">{email}</strong>. Please enter the code below to verify your account.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otpCode" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5 text-center">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-sm tracking-widest text-center font-bold font-mono placeholder-muted-foreground/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || otpCode.length !== 6}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  {verifying ? 'Verifying Code...' : 'Verify & Sign In'}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowOtpScreen(false);
                    setOtpCode('');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:underline"
                >
                  ← Back to Sign Up
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-muted/60 hover:bg-secondary/80 transition-all font-medium text-sm active-press cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="bg-[#120f1b] px-3 font-semibold">or</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                
                {/* First and Last Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">First name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Alex"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">Last name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Johnson"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                  />
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  {loading ? 'Creating account…' : 'Create an account'}
                </button>
              </form>

              {/* Account redirect */}
              <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-bold ml-0.5">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer compliance links */}
        <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/50 space-x-3">
          <Link href="/privacy" className="hover:text-foreground transition-colors hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground transition-colors hover:underline">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
