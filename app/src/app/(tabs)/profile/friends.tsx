// Friends: add one with their friend code (they get a request to accept), answer the requests
// received, see friends and requests sent. Below, the user's own code, ready to share.
// Everything comes from the server (services/account.ts); the counters in Profile follow.

import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, RefreshControl, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { TextField } from '@/components/TextField';
import { AVATAR_PRESETS, isAvatarId } from '@/content/avatars';
import { accountProblem, groupFriends, type FriendEntry, type FriendLists } from '@/domain/account';
import { isValidFriendCode, normalizeFriendCode } from '@/domain/profile';
import { refreshFriendCounts } from '@/hooks/useAccountSession';
import { useT } from '@/i18n';
import { fetchFriends, removeFriend, respondFriendRequest, sendFriendRequest } from '@/services/account';
import { useProfileStore } from '@/store/profileStore';
import { fontSize, fontWeight, radius, spacing, useTheme } from '@/theme';

const NO_LISTS: FriendLists = { friends: [], incoming: [], outgoing: [] };

function FriendRow({ entry, children }: { entry: FriendEntry; children: ReactNode }) {
  const { colors } = useTheme();
  const avatarId = entry.avatar && isAvatarId(entry.avatar) ? entry.avatar : AVATAR_PRESETS[0].id;
  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Avatar avatar={{ kind: 'preset', id: avatarId }} size={44} />
      <AppText variant="bodyBold" style={styles.flex} numberOfLines={1}>
        @{entry.nickname}
      </AppText>
      <View style={styles.rowActions}>{children}</View>
    </View>
  );
}

export default function FriendsScreen() {
  const t = useT();
  const { colors } = useTheme();
  const friendCode = useProfileStore((state) => state.friendCode);
  const nickname = useProfileStore((state) => state.nickname);
  const [lists, setLists] = useState<FriendLists>(NO_LISTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState('');
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

  const send = async () => {
    const normalized = normalizeFriendCode(code);
    setSending(true);
    setResult(null);
    try {
      const answer = await sendFriendRequest(normalized);
      setResult({ text: t.friends.results[answer], good: answer === 'sent' || answer === 'accepted' });
      if (answer === 'sent' || answer === 'accepted') {
        setCode('');
      }
      load();
    } catch (error) {
      setResult({ text: t.account.problems[accountProblem(error)], good: false });
    } finally {
      setSending(false);
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
    <>
      <Stack.Screen options={{ title: t.friends.title, headerLargeTitle: false }} />

      <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        <Section title={t.friends.addTitle} hint={t.friends.addHint}>
          <TextField
            value={code}
            onChangeText={(text) => {
              setCode(normalizeFriendCode(text));
              setResult(null);
            }}
            placeholder={t.friends.codePlaceholder}
            accessibilityLabel={t.friends.codePlaceholder}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={9}
            returnKeyType="send"
            onSubmitEditing={() => isValidFriendCode(code) && send()}
          />
          <Button label={t.friends.send} onPress={send} disabled={sending || !isValidFriendCode(code)} />
          {result ? (
            <Appear>
              <AppText color={result.good ? 'primary' : 'danger'} accessibilityLiveRegion="polite">
                {result.text}
              </AppText>
            </Appear>
          ) : null}
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

        <Section title={t.friends.yourCode} hint={t.friends.yourCodeHint}>
          <Card style={styles.codeCard}>
            <View
              style={[styles.codeBox, { backgroundColor: colors.primarySoft, borderColor: colors.accent }]}
              accessible
              accessibilityLabel={t.friends.codeAccessibility(friendCode)}>
              <AppText style={styles.code} color="primaryStrong" selectable>
                {friendCode}
              </AppText>
            </View>
            {nickname ? <AppText color="textMuted">@{nickname}</AppText> : null}
            <Button label={`📤 ${t.friends.share}`} onPress={shareCode} />
          </Card>
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  codeBox: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  code: {
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero + 8,
    fontWeight: fontWeight.heavy,
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
});
