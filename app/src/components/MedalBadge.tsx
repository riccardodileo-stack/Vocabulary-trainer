import { Pressable, StyleSheet, View } from 'react-native';

import { MEDAL_TIERS, type Achievement } from '@/domain/achievements';
import { barHeight, fontSize, radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type MedalBadgeProps = {
  achievement: Achievement;
  title: string;
  /** Name of the reached tier ("Silver"), or null if none yet. */
  tierLabel: string | null;
  /** Read by screen readers, e.g. "Vocabulary, silver, 37 of 200 for gold". */
  accessibilityLabel: string;
  onPress?: () => void;
};

const MEDAL_SIZE = 64;

/**
 * One medal with four levels. The circle takes the color of the tier reached
 * (bronze, silver, gold, diamond); four dots show the tiers; the bar shows the way
 * to the next tier. Put them in a wrapping row (3 per line on a phone).
 */
export function MedalBadge({ achievement, title, tierLabel, accessibilityLabel, onPress }: MedalBadgeProps) {
  const { colors } = useTheme();
  const { tier, next, value, progress, icon } = achievement;
  const reached = tier ? MEDAL_TIERS.indexOf(tier) + 1 : 0;
  const ring = tier ? { ring: colors[tier], soft: colors[`${tier}Soft`] } : { ring: colors.border, soft: colors.cardMuted };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.badge, pressed && styles.pressed]}>
      <View style={[styles.circle, { backgroundColor: ring.soft, borderColor: ring.ring }]}>
        <AppText style={[styles.icon, !tier && styles.locked]} accessible={false}>
          {icon}
        </AppText>
      </View>

      <AppText variant="small" color={tier ? 'text' : 'textMuted'} numberOfLines={1} style={styles.center}>
        {title}
      </AppText>

      <View style={styles.dots}>
        {MEDAL_TIERS.map((dotTier, index) => (
          <View key={dotTier} style={[styles.dot, { backgroundColor: index < reached ? colors[dotTier] : colors.track }]} />
        ))}
      </View>

      {tierLabel ? (
        <AppText variant="caption" color="textMuted">
          {tierLabel}
        </AppText>
      ) : null}

      {next ? (
        <View style={styles.progressRow}>
          <View style={[styles.track, { backgroundColor: colors.track }]}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors[next.tier] }]} />
          </View>
          <AppText variant="caption" color="textMuted">
            {value}/{next.target}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: '33.33%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  circle: {
    width: MEDAL_SIZE,
    height: MEDAL_SIZE,
    borderRadius: radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero + 8,
  },
  locked: {
    opacity: 0.35,
  },
  center: {
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: barHeight,
    height: barHeight,
    borderRadius: radius.pill,
  },
  progressRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 2,
  },
  track: {
    alignSelf: 'stretch',
    height: barHeight / 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
