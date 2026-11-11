// Edit the profile: picture (avatar or photo), name, nick and email.
// The friend code is not here: it never changes.
// Changes are kept in a draft and saved only with "Save".

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
import { isValidEmail, NICKNAME_MAX_LENGTH, nicknameProblem, normalizeNickname } from '@/domain/profile';
import { useT } from '@/i18n';
import { deleteProfilePhoto, pickProfilePhoto } from '@/services/profilePhoto';
import { useProfileStore, type ProfileAvatar } from '@/store/profileStore';
import { fontWeight, radius, spacing, useTheme } from '@/theme';

const NAME_MAX_LENGTH = 30;

function sameAvatar(a: ProfileAvatar, b: ProfileAvatar): boolean {
  return a.kind === 'preset' ? b.kind === 'preset' && a.id === b.id : b.kind === 'photo' && a.uri === b.uri;
}

export default function EditProfileScreen() {
  const t = useT();
  const { colors } = useTheme();
  const profile = useProfileStore();

  const [avatar, setAvatar] = useState<ProfileAvatar>(profile.avatar);
  const [name, setName] = useState(profile.name);
  const [nickname, setNickname] = useState(profile.nickname);
  const [email, setEmail] = useState(profile.email);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

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

  const save = () => {
    const cleanEmail = email.trim();
    // The nick is optional for now; when written it must be valid
    const problem = nickname ? nicknameProblem(nickname) : null;

    setNicknameError(problem ? t.editProfile.nicknameErrors[problem] : null);
    setEmailError(cleanEmail && !isValidEmail(cleanEmail) ? t.editProfile.errorEmail : null);
    if (problem || (cleanEmail && !isValidEmail(cleanEmail))) {
      return;
    }

    // The old photo file is deleted once it is no longer the profile picture
    if (profile.avatar.kind === 'photo' && !sameAvatar(profile.avatar, avatar)) {
      deleteProfilePhoto(profile.avatar.uri);
    }

    profile.updateProfile({ avatar, name: name.trim(), nickname, email: cleanEmail });
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
          <View style={[styles.nickField, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppText color="textMuted" style={styles.at} accessible={false}>
              @
            </AppText>
            <TextField
              value={nickname}
              // Shown already normalized: lower case, no "@", no spaces
              onChangeText={(text) => {
                setNickname(normalizeNickname(text).replace(/\s/g, ''));
                setNicknameError(null);
              }}
              placeholder={t.editProfile.nicknamePlaceholder}
              accessibilityLabel={t.profile.nickname}
              maxLength={NICKNAME_MAX_LENGTH}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              style={styles.nickInput}
            />
          </View>
          {nicknameError ? <AppText color="danger">{nicknameError}</AppText> : null}
        </Section>

        <Section title={t.profile.email}>
          <TextField
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError(null);
            }}
            placeholder={t.editProfile.emailPlaceholder}
            accessibilityLabel={t.profile.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          {emailError ? <AppText color="danger">{emailError}</AppText> : null}
        </Section>

        <Button label={t.common.save} onPress={save} />
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
  nickField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  at: {
    fontWeight: fontWeight.bold,
  },
  nickInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: spacing.xs,
  },
});
