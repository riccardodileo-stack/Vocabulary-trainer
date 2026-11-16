import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import type { LanguageCode } from '@/domain/languages';
import { useT } from '@/i18n';
import { speak, stopSpeaking } from '@/services/speech';
import { iconSize, motion, radius, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

type SpeakButtonProps = {
  /** What is read aloud. */
  text: string;
  language: LanguageCode;
  /** 'md' is a full touch target on a tinted circle; 'lg' is the main control of a listening exercise. */
  size?: 'md' | 'lg';
};

const LARGE = 96;

/** Round 🔊 button that reads a word aloud; it pulses while the voice is speaking. */
export function SpeakButton({ text, language, size = 'md' }: SpeakButtonProps) {
  const t = useT();
  const { colors } = useTheme();
  const [speaking, setSpeaking] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.set(
      speaking
        ? withRepeat(withSequence(withTiming(1.08, { duration: motion.normal }), withTiming(1, { duration: motion.normal })), -1)
        : withTiming(1, { duration: motion.fast })
    );
  }, [speaking, pulse]);

  // Leaving the screen stops the voice
  useEffect(() => stopSpeaking, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  const onPress = () => {
    setSpeaking(true);
    speak(text, language, () => setSpeaking(false));
  };

  const diameter = size === 'lg' ? LARGE : touchTarget;

  return (
    <Pressable
      onPress={onPress}
      disabled={!text.trim()}
      accessibilityRole="button"
      accessibilityLabel={t.speech.listen}
      hitSlop={4}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.button,
            { width: diameter, height: diameter, backgroundColor: colors.primarySoft },
            pulseStyle,
            pressed && styles.pressed,
          ]}>
          <AppText style={size === 'lg' ? styles.iconLarge : styles.icon} accessible={false}>
            🔊
          </AppText>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: iconSize.md,
    lineHeight: iconSize.md + 6,
  },
  iconLarge: {
    fontSize: 40,
    lineHeight: 50,
  },
  pressed: {
    opacity: 0.7,
  },
});
