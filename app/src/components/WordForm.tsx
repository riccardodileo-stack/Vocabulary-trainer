// Form shared by the "new word" and "edit word" screens.
// Each meaning has its own categories and the word has a kind; both are filled in by themselves
// while typing (topic network, offline rules, Wiktionary); once the user touches them, their
// choice wins.

import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { guessPartOfSpeech, PARTS_OF_SPEECH, type PartOfSpeech } from '@/domain/partOfSpeech';
import { normalizeText } from '@/domain/text';
import { suggestMeaningTopics } from '@/domain/topicClassifier';
import type { TopicId } from '@/domain/topics';
import { createId, type NewWordInput, type Word } from '@/domain/word';
import { useFocusAfterTransition } from '@/hooks/useFocusAfterTransition';
import { useT } from '@/i18n';
import type { ExampleSentence } from '@/services/tatoeba';
import { fetchPartOfSpeech } from '@/services/wiktionary';
import { fontSize, iconSize, spacing, touchTarget, useTextScale, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Appear } from './Appear';
import { Button } from './Button';
import { Card } from './Card';
import { ChoiceChips } from './ChoiceChips';
import { ExampleFinder } from './ExampleFinder';
import { MeaningFinder } from './MeaningFinder';
import { MeaningTopics } from './MeaningTopics';
import { Section } from './Section';
import { SpeakButton } from './SpeakButton';
import { SwipeableTranslation } from './SwipeableTranslation';
import { TextField, type TextFieldRef } from './TextField';

