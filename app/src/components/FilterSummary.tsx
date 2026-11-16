import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { motion, radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';
import { FilterButton } from './FilterButton';

type FilterChip = { key: string; label: string; onRemove: () => void };

type FilterSummaryProps = {
  /** Text of the button, e.g. "Filter". */
  label: string;
  accessibilityLabel: string;
  /** The active filters: each one is a label that can be removed with a tap. */
  chips: FilterChip[];
  /** Read by screen readers on each chip, e.g. "Remove filter". */
  removeLabel: string;
  onOpen: () => void;
};

/**
 * The "Filter" button followed by the active filters as removable labels
 * ("🩺 Salute ✕  Verbi ✕"): what is filtered is always visible and one tap away from gone.
 */
export function FilterSummary({ label, accessibilityLabel, chips, removeLabel, onOpen }: FilterSummaryProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <FilterButton label={label} active={chips.length} onPress={onOpen} accessibilityLabel={accessibilityLabel} />
      {chips.map((chip) => (
        <Animated.View
          key={chip.key}
          entering={FadeIn.duration(motion.fast)}
          exiting={FadeOut.duration(motion.fast)}
          layout={LinearTransition.duration(motion.fast)}>
          <Pressable
            onPress={chip.onRemove}
            accessibilityRole="button"
            accessibilityLabel={`${removeLabel}: ${chip.label}`}
            hitSlop={4}
            style={({ pressed }) => [styles.chip, { backgroundColor: colors.primarySoft }, pressed && styles.pressed]}>
            <AppText variant="small" color="primaryStrong">
              {chip.label}
            </AppText>
            <AppText variant="small" color="primaryStrong" accessible={false}>
              ✕
            </AppText>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: touchTarget - spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
