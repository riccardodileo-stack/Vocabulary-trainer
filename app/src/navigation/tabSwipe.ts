// Horizontal swipe between the tabs, in the same order as the tab bar.
// The native tab bar has no swipe of its own, so the root screen of each tab
// listens for a mostly horizontal drag and switches to the next or previous tab.

import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { PanResponder, type GestureResponderHandlers } from 'react-native';

export const TAB_ROUTES = ['/', '/words', '/train', '/challenges'] as const satisfies Href[];

export type TabRoute = (typeof TAB_ROUTES)[number];

/** Minimum horizontal distance (or speed) for a drag to count as a swipe. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 0.5;

function isHorizontalDrag(dx: number, dy: number): boolean {
  return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 2;
}

export function useTabSwipe(tab: TabRoute | undefined): GestureResponderHandlers | undefined {
  return useMemo(() => {
    if (!tab) {
      return undefined;
    }

    const index = TAB_ROUTES.indexOf(tab);

    return PanResponder.create({
      // Capture phase: claim the drag before the vertical ScrollView does,
      // but only when it is clearly horizontal
      onMoveShouldSetPanResponderCapture: (_, { dx, dy }) => isHorizontalDrag(dx, dy),
      onPanResponderRelease: (_, { dx, vx }) => {
        const goNext = dx < -SWIPE_DISTANCE || vx < -SWIPE_VELOCITY;
        const goPrevious = dx > SWIPE_DISTANCE || vx > SWIPE_VELOCITY;
        const target = goNext ? TAB_ROUTES[index + 1] : goPrevious ? TAB_ROUTES[index - 1] : undefined;

        if (target) {
          router.navigate(target);
        }
      },
    }).panHandlers;
  }, [tab]);
}
