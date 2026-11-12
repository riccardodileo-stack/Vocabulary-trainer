// Form shared by the "new word" and "edit word" screens.
// Each meaning has its own categories and the word has a kind; both are filled in by themselves
// while typing (topic network, offline rules, Wiktionary); once the user touches them, their
// choice wins.

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { guessPartOfSpeech, PARTS_OF_SPEECH, type PartOfSpeech } from '@/domain/partOfSpeech';
import { normalizeText } from '@/domain/text';
import { suggestMeaningTopics } from '@/domain/topicClassifier';
import type { TopicId } from '@/domain/topics';
import type { NewWordInput, Word } from '@/domain/word';
import { useFocusAfterTransition } from '@/hooks/useFocusAfterTransition';
import { useT } from '@/i18n';
import type { ExampleSentence } from '@/services/tatoeba';
import { fetchPartOfSpeech } from '@/services/wiktionary';
import { spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { ChoiceChips } from './ChoiceChips';
import { ExampleFinder } from './ExampleFinder';
import { MeaningFinder } from './MeaningFinder';
import { MeaningTopics } from './MeaningTopics';
import { Section } from './Section';
import { TextField, type TextFieldRef } from './TextField';

type MeaningDraft = {
  text: string;
  note: string;
  examples: string;
  /** Topics given to this meaning (by the user, by Wiktionary or saved before). */
  topics: TopicId[];
  /** The translation `topics` was decided for: when the text changes, suggestions take over. */
  topicsFor: string;
  topicsByUser: boolean;
};

type WordFormProps = {
  pair: LanguagePair;
  initialWord?: Word;
  autoFocus?: boolean;
  /** Returns an error message to show, or null if the word was saved. */
  onSave: (input: NewWordInput) => string | null;
  onDelete?: () => void;
};

const EMPTY_MEANING: MeaningDraft = { text: '', note: '', examples: '', topics: [], topicsFor: '', topicsByUser: false };

function draftsFromWord(word: Word | undefined): MeaningDraft[] {
  if (!word || word.meanings.length === 0) {
    return [EMPTY_MEANING];
  }

  return word.meanings.map((meaning) => ({
    text: meaning.text,
    note: meaning.note ?? '',
    examples: meaning.examples.join('\n'),
    topics: meaning.topics ?? [],
    topicsFor: meaning.topics ? meaning.text.trim() : '',
    topicsByUser: meaning.topicsByUser === true,
  }));
}

/**
 * Topics shown for a meaning: the user's choice; the ones given for this very translation
 * (Wiktionary, saved word); otherwise the network's suggestion for the current text.
 */
function draftTopics(draft: MeaningDraft, term: string, pair: LanguagePair, onlyMeaning: boolean): TopicId[] {
  if (draft.topicsByUser || (draft.topicsFor && draft.topicsFor === draft.text.trim())) {
    return draft.topics;
  }
  return draft.text.trim() ? suggestMeaningTopics(term, draft.text, pair, onlyMeaning) : [];
}

function inputFromDrafts(term: string, drafts: MeaningDraft[], tags: string, pair: LanguagePair): NewWordInput {
  const filled = drafts.filter((draft) => draft.text.trim());
  return {
    term: term.trim(),
    meanings: filled.map((draft) => ({
      text: draft.text.trim(),
      note: draft.note.trim() || undefined,
      examples: draft.examples
        .split('\n')
        .map((example) => example.trim())
        .filter(Boolean),
      topics: draftTopics(draft, term, pair, filled.length === 1),
      topicsByUser: draft.topicsByUser || undefined,
    })),
    tags: tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

/** Wait after the last key before asking Wiktionary. */
const DICTIONARY_DELAY_MS = 800;

/** What a Wiktionary answer is about: the word and its first translation. */
function lookupKey(term: string, meanings: string[]): string {
  return `${normalizeText(term)}|${normalizeText(meanings[0] ?? '')}`;
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

  const [chosenKind, setChosenKind] = useState<PartOfSpeech | null>(
    initialWord?.partOfSpeechSource === 'user' ? initialWord.partOfSpeech : null
  );
  // Last Wiktionary answer and the word/translation it was for
  const [dictionaryKind, setDictionaryKind] = useState<{ key: string; kind: PartOfSpeech } | null>(
    initialWord?.partOfSpeechSource === 'dictionary'
      ? {
          key: lookupKey(
            initialWord.term,
            initialWord.meanings.map((meaning) => meaning.text)
          ),
          kind: initialWord.partOfSpeech,
        }
      : null
  );
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

  const key = lookupKey(term, meaningTexts);
  const fromDictionary = dictionaryKind?.key === key ? dictionaryKind.kind : null;
  const kind = chosenKind ?? fromDictionary ?? guessPartOfSpeech(term, meaningTexts, pair);
  const kindSource = chosenKind ? 'user' : fromDictionary ? 'dictionary' : 'guess';

  // Ask Wiktionary the kind of word, a moment after the user stops typing
  const firstMeaning = meaningTexts[0] ?? '';
  useEffect(() => {
    if (chosenKind || !term.trim()) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await fetchPartOfSpeech(pair, term, firstMeaning ? [firstMeaning] : []);
        if (!cancelled && found) {
          setDictionaryKind({ key: lookupKey(term, firstMeaning ? [firstMeaning] : []), kind: found });
        }
      } catch {
        // Offline: the guess stays, the background check retries after saving
      }
    }, DICTIONARY_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // pair is rebuilt on every render: depend on its parts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, firstMeaning, chosenKind, pair.source, pair.target]);

  /**
   * A meaning found online: in the first empty meaning, or in a new one. `topics` come with
   * it when Wiktionary says the field ("(medicine) …" -> health).
   */
  const addMeaning = (text: string, topics?: TopicId[]) =>
    setDrafts((current) => {
      const given = topics?.length ? { topics, topicsFor: text.trim() } : {};
      const empty = current.findIndex((draft) => !draft.text.trim());
      return empty >= 0
        ? current.map((draft, i) => (i === empty ? { ...draft, text, ...given } : draft))
        : [...current, { ...EMPTY_MEANING, text, ...given }];
    });

  const filledCount = drafts.filter((draft) => draft.text.trim()).length;

  const save = () => {
    const input: NewWordInput = {
      ...inputFromDrafts(term, drafts, tags, pair),
      partOfSpeech: kind,
      partOfSpeechSource: kindSource,
    };

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
            <MeaningTopics
              topics={draftTopics(draft, term, pair, filledCount <= 1)}
              byUser={draft.topicsByUser}
              onChange={(topics) => updateDraft(index, { topics, topicsByUser: true })}
              onReset={() => updateDraft(index, { topicsByUser: false, topicsFor: '' })}
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

      <Section
        title={t.wordForm.kindTitle}
        hint={
          { user: t.wordForm.kindHintUser, dictionary: t.wordForm.kindHintDictionary, guess: t.wordForm.kindHintGuess }[
            kindSource
          ]
        }>
        <ChoiceChips
          select="one"
          options={PARTS_OF_SPEECH.map((value) => ({ value, label: t.partsOfSpeech[value] }))}
          value={[kind]}
          onChange={([value]) => setChosenKind(value)}
        />
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
