// Profile photo: picked from the gallery (square crop) and copied into the app's
// documents, because the picker's own copy lives in a cache the system may empty.

import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const FOLDER = 'profile';

/** Opens the gallery. Returns the saved photo's uri, or null if the user closed it. */
export async function pickProfilePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const pickedUri = result.assets[0].uri;
  // The web has no app documents folder: the picked image is used as is
  if (Platform.OS === 'web') {
    return pickedUri;
  }

  const folder = new Directory(Paths.document, FOLDER);
  if (!folder.exists) {
    folder.create();
  }
  // A new name every time, so the image cache never shows the old photo
  const target = new File(folder, `avatar-${Date.now()}.jpg`);
  await new File(pickedUri).copy(target);
  return target.uri;
}

/** Deletes a photo saved by pickProfilePhoto (ignored if it is not ours). */
export function deleteProfilePhoto(uri: string) {
  if (Platform.OS === 'web' || !uri.includes(`/${FOLDER}/`)) {
    return;
  }
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Could not delete the old profile photo:', error);
  }
}
