import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import type { LanguagePair } from '@/domain/languages';
import { useT } from '@/i18n';
import { iconSize, radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

export function HomeAddWordCard({ pair }: { pair: LanguagePair }) {
  const t = useT();
  const { colors } = useTheme();
  const source = t.languages[pair.source];
  const target = t.languages[pair.target];

  return (
    <View style={[styles.card, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.words.add}. ${t.common.languagePair(source, target)}`}
        onPress={() => router.push('/add-word')}
        style={({ pressed }) => [
          styles.header,
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
        ]}>
        <View pointerEvents="none" style={[styles.ring, { borderColor: colors.onPrimary }]} />

        <View style={[styles.icon, { backgroundColor: colors.onPrimary }]}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={iconSize.lg}
            tintColor={colors.primary}
            accessible={false}
          />
        </View>

        <View style={styles.copy}>
          <AppText variant="title" color="onPrimary">{t.words.add}</AppText>
          <AppText variant="small" color="onPrimary">{source} → {target}</AppText>
        </View>

        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          size={iconSize.md}
          tintColor={colors.onPrimary}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    minHeight: spacing.xxl * 3,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    right: -spacing.xxl * 2,
    bottom: -spacing.xxl * 3,
    width: spacing.xxl * 6,
    height: spacing.xxl * 6,
    borderRadius: radius.pill,
    borderWidth: spacing.lg,
    opacity: 0.08,
  },
  icon: {
    width: touchTarget + spacing.xs,
    height: touchTarget + spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});