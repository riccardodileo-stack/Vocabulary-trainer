// Reads words aloud with the phone's own voices (expo-speech): free, offline, any word.

import * as Speech from 'expo-speech';

import type { LanguageCode } from '@/domain/languages';
import { splitSlashOptions } from '@/domain/text';

/** Voice used for each language. */
const VOICE_LANGUAGE: Record<LanguageCode, string> = {
  en: 'en-GB',
  it: 'it-IT',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
};

/** A little slower than normal speech: easier to catch for a learner. */
const RATE = 0.9;

/**
 * Says `text` in `language`, stopping whatever was being said. Of "colour / color" only the
 * first form is read. `onDone` is called when the voice has finished (or was stopped).
 */
export function speak(text: string, language: LanguageCode, onDone?: () => void) {
  const words = splitSlashOptions(text)[0] ?? text;
  Speech.stop();
  Speech.speak(words, {
    language: VOICE_LANGUAGE[language],
    rate: RATE,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}
