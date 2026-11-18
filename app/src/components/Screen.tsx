import { createContext, useMemo, useRef, type ComponentRef, type RefObject } from 'react';
import { ScrollView, StyleSheet, View, type FlatListProps, type ScrollViewProps } from 'react-native';

import Animated, { LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';

import { useTabSwipe, type TabRoute } from '@/navigation/tabSwipe';
import { motion, spacing, useTheme } from '@/theme';

type TabSwipeProps = {
  /** Set on the root screen of a tab to switch tabs with a horizontal swipe. */
  tab?: TabRoute;
};

export const ScreenViewport = createContext<{
  scrollRef: RefObject<ComponentRef<typeof ScrollView> | null>;
  subscribe: (listener: () => void) => () => void;
} | null>(null);

/**
 * Scrollable page with the app background.
 * contentInsetAdjustmentBehavior keeps content clear of the header and tab bar on iOS.
 *
 * The ScrollView is the first view of the screen whenever possible: iOS computes the
 * space under the header from it, and a wrapper can leave content hidden behind the
 * header. Only tab roots need the wrapper, to catch the swipe between tabs.
 */
export function Screen({
  tab,
  trackViewport = false,
  contentContainerStyle,
  style,
  children,
  onLayout,
  onScroll,
  onContentSizeChange,
  scrollEventThrottle,
  ...rest
}: ScrollViewProps & TabSwipeProps & { trackViewport?: boolean }) {
  const { colors } = useTheme();
  const swipeHandlers = useTabSwipe(tab);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const listeners = useRef(new Set<() => void>());
  const viewport = useMemo(() => ({
    scrollRef,
    subscribe(listener: () => void) {
      const currentListeners = listeners.current;
      currentListeners.add(listener);
      return () => { currentListeners.delete(listener); };
    },
  }), []);
  const notifyViewport = () => listeners.current.forEach((listener) => listener());

  const scrollView = (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      {...rest}
      ref={trackViewport ? scrollRef : undefined}
      scrollEventThrottle={scrollEventThrottle ?? (trackViewport ? 64 : undefined)}
      onScroll={trackViewport ? (event) => { onScroll?.(event); notifyViewport(); } : onScroll}
      onLayout={trackViewport ? (event) => { onLayout?.(event); notifyViewport(); } : onLayout}
      onContentSizeChange={trackViewport ? (width, height) => {
        onContentSizeChange?.(width, height);
        notifyViewport();
      } : onContentSizeChange}
    >
      <ScreenViewport.Provider value={trackViewport ? viewport : null}>
        <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
      </ScreenViewport.Provider>
    </ScrollView>
  );

  if (!swipeHandlers) {
    return scrollView;
  }

  return (
    <View style={styles.container} {...swipeHandlers}>
      {scrollView}
    </View>
  );
}

const ROW_TRANSITION = LinearTransition.duration(motion.normal);

function Separator() {
  return <View style={styles.separator} />;
}

/**
 * Like Screen, for long lists: only the rows near the visible area are rendered,
 * so hundreds of words scroll and re-sort without lag.
 * When the order or the filter changes, the rows slide to their new place.
 */
export function ListScreen<T>({
  tab,
  contentContainerStyle,
  style,
  ...rest
}: Omit<FlatListProps<T>, 'CellRendererComponent'> & TabSwipeProps) {
  const { colors } = useTheme();
  const swipeHandlers = useTabSwipe(tab);

  return (
    <View style={styles.container} {...swipeHandlers}>
      <Animated.FlatList
        itemLayoutAnimation={ROW_TRANSITION}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        ItemSeparatorComponent={Separator}
        initialNumToRender={15}
        windowSize={7}
        style={[{ backgroundColor: colors.background }, style]}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
});
