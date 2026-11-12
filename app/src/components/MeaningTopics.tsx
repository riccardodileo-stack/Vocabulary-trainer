// Categories of one meaning, inside its card in the word form: the chosen ones as small
// labels; "Change" opens all the categories to tick.

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TOPIC_ICONS, TOPIC_IDS, type TopicId } from '@/domain/topics';
import { useT } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Appear } from './Appear';
import { Button } from './Button';
import { ChoiceChips } from './ChoiceChips';

type MeaningTopicsProps = {
  topics: TopicId[];
  /** true = chosen by the user; false = suggested (by the network or by Wiktionary). */
  byUser: boolean;
  onChange: (topics: TopicId[]) => void;
  /** Back to the suggestions. */
  onReset: () => void;
};

export function MeaningTopics({ topics, byUser, onChange, onReset }: MeaningTopicsProps) {
  const t = useT();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={t.wordForm.meaningTopicsAccessibility(topics.map((topic) => t.topics[topic]).join(', '))}
        style={styles.row}>
        <AppText variant="small" color="textMuted">
          {t.wordForm.topicsTitle}:
        </AppText>
        <View style={styles.labels}>
          {topics.length === 0 ? (
            <AppText variant="small" color="textMuted">
              {t.wordForm.noTopics}
            </AppText>
          ) : (
            topics.map((topic) => (
              <View key={topic} style={[styles.label, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="caption" color="primaryStrong">
                  {TOPIC_ICONS[topic]} {t.topicsShort[topic]}
                </AppText>
              </View>
            ))
          )}
        </View>
        <AppText variant="small" color="primary">
          {open ? t.wordForm.topicsClose : t.wordForm.topicsChange}
        </AppText>
      </Pressable>

      {open ? (
        <Appear from="down" style={styles.editor}>
          <ChoiceChips
            options={TOPIC_IDS.map((topic) => ({ value: topic, label: t.topicsShort[topic], icon: TOPIC_ICONS[topic] }))}
            value={topics}
            onChange={onChange}
            accessibilityLabelFor={(option) => t.topics[option.value]}
          />
          <AppText variant="small" color="textMuted">
            {byUser ? t.wordForm.topicsHintUser : t.wordForm.topicsHintAuto}
          </AppText>
          {byUser ? <Button label={t.wordForm.topicsSuggest} tone="secondary" size="sm" onPress={onReset} /> : null}
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 32,
  },
  labels: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  label: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  editor: {
    gap: spacing.sm,
  },
});
