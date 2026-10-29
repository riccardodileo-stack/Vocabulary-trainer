import { Stack } from 'expo-router';

import { tabStackOptions } from '@/navigation/tabStackOptions';

export default function Layout() {
  return <Stack screenOptions={tabStackOptions} />;
}
