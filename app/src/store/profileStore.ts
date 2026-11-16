// The user's profile, as last seen: a copy of the server's profile (nickname, friend code,
// avatar) plus what stays on this phone (name, photo). Kept on the phone so the profile shows
// also offline; the server is the reference (see hooks/useAccountSession.ts).
//
// - name:       shown to the user ("Stefano"), free text, only on this phone
// - nickname:   public handle ("@stefano"), unique: checked by the server
// - friendCode: given by the server, NEVER changed ("K7M2-X9PQ"). Before the first sign-in the
//               phone makes one, which the server keeps if still free
// - userId:     the hidden id of the account (null when signed out)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { isAvatarId, randomAvatarId } from '@/content/avatars';
import type { ServerProfile } from '@/domain/account';
import { generateFriendCode, isValidFriendCode } from '@/domain/profile';

import { persistStorage } from './persistStorage';

/** A drawn avatar from content/avatars.ts, or a photo saved in the app's documents. */
export type ProfileAvatar = { kind: 'preset'; id: string } | { kind: 'photo'; uri: string };

export type EditableProfile = {
  name: string;
  /** Normalized (see domain/profile.ts), without "@". Empty until chosen. */
  nickname: string;
  email: string;
  avatar: ProfileAvatar;
};

type ProfileState = EditableProfile & {
  /** Read-only here: only the server's profile changes it. */
  friendCode: string;
  friendsCount: number;
  /** Friend requests received and still to answer. */
  incomingRequests: number;
  /** ISO date of the first launch, shown as "member since". */
  createdAt: string;
  /** Hidden id of the account this profile belongs to; null when signed out. */
  userId: string | null;
  /** true for a guest account (no email). */
  isGuest: boolean;

  /** Only the editable fields: the friend code can't be passed here. */
  updateProfile: (changes: Partial<EditableProfile>) => void;
  /** Copies the server's profile (after sign-in, at every launch, after a change). */
  applyServerProfile: (profile: ServerProfile, account: { isGuest: boolean; email: string }) => void;
  setFriendCounts: (friends: number, incoming: number) => void;
  /** After signing out: the account fields are cleared; name and picture stay. */
  resetAccount: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      nickname: '',
      email: '',
      avatar: { kind: 'preset', id: randomAvatarId() },
      friendCode: generateFriendCode(),
      friendsCount: 0,
      incomingRequests: 0,
      createdAt: new Date().toISOString(),
      userId: null,
      isGuest: false,

      updateProfile: ({ name, nickname, email, avatar }) =>
        set((state) => ({
          name: name ?? state.name,
          nickname: nickname ?? state.nickname,
          email: email ?? state.email,
          avatar: avatar ?? state.avatar,
        })),

      applyServerProfile: (profile, { isGuest, email }) =>
        set((state) => ({
          userId: profile.id,
          isGuest,
          email,
          nickname: profile.nickname,
          friendCode: profile.friend_code,
          // A photo stays on the phone (the server has null); a drawn avatar comes from the server
          avatar: profile.avatar && isAvatarId(profile.avatar) ? { kind: 'preset', id: profile.avatar } : state.avatar,
          // "Member since": the earliest of the first launch and the account
          createdAt: profile.created_at < state.createdAt ? profile.created_at : state.createdAt,
        })),

      setFriendCounts: (friendsCount, incomingRequests) => set({ friendsCount, incomingRequests }),

      resetAccount: () =>
        set({
          userId: null,
          isGuest: false,
          email: '',
          nickname: '',
          friendCode: generateFriendCode(),
          friendsCount: 0,
          incomingRequests: 0,
        }),
    }),
    {
      name: 'profile',
      // v2: the animal avatars became people; an old animal is replaced by a random person
      // v3: "username" renamed "name"; nickname and friend code added
      // v4: accounts (userId, isGuest, incomingRequests)
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as Partial<ProfileState> & { username?: string };

        if (version < 2 && state.avatar?.kind === 'preset' && !isAvatarId(state.avatar.id)) {
          state.avatar = { kind: 'preset', id: randomAvatarId() };
        }
        if (version < 3) {
          state.name = state.username ?? '';
          delete state.username;
          state.nickname = '';
        }
        if (version < 4) {
          state.userId = null;
          state.isGuest = false;
          state.incomingRequests = 0;
        }
        // Profiles saved before codes existed get one now, once
        if (!state.friendCode || !isValidFriendCode(state.friendCode)) {
          state.friendCode = generateFriendCode();
        }
        return state as ProfileState;
      },
      storage: persistStorage,
    }
  )
);
