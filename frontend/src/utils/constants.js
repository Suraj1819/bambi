export const ROOM_CODE_LENGTH = 5;

export const ROOM_EXPIRY_MINUTES = 30;

export const MAX_DEVICES_PER_ROOM = 2;

/* ============================================================
   FILE TRANSFER
============================================================ */

// Size of each chunk sent through the WebRTC DataChannel
export const FILE_CHUNK_SIZE = 64 * 1024;

// File is read from disk in larger blocks to reduce read overhead
export const FILE_READ_BLOCK_SIZE = 4 * 1024 * 1024;

// 0 = unlimited
export const MAX_FILE_SIZE = 0;

/* ============================================================
   DATA CHANNEL BUFFER
============================================================ */

// Sender pauses when bufferedAmount reaches this value
export const BUFFER_HIGH_WATERMARK = 2 * 1024 * 1024;

// Sender resumes when bufferedAmount goes below this value
export const BUFFER_LOW_WATERMARK = 512 * 1024;

/* ============================================================
   WEBRTC ICE SERVERS
============================================================ */

export const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },

    {
      urls: 'turn:free.expressturn.com:3478',
      username: '000000002105836723',
      credential: 'mF2klm+JllCgYEeeWHCBFc0PULY=',
    },

    {
      urls: 'turn:free.expressturn.com:3478?transport=tcp',
      username: '000000002105836723',
      credential: 'mF2klm+JllCgYEeeWHCBFc0PULY=',
    },
  ],
};

/* ============================================================
   BACKEND
============================================================ */

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  'https://bambibackend.onrender.com';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://bambibackend.onrender.com';

/* ============================================================
   FRONTEND
============================================================ */

export const WEB_APP_URL = 'https://webdrop-eight.vercel.app';