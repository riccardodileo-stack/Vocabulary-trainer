// Home: entry point with the daily words, mistakes review and quick stats.

import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { LanguagePairChip } from '@/components/LanguagePairChip';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { isMistake } from '@/domain/quiz';
import { useT } from '@/i18n';
import { useActivePair } from '@/store/settingsStore';
import { useWordsOfPair } from '@/store/wordStore';
import { spacing } from '@/theme';

function openSettings() {
  router.push('/settings');
}

export default function HomeScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const pair = useActivePair();
  const words = useWordsOfPair(pair);
  const mistakesCount = words.filter(isMistake).length;

  const openMistakesQuiz = () =>
    router.push({ pathname: '/train/quiz', params: { direction: 'forward', mode: 'mistakes', count: '0' } });

  return (
    // On iOS the ScrollView already avoids the notch; Android needs the inset by hand
    <Screen tab="/" contentContainerStyle={Platform.OS === 'android' && { paddingTop: insets.top + spacing.lg }}>
      <View style={styles.header}>
        <AppText variant="hero">{t.home.greeting}</AppText>

        <Pressable onPress={openSettings} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.settings.title}>
          <AppText style={styles.gear}>⚙️</AppText>
        </Pressable>
      </View>

      <LanguagePairChip pair={pair} onPress={openSettings} />

      <Card>
        <AppText variant="title">☀️ {t.home.dailyWordsTitle}</AppText>
        <AppText color="textMuted">{t.home.dailyWordsEmpty}</AppText>
        <Pill label={t.common.comingSoon} />
      </Card>

      <Card tone="primary" onPress={mistakesCount > 0 ? openMistakesQuiz : undefined}>
        <AppText variant="title">⚠️ {t.home.mistakesTitle}</AppText>
        <AppText color="textMuted">{mistakesCount > 0 ? t.home.mistakesSubtitle : t.home.mistakesNone}</AppText>
        {mistakesCount > 0 ? <Pill label={t.home.mistakesCount(mistakesCount)} tone="warning" /> : null}
      </Card>

      <Card onPress={() => router.push('/words')}>
        <AppText variant="title">📊 {t.home.statsTitle}</AppText>
        <Pill label={t.common.words(words.length)} tone="primary" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gear: {
    fontSize: 26,
  },
});
