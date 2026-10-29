// Root of the app: loads saved data, applies the theme and declares
// the top-level screens (the tab bar and the settings modal).

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { HeaderButton } from '@/components/HeaderButton';
import { useT } from '@/i18n';
import { useStoresHydrated } from '@/store/useStoresHydrated';
import { useApplyThemePreference, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

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
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            title: t.settings.title,
            headerRight: () => <HeaderButton label={t.settings.done} onPress={() => router.back()} />,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
