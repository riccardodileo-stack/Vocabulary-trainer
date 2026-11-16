// Continue as a guest: choose nickname and avatar. The server creates an account without email
// (its hidden id is the key of the user) and the profile with a unique friend code.
// What the user already had on this phone (nick, avatar, friend code) is offered again.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { NicknameField, type NicknameStatus } from '@/components/NicknameField';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { randomAvatarId } from '@/content/avatars';
import { accountProblem } from '@/domain/account';
import { finishProfile } from '@/hooks/useAccountSession';
import { useT } from '@/i18n';
import { signInAsGuest } from '@/services/account';
import { supabase } from '@/services/supabase';
import { useProfileStore } from '@/store/profileStore';
import { spacing } from '@/theme';

export default function WelcomeGuestScreen() {
  const t = useT();
  const local = useProfileStore();
  const [nickname, setNickname] = useState(local.nickname);
  const [avatar, setAvatar] = useState(local.avatar.kind === 'preset' ? local.avatar.id : randomAvatarId());
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('empty');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      // A guest account created a moment ago (e.g. the nick was taken) is used again
      if (!data.session) {
        await signInAsGuest();
      }
      await finishProfile(nickname, avatar);
    } catch (startError) {
      setError(t.account.problems[accountProblem(startError)]);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Section title={t.welcome.nicknameTitle} hint={t.welcome.nicknameHint}>
        <NicknameField value={nickname} onChange={setNickname} onStatus={setNicknameStatus} />
      </Section>

      <Section title={t.welcome.avatarTitle}>
        <Card>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </Card>
      </Section>

      <View style={styles.footer}>
        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button label={t.welcome.start} onPress={start} disabled={busy || nicknameStatus !== 'free'} />
        <AppText variant="small" color="textMuted">
          {t.welcome.guestHint}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
});
