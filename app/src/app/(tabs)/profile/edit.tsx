// Edit the profile: picture (avatar or photo), name and nick.
// The friend code is not here: it never changes. The email is the account's (Profile -> Account).
// Changes are kept in a draft and saved only with "Save": nick and picture (drawn avatar or
// photo, uploaded) on the server, where friends see them (the nick must be free); the name only
// on this phone.

import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SelectableCircle } from '@/components/SelectableCircle';
import { TextField } from '@/components/TextField';
import { AVATAR_PRESETS } from '@/content/avatars';
import { NicknameField, type NicknameStatus } from '@/components/NicknameField';
import { accountProblem } from '@/domain/account';
import { useT } from '@/i18n';
import { deleteOldPhotos, updateServerProfile, uploadProfilePhoto } from '@/services/account';
import { deleteProfilePhoto, pickProfilePhoto } from '@/services/profilePhoto';
import { useProfileStore, type ProfileAvatar } from '@/store/profileStore';
import { spacing } from '@/theme';

const NAME_MAX_LENGTH = 30;

function sameAvatar(a: ProfileAvatar, b: ProfileAvatar): boolean {
  return a.kind === 'preset' ? b.kind === 'preset' && a.id === b.id : b.kind === 'photo' && a.uri === b.uri;
}

export default function EditProfileScreen() {
  const t = useT();
  const profile = useProfileStore();

  const [avatar, setAvatar] = useState<ProfileAvatar>(profile.avatar);
  const [name, setName] = useState(profile.name);
  const [nickname, setNickname] = useState(profile.nickname);
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosePhoto = async () => {
    try {
      const uri = await pickProfilePhoto();
      if (uri) {
        // A photo picked before in this same edit and then replaced is not needed anymore
        if (avatar.kind === 'photo' && !sameAvatar(avatar, profile.avatar)) {
          deleteProfilePhoto(avatar.uri);
        }
        setAvatar({ kind: 'photo', uri });
      }
    } catch (pickError) {
      console.error('Photo error:', pickError);
      Alert.alert(t.editProfile.photoError);
    }
  };

  const save = async () => {
    const nicknameChanged = nickname !== profile.nickname;
    const avatarChanged = !sameAvatar(avatar, profile.avatar);

    setSaving(true);
    setError(null);
    try {
      // Nick and picture live on the server: saved there first (the nick must be free)
      if ((nicknameChanged || avatarChanged) && profile.userId) {
        const changes: Parameters<typeof updateServerProfile>[0] = {};
        if (nicknameChanged) {
          changes.nickname = nickname;
        }
        if (avatarChanged && avatar.kind === 'photo') {
          // A new photo: uploaded to the user's folder, then set in the profile
          changes.photoPath = await uploadProfilePhoto(profile.userId, avatar.uri);
        } else if (avatarChanged && avatar.kind === 'preset') {
          changes.avatar = avatar.id;
          changes.photoPath = null;
        }
        const saved = await updateServerProfile(changes);
        // The local copy of the picture first, so the photo shows from the phone (also offline)
        useProfileStore.setState({ avatar, photoPath: saved.photo_path });
        useProfileStore.getState().applyServerProfile(saved, { isGuest: profile.isGuest, email: profile.email });
        if (avatarChanged) {
          deleteOldPhotos(profile.userId, saved.photo_path ?? undefined).catch(() => {});
        }
      }
    } catch (saveError) {
      setError(t.account.problems[accountProblem(saveError)]);
      setSaving(false);
      return;
    }

    // The old photo file is deleted once it is no longer the profile picture
    if (profile.avatar.kind === 'photo' && !sameAvatar(profile.avatar, avatar)) {
      deleteProfilePhoto(profile.avatar.uri);
    }
    useProfileStore.getState().updateProfile({ avatar, name: name.trim() });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t.editProfile.title, headerLargeTitle: false }} />

      <Screen>
        <View style={styles.preview}>
          <Avatar avatar={avatar} size={120} ring />
        </View>

        <Section title={t.editProfile.picture}>
          <Card>
            <View style={styles.grid}>
              {AVATAR_PRESETS.map((preset, index) => {
                const option: ProfileAvatar = { kind: 'preset', id: preset.id };
                const selected = sameAvatar(option, avatar);

                return (
                  <SelectableCircle
                    key={preset.id}
                    selected={selected}
                    onPress={() => setAvatar(option)}
                    accessibilityLabel={t.editProfile.avatarLabel(index + 1)}>
                    <Avatar avatar={option} size={56} />
                  </SelectableCircle>
                );
              })}
            </View>
          </Card>
          <Button label={t.editProfile.choosePhoto} tone="secondary" onPress={choosePhoto} />
          {avatar.kind === 'photo' ? (
            <Button
              label={t.editProfile.removePhoto}
              tone="danger"
              onPress={() => setAvatar({ kind: 'preset', id: AVATAR_PRESETS[0].id })}
            />
          ) : null}
        </Section>

        <Section title={t.profile.name} hint={t.editProfile.nameHint}>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder={t.editProfile.namePlaceholder}
            accessibilityLabel={t.profile.name}
            maxLength={NAME_MAX_LENGTH}
            autoCorrect={false}
            textContentType="name"
          />
        </Section>

        <Section title={t.profile.nickname} hint={t.editProfile.nicknameHint}>
          <NicknameField value={nickname} onChange={setNickname} onStatus={setNicknameStatus} current={profile.nickname} />
        </Section>

        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button label={t.common.save} onPress={save} disabled={saving || nicknameStatus !== 'free'} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },



});
