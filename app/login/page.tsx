'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState<'none' | 'request' | 'verify'>('none');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    router.push('/dashboard');
    router.refresh();
  };

  const handleGoogleLogin = async () => {
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

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setLoadingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setLoadingReset(false);
      return;
    }

    setLoadingReset(false);
    setForgotMode('verify');
    toast.success('Password recovery OTP sent! Please check your email.');
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6 || otpCode.length > 8) {
      toast.error('Please enter a valid verification code');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setLoadingReset(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: resetEmail,
      token: otpCode,
      type: 'recovery',
    });

    if (verifyError) {
      toast.error(verifyError.message);
      setLoadingReset(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      toast.error(updateError.message);
      setLoadingReset(false);
      return;
    }

    toast.success('Password updated successfully! Welcome back.');
    router.push('/dashboard');
    router.refresh();
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-xs text-muted-foreground mt-1.5">Sign in to continue studying</p>
        </div>

        {/* Clean Center Card */}
        <div className="glass border border-border/80 rounded-2xl p-8 shadow-2xl relative">
          {forgotMode === 'request' ? (
            <div className="space-y-6 animate-scale-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg">
                  🔑
                </div>
                <h2 className="text-lg font-bold text-foreground">Reset Password</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your email address below, and we'll send you a 6-digit OTP code to reset your password.
                </p>
              </div>

              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">Email Address</label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingReset}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  {loadingReset ? 'Sending OTP...' : 'Send Recovery OTP'}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setForgotMode('none');
                    setResetEmail('');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          ) : forgotMode === 'verify' ? (
            <div className="space-y-6 animate-scale-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto text-lg">
                  📥
                </div>
                <h2 className="text-lg font-bold text-foreground">Enter OTP & New Password</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We've sent a recovery code to <strong className="text-foreground">{resetEmail}</strong>. Please enter the OTP and your new password below.
                </p>
              </div>

              <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="otpCode" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5 text-center">
                    Recovery OTP
                  </label>
                  <input
                    id="otpCode"
                    type="text"
                    maxLength={8}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="Enter Code"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-sm tracking-widest text-center font-bold font-mono placeholder-muted-foreground/60"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingReset || otpCode.length < 6 || otpCode.length > 8 || newPassword.length < 8}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  {loadingReset ? 'Updating Password...' : 'Verify & Reset Password'}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setForgotMode('request');
                    setOtpCode('');
                    setNewPassword('');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:underline cursor-pointer"
                >
                  ← Resend OTP / Change Email
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleLogin}
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
                  <span className="bg-[#120f1b] px-3 font-semibold">or continue with email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
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
                  <div className="flex justify-between items-center mb-1.5 pl-0.5">
                    <label htmlFor="password" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotMode('request')}
                      className="text-[10px] font-bold text-primary hover:underline hover:text-primary-hover cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
                  />
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {/* Account redirect */}
              <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline font-bold ml-0.5">
                  Sign up free
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
