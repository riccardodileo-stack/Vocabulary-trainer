// Root of the app: loads saved data, applies the theme and declares
// the top-level screens (the tab bar and the settings modal).

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
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
            headerRight: () => (
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <AppText variant="bodyBold" color="primary">
                  {t.settings.done}
                </AppText>
              </Pressable>
            ),
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
