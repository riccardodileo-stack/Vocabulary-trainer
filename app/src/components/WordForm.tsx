// Form shared by the "new word" and "edit word" screens.

import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { normalizeText } from '@/domain/text';
import type { NewWordInput, Word } from '@/domain/word';
import { useFocusAfterTransition } from '@/hooks/useFocusAfterTransition';
import { useT } from '@/i18n';
import type { ExampleSentence } from '@/services/tatoeba';
import { spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { ExampleFinder } from './ExampleFinder';
import { MeaningFinder } from './MeaningFinder';
import { Section } from './Section';
import { TextField, type TextFieldRef } from './TextField';

type MeaningDraft = { text: string; note: string; examples: string };

type WordFormProps = {
  pair: LanguagePair;
  initialWord?: Word;
  autoFocus?: boolean;
  /** Returns an error message to show, or null if the word was saved. */
  onSave: (input: NewWordInput) => string | null;
  onDelete?: () => void;
};

const EMPTY_MEANING: MeaningDraft = { text: '', note: '', examples: '' };

function draftsFromWord(word: Word | undefined): MeaningDraft[] {
  if (!word || word.meanings.length === 0) {
    return [EMPTY_MEANING];
  }

  return word.meanings.map((meaning) => ({
    text: meaning.text,
    note: meaning.note ?? '',
    examples: meaning.examples.join('\n'),
  }));
}

function inputFromDrafts(term: string, drafts: MeaningDraft[], tags: string): NewWordInput {
  return {
    term: term.trim(),
    meanings: drafts
      .filter((draft) => draft.text.trim())
      .map((draft) => ({
        text: draft.text.trim(),
        note: draft.note.trim() || undefined,
        examples: draft.examples
          .split('\n')
          .map((example) => example.trim())
          .filter(Boolean),
      })),
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
    updateDraft(index, { examples: current ? `${current}
${example}` : example });
  };

  const meaningTexts = drafts.map((draft) => draft.text.trim()).filter(Boolean);

  /** A meaning found online: in the first empty meaning, or in a new one. */
  const addMeaning = (text: string) =>
    setDrafts((current) => {
      const empty = current.findIndex((draft) => !draft.text.trim());
      return empty >= 0
        ? current.map((draft, i) => (i === empty ? { ...draft, text } : draft))
        : [...current, { ...EMPTY_MEANING, text }];
    });

  const save = () => {
    const input = inputFromDrafts(term, drafts, tags);

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
        <TextField
          value={term}
          onChangeText={setTerm}
          placeholder={t.wordForm.termPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          ref={termRef}
        />
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
  remove: {
    alignSelf: 'flex-end',
  },
  actions: {
    gap: spacing.md,
  },
});
