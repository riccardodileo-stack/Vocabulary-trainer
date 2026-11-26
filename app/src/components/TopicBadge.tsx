import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { TopicId } from '@/domain/topics';
import { useT } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { topicTints } from '@/theme/colors';

import { AppText } from './AppText';

const TOPIC_SYMBOLS = {
  tech: { ios: 'cpu', material: 'memory' },
  health: { ios: 'cross.case.fill', material: 'medical_services' },
  food: { ios: 'fork.knife', material: 'restaurant' },
  travel: { ios: 'airplane', material: 'flight' },
  work: { ios: 'briefcase.fill', material: 'work' },
  home: { ios: 'house.fill', material: 'home' },
  nature: { ios: 'leaf.fill', material: 'eco' },
  people: { ios: 'person.2.fill', material: 'group' },
  school: { ios: 'graduationcap.fill', material: 'school' },
  sport: { ios: 'figure.run', material: 'directions_run' },
  culture: { ios: 'paintpalette.fill', material: 'palette' },
  feelings: { ios: 'heart.fill', material: 'favorite' },
} satisfies Record<TopicId, { ios: SFSymbol; material: AndroidSymbol }>;

export function TopicIcon({ topic, compact = false }: { topic: TopicId; compact?: boolean }) {
  const { scheme } = useTheme();
  const { ios, material } = TOPIC_SYMBOLS[topic];
  const tint = topicTints[topic][scheme];

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.icon,
        compact && styles.iconCompact,
        { backgroundColor: `${tint}20`, borderColor: `${tint}38` },
      ]}>
      <SymbolView
        name={{ ios, android: material, web: material }}
        size={compact ? 13 : 18}
        weight="semibold"
        tintColor={tint}
      />
    </View>
  );
}

type TopicBadgeProps = {
  topic: TopicId;
  label: string;
  centered?: boolean;
};

export function TopicBadge({ topic, label, centered = false }: TopicBadgeProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.cardMuted, borderColor: colors.border },
        centered && styles.centered,
      ]}>
      <TopicIcon topic={topic} compact />
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

export function TopicBadges({ topics, children }: { topics: readonly TopicId[]; children?: ReactNode }) {
  const t = useT();

  return (
    <View style={styles.badges}>
      {topics.map((topic) => (
        <TopicBadge key={topic} topic={topic} label={t.topicsShort[topic]} />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 28,
    height: 28,
    borderRadius: spacing.sm + 1,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconCompact: {
    width: 20,
    height: 20,
    borderRadius: spacing.xs + 2,
  },
  badge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingStart: spacing.xs,
    paddingEnd: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    alignSelf: 'center',
  },
  label: {
    flexShrink: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
});