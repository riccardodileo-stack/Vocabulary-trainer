// Calls to the server for what friends see of each other: the summary of the user's studies
// (table profile_stats) and the profile of a friend.
// See supabase/migrations/*_friend_profiles.sql on the `server` branch.

import { parseFriendProfile, type FriendProfile, type ProfileStats } from '@/domain/friendProfile';

import { supabase } from './supabase';

/** Saves the summary; with share = false the server empties it and friends see only nick and photo. */
export async function saveProfileStats(share: boolean, stats: ProfileStats): Promise<void> {
  const { error } = await supabase.rpc('save_profile_stats', {
    p_share: share,
    p_native: share ? stats.nativeLanguage : null,
    p_languages: share ? stats.languages : [],
    p_medals: share ? stats.medals : {},
    p_topics: share ? stats.topics : [],
    p_learned: share ? stats.learnedWords : [],
  });
  if (error) throw error;
}

/** Profile of one friend (error not_friends if they aren't). */
export async function fetchFriendProfile(friendId: string): Promise<FriendProfile> {
  const { data, error } = await supabase.rpc('friend_profile', { p_friend: friendId });
  if (error) throw error;
  return parseFriendProfile(data);
}
