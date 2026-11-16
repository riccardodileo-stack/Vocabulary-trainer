import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type ExerciseCardProps = {
  /** An emoji shown on a tinted square. */
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
};

/** One kind of exercise to start: icon, name, one line on what it is, and a chevron. */
export function ExerciseCard({ icon, title, description, onPress, disabled = false }: ExerciseCardProps) {
  const { colors, scheme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: scheme === 'dark' ? 0 : 0.06,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <AppText style={styles.iconText} accessible={false}>
          {icon}
        </AppText>
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyBold">{title}</AppText>
        <AppText variant="small" color="textMuted">
          {description}
        </AppText>
      </View>
      <AppText variant="title" color="textMuted" accessible={false}>
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
    lineHeight: 30,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
