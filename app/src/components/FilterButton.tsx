import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

type FilterButtonProps = {
  label: string;
  /** Number of active filters: shown in a badge, and the button turns green. */
  active: number;
  onPress: () => void;
  accessibilityLabel: string;
};

/** Three bars getting shorter: the usual "filter" symbol, drawn so it follows the theme. */
function FilterIcon({ color }: { color: string }) {
  return (
    <View style={styles.icon}>
      {[14, 10, 6].map((width) => (
        <View key={width} style={[styles.bar, { width, backgroundColor: color }]} />
      ))}
    </View>
  );
}

/** "Filter" button placed next to a choice; as tall as a SegmentedControl. */
export function FilterButton({ label, active, onPress, accessibilityLabel }: FilterButtonProps) {
  const { colors } = useTheme();
  const on = active > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: on ? colors.primarySoft : colors.cardMuted,
          borderColor: on ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <FilterIcon color={on ? colors.primaryStrong : colors.text} />
      <AppText variant="bodyBold" color={on ? 'primaryStrong' : 'text'}>
        {label}
      </AppText>
      {on ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <AppText variant="caption" color="onPrimary">
            {active}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    minHeight: touchTarget + spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    alignItems: 'center',
    gap: 3,
  },
  bar: {
    height: 2,
    borderRadius: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
