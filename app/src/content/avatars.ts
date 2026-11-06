// Avatars the user can choose in the profile: 6 women and 6 men with different
// skin tones, hair, ages and accessories. They are illustrations drawn in code
// (sources and generator in design/avatars), rendered to PNG in assets/avatars.
// To add one, append a row: the id is saved in the profile, so never change it.

export type AvatarPreset = {
  id: string;
  /** require() of the PNG (a number for the bundler). */
  image: number;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'woman-1', image: require('../../assets/avatars/woman-1.png') },
  { id: 'man-1', image: require('../../assets/avatars/man-1.png') },
  { id: 'woman-2', image: require('../../assets/avatars/woman-2.png') },
  { id: 'man-2', image: require('../../assets/avatars/man-2.png') },
  { id: 'woman-3', image: require('../../assets/avatars/woman-3.png') },
  { id: 'man-3', image: require('../../assets/avatars/man-3.png') },
  { id: 'woman-4', image: require('../../assets/avatars/woman-4.png') },
  { id: 'man-4', image: require('../../assets/avatars/man-4.png') },
  { id: 'woman-5', image: require('../../assets/avatars/woman-5.png') },
  { id: 'man-5', image: require('../../assets/avatars/man-5.png') },
  { id: 'woman-6', image: require('../../assets/avatars/woman-6.png') },
  { id: 'man-6', image: require('../../assets/avatars/man-6.png') },
];

export function isAvatarId(id: string): boolean {
  return AVATAR_PRESETS.some((preset) => preset.id === id);
}

/** A random avatar for new profiles (and for old ones whose avatar no longer exists). */
export function randomAvatarId(): string {
  return AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].id;
}

export function avatarPreset(id: string): AvatarPreset {
  return AVATAR_PRESETS.find((preset) => preset.id === id) ?? AVATAR_PRESETS[0];
}
