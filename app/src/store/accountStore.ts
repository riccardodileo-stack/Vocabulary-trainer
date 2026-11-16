// Where the user is with their account (not saved: rebuilt at every launch from the session
// that supabase-js keeps). Decides which screens exist (app/_layout.tsx):
// - loading:       reading the saved session (splash screen still up)
// - signedOut:     no account on this phone -> welcome screens
// - needsProfile:  signed in but without a profile yet (new email account) -> choose the nick
// - ready:         signed in with a profile -> the app

import { create } from 'zustand';

export type AccountStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

type AccountState = {
  status: AccountStatus;
  setStatus: (status: AccountStatus) => void;
};

export const useAccountStore = create<AccountState>()((set) => ({
  status: 'loading',
  setStatus: (status) => set({ status }),
}));
