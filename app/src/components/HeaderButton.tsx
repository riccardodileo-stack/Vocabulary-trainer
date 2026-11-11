import { Pressable, StyleSheet } from 'react-native';

import { iconSize, touchTarget } from '@/theme';

import { AppText } from './AppText';

type HeaderButtonProps = {
  /** A word ("Done") or a single symbol ("+"), shown bigger. */
  label: string;
  onPress: () => void;
  /** Required for symbols: it is what screen readers say. */
  accessibilityLabel?: string;
};

/** Text button for the sides of a navigation header ("+", "Done", "End", ...). */
export function HeaderButton({ label, onPress, accessibilityLabel }: HeaderButtonProps) {
  const isSymbol = label.length === 1;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <AppText variant="bodyBold" color="primary" style={isSymbol && styles.symbol}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: iconSize.lg + 2,
    lineHeight: iconSize.lg + 6,
  },
  pressed: {
    opacity: 0.6,
  },
});
