// deno test supabase/functions/classify-meaning/classify.test.ts
import { assertEquals } from 'jsr:@std/assert@1';

import { keyForm, normalizeText, parseRequest, storageKey } from './classify.ts';

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
