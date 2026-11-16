// Email login with a 6-digit code, in two steps on the same screen: the email, then the code
// that arrives by email. No password and no links (links back to the app are fragile).
// - mode 'signin': signs in, or creates the account when the email is new;
// - mode 'link':   a guest registers: the same account (same id, nick, friends) gets the email.

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { accountProblem, normalizeEmailCode } from '@/domain/account';
import { isValidEmail } from '@/domain/profile';
import { useT } from '@/i18n';
import { sendEmailCode, verifyEmailCode } from '@/services/account';
import { fontSize, spacing } from '@/theme';

import { Appear } from './Appear';
import { AppText } from './AppText';
import { Button } from './Button';
import { Section } from './Section';
import { TextField } from './TextField';

/** Seconds before another code can be asked (Supabase also limits how often). */
const RESEND_AFTER_S = 60;

type EmailCodeFormProps = {
  mode: 'signin' | 'link';
  /** Called once the code is right: the session changes by itself. */
  onVerified: () => void;
};

export function EmailCodeForm({ mode, onVerified }: EmailCodeFormProps) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  // Countdown before "send another code"
  useEffect(() => {
    if (wait <= 0) {
      return;
    }
    const timer = setTimeout(() => setWait((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = async (address: string) => {
    if (!isValidEmail(address)) {
      setError(t.account.problems.invalidEmail);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(address, mode);
      setSentTo(address);
      setCode('');
      setWait(RESEND_AFTER_S);
    } catch (sendError) {
      setError(t.account.problems[accountProblem(sendError)]);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!sentTo) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyEmailCode(sentTo, code, mode);
      onVerified();
    } catch (verifyError) {
      setError(t.account.problems[accountProblem(verifyError)]);
    } finally {
      setBusy(false);
    }
  };

  if (!sentTo) {
    return (
      <Section title={t.account.emailTitle} hint={t.account.emailHint}>
        <TextField
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          placeholder={t.editProfile.emailPlaceholder}
          accessibilityLabel={t.account.emailTitle}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={() => send(email.trim())}
        />
        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button label={t.account.sendCode} onPress={() => send(email.trim())} disabled={busy || !email.trim()} />
      </Section>
    );
  }

  return (
    <Appear from="right">
      <Section title={t.account.codeTitle} hint={t.account.codeHint(sentTo)}>
        <TextField
          value={code}
          onChangeText={(text) => {
            setCode(normalizeEmailCode(text));
            setError(null);
          }}
          placeholder={t.account.codePlaceholder}
          accessibilityLabel={t.account.codeTitle}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          style={styles.code}
        />
        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button label={t.account.verify} onPress={verify} disabled={busy || code.length !== 6} />
        <View style={styles.actions}>
          {wait > 0 ? (
            <AppText variant="small" color="textMuted">
              {t.account.resendIn(wait)}
            </AppText>
          ) : (
            <Button label={t.account.resend} tone="secondary" size="sm" onPress={() => send(sentTo)} disabled={busy} />
          )}
          <Button
            label={t.account.changeEmail}
            tone="secondary"
            size="sm"
            onPress={() => {
              setSentTo(null);
              setError(null);
            }}
          />
        </View>
      </Section>
    </Appear>
  );
}

const styles = StyleSheet.create({
  code: {
    fontSize: fontSize.hero,
    letterSpacing: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
