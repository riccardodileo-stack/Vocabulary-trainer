import { FlatList, ScrollView, StyleSheet, View, type FlatListProps, type ScrollViewProps } from 'react-native';

import { useTabSwipe, type TabRoute } from '@/navigation/tabSwipe';
import { spacing, useTheme } from '@/theme';

type TabSwipeProps = {
  /** Set on the root screen of a tab to switch tabs with a horizontal swipe. */
  tab?: TabRoute;
};

/**
 * Scrollable page with the app background.
 * contentInsetAdjustmentBehavior keeps content clear of the header and tab bar on iOS.
 *
 * The ScrollView is the first view of the screen whenever possible: iOS computes the
 * space under the header from it, and a wrapper can leave content hidden behind the
 * header. Only tab roots need the wrapper, to catch the swipe between tabs.
 */
export function Screen({ tab, contentContainerStyle, style, ...rest }: ScrollViewProps & TabSwipeProps) {
  const { colors } = useTheme();
  const swipeHandlers = useTabSwipe(tab);

  const scrollView = (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      {...rest}
    />
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

function Separator() {
  return <View style={styles.separator} />;
}

/**
 * Like Screen, for long lists: only the rows near the visible area are rendered,
 * so hundreds of words scroll and re-sort without lag.
 */
export function ListScreen<T>({ tab, contentContainerStyle, style, ...rest }: FlatListProps<T> & TabSwipeProps) {
  const { colors } = useTheme();
  const swipeHandlers = useTabSwipe(tab);

  return (
    <View style={styles.container} {...swipeHandlers}>
      <FlatList
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
