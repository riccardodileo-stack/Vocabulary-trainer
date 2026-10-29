// App palette, taken from the PWA (mint green on a light green background)
// with a matching dark version. Change colors here only.

export const palette = {
  light: {
    background: '#eef8ef',
    card: '#ffffff',
    cardMuted: '#f6fbf7',
    text: '#1d1d1f',
    textMuted: '#6e6e73',
    border: 'rgba(0, 0, 0, 0.08)',

    primary: '#2fbf71',
    primaryStrong: '#1f8f54',
    primarySoft: 'rgba(47, 191, 113, 0.13)',
    onPrimary: '#ffffff',

    danger: '#ff3b30',
    dangerSoft: 'rgba(255, 59, 48, 0.12)',
    warning: '#a65f00',
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
