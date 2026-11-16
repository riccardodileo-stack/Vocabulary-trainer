// Calls to the server for accounts, profiles and friends. Every function throws the server's
// error as is: screens turn it into a message with accountProblem() (domain/account.ts).
// The rules (unique nickname, friend codes, requests) are checked by the database functions:
// see supabase/migrations/*_profiles_friends.sql on the `server` branch.

import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import {
  isFriendRequestResult,
  newPhotoPath,
  type FriendEntry,
  type FriendRequestResult,
  type ProfileSearchResult,
  type ServerProfile,
} from '@/domain/account';

import { supabase } from './supabase';

const PHOTO_BUCKET = 'avatars';
/** Photos are sent as 512×512 JPEG (~60 KB): enough for a profile picture, quick to load. */
const PHOTO_SIZE = 512;

/** Public address of a photo saved on the server (for <Avatar>). */
export function photoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Uploads a photo of the phone (already cropped square by the picker) to the user's folder on
 * the server, made smaller first. Returns its path, to save in the profile.
 */
export async function uploadProfilePhoto(userId: string, localUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(localUri);
  context.resize({ width: PHOTO_SIZE, height: PHOTO_SIZE });
  const image = await context.renderAsync();
  const small = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  // The web has no files: the image is read through fetch
  const bytes = Platform.OS === 'web' ? await (await fetch(small.uri)).arrayBuffer() : await new File(small.uri).bytes();

  const path = newPhotoPath(userId);
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Deletes every photo of the user on the server except `keep` (old photos, or all of them). */
export async function deleteOldPhotos(userId: string, keep?: string): Promise<void> {
  const { data } = await supabase.storage.from(PHOTO_BUCKET).list(userId);
  const old = (data ?? []).map((file) => `${userId}/${file.name}`).filter((path) => path !== keep);
  if (old.length > 0) {
    await supabase.storage.from(PHOTO_BUCKET).remove(old);
  }
}

/** Whether a nickname is free. Works before signing in (welcome screen). */
export async function isNicknameFree(nickname: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('nickname_available', { p_nickname: nickname });
  if (error) throw error;
  return data === true;
}

/** Signs in as a guest: an account without email, recognised by its hidden id. */
export async function signInAsGuest(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

/**
 * Sends the 6-digit code by email.
 * - 'signin': sign in, or create the account if the email is new;
 * - 'link': a guest registers: the same account (same id, friends, code) gets this email.
 */
export async function sendEmailCode(email: string, mode: 'signin' | 'link'): Promise<void> {
  const { error } =
    mode === 'signin'
      ? await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
      : await supabase.auth.updateUser({ email });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, code: string, mode: 'signin' | 'link'): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: mode === 'signin' ? 'email' : 'email_change' });
  if (error) throw error;
}

/** The signed-in user's profile, or null if they haven't created it yet. */
export async function fetchMyProfile(userId: string): Promise<ServerProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as ServerProfile | null;
}

/**
 * Creates the profile of the signed-in user. A friend code the app already showed is kept if
 * still free. Avatar: a drawn avatar id; photoPath: a photo already uploaded (or null).
 */
export async function createProfile(
  nickname: string,
  avatar: string | null,
  friendCode?: string,
  photoPath?: string | null
): Promise<ServerProfile> {
  const { data, error } = await supabase.rpc('create_profile', {
    p_nickname: nickname,
    p_avatar: avatar,
    p_friend_code: friendCode ?? null,
    p_photo_path: photoPath ?? null,
  });
  if (error) throw error;
  return data as ServerProfile;
}

/**
 * Changes the profile. undefined = unchanged. avatar: a drawn avatar id. photoPath: a photo
 * already uploaded, or null to remove the photo.
 */
export async function updateServerProfile(changes: {
  nickname?: string;
  avatar?: string;
  photoPath?: string | null;
}): Promise<ServerProfile> {
  const { data, error } = await supabase.rpc('update_profile', {
    p_nickname: changes.nickname ?? null,
    p_avatar: changes.avatar ?? null,
    p_photo_path: changes.photoPath === undefined ? null : (changes.photoPath ?? ''),
  });
  if (error) throw error;
  return data as ServerProfile;
}

export async function fetchFriends(): Promise<FriendEntry[]> {
  const { data, error } = await supabase.rpc('my_friends');
  if (error) throw error;
  return (data ?? []) as FriendEntry[];
}

export async function sendFriendRequest(code: string): Promise<FriendRequestResult> {
  const { data, error } = await supabase.rpc('send_friend_request', { p_code: code });
  if (error) throw error;
  if (!isFriendRequestResult(data)) {
    throw new Error(`Unexpected answer: ${String(data)}`);
  }
  return data;
}

/** Profiles whose nickname starts with the query (at most 10, the exact nickname first). */
export async function searchProfiles(query: string): Promise<ProfileSearchResult[]> {
  const { data, error } = await supabase.rpc('search_profiles', { p_query: query });
  if (error) throw error;
  return (data ?? []) as ProfileSearchResult[];
}

/** Like sendFriendRequest, with the nickname instead of the friend code. */
export async function sendFriendRequestByNick(nickname: string): Promise<FriendRequestResult> {
  const { data, error } = await supabase.rpc('send_friend_request_by_nick', { p_nickname: nickname });
  if (error) throw error;
  if (!isFriendRequestResult(data)) {
    throw new Error(`Unexpected answer: ${String(data)}`);
  }
  return data;
}

export async function respondFriendRequest(fromId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_friend_request', { p_from: fromId, p_accept: accept });
  if (error) throw error;
}

/** Removes a friend, or cancels a request sent to them. */
export async function removeFriend(otherId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friend', { p_other: otherId });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Deletes the account on the server (photos, profile, friendships), then signs out on this phone. */
export async function deleteAccount(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await deleteOldPhotos(data.user.id).catch(() => {});
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
