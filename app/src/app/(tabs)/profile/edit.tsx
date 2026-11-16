// Edit the profile: picture (avatar or photo), name and nick.
// The friend code is not here: it never changes. The email is the account's (Profile -> Account).
// Changes are kept in a draft and saved only with "Save": nick and drawn avatar on the server
// (the nick must be free), name and photo only on this phone.

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
import { updateServerProfile } from '@/services/account';
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
    const serverAvatar = avatar.kind === 'preset' ? avatar.id : null;
    const oldServerAvatar = profile.avatar.kind === 'preset' ? profile.avatar.id : null;
    const nicknameChanged = nickname !== profile.nickname;

    setSaving(true);
    setError(null);
    try {
      // Nick and drawn avatar live on the server: saved there first (the nick must be free)
      if (nicknameChanged || serverAvatar !== oldServerAvatar) {
        const saved = await updateServerProfile({
          nickname: nicknameChanged ? nickname : undefined,
          avatar: serverAvatar,
        });
        useProfileStore.getState().applyServerProfile(saved, { isGuest: profile.isGuest, email: profile.email });
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
