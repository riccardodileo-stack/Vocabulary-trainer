// Sheet opened by tapping a friend in the friends sheet: their picture, nickname, last training
// day and, if they share them (Settings > Privacy), streak, languages, medals, favourite topics
// and last learned words. Everything comes from friend_profile() (services/profileStats.ts);
// what the friend sends is a summary worked out on their phone (hooks/useProfileStatsSync.ts).
// The friend can also be removed from here.

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Appear } from '@/components/Appear';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MedalBadge } from '@/components/MedalBadge';
import { Pill } from '@/components/Pill';
import { Section } from '@/components/Section';
import { StatTile } from '@/components/StatTile';
import { AVATAR_PRESETS, isAvatarId } from '@/content/avatars';
import { accountProblem } from '@/domain/account';
import type { Achievement } from '@/domain/achievements';
import { dayKey } from '@/domain/dates';
import {
  daysSinceTraining,
  friendAchievements,
  friendStreakToday,
  type FriendProfile,
} from '@/domain/friendProfile';
import { LANGUAGES } from '@/domain/languages';
import { TopicBadge } from '@/components/TopicBadge';
import { refreshFriendCounts } from '@/hooks/useAccountSession';
import { useT } from '@/i18n';
import { photoUrl, removeFriend } from '@/services/account';
import { fetchFriendProfile } from '@/services/profileStats';
import { spacing, useTheme } from '@/theme';

type Params = { id: string; nickname?: string; avatar?: string; photo?: string };

type Loaded = { profile: FriendProfile } | { error: string } | null;

