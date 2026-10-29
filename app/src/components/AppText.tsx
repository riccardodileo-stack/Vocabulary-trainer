import { StyleSheet, Text, type TextProps } from 'react-native';

import { fontSize, fontWeight, useTheme, type ThemeColors } from '@/theme';

type Variant = 'display' | 'hero' | 'title' | 'body' | 'bodyBold' | 'small' | 'caption';

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: keyof ThemeColors;
};

/** Text with the app typography and theme colors. Use it instead of <Text>. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return <Text style={[styles[variant], { color: colors[color] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: { fontSize: fontSize.display, fontWeight: fontWeight.heavy, letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  hero: { fontSize: fontSize.hero, fontWeight: fontWeight.heavy, letterSpacing: -0.8 },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.heavy, letterSpacing: -0.4 },
  body: { fontSize: fontSize.body, fontWeight: fontWeight.regular, lineHeight: 22 },
  bodyBold: { fontSize: fontSize.body, fontWeight: fontWeight.bold, lineHeight: 22 },
  small: { fontSize: fontSize.small, fontWeight: fontWeight.regular, lineHeight: 20 },
  caption: { fontSize: fontSize.caption, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
});
