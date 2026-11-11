// Sounds settings. One switch for now; new sound options go here.

import { ListGroup, ListRow } from '@/components/ListGroup';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { useT } from '@/i18n';
import { playSound } from '@/services/sounds';
import { useSettingsStore } from '@/store/settingsStore';

export default function SoundsSettingsScreen() {
  const t = useT();
  const soundsEnabled = useSettingsStore((state) => state.soundsEnabled);
  const setSoundsEnabled = useSettingsStore((state) => state.setSoundsEnabled);

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
