// Last step for a new email account: choose nickname and avatar (the profile doesn't exist yet).

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
import { signOut } from '@/services/account';
import { useProfileStore } from '@/store/profileStore';
import { spacing } from '@/theme';

export default function WelcomeProfileScreen() {
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
      await finishProfile(nickname, avatar);
    } catch (startError) {
      setError(t.account.problems[accountProblem(startError)]);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText color="textMuted">{t.welcome.profileSubtitle}</AppText>

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
        <Button label={t.welcome.signOut} tone="secondary" onPress={() => signOut().catch(() => {})} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
});
