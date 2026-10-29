import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { dictionariesFor } from '@/domain/dictionaries';
import type { LanguagePair } from '@/domain/languages';
import { spacing, useTheme } from '@/theme';

import { Button } from './Button';

type DictionaryLinksProps = {
  pair: LanguagePair;
  term: string;
};

/** One button per dictionary; the page opens in a browser inside the app. */
export function DictionaryLinks({ pair, term }: DictionaryLinksProps) {
  const { colors } = useTheme();

  if (!term.trim()) {
    return null;
  }

  return (
    <View style={styles.row}>
      {dictionariesFor(pair, term.trim()).map((dictionary) => (
        <View key={dictionary.name} style={styles.item}>
          <Button
            label={`📖 ${dictionary.name}`}
            tone="secondary"
            onPress={() => WebBrowser.openBrowserAsync(dictionary.url, { controlsColor: colors.primary })}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  item: {
    flex: 1,
  },
});
