// The user's profile. For now it lives only on this phone (no account, no server):
// when accounts arrive, this store is what gets sent at sign-up.
//
// - name:       shown to the user and friends ("Stefano"), free text
// - nickname:   public handle ("@stefano"), will have to be unique (server check)
// - friendCode: created once at the first launch and NEVER changed ("K7M2-X9PQ")

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { isAvatarId, randomAvatarId } from '@/content/avatars';
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
  /** Read-only: no action changes it. */
  friendCode: string;
  /** Friends will come with the server; the counter is already shown. */
  friendsCount: number;
  /** ISO date of the first launch, shown as "member since". */
  createdAt: string;

  /** Only the editable fields: the friend code can't be passed here. */
  updateProfile: (changes: Partial<EditableProfile>) => void;
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
      createdAt: new Date().toISOString(),

      updateProfile: ({ name, nickname, email, avatar }) =>
        set((state) => ({
          name: name ?? state.name,
          nickname: nickname ?? state.nickname,
          email: email ?? state.email,
          avatar: avatar ?? state.avatar,
        })),
    }),
    {
      name: 'profile',
      // v2: the animal avatars became people; an old animal is replaced by a random person
      // v3: "username" renamed "name"; nickname and friend code added
      version: 3,
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
