import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { avatarPreset } from '@/content/avatars';
import type { ProfileAvatar } from '@/store/profileStore';
import { motion, radius, useTheme } from '@/theme';

/** Cross-fade when the picture changes (e.g. picking another avatar). */
const AVATAR_FADE = motion.fast;

type AvatarProps = {
  avatar: ProfileAvatar;
  /** Diameter in points. */
  size: number;
  /** Colored ring around the picture (e.g. the selected avatar, the profile header). */
  ring?: boolean;
};

/** Round profile picture: one of the drawn avatars or a photo. */
export function Avatar({ avatar, size, ring = false }: AvatarProps) {
  const { colors } = useTheme();
  const ringWidth = ring ? Math.max(2, Math.round(size / 28)) : 0;
  const inner = size - ringWidth * 4;

  return (
    <View
      accessibilityIgnoresInvertColors
      style={[
        styles.ring,
        { width: size, height: size, borderWidth: ringWidth, borderColor: ring ? colors.accent : 'transparent' },
      ]}>
      {avatar.kind === 'photo' ? (
        <Image source={{ uri: avatar.uri }} style={[styles.circle, { width: inner, height: inner }]} contentFit="cover" transition={AVATAR_FADE} />
      ) : (
        <Image
          source={avatarPreset(avatar.id).image}
          style={[styles.circle, { width: inner, height: inner }]}
          transition={AVATAR_FADE}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
