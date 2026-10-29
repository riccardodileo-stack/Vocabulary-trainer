import type { ComponentRef, Ref } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { fontSize, radius, spacing, useTheme } from '@/theme';

export type TextFieldRef = ComponentRef<typeof TextInput>;

type TextFieldProps = Omit<TextInputProps, 'ref'> & { ref?: Ref<TextFieldRef> };

/** Text input with the app colors. Use it instead of <TextInput>. */
export function TextField({ ref, style, multiline, ...rest }: TextFieldProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      ref={ref}
      multiline={multiline}
      placeholderTextColor={colors.textMuted}
      style={[
        styles.input,
        multiline && styles.multiline,
        { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
