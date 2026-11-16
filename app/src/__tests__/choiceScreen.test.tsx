// Screen test: the multiple-choice exercise from the first question to the results.
// The navigation, the sounds and the voice are replaced by fakes; the stores are the real ones.

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ChoiceScreen from '@/app/choice';
import { it as texts } from '@/i18n/it';
import { useSettingsStore } from '@/store/settingsStore';
import { useWordStore } from '@/store/wordStore';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { back: () => mockBack(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => ({ kind: 'choice', direction: 'forward', mode: 'all', count: '2' }),
}));
jest.mock('react-native-reanimated', () => jest.requireActual('./fakes/reanimated'));
jest.mock('@/services/sounds', () => ({ playSound: jest.fn(), soundsForScreen: () => () => {} }));
jest.mock('@/services/speech', () => ({ speak: jest.fn(), stopSpeaking: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('multiple-choice screen', () => {
  it('asks the questions, records the answers and shows the result', async () => {
    useSettingsStore.setState({ uiLanguage: 'it', studyLanguage: 'en', nativeLanguage: 'it' });
    const pair = { source: 'en', target: 'it' } as const;
    const { addWord } = useWordStore.getState();
    addWord(pair, { term: 'dog', meanings: [{ text: 'cane', examples: [] }] });
    addWord(pair, { term: 'house', meanings: [{ text: 'casa', examples: [] }] });

    await render(<ChoiceScreen />);

    for (let question = 0; question < 2; question += 1) {
      const asked = screen.queryByText('dog') ? 'cane' : 'casa';
      // Four answers, the right one among them
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4);
      await fireEvent.press(screen.getByText(asked));
      // A right answer moves on by itself after a moment; "Avanti" does it at once
      await fireEvent.press(screen.getByText(question === 0 ? texts.quiz.next : texts.quiz.finish));
    }

    expect(useWordStore.getState().words.map((word) => word.stats.correct)).toEqual([1, 1]);
    await fireEvent.press(screen.getByText(texts.quiz.done));
    expect(mockBack).toHaveBeenCalled();
  });
});
