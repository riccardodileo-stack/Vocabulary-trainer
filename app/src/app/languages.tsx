// Language sheet, opened from the language chip in Home: only what to study
// (studied language, my language, level of the words of the day).
// Everything else is in the full settings (gear in Profile).

import { Screen } from '@/components/Screen';
import { StudySettings } from '@/components/StudySettings';

export default function LanguagesScreen() {
  return (
    <Screen>
      <StudySettings />
    </Screen>
  );
}
