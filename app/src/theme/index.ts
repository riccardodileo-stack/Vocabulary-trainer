import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

import { palette, type ColorScheme, type ThemeColors } from './colors';

export * from './tokens';
export type { ColorScheme, ThemeColors };

/**
 * Current colors, already resolved for light or dark mode.
 * The user's choice wins; 'system' follows the phone.
 */
export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const preference = useSettingsStore((state) => state.themePreference);
  const systemScheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme = preference === 'system' ? systemScheme : preference;
  return { scheme, colors: palette[scheme] };
}

/**
 * Applies the user's choice (system / light / dark) to the native parts too
 * (keyboard, alerts, tab bar). Call it once in the root layout.
 * The web has no such API: there useTheme alone colors the app.
 */
export function useApplyThemePreference() {
  const preference = useSettingsStore((state) => state.themePreference);

  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
    }
  }, [preference]);
}
