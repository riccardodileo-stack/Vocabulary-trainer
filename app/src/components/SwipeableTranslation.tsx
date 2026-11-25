import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { iconSize, radius, spacing, useTheme } from '@/theme';

type Props = {
  children: ReactNode;
  removeLabel: string;
  onRemove?: () => void;
};

export function SwipeableTranslation({ children, removeLabel, onRemove }: Props) {
  const { colors } = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);
  const [revealed, setRevealed] = useState(false);
  const canRemove = onRemove !== undefined;

  useEffect(() => {
    if (!canRemove) {
      swipeable.current?.close();
    }
  }, [canRemove]);

  return (
    <Swipeable
      ref={swipeable}
      enabled={canRemove}
      friction={1.5}
      rightThreshold={spacing.xxl}
      overshootRight={false}
      containerStyle={styles.card}
      onSwipeableWillOpen={() => setRevealed(true)}
      onSwipeableWillClose={() => setRevealed(false)}
      renderRightActions={
        canRemove
          ? () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={removeLabel}
                accessibilityElementsHidden={!revealed}
                importantForAccessibility={revealed ? 'auto' : 'no-hide-descendants'}
                onPress={onRemove}
                style={({ pressed }) => [
                  styles.remove,
                  { backgroundColor: colors.danger },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                  size={iconSize.md}
                  tintColor={colors.background}
                  accessible={false}
                />
              </Pressable>
            )
          : undefined
      }>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
  },
  remove: {
    width: spacing.xxl * 2 + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});