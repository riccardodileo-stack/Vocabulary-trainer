import { Stack } from 'expo-router';

import { tabStackOptions } from '@/navigation/tabStackOptions';

export default function WordsLayout() {
  return <Stack screenOptions={tabStackOptions} />;
}
