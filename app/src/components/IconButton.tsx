import { Pressable, StyleSheet } from 'react-native';

import { iconSize, radius, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

type IconButtonProps = {
  /** An emoji or a single symbol, e.g. "⚙️". */
  icon: string;
  onPress: () => void;
  /** What screen readers say, e.g. "Settings". Required: the icon alone says nothing. */
  accessibilityLabel: string;
  /** 'plain' has no background, 'soft' sits on a tinted circle. */
  tone?: 'plain' | 'soft';
};

/** Round, icon-only button with a full 44pt touch area. */
export function IconButton({ icon, onPress, accessibilityLabel, tone = 'plain' }: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        tone === 'soft' && { backgroundColor: colors.primarySoft },
        pressed && styles.pressed,
      ]}>
      <AppText style={styles.icon} accessible={false}>
        {icon}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: iconSize.lg,
    lineHeight: iconSize.lg + 6,
  },
  pressed: {
    opacity: 0.6,
  },
});
