import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Pose, SceneEvent } from './collegamento';
import Superficie from './Superficie';
import { useGorichecoStage } from './useGorichecoStage';

const poses = {
  welcome: { yaw: 0.92, expression: 'smile', tail: 0.42 },
  daily: { yaw: 0.66, expression: 'curious', tail: 0.35, gaze: [-0.24, 0.02] },
  training: { yaw: 0.76, expression: 'sleepy', tail: 0.28, gaze: [-0.18, 0.12] },
} satisfies Record<string, Pose>;

const wave = { name: 'wave', sequence: 1 } as const;

export function GorichecoPose({ scene, style }: {
  scene: keyof typeof poses;
  style: StyleProp<ViewStyle>;
}) {
  const { active, onLayout, reducedMotion, ref } = useGorichecoStage();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const onSceneEvent = useCallback(async (event: SceneEvent) => {
    if (event === 'ready') setReady(true);
    if (event === 'error') setFailed(true);
  }, []);

  useEffect(() => {
    if (!active || ready || failed) return;
    const timeout = setTimeout(() => setFailed(true), __DEV__ ? 10000 : 5000);
    return () => clearTimeout(timeout);
  }, [active, failed, ready]);

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={onLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={style}
    >
      {failed ? (
        <Image
          source={require('./goricheco-statico.png')}
          contentFit="contain"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Superficie
          state={{
            mode: 'preview',
            active: active && ready && reducedMotion === false,
            reducedMotion: reducedMotion !== false,
            compact: false,
            edgeInset: 0,
          }}
          pose={poses[scene]}
          action={scene === 'welcome' && active && ready && reducedMotion === false ? wave : undefined}
          onSceneEvent={onSceneEvent}
          dom={{
            useExpoDOMWebView: Platform.OS !== 'ios',
            scrollEnabled: false,
            style: { width: '100%', height: '100%', backgroundColor: 'transparent' },
            onContentProcessDidTerminate: () => setFailed(true),
            onRenderProcessGone: () => setFailed(true),
          }}
        />
      )}
    </View>
  );
}