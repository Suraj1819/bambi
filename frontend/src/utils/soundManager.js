const SOUND_PATHS = {
  connect: '/sounds/connect.mp3',
  disconnect: '/sounds/disconnect.mp3',
  send: '/sounds/send.mp3',
  received: '/sounds/received.mp3',
};

const soundCache = new Map();

function getSound(type) {
  const src = SOUND_PATHS[type];

  if (!src) {
    return null;
  }

  let audio = soundCache.get(type);

  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    soundCache.set(type, audio);
  }

  return audio;
}

export function playSound(type) {
  const audio = getSound(type);

  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;

    const promise = audio.play();

    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Browser autoplay policy may block audio.
        // Do not interrupt WebRTC/file transfer.
      });
    }
  } catch (error) {
    console.warn('[Sound] Playback failed:', error);
  }
}

export function preloadSounds() {
  Object.keys(SOUND_PATHS).forEach((type) => {
    const audio = getSound(type);

    if (!audio) {
      return;
    }

    try {
      audio.load();
    } catch (error) {
      console.warn(`[Sound] Failed to preload ${type}:`, error);
    }
  });
}

export function stopSound(type) {
  const audio = soundCache.get(type);

  if (!audio) {
    return;
  }

  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {}
}

export function stopAllSounds() {
  soundCache.forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  });
}