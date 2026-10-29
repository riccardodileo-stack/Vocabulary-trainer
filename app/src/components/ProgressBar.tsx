import { StyleSheet, View } from 'react-native';

import { barHeight, radius, useTheme } from '@/theme';

type ProgressBarProps = {
  /** From 0 to 1. */
  progress: number;
  /** Read by screen readers, e.g. "Question 3 of 10". */
  accessibilityLabel?: string;
};

/** Thin horizontal bar, e.g. quiz progress. */
export function ProgressBar({ progress, accessibilityLabel }: ProgressBarProps) {
  const { colors } = useTheme();
  const value = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, { backgroundColor: colors.track }]}>
      <View style={[styles.fill, { width: `${value * 100}%`, backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: barHeight,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
