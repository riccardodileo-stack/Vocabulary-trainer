import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** A row of mutually exclusive choices, e.g. System / Light / Dark. */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && [styles.selected, { backgroundColor: colors.card, shadowColor: colors.shadow }]]}>
            <AppText
              variant={selected ? 'bodyBold' : 'body'}
              color={selected ? 'text' : 'textMuted'}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget - spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  // Only the selected segment is raised: a shadow on a transparent view
  // would draw around the text on iOS
  selected: {
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
