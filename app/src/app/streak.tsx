// Sheet opened from the streak on Home: the days in a row, the last week day by day
// and the saves (earned every DAYS_PER_SAVE days, used by themselves on a skipped day).

import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { DAYS_PER_SAVE, MAX_SAVES } from '@/domain/activity';
import { addDays, dayKey } from '@/domain/dates';
import { useT, useUiLanguage } from '@/i18n';
import { useActivityStore, useStreakStatus } from '@/store/activityStore';
import { radius, spacing, touchTarget, useTheme } from '@/theme';

const WEEK = 7;

export default function StreakSheet() {
  const t = useT();
  const language = useUiLanguage();
  const { colors } = useTheme();
  const { streak, saves, savedDays, daysToNextSave } = useStreakStatus();
  const days = useActivityStore((state) => state.days);
  const bestStreak = useActivityStore((state) => state.bestStreak);

  const today = dayKey();
  const trainedToday = days.includes(today);
  const weekday = new Intl.DateTimeFormat(language, { weekday: 'narrow' });
  const longWeekday = new Intl.DateTimeFormat(language, { weekday: 'long' });
  const week = Array.from({ length: WEEK }, (_, index) => {
    const day = addDays(today, index - (WEEK - 1));
    const date = new Date(`${day}T12:00:00`);
    const state = days.includes(day) ? 'trained' : savedDays.includes(day) ? 'saved' : day === today ? 'today' : 'missed';
    return { day, state, letter: weekday.format(date), name: longWeekday.format(date) } as const;
  });

  const message = streak === 0 ? t.streakSheet.none : trainedToday ? t.streakSheet.todayDone : t.streakSheet.todayMissing;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heading} accessible accessibilityRole="header" accessibilityLabel={`${streak} ${t.streakSheet.days(streak)}`}>
        <AppText style={[styles.flame, streak === 0 && styles.faded]}>🔥</AppText>
        <AppText variant="display">{streak}</AppText>
        <AppText variant="bodyBold" color="textMuted">
          {t.streakSheet.days(streak)}
        </AppText>
        <AppText color="textMuted" style={styles.centered}>
          {message}
        </AppText>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AppText variant="caption" color="textMuted">
          {t.streakSheet.lastDays.toUpperCase()}
        </AppText>
        <View style={styles.week}>
          {week.map(({ day, state, letter, name }) => (
            <View key={day} style={styles.day} accessible accessibilityLabel={`${name}: ${t.streakSheet[state]}`}>
              <AppText variant="caption" color={day === today ? 'text' : 'textMuted'}>
                {letter.toUpperCase()}
              </AppText>
              <View
                style={[
                  styles.dot,
                  state === 'trained' && { backgroundColor: colors.homeStreak1, borderColor: colors.homeStreak1 },
                  state === 'saved' && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                  state === 'today' && { borderColor: colors.homeStreak1, borderStyle: 'dashed' },
                  state === 'missed' && { backgroundColor: colors.cardMuted, borderColor: colors.border },
                ]}>
                <AppText variant="small" style={state === 'trained' && styles.onFlame}>
                  {state === 'trained' ? '✓' : state === 'saved' ? '🛡️' : ''}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.savesTitle}>
          <AppText variant="caption" color="textMuted" style={styles.flex}>
            {t.streakSheet.savesTitle.toUpperCase()}
          </AppText>
          <AppText variant="bodyBold">{t.streakSheet.savesCount(saves, MAX_SAVES)}</AppText>
        </View>
        <View style={styles.saves} accessible accessibilityLabel={`${t.streakSheet.savesTitle}: ${t.streakSheet.savesCount(saves, MAX_SAVES)}`}>
          {Array.from({ length: MAX_SAVES }, (_, index) => (
            <View
              key={index}
              style={[
                styles.save,
                index < saves
                  ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                  : { backgroundColor: colors.cardMuted, borderColor: colors.border },
              ]}>
              <AppText variant="title" style={index >= saves && styles.faded}>
                🛡️
              </AppText>
            </View>
          ))}
        </View>
        {daysToNextSave > 0 ? (
          <>
            <ProgressBar progress={(DAYS_PER_SAVE - daysToNextSave) / DAYS_PER_SAVE} size="sm" />
            <AppText variant="small" color="textMuted">
              {t.streakSheet.nextSave(daysToNextSave)}
            </AppText>
          </>
        ) : (
          <AppText variant="small" color="textMuted">
            {t.streakSheet.savesFull}
          </AppText>
        )}
        <AppText variant="small" color="textMuted">
          {t.streakSheet.savesHint(DAYS_PER_SAVE, MAX_SAVES)}
        </AppText>
      </View>

      <View style={[styles.card, styles.best, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AppText style={styles.flex}>🏆 {t.streakSheet.best}</AppText>
        <AppText variant="bodyBold">
          {Math.max(bestStreak, streak)} {t.streakSheet.days(Math.max(bestStreak, streak))}
        </AppText>
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
  flame: {
    fontSize: 56,
    lineHeight: 68,
  },
  faded: {
    opacity: 0.3,
  },
  centered: {
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onFlame: {
    color: '#fff',
    fontWeight: '700',
  },
  savesTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saves: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  save: {
    width: touchTarget + spacing.md,
    height: touchTarget + spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  best: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
