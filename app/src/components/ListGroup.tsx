// Grouped list of rows (iOS settings style): icon, label, and on the right a value,
// a switch or a chevron. Used by the settings and the profile.

import { Children, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { iconSize, radius, spacing, touchTarget, useTheme } from '@/theme';

import { AppText } from './AppText';

export function ListGroup({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {rows.map((row, index) => (
        <View
          key={row.key ?? index}
          style={index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }}>
          {row}
        </View>
      ))}
    </View>
  );
}

type ListRowProps = {
  icon?: string;
  label: string;
  /** Small text under the label. */
  hint?: string;
  /** Text on the right, e.g. the current value. */
  value?: string;
  /** Tappable row with a chevron. */
  onPress?: () => void;
  /** A switch on the right instead of value/chevron. */
  toggle?: { value: boolean; onChange: (value: boolean) => void };
};

export function ListRow({ icon, label, hint, value, onPress, toggle }: ListRowProps) {
  const { colors } = useTheme();

  const content = (
    <>
      {icon ? (
        <AppText style={styles.icon} accessible={false}>
          {icon}
        </AppText>
      ) : null}
      <View style={styles.texts}>
        <AppText>{label}</AppText>
        {hint ? (
          <AppText variant="small" color="textMuted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText color="textMuted" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: colors.primary, false: colors.track }}
          accessibilityLabel={label}
        />
      ) : null}
      {onPress && !toggle ? (
        <AppText color="textMuted" accessible={false}>
          ›
        </AppText>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : label}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardMuted }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  group: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  icon: {
    fontSize: iconSize.md,
    width: iconSize.md + 6,
    textAlign: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: '50%',
  },
});
