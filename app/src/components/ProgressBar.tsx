import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { barHeight, motion, radius, useTheme } from '@/theme';

type ProgressBarProps = {
  /** From 0 to 1. */
  progress: number;
  /** Read by screen readers, e.g. "Question 3 of 10". */
  accessibilityLabel?: string;
  /** Fill color; the accent color when not set. */
  color?: string;
  /** 'sm' is half as thick, for bars inside rows. */
  size?: 'md' | 'sm';
};

/** Thin horizontal bar, e.g. quiz progress. The fill slides to the new value. */
export function ProgressBar({ progress, accessibilityLabel, color, size = 'md' }: ProgressBarProps) {
  const { colors } = useTheme();
  const value = Math.min(Math.max(progress, 0), 1);

  const fill = useSharedValue(value);

  useEffect(() => {
    fill.set(withTiming(value, { duration: motion.normal }));
  }, [value, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, size === 'sm' && styles.small, { backgroundColor: colors.track }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color ?? colors.accent }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: barHeight,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  small: {
    height: barHeight / 2,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
