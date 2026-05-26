import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user data (cascades automatically due to foreign keys with ON DELETE CASCADE)
    const { error: uploadsError } = await supabase.from('uploads').delete().eq('user_id', user.id);
    const { error: notesError } = await supabase.from('notes').delete().eq('user_id', user.id);
    const { error: chatError } = await supabase.from('chat_sessions').delete().eq('user_id', user.id);

    if (uploadsError || notesError || chatError) {
      console.error('Reset data error:', { uploadsError, notesError, chatError });
      return NextResponse.json({ error: 'Failed to reset some data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset data endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
