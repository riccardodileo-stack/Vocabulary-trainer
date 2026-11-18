import { useIsFocused } from 'expo-router';
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentRef,
} from 'react';
import { AccessibilityInfo, AppState, Platform, type View } from 'react-native';

import { ScreenViewport } from '@/components/Screen';

function foreground() {
  if (Platform.OS === 'web') return typeof document !== 'undefined' && !document.hidden;
  return AppState.currentState === 'active';
}

function subscribeForeground(onChange: () => void) {
  if (Platform.OS === 'web') {
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}

const serverForeground = () => false;

export function useGorichecoStage() {
  const viewport = useContext(ScreenViewport);
  const focused = useIsFocused();
  const isForeground = useSyncExternalStore(subscribeForeground, foreground, serverForeground);
  const canMeasure = focused && isForeground;
  const ref = useRef<ComponentRef<typeof View>>(null);
  const scheduleMeasure = useRef<(() => void) | null>(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const onLayout = useCallback(() => scheduleMeasure.current?.(), []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReducedMotion(media.matches);
      update();
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    let disposed = false;
    let eventReceived = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      eventReceived = true;
      setReducedMotion(enabled);
    });

    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => { if (!disposed && !eventReceived) setReducedMotion(enabled); },
      () => { if (!disposed && !eventReceived) setReducedMotion(true); },
    );

    return () => {
      disposed = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!canMeasure || !viewport) return;
    let disposed = false;
    let request: number | null = null;

    function schedule() {
      if (request !== null) return;
      request = requestAnimationFrame(() => {
        request = null;
        const surface = ref.current;
        const scroll = viewport?.scrollRef.current?.getNativeScrollRef();
        if (!surface || !scroll) return;

        scroll.measureInWindow((left, top, width, height) => {
          if (disposed) return;
          surface.measureInWindow((x, y, w, h) => {
            if (disposed) return;
            setInView(
              width > 0 && height > 0 && w > 0 && h > 0
              && x < left + width && x + w > left
              && y < top + height && y + h > top,
            );
          });
        });
      });
    }

    scheduleMeasure.current = schedule;
    const unsubscribe = viewport.subscribe(schedule);
    schedule();

    return () => {
      disposed = true;
      unsubscribe();
      if (request !== null) cancelAnimationFrame(request);
      scheduleMeasure.current = null;
      setInView(false);
    };
  }, [canMeasure, viewport]);

  return { ref, onLayout, active: canMeasure && inView, reducedMotion };
}