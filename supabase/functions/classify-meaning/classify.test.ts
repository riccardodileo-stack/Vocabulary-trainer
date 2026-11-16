// deno test supabase/functions/classify-meaning/classify.test.ts
import { assertEquals } from 'jsr:@std/assert@1';

import { buildPrompt, keyForm, normalizeText, parseModelAnswer, parseRequest, storageKey } from './classify.ts';

Deno.test('normalizes like the app', () => {
  assertEquals(normalizeText('  Heart   Attack '), 'heart attack');
});

Deno.test('database key: no article, no accents (like the app and the Wiktionary lists)', () => {
  assertEquals(keyForm(' The  Court ', 'en'), 'court');
  assertEquals(keyForm('to bake', 'en'), 'bake');
  assertEquals(keyForm("l'Università", 'it'), 'universita');
  assertEquals(keyForm('der Schlaganfall', 'de'), 'schlaganfall');
  assertEquals(storageKey({ sourceLang: 'en', targetLang: 'it', term: 'stroke', translation: 'la città' }), {
    source_lang: 'en',
    target_lang: 'it',
    term: 'stroke',
    translation: 'citta',
  });
});

Deno.test('accepts a valid request and normalizes it', () => {
  assertEquals(parseRequest({ sourceLang: 'en', targetLang: 'it', term: ' Stroke', translation: 'Ictus ', example: ' ' }), {
    sourceLang: 'en',
    targetLang: 'it',
    term: 'stroke',
    translation: 'ictus',
  });
});

Deno.test('rejects wrong requests with a message', () => {
  for (const body of [
    null,
    'text',
    { sourceLang: 'en', targetLang: 'en', term: 'a', translation: 'b' },
    { sourceLang: 'xx', targetLang: 'it', term: 'a', translation: 'b' },
    { sourceLang: 'en', targetLang: 'it', term: '', translation: 'b' },
    { sourceLang: 'en', targetLang: 'it', term: 'a'.repeat(81), translation: 'b' },
    { sourceLang: 'en', targetLang: 'it', term: 'a', translation: 3 },
  ]) {
    assertEquals(typeof parseRequest(body), 'string');
  }
});

Deno.test('the prompt names the meaning and every topic', () => {
  const prompt = buildPrompt({ sourceLang: 'en', targetLang: 'it', term: 'stroke', translation: 'ictus' });
  assertEquals(prompt.includes('"stroke"') && prompt.includes('"ictus"'), true);
  assertEquals(prompt.includes('- feelings:'), true);
  assertEquals(prompt.includes('Example sentence'), false);
});

Deno.test('reads the model answer and drops what is not allowed', () => {
  assertEquals(parseModelAnswer('{"topics":["health"],"partOfSpeech":"noun"}'), { topics: ['health'], partOfSpeech: 'noun' });
  assertEquals(parseModelAnswer('{"topics":["sport","xyz","food","tech","health"],"partOfSpeech":"adverb"}'), {
    topics: ['tech', 'health', 'food'],
    partOfSpeech: null,
  });
  assertEquals(parseModelAnswer('not json'), null);
  assertEquals(parseModelAnswer('{"partOfSpeech":"noun"}'), null);
});
