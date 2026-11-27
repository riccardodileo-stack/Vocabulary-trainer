import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import type { AchievementId, MedalTier } from '@/domain/achievements';
import { radius, useTheme, type ColorScheme, type ThemeColors } from '@/theme';
import { topicTints } from '@/theme/colors';

export const MEDAL_SYMBOLS = {
  words: { ios: 'book.fill', android: 'auto_stories', web: 'auto_stories' },
  learned: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' },
  streak: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  answers: { ios: 'scope', android: 'track_changes', web: 'track_changes' },
  perfect: { ios: 'star.fill', android: 'star', web: 'star' },
  polyglot: { ios: 'globe', android: 'language', web: 'language' },
} satisfies Record<AchievementId, SymbolViewProps['name']>;

export const MEDAL_MARKS = {
  medal: { ios: 'medal.fill', android: 'military_tech', web: 'military_tech' },
  diamond: { ios: 'diamond.fill', android: 'diamond', web: 'diamond' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  sparkle: { ios: 'sparkle', android: 'auto_awesome', web: 'auto_awesome' },
} as const;

export function medalTint(id: AchievementId, colors: ThemeColors, scheme: ColorScheme) {
  const tints: Record<AchievementId, string> = {
    words: colors.primaryStrong,
    learned: colors.homeLearned,
    streak: colors.homeStreak10,
    answers: topicTints.tech[scheme],
    perfect: colors.warning,
    polyglot: topicTints.travel[scheme],
  };
  return tints[id];
}

export function MedalEmblem({ id, tier, size = 62 }: {
  id: AchievementId;
  tier: MedalTier | null;
  size?: number;
}) {
  const { colors, scheme } = useTheme();
  const tint = medalTint(id, colors, scheme);
  const rim = tier ? colors[tier] : tint;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.medallion, {
        width: size,
        height: size,
        backgroundColor: rim + '2E',
        borderColor: rim + (tier ? 'CC' : '65'),
        borderWidth: Math.max(1, size * 0.018),
      }]}>
      <View
        style={[StyleSheet.absoluteFill, styles.face, {
          margin: Math.round(size * 0.085),
          backgroundColor: colors.cardMuted,
          borderColor: rim + '70',
        }]}>
        <View style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: tint + '18' }]} />
      </View>
      <SymbolView
        name={MEDAL_SYMBOLS[id]}
        size={Math.round(size * 0.49)}
        tintColor={tint}
        weight="semibold"
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  medallion: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  face: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tint: { borderRadius: radius.pill },
});