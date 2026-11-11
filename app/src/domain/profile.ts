// Rules for the profile fields: email, nickname, friend code.

/** Light check: something@something.xx, no spaces. The real check will be the server's. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ── Nickname ─────────────────────────────────────────────────────────────
// The public handle ("@stefano"). It will have to be unique: the server will
// check it when accounts exist. Locally only its shape is checked.

export const NICKNAME_MIN_LENGTH = 3;
export const NICKNAME_MAX_LENGTH = 20;

/** "  @Stefano " -> "stefano": no "@", no spaces, lower case (so "Stefano" and "stefano" are the same nick). */
export function normalizeNickname(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

export type NicknameProblem = 'tooShort' | 'tooLong' | 'invalidCharacters' | 'mustStartWithLetter';

/**
 * Allowed: letters a–z, digits, "_" and ".", 3–20 characters, starting with a letter.
 * Returns null if the (normalized) nickname is fine.
 */
export function nicknameProblem(nickname: string): NicknameProblem | null {
  if (nickname.length < NICKNAME_MIN_LENGTH) {
    return 'tooShort';
  }
  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return 'tooLong';
  }
  if (!/^[a-z0-9_.]+$/.test(nickname)) {
    return 'invalidCharacters';
  }
  if (!/^[a-z]/.test(nickname)) {
    return 'mustStartWithLetter';
  }
  return null;
}

// ── Friend code ──────────────────────────────────────────────────────────
// Created once, on the first launch, and never changed: it is how friends find
// each other even if the nickname changes. Format "ABCD-EFGH": 8 characters
// without look-alikes (no 0/O, 1/I/L), easy to read aloud and type.

const FRIEND_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const FRIEND_CODE_LENGTH = 8;

/** `random` returns numbers in [0, 1); injectable for tests. */
export function generateFriendCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
    code += FRIEND_CODE_ALPHABET[Math.floor(random() * FRIEND_CODE_ALPHABET.length)];
    if (i === FRIEND_CODE_LENGTH / 2 - 1) {
      code += '-';
    }
  }
  return code;
}

export function isValidFriendCode(code: string): boolean {
  return new RegExp(`^[${FRIEND_CODE_ALPHABET}]{4}-[${FRIEND_CODE_ALPHABET}]{4}$`).test(code);
}

/** What a user types to add a friend: "abcd efgh" -> "ABCD-EFGH". */
export function normalizeFriendCode(input: string): string {
  const compact = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return compact.length === FRIEND_CODE_LENGTH ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact;
}
