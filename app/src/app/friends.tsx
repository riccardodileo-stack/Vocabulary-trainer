// Sheet opened from the friends in Profile. At the top: add a friend by nickname (search as
// you type) or with their friend code (they get a request to accept), and the user's own code,
// ready to share. Below: requests received, friends, requests sent.
// Everything comes from the server (services/account.ts); the counters in Profile follow.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { TextField } from '@/components/TextField';
import { AVATAR_PRESETS, isAvatarId } from '@/content/avatars';
import {
  accountProblem,
  groupFriends,
  nicknameQuery,
  type FriendEntry,
  type FriendLists,
  type FriendRequestResult,
  type ProfileSearchResult,
} from '@/domain/account';
import { isValidFriendCode, normalizeFriendCode } from '@/domain/profile';
import { refreshFriendCounts } from '@/hooks/useAccountSession';
import { useT } from '@/i18n';
import {
  fetchFriends,
  photoUrl,
  removeFriend,
  respondFriendRequest,
  searchProfiles,
  sendFriendRequest,
  sendFriendRequestByNick,
} from '@/services/account';
import { useProfileStore } from '@/store/profileStore';
import { fontSize, fontWeight, radius, spacing, useTheme } from '@/theme';

const NO_LISTS: FriendLists = { friends: [], incoming: [], outgoing: [] };

/** Wait after the last key before searching nicknames. */
const SEARCH_DELAY_MS = 400;

/** The last answer of the nickname search: results, or what went wrong. */
type Found = { query: string; round: number } & ({ results: ProfileSearchResult[] } | { message: string });

type Person = Pick<FriendEntry, 'nickname' | 'avatar' | 'photo_path'>;

function FriendRow({ entry, children }: { entry: Person; children: ReactNode }) {
  const { colors } = useTheme();
  const avatarId = entry.avatar && isAvatarId(entry.avatar) ? entry.avatar : AVATAR_PRESETS[0].id;
  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Avatar
        avatar={entry.photo_path ? { kind: 'photo', uri: photoUrl(entry.photo_path) } : { kind: 'preset', id: avatarId }}
        size={44}
      />
      <AppText variant="bodyBold" style={styles.flex} numberOfLines={1}>
        @{entry.nickname}
      </AppText>
      <View style={styles.rowActions}>{children}</View>
    </View>
  );
}

