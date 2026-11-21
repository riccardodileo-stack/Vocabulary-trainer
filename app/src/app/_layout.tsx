// Root of the app: loads saved data, applies the theme and declares
// the top-level screens (the welcome screens without an account; with one the tab bar, the settings, the language sheet, the
// medal sheet, the medals-per-level sheet, the streak sheet, the friends sheet and a friend's profile). It also mounts the tracker that
// dates the medal levels and keeps the streak and the summary friends see on the server up to date.

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { HeaderButton } from '@/components/HeaderButton';
import { AchievementTracker } from '@/hooks/useAchievements';
import { useAccountSession } from '@/hooks/useAccountSession';
import { useProfileStatsSync } from '@/hooks/useProfileStatsSync';
import { useReminderSync } from '@/hooks/useReminderSync';
import { useServerTopicCheck } from '@/hooks/useServerTopicCheck';
import { useStreakSync } from '@/hooks/useStreakSync';
import { useWordKindCheck } from '@/hooks/useWordKindCheck';
import { useT } from '@/i18n';
import { configureNotifications } from '@/services/reminders';
import { useAccountStore } from '@/store/accountStore';
import { useStoresHydrated } from '@/store/useStoresHydrated';
import { useApplyThemePreference, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  configureNotifications();
}

function useNavigationTheme() {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };
}

export default function RootLayout() {
  const hydrated = useStoresHydrated();
  const navigationTheme = useNavigationTheme();
  const t = useT();
  const account = useAccountStore((state) => state.status);
  // The app needs an account (guest or registered); without one only the welcome screens exist
  const signedIn = account === 'ready';

  useApplyThemePreference();
  useAccountSession(hydrated);
  useReminderSync(hydrated);
  // Kinds of word guessed offline are checked on Wiktionary in the background
  useWordKindCheck(hydrated);
  // Meanings left without topics on the phone are asked to the server in the background
  useServerTopicCheck(hydrated);
  // The streak (current, record, saves) is copied to the server
  useStreakSync(hydrated && signedIn);
  // The summary friends see in the user's profile (languages, medals, learned words)
  useProfileStatsSync(hydrated && signedIn);

  const ready = hydrated && account !== 'loading';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <AchievementTracker />
      <Stack>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="add-word"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />

          {/* The settings have their own stack (app/settings/_layout.tsx) with its own header */}
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen
            name="medal/[id]"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />
          {/* The quiz covers the tabs: opened from Home or Train, closing it goes back there */}
          <Stack.Screen name="quiz" options={{ title: t.train.title }} />
          <Stack.Screen
            name="daily-topics"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="quiz-filters"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="streak"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="friends"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="friend/[id]"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.75, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="medals"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.6, 1],
              sheetCornerRadius: 28,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="languages"
            options={{
              presentation: 'modal',
              title: t.languagesSheet.title,
              headerRight: () => <HeaderButton label={t.settings.done} onPress={() => router.back()} />,
            }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
