import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import type { LanguagePair } from '@/domain/languages';
import { belongsToPair, hasSameTerm, type NewWordInput } from '@/domain/word';
import { useT } from '@/i18n';
import { useWordStore } from '@/store/wordStore';
import { iconSize, motion, radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';
import { WordForm } from './WordForm';

type FormState = 'idle' | 'open' | 'collapsed';

const CARD_TRANSITION = LinearTransition.duration(motion.fast);

export function HomeAddWordCard({ pair }: { pair: LanguagePair }) {
  const t = useT();
  const { colors } = useTheme();
  const [formState, setFormState] = useState<FormState>('idle');
  const open = formState === 'open';
  const source = t.languages[pair.source];
  const target = t.languages[pair.target];

  function toggleForm() {
    if (open) {
      Keyboard.dismiss();
    }
    setFormState(open ? 'collapsed' : 'open');
  }

  function saveWord(input: NewWordInput): string | null {
    const { words, addWord } = useWordStore.getState();
    if (words.some((word) => belongsToPair(word, pair) && hasSameTerm(word, input.term))) {
      return t.wordForm.errorDuplicate;
    }

    addWord(pair, input);
    Keyboard.dismiss();
    setFormState('idle');
    return null;
  }

  return (
    <Animated.View
      layout={CARD_TRANSITION}
      style={[styles.card, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.words.add}. ${t.common.languagePair(source, target)}`}
        aria-expanded={open}
        onPress={toggleForm}
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
          style={open ? styles.chevronOpen : undefined}
        />
      </Pressable>

      {formState !== 'idle' ? (
        <View style={[styles.form, !open && styles.hidden]}>
          <WordForm pair={pair} autoFocus={false} onSave={saveWord} />
        </View>
      ) : null}
    </Animated.View>
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
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hidden: {
    display: 'none',
  },
});