// The Supabase client: login (guests and email) and calls to the database functions.
// The session is saved in AsyncStorage, so the user stays signed in between launches, and its
// token is refreshed while the app is in the foreground.

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SERVER } from './serverConfig';

export const supabase = createClient(SERVER.url, SERVER.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No login links in this app: the email login uses a 6-digit code
    detectSessionInUrl: false,
  },
});

// On a phone the token is refreshed only while the app is open (Supabase's advice for React Native)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
