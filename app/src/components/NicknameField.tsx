// Nickname input with "@" in front and a live check: shape first (on the phone), then whether
// it's free (on the server, half a second after the last key). The parent gets the result to
// enable its button only when the nickname can be used.

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NICKNAME_MAX_LENGTH, nicknameProblem, normalizeNickname } from '@/domain/profile';
import { useT } from '@/i18n';
import { isNicknameFree } from '@/services/account';
import { fontWeight, radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { TextField } from './TextField';

/** empty | invalid (shape) | checking | free | taken | offline (couldn't ask the server) */
export type NicknameStatus = 'empty' | 'invalid' | 'checking' | 'free' | 'taken' | 'offline';

const CHECK_DELAY_MS = 500;

type NicknameFieldProps = {
  value: string;
  onChange: (nickname: string) => void;
  onStatus: (status: NicknameStatus) => void;
  /** The user's current nickname: it counts as free (it's theirs). */
  current?: string;
};

export function NicknameField({ value, onChange, onStatus, current }: NicknameFieldProps) {
  const t = useT();
  const { colors } = useTheme();
  const problem = value ? nicknameProblem(value) : null;
  const [status, setStatus] = useState<NicknameStatus>('empty');

  useEffect(() => {
    const report = (next: NicknameStatus) => {
      setStatus(next);
      onStatus(next);
    };
    if (!value) {
      report('empty');
      return;
    }
    if (problem) {
      report('invalid');
      return;
    }
    if (value === current) {
      report('free');
      return;
    }
    report('checking');
    let cancelled = false;
    const timer = setTimeout(() => {
      isNicknameFree(value)
        .then((free) => !cancelled && report(free ? 'free' : 'taken'))
        .catch(() => !cancelled && report('offline'));
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // onStatus is a callback of the parent: the check depends only on the text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, problem, current]);

  const message =
    status === 'invalid' && problem
      ? { text: t.editProfile.nicknameErrors[problem], color: 'danger' as const }
      : status === 'checking'
        ? { text: t.account.nickChecking, color: 'textMuted' as const }
        : status === 'free' && value !== current
          ? { text: t.account.nickFree, color: 'primary' as const }
          : status === 'taken'
            ? { text: t.account.nickTaken, color: 'danger' as const }
            : status === 'offline'
              ? { text: t.account.nickOffline, color: 'warning' as const }
              : null;

  return (
    <View style={styles.container}>
      <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AppText color="textMuted" style={styles.at} accessible={false}>
          @
        </AppText>
        <TextField
          value={value}
          // Shown already normalized: lower case, no "@", no spaces
          onChangeText={(text) => onChange(normalizeNickname(text).replace(/\s/g, ''))}
          placeholder={t.editProfile.nicknamePlaceholder}
          accessibilityLabel={t.profile.nickname}
          maxLength={NICKNAME_MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          style={styles.input}
        />
      </View>
      {message ? (
        <AppText variant="small" color={message.color} accessibilityLiveRegion="polite">
          {message.text}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  at: {
    fontWeight: fontWeight.bold,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: spacing.xs,
  },
});
