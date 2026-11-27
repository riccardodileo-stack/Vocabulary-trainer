import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useT, useUiLanguage } from '@/i18n';
import { useStreakStatus } from '@/store/activityStore';
import { fontSize, iconSize, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import { topicTints } from '@/theme/colors';

import { AppText } from './AppText';
import { Card } from './Card';
import { Pill } from './Pill';

const PROFILE_ART = {
  friends: {
    name: { ios: 'person.2.fill', android: 'group', web: 'group' },
    tint: 'primaryStrong',
    surface: 'primarySoft',
    route: '/friends',
  },
  medals: {
    name: { ios: 'medal.fill', android: 'military_tech', web: 'military_tech' },
    tint: 'warning',
    surface: 'warningSoft',
    route: '/medals',
  },
} as const;

const FLAME = { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' } as const;
const SHIELD = { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' } as const;
const SPARKLE = { ios: 'sparkle', android: 'auto_awesome', web: 'auto_awesome' } as const;
const STREAK_LEVELS = [
  { min: 1000, color: 'homeStreak1000', opacity: 0.23 },
  { min: 100, color: 'homeStreak100', opacity: 0.19 },
  { min: 10, color: 'homeStreak10', opacity: 0.16 },
  { min: 1, color: 'homeStreak1', opacity: 0.13 },
] as const;

type ProfileKind = keyof typeof PROFILE_ART;

type CounterProps = {
  value: string;
  label: string;
  stacked: boolean;
  accessibilityHint: string;
};

type TileProps = Omit<CounterProps, 'accessibilityHint'> & {
  name: SymbolViewProps['name'];
  tint: string;
  surface: string;
  opacity: number;
  onPress?: () => void;
  accessory?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

function OverviewTile({
  value, label, stacked, name, tint, surface, opacity, onPress, accessory, accessibilityHint, accessibilityLabel,
}: TileProps) {
  const { colors } = useTheme();
  const description = accessibilityLabel ?? `${value} ${label}`;
  const tileStyle = [
    styles.tile,
    !stacked && styles.inRow,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];
  const content = (
    <>
      <SymbolView
        name={name}
        size={spacing.xxl * 3}
        tintColor={tint}
        accessible={false}
        pointerEvents="none"
        style={[styles.watermark, { opacity }]}
      />
      <View style={styles.tileTop}>
        <View style={[styles.tileIcon, { backgroundColor: surface }]}>
          <SymbolView name={name} size={iconSize.sm} tintColor={tint} accessible={false} />
        </View>
        {accessory}
      </View>
      <AppText variant="display" style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
        {value}
      </AppText>
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
    </>
  );

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={description}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [tileStyle, pressed && styles.pressed]}>
      {content}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={description} style={tileStyle}>
      {content}
    </View>
  );
}

function streakAppearance(streak: number, colors: ThemeColors) {
  const tier = STREAK_LEVELS.find((level) => streak >= level.min);
  return {
    name: FLAME,
    tint: tier ? colors[tier.color] : colors.textMuted,
    surface: colors.cardMuted,
    opacity: tier?.opacity ?? 0.08,
  };
}

export function StreakTile({ stacked }: { stacked: boolean }) {
  const t = useT();
  const language = useUiLanguage();
  const { colors } = useTheme();
  const { streak, saves } = useStreakStatus();
  const value = new Intl.NumberFormat(language).format(streak);
  const label = t.home.streak(streak);
  const accessibilityLabel = saves > 0
    ? `${value} ${label}, ${t.home.streakSaves(saves)}`
    : `${value} ${label}`;

  return (
    <OverviewTile
      {...streakAppearance(streak, colors)}
      stacked={stacked}
      value={value}
      label={label}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t.home.streakOpen}
      onPress={() => router.push('/streak')}
      accessory={saves > 0 ? (
        <View style={styles.saves} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: saves }, (_, index) => (
            <SymbolView key={index} name={SHIELD} size={spacing.md} tintColor={colors.primaryStrong} />
          ))}
        </View>
      ) : undefined}
    />
  );
}

