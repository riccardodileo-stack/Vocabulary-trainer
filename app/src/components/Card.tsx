import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

type CardProps = ViewProps & {
  /** If set, the whole card is tappable. */
  onPress?: () => void;
  tone?: 'default' | 'primary';
};

/** Rounded surface used for every block of content. */
export function Card({ onPress, tone = 'default', style, children, ...rest }: CardProps) {
  const { colors, scheme } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: tone === 'primary' ? colors.primarySoft : colors.card,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: scheme === 'dark' ? 0 : 0.06,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        {...rest}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
