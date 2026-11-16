// Sounds settings. One switch for now; new sound options go here.

import { useEffect } from 'react';

import { ListGroup, ListRow } from '@/components/ListGroup';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { useT } from '@/i18n';
import { playSound, soundsForScreen } from '@/services/sounds';
import { useSettingsStore } from '@/store/settingsStore';

export default function SoundsSettingsScreen() {
  const t = useT();
  const soundsEnabled = useSettingsStore((state) => state.soundsEnabled);
  const setSoundsEnabled = useSettingsStore((state) => state.setSoundsEnabled);
  // Ready before the switch is touched, so the sample isn't late
  useEffect(soundsForScreen, []);

  const toggle = (enabled: boolean) => {
    setSoundsEnabled(enabled);
    if (enabled) {
      // Let the user hear what they just turned on
      playSound('correct');
    }
  };

  return (
    <Screen>
      <Section title={t.settings.quizSection} hint={t.settings.soundsHint}>
        <ListGroup>
          <ListRow icon="🔊" label={t.settings.soundsLabel} toggle={{ value: soundsEnabled, onChange: toggle }} />
        </ListGroup>
      </Section>
    </Screen>
  );
}
