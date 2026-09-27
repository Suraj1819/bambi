import { ROOM_CODE_LENGTH } from './constants';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a readable room code like "X7K92"
 * Ambiguous characters (0/O, 1/I) are excluded.
 */
export function generateRoomCode(length = ROOM_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/**
 * Validate a room code.
 */
export function isValidRoomCode(code, length = ROOM_CODE_LENGTH) {
  if (typeof code !== 'string') return false;
  if (code.length !== length) return false;
  return /^[A-Z0-9]+$/.test(code);
}

/**
 * Normalize user input:
 * - uppercase
 * - strip invalid characters
 * - truncate to length
 */
export function normalizeRoomCode(input, length = ROOM_CODE_LENGTH) {
  if (typeof input !== 'string') return '';
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, length);
}