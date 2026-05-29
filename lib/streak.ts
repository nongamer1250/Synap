import { createClient } from './supabase/client';

/**
 * Calculates and updates the user's daily study streak.
 * Stored inside user_metadata to avoid DB schema bottlenecks.
 */
export async function updateStudyStreak(): Promise<{ streak: number; updated: boolean }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { streak: 0, updated: false };

    const currentStreak = user.user_metadata?.study_streak || 0;
    const lastStudyDateStr = user.user_metadata?.last_study_date || null;

    // Calculate dates in local time YYYY-MM-DD
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000; // offset in milliseconds
    const localToday = new Date(today.getTime() - tzOffset);
    const todayStr = localToday.toISOString().substring(0, 10);

    const yesterday = new Date(today.getTime() - tzOffset);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    let newStreak = currentStreak;
    let shouldUpdate = false;

    if (lastStudyDateStr === todayStr) {
      // Already studied today, keep current streak
      return { streak: currentStreak, updated: false };
    } else if (lastStudyDateStr === yesterdayStr) {
      // Studied yesterday, increment streak
      newStreak = currentStreak + 1;
      shouldUpdate = true;
    } else {
      // Broke the streak or first time studying, set/reset to 1
      newStreak = 1;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      const { error } = await supabase.auth.updateUser({
        data: {
          study_streak: newStreak,
          last_study_date: todayStr,
        },
      });

      if (error) throw error;
      return { streak: newStreak, updated: true };
    }

    return { streak: currentStreak, updated: false };
  } catch (err) {
    console.error('Failed to update study streak:', err);
    return { streak: 0, updated: false };
  }
}
