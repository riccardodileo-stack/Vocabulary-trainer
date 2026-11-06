// Profile tab: the name as page title; picture, nick, stats, medals, friends and account.
// The gear at the top right opens the settings.

import { Stack, router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { ListGroup, ListRow } from '@/components/ListGroup';
import { MedalBadge } from '@/components/MedalBadge';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StatTile } from '@/components/StatTile';
import { MEDAL_TIERS, tiersEarned, type Achievement } from '@/domain/achievements';
import { LANGUAGES } from '@/domain/languages';
import { useAchievements } from '@/hooks/useAchievements';
import { useT, useUiLanguage } from '@/i18n';
import { useActivityStore } from '@/store/activityStore';
import { useProfileStore } from '@/store/profileStore';
import { useActivePair } from '@/store/settingsStore';
import { radius, spacing, useTheme } from '@/theme';

/** Above this length the title uses a smaller size, so it fits next to the gear. */
const LONG_TITLE = 16;

function openSettings() {
  router.push('/settings');
}

function openEdit() {
  router.push('/profile/edit');
}

export default function ProfileScreen() {
  const t = useT();
  const uiLanguage = useUiLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore();
  const pair = useActivePair();
  const bestStreak = useActivityStore((state) => state.bestStreak);

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
      {/* No native header: its large-title area left too much empty space above the
          content. The name is drawn as the first line of the page, like Home.
          The title is still set: it is the "back" label of the pages opened from here. */}
      <Stack.Screen options={{ title, headerShown: false }} />

      {/* On iOS the ScrollView already avoids the notch; Android needs the inset by hand */}
      <Screen tab="/profile" contentContainerStyle={Platform.OS === 'android' && { paddingTop: insets.top + spacing.lg }}>
        <View style={styles.header}>
          <AppText
            variant={title.length > LONG_TITLE ? 'title' : 'hero'}
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={styles.flex}>
            {title}
          </AppText>
          <IconButton icon="⚙️" onPress={openSettings} accessibilityLabel={t.settings.title} />
        </View>

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

        <View style={styles.stats}>
          <StatTile icon="👥" value={profile.friendsCount} label={t.profile.friendsStat(profile.friendsCount)} />
          <StatTile icon="🔥" value={bestStreak} label={t.profile.bestStreakStat} />
          <StatTile
            icon="🏅"
            value={`${levelsWon}/${levelsTotal}`}
            label={t.profile.medalsStat}
            onPress={() => router.push('/medals')}
            accessibilityHint={t.medalsSheet.hint}
          />
        </View>

        <Section title={t.profile.medalsTitle}>
          <Card style={styles.medalsCard}>
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
          </Card>
        </Section>

        <Section title={t.profile.friendsTitle}>
          <Card>
            <View style={styles.friendsHeader}>
              <AppText variant="bodyBold" style={styles.flex}>
                👥 {t.profile.friendsEmpty}
              </AppText>
              <Pill label={t.common.comingSoon} />
            </View>
            <AppText color="textMuted">{t.profile.friendsSoon}</AppText>
            <Button label={t.profile.addFriends} tone="secondary" onPress={() => router.push('/profile/friends')} />
          </Card>
        </Section>

        <Section title={t.profile.accountTitle} hint={t.profile.accountHint}>
          <ListGroup>
            <ListRow icon="🙂" label={t.profile.name} value={profile.name || t.profile.notSet} onPress={openEdit} />
            <ListRow
              icon="#️⃣"
              label={t.profile.nickname}
              value={profile.nickname ? `@${profile.nickname}` : t.profile.notSet}
              onPress={openEdit}
            />
            <ListRow icon="✉️" label={t.profile.email} value={profile.email || t.profile.notSet} onPress={openEdit} />
          </ListGroup>
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
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
  medalsCard: {
    paddingHorizontal: spacing.sm,
  },
  medals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
