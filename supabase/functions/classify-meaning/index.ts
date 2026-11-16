// classify-meaning: topics and kind of word of one meaning (a word with one of its translations).
//
//   POST /functions/v1/classify-meaning
//   { "sourceLang": "en", "targetLang": "it", "term": "stroke", "translation": "ictus" }
//   → { "ok": true, "topics": ["health"], "partOfSpeech": "noun", "source": "model", "cached": false }
//
// 1. the pair is already in meaning_topics → answered from there (fast, free);
// 2. otherwise the language model is asked (at most MAX_MODEL_CALLS_PER_DAY a day), the answer
//    is saved and returned. Types of request and answer: ../_shared/contract.ts.

import { createClient } from 'npm:@supabase/supabase-js@2';

import type { ClassifyResponse } from '../_shared/contract.ts';
import { parseRequest, storageKey } from './classify.ts';
import { classifyWithGemini, DEFAULT_MODEL } from './gemini.ts';

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

  // 1. Already known
  const { data: saved, error: readError } = await supabase.from('meaning_topics').select('*').match(key).maybeSingle();
  if (readError) {
    console.error('read meaning_topics', readError);
  }
  if (saved) {
    return reply({ ok: true, topics: saved.topics, partOfSpeech: saved.part_of_speech, source: saved.source, cached: true });
  }

  // 2. Ask the model, within the daily cap
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return reply({ ok: false, error: 'unavailable', message: 'GEMINI_API_KEY is not set.' }, 503);
  }
  const maxCalls = Number(Deno.env.get('MAX_MODEL_CALLS_PER_DAY') ?? 500);
  const { data: allowed, error: capError } = await supabase.rpc('take_model_call', { max_calls: maxCalls });
  if (capError || !allowed) {
    if (capError) console.error('take_model_call', capError);
    return reply({ ok: false, error: 'unavailable', message: 'Daily limit of model calls reached.' }, 503);
  }

  const model = Deno.env.get('GEMINI_MODEL') ?? DEFAULT_MODEL;
  try {
    const answer = await classifyWithGemini(request, apiKey, model);
    const { error: writeError } = await supabase.from('meaning_topics').upsert({
      ...key,
      topics: answer.topics,
      part_of_speech: answer.partOfSpeech,
      source: 'model',
      model,
    });
    if (writeError) {
      console.error('write meaning_topics', writeError);
    }
    return reply({ ok: true, topics: answer.topics, partOfSpeech: answer.partOfSpeech, source: 'model', cached: false });
  } catch (error) {
    console.error('model', error);
    // The reason helps to fix the setup (wrong key, unknown model…); it never contains the key
    const reason = error instanceof Error ? error.message.slice(0, 200) : 'unknown error';
    return reply({ ok: false, error: 'unavailable', message: `The model did not answer: ${reason}` }, 503);
  }
});
