import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type PillProps = {
  label: string;
  tone?: 'primary' | 'neutral' | 'warning';
};

/** Small rounded label, e.g. "248 words" or "Coming soon". */
export function Pill({ label, tone = 'neutral' }: PillProps) {
  const { colors } = useTheme();

  const toneStyle = {
    primary: { backgroundColor: colors.primarySoft, color: 'primaryStrong' as const },
    neutral: { backgroundColor: colors.cardMuted, color: 'textMuted' as const },
    warning: { backgroundColor: colors.warningSoft, color: 'warning' as const },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: toneStyle.backgroundColor }]}>
      <AppText variant="caption" color={toneStyle.color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
