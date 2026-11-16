// Asks the server the topics of one meaning (word + one of its translations). The server answers
// from its table (~400,000 pairs from Wiktionary, plus every pair already asked) or, for a new
// pair, asks a language model. See supabase/functions/classify-meaning on the `server` branch.

import type { LanguagePair } from '@/domain/languages';

import { SERVER } from './serverConfig';
import type { ClassifyResponse } from './serverContract';

const TIMEOUT_MS = 8000;

/**
 * The server's answer, or null when the server can't be reached (offline, timeout): the caller
 * keeps what it has and may ask again later.
 */
export async function classifyOnServer(
  { source, target }: LanguagePair,
  term: string,
  translation: string
): Promise<ClassifyResponse | null> {
  // AbortSignal.timeout is missing on some phones: a timer does the same
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${SERVER.url}/functions/v1/classify-meaning`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${SERVER.anonKey}`,
        apikey: SERVER.anonKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ sourceLang: source, targetLang: target, term, translation }),
      signal: controller.signal,
    });
    return (await response.json()) as ClassifyResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
