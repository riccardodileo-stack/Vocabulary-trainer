// Accounts: what the server sends back, turned into simple values for the app.
// Pure functions only (tested); the calls are in services/account.ts.

/** A profile as the server stores it (table profiles). */
export type ServerProfile = {
  id: string;
  nickname: string;
  friend_code: string;
  /** Drawn avatar id; null when the user has a photo (photos stay on the phone). */
  avatar: string | null;
  created_at: string;
};

/** One line of my_friends(): a friend, or a request received or sent. */
export type FriendEntry = {
  id: string;
  nickname: string;
  avatar: string | null;
  status: 'friend' | 'incoming' | 'outgoing';
  since: string;
};

export type FriendLists = {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
};

export function groupFriends(entries: FriendEntry[]): FriendLists {
  const byNick = (a: FriendEntry, b: FriendEntry) => a.nickname.localeCompare(b.nickname);
  return {
    friends: entries.filter((entry) => entry.status === 'friend').sort(byNick),
    incoming: entries.filter((entry) => entry.status === 'incoming').sort(byNick),
    outgoing: entries.filter((entry) => entry.status === 'outgoing').sort(byNick),
  };
}

/** What send_friend_request() answers. */
export type FriendRequestResult =
  | 'sent'
  | 'accepted'
  | 'already_friends'
  | 'already_sent'
  | 'not_found'
  | 'self'
  | 'too_many';

const REQUEST_RESULTS: FriendRequestResult[] = [
  'sent',
  'accepted',
  'already_friends',
  'already_sent',
  'not_found',
  'self',
  'too_many',
];

export function isFriendRequestResult(value: unknown): value is FriendRequestResult {
  return typeof value === 'string' && (REQUEST_RESULTS as string[]).includes(value);
}

/**
 * Problems the app explains to the user. The server raises its rule errors by name
 * (nickname_taken, invalid_nickname…); network failures and everything else are told apart.
 */
export type AccountProblem =
  | 'offline'
  | 'nicknameTaken'
  | 'invalidNickname'
  | 'invalidEmail'
  | 'wrongCode'
  | 'tooManyAttempts'
  | 'notSignedIn'
  | 'unknown';

/** Turns an error from supabase-js (or fetch) into one of the problems above. */
export function accountProblem(error: unknown): AccountProblem {
  const text = errorText(error).toLowerCase();
  if (text.includes('nickname_taken')) return 'nicknameTaken';
  if (text.includes('invalid_nickname')) return 'invalidNickname';
  if (text.includes('not_signed_in') || text.includes('no_profile')) return 'notSignedIn';
  if (text.includes('token has expired') || text.includes('otp') || text.includes('invalid token')) return 'wrongCode';
  if (text.includes('rate limit') || text.includes('too many') || text.includes('security purposes')) return 'tooManyAttempts';
  if (text.includes('email') && (text.includes('invalid') || text.includes('valid'))) return 'invalidEmail';
  if (
    text.includes('network request failed') ||
    text.includes('failed to fetch') ||
    text.includes('fetch failed') ||
    text.includes('networkerror') ||
    text.includes('aborted') ||
    text.includes('timeout')
  ) {
    return 'offline';
  }
  return 'unknown';
}

function errorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const { message, code, error_description: description } = error as Record<string, unknown>;
    return [message, code, description].filter((part) => typeof part === 'string').join(' ');
  }
  return String(error);
}

/** A 6-digit email code as typed: only digits, at most 6. */
export function normalizeEmailCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}
