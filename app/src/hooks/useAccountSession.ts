// Follows the login session and keeps the account status and the profile copy up to date.
// Mounted once in app/_layout.tsx.
//
// - A session saved on the phone is read at launch (no network needed): if the profile copy
//   belongs to the same account the app opens at once, even offline, and the profile is
//   refreshed from the server in the background.
// - New session (guest created, email code verified): the server's profile is fetched; without
//   one the user chooses a nickname (status needsProfile).
// - No session: welcome screens.

import type { Session } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { groupFriends } from '@/domain/account';
import { createProfile, fetchFriends, fetchMyProfile, uploadProfilePhoto } from '@/services/account';
import { supabase } from '@/services/supabase';
import { useAccountStore } from '@/store/accountStore';
import { useProfileStore } from '@/store/profileStore';

/** Asks the server again for friends and requests, to update the counters. */
export async function refreshFriendCounts(): Promise<void> {
  try {
    const lists = groupFriends(await fetchFriends());
    useProfileStore.getState().setFriendCounts(lists.friends.length, lists.incoming.length);
  } catch {
    // Offline: the counters keep their last values
  }
}

/**
 * Creates the profile of the signed-in user (guest or new email account) and opens the app.
 * The friend code the phone already showed is kept if still free. A photo of the phone, if
 * chosen, is uploaded first (into the user's folder on the server).
 */
export async function finishProfile(nickname: string, avatar: string, photoUri: string | null): Promise<void> {
  const local = useProfileStore.getState();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error('not_signed_in');
  }
  const photoPath = photoUri ? await uploadProfilePhoto(data.user.id, photoUri) : null;
  const profile = await createProfile(nickname, avatar, local.friendCode, photoPath);
  local.updateProfile({ avatar: photoUri ? { kind: 'photo', uri: photoUri } : { kind: 'preset', id: avatar } });
  // photoPath first, so the local photo file is kept as the copy of the server's photo
  useProfileStore.setState({ photoPath: profile.photo_path });
  useProfileStore.getState().applyServerProfile(profile, {
    isGuest: data.user.is_anonymous === true,
    email: data.user.email ?? '',
  });
  useAccountStore.getState().setStatus('ready');
  refreshFriendCounts();
}

async function onSession(session: Session | null) {
  const { setStatus } = useAccountStore.getState();
  const profileStore = useProfileStore.getState();

  if (!session) {
    if (profileStore.userId) {
      profileStore.resetAccount();
    }
    setStatus('signedOut');
    return;
  }

  const user = session.user;
  const account = { isGuest: user.is_anonymous === true, email: user.email ?? '' };
  const known = profileStore.userId === user.id && profileStore.nickname !== '';
  // Same account as last time: open the app now, refresh below
  setStatus(known ? 'ready' : 'needsProfile');

  try {
    const profile = await fetchMyProfile(user.id);
    if (profile) {
      useProfileStore.getState().applyServerProfile(profile, account);
      setStatus('ready');
      refreshFriendCounts();
    } else {
      setStatus('needsProfile');
    }
  } catch {
    // Offline: with a known profile the app works anyway; otherwise the nickname screen says
    // that the connection is needed
  }
}

export function useAccountSession(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    supabase.auth.getSession().then(({ data }) => onSession(data.session));
    // Supabase advises not to call it again from inside this callback: defer the work
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setTimeout(() => onSession(session), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [enabled]);
}
