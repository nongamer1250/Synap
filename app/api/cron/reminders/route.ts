import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mail';

export const maxDuration = 60; // Allow enough execution time for processing multiple users

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const authHeader = request.headers.get('authorization');

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const isAuthorized = token === expectedSecret || authHeader === `Bearer ${expectedSecret}`;
      if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createAdminClient();

    // Fetch all registered users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError || !users) {
      throw new Error(usersError?.message || 'Failed to retrieve user directory.');
    }

    const results = [];

    // Calculate dates in YYYY-MM-DD local format
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localToday = new Date(today.getTime() - tzOffset);
    const todayStr = localToday.toISOString().substring(0, 10);

    const yesterday = new Date(today.getTime() - tzOffset);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    for (const user of users) {
      if (!user.email) continue;

      const streak = user.user_metadata?.study_streak || 0;
      const lastStudyDateStr = user.user_metadata?.last_study_date || null;
      const fullName = user.user_metadata?.full_name || user.email.split('@')[0] || 'Student';

      // Check if studied yesterday but has not studied yet today (streak warning)
      const isStreakAtRisk = streak > 0 && lastStudyDateStr === yesterdayStr;

      // Query flashcards count due for review
      const { count: dueCount, error: cardError } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('due_date', new Date().toISOString());

      if (cardError) {
        console.warn(`Failed to retrieve flashcard counts for user ${user.id}:`, cardError);
      }

      const finalDueCount = dueCount || 0;

      // If streak is at risk or cards are due, compile the email digest
      if (isStreakAtRisk || finalDueCount > 0) {
        let emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 28px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
              <h2 style="color: #6366f1; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Synap™</h2>
              <p style="font-size: 13px; color: #64748b; margin: 6px 0 0 0; font-weight: 500; text-transform: uppercase; tracking-wider: 1px;">Your Active Learning Digest</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #0f172a;">Hello <strong>${fullName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Here is your customized daily review digest. Log in today to keep your study goals on track!</p>
            
            <div style="margin: 24px 0; padding: 20px; border-radius: 12px; background-color: #f8fafc; border-left: 4px solid #6366f1; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Action Items:</h3>
              <ul style="padding-left: 20px; margin: 12px 0 0 0; font-size: 14px; line-height: 1.8; color: #334155;">
        `;

        if (isStreakAtRisk) {
          emailHtml += `
            <li style="margin-bottom: 10px;">
              🔥 <strong>Study Streak at Risk:</strong> Keep your <strong>${streak}-day</strong> study streak alive! Log in and study a topic or flashcard deck before midnight to keep your flame burning.
            </li>
          `;
        }

        if (finalDueCount > 0) {
          emailHtml += `
            <li style="margin-bottom: 10px;">
              🃏 <strong>Flashcard Review Due:</strong> You have <strong>${finalDueCount}</strong> flashcards waiting for review in your active recall deck. Practice them today to strengthen your neural connections.
            </li>
          `;
        }

        emailHtml += `
              </ul>
            </div>
            
            <div style="text-align: center; margin: 32px 0 12px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.synap.bond'}/dashboard" style="background-color: #6366f1; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 10px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(99,102,241,0.25);">
                Open Study Dashboard
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 24px 0;" />
            <p style="font-size: 11px; text-align: center; color: #94a3b8; line-height: 1.6; margin: 0;">
              You are receiving this digest because you are a registered user of Synap. Customize notification settings in your profile settings.
            </p>
          </div>
        `;

        const subject = isStreakAtRisk 
          ? `🔥 Action Required: Save your ${streak}-day Study Streak!` 
          : `🃏 Spaced Recalls: ${finalDueCount} flashcards due for review`;

        const mailRes = await sendEmail({
          to: user.email,
          subject,
          html: emailHtml,
        });

        results.push({
          email: user.email,
          streakWarning: isStreakAtRisk,
          dueReviews: finalDueCount,
          delivered: mailRes.success,
        });
      }
    }

    return NextResponse.json({
      status: 'ok',
      reminders_sent: results.length,
      details: results,
    });
  } catch (err: any) {
    console.error('Cron digest service error:', err);
    return NextResponse.json({ error: err.message || 'Reminders service failure' }, { status: 500 });
  }
}
