// Backup: export the words to a file, import them back (also from the old web app).

import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { parseBackup } from '@/domain/backup';
import { useT } from '@/i18n';
import { pickBackupText, shareBackup } from '@/services/backupFiles';
import { useWordStore } from '@/store/wordStore';

export default function BackupSettingsScreen() {
  const t = useT();

  const exportBackup = async () => {
    const { words } = useWordStore.getState();

    if (words.length === 0) {
      Alert.alert(t.settings.exportEmpty);
      return;
    }

    try {
      await shareBackup(words);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const importBackup = async () => {
    try {
      const text = await pickBackupText();
      if (text === null) {
        return;
      }

      const backup = parseBackup(text);
      if (!backup || backup.words.length === 0) {
        Alert.alert(t.settings.importInvalid);
        return;
      }

      const { added, updated, skipped } = useWordStore.getState().importWords(backup.words);
      Alert.alert(t.settings.importDoneTitle, t.settings.importDone(added, updated, skipped + backup.invalidCount));
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t.settings.importError);
    }
  };

  return (
    <Screen>
      <Section title={t.settings.exportBackup} hint={t.settings.exportHint}>
        <Button label={t.settings.exportBackup} tone="secondary" onPress={exportBackup} />
      </Section>
      <Section title={t.settings.importBackup} hint={t.settings.backupHint}>
        <Button label={t.settings.importBackup} tone="secondary" onPress={importBackup} />
      </Section>
    </Screen>
  );
}
