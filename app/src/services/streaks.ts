// The streak on the server (table streaks): the phone works it out from its training days and
// sends a copy, so friends can see it and a new phone gets the record back.
// See supabase/migrations/*_streaks.sql on the `server` branch.

import type { StreakSnapshot } from '@/domain/activity';

import { supabase } from './supabase';

/** Saves the streak; returns the best streak the server keeps (the highest ever received). */
export async function saveStreak(snapshot: StreakSnapshot): Promise<number> {
  const { data, error } = await supabase.rpc('save_streak', {
    p_current: snapshot.current,
    p_best: snapshot.best,
    p_saves: snapshot.saves,
    p_earned: snapshot.savesEarned,
    p_used: snapshot.savesUsed,
    p_last_day: snapshot.lastTrainingDay,
    p_as_of: snapshot.asOf,
  });
  if (error) throw error;
  return (data as { best_streak: number }).best_streak;
}
