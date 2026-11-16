// The 12 drawn avatars in a grid; the chosen one has a ring.

import { StyleSheet, View } from 'react-native';

import { AVATAR_PRESETS } from '@/content/avatars';
import { useT } from '@/i18n';
import { spacing } from '@/theme';

import { Avatar } from './Avatar';
import { SelectableCircle } from './SelectableCircle';

type AvatarPickerProps = {
  /** Id of the chosen avatar (null: none of the drawn ones, e.g. a photo). */
  value: string | null;
  onChange: (id: string) => void;
  size?: number;
};

export function AvatarPicker({ value, onChange, size = 56 }: AvatarPickerProps) {
  const t = useT();
  return (
    <View style={styles.grid}>
      {AVATAR_PRESETS.map((preset, index) => (
        <SelectableCircle
          key={preset.id}
          selected={preset.id === value}
          onPress={() => onChange(preset.id)}
          accessibilityLabel={t.editProfile.avatarLabel(index + 1)}>
          <Avatar avatar={{ kind: 'preset', id: preset.id }} size={size} />
        </SelectableCircle>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
