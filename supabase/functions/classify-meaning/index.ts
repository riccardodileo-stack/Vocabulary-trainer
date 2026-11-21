// classify-meaning: topics and kind of word of one meaning (a word with one of its translations).
//
//   POST /functions/v1/classify-meaning
//   { "sourceLang": "en", "targetLang": "it", "term": "stroke", "translation": "ictus" }
//   → { "ok": true, "topics": ["health"], "partOfSpeech": "noun", "source": "dictionary", "cached": true }
//
// Answers only from meaning_topics (the ~408,000 Wiktionary pairs, plus answers saved
// before): a pair that isn't there gets { ok: false, error: "not_found" } and the app keeps its
// offline guess. No language model is called any more (removed on 21/11/2026: the Gemini API
// terms don't allow its free plan with users in the EU, nor apps used by under-18s).
// Types of request and answer: ../_shared/contract.ts.

import { createClient } from 'npm:@supabase/supabase-js@2';

import type { ClassifyResponse } from '../_shared/contract.ts';
import { parseRequest, storageKey } from './classify.ts';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function reply(body: ClassifyResponse, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}

// Provided by Supabase in every Edge Function (locally and online)
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }
  if (req.method !== 'POST') {
    return reply({ ok: false, error: 'bad_request', message: 'Use POST.' }, 405);
  }

  const request = parseRequest(await req.json().catch(() => null));
  if (typeof request === 'string') {
    return reply({ ok: false, error: 'bad_request', message: request }, 400);
  }
  const key = storageKey(request);

  // 1. Known (Wiktionary, or saved before)
  const { data: saved, error: readError } = await supabase.from('meaning_topics').select('*').match(key).maybeSingle();
  if (readError) {
    console.error('read meaning_topics', readError);
    return reply({ ok: false, error: 'unavailable', message: 'The dictionary can not be read right now.' }, 503);
  }
  if (saved) {
    return reply({ ok: true, topics: saved.topics, partOfSpeech: saved.part_of_speech, source: saved.source, cached: true });
  }

  // 2. Not known: the app keeps its own offline guess and doesn't ask again
  return reply({ ok: false, error: 'not_found', message: 'This pair is not in the dictionary.' }, 404);
});