export default function FriendsSheet() {
  const t = useT();
  const { colors } = useTheme();
  const friendCode = useProfileStore((state) => state.friendCode);
  const nickname = useProfileStore((state) => state.nickname);
  const [lists, setLists] = useState<FriendLists>(NO_LISTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // What's typed in the add field: a nickname (or its beginning) or a friend code
  const [text, setText] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [searchRound, setSearchRound] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ text: string; good: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const next = groupFriends(await fetchFriends());
      setLists(next);
      setLoadError(null);
      useProfileStore.getState().setFriendCounts(next.friends.length, next.incoming.length);
    } catch (error) {
      setLoadError(t.account.problems[accountProblem(error)] ?? t.friends.error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Every time the page is shown: requests may have arrived meanwhile
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const code = normalizeFriendCode(text);
  const isCode = isValidFriendCode(code);
  const query = nicknameQuery(text);

  // Nickname search, a moment after the last key (and again after a request: relations change)
  useEffect(() => {
    if (!query) {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchProfiles(query)
        .then((results) => !cancelled && setFound({ query, round: searchRound, results }))
        .catch((error) => {
          if (!cancelled) {
            setFound({ query, round: searchRound, message: t.account.problems[accountProblem(error)] });
          }
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchRound, t]);
  // The answer shown is the one for what's typed now; until it arrives, "searching".
  // After a request the old results stay on screen while they are refreshed.
  const current = query && found?.query === query ? found : null;
  const searching = Boolean(query) && (!current || current.round !== searchRound);
  const results = current && 'results' in current ? current.results : null;

  // Sends a request (by code or by nickname) and tells how it went
  const send = async (request: () => Promise<FriendRequestResult>, clearField: boolean) => {
    setSending(true);
    setResult(null);
    try {
      const answer = await request();
      const good = answer === 'sent' || answer === 'accepted';
      setResult({ text: t.friends.results[answer], good });
      if (good && clearField) {
        setText('');
      }
      load();
      refreshFriendCounts();
      setSearchRound((round) => round + 1);
    } catch (error) {
      setResult({ text: t.account.problems[accountProblem(error)], good: false });
    } finally {
      setSending(false);
    }
  };

  const sendCode = () => send(() => sendFriendRequest(code), true);

  // What each search result offers, by how the person is related to the user
  const searchAction = (person: ProfileSearchResult) => {
    switch (person.relation) {
      case 'none':
        return (
          <Button
            label={t.friends.add}
            size="sm"
            disabled={sending}
            onPress={() => send(() => sendFriendRequestByNick(person.nickname), false)}
          />
        );
      case 'incoming':
        return (
          <Button
            label={t.friends.accept}
            size="sm"
            disabled={sending}
            onPress={() => send(() => sendFriendRequestByNick(person.nickname), false)}
          />
        );
      case 'outgoing':
        return <AppText variant="small" color="textMuted">{t.friends.relation.outgoing}</AppText>;
      case 'friend':
        return <AppText variant="small" color="primary">{t.friends.relation.friend}</AppText>;
    }
  };

  // Runs an action on a friend or request, then reloads the lists
  const act = (action: () => Promise<void>) => async () => {
    try {
      await action();
    } catch (error) {
      Alert.alert(t.account.problems[accountProblem(error)]);
    }
    load();
    refreshFriendCounts();
  };

  const confirmRemove = (entry: FriendEntry) =>
    Alert.alert(t.friends.removeConfirm(entry.nickname), undefined, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.friends.remove, style: 'destructive', onPress: act(() => removeFriend(entry.id)) },
    ]);

  const shareCode = () => {
    Share.share({ message: t.friends.shareMessage(friendCode) }).catch((error) => console.warn('Share error:', error));
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      <AppText variant="title" accessibilityRole="header" style={styles.centered}>
        👥 {t.friends.title}
      </AppText>

      <Section title={t.friends.addTitle}>
        <TextField
          value={text}
          onChangeText={(next) => {
            setText(next);
            setResult(null);
          }}
          placeholder={t.friends.searchPlaceholder}
          accessibilityLabel={t.friends.searchPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={21}
          returnKeyType={isCode ? 'send' : 'search'}
          onSubmitEditing={() => isCode && sendCode()}
        />
        {!text.trim() ? (
          <AppText variant="small" color="textMuted">
            {t.friends.addHint}
          </AppText>
        ) : null}
        {isCode ? <Button label={t.friends.sendToCode(code)} onPress={sendCode} disabled={sending} /> : null}
        {text.trim() && !isCode && !query ? (
          <AppText variant="small" color="textMuted">
            {t.friends.searchHint}
          </AppText>
        ) : null}
        {searching && !results ? (
          <AppText variant="small" color="textMuted">
            {t.friends.searching}
          </AppText>
        ) : null}
        {current && 'message' in current && !searching ? <AppText color="danger">{current.message}</AppText> : null}
        {results && results.length === 0 && !searching && !isCode ? (
          <AppText variant="small" color="textMuted">
            {t.friends.noResults(query ?? '')}
          </AppText>
        ) : null}
        {results && results.length > 0 ? (
          <Appear>
            <Card style={styles.list}>
              {results.map((person) => (
                <FriendRow key={person.nickname} entry={person}>
                  {searchAction(person)}
                </FriendRow>
              ))}
            </Card>
          </Appear>
        ) : null}
        {result ? (
          <Appear>
            <AppText color={result.good ? 'primary' : 'danger'} accessibilityLiveRegion="polite">
              {result.text}
            </AppText>
          </Appear>
        ) : null}
      </Section>

      <Section title={t.friends.yourCode} hint={t.friends.yourCodeHint}>
        <Card style={styles.codeCard}>
          <View
            style={[styles.codeBox, { backgroundColor: colors.primarySoft, borderColor: colors.accent }]}
            accessible
            accessibilityLabel={t.friends.codeAccessibility(friendCode)}>
            <AppText style={styles.code} color="primaryStrong" selectable numberOfLines={1} adjustsFontSizeToFit>
              {friendCode}
            </AppText>
            {nickname ? (
              <AppText variant="small" color="textMuted" numberOfLines={1}>
                @{nickname}
              </AppText>
            ) : null}
          </View>
          <Button label={`📤 ${t.friends.shareShort}`} size="sm" onPress={shareCode} />
        </Card>
      </Section>

      {loadError ? <AppText color="danger">{loadError}</AppText> : null}

      {lists.incoming.length > 0 ? (
        <Appear from="down">
          <Section title={t.friends.incoming}>
            <Card style={styles.list}>
              {lists.incoming.map((entry) => (
                <FriendRow key={entry.id} entry={entry}>
                  <Button label={t.friends.accept} size="sm" onPress={act(() => respondFriendRequest(entry.id, true))} />
                  <Button
                    label={t.friends.decline}
                    tone="secondary"
                    size="sm"
                    onPress={act(() => respondFriendRequest(entry.id, false))}
                  />
                </FriendRow>
              ))}
            </Card>
          </Section>
        </Appear>
      ) : null}

      <Section title={t.friends.list}>
        <Card style={styles.list}>
          {!loading && lists.friends.length === 0 ? (
            <AppText color="textMuted" style={styles.empty}>
              {t.friends.none}
            </AppText>
          ) : null}
          {lists.friends.map((entry) => (
            <FriendRow key={entry.id} entry={entry}>
              <Button label={t.friends.remove} tone="secondary" size="sm" onPress={() => confirmRemove(entry)} />
            </FriendRow>
          ))}
        </Card>
      </Section>

      {lists.outgoing.length > 0 ? (
        <Section title={t.friends.outgoing}>
          <Card style={styles.list}>
            {lists.outgoing.map((entry) => (
              <FriendRow key={entry.id} entry={entry}>
                <Button label={t.friends.cancelRequest} tone="secondary" size="sm" onPress={act(() => removeFriend(entry.id))} />
              </FriendRow>
            ))}
          </Card>
        </Section>
      ) : null}

      <Button label={t.medalSheet.close} tone="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  centered: {
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  list: {
    paddingVertical: 0,
  },
  empty: {
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  codeBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  code: {
    fontSize: fontSize.title,
    lineHeight: fontSize.title + 6,
    fontWeight: fontWeight.heavy,
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
});
