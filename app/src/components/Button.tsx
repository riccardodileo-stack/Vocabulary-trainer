import { Pressable, StyleSheet } from 'react-native';

import { fontWeight, radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

type ButtonProps = {
  label: string;
  onPress: () => void;
  /**
   * primary:   the main action of the screen (one per screen if possible)
   * secondary: other actions
   * danger:    destructive actions (delete)
   */
  tone?: 'primary' | 'secondary' | 'danger';
  /** 'md' fills the width; 'sm' is compact, sized to its label (for actions inside rows). */
  size?: 'md' | 'sm';
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** Rounded button. */
export function Button({ label, onPress, tone = 'primary', size = 'md', disabled = false, accessibilityLabel }: ButtonProps) {
  const { colors } = useTheme();

  const toneStyle = {
    primary: { backgroundColor: colors.primary, color: 'onPrimary' as const },
    secondary: { backgroundColor: colors.primarySoft, color: 'primaryStrong' as const },
    danger: { backgroundColor: colors.dangerSoft, color: 'danger' as const },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={size === 'sm' ? spacing.xs : undefined}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.small,
        { backgroundColor: toneStyle.backgroundColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <AppText variant={size === 'sm' ? 'small' : 'bodyBold'} color={toneStyle.color} style={size === 'sm' && styles.smallLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget + 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  small: {
    alignSelf: 'flex-start',
    minHeight: touchTarget - spacing.sm,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  smallLabel: {
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
});
