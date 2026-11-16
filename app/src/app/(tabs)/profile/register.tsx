// A guest registers with email: same account (same hidden id), so nick, friend code and friends
// stay. After the code, the account is tied to the email and can be opened on another phone.

import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmailCodeForm } from '@/components/EmailCodeForm';
import { Screen } from '@/components/Screen';
import { useT } from '@/i18n';

export default function RegisterScreen() {
  const t = useT();

  return (
    <>
      <Stack.Screen options={{ title: t.profile.registerTitle, headerLargeTitle: false }} />
      <Screen>
        <AppText color="textMuted">{t.profile.registerHint}</AppText>
        <EmailCodeForm
          mode="link"
          onVerified={() => {
            Alert.alert(t.profile.registeredDone);
            router.back();
          }}
        />
      </Screen>
    </>
  );
}
