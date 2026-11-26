import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { iconSize, radius, spacing, useTheme, type ThemeColors } from '@/theme';

import { AppText } from './AppText';

const EXERCISE_ICONS = {
  choice: {
    ios: 'checklist',
    material: 'checklist',
    tint: 'homeLearned',
    background: 'homeLearnedSoft',
  },
  listen: {
    ios: 'headphones',
    material: 'headphones',
    tint: 'primaryStrong',
    background: 'primarySoft',
  },
  dictation: {
    ios: 'square.and.pencil',
    material: 'edit_note',
    tint: 'warning',
    background: 'warningSoft',
  },
} satisfies Record<string, {
  ios: SFSymbol;
  material: AndroidSymbol;
  tint: keyof ThemeColors;
  background: keyof ThemeColors;
}>;

type ExerciseCardProps = {
  kind: keyof typeof EXERCISE_ICONS;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
};

export function ExerciseCard({ kind, title, description, onPress, disabled = false }: ExerciseCardProps) {
  const { colors, scheme } = useTheme();
  const icon = EXERCISE_ICONS[kind];
  const tint = colors[icon.tint];

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
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.icon,
          { backgroundColor: colors[icon.background], borderColor: `${tint}40` },
        ]}>
        <View style={[styles.iconAccent, { backgroundColor: tint }]} />
        <SymbolView
          name={{ ios: icon.ios, android: icon.material, web: icon.material }}
          size={iconSize.lg}
          weight="semibold"
          tintColor={tint}
        />
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
    borderRadius: radius.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  iconAccent: {
    position: 'absolute',
    width: spacing.xxl + spacing.sm,
    height: spacing.xxl + spacing.sm,
    top: -spacing.lg,
    end: -spacing.lg,
    borderRadius: radius.pill,
    opacity: 0.14,
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