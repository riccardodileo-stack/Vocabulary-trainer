// Home: what to do today. Streak and stats, today's review, the words of the day
// and, if there are any, the mistakes to fix.

import { router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DailyWordsCard } from '@/components/DailyWordsCard';
import { IconButton } from '@/components/IconButton';
import { LanguagePairChip } from '@/components/LanguagePairChip';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { StatTile } from '@/components/StatTile';
import { dayKey } from '@/domain/dates';
import { isMistake } from '@/domain/quiz';
import { isDue, isMastered } from '@/domain/review';
import { useT } from '@/i18n';
import { useStreak } from '@/store/activityStore';
import { useActivePair } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { spacing } from '@/theme';

function openSettings() {
  router.push('/settings');
}

function openQuiz(mode: 'due' | 'mistakes') {
  router.push({ pathname: '/train/quiz', params: { direction: 'forward', mode, count: mode === 'due' ? '20' : '0' } });
}

export default function HomeScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const streak = useStreak();

  const today = dayKey();
  const dueCount = words.filter((word) => isDue(word, today)).length;
  const masteredCount = words.filter(isMastered).length;
  const mistakesCount = words.filter(isMistake).length;

  return (
    // On iOS the ScrollView already avoids the notch; Android needs the inset by hand
    <Screen tab="/" contentContainerStyle={Platform.OS === 'android' && { paddingTop: insets.top + spacing.lg }}>
      <View style={styles.header}>
        <AppText variant="hero" accessibilityRole="header">
          {t.home.greeting}
        </AppText>
        <IconButton icon="⚙️" onPress={openSettings} accessibilityLabel={t.settings.title} />
      </View>

      <LanguagePairChip pair={pair} onPress={openSettings} />

      <View style={styles.stats}>
        <StatTile icon="🔥" value={streak} label={t.home.streak(streak)} />
        <StatTile icon="📚" value={words.length} label={t.home.wordsStat(words.length)} />
        <StatTile icon="🏆" value={masteredCount} label={t.home.masteredStat} />
      </View>

      <Card tone="primary">
        <AppText variant="title" accessibilityRole="header">
          🧠 {t.home.reviewTitle}
        </AppText>
        {words.length === 0 ? (
          <AppText color="textMuted">{t.home.reviewNoWords}</AppText>
        ) : dueCount > 0 ? (
          <>
            <AppText color="textMuted">{t.home.reviewDue(dueCount)}</AppText>
            <Button label={t.home.reviewStart} onPress={() => openQuiz('due')} />
          </>
        ) : (
          <AppText color="textMuted">{t.home.reviewDone}</AppText>
        )}
      </Card>

      <DailyWordsCard />

      {mistakesCount > 0 ? (
        <Card onPress={() => openQuiz('mistakes')} accessibilityRole="button">
          <AppText variant="title">⚠️ {t.home.mistakesTitle}</AppText>
          <AppText color="textMuted">{t.home.mistakesSubtitle}</AppText>
          <Pill label={t.home.mistakesCount(mistakesCount)} tone="warning" />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
