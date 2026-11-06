import { Stack } from 'expo-router';

import { tabStackOptions } from '@/navigation/tabStackOptions';

export default function ProfileLayout() {
  return <Stack screenOptions={tabStackOptions} />;
}
