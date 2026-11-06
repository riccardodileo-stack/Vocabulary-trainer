// Short sounds of the quiz. The files are in assets/sounds (synthesized tones,
// no licence needed): replace them there to change the sounds.
//
// Sounds follow the phone's silent switch and mix with music already playing,
// and they are skipped when the user turns them off in the settings.
//
// Latency: loading a sound and setting the audio session take a moment, so
// preloadSounds() does it when a quiz opens; playSound() then starts at once
// (it never waits for anything before calling play()).

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@/store/settingsStore';

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  finish: require('../../assets/sounds/finish.wav'),
};

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let audioModeSet = false;

function playerFor(name: SoundName): AudioPlayer {
  let player = players[name];
  if (!player) {
    player = createAudioPlayer(SOURCES[name]);
    players[name] = player;
  }
  return player;
}

/** Loads the sounds and prepares the audio session. Call when a screen that plays them opens. */
export function preloadSounds() {
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch((error) =>
        console.warn('Audio mode error:', error)
      );
    }
    (Object.keys(SOURCES) as SoundName[]).forEach(playerFor);
  } catch (error) {
    console.warn('Sound preload error:', error);
  }
}

export function playSound(name: SoundName) {
  if (!useSettingsStore.getState().soundsEnabled) {
    return;
  }

  try {
    preloadSounds();
    const player = playerFor(name);
    // A sound played before is at its end: rewind it. Not awaited on purpose:
    // the seek is applied before playback starts, and waiting would add a delay.
    if (player.currentTime > 0) {
      player.seekTo(0).catch(() => {});
    }
    player.play();
  } catch (error) {
    // A missing sound must never break the quiz
    console.warn('Sound error:', error);
  }
}