export default function FriendProfileSheet() {
  const t = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<Params>();
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchFriendProfile(params.id)
      .then((profile) => !cancelled && setLoaded({ profile }))
      .catch((error) => {
        if (cancelled) return;
        const text = String((error as { message?: unknown })?.message ?? '');
        const problem = accountProblem(error);
        setLoaded({
          error: text.includes('not_friends')
            ? t.friendProfile.notFriends
            : problem === 'unknown'
              ? t.friendProfile.error
              : t.account.problems[problem],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, round, t]);

  const profile = loaded && 'profile' in loaded ? loaded.profile : null;
  // Until the profile arrives, what the friends list already knew
  const nickname = profile?.nickname ?? params.nickname ?? '';
  const photoPath = profile ? profile.photoPath : (params.photo || null);
  const avatarField = profile ? profile.avatar : (params.avatar || null);
  const avatarId = avatarField && isAvatarId(avatarField) ? avatarField : AVATAR_PRESETS[0].id;

  const today = dayKey();
  const lastDays = profile ? daysSinceTraining(profile.streak, today) : undefined;

  const confirmRemove = useCallback(() => {
    Alert.alert(t.friends.removeConfirm(nickname), undefined, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.friends.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriend(params.id);
            refreshFriendCounts();
            router.back();
          } catch (error) {
            Alert.alert(t.account.problems[accountProblem(error)]);
          }
        },
      },
    ]);
  }, [nickname, params.id, t]);

  const medalLabel = (achievement: Achievement) => {
    const title = t.achievements[achievement.id].title;
    return `${title}, ${achievement.tier ? t.medalTiers[achievement.tier] : t.profile.medalLocked}`;
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heading}>
        <Avatar
          avatar={photoPath ? { kind: 'photo', uri: photoUrl(photoPath) } : { kind: 'preset', id: avatarId }}
          size={88}
          ring
        />
        <AppText variant="title" accessibilityRole="header" numberOfLines={1}>
          @{nickname}
        </AppText>
        {profile && profile.shared && lastDays !== undefined ? (
          <AppText color="textMuted">
            {t.friendProfile.lastTraining}: {t.friendProfile.lastTrainingDays(lastDays)}
          </AppText>
        ) : null}
      </View>

      {loaded === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <AppText color="textMuted">{t.friendProfile.loading}</AppText>
        </View>
      ) : null}

      {loaded && 'error' in loaded ? (
        <Card style={styles.message}>
          <AppText color="danger">{loaded.error}</AppText>
          <Button label={t.friendProfile.retry} size="sm" tone="secondary" onPress={() => setRound((r) => r + 1)} />
        </Card>
      ) : null}

      {profile && !profile.shared ? (
        <Card style={styles.message}>
          <AppText color="textMuted">{t.friendProfile.private(profile.nickname)}</AppText>
        </Card>
      ) : null}

      {profile && profile.shared && !profile.stats ? (
        <Card style={styles.message}>
          <AppText color="textMuted">{t.friendProfile.nothingYet(profile.nickname)}</AppText>
        </Card>
      ) : null}

      {profile?.streak ? (
        <Appear>
          <View style={styles.tiles}>
            <StatTile icon="🔥" value={friendStreakToday(profile.streak, today)} label={t.friendProfile.streak} />
            <StatTile icon="🏆" value={profile.streak.best} label={t.friendProfile.bestStreak} />
          </View>
        </Appear>
      ) : null}

      {profile?.stats ? (
        <Appear from="down">
          <View style={styles.sections}>
            {profile.stats.languages.length > 0 || profile.stats.nativeLanguage ? (
              <Section
                title={t.friendProfile.languages}
                hint={
                  profile.stats.nativeLanguage
                    ? t.friendProfile.native(
                        `${LANGUAGES[profile.stats.nativeLanguage].flag} ${LANGUAGES[profile.stats.nativeLanguage].nativeName}`
                      )
                    : undefined
                }>
                {profile.stats.languages.length > 0 ? (
                  <Card style={styles.list}>
                    {profile.stats.languages.map((language, index) => (
                      <View
                        key={language.code}
                        style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                        <AppText style={styles.flag}>{LANGUAGES[language.code].flag}</AppText>
                        <AppText variant="bodyBold" style={styles.flex}>
                          {LANGUAGES[language.code].nativeName}
                        </AppText>
                        <AppText variant="small" color="textMuted">
                          {t.friendProfile.languageWords(language.words, language.learned)}
                        </AppText>
                      </View>
                    ))}
                  </Card>
                ) : null}
              </Section>
            ) : null}

            <Section title={t.friendProfile.medals}>
              <View style={styles.medals}>
                {friendAchievements(profile.stats.medals).map((achievement) => (
                  <MedalBadge
                    key={achievement.id}
                    achievement={achievement}
                    title={t.achievements[achievement.id].title}
                    tierLabel={achievement.tier ? t.medalTiers[achievement.tier] : null}
                    accessibilityLabel={medalLabel(achievement)}
                  />
                ))}
              </View>
            </Section>

            {profile.stats.topics.length > 0 ? (
              <Section title={t.friendProfile.topics}>
                <View style={styles.chips}>
                  {profile.stats.topics.map((topic) => (
                    <TopicBadge
                      key={topic.id}
                      topic={topic.id}
                      label={`${t.topicsShort[topic.id]} · ${t.friendProfile.topicWords(topic.words)}`}
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            <Section title={t.friendProfile.learnedWords}>
              {profile.stats.learnedWords.length > 0 ? (
                <View style={styles.chips}>
                  {profile.stats.learnedWords.map((word, index) => (
                    <Pill key={`${word.lang}:${word.term}:${index}`} label={`${LANGUAGES[word.lang].flag} ${word.term}`} />
                  ))}
                </View>
              ) : (
                <AppText color="textMuted">{t.friendProfile.noLearnedWords}</AppText>
              )}
            </Section>
          </View>
        </Appear>
      ) : null}

      {profile ? <Button label={t.friendProfile.remove} tone="danger" onPress={confirmRemove} /> : null}
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
  heading: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  message: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sections: {
    gap: spacing.lg,
  },
  list: {
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  flag: {
    fontSize: 22,
  },
  flex: {
    flex: 1,
  },
  medals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
