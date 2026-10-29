import { Pressable, StyleSheet } from 'react-native';

import { LANGUAGES, type LanguagePair } from '@/domain/languages';
import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type LanguagePairChipProps = {
  pair: LanguagePair;
  onPress?: () => void;
};

/** "🇬🇧 → 🇮🇹 ▾": shows the active vocabulary; tapping it lets the user change it. */
export function LanguagePairChip({ pair, onPress }: LanguagePairChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: colors.primarySoft },
        pressed && styles.pressed,
      ]}>
      <AppText variant="bodyBold" color="primaryStrong">
        {LANGUAGES[pair.source].flag} → {LANGUAGES[pair.target].flag} ▾
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
