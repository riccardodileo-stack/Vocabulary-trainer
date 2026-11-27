import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MEDAL_MARKS, MEDAL_SYMBOLS } from '@/components/MedalVisuals';
import { ProfileSheetHero } from '@/components/ProfileVisuals';
import { ProgressBar } from '@/components/ProgressBar';
import { MEDAL_TIERS, reachedTiers, tierCounts, tiersEarned } from '@/domain/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { useT } from '@/i18n';
import { iconSize, radius, spacing, useTheme } from '@/theme';

export default function MedalsSheet() {
  const t = useT();
  const { colors } = useTheme();
  const achievements = useAchievements();
  const counts = tierCounts(achievements);
  const won = tiersEarned(achievements);
  const total = achievements.length * MEDAL_TIERS.length;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <ProfileSheetHero kind="medals" title={t.medalsSheet.title} />

      <Card style={[styles.totalCard, { borderColor: colors.warning + '55' }]}>
        <View style={styles.totalHead}>
          <AppText variant="caption" color="textMuted" style={styles.flex}>
            {t.medalsSheet.total.toUpperCase()}
          </AppText>
          <AppText variant="hero" color="warning">
            {won}
            <AppText variant="bodyBold" color="textMuted">
              {' / '}{total}
            </AppText>
          </AppText>
        </View>
        <ProgressBar progress={total ? won / total : 0} color={colors.warning} accessibilityLabel={t.medalsSheet.total} />
        <AppText variant="small" color="textMuted">
          {t.medalsSheet.subtitle}
        </AppText>
      </Card>

      <View style={styles.tiers}>
        {MEDAL_TIERS.map((tier) => {
          const count = counts[tier];
          const color = colors[tier];
          const surface = colors[`${tier}Soft`];
          const medals = achievements.filter((achievement) => reachedTiers(achievement).includes(tier));
          const title = t.medalTiers[tier];
          const label = t.medalsSheet.count(count, achievements.length);
          const accessibilityLabel = [
            title, label, ...medals.map((medal) => t.achievements[medal.id].title),
          ].join(', ');

          return (
            <Card key={tier} accessible accessibilityLabel={accessibilityLabel} style={styles.level}>
              <View
                style={[styles.levelBadge, { backgroundColor: surface, borderColor: color + '65' }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants">
                <SymbolView name={tier === 'diamond' ? MEDAL_MARKS.diamond : MEDAL_MARKS.medal} size={iconSize.lg} tintColor={color} />
              </View>

              <View style={styles.levelCopy}>
                <View style={styles.levelHead}>
                  <AppText variant="bodyBold" style={styles.flex}>{title}</AppText>
                  <AppText variant="caption" color="textMuted" style={[styles.count, { backgroundColor: surface }]}>
                    {label}
                  </AppText>
                </View>
                <ProgressBar progress={achievements.length ? count / achievements.length : 0} size="sm" color={color} />
                {medals.length > 0 ? (
                  <View style={styles.earned}>
                    {medals.map((medal) => (
                      <View key={medal.id} style={[styles.miniBadge, { backgroundColor: surface }]}>
                        <SymbolView name={MEDAL_SYMBOLS[medal.id]} size={iconSize.sm} tintColor={color} accessible={false} />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
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
  totalCard: { gap: spacing.md },
  totalHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tiers: { gap: spacing.sm },
  level: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  levelBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelCopy: { flex: 1, minWidth: 0, gap: spacing.sm },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  count: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  earned: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  miniBadge: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});