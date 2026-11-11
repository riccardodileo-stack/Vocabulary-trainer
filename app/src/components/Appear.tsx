import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOut } from 'react-native-reanimated';

import { motion } from '@/theme';

type AppearProps = {
  children: ReactNode;
  /**
   * fade:  just fades in (text that changes, e.g. a hint)
   * down:  fades in sliding down a little (a section that opens)
   * right: comes in from the right (the next question)
   */
  from?: 'fade' | 'down' | 'right';
  /**
   * Fade out when removed (default). Turn it off when something else takes the same
   * place right away (the next question), so the two don't overlap while fading.
   */
  exit?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ENTERING = {
  fade: FadeIn.duration(motion.normal),
  down: FadeInDown.duration(motion.normal),
  right: FadeInRight.duration(motion.normal),
};

const EXITING = FadeOut.duration(motion.fast);

/**
 * Animates content that appears or disappears after the user changes a choice.
 * To animate a change of content (not only its arrival), give it a `key` that changes
 * with it: React remounts it and the animation plays again.
 *
 * Nothing plays when the screen opens: Screen skips the entering animations of
 * what is already there (LayoutAnimationConfig), only later changes animate.
 */
export function Appear({ children, from = 'fade', exit = true, style }: AppearProps) {
  return (
    <Animated.View entering={ENTERING[from]} exiting={exit ? EXITING : undefined} style={style}>
      {children}
    </Animated.View>
  );
}
