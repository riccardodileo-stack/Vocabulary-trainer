// Short sounds of the quiz. The files are in assets/sounds (synthesized tones,
// no licence needed): replace them there to change the sounds.
//
// Sounds follow the phone's silent switch and mix with music already playing,
// and they are skipped when the user turns them off in the settings.
//
// Why it is built like this (sounds used to be late or missing now and then):
// - the audio session stays active while a quiz is open (keepAudioSessionActive). Before, iOS
//   switched it off after every sound and on again at the next one: the start of the next
//   sound was late or cut;
// - every sound is rewound as soon as it ends, so play() always starts from the beginning
//   at once. Before, the rewind was asked right before play() without waiting for it, and
//   on iOS a player still at its end plays nothing;
// - two players per sound: a sound asked again while the first is still playing (two
//   quick answers) uses the second one instead of being lost.

import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

import { useSettingsStore } from '@/store/settingsStore';

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  finish: require('../../assets/sounds/finish.wav'),
};

export type SoundName = keyof typeof SOURCES;

/** Players per sound: enough for a sound asked again while it is still playing. */
const PLAYERS_PER_SOUND = 2;

type Voice = {
  player: AudioPlayer;
  /** At the beginning and ready to play right away. */
  ready: boolean;
  /** When it was last started: if every player is busy, the oldest one is restarted. */
  startedAt: number;
};

const voices: Partial<Record<SoundName, Voice[]>> = {};
let audioModeSet = false;

/** Back to the beginning, exactly (no tolerance), then ready. */
function rewind(voice: Voice): Promise<void> {
  voice.ready = false;
  return voice.player
    .seekTo(0, 0, 0)
    .then(() => {
      voice.ready = true;
    })
    .catch(() => {});
}

function createVoice(name: SoundName): Voice {
  const player = createAudioPlayer(SOURCES[name], { keepAudioSessionActive: true });
  const voice: Voice = { player, ready: true, startedAt: 0 };
  // Rewound as soon as it ends, so the next play() doesn't have to wait for it
  player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (status.didJustFinish) {
      rewind(voice);
    }
  });
  return voice;
}

function voicesFor(name: SoundName): Voice[] {
  let list = voices[name];
  if (!list) {
    list = Array.from({ length: PLAYERS_PER_SOUND }, () => createVoice(name));
    voices[name] = list;
  }
  return list;
}

/**
 * Loads the sounds and switches the audio session on, so the first sound isn't late.
 * Call it when a screen that plays sounds opens, and releaseSounds() when it closes.
 */
export function preloadSounds() {
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch((error) =>
        console.warn('Audio mode error:', error)
      );
    }
    setIsAudioActiveAsync(true).catch(() => {});
    (Object.keys(SOURCES) as SoundName[]).forEach(voicesFor);
  } catch (error) {
    console.warn('Sound preload error:', error);
  }
}

/** Switches the audio session off (the players stay loaded for the next quiz). */
export function releaseSounds() {
  setIsAudioActiveAsync(false).catch(() => {});
}

/** For a screen's useEffect: loads the sounds when it opens, releases the session when it closes. */
export function soundsForScreen() {
  preloadSounds();
  return releaseSounds;
}

function start(voice: Voice) {
  voice.ready = false;
  voice.startedAt = Date.now();
  voice.player.play();
}

export function playSound(name: SoundName) {
  if (!useSettingsStore.getState().soundsEnabled) {
    return;
  }

  try {
    preloadSounds();
    const list = voicesFor(name);
    // 1. a player at the beginning: starts at once
    const ready = list.find((voice) => voice.ready && !voice.player.playing);
    if (ready) {
      start(ready);
      return;
    }
    // 2. otherwise a free one (or the one started longest ago): rewound first, then played.
    //    Waiting for the rewind takes a few milliseconds; not waiting could play nothing.
    const voice =
      list.find((candidate) => !candidate.player.playing) ?? [...list].sort((a, b) => a.startedAt - b.startedAt)[0];
    voice.player.pause();
    voice.startedAt = Date.now();
    rewind(voice).then(() => start(voice));
  } catch (error) {
    // A missing sound must never break the quiz
    console.warn('Sound error:', error);
  }
}
