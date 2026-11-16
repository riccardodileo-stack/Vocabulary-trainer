// Asks Gemini the topics of one meaning. To use another model, write a function with the
// same signature and call it from index.ts instead.
//
// Secrets (npx supabase secrets set …, or supabase/functions/.env locally):
//   GEMINI_API_KEY  key from https://aistudio.google.com/apikey
//   GEMINI_MODEL    optional, default below
// The free tier is fine for development. For the published app (users in the EU) Google
// requires the paid tier, and the free tier uses the requests to improve its products.

import type { ClassifyRequest } from '../_shared/contract.ts';
import { buildPrompt, type ModelAnswer, parseModelAnswer, RESPONSE_SCHEMA } from './classify.ts';

/** "-latest" follows Google's newest model of that size: cheap, fast, good enough for labels. */
export const DEFAULT_MODEL = 'gemini-flash-lite-latest';

const TIMEOUT_MS = 10_000;

export async function classifyWithGemini(request: ClassifyRequest, apiKey: string, model: string): Promise<ModelAnswer> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(request) }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  );
  if (!response.ok) {
    throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const answer = typeof text === 'string' ? parseModelAnswer(text) : null;
  if (!answer) {
    throw new Error(`Gemini gave an unreadable answer: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return answer;
}
