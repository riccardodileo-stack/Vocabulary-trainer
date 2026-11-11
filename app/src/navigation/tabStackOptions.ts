// Header style shared by the stacks inside each tab (Words, Train, Challenges).

import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

type StackScreenOptions = NonNullable<ComponentProps<typeof Stack>['screenOptions']>;

export const tabStackOptions: StackScreenOptions = {
  headerLargeTitle: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
};
