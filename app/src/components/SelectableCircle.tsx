import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { motion, radius, useTheme } from '@/theme';

type SelectableCircleProps = {
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
};

const RING_WIDTH = 3;
const RING_GAP = 3;

/**
 * A round choice in a grid (e.g. an avatar): the ring grows around the chosen one
 * and shrinks away from the previous one.
 */
export function SelectableCircle({ selected, onPress, accessibilityLabel, children }: SelectableCircleProps) {
  const { colors } = useTheme();
  const shown = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    shown.set(withSpring(selected ? 1 : 0, motion.spring));
  }, [selected, shown]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ scale: 0.85 + 0.15 * shown.get() }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: colors.primary }, ringStyle]} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: RING_WIDTH + RING_GAP,
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderWidth: RING_WIDTH,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
