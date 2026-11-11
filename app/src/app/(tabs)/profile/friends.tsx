// Add friends. Searching works once accounts exist (server); below, the user's
// own friend code, ready to share. The code never changes.

import { Stack } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { TextField } from '@/components/TextField';
import { useT } from '@/i18n';
import { useProfileStore } from '@/store/profileStore';
import { fontSize, fontWeight, radius, spacing, useTheme } from '@/theme';

export default function AddFriendsScreen() {
  const t = useT();
  const { colors } = useTheme();
  const friendCode = useProfileStore((state) => state.friendCode);
  const nickname = useProfileStore((state) => state.nickname);
  const [query, setQuery] = useState('');

  const shareCode = () => {
    Share.share({ message: t.friends.shareMessage(friendCode) }).catch((error) => console.warn('Share error:', error));
  };

  return (
    <>
      <Stack.Screen options={{ title: t.friends.title, headerLargeTitle: false }} />

      <Screen>
        <Section title={t.friends.findTitle}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder={t.friends.findPlaceholder}
            accessibilityLabel={t.friends.findPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* Disabled until the server exists: there is nobody to search yet */}
          <Button label={t.friends.find} disabled onPress={() => {}} />
          <View style={styles.soon}>
            <Pill label={t.common.comingSoon} />
            <AppText variant="small" color="textMuted" style={styles.flex}>
              {t.friends.findSoon}
            </AppText>
          </View>
        </Section>

        <Section title={t.friends.yourCode} hint={t.friends.yourCodeHint}>
          <Card style={styles.codeCard}>
            <View
              style={[styles.codeBox, { backgroundColor: colors.primarySoft, borderColor: colors.accent }]}
              accessible
              accessibilityLabel={t.friends.codeAccessibility(friendCode)}>
              <AppText style={styles.code} color="primaryStrong" selectable>
                {friendCode}
              </AppText>
            </View>
            {nickname ? (
              <AppText color="textMuted">@{nickname}</AppText>
            ) : null}
            <Button label={`📤 ${t.friends.share}`} onPress={shareCode} />
          </Card>
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  soon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  codeCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  codeBox: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  code: {
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero + 8,
    fontWeight: fontWeight.heavy,
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
});
