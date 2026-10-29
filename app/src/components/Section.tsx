import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';

type SectionProps = ViewProps & {
  title: string;
  hint?: string;
};

/** A titled group of content, e.g. a block in the settings screen. */
export function Section({ title, hint, children, style, ...rest }: SectionProps) {
  return (
    <View style={[styles.section, style]} {...rest}>
      <AppText variant="caption" color="textMuted" style={styles.title}>
        {title.toUpperCase()}
      </AppText>
      {children}
      {hint ? (
        <AppText variant="small" color="textMuted" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    marginLeft: spacing.xs,
  },
  hint: {
    marginLeft: spacing.xs,
  },
});
