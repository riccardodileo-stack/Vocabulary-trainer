import { describe, expect, it } from '@jest/globals';

import {
  generateFriendCode,
  isValidEmail,
  isValidFriendCode,
  nicknameProblem,
  normalizeFriendCode,
  normalizeNickname,
} from '../profile';

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('stefano@example.com')).toBe(true);
    expect(isValidEmail('  nome.cognome@mail.polimi.it ')).toBe(true);
  });

  it('rejects obvious mistakes', () => {
    expect(isValidEmail('stefano')).toBe(false);
    expect(isValidEmail('stefano@example')).toBe(false);
    expect(isValidEmail('ste fano@example.com')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });
});

describe('nickname', () => {
  it('is normalized: no @, no spaces, lower case', () => {
    expect(normalizeNickname('  @Stefano ')).toBe('stefano');
    expect(normalizeNickname('@@Ste_95')).toBe('ste_95');
  });

  it('accepts letters, digits, _ and ., starting with a letter', () => {
    expect(nicknameProblem('stefano')).toBeNull();
    expect(nicknameProblem('ste.chiari_95')).toBeNull();
  });

  it('explains what is wrong', () => {
    expect(nicknameProblem('st')).toBe('tooShort');
    expect(nicknameProblem('a'.repeat(21))).toBe('tooLong');
    expect(nicknameProblem('ste fano')).toBe('invalidCharacters');
    expect(nicknameProblem('stefanò')).toBe('invalidCharacters');
    expect(nicknameProblem('95stefano')).toBe('mustStartWithLetter');
  });
});

describe('friend code', () => {
  it('has the form ABCD-EFGH without look-alike characters', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateFriendCode();
      expect(isValidFriendCode(code)).toBe(true);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('is deterministic with a given random source', () => {
    expect(generateFriendCode(() => 0)).toBe('2222-2222');
  });

  it('reads what the user types', () => {
    expect(normalizeFriendCode('abcd efgh')).toBe('ABCD-EFGH');
    expect(normalizeFriendCode('ab-cd-ef-gh')).toBe('ABCD-EFGH');
    expect(isValidFriendCode(normalizeFriendCode('k7m2 x9pq'))).toBe(true);
  });
});
