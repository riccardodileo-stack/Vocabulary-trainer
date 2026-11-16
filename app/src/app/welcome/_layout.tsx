// Welcome screens, shown while there's no account on the phone (see app/_layout.tsx):
// choose between email and guest, then the nickname.

import { Stack } from 'expo-router';

import { useT } from '@/i18n';

export default function WelcomeLayout() {
  const t = useT();

  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="guest" options={{ title: t.welcome.guestTitle }} />
      <Stack.Screen name="email" options={{ title: t.welcome.emailScreenTitle }} />
      <Stack.Screen name="profile" options={{ title: t.welcome.profileTitle, headerBackVisible: false }} />
    </Stack>
  );
}
