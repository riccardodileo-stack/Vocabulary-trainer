import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MedalEmblem, MEDAL_MARKS, MEDAL_SYMBOLS, medalTint } from '@/components/MedalVisuals';
import { ProgressBar } from '@/components/ProgressBar';
import { MEDAL_TIERS, missingFor, tierKey } from '@/domain/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { useT, useUiLanguage } from '@/i18n';
import { useAchievementStore } from '@/store/achievementStore';
import { iconSize, radius, spacing, useTheme } from '@/theme';

export default function MedalSheet() {
  const t = useT();
  const language = useUiLanguage();
  const { colors, scheme } = useTheme();
  const { id: medalId } = useLocalSearchParams<{ id: string }>();
  const achievement = useAchievements().find((medal) => medal.id === medalId);
  const reachedAt = useAchievementStore((state) => state.reachedAt);

  if (!achievement) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText color="textMuted">{t.medalSheet.notFound}</AppText>
      </View>
    );
  }

  const { id, tier, next, targets, value, progress } = achievement;
  const tint = medalTint(id, colors, scheme);
  const rim = tier ? colors[tier] : tint;
  const texts = t.achievements[id];
  const reference = next?.target ?? targets[targets.length - 1];
  const progressColor = colors[next?.tier ?? 'diamond'];
  const number = new Intl.NumberFormat(language);
  const date = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' });
  const statusIcon = tier === 'diamond' ? MEDAL_MARKS.diamond : tier ? MEDAL_MARKS.medal : MEDAL_MARKS.lock;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.hero}>
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.stage}>
          <View style={[StyleSheet.absoluteFill, styles.orbit, { borderColor: rim + '50' }]} />
          <View style={[StyleSheet.absoluteFill, styles.halo, { backgroundColor: tint + '19' }]} />
          <MedalEmblem id={id} tier={tier} size={108} />
          {tier ? (
            <SymbolView name={MEDAL_MARKS.sparkle} size={iconSize.sm} tintColor={rim} style={styles.sparkle} accessible={false} />
          ) : null}
        </View>

        <AppText variant="hero" accessibilityRole="header" style={styles.center}>{texts.title}</AppText>
        <View style={[styles.status, { backgroundColor: tier ? colors[`${tier}Soft`] : colors.cardMuted }]}>
          <SymbolView name={statusIcon} size={15} tintColor={tier ? rim : colors.textMuted} accessible={false} />
          <AppText variant="small" color={tier ? 'text' : 'textMuted'} style={styles.statusText}>
            {tier ? t.medalTiers[tier] : t.profile.medalLocked}
          </AppText>
        </View>
      </View>

      <Card style={[styles.progressCard, { borderColor: tint + '48' }]}>
        <SymbolView
          name={MEDAL_SYMBOLS[id]}
          size={128}
          tintColor={tint}
          style={styles.watermark}
          accessible={false}
          pointerEvents="none"
        />
        <AppText variant="caption" color="textMuted">{t.medalSheet.yourProgress.toUpperCase()}</AppText>
        <AppText variant="display">
          {number.format(value)}
          <AppText variant="title" color="textMuted">{' / '}{number.format(reference)}</AppText>
        </AppText>
        <ProgressBar progress={progress} color={progressColor} accessibilityLabel={t.medalSheet.yourProgress} />
        <AppText variant="small" color="textMuted">
          {next ? t.medalSheet.nextTier(t.medalTiers[next.tier]) : t.medalSheet.maxReached}
        </AppText>
      </Card>

      <View style={styles.levels}>
        {MEDAL_TIERS.map((level, index) => {
          const target = targets[index];
          const reached = value >= target;
          const isNext = next?.tier === level;
          const highlighted = reached || isNext;
          const savedDate = reachedAt[tierKey(id, level)];
          const earnedDate = savedDate ? new Date(savedDate) : null;
          const reachedLabel = earnedDate && !Number.isNaN(earnedDate.getTime())
            ? t.medalSheet.reachedOn(date.format(earnedDate))
            : t.medalSheet.reached;

          return (
            <Card
              key={level}
              accessible
              style={[styles.level, isNext && { borderColor: colors[level] + '99', backgroundColor: colors.cardMuted }]}>
              <View
                style={[styles.levelBadge, {
                  backgroundColor: highlighted ? colors[`${level}Soft`] : colors.cardMuted,
                  borderColor: highlighted ? colors[level] + '75' : colors.border,
                }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants">
                <SymbolView
                  name={level === 'diamond' ? MEDAL_MARKS.diamond : MEDAL_MARKS.medal}
                  size={iconSize.md}
                  tintColor={highlighted ? colors[level] : colors.textMuted}
                  accessible={false}
                />
              </View>

              <View style={styles.levelCopy}>
                <AppText variant="bodyBold">{t.medalTiers[level]}</AppText>
                <AppText variant="small" color="textMuted">{texts.goal(target)}</AppText>
                <AppText variant="small" color={reached ? 'primaryStrong' : isNext ? 'text' : 'textMuted'}>
                  {reached ? reachedLabel : t.medalSheet.toGo(missingFor(achievement, target))}
                </AppText>
              </View>

              {reached ? (
                <View
                  style={[styles.levelCheck, { backgroundColor: colors.primarySoft }]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants">
                  <SymbolView name={MEDAL_MARKS.check} size={15} tintColor={colors.primaryStrong} accessible={false} />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      <Button label={t.medalSheet.close} tone="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm },
  stage: { width: 146, height: 146, alignItems: 'center', justifyContent: 'center' },
  orbit: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  halo: { margin: spacing.sm, borderRadius: radius.pill },
  sparkle: { position: 'absolute', top: spacing.sm, right: spacing.xs },
  center: { textAlign: 'center' },
  status: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  statusText: { flexShrink: 1 },
  progressCard: { gap: spacing.sm, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -spacing.xl, right: -spacing.md, opacity: 0.11 },
  levels: { gap: spacing.sm },
  level: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md },
  levelBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCopy: { flex: 1, minWidth: 0, gap: 2 },
  levelCheck: { width: 26, height: 26, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});