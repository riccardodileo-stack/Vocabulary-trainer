// Settings: a stack inside the settings modal. The main page lists the
// categories; each one opens its own page, sliding in from the right.

import { Stack, router } from 'expo-router';

import { HeaderButton } from '@/components/HeaderButton';
import { useT } from '@/i18n';

export default function SettingsLayout() {
  const t = useT();

  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen
        name="index"
        options={{
          title: t.settings.title,
          // First page of the stack: going back closes the whole settings modal
          headerRight: () => <HeaderButton label={t.settings.done} onPress={() => router.back()} />,
        }}
      />
      <Stack.Screen name="sounds" options={{ title: t.settings.sounds }} />
      <Stack.Screen name="notifications" options={{ title: t.settings.notifications }} />
      <Stack.Screen name="languages" options={{ title: t.settings.languagesCategory }} />
      <Stack.Screen name="backup" options={{ title: t.settings.backup }} />
    </Stack>
  );
}
