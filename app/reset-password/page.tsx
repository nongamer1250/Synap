'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired or invalid. Please request a new password recovery email.');
        router.push('/login');
        return;
      }
      setCheckingSession(false);
    };

    verifySession();
  }, [router, supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdating(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setUpdating(false);
      return;
    }

    toast.success('Your password has been successfully updated.');
    
    // Auto-redirect to dashboard
    router.push('/dashboard');
    router.refresh();
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#09070f] text-foreground flex items-center justify-center px-4 relative overflow-hidden before:content-[''] before:absolute before:left-1/2 before:-bottom-[20%] before:-translate-x-1/2 before:w-[80%] before:h-[40%] before:bg-gradient-beam-bottom before:pointer-events-none after:content-[''] after:absolute after:left-1/2 after:-top-[10%] after:-translate-x-1/2 after:w-[90%] after:h-[60%] after:bg-gradient-beam-top before:blur-[100px] after:blur-[120px] after:pointer-events-none">
        <div className="text-center relative z-10 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Verifying recovery session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09070f] text-foreground flex items-center justify-center px-4 relative overflow-hidden before:content-[''] before:absolute before:left-1/2 before:-bottom-[20%] before:-translate-x-1/2 before:w-[80%] before:h-[40%] before:bg-gradient-beam-bottom before:pointer-events-none after:content-[''] after:absolute after:left-1/2 after:-top-[10%] after:-translate-x-1/2 after:w-[90%] after:h-[60%] after:bg-gradient-beam-top before:blur-[100px] after:blur-[120px] after:pointer-events-none">
      
      <div className="w-full max-w-md animate-fade-in relative z-10 space-y-6">
        
        {/* Logo Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-primary/20"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              ⚡
            </div>
            <span className="font-bold text-xl tracking-tight gradient-text">Synap</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create new password</h1>
          <p className="text-xs text-muted-foreground mt-1.5">Please choose a strong password to secure your account</p>
        </div>

        {/* glass Card */}
        <div className="glass border border-border/80 rounded-2xl p-8 shadow-2xl relative">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">
                New Password
              </label>
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

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5 pl-0.5">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-xs placeholder-muted-foreground/60"
              />
            </div>

            <button
              type="submit"
              disabled={updating || password.length < 8 || password !== confirmPassword}
              className="w-full py-3.5 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed glow-on-hover active-press cursor-pointer flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              {updating ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:underline cursor-pointer">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
