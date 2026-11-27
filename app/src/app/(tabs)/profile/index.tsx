// Profile tab: the name as page title; picture, nick, stats, medals, friends and account.
// The gear at the top right opens the settings.

import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { ListGroup } from '@/components/ListGroup';
import { MedalBadge } from '@/components/MedalBadge';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { ProfileAccountRow, ProfileCounterTile, ProfileFriendsCard, StreakTile } from '@/components/ProfileVisuals';
import { MEDAL_TIERS, tiersEarned, type Achievement } from '@/domain/achievements';
import { LANGUAGES } from '@/domain/languages';
import { refreshFriendCounts } from '@/hooks/useAccountSession';
import { useAchievements } from '@/hooks/useAchievements';
import { accountProblem } from '@/domain/account';
import { useT, useUiLanguage } from '@/i18n';
import { deleteAccount, signOut } from '@/services/account';
import { useActivityStore } from '@/store/activityStore';
import { useProfileStore } from '@/store/profileStore';
import { useActivePair } from '@/store/settingsStore';
import { radius, spacing, useTheme } from '@/theme';


function openSettings() {
  router.push('/settings');
}

function openEdit() {
  router.push('/profile/edit');
}

/** Friends open as a sheet from the bottom (app/friends.tsx), like the streak and the medals. */
function openFriends() {
  router.push('/friends');
}

export default function ProfileScreen() {
  const t = useT();
  const uiLanguage = useUiLanguage();
  const { colors } = useTheme();
  const profile = useProfileStore();
  const pair = useActivePair();
  const stacked = useWindowDimensions().fontScale >= 1.4;
  const numberFormat = new Intl.NumberFormat(uiLanguage);

  // Requests may have arrived since last time
  useFocusEffect(
    useCallback(() => {
      refreshFriendCounts();
    }, [])
  );

  const confirmSignOut = () =>
    Alert.alert(t.profile.signOutTitle, profile.isGuest ? t.profile.signOutGuest : t.profile.signOutRegistered, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.signOut,
        style: 'destructive',
        onPress: () => signOut().catch((error) => Alert.alert(t.account.problems[accountProblem(error)])),
      },
    ]);

  const confirmDelete = () =>
    Alert.alert(t.profile.deleteTitle, t.profile.deleteMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.deleteAccount,
        style: 'destructive',
        onPress: () => deleteAccount().catch((error) => Alert.alert(t.account.problems[accountProblem(error)])),
      },
    ]);

  // The user's name is the page title; "Profile" until a name is chosen
  const title = profile.name || t.profile.title;
  const achievements = useAchievements();
  // Every level counts one (a gold medal = bronze + silver + gold): "9/24"
  const levelsWon = tiersEarned(achievements);
  const levelsTotal = achievements.length * MEDAL_TIERS.length;

  const memberSince = new Intl.DateTimeFormat(uiLanguage, { month: 'long', year: 'numeric' }).format(
    new Date(profile.createdAt)
  );

  const medalLabel = (achievement: Achievement) => {
    const title = t.achievements[achievement.id].title;
    const reached = achievement.tier ? t.medalTiers[achievement.tier] : t.profile.medalLocked;
    const next = achievement.next
      ? t.profile.medalNext(t.medalTiers[achievement.next.tier], achievement.value, achievement.next.target)
      : t.profile.medalMax;
    return `${title}, ${reached}. ${next}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <IconButton icon="⚙️" onPress={openSettings} accessibilityLabel={t.settings.title} />
          ),
        }}
      />

      <Screen tab="/profile">

        <Card style={styles.hero}>
          <Pressable onPress={openEdit} accessibilityRole="button" accessibilityLabel={t.profile.edit}>
            <Avatar avatar={profile.avatar} size={96} ring />
            <View style={[styles.editBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <AppText variant="caption" accessible={false}>
                ✏️
              </AppText>
            </View>
          </Pressable>

          <View style={styles.info}>
            {profile.name ? null : (
              <AppText variant="bodyBold" color="textMuted" numberOfLines={1}>
                {t.profile.noName}
              </AppText>
            )}
            <AppText variant="bodyBold" color={profile.nickname ? 'primary' : 'textMuted'} numberOfLines={1}>
              {profile.nickname ? `@${profile.nickname}` : t.profile.noNickname}
            </AppText>
            <View style={styles.pills}>
              <Pill label={`${LANGUAGES[pair.source].flag} ${t.languages[pair.source]}`} tone="primary" />
              <Pill label={t.profile.memberSince(memberSince)} />
            </View>
            <Button label={t.profile.edit} tone="secondary" size="sm" onPress={openEdit} />
          </View>
        </Card>

        <View style={[styles.stats, stacked && styles.statsStacked]}>
          <ProfileCounterTile
            kind="friends"
            stacked={stacked}
            value={numberFormat.format(profile.friendsCount)}
            label={t.profile.friendsStat(profile.friendsCount)}
            accessibilityHint={t.profile.friendsHint}
          />
          <StreakTile stacked={stacked} />
          <ProfileCounterTile
            kind="medals"
            stacked={stacked}
            value={`${numberFormat.format(levelsWon)}/${numberFormat.format(levelsTotal)}`}
            label={t.profile.medalsStat}
            accessibilityHint={t.medalsSheet.hint}
          />
        </View>

        <Section title={t.profile.medalsTitle}>
          <View style={styles.medals}>
            {achievements.map((achievement) => (
              <MedalBadge
                key={achievement.id}
                achievement={achievement}
                title={t.achievements[achievement.id].title}
                tierLabel={achievement.tier ? t.medalTiers[achievement.tier] : null}
                accessibilityLabel={medalLabel(achievement)}
                onPress={() => router.push({ pathname: '/medal/[id]', params: { id: achievement.id } })}
              />
            ))}
          </View>
        </Section>

        <Section title={t.profile.friendsTitle}>
          <ProfileFriendsCard
            count={profile.friendsCount}
            requests={profile.incomingRequests}
            onPress={openFriends}
          />
        </Section>

        <Section title={t.profile.accountTitle} hint={t.profile.accountHint}>
          <ListGroup>
            <ProfileAccountRow
              kind={profile.isGuest ? 'guest' : 'email'}
              label={t.profile.accountType}
              value={profile.isGuest ? t.profile.guest : profile.email}
            />
            <ProfileAccountRow
              kind="name"
              label={t.profile.name}
              value={profile.name || t.profile.notSet}
              onPress={openEdit}
            />
            <ProfileAccountRow
              kind="nickname"
              label={t.profile.nickname}
              value={profile.nickname ? `@${profile.nickname}` : t.profile.notSet}
              onPress={openEdit}
            />
          </ListGroup>
          {profile.isGuest ? (
            <Card style={styles.register}>
              <AppText variant="small" color="textMuted">
                {t.profile.registerHint}
              </AppText>
              <Button label={`✉️ ${t.profile.register}`} onPress={() => router.push('/profile/register')} />
            </Card>
          ) : null}
          <Button label={t.profile.signOut} tone="secondary" onPress={confirmSignOut} />
          <Button label={t.profile.deleteAccount} tone="danger" onPress={confirmDelete} />
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsStacked: { 
    flexDirection: 'column' 
  },
  medals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  register: {
    gap: spacing.sm,
  }
});
