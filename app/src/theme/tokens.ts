// Spacing, corner radius, text sizes and other fixed values used across the app.
// Components take their numbers from here: no "magic numbers" in StyleSheets.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  small: 14,
  body: 16,
  large: 18,
  title: 22,
  hero: 30,
  /** Big numbers in stat tiles and quiz results. */
  display: 40,
} as const;

export const fontWeight = {
  regular: '500',
  bold: '700',
  heavy: '800',
} as const;

/** Size of emoji / symbol icons. */
export const iconSize = {
  sm: 18,
  md: 22,
  lg: 26,
} as const;

/** Minimum size of anything tappable (Apple and Google guidelines: 44pt / 48dp). */
export const touchTarget = 44;

/** Thickness of progress bars and the mastery meter. */
export const barHeight = 8;
