// Fake of react-native-reanimated for the screen tests: plain views, no animations.

import { FlatList, ScrollView, Text, View } from 'react-native';

/** Stands for FadeIn, LinearTransition…: every setting returns the same object. */
const animation: Record<string, unknown> = {};
for (const name of ['duration', 'delay', 'springify', 'damping', 'stiffness', 'easing']) {
  animation[name] = () => animation;
}

module.exports = {
  __esModule: true,
  default: { View, Text, ScrollView, FlatList, createAnimatedComponent: (component: unknown) => component },
  FadeIn: animation,
  FadeInDown: animation,
  FadeInRight: animation,
  FadeOut: animation,
  ZoomIn: animation,
  LinearTransition: animation,
  LayoutAnimationConfig: ({ children }: { children: unknown }) => children,
  useSharedValue: <T,>(initial: T) => {
    const shared = { value: initial, get: () => shared.value, set: (next: T) => void (shared.value = next) };
    return shared;
  },
  useAnimatedStyle: (style: () => object) => style(),
  interpolateColor: (_value: number, _input: number[], output: string[]) => output[0],
  withTiming: <T,>(value: T) => value,
  withSpring: <T,>(value: T) => value,
  withRepeat: <T,>(value: T) => value,
  withSequence: <T,>(value: T) => value,
};
