import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { fontSize, fontWeight, radius, spacing, touchTarget, useTextScale, useTheme } from '@/theme';

import { AppText } from './AppText';

type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** What screen readers say for the number, e.g. "Number of questions". */
  accessibilityLabel: string;
  /** Read by screen readers on the − and + buttons. */
  decreaseLabel: string;
  increaseLabel: string;
};

/**
 * − [number] +: a whole number within min and max.
 * The buttons change it by one; the number can also be typed (it's fixed on leaving the field).
 */
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  accessibilityLabel,
  decreaseLabel,
  increaseLabel,
}: NumberStepperProps) {
  const { colors } = useTheme();
  const scale = useTextScale();
  // While typing, the text is kept as is (it can be empty); null = show the value
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft !== null) {
      const typed = Number.parseInt(draft, 10);
      onChange(Number.isNaN(typed) ? value : Math.min(Math.max(typed, min), max));
      setDraft(null);
    }
  };

  const step = (delta: number) => onChange(Math.min(Math.max(value + delta, min), max));

  const stepButton = (delta: number, label: string, symbol: string) => {
    const disabled = delta < 0 ? value <= min : value >= max;
    return (
      <Pressable
        onPress={() => step(delta)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primarySoft },
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}>
        <AppText variant="title" color="primaryStrong" accessible={false}>
          {symbol}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {stepButton(-1, decreaseLabel, '−')}
      <TextInput
        value={draft ?? String(value)}
        onFocus={() => setDraft(String(value))}
        onChangeText={(text) => setDraft(text.replace(/\D/g, '').slice(0, String(max).length))}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, { color: colors.text, fontSize: fontSize.title * scale }]}
      />
      {stepButton(1, increaseLabel, '+')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  button: {
    width: touchTarget + spacing.sm,
    height: touchTarget,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    // Without it the web gives the field a default width and the row overflows
    minWidth: 0,
    textAlign: 'center',
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
});
