import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userProfile = profile ?? {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email || 'Student',
    avatar_url: user.user_metadata?.avatar_url || null,
    created_at: user.created_at,
  };

  return (
    <DashboardShell user={userProfile}>
      {children}
    </DashboardShell>
  );
}
