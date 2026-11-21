import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import type { LanguageCode } from '@/domain/languages';
import { useT } from '@/i18n';
import { speak, stopSpeaking } from '@/services/speech';
import { motion, radius, touchTarget, useTheme } from '@/theme';

type SpeakButtonProps = {
  /** What is read aloud. */
  text: string;
  language: LanguageCode;
  /**
   * 'sm' fits a list row, 'md' sits in a card (the word in a quiz): both are just the speaker
   * icon, with a full touch area. 'lg' is the main control of a listening exercise, on a
   * tinted circle.
   */
  size?: 'sm' | 'md' | 'lg';
};

/** The speaker symbol: SF Symbols on iOS, Material Symbols on Android and the web. */
const SPEAKER = { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' } as const;

const ICON = { sm: 18, md: 22, lg: 40 } as const;
const LARGE = 96;

/** A speaker icon that reads a word aloud; it pulses while the voice is speaking. */
export function SpeakButton({ text, language, size = 'md' }: SpeakButtonProps) {
  const t = useT();
  const { colors } = useTheme();
  const [speaking, setSpeaking] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.set(
      speaking
        ? withRepeat(withSequence(withTiming(1.12, { duration: motion.normal }), withTiming(1, { duration: motion.normal })), -1)
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

  const large = size === 'lg';
  // Small icons keep a 44 pt touch area around them (Apple and Google guidelines)
  const area = large ? LARGE : touchTarget;
  const slop = size === 'sm' ? 0 : 4;

  return (
    <Pressable
      onPress={onPress}
      disabled={!text.trim()}
      accessibilityRole="button"
      accessibilityLabel={t.speech.listen}
      hitSlop={slop}
      style={size === 'sm' ? styles.inRow : undefined}>
      {({ pressed }) => (
        <View
          style={[
            styles.area,
            { width: area, height: area },
            large && { backgroundColor: colors.primarySoft, borderRadius: radius.pill },
            pressed && styles.pressed,
          ]}>
          <Animated.View style={pulseStyle}>
            <SymbolView name={SPEAKER} size={ICON[size]} tintColor={speaking || large ? colors.primary : colors.textMuted} />
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // In a list row the 44 pt area would make the row taller: it overlaps the padding instead
  inRow: {
    marginVertical: -(touchTarget - ICON.sm) / 2 + 4,
  },
  pressed: {
    opacity: 0.5,
  },
});
