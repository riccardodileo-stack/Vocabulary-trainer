import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import { motion, radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type Option<T extends string> = { value: T; label: string; icon?: string };

type OptionListProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

const CHECK_IN = ZoomIn.springify().damping(motion.spring.damping).stiffness(motion.spring.stiffness);
const CHECK_OUT = FadeOut.duration(motion.fast);

/** Vertical list with a check mark on the selected row (iOS settings style). */
export function OptionList<T extends string>({ options, value, onChange }: OptionListProps<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {options.map((option, index) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
              pressed && { backgroundColor: colors.cardMuted },
            ]}>
            {option.icon ? <AppText style={styles.icon}>{option.icon}</AppText> : null}
            <AppText style={styles.label}>{option.label}</AppText>
            {/* The check mark pops in on the new row and fades out on the old one */}
            {selected ? (
              <Animated.View entering={CHECK_IN} exiting={CHECK_OUT}>
                <AppText variant="bodyBold" color="primary">
                  ✓
                </AppText>
              </Animated.View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    flex: 1,
  },
});
