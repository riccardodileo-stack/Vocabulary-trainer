// Sheet opened from the "medals" counter in Profile: how many medals reached each level.
// Every level counts one, so a gold medal counts for bronze, silver and gold.

import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { MEDAL_TIERS, reachedTiers, tierCounts, TIER_ICONS, tiersEarned } from '@/domain/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { useT } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';

/** Highest level first: diamond, gold, silver, bronze. */
const TIERS_DOWN = [...MEDAL_TIERS].reverse();

export default function MedalsSheet() {
  const t = useT();
  const { colors } = useTheme();
  const achievements = useAchievements();
  const counts = tierCounts(achievements);
  const total = achievements.length * MEDAL_TIERS.length;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          🏅 {t.medalsSheet.title}
        </AppText>
        <AppText color="textMuted" style={styles.centered}>
          {t.medalsSheet.subtitle}
        </AppText>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AppText variant="caption" color="textMuted">
          {t.medalsSheet.total.toUpperCase()}
        </AppText>
        <AppText variant="display">
          {tiersEarned(achievements)}
          <AppText variant="title" color="textMuted">
            {' '}
            / {total}
          </AppText>
        </AppText>
        <ProgressBar progress={tiersEarned(achievements) / total} />
      </View>

      <View style={[styles.levels, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {TIERS_DOWN.map((tier, index) => {
          const count = counts[tier];
          // Icons of the medals that reached this level
          const medals = achievements.filter((achievement) => reachedTiers(achievement).includes(tier));

          return (
            <View
              key={tier}
              accessible
              accessibilityLabel={`${t.medalTiers[tier]}: ${t.medalsSheet.count(count, achievements.length)}`}
              style={[styles.level, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View
                style={[
                  styles.levelBadge,
                  {
                    backgroundColor: count > 0 ? colors[`${tier}Soft`] : colors.cardMuted,
                    borderColor: count > 0 ? colors[tier] : colors.border,
                  },
                ]}>
                <AppText style={count === 0 && styles.locked}>{TIER_ICONS[tier]}</AppText>
              </View>

              <View style={styles.levelTexts}>
                <View style={styles.levelTitle}>
                  <AppText variant="bodyBold" style={styles.flex}>
                    {t.medalTiers[tier]}
                  </AppText>
                  <AppText variant="bodyBold" color={count > 0 ? 'text' : 'textMuted'}>
                    {t.medalsSheet.count(count, achievements.length)}
                  </AppText>
                </View>
                <ProgressBar progress={count / achievements.length} color={colors[tier]} size="sm" />
                {medals.length > 0 ? (
                  <AppText variant="small" color="textMuted" numberOfLines={1}>
                    {medals.map((medal) => medal.icon).join('  ')}
                  </AppText>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <Button label={t.medalSheet.close} tone="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  centered: {
    textAlign: 'center',
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  levels: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTexts: {
    flex: 1,
    gap: spacing.xs,
  },
  levelTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  locked: {
    opacity: 0.35,
  },
});
