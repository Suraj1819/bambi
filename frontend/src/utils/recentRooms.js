/**
 * Device-local recent rooms (localStorage only — never shared across devices).
 *
 * Compatible call styles:
 *   saveRecentRoom('ABC12', 'guest')
 *   saveRecentRoom('ABC12', 'host', { deviceName })
 *   saveRecentRoom({ roomCode: 'ABC12', role: 'guest', joinedAt: Date.now() })
 *
 * RoomContext:
 *   import { loadRecentRooms, saveRecentRoom, removeRecentRoom, clearRecentRooms } from '../utils/recentRooms';
 */

const STORAGE_KEY = 'webdrop-recent-rooms-v2';
const SEEN_KEY = 'webdrop-notifications-seen-v2';
const MAX_ROOMS = 12;

function safeParse(raw, fallback) {
  try {
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeRoom(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const roomCode = String(entry.roomCode || entry.code || '')
    .trim()
    .toUpperCase();

  if (!roomCode || roomCode.length < 3) return null;

  const roleRaw = String(entry.role || '').toLowerCase();
  const role = roleRaw === 'host' ? 'host' : 'guest';

  const at = Number(
    entry.at || entry.joinedAt || entry.createdAt || Date.now(),
  );

  return {
    roomCode,
    role,
    at: Number.isFinite(at) ? at : Date.now(),
    deviceName: entry.deviceName ? String(entry.deviceName) : undefined,
  };
}

/** Load recent rooms for THIS browser only */
export function loadRecentRooms() {
  if (typeof window === 'undefined') return [];

  try {
    const list = safeParse(window.localStorage.getItem(STORAGE_KEY), []);
    if (!Array.isArray(list)) return [];

    return list
      .map(normalizeRoom)
      .filter(Boolean)
      .sort((a, b) => b.at - a.at)
      .slice(0, MAX_ROOMS);
  } catch {
    return [];
  }
}

function persist(list) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_ROOMS)),
    );
  } catch {
    // Quota / private mode
  }
}

/**
 * Add or update a room on this device.
 *
 * @param {string|object} roomCodeOrEntry - code string OR { roomCode, role, joinedAt, deviceName }
 * @param {'host'|'guest'} [role='guest']
 * @param {{ deviceName?: string, joinedAt?: number }} [meta]
 */
export function saveRecentRoom(roomCodeOrEntry, role = 'guest', meta = {}) {
  let entry;

  if (roomCodeOrEntry && typeof roomCodeOrEntry === 'object') {
    // Object form (RoomPage join): { roomCode, role, deviceName, joinedAt }
    entry = normalizeRoom({
      ...roomCodeOrEntry,
      role: roomCodeOrEntry.role || role || 'guest',
      at: roomCodeOrEntry.joinedAt || roomCodeOrEntry.at || Date.now(),
    });
  } else {
    // Positional form (CreateRoom): (code, 'host')
    entry = normalizeRoom({
      roomCode: roomCodeOrEntry,
      role: role || 'guest',
      deviceName: meta.deviceName,
      at: meta.joinedAt || meta.at || Date.now(),
    });
  }

  if (!entry) return loadRecentRooms();

  const current = loadRecentRooms().filter(
    (r) => r.roomCode !== entry.roomCode,
  );
  const list = [entry, ...current].slice(0, MAX_ROOMS);
  persist(list);
  return list;
}

/** Alias used by some call sites */
export const addRecentRoom = saveRecentRoom;

export function removeRecentRoom(roomCode) {
  const code = String(
    typeof roomCode === 'object' ? roomCode?.roomCode : roomCode || '',
  )
    .trim()
    .toUpperCase();

  if (!code) return loadRecentRooms();

  const list = loadRecentRooms().filter((r) => r.roomCode !== code);
  persist(list);

  try {
    const seen = safeParse(window.localStorage.getItem(SEEN_KEY), []);
    if (Array.isArray(seen)) {
      window.localStorage.setItem(
        SEEN_KEY,
        JSON.stringify(seen.filter((c) => String(c).toUpperCase() !== code)),
      );
    }
  } catch {
    // ignore
  }

  return list;
}

export function clearRecentRooms() {
  if (typeof window === 'undefined') return [];
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SEEN_KEY);
  } catch {
    // ignore
  }
  return [];
}

export function loadSeenRoomCodes() {
  if (typeof window === 'undefined') return [];
  try {
    const value = safeParse(window.localStorage.getItem(SEEN_KEY), []);
    return Array.isArray(value)
      ? value.map((c) => String(c).toUpperCase())
      : [];
  } catch {
    return [];
  }
}

export function saveSeenRoomCodes(codes) {
  if (typeof window === 'undefined') return;
  try {
    const list = Array.isArray(codes)
      ? codes.map((c) => String(c).toUpperCase())
      : [];
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export { STORAGE_KEY, SEEN_KEY, MAX_ROOMS };