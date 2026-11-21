import { StyleSheet, View } from 'react-native';

import { MASTERED_BOX } from '@/domain/review';
import { barHeight, radius, spacing, useTheme } from '@/theme';

type MasteryMeterProps = {
  /** Spaced-repetition box of the word, from 0 to MASTERED_BOX. */
  box: number;
  /** Half of the next segment is filled (half a box earned with multiple choice). */
  half?: boolean;
  /** E.g. "Learned 3 of 5". */
  accessibilityLabel: string;
};

/** A row of small segments showing how well a word is known. */
export function MasteryMeter({ box, half = false, accessibilityLabel }: MasteryMeterProps) {
  const { colors } = useTheme();

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.row}>
      {Array.from({ length: MASTERED_BOX }, (_, index) => (
        <View
          key={index}
          style={[styles.segment, { backgroundColor: index < box ? colors.accent : colors.track }]}>
          {half && index === box ? <View style={[styles.half, { backgroundColor: colors.accent }]} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs / 2,
  },
  segment: {
    width: spacing.md,
    height: barHeight / 2 + 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  half: {
    width: '50%',
    height: '100%',
  },
});
