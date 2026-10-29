// Home card with today's words of the day: add them, or mark them as known.

import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useDailyWords, type DailyWordItem, type DailyWords } from '@/hooks/useDailyWords';
import { useT } from '@/i18n';
import { fontSize, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Pill } from './Pill';

function DailyWordRow({ item, actions }: { item: DailyWordItem; actions: DailyWords }) {
  const t = useT();
  const { colors } = useTheme();
  const { suggestion, state } = item;

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <View style={styles.rowHeader}>
        <AppText variant="bodyBold" color={state === 'known' ? 'textMuted' : 'text'} style={styles.term}>
          {suggestion.term}
        </AppText>
        <Pill label={suggestion.level} />
      </View>

      <AppText color="textMuted">{suggestion.meanings.join(' / ')}</AppText>

      <View style={styles.actions}>
        {state === 'new' ? (
          <>
            <Button
              label={t.daily.add}
              size="sm"
              onPress={() => actions.add(suggestion)}
              accessibilityLabel={t.daily.addAccessibility(suggestion.term)}
            />
            <Button
              label={t.daily.know}
              tone="secondary"
              size="sm"
              onPress={() => actions.setKnown(suggestion, true)}
              accessibilityLabel={t.daily.knowAccessibility(suggestion.term)}
            />
          </>
        ) : null}

        {state === 'added' ? <Pill label={t.daily.added} tone="primary" /> : null}

        {state === 'known' ? (
          <>
            <Pill label={t.daily.known} />
            <Button label={t.daily.undo} tone="secondary" size="sm" onPress={() => actions.setKnown(suggestion, false)} />
          </>
        ) : null}
      </View>
    </View>
  );
}

export function DailyWordsCard() {
  const t = useT();
  const { colors } = useTheme();
  const daily = useDailyWords();

  const addedIds = daily.items.flatMap((item) => (item.state === 'added' && item.wordId ? [item.wordId] : []));
  const allHandled = daily.items.length > 0 && daily.items.every((item) => item.state !== 'new');

  const trainOnNewWords = () =>
    router.push({
      pathname: '/train/quiz',
      params: { direction: 'forward', mode: 'all', count: '0', ids: addedIds.join(',') },
    });

  return (
    <Card>
      <AppText variant="title" accessibilityRole="header">
        ☀️ {t.daily.title}
      </AppText>

      {daily.status === 'loading' ? (
        <View style={styles.status}>
          <ActivityIndicator color={colors.primary} />
          <AppText color="textMuted">{t.daily.loading}</AppText>
        </View>
      ) : null}

      {daily.status === 'error' ? (
        <>
          <AppText color="danger">{t.daily.error}</AppText>
          <Button label={t.common.retry} tone="secondary" size="sm" onPress={daily.retry} />
        </>
      ) : null}

      {daily.status === 'ready' && daily.items.length === 0 ? <AppText color="textMuted">{t.daily.exhausted}</AppText> : null}

      {daily.status === 'ready' && daily.items.length > 0 ? (
        <>
          <AppText color="textMuted">{allHandled ? t.daily.allHandled : t.daily.subtitle}</AppText>
          <View>
            {daily.items.map((item) => (
              <DailyWordRow key={item.suggestion.id} item={item} actions={daily} />
            ))}
          </View>
        </>
      ) : null}

      {addedIds.length > 0 ? (
        <Button label={t.daily.train(addedIds.length)} tone="secondary" onPress={trainOnNewWords} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  term: {
    flex: 1,
    fontSize: fontSize.large,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
