import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT, useUiLanguage } from '@/i18n';
import { useStreakStatus } from '@/store/activityStore';
import { fontSize, iconSize, radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

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

type TileProps = CounterProps & {
  name: SymbolViewProps['name'];
  tint: string;
  surface: string;
  opacity: number;
  onPress: () => void;
  accessory?: ReactNode;
  accessibilityLabel?: string;
};

function OverviewTile({
  value, label, stacked, name, tint, surface, opacity, onPress, accessory, accessibilityHint, accessibilityLabel,
}: TileProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${value} ${label}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.tile,
        !stacked && styles.inRow,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
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
    </Pressable>
  );
}

export function StreakTile({ stacked }: { stacked: boolean }) {
  const t = useT();
  const language = useUiLanguage();
  const { colors } = useTheme();
  const { streak, saves } = useStreakStatus();
  const tier = STREAK_LEVELS.find((level) => streak >= level.min);
  const value = new Intl.NumberFormat(language).format(streak);
  const label = t.home.streak(streak);
  const accessibilityLabel = saves > 0
    ? `${value} ${label}, ${t.home.streakSaves(saves)}`
    : `${value} ${label}`;

  return (
    <OverviewTile
      stacked={stacked}
      value={value}
      label={label}
      name={FLAME}
      tint={tier ? colors[tier.color] : colors.textMuted}
      surface={colors.cardMuted}
      opacity={tier?.opacity ?? 0.08}
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