const TROPHY = { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' } as const;

export function FriendStreakTiles({ streak, record }: { streak: number; record: number }) {
  const t = useT();
  const language = useUiLanguage();
  const { colors } = useTheme();
  const stacked = useWindowDimensions().fontScale >= 1.4;
  const format = new Intl.NumberFormat(language);

  return (
    <View style={{ flexDirection: stacked ? 'column' : 'row', gap: spacing.sm }}>
      <OverviewTile
        {...streakAppearance(streak, colors)}
        stacked={stacked}
        value={format.format(streak)}
        label={t.home.streak(streak)}
      />
      <OverviewTile
        stacked={stacked}
        value={format.format(record)}
        label={t.friendProfile.bestStreak}
        name={TROPHY}
        tint={colors.warning}
        surface={colors.warningSoft}
        opacity={0.16}
      />
    </View>
  );
}

export function ProfileCounterTile({ kind, ...props }: CounterProps & { kind: ProfileKind }) {
  const { colors } = useTheme();
  const art = PROFILE_ART[kind];
  return (
    <OverviewTile
      {...props}
      name={art.name}
      tint={colors[art.tint]}
      surface={colors[art.surface]}
      opacity={0.13}
      onPress={() => router.push(art.route)}
    />
  );
}

export function ProfileSheetHero({ kind, title, children }: {
  kind: ProfileKind;
  title: string;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const art = PROFILE_ART[kind];
  const tint = colors[art.tint];

  return (
    <View style={styles.hero}>
      <View
        style={[styles.heroRing, { borderColor: `${tint}50` }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <View style={[styles.heroBadge, { backgroundColor: colors[art.surface], borderColor: `${tint}30` }]}>
          <SymbolView name={art.name} size={50} tintColor={tint} weight="semibold" accessible={false} />
        </View>
        <SymbolView name={SPARKLE} size={iconSize.sm} tintColor={tint} accessible={false} style={styles.sparkle} />
      </View>
      <AppText variant="hero" accessibilityRole="header" style={styles.center}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

const CHEVRON_RIGHT = { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as const;

const ACCOUNT_ART = {
  guest: { name: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }, tone: 'account' },
  email: { name: { ios: 'envelope.fill', android: 'mail', web: 'mail' }, tone: 'account' },
  name: { name: { ios: 'person.text.rectangle.fill', android: 'badge', web: 'badge' }, tone: 'name' },
  nickname: { name: { ios: 'at', android: 'alternate_email', web: 'alternate_email' }, tone: 'nickname' },
} as const;

export function ProfileFriendsCard({ count, requests, onPress }: {
  count: number;
  requests: number;
  onPress: () => void;
}) {
  const t = useT();
  const { colors } = useTheme();
  const art = PROFILE_ART.friends;
  const tint = colors[art.tint];
  const title = count > 0 ? t.profile.friendsSome(count) : t.profile.friendsEmpty;
  const action = count > 0 || requests > 0 ? t.profile.seeFriends : t.profile.addFriends;
  const pending = requests > 0 ? t.profile.friendsRequests(requests) : null;

  return (
    <Card
      tone="primary"
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={pending ? `${title}, ${pending}` : title}
      accessibilityHint={t.profile.friendsHint}
      style={[detailStyles.friendsCard, { borderColor: tint + '38' }]}>
      <SymbolView
        name={art.name}
        size={112}
        tintColor={tint}
        style={detailStyles.friendsWatermark}
        accessible={false}
        pointerEvents="none"
      />

      <View style={[detailStyles.friendsIcon, { backgroundColor: colors.card, borderColor: tint + '38' }]}>
        <SymbolView name={art.name} size={iconSize.lg} tintColor={tint} weight="semibold" accessible={false} />
      </View>

      <View style={detailStyles.copy}>
        <AppText variant="bodyBold">{title}</AppText>
        <AppText variant="small" color="textMuted">{action}</AppText>
        {pending ? <Pill label={pending} tone="warning" /> : null}
      </View>

      <View style={[detailStyles.friendsChevron, { backgroundColor: colors.card, borderColor: tint + '38' }]}>
        <SymbolView name={CHEVRON_RIGHT} size={iconSize.sm} tintColor={tint} accessible={false} />
      </View>
    </Card>
  );
}

type ProfileAccountRowProps = {
  kind: keyof typeof ACCOUNT_ART;
  label: string;
  value: string;
  onPress?: () => void;
};

export function ProfileAccountRow({ kind, label, value, onPress }: ProfileAccountRowProps) {
  const { colors, scheme } = useTheme();
  const art = ACCOUNT_ART[kind];
  const tint = {
    account: topicTints.tech[scheme],
    name: colors.primaryStrong,
    nickname: colors.homeLearned,
  }[art.tone];

  const content = (
    <>
      <View style={[detailStyles.accountIcon, { backgroundColor: tint + '1A', borderColor: tint + '30' }]}>
        <SymbolView name={art.name} size={iconSize.md} tintColor={tint} weight="semibold" accessible={false} />
      </View>

      <View style={detailStyles.copy}>
        <AppText variant="bodyBold">{label}</AppText>
        {value ? <AppText variant="small" color="textMuted">{value}</AppText> : null}
      </View>

      {onPress ? (
        <SymbolView name={CHEVRON_RIGHT} size={iconSize.sm} tintColor={colors.textMuted} accessible={false} />
      ) : null}
    </>
  );

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [detailStyles.accountRow, pressed && { backgroundColor: colors.cardMuted }]}>
      {content}
    </Pressable>
  ) : (
    <View style={detailStyles.accountRow}>{content}</View>
  );
}

const detailStyles = StyleSheet.create({
  friendsCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, overflow: 'hidden' },
  friendsWatermark: { position: 'absolute', top: -spacing.xl, right: -spacing.md, opacity: 0.12 },
  friendsIcon: {
    width: spacing.xxl + spacing.lg,
    height: spacing.xxl + spacing.lg,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsChevron: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing.xs },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  accountIcon: {
    width: spacing.xxl + spacing.sm,
    height: spacing.xxl + spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  tile: {
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  inRow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.78 },
  watermark: { position: 'absolute', top: -spacing.xl, right: -spacing.xl },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  tileIcon: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: { fontSize: fontSize.hero },
  saves: { flexDirection: 'row', gap: 2 },
  hero: { alignItems: 'center', gap: spacing.sm },
  heroRing: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: { position: 'absolute', top: spacing.xs, right: 0 },
  center: { textAlign: 'center' },
});