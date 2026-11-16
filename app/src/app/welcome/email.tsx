// Sign up or sign in with email: the address, then the 6-digit code. An account that already
// has a profile opens the app by itself; a new one goes on to choose the nickname.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { EmailCodeForm } from '@/components/EmailCodeForm';
import { Screen } from '@/components/Screen';
import { useAccountStore } from '@/store/accountStore';

export default function WelcomeEmailScreen() {
  const status = useAccountStore((state) => state.status);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (verified && status === 'needsProfile') {
      router.replace('/welcome/profile');
    }
  }, [verified, status]);

  return (
    <Screen>
      <EmailCodeForm mode="signin" onVerified={() => setVerified(true)} />
    </Screen>
  );
}
