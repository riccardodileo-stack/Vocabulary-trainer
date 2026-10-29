import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

import { palette, type ColorScheme, type ThemeColors } from './colors';

export * from './tokens';
export type { ColorScheme, ThemeColors };

/** Current colors, already resolved for light or dark mode. */
export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palette[scheme] };
}

/**
 * Applies the user's choice (system / light / dark) to the whole app,
 * native parts included (keyboard, alerts, tab bar). Call it once in the root layout.
 */
export function useApplyThemePreference() {
  const preference = useSettingsStore((state) => state.themePreference);

  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
  }, [preference]);
}
