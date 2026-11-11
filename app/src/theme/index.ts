import { useEffect } from 'react';
import { Appearance, useColorScheme, useWindowDimensions } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

import { palette, type ColorScheme, type ThemeColors } from './colors';
import { DESIGN_SCREEN_WIDTH } from './tokens';

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

/** Limits of the text scale: small phones (SE) and big ones (Max) stay readable. */
const MIN_TEXT_SCALE = 0.9;
const MAX_TEXT_SCALE = 1.1;

/**
 * Factor applied to every text size: the text grows and shrinks with the screen width.
 * Without it a label fits on one line on an iPhone Max and wraps on a normal iPhone;
 * with it the lines break in the same places on every phone.
 * Rounded to 0.01 so tiny width changes don't re-render the text.
 */
export function useTextScale(): number {
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / DESIGN_SCREEN_WIDTH, MIN_TEXT_SCALE), MAX_TEXT_SCALE);
  return Math.round(scale * 100) / 100;
}
