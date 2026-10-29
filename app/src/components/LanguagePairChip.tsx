import { Pressable, StyleSheet } from 'react-native';

import { LANGUAGES, type LanguagePair } from '@/domain/languages';
import { useT } from '@/i18n';
import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

type LanguagePairChipProps = {
  pair: LanguagePair;
  onPress?: () => void;
};

/** "🇬🇧 English → 🇮🇹 ▾": shows the active vocabulary; tapping it lets the user change it. */
export function LanguagePairChip({ pair, onPress }: LanguagePairChipProps) {
  const t = useT();
  const { colors } = useTheme();
  const source = t.languages[pair.source];
  const target = t.languages[pair.target];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.common.languagePair(source, target)}
      accessibilityHint={t.common.changeLanguages}
      style={({ pressed }) => [styles.chip, { backgroundColor: colors.primarySoft }, pressed && styles.pressed]}>
      <AppText variant="bodyBold" color="primaryStrong">
        {LANGUAGES[pair.source].flag} {source} → {LANGUAGES[pair.target].flag} ▾
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: touchTarget - 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
