export const ROOM_CODE_LENGTH = 5;

export const ROOM_EXPIRY_MINUTES = 30;

export const MAX_DEVICES_PER_ROOM = 2;

export const FILE_CHUNK_SIZE = 16 * 1024;

// 0 = unlimited
export const MAX_FILE_SIZE = 0;

export const BUFFER_HIGH_WATERMARK =
  8 * 1024 * 1024;

export const BUFFER_LOW_WATERMARK =
  1 * 1024 * 1024;

/* ============================================================
   WEBRTC ICE SERVERS
============================================================ */

export const ICE_SERVERS = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
  ],
};

/* ============================================================
   BACKEND URL
============================================================ */

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  'http://localhost:5000';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';