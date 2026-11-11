import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { motion, radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

const GAP = spacing.xs;

/**
 * A row of mutually exclusive choices, e.g. System / Light / Dark.
 * The raised "thumb" slides under the chosen option instead of jumping.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const selectedIndex = options.findIndex((option) => option.value === value);

  // Width of the row of segments: the thumb is as wide as one segment
  const [rowWidth, setRowWidth] = useState(0);
  const segmentWidth = rowWidth > 0 ? (rowWidth - GAP * (options.length - 1)) / options.length : 0;

  const position = useSharedValue(Math.max(selectedIndex, 0));

  useEffect(() => {
    if (selectedIndex >= 0) {
      position.set(withSpring(selectedIndex, motion.spring));
    }
  }, [selectedIndex, position]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.get() * (segmentWidth + GAP) }],
  }));

  const onLayout = (event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
      <View style={styles.row} onLayout={onLayout}>
        {/* Only the thumb is raised: a shadow on a transparent view would draw around the text on iOS */}
        {segmentWidth > 0 && selectedIndex >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.thumb, { width: segmentWidth, backgroundColor: colors.card, shadowColor: colors.shadow }, thumbStyle]}
          />
        ) : null}

        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={styles.segment}>
              <AppText
                variant={selected ? 'bodyBold' : 'body'}
                color={selected ? 'text' : 'textMuted'}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget - spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.sm,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
