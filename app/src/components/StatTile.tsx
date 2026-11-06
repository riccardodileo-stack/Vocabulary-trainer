import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type StatTileProps = {
  icon: string;
  value: string | number;
  label: string;
  /** Makes the tile tappable (e.g. medals -> the sheet with the count per level). */
  onPress?: () => void;
  /** Read by screen readers when tappable, e.g. "Shows the medals per level". */
  accessibilityHint?: string;
};

/**
 * One number with a label, e.g. "🔥 4 / days in a row".
 * Put 2–3 of them in a row: each one takes the same width.
 */
export function StatTile({ icon, value, label, onPress, accessibilityHint }: StatTileProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessible
      accessibilityLabel={`${value} ${label}`}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
      <AppText accessible={false}>{icon}</AppText>
      <AppText variant="hero" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="small" color="textMuted" numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  tile: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
