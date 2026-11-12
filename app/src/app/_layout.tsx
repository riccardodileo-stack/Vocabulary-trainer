// Root of the app: loads saved data, applies the theme and declares
// the top-level screens (the tab bar, the settings, the language sheet, the
// medal sheet and the medals-per-level sheet). It also mounts the tracker that dates the medal levels.

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { HeaderButton } from '@/components/HeaderButton';
import { AchievementTracker } from '@/hooks/useAchievements';
import { useReminderSync } from '@/hooks/useReminderSync';
import { useWordKindCheck } from '@/hooks/useWordKindCheck';
import { useT } from '@/i18n';
import { configureNotifications } from '@/services/reminders';
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

  useApplyThemePreference();
  useReminderSync(hydrated);
  // Kinds of word guessed offline are checked on Wiktionary in the background
  useWordKindCheck(hydrated);

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync();
    }
  }, [hydrated]);

  if (!hydrated) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <AchievementTracker />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      </Stack>
    </ThemeProvider>
  );
}
