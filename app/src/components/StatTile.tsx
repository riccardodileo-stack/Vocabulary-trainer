import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type StatTileProps = {
  icon: string;
  value: string | number;
  label: string;
};

/**
 * One number with a label, e.g. "🔥 4 / days in a row".
 * Put 2–3 of them in a row: each one takes the same width.
 */
export function StatTile({ icon, value, label }: StatTileProps) {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <AppText accessible={false}>{icon}</AppText>
      <AppText variant="hero" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="small" color="textMuted" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
