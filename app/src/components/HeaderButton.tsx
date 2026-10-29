import { Pressable } from 'react-native';

import { AppText } from './AppText';

type HeaderButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Text button for the right side of a navigation header ("+", "Done", ...). */
export function HeaderButton({ label, onPress, accessibilityLabel }: HeaderButtonProps) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <AppText variant="bodyBold" color="primary" style={label.length === 1 && { fontSize: 26 }}>
        {label}
      </AppText>
    </Pressable>
  );
}
