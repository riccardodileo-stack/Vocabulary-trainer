// Medal sheet (slides up from the bottom when a medal is tapped in Profile):
// the four levels, how many are missing for each one, and the date each was reached.
// Even at diamond the progress stays visible ("620 / 500").

import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { MEDAL_TIERS, missingFor, TIER_ICONS, tierKey } from '@/domain/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { useT, useUiLanguage } from '@/i18n';
import { useAchievementStore } from '@/store/achievementStore';
import { fontSize, radius, spacing, useTheme } from '@/theme';

const MEDAL_SIZE = 88;

export default function MedalSheet() {
  const t = useT();
  const { colors } = useTheme();
  const uiLanguage = useUiLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const achievement = useAchievements().find((medal) => medal.id === id);
  const reachedAt = useAchievementStore((state) => state.reachedAt);

  if (!achievement) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText color="textMuted">{t.medalSheet.notFound}</AppText>
      </View>
    );
  }

  const texts = t.achievements[achievement.id];
  const { tier, next, value } = achievement;
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(uiLanguage, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

  // At diamond the last target stays the reference, so "620 / 500" is still shown
  const reference = next?.target ?? achievement.targets[achievement.targets.length - 1];
  const ring = tier ? { ring: colors[tier], soft: colors[`${tier}Soft`] } : { ring: colors.border, soft: colors.cardMuted };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.medal, { backgroundColor: ring.soft, borderColor: ring.ring }]}>
        <AppText style={[styles.medalIcon, !tier && styles.locked]} accessible={false}>
          {achievement.icon}
        </AppText>
      </View>

      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          {texts.title}
        </AppText>
        <AppText color="textMuted">{tier ? t.medalTiers[tier] : t.profile.medalLocked}</AppText>
      </View>

      <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AppText variant="caption" color="textMuted">
          {t.medalSheet.yourProgress.toUpperCase()}
        </AppText>
        <AppText variant="display">
          {value}
          <AppText variant="title" color="textMuted">
            {' '}
            / {reference}
          </AppText>
        </AppText>
        <ProgressBar progress={Math.min(value / reference, 1)} />
        <AppText color="textMuted">
          {next ? t.profile.medalNext(t.medalTiers[next.tier], value, next.target) : t.medalSheet.maxReached}
        </AppText>
      </View>

      <View style={[styles.levels, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MEDAL_TIERS.map((levelTier, index) => {
          const target = achievement.targets[index];
          const reached = value >= target;
          const date = reachedAt[tierKey(achievement.id, levelTier)];
          const missing = missingFor(achievement, target);
          const isNext = next?.tier === levelTier;

          return (
            <View
              key={levelTier}
              accessible
              style={[styles.level, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: reached ? colors[`${levelTier}Soft`] : colors.cardMuted, borderColor: reached ? colors[levelTier] : colors.border },
                ]}>
                <AppText style={!reached && styles.locked}>{TIER_ICONS[levelTier]}</AppText>
              </View>

              <View style={styles.levelTexts}>
                <View style={styles.levelTitle}>
                  <AppText variant="bodyBold" style={styles.flex}>
                    {t.medalTiers[levelTier]}
                  </AppText>
                  {reached ? (
                    <AppText variant="bodyBold" color="primary">
                      ✓
                    </AppText>
                  ) : null}
                </View>
                <AppText variant="small" color="textMuted">
                  {texts.goal(target)}
                </AppText>

                {reached ? (
                  <AppText variant="small" color="primary">
                    {date ? t.medalSheet.reachedOn(formatDate(date)) : '✓'}
                  </AppText>
                ) : (
                  <>
                    <AppText variant="small" color={isNext ? 'text' : 'textMuted'}>
                      {t.medalSheet.toGo(missing)} · {value}/{target}
                    </AppText>
                    {isNext ? (
                      <View style={styles.levelBar}>
                        <ProgressBar progress={achievement.progress} color={colors[levelTier]} size="sm" />
                      </View>
                    ) : null}
                  </>
                )}
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
  medal: {
    alignSelf: 'center',
    width: MEDAL_SIZE,
    height: MEDAL_SIZE,
    borderRadius: radius.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalIcon: {
    fontSize: fontSize.display,
    lineHeight: fontSize.display + 10,
  },
  locked: {
    opacity: 0.35,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressCard: {
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
    gap: 2,
  },
  levelTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  levelBar: {
    marginTop: spacing.xs,
  },
});
