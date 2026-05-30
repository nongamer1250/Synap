import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const startTime = Date.now();
  let user_id: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    user_id = user.id;

    // Enforce strict confirmation token check
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== 'WIPE_MY_DATA') {
      logger.warn('Accidental or unconfirmed data wipe request rejected', { userId: user.id, route: '/api/reset-data' });
      return NextResponse.json(
        { error: 'Confirmation token WIPE_MY_DATA is required to reset your data.' },
        { status: 400 }
      );
    }

    logger.info('User initiated critical study records data wipe', { userId: user.id, route: '/api/reset-data' });

    // Delete user data (cascades automatically due to foreign keys with ON DELETE CASCADE)
    const { error: uploadsError } = await supabase.from('uploads').delete().eq('user_id', user.id);
    const { error: notesError } = await supabase.from('notes').delete().eq('user_id', user.id);
    const { error: chatError } = await supabase.from('chat_sessions').delete().eq('user_id', user.id);

    if (uploadsError || notesError || chatError) {
      logger.error('Reset data databases execution failed', { uploadsError, notesError, chatError }, {
        userId: user.id,
        route: '/api/reset-data',
        latencyMs: Date.now() - startTime,
      });
      return NextResponse.json({ error: 'Failed to reset some data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Critical reset data endpoint handler failed', error, {
      userId: user_id || undefined,
      route: '/api/reset-data',
      latencyMs: Date.now() - startTime,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
