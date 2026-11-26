import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { ProgressBar } from '@/components/ProgressBar';
import { DAYS_PER_SAVE, MAX_SAVES } from '@/domain/activity';
import { addDays, dayKey } from '@/domain/dates';
import { useT, useUiLanguage } from '@/i18n';
import { useActivityStore, useStreakStatus } from '@/store/activityStore';
import { fontSize, iconSize, radius, spacing, useTheme } from '@/theme';

const WEEK = 7;
const FLAME_SIZE = 224;

const SYMBOLS = {
  flame: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  sparkle: { ios: 'sparkle', android: 'auto_awesome', web: 'auto_awesome' },
  shield: { ios: 'shield', android: 'shield', web: 'shield' },
  shieldCheck: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  trophy: { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' },
} as const;

export default function StreakSheet() {
  const t = useT();
  const language = useUiLanguage();
  const { colors, scheme } = useTheme();
  const { streak, saves, savedDays, daysToNextSave, savesEarned, savesUsed } = useStreakStatus();
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
  const format = new Intl.NumberFormat(language);
  const streakValue = format.format(streak);
  const streakLabel = t.streakSheet.days(streak);
  const record = Math.max(bestStreak, streak);
  const saveCount = t.streakSheet.savesCount(saves, MAX_SAVES);
  const fireColor = streak > 0 ? colors.homeStreak10 : colors.textMuted;
  const fireInk = scheme === 'dark' ? colors.background : colors.card;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heading}>
        <View
          style={styles.flameStage}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${streakValue} ${streakLabel}`}>
          <View style={[StyleSheet.absoluteFill, styles.flameHalo, { backgroundColor: fireColor }]} />
          <View style={[StyleSheet.absoluteFill, styles.flameRing, { borderColor: fireColor }]} />
          <SymbolView name={SYMBOLS.flame} size={FLAME_SIZE} tintColor={fireColor} accessible={false} />
          {streak > 0 ? (
            <SymbolView
              name={SYMBOLS.sparkle}
              size={iconSize.sm}
              tintColor={fireColor}
              style={styles.flameSparkle}
              accessible={false}
            />
          ) : null}
          <View style={[styles.flameText, { backgroundColor: fireColor }]}>
            <AppText
              variant="display"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              maxFontSizeMultiplier={1.2}
              style={[styles.flameCount, { color: fireInk }]}>
              {streakValue}
            </AppText>
            <AppText
              variant="caption"
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
              style={[styles.flameCaption, { color: fireInk }]}>
              {streakLabel}
            </AppText>
          </View>
        </View>
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
                {state === 'trained' ? (
                  <SymbolView name={SYMBOLS.check} size={iconSize.sm} tintColor={fireInk} accessible={false} />
                ) : null}
                {state === 'saved' ? (
                  <SymbolView name={SYMBOLS.shieldCheck} size={iconSize.sm} tintColor={colors.primaryStrong} accessible={false} />
                ) : null}
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
          <Pill label={saveCount} tone="primary" />
        </View>

        <View style={styles.saves} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: MAX_SAVES }, (_, index) => {
            const available = index < saves;
            return (
              <View
                key={index}
                style={[
                  styles.save,
                  available
                    ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                    : { backgroundColor: colors.cardMuted, borderColor: colors.border, borderStyle: 'dashed' },
                ]}>
                <SymbolView
                  name={available ? SYMBOLS.shieldCheck : SYMBOLS.shield}
                  size={iconSize.lg}
                  tintColor={available ? colors.primaryStrong : colors.textMuted}
                  accessible={false}
                />
              </View>
            );
          })}
        </View>

        {daysToNextSave > 0 ? (
          <>
            <ProgressBar progress={(DAYS_PER_SAVE - daysToNextSave) / DAYS_PER_SAVE} size="sm" />
            <AppText variant="small" color="textMuted">{t.streakSheet.nextSave(daysToNextSave)}</AppText>
          </>
        ) : (
          <AppText variant="small" color="textMuted">{t.streakSheet.savesFull}</AppText>
        )}
        <AppText variant="small" color="textMuted">{t.streakSheet.savesHint(DAYS_PER_SAVE, MAX_SAVES)}</AppText>
        {savesEarned > 0 ? (
          <AppText variant="small" color="textMuted">{t.streakSheet.savesTotals(savesEarned, savesUsed)}</AppText>
        ) : null}
      </View>

      <View style={[styles.card, styles.record, { backgroundColor: colors.card, borderColor: colors.goldSoft }]}>
        <SymbolView
          name={SYMBOLS.trophy}
          size={spacing.xxl * 3}
          tintColor={colors.gold}
          style={styles.recordWatermark}
          accessible={false}
          pointerEvents="none"
        />
        <View style={[styles.recordBadge, { backgroundColor: colors.goldSoft }]}>
          <SymbolView name={SYMBOLS.trophy} size={iconSize.md} tintColor={colors.warning} accessible={false} />
          <AppText variant="caption" color="warning">{t.streakSheet.best.toUpperCase()}</AppText>
        </View>
        <View style={styles.recordValue}>
          <AppText variant="hero" numberOfLines={1} adjustsFontSizeToFit style={styles.rightText}>
            {format.format(record)}
          </AppText>
          <AppText variant="small" color="textMuted" style={styles.rightText}>
            {t.streakSheet.days(record)}
          </AppText>
        </View>
      </View>

      <Button label={t.medalSheet.close} tone="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  heading: { alignItems: 'center', gap: spacing.sm },
  flameStage: { width: FLAME_SIZE, height: FLAME_SIZE, alignItems: 'center', justifyContent: 'center' },
  flameHalo: { margin: spacing.md, borderRadius: radius.pill, opacity: 0.12 },
  flameRing: {
    margin: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.28,
  },
  flameSparkle: { position: 'absolute', top: spacing.xxl, right: spacing.xl, opacity: 0.75 },
  flameText: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.xs,
    width: '52%',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderRadius: radius.lg,
  },
  flameCount: {
    fontSize: fontSize.display + spacing.sm,
    lineHeight: fontSize.display + spacing.md,
    textAlign: 'center',
  },
  flameCaption: { textAlign: 'center' },
  centered: { textAlign: 'center' },
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  week: { flexDirection: 'row', gap: spacing.xs },
  day: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs },
  dot: {
    width: '100%',
    maxWidth: 36,
    aspectRatio: 1,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  savesTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  saves: { flexDirection: 'row', gap: spacing.sm },
  save: {
    flex: 1,
    minHeight: spacing.xxl + spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  record: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  recordWatermark: { position: 'absolute', right: -spacing.md, top: -spacing.lg, opacity: 0.17 },
  recordBadge: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  recordValue: { flex: 1, minWidth: 0 },
  rightText: { textAlign: 'right' },
});