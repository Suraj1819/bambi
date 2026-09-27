import { MAX_FILE_SIZE } from './constants';

/* ============================================================
   VALIDATION
============================================================ */

export function validateFile(file) {
  if (!file) return 'File is missing';
  // No hard size limit — WebRTC can transfer arbitrarily large files.
  // MAX_FILE_SIZE === 0 means unlimited.
  if (MAX_FILE_SIZE > 0 && file.size > MAX_FILE_SIZE) {
    return `File exceeds max size (${(MAX_FILE_SIZE / (1024 * 1024 * 1024)).toFixed(0)} GB)`;
  }
  return null;
}

/* ============================================================
   ICON / CATEGORY HELPERS
============================================================ */

/**
 * Return a semantic icon name based on MIME type.
 * Examples: 'image' | 'video' | 'audio' | 'pdf' | 'file'
 */
export function getFileIcon(mimeType) {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'file';
}

/**
 * Return a human-readable category for a MIME type.
 * Examples: 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'document' | 'other'
 */
export function getFileCategory(mimeType) {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip')
  )
    return 'archive';
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('json') ||
    mimeType.includes('xml')
  )
    return 'document';
  return 'other';
}

/* ============================================================
   DEVICE HELPERS
============================================================ */

export function detectDevice() {
  return detectDeviceInfo().label;
}

/**
 * Best-effort device / OS / browser fingerprint for display only.
 *
 * Brave, Vivaldi, Arc and other Chromium forks all report "Chrome" in the
 * classic User-Agent. We therefore probe navigator.brave (and a few other
 * markers) so the UI shows the real browser name.
 *
 * Mobile browsers deliberately reduce hardware detail for privacy —
 * Apple never exposes the iPhone/iPad model, so we only show "iPhone" / "iPad"
 * plus the OS version.
 */
export function detectDeviceInfo() {
  if (typeof navigator === 'undefined') {
    return { label: 'Unknown Device', os: 'Unknown', browser: 'Unknown', type: 'desktop', model: null };
  }
  const ua = navigator.userAgent || '';
  const uaData = navigator.userAgentData;

  // Browser — most specific first
  let browser = 'Browser';
  if (typeof navigator.brave !== 'undefined') {
    // Brave is Chromium-based and otherwise looks identical to Chrome
    browser = 'Brave';
  } else if (/Edg\//.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = 'Opera';
  } else if (/Vivaldi/.test(ua)) {
    browser = 'Vivaldi';
  } else if (/Arc\//.test(ua)) {
    browser = 'Arc';
  } else if (/SamsungBrowser/.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/CriOS\//.test(ua)) {
    browser = 'Chrome';
  } else if (/FxiOS\//.test(ua)) {
    browser = 'Firefox';
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
  } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//.test(ua) && /Version\//.test(ua)) {
    browser = 'Safari';
  } else if (uaData?.brands) {
    // Client Hints fallback
    const brand = uaData.brands.find(
      (b) => !/Not.?A.?Brand/i.test(b.brand) && b.brand !== 'Chromium'
    );
    if (brand) browser = brand.brand;
  }

  // OS + type + model
  let os = 'Unknown OS';
  let type = 'desktop';
  let model = null;

  if (/android/i.test(ua)) {
    type = /mobile/i.test(ua) ? 'phone' : 'tablet';
    const verMatch = ua.match(/Android\s([\d.]+)/);
    os = verMatch ? `Android ${verMatch[1]}` : 'Android';

    // Chrome on Android often includes "<model> Build/" before ")"
    const modelMatch = ua.match(/;\s([A-Za-z0-9\- _]+)\sBuild\//);
    if (modelMatch) {
      model = modelMatch[1].trim();
    }
  } else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    type = 'tablet';
    const verMatch = ua.match(/OS\s([\d_]+)/);
    os = verMatch ? `iPadOS ${verMatch[1].replace(/_/g, '.')}` : 'iPadOS';
    model = 'iPad';
  } else if (/iPhone|iPod/.test(ua)) {
    type = 'phone';
    const verMatch = ua.match(/OS\s([\d_]+)/);
    os = verMatch ? `iOS ${verMatch[1].replace(/_/g, '.')}` : 'iOS';
    model = 'iPhone';
  } else if (/Macintosh/.test(ua)) {
    type = 'desktop';
    const verMatch = ua.match(/Mac OS X\s([\d_]+)/);
    os = verMatch ? `macOS ${verMatch[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/Windows/i.test(ua)) {
    type = 'desktop';
    os = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    type = 'desktop';
    os = 'Linux';
  }

  const label = model ? `${model} · ${browser}` : `${os} · ${browser}`;

  return { label, os, browser, type, model };
}

/** Alias kept for compatibility with RoomContext */
export const detectDeviceName = detectDevice;

/* ============================================================
   FORMATTING HELPERS
============================================================ */

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond) {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatETA(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Format a timestamp in the user's real local timezone.
 * Use this for room created / expires displays.
 */
export function formatLocalDateTime(ts) {
  if (!ts) return '--';
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Date(ts).toLocaleString();
  }
}

/* ============================================================
   FILE TRANSFER HELPERS
============================================================ */

export function generateFileId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `f_${ts}_${rand}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function chunksToBlob(chunks, mimeType = 'application/octet-stream') {
  return new Blob(chunks, { type: mimeType });
}

/* ============================================================
   DEFAULT EXPORT (bundled — for convenience)
============================================================ */
export default {
  validateFile,
  getFileIcon,
  getFileCategory,
  detectDevice,
  detectDeviceInfo,
  detectDeviceName,
  formatBytes,
  formatSpeed,
  formatETA,
  formatLocalDateTime,
  generateFileId,
  downloadBlob,
  readFileAsArrayBuffer,
  chunksToBlob,
};