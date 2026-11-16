// Profile picture: a big preview, the 12 drawn avatars and "Choose a photo" from the gallery.
// Used when creating the profile (welcome screens). The photo is a file on the phone until the
// profile is saved, then it's uploaded to the server.

import { Alert, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { deleteProfilePhoto, pickProfilePhoto } from '@/services/profilePhoto';
import { spacing } from '@/theme';

import { Avatar } from './Avatar';
import { AvatarPicker } from './AvatarPicker';
import { Button } from './Button';
import { Card } from './Card';

type ProfilePictureChooserProps = {
  avatar: string;
  photo: string | null;
  onAvatar: (id: string) => void;
  onPhoto: (uri: string | null) => void;
};

export function ProfilePictureChooser({ avatar, photo, onAvatar, onPhoto }: ProfilePictureChooserProps) {
  const t = useT();

  const choosePhoto = async () => {
    try {
      const uri = await pickProfilePhoto();
      if (uri) {
        if (photo) {
          deleteProfilePhoto(photo);
        }
        onPhoto(uri);
      }
    } catch (error) {
      console.error('Photo error:', error);
      Alert.alert(t.editProfile.photoError);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        <Avatar avatar={photo ? { kind: 'photo', uri: photo } : { kind: 'preset', id: avatar }} size={112} ring />
      </View>
      <Card>
        <AvatarPicker
          value={photo ? null : avatar}
          onChange={(id) => {
            onAvatar(id);
            if (photo) {
              deleteProfilePhoto(photo);
              onPhoto(null);
            }
          }}
        />
      </Card>
      <Button label={t.editProfile.choosePhoto} tone="secondary" onPress={choosePhoto} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  preview: {
    alignItems: 'center',
  },
});
