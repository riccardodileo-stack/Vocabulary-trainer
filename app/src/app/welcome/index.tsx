// First screen without an account: sign up / sign in with email, or continue as a guest.
// A user signed in without a profile yet (new email account) goes straight to the nickname.

import { Image } from 'expo-image';
import { GorichecoPose } from '@/components/goricheco/GorichecoPose';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useT } from '@/i18n';
import { useAccountStore } from '@/store/accountStore';
import { spacing } from '@/theme';

export default function WelcomeScreen() {
  const t = useT();
  const status = useAccountStore((state) => state.status);

  if (status === 'needsProfile') {
    return <Redirect href="/welcome/profile" />;
  }

  return (
    <Screen trackViewport contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <GorichecoPose scene="welcome" style={styles.mascot} />
        <AppText variant="hero" accessibilityRole="header" style={styles.centered}>
          {t.welcome.title}
        </AppText>
        <AppText color="textMuted" style={styles.centered}>
          {t.welcome.subtitle}
        </AppText>
      </View>

      <Card style={styles.choice}>
        <Button label={`✉️ ${t.welcome.register}`} onPress={() => router.push('/welcome/email')} />
        <AppText variant="small" color="textMuted">
          {t.welcome.registerHint}
        </AppText>
      </Card>

      <Card style={styles.choice}>
        <Button label={`🙂 ${t.welcome.guest}`} tone="secondary" onPress={() => router.push('/welcome/guest')} />
        <AppText variant="small" color="textMuted">
          {t.welcome.guestHint}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingTop: spacing.xxl * 2,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mascot: {
    width: 200,
    aspectRatio: 3 / 2,
  },
  centered: {
    textAlign: 'center',
  },
  choice: {
    gap: spacing.sm,
  },
});
