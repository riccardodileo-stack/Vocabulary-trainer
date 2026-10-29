// Progress of one word: mastery, answers and next spaced-repetition review.

import { StyleSheet, View } from 'react-native';

import { daysBetween, dayKey } from '@/domain/dates';
import { isMastered, MASTERED_BOX, nextReviewDay, reviewBox } from '@/domain/review';
import type { Word } from '@/domain/word';
import { useT } from '@/i18n';
import { spacing } from '@/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { MasteryMeter } from './MasteryMeter';
import { Pill } from './Pill';

export function WordStatsCard({ word }: { word: Word }) {
  const t = useT();
  const box = reviewBox(word);
  const next = nextReviewDay(word);
  const daysLeft = next === undefined ? 0 : daysBetween(dayKey(), next);

  const when = daysLeft <= 0 ? t.wordStats.today : daysLeft === 1 ? t.wordStats.tomorrow : t.wordStats.inDays(daysLeft);

  return (
    <Card>
      <View style={styles.header}>
        <AppText variant="bodyBold" style={styles.title}>
          {t.wordStats.title}
        </AppText>
        {isMastered(word) ? <Pill label={t.wordStats.mastered} tone="primary" /> : null}
        <MasteryMeter box={box} accessibilityLabel={t.words.mastery(box, MASTERED_BOX)} />
      </View>

      {next === undefined ? (
        <AppText color="textMuted">{t.wordStats.neverAsked}</AppText>
      ) : (
        <>
          <AppText color="textMuted">{t.wordStats.answers(word.stats.correct, word.stats.wrong)}</AppText>
          <AppText color="textMuted">
            {t.wordStats.nextReview} <AppText variant="bodyBold">{when}</AppText>
          </AppText>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
  },
});
