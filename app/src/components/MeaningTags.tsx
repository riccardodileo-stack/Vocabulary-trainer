// Kind of word and categories of one meaning, inside its card in the word form:
// a compact line ("Sostantivo · 🩺 Salute"); "Change" opens the choices.

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PARTS_OF_SPEECH, type PartOfSpeech } from '@/domain/partOfSpeech';
import { TOPIC_ICONS, TOPIC_IDS, type TopicId } from '@/domain/topics';
import { useT } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Appear } from './Appear';
import { Button } from './Button';
import { ChoiceChips } from './ChoiceChips';

type MeaningTagsProps = {
  kind: PartOfSpeech;
  topics: TopicId[];
  /** true = something here was chosen by the user; false = all suggested. */
  byUser: boolean;
  onKindChange: (kind: PartOfSpeech) => void;
  onTopicsChange: (topics: TopicId[]) => void;
  /** Back to the suggestions. */
  onReset: () => void;
};

export function MeaningTags({ kind, topics, byUser, onKindChange, onTopicsChange, onReset }: MeaningTagsProps) {
  const t = useT();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const summary = [t.partsOfSpeech[kind], ...topics.map((topic) => t.topics[topic])].join(', ');

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={t.wordForm.meaningTagsAccessibility(summary)}
        style={styles.row}>
        <View style={styles.labels}>
          <View style={[styles.label, { backgroundColor: colors.cardMuted }]}>
            <AppText variant="caption" color="textMuted">
              {t.partsOfSpeech[kind]}
            </AppText>
          </View>
          {topics.map((topic) => (
            <View key={topic} style={[styles.label, { backgroundColor: colors.primarySoft }]}>
              <AppText variant="caption" color="primaryStrong">
                {TOPIC_ICONS[topic]} {t.topicsShort[topic]}
              </AppText>
            </View>
          ))}
          {topics.length === 0 ? (
            <AppText variant="small" color="textMuted">
              {t.wordForm.noTopics}
            </AppText>
          ) : null}
        </View>
        <AppText variant="small" color="primary">
          {open ? t.wordForm.topicsClose : t.wordForm.topicsChange}
        </AppText>
      </Pressable>

      {open ? (
        <Appear from="down" style={styles.editor}>
          <AppText variant="caption" color="textMuted">
            {t.wordForm.kindTitle.toUpperCase()}
          </AppText>
          <ChoiceChips
            select="one"
            options={PARTS_OF_SPEECH.map((value) => ({ value, label: t.partsOfSpeech[value] }))}
            value={[kind]}
            onChange={([value]) => onKindChange(value)}
          />
          <AppText variant="caption" color="textMuted">
            {t.wordForm.topicsTitle.toUpperCase()}
          </AppText>
          <ChoiceChips
            options={TOPIC_IDS.map((topic) => ({ value: topic, label: t.topicsShort[topic], icon: TOPIC_ICONS[topic] }))}
            value={topics}
            onChange={onTopicsChange}
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
    alignItems: 'center',
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
