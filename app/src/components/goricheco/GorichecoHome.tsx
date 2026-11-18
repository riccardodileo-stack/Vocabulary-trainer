import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { radius, spacing } from '@/theme';

import type { Mode, SceneEvent } from './collegamento';
import { claimHomeIntro, wasHomeIntroClaimed } from './sessione';
import Superficie from './Superficie';
import { useGorichecoStage } from './useGorichecoStage';

type Props = {
  greeting: string;
  bubbleColor: string;
  compact?: boolean;
  visible?: boolean;
};

const surfaceStyle = { width: '100%', height: '100%', backgroundColor: 'transparent' } as const;

export function GorichecoHome({ greeting, bubbleColor, compact = false, visible = true }: Props) {
  const navigation = useNavigation();
  const { active, onLayout, reducedMotion, ref } = useGorichecoStage();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode>(() => wasHomeIntroClaimed() ? 'idle' : 'hold');
  const [showGreeting, setShowGreeting] = useState(() => wasHomeIntroClaimed());
  const [opacity] = useState(() => new Animated.Value(wasHomeIntroClaimed() ? 1 : 0));
  const showStage = active && visible;
  const greetingVisible = showGreeting || failed || reducedMotion === true;

  useEffect(() => {
    if (mode !== 'intro') return;
    return navigation.addListener('blur', () => {
      setMode('idle');
      setShowGreeting(true);
      opacity.setValue(1);
    });
  }, [mode, navigation, opacity]);

  useEffect(() => {
    if (!showStage || mode !== 'hold') return;
    if (!failed && reducedMotion !== true && (!ready || reducedMotion === null)) return;

    const request = requestAnimationFrame(() => {
      const first = claimHomeIntro();
      if (first && !reducedMotion && !failed) setMode('intro');
      else {
        setMode('idle');
        setShowGreeting(true);
      }
    });

    return () => cancelAnimationFrame(request);
  }, [failed, mode, ready, reducedMotion, showStage]);

  useEffect(() => {
    if (!showStage || failed || reducedMotion === true) return;

    const waitingForCanvas = !ready || reducedMotion === null;
    const duringIntro = mode === 'intro' && !showGreeting;
    const limit = waitingForCanvas ? (__DEV__ ? 10000 : 5000) : duringIntro ? 6500 : 0;
    if (!limit) return;

    const timer = setTimeout(() => {
      claimHomeIntro();
      setFailed(true);
      setMode('idle');
      setShowGreeting(true);
    }, limit);

    return () => clearTimeout(timer);
  }, [failed, mode, ready, reducedMotion, showGreeting, showStage]);

  const onSceneEvent = useCallback(async (event: SceneEvent) => {
    if (event === 'ready') setReady(true);
    else if (event === 'greet') setShowGreeting(true);
    else if (event === 'idle') {
      setShowGreeting(true);
      setMode('idle');
    } else if (event === 'error') {
      setFailed(true);
      setMode((current) => current === 'intro' ? 'idle' : current);
      setShowGreeting(true);
    }
  }, []);

  useEffect(() => {
    if (!showStage || !showGreeting || reducedMotion !== false || failed) {
      opacity.setValue(showGreeting ? 1 : 0);
      return;
    }

    const reveal = Animated.timing(opacity, {
      toValue: 1,
      duration: 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    reveal.start();
    return () => reveal.stop();
  }, [failed, opacity, reducedMotion, showGreeting, showStage]);

  const surfaceOptions = useMemo(() => ({
    useExpoDOMWebView: Platform.OS !== 'ios',
    scrollEnabled: false,
    style: surfaceStyle,
    onError: () => { void onSceneEvent('error'); },
    onContentProcessDidTerminate: () => { void onSceneEvent('error'); },
    onRenderProcessGone: () => { void onSceneEvent('error'); },
  }), [onSceneEvent]);

  const state = useMemo(() => ({
    mode,
    active: showStage && ready && !failed && reducedMotion === false,
    reducedMotion: reducedMotion !== false,
    compact,
    edgeInset: spacing.lg,
  }), [compact, failed, mode, ready, reducedMotion, showStage]);

  return (
    <View
      style={[styles.row, compact && styles.rowCompact]}
      ref={ref}
      collapsable={false}
      onLayout={onLayout}
    >
      <Animated.View
        aria-hidden={!greetingVisible}
        accessibilityElementsHidden={!greetingVisible}
        importantForAccessibility={greetingVisible ? 'auto' : 'no-hide-descendants'}
        style={[
          styles.bubble,
          { backgroundColor: bubbleColor, opacity: failed || reducedMotion === true ? 1 : opacity },
        ]}
      >
        <View pointerEvents="none" style={styles.bubbleTail}>
          <View style={[styles.bubbleTip, { backgroundColor: bubbleColor }]} />
        </View>
        <AppText variant="hero" accessibilityRole="header">{greeting}</AppText>
      </Animated.View>
      <View style={[styles.reserve, compact && styles.reserveCompact]} />
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.stage, compact && styles.stageCompact]}
      >
        {!failed && <Superficie state={state} onSceneEvent={onSceneEvent} dom={surfaceOptions} />}
        {(failed || (reducedMotion === true && !ready)) && (
          <Image
            source={require('./goricheco-statico.png')}
            accessible={false}
            contentFit="contain"
            contentPosition="bottom right"
            style={[styles.static, compact && styles.staticCompact]}
          />
        )}
      </View>
    </View>
  );
}

const STAGE_HEIGHT = 151;
const COMPACT_STAGE_HEIGHT = 124;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: STAGE_HEIGHT,
    marginRight: -spacing.lg,
    paddingRight: spacing.lg,
    overflow: 'hidden',
  },
  rowCompact: {
    minHeight: COMPACT_STAGE_HEIGHT,
  },
  bubble: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleTail: {
    position: 'absolute',
    top: spacing.sm,
    bottom: 0,
    right: -5,
    width: 14,
    justifyContent: 'center',
  },
  bubbleTip: {
    width: 14,
    height: 14,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  reserve: {
    width: 134,
    flexShrink: 0,
  },
  reserveCompact: {
    width: 111,
  },
  stage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: STAGE_HEIGHT,
    marginTop: -STAGE_HEIGHT / 2,
  },
  stageCompact: {
    height: COMPACT_STAGE_HEIGHT,
    marginTop: -COMPACT_STAGE_HEIGHT / 2,
  },
  static: {
    position: 'absolute',
    width: '47%',
    maxWidth: 194,
    top: 0,
    bottom: 4,
    right: spacing.lg + 2,
  },
  staticCompact: {
    width: '37%',
    maxWidth: 142,
  },
});
