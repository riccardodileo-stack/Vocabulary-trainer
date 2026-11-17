import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { getQuizBlocks, type QuizDirection } from '@/domain/quiz';
import type { Word } from '@/domain/word';
import { useT } from '@/i18n';
import { useActivityStore } from '@/store/activityStore';
import { spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

export function QuizBlockList({ words, direction }: { words: Word[]; direction: QuizDirection }) {
  const t = useT();
  const blocks = useMemo(() => getQuizBlocks(words), [words]);
  const completions = useActivityStore((state) => state.blockCompletions);

  if (blocks.length === 0) {
    return <AppText color="textMuted">{t.train.noWords}</AppText>;
  }

  return (
    <View style={styles.list}>
      {blocks.map((block, index) => {
        const blockId = block[0].id;
        const title = t.train.blockTitle(index + 1);

        return (
          <Card key={blockId} style={styles.row}>
            <View style={styles.details}>
              <AppText variant="bodyBold">{title}</AppText>
              <AppText variant="small" color="textMuted">{t.common.words(block.length)}</AppText>
              <AppText variant="small" color="textMuted">{t.train.blockRuns(completions[blockId] ?? 0)}</AppText>
            </View>
            <Button
              label={t.train.start}
              accessibilityLabel={`${t.train.start} ${title}`}
              size="sm"
              onPress={() => router.push({
                pathname: '/quiz',
                params: { direction, mode: 'all', count: '0', blockId, ids: block.map((word) => word.id).join(',') },
              })}
            />
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  details: { flex: 1, minWidth: 0, gap: spacing.xs },
});