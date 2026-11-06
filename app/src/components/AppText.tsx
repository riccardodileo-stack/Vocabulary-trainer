import { Text, type TextProps, type TextStyle } from 'react-native';

import { fontSize, fontWeight, useTextScale, useTheme, type ThemeColors } from '@/theme';

type Variant = 'display' | 'hero' | 'title' | 'body' | 'bodyBold' | 'small' | 'caption';

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: keyof ThemeColors;
};

/** Text with the app typography and theme colors. Use it instead of <Text>. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const scale = useTextScale();
  return <Text style={[scaled(VARIANTS[variant], scale), { color: colors[color] }, style]} {...rest} />;
}

/** Sizes are for a 393pt wide screen; useTextScale adapts them to the actual width. */
const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: fontSize.display, fontWeight: fontWeight.heavy, letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  hero: { fontSize: fontSize.hero, fontWeight: fontWeight.heavy, letterSpacing: -0.8 },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.heavy, letterSpacing: -0.4 },
  body: { fontSize: fontSize.body, fontWeight: fontWeight.regular, lineHeight: 22 },
  bodyBold: { fontSize: fontSize.body, fontWeight: fontWeight.bold, lineHeight: 22 },
  small: { fontSize: fontSize.small, fontWeight: fontWeight.regular, lineHeight: 20 },
  caption: { fontSize: fontSize.caption, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
};

function scaled(style: TextStyle, scale: number): TextStyle {
  if (scale === 1) {
    return style;
  }
  return {
    ...style,
    fontSize: style.fontSize && style.fontSize * scale,
    lineHeight: style.lineHeight && Math.round(style.lineHeight * scale),
  };
}
