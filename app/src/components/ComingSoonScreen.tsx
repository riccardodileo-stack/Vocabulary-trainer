import { Stack } from 'expo-router';

import { useT } from '@/i18n';
import type { TabRoute } from '@/navigation/tabSwipe';

import { AppText } from './AppText';
import { Card } from './Card';
import { Screen } from './Screen';

/** Temporary content for tabs that are not built yet. */
export function ComingSoonScreen({ title, tab }: { title: string; tab?: TabRoute }) {
  const t = useT();

  return (
    <>
      <Stack.Screen options={{ title }} />

      <Screen tab={tab}>
        <Card>
          <AppText color="textMuted">{t.common.comingSoon}</AppText>
        </Card>
      </Screen>
    </>
  );
}
