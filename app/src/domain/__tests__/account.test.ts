import { describe, expect, it } from '@jest/globals';

import { accountProblem, groupFriends, isFriendRequestResult, normalizeEmailCode, type FriendEntry } from '../account';

const entry = (nickname: string, status: FriendEntry['status']): FriendEntry => ({
  id: nickname,
  nickname,
  avatar: null,
  status,
  since: '2026-11-16T00:00:00Z',
});

describe('accounts', () => {
  it('groups friends and requests, by nickname', () => {
    const lists = groupFriends([entry('zoe', 'friend'), entry('ada', 'friend'), entry('bob', 'incoming'), entry('eve', 'outgoing')]);
    expect(lists.friends.map((friend) => friend.nickname)).toEqual(['ada', 'zoe']);
    expect(lists.incoming.map((friend) => friend.nickname)).toEqual(['bob']);
    expect(lists.outgoing.map((friend) => friend.nickname)).toEqual(['eve']);
  });

  it('recognises the answers of a friend request', () => {
    expect(isFriendRequestResult('sent')).toBe(true);
    expect(isFriendRequestResult('accepted')).toBe(true);
    expect(isFriendRequestResult('something else')).toBe(false);
  });

  it('explains the server errors', () => {
    expect(accountProblem({ message: 'nickname_taken' })).toBe('nicknameTaken');
    expect(accountProblem({ message: 'invalid_nickname' })).toBe('invalidNickname');
    expect(accountProblem({ message: 'Token has expired or is invalid' })).toBe('wrongCode');
    expect(accountProblem({ message: 'For security purposes, you can only request this after 52 seconds.' })).toBe(
      'tooManyAttempts'
    );
    expect(accountProblem(new TypeError('Network request failed'))).toBe('offline');
    expect(accountProblem({ message: 'TypeError: Failed to fetch' })).toBe('offline');
    expect(accountProblem(new Error('boom'))).toBe('unknown');
  });

  it('keeps only the digits of a typed code', () => {
    expect(normalizeEmailCode(' 12 34-56 7')).toBe('123456');
  });
});
