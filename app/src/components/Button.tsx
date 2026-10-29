import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type ButtonProps = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

/** Full-width rounded button. */
export function Button({ label, onPress, tone = 'primary', disabled = false }: ButtonProps) {
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
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: toneStyle.backgroundColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <AppText variant="bodyBold" color={toneStyle.color}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
});
