// Bottom tab bar. Each Trigger name matches a route in this folder.
// Icons: `sf` = SF Symbols (iOS), `md` = Material Symbols (Android).

import { NativeTabs } from 'expo-router/native-tabs';

import { useT } from '@/i18n';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useT();
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t.tabs.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="words">
        <NativeTabs.Trigger.Label>{t.tabs.words}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="train">
        <NativeTabs.Trigger.Label>{t.tabs.train}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="target" md="target" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="challenges">
        <NativeTabs.Trigger.Label>{t.tabs.challenges}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} md="emoji_events" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
