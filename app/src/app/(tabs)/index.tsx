import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { DailyWordsCard } from '@/components/DailyWordsCard';
import { HomeAddWordCard } from '@/components/HomeAddWordCard';
import { LanguagePairChip } from '@/components/LanguagePairChip';
import { Screen } from '@/components/Screen';
import { dayKey } from '@/domain/dates';
import { isDue, isMastered } from '@/domain/review';
import { useT, useUiLanguage } from '@/i18n';
import { useStreakStatus } from '@/store/activityStore';
import { useProfileStore } from '@/store/profileStore';
import { useActivePair } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { fontSize, iconSize, radius, spacing, touchTarget, useTheme } from '@/theme';

const SYMBOLS = {
  flame: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  words: { ios: 'book.closed', android: 'menu_book', web: 'menu_book' },
  learned: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' },
  review: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  next: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
} as const;

const STREAK_LEVELS = [
  { minDays: 1000, color: 'homeStreak1000', opacity: 0.23 },
  { minDays: 100, color: 'homeStreak100', opacity: 0.19 },
  { minDays: 10, color: 'homeStreak10', opacity: 0.16 },
  { minDays: 1, color: 'homeStreak1', opacity: 0.13 },
] as const;

export default function HomeScreen() {
  const t = useT();
  const language = useUiLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.4;
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const { streak, saves } = useStreakStatus();
  const name = useProfileStore((state) => state.name);
  const greeting = name ? t.home.greetingName(name) : t.home.greeting;

  const today = dayKey();
  const numberFormat = new Intl.NumberFormat(language);

  const dueCount = words.filter((word) => isDue(word, today)).length;
  const masteredCount = words.filter(isMastered).length;
  const reviewMessage = words.length === 0
    ? t.home.reviewNoWords
    : dueCount > 0
      ? t.home.reviewDue(dueCount)
      : t.home.reviewDone;

  const streakLevel = STREAK_LEVELS.find((level) => streak >= level.minDays);
  const flameColor = streakLevel ? colors[streakLevel.color] : colors.textMuted;
  const stats = [
    {
      id: 'streak',
      value: streak,
      label: t.home.streak(streak),
      symbol: SYMBOLS.flame,
      tint: flameColor,
      chip: colors.cardMuted,
    },
    {
      id: 'words',
      value: words.length,
      label: t.home.wordsStat(words.length),
      symbol: SYMBOLS.words,
      tint: colors.primaryStrong,
      chip: colors.primarySoft,
    },
    {
      id: 'learned',
      value: masteredCount,
      label: t.home.masteredStat,
      symbol: SYMBOLS.learned,
      tint: colors.homeLearned,
      chip: colors.homeLearnedSoft,
    },
  ];

  return (
    <Screen tab="/" contentContainerStyle={Platform.OS === 'android' && { paddingTop: insets.top + spacing.lg }}>
      <View style={styles.header}>
        <View style={styles.toolbar}>
          <LanguagePairChip pair={pair} compact onPress={() => router.push('/languages')} />
        </View>
        <View style={styles.greetingRow}>
          <View style={[styles.greetingBubble, { backgroundColor: colors.card }]}>
            <View
              pointerEvents="none"
              style={[styles.greetingTail, { backgroundColor: colors.card }]}
            />
            <AppText variant="hero" accessibilityRole="header">
              {greeting}
            </AppText>
          </View>

          <Image
            source={require('../../../assets/mascot/goricheco-wave.png')}
            contentFit="contain"
            style={[styles.greetingMascot, largeText && styles.greetingMascotCompact]}
            accessible={false}
          />
        </View>
      </View>

      <View style={[styles.stats, largeText && styles.statsStacked]}>
        {stats.map((stat) => {
          const value = numberFormat.format(stat.value);

          return (
            <Pressable
              key={stat.id}
              accessible
              // Only the streak opens something: its sheet explains the saves
              disabled={stat.id !== 'streak'}
              accessibilityRole={stat.id === 'streak' ? 'button' : undefined}
              accessibilityHint={stat.id === 'streak' ? t.home.streakOpen : undefined}
              onPress={() => router.push('/streak')}
              accessibilityLabel={
                stat.id === 'streak' && saves > 0 ? `${value} ${stat.label}, ${t.home.streakSaves(saves)}` : `${value} ${stat.label}`
              }
              style={({ pressed }) => [
                styles.stat,
                !largeText && styles.statInRow,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed,
              ]}>
              {stat.id === 'streak' ? (
                <SymbolView
                  name={SYMBOLS.flame}
                  size={spacing.xxl * 3}
                  tintColor={flameColor}
                  accessible={false}
                  pointerEvents="none"
                  style={[styles.flame, { opacity: streakLevel?.opacity ?? 0.08 }]}
                />
              ) : null}
              <View style={styles.statTop}>
                <View style={[styles.statIcon, { backgroundColor: stat.chip }]}>
                  <SymbolView name={stat.symbol} size={iconSize.sm} tintColor={stat.tint} accessible={false} />
                </View>
                {stat.id === 'streak' && saves > 0 ? (
                  <AppText variant="caption" color="textMuted" accessible={false}>
                    {'🛡️'.repeat(saves)}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="display" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {value}
              </AppText>
              <AppText variant="small" color="textMuted">
                {stat.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <HomeAddWordCard key={`${pair.source}-${pair.target}`} pair={pair} />
      <View style={[styles.review, { backgroundColor: colors.homeReviewSurface }]}>
        <View pointerEvents="none" style={[styles.reviewHalo, { borderColor: colors.homeReviewStroke }]} />
        <View style={styles.reviewHeader}>
          <View style={styles.reviewCopy}>
            <AppText variant="title" color="homeReviewText" accessibilityRole="header">
              {t.home.reviewTitle}
            </AppText>
            <AppText color="homeReviewMuted">{reviewMessage}</AppText>
          </View>

          {!largeText ? (
            <View
              style={styles.deck}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <View style={[styles.deckCard, styles.deckBack, { borderColor: colors.homeReviewStroke }]} />
              <View
                style={[
                  styles.deckCard,
                  styles.deckFront,
                  { backgroundColor: colors.homeReviewFill, borderColor: colors.homeReviewStroke },
                ]}>
                <SymbolView name={SYMBOLS.review} size={iconSize.lg} tintColor={colors.homeReviewTint} />
              </View>
            </View>
          ) : null}
        </View>

        {dueCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({
              pathname: '/quiz',
              params: { direction: 'forward', mode: 'due', count: '20' },
            })}
            style={({ pressed }) => [
              styles.reviewButton,
              { backgroundColor: colors.homeReviewAction },
              pressed && styles.pressed,
            ]}>
            <AppText variant="bodyBold" color="homeReviewOnAction" style={styles.reviewButtonLabel}>
              {t.home.reviewStart}
            </AppText>
            <SymbolView name={SYMBOLS.next} size={iconSize.md} tintColor={colors.homeReviewOnAction} accessible={false} />
          </Pressable>
        ) : null}
      </View>

      <DailyWordsCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
    greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  greetingBubble: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  greetingTail: {
    position: 'absolute',
    top: '50%',
    right: -spacing.xs,
    marginTop: -spacing.sm,
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: spacing.xs / 2,
    transform: [{ rotate: '45deg' }],
  },
  greetingMascot: {
    width: '44%',
    maxWidth: spacing.xxl * 5.5,
    aspectRatio: 3 / 2,
    flexShrink: 0,
    marginLeft: -spacing.xl,
    marginRight: -spacing.lg,
  },
  greetingMascotCompact: {
    width: '36%',
    maxWidth: spacing.xxl * 4,
    marginLeft: -spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statsStacked: { flexDirection: 'column' },
  stat: {
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  statInRow: { flex: 1, minWidth: 0 },
  flame: { position: 'absolute', top: -spacing.xl, right: -spacing.xl },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: fontSize.hero },
  review: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  reviewHalo: {
    position: 'absolute',
    width: spacing.xxl * 6,
    height: spacing.xxl * 6,
    top: -spacing.xxl * 2,
    right: -spacing.xxl,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewCopy: { flex: 1, gap: spacing.xs },
  deck: { width: spacing.xxl * 2, height: spacing.xxl * 2 },
  deckCard: {
    position: 'absolute',
    width: touchTarget,
    height: touchTarget + spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckBack: { top: spacing.xs, right: spacing.xs, transform: [{ rotate: '13deg' }] },
  deckFront: { top: spacing.xs, left: spacing.xs, transform: [{ rotate: '-9deg' }] },
  reviewButton: {
    minHeight: touchTarget + spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewButtonLabel: { flex: 1 },
  pressed: { opacity: 0.78 },
});