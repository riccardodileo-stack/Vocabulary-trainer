import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { motion, radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  icon?: string;
  /** Small number after the label (e.g. how many words have this topic). */
  count?: number;
};

type ChoiceChipsProps<T extends string> = {
  options: ChipOption<T>[];
  /** Chosen values. With allLabel, an empty list means "all". */
  value: T[];
  onChange: (value: T[]) => void;
  /** 'many' toggles each chip; 'one' keeps exactly one chosen. */
  select?: 'many' | 'one';
  /** First chip "All": chosen when the list is empty, tapping it clears the list. */
  allLabel?: string;
  /** Read by screen readers for each chip, e.g. "Computing, 12 words". */
  accessibilityLabelFor?: (option: ChipOption<T>) => string;
};

/** Rounded choices that wrap on several lines; the chosen ones fill with color. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  select = 'many',
  allLabel,
  accessibilityLabelFor,
}: ChoiceChipsProps<T>) {
  const toggle = (option: T) => {
    if (select === 'one') {
      onChange([option]);
    } else {
      onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
    }
  };

  return (
    <View style={styles.wrap}>
      {allLabel ? <Chip label={allLabel} selected={value.length === 0} onPress={() => onChange([])} /> : null}
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          icon={option.icon}
          count={option.count}
          selected={value.includes(option.value)}
          onPress={() => toggle(option.value)}
          accessibilityLabel={accessibilityLabelFor?.(option)}
        />
      ))}
    </View>
  );
}

type ChipProps = {
  label: string;
  icon?: string;
  count?: number;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

function Chip({ label, icon, count, selected, onPress, accessibilityLabel }: ChipProps) {
  const { colors } = useTheme();
  // 0 = not chosen, 1 = chosen: the colors fade between the two
  const chosen = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    chosen.set(withTiming(selected ? 1 : 0, { duration: motion.fast }));
  }, [selected, chosen]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(chosen.get(), [0, 1], [colors.card, colors.primarySoft]),
    borderColor: interpolateColor(chosen.get(), [0, 1], [colors.border, colors.primary]),
  }));

  const dimmed = count === 0 && !selected;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}>
      {({ pressed }) => (
        <Animated.View style={[styles.chip, animatedStyle, pressed && styles.pressed, dimmed && styles.dimmed]}>
          {icon ? <AppText accessible={false}>{icon}</AppText> : null}
          <AppText variant={selected ? 'bodyBold' : 'body'} color={selected ? 'primaryStrong' : 'text'}>
            {label}
          </AppText>
          {count !== undefined ? (
            <AppText variant="small" color={selected ? 'primaryStrong' : 'textMuted'}>
              {count}
            </AppText>
          ) : null}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: touchTarget - spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  dimmed: {
    opacity: 0.45,
  },
});
