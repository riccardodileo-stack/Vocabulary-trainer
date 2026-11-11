// Reading and writing backup files on the device (file picker and share sheet).
// The format itself lives in domain/backup.ts.

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { backupFileName, createBackup } from '@/domain/backup';
import type { Word } from '@/domain/word';

/** Lets the user pick a file and returns its text, or null if the picker was closed. */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });

  if (result.canceled) {
    return null;
  }

  return new File(result.assets[0].uri).text();
}

/** Writes the backup to a temporary file and opens the share sheet (Files, AirDrop, mail...). */
export async function shareBackup(words: Word[]): Promise<void> {
  const file = new File(Paths.cache, backupFileName());

  if (file.exists) {
    file.delete();
  }

  file.create();
  file.write(JSON.stringify(createBackup(words), null, 2));

  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
}
