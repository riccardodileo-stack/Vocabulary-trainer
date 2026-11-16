// Form shared by the "new word" and "edit word" screens.
// Each meaning has its own kind of word and categories; they are filled in by themselves while
// typing (offline rules, topic network) or come with the meaning from Wiktionary ("Find
// meanings"); once the user touches them, their choice wins.

import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { guessPartOfSpeech, type PartOfSpeech } from '@/domain/partOfSpeech';
import { normalizeText } from '@/domain/text';
import { suggestMeaningTopics } from '@/domain/topicClassifier';
import type { TopicId } from '@/domain/topics';
import type { NewWordInput, PartOfSpeechSource, Word } from '@/domain/word';
import { useFocusAfterTransition } from '@/hooks/useFocusAfterTransition';
import { useT } from '@/i18n';
import type { ExampleSentence } from '@/services/tatoeba';
import { spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { ExampleFinder } from './ExampleFinder';
import { MeaningFinder } from './MeaningFinder';
import { MeaningTags } from './MeaningTags';
import { Section } from './Section';
import { SpeakButton } from './SpeakButton';
import { TextField, type TextFieldRef } from './TextField';

type MeaningDraft = {
  text: string;
  note: string;
  examples: string;
  /** The translation the given topics / kind below were decided for (saved word, Wiktionary). */
  givenFor: string;
  /** Topics given to this meaning; null = none given, follow the suggestions. */
  topics: TopicId[] | null;
  topicsByUser: boolean;
  /** Kind given to this meaning; null = none given, follow the offline guess. */
  kind: PartOfSpeech | null;
  kindSource: PartOfSpeechSource;
};

type WordFormProps = {
  pair: LanguagePair;
  initialWord?: Word;
  autoFocus?: boolean;
  /** Returns an error message to show, or null if the word was saved. */
  onSave: (input: NewWordInput) => string | null;
  onDelete?: () => void;
};

const EMPTY_MEANING: MeaningDraft = {
  text: '',
  note: '',
  examples: '',
  givenFor: '',
  topics: null,
  topicsByUser: false,
  kind: null,
  kindSource: 'guess',
};

function draftsFromWord(word: Word | undefined): MeaningDraft[] {
  if (!word || word.meanings.length === 0) {
    return [EMPTY_MEANING];
  }

  return word.meanings.map((meaning) => ({
    text: meaning.text,
    note: meaning.note ?? '',
    examples: meaning.examples.join('\n'),
    givenFor: meaning.text.trim(),
    topics: meaning.topics ?? null,
    topicsByUser: meaning.topicsByUser === true,
    kind: meaning.partOfSpeech ?? null,
    kindSource: meaning.partOfSpeechSource ?? 'guess',
  }));
}

/** What was given (saved, from Wiktionary) still holds while the translation is the same. */
function stillGiven(draft: MeaningDraft): boolean {
  return draft.givenFor !== '' && draft.givenFor === draft.text.trim();
}

/** Topics shown for a meaning: the user's choice, the given ones, otherwise the network's suggestion. */
function draftTopics(draft: MeaningDraft, term: string, pair: LanguagePair, onlyMeaning: boolean): TopicId[] {
  if (draft.topics && (draft.topicsByUser || stillGiven(draft))) {
    return draft.topics;
  }
  return draft.text.trim() ? suggestMeaningTopics(term, draft.text, pair, onlyMeaning) : [];
}

/** Kind shown for a meaning, and who decided it. A guess already checked on Wiktionary stays "checked". */
function draftKind(draft: MeaningDraft, term: string, pair: LanguagePair): { kind: PartOfSpeech; source: PartOfSpeechSource } {
  if (draft.kind && (draft.kindSource === 'user' || (stillGiven(draft) && draft.kindSource !== 'guess'))) {
    return { kind: draft.kind, source: draft.kindSource };
  }
  return { kind: guessPartOfSpeech(term, draft.text.trim() ? [draft.text] : [], pair), source: 'guess' };
}

function inputFromDrafts(term: string, drafts: MeaningDraft[], tags: string, pair: LanguagePair): NewWordInput {
  const filled = drafts.filter((draft) => draft.text.trim());
  return {
    term: term.trim(),
    meanings: filled.map((draft) => {
      const { kind, source } = draftKind(draft, term, pair);
      return {
        text: draft.text.trim(),
        note: draft.note.trim() || undefined,
        examples: draft.examples
          .split('\n')
          .map((example) => example.trim())
          .filter(Boolean),
        topics: draftTopics(draft, term, pair, filled.length === 1),
        topicsByUser: draft.topicsByUser || undefined,
        partOfSpeech: kind,
        partOfSpeechSource: source,
      };
    }),
    tags: tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

/** The translation the sentence uses, so the example goes under the right meaning. */
function meaningIndexFor(drafts: MeaningDraft[], sentence: ExampleSentence): number {
  const translation = normalizeText(sentence.translation);
  const index = drafts.findIndex((draft) => draft.text.trim() && translation.includes(normalizeText(draft.text)));
  return Math.max(index, 0);
}

export function WordForm({ pair, initialWord, autoFocus = true, onSave, onDelete }: WordFormProps) {
  const t = useT();
  const [term, setTerm] = useState(initialWord?.term ?? '');
  const [drafts, setDrafts] = useState(() => draftsFromWord(initialWord));
  const [tags, setTags] = useState(initialWord?.tags.join(', ') ?? '');
  const [error, setError] = useState<string | null>(null);
  const termRef = useRef<TextFieldRef>(null);
  // New word: start typing at once (but only after the screen has slid in)
  useFocusAfterTransition(termRef, autoFocus && !initialWord);

  const updateDraft = (index: number, changes: Partial<MeaningDraft>) =>
    setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...changes } : draft)));

  const removeDraft = (index: number) => setDrafts((current) => current.filter((_, i) => i !== index));

  const addExample = (sentence: ExampleSentence) => {
    const index = meaningIndexFor(drafts, sentence);
    const example = `${sentence.text} — ${sentence.translation}`;
    const current = drafts[index].examples.trim();
    updateDraft(index, { examples: current ? `${current}\n${example}` : example });
  };

  const meaningTexts = drafts.map((draft) => draft.text.trim()).filter(Boolean);
  const filledCount = meaningTexts.length;

  /**
   * A meaning found online: in the first empty meaning, or in a new one. From Wiktionary it
   * comes with its kind of word and, when the sense has a field ("(medicine) …"), its topics.
   */
  const addMeaning = (text: string, given?: { topics?: TopicId[]; kind?: PartOfSpeech }) =>
    setDrafts((current) => {
      const extra: Partial<MeaningDraft> = {
        givenFor: text.trim(),
        topics: given?.topics?.length ? given.topics : null,
        kind: given?.kind ?? null,
        kindSource: given?.kind ? 'dictionary' : 'guess',
      };
      const empty = current.findIndex((draft) => !draft.text.trim());
      return empty >= 0
        ? current.map((draft, i) => (i === empty ? { ...draft, text, ...extra } : draft))
        : [...current, { ...EMPTY_MEANING, text, ...extra }];
    });

  const save = () => {
    const input = inputFromDrafts(term, drafts, tags, pair);

    if (!input.term) {
      setError(t.wordForm.errorTermEmpty);
    } else if (input.meanings.length === 0) {
      setError(t.wordForm.errorMeaningsEmpty);
    } else {
      setError(onSave(input));
    }
  };

  return (
    <>
      <Section title={t.wordForm.term}>
        <View style={styles.termRow}>
          <TextField
            value={term}
            onChangeText={setTerm}
            placeholder={t.wordForm.termPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            ref={termRef}
            style={styles.flex}
          />
          <SpeakButton text={term} language={pair.source} />
        </View>
        {/* Right under the word: the meanings found fill the translation fields below */}
        <MeaningFinder pair={pair} term={term} meanings={meaningTexts} onAdd={addMeaning} />
      </Section>

      <Section title={t.wordForm.meanings}>
        {drafts.map((draft, index) => (
          <Card key={index}>
            <TextField
              value={draft.text}
              onChangeText={(text) => updateDraft(index, { text })}
              placeholder={t.wordForm.meaningPlaceholder}
              autoCapitalize="none"
            />
            <TextField
              value={draft.note}
              onChangeText={(note) => updateDraft(index, { note })}
              placeholder={t.wordForm.notePlaceholder}
              autoCapitalize="none"
            />
            <TextField
              value={draft.examples}
              onChangeText={(examples) => updateDraft(index, { examples })}
              placeholder={t.wordForm.examplesPlaceholder}
              multiline
            />
            <MeaningTags
              kind={draftKind(draft, term, pair).kind}
              topics={draftTopics(draft, term, pair, filledCount <= 1)}
              byUser={draft.topicsByUser || draft.kindSource === 'user'}
              onKindChange={(kind) => updateDraft(index, { kind, kindSource: 'user' })}
              onTopicsChange={(topics) => updateDraft(index, { topics, topicsByUser: true })}
              onReset={() =>
                updateDraft(index, { topics: null, topicsByUser: false, kind: null, kindSource: 'guess', givenFor: '' })
              }
            />
            {drafts.length > 1 ? (
              <View style={styles.remove}>
                <Button label={t.wordForm.removeMeaning} tone="danger" size="sm" onPress={() => removeDraft(index)} />
              </View>
            ) : null}
          </Card>
        ))}

        <Button label={t.wordForm.addMeaning} tone="secondary" onPress={() => setDrafts([...drafts, EMPTY_MEANING])} />
      </Section>

      <Section title={t.examples.title}>
        <ExampleFinder pair={pair} term={term} meanings={meaningTexts} onAdd={addExample} />
      </Section>

      <Section title={t.wordForm.tags}>
        <TextField value={tags} onChangeText={setTags} placeholder={t.wordForm.tagsPlaceholder} autoCapitalize="none" />
      </Section>

      <View style={styles.actions}>
        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button label={t.common.save} onPress={save} />
        {onDelete ? <Button label={t.common.delete} tone="danger" onPress={onDelete} /> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  remove: {
    alignSelf: 'flex-end',
  },
  actions: {
    gap: spacing.md,
  },
});
