import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { MEDAL_TIERS, type Achievement } from '@/domain/achievements';
import { useUiLanguage } from '@/i18n';
import { fontWeight, radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { MedalEmblem, MEDAL_MARKS } from './MedalVisuals';

type MedalBadgeProps = {
  achievement: Achievement;
  title: string;
  tierLabel: string | null;
  accessibilityLabel: string;
  onPress?: () => void;
};

export function MedalBadge({ achievement, title, tierLabel, accessibilityLabel, onPress }: MedalBadgeProps) {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const format = new Intl.NumberFormat(useUiLanguage());
  const { id, tier, next, value, progress, targets } = achievement;
  const reached = tier ? MEDAL_TIERS.indexOf(tier) + 1 : 0;
  const reference = next?.target ?? targets[targets.length - 1];
  const columnWidth = fontScale >= 2 ? '100%' : width < 350 || fontScale >= 1.4 ? '50%' : '33.3333%';
  const columnStyle = [styles.column, { width: columnWidth }] as const;

  const tile = (
    <View style={[styles.tile, { backgroundColor: colors.card, borderColor: tier ? colors[tier] + '55' : colors.border }]}>
      <MedalEmblem id={id} tier={tier} />
      <AppText variant="small" style={styles.title}>{title}</AppText>

      <View style={[styles.tier, { backgroundColor: tier ? colors[`${tier}Soft`] : colors.cardMuted }]}>
        {tierLabel ? (
          <AppText variant="caption" style={styles.center}>{tierLabel}</AppText>
        ) : (
          <SymbolView name={MEDAL_MARKS.lock} size={13} tintColor={colors.textMuted} accessible={false} />
        )}
      </View>

      <View style={styles.segments} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {MEDAL_TIERS.map((level, index) => {
          const fill = index < reached ? 1 : index === reached ? progress : 0;
          return (
            <View key={level} style={[styles.segment, { backgroundColor: colors.track }]}>
              <View style={[styles.segmentFill, { width: `${fill * 100}%`, backgroundColor: colors[level] }]} />
            </View>
          );
        })}
      </View>
      <AppText variant="caption" color="textMuted" style={styles.center}>
        {format.format(value)}/{format.format(reference)}
      </AppText>
    </View>
  );

  return onPress ? (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [columnStyle, pressed && styles.pressed]}>
      {tile}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={accessibilityLabel} style={columnStyle}>
      {tile}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { padding: spacing.xs },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.78 },
  title: { flexGrow: 1, textAlign: 'center', fontWeight: fontWeight.bold },
  center: { textAlign: 'center' },
  tier: {
    minHeight: 22,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segments: { flexDirection: 'row', alignSelf: 'stretch', gap: 3, marginTop: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  segmentFill: { height: '100%', borderRadius: radius.pill },
});