type MeaningDraft = {
  id: string;
  text: string;
  note: string;
  examples: string;
  noteOpen?: boolean;
  examplesOpen?: boolean;
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

function makeMeaningDraft(values: Partial<Omit<MeaningDraft, 'id'>> = {}): MeaningDraft {
  return {
    text: '',
    note: '',
    examples: '',
    topics: [],
    topicsFor: '',
    topicsByUser: false,
    ...values,
    id: createId(),
  };
}

function draftsFromWord(word: Word | undefined): MeaningDraft[] {
  if (!word || word.meanings.length === 0) {
    return [makeMeaningDraft()];
  }

  return word.meanings.map((meaning) =>
    makeMeaningDraft({
      text: meaning.text,
      note: meaning.note ?? '',
      examples: meaning.examples.join('\n'),
      topics: meaning.topics ?? [],
      topicsFor: meaning.topics ? meaning.text.trim() : '',
      topicsByUser: meaning.topicsByUser === true,
    }),
  );
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

function inputFromDrafts(term: string, drafts: MeaningDraft[], pair: LanguagePair): NewWordInput {
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

function CollapsibleField({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.collapsibleField}>
      <View style={styles.fieldToggle}>
        <AppText variant="caption" color="textMuted" style={styles.flex} accessible={false}>
          {title}
        </AppText>

        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => [styles.fieldArrowButton, pressed && styles.fieldPressed]}>
          <SymbolView
            name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
            size={iconSize.sm}
            tintColor={colors.textMuted}
            accessible={false}
            pointerEvents="none"
            style={open ? styles.fieldArrowOpen : undefined}
          />
        </Pressable>
      </View>

      {open ? <Appear from="down" exit={false}>{children}</Appear> : null}
    </View>
  );
}

export function WordForm({ pair, initialWord, autoFocus = true, onSave, onDelete }: WordFormProps) {
  const t = useT();
  const textScale = useTextScale();
  const mainFieldStyle = [styles.mainField, { fontSize: fontSize.large * textScale }];
  const [term, setTerm] = useState(initialWord?.term ?? '');
  const [drafts, setDrafts] = useState(() => draftsFromWord(initialWord));
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

  const updateDraft = (id: string, changes: Partial<MeaningDraft>) =>
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...changes } : draft)));

  const toggleDraftField = (id: string, field: 'noteOpen' | 'examplesOpen') => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [field]: !draft[field] } : draft)),
    );
  };

  const removeDraft = (id: string) =>
    setDrafts((current) =>
      current.length > 1 ? current.filter((draft) => draft.id !== id) : current,
    );

  const addDraft = () => {
    const draft = makeMeaningDraft();
    setDrafts((current) => [...current, draft]);
  };

  const addExample = (sentence: ExampleSentence) => {
    const draft = drafts[meaningIndexFor(drafts, sentence)];
    const example = `${sentence.text} — ${sentence.translation}`;
    const current = draft.examples.trim();
    updateDraft(draft.id, { examples: current ? `${current}\n${example}` : example });
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
  const addMeaning = (text: string, topics?: TopicId[]) => {
    const given = topics?.length ? { topics, topicsFor: text.trim() } : {};
    const draft = makeMeaningDraft({ text, ...given });

    setDrafts((current) => {
      const empty = current.findIndex((item) => !item.text.trim());
      return empty >= 0
        ? current.map((item, i) => (i === empty ? { ...item, text, ...given } : item))
        : [...current, draft];
    });
  };


  const filledCount = drafts.filter((draft) => draft.text.trim()).length;

  const save = () => {
    const input: NewWordInput = {
      ...inputFromDrafts(term, drafts, pair),
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
        <View style={styles.termRow}>
          <TextField
            value={term}
            onChangeText={setTerm}
            placeholder={t.wordForm.termPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            ref={termRef}
            style={[styles.flex, mainFieldStyle]}
          />
          <SpeakButton text={term} language={pair.source} />
        </View>
        {/* Right under the word: the meanings found fill the translation fields below */}
        <MeaningFinder pair={pair} term={term} meanings={meaningTexts} onAdd={addMeaning} />
      </Section>

      <Section title={t.wordForm.meanings}>
        {drafts.map((draft) => {
          const onRemove = drafts.length > 1 ? () => removeDraft(draft.id) : undefined;

          return (
            <SwipeableTranslation key={draft.id} removeLabel={t.wordForm.removeMeaning} onRemove={onRemove}>
              <Card style={styles.meaningCard}>
                <TextField
                  value={draft.text}
                  onChangeText={(text) => updateDraft(draft.id, { text })}
                  placeholder={t.wordForm.meaningPlaceholder}
                  autoCapitalize="none"
                  style={mainFieldStyle}
                  accessibilityActions={
                    onRemove ? [{ name: 'removeMeaning', label: t.wordForm.removeMeaning }] : undefined
                  }
                  onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === 'removeMeaning') onRemove?.();
                  }}
                />
                <CollapsibleField
                  title={t.wordForm.noteTitle}
                  open={draft.noteOpen ?? false}
                  onToggle={() => toggleDraftField(draft.id, 'noteOpen')}>
                  <TextField
                    value={draft.note}
                    onChangeText={(note) => updateDraft(draft.id, { note })}
                    placeholder={t.wordForm.notePlaceholder}
                    autoCapitalize="none"
                  />
                </CollapsibleField>
                <CollapsibleField
                  title={t.wordForm.examplesTitle}
                  open={draft.examplesOpen ?? false}
                  onToggle={() => toggleDraftField(draft.id, 'examplesOpen')}>
                  <TextField
                    value={draft.examples}
                    onChangeText={(examples) => updateDraft(draft.id, { examples })}
                    placeholder={t.wordForm.examplesPlaceholder}
                    multiline
                  />
                </CollapsibleField>
                <MeaningTopics
                  topics={draftTopics(draft, term, pair, filledCount <= 1)}
                  byUser={draft.topicsByUser}
                  onChange={(topics) => updateDraft(draft.id, { topics, topicsByUser: true })}
                  onReset={() => updateDraft(draft.id, { topicsByUser: false, topicsFor: '' })}
                />
              </Card>
            </SwipeableTranslation>
          );
        })}

        <Button label={t.wordForm.addMeaning} tone="secondary" onPress={addDraft} />
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
  mainField: {
    minHeight: touchTarget + spacing.xs,
    paddingVertical: spacing.sm,
  },
  meaningCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  collapsibleField: {
    gap: spacing.xs,
  },
  fieldToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing.xxl,
    gap: spacing.sm,
  },
  fieldArrowButton: {
    width: spacing.xxl,
    minHeight: spacing.xxl,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  fieldPressed: {
    opacity: 0.65,
  },
  fieldArrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});
