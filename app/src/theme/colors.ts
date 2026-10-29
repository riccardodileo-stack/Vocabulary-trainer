// App palette, taken from the PWA (mint green on a light green background)
// with a matching dark version. Change colors here only.
//
// Contrast (WCAG AA): every text color below reaches 4.5:1 on the surfaces it is
// used on. That is why light mode has two greens:
// - `accent`  the mint brand color, only for decoration (progress bars, dots, soft fills)
// - `primary` a deeper green for text and for buttons with white text
// Check new colors with a contrast checker before adding them.

export const palette = {
  light: {
    background: '#eef8ef',
    card: '#ffffff',
    cardMuted: '#f6fbf7',
    text: '#1d1d1f',
    textMuted: '#6e6e73',
    border: 'rgba(0, 0, 0, 0.08)',
    /** Empty part of progress bars and meters. */
    track: 'rgba(0, 0, 0, 0.1)',

    accent: '#2fbf71',
    primary: '#167a46',
    primaryStrong: '#11633a',
    primarySoft: 'rgba(47, 191, 113, 0.13)',
    onPrimary: '#ffffff',

    danger: '#d70015',
    dangerSoft: 'rgba(215, 0, 21, 0.09)',
    warning: '#945400',
    warningSoft: 'rgba(255, 149, 0, 0.13)',

    shadow: '#000000',
  },
  dark: {
    background: '#0e1511',
    card: '#18221c',
    cardMuted: '#1f2b24',
    text: '#f2f5f3',
    textMuted: '#9aa59e',
    border: 'rgba(255, 255, 255, 0.08)',
    track: 'rgba(255, 255, 255, 0.14)',

    accent: '#34d17f',
    primary: '#34d17f',
    primaryStrong: '#5ee29b',
    primarySoft: 'rgba(52, 209, 127, 0.16)',
    onPrimary: '#06210f',

    danger: '#ff453a',
    dangerSoft: 'rgba(255, 69, 58, 0.16)',
    warning: '#ffb340',
    warningSoft: 'rgba(255, 159, 10, 0.16)',

    shadow: '#000000',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ThemeColors = { [K in keyof typeof palette.light]: string };
