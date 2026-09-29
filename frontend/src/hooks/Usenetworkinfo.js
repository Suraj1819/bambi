import { useEffect, useState } from 'react';

/**
 * Real-time network info (type + estimated signal bars).
 *
 * Connection type comes from, in order:
 *  1. navigator.connection.type   (Chrome on Android)
 *  2. WebRTC local-candidate stats `networkType` (Chrome/Edge desktop:
 *     'wifi' | 'ethernet' | 'cellular')
 *  3. Fallback: 'unknown' (UI shows the Wi-Fi icon)
 *
 * Browsers cannot read the real radio signal (dBm), so the bars are
 * estimated from rtt + downlink (or effectiveType as a fallback).
 */

const QUALITY = ['No signal', 'Weak', 'Fair', 'Good', 'Excellent'];
const KIND_LABELS = {
  wifi: 'Wi-Fi',
  cellular: 'Mobile data',
  ethernet: 'Ethernet',
};
const KNOWN_TYPES = ['wifi', 'ethernet', 'cellular'];

const getConnection = () =>
  typeof navigator === 'undefined'
    ? null
    : navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      null;

/* ---------- Connection type via WebRTC stats (desktop Chrome/Edge) ---------- */

async function detectTypeViaWebRTC() {
  if (typeof RTCPeerConnection === 'undefined') return null;

  let pc;
  try {
    pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('probe');
    await pc.setLocalDescription(await pc.createOffer());

    await new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const timer = setTimeout(resolve, 1500);
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timer);
          resolve();
        }
      });
      return undefined;
    });

    const stats = await pc.getStats();
    let found = null;

    stats.forEach((report) => {
      if (
        !found &&
        report.type === 'local-candidate' &&
        KNOWN_TYPES.includes(report.networkType)
      ) {
        found = report.networkType;
      }
    });

    return found;
  } catch {
    return null;
  } finally {
    try {
      pc?.close();
    } catch {
      /* ignore */
    }
  }
}

/* ---------- Signal bars estimate ---------- */

function estimateBars({ online, effectiveType, downlink, rtt }) {
  if (!online) return 0;

  const scores = [];

  if (typeof rtt === 'number' && rtt > 0) {
    scores.push(rtt <= 60 ? 4 : rtt <= 150 ? 3 : rtt <= 400 ? 2 : 1);
  }

  if (typeof downlink === 'number' && downlink > 0) {
    scores.push(downlink >= 8 ? 4 : downlink >= 3 ? 3 : downlink >= 1 ? 2 : 1);
  }

  if (scores.length) {
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  const byType = { '4g': 4, '3g': 2, '2g': 1, 'slow-2g': 1 };
  return byType[effectiveType] ?? 3;
}

function readNetwork(detectedType) {
  const conn = getConnection();
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;

  const rawType = KNOWN_TYPES.includes(conn?.type) ? conn.type : detectedType;
  const kind = !online ? 'none' : KNOWN_TYPES.includes(rawType) ? rawType : 'unknown';

  const effectiveType = conn?.effectiveType;
  const downlink = conn?.downlink;
  const rtt = conn?.rtt;

  const bars = estimateBars({ online, effectiveType, downlink, rtt });

  return {
    online,
    supported: Boolean(conn),
    kind,
    label: online ? KIND_LABELS[kind] || 'Network' : 'No network',
    effectiveType,
    downlink,
    rtt,
    bars,
    quality: QUALITY[bars],
  };
}

const sameNetwork = (a, b) =>
  a.online === b.online &&
  a.kind === b.kind &&
  a.bars === b.bars &&
  a.rtt === b.rtt &&
  a.downlink === b.downlink &&
  a.effectiveType === b.effectiveType;

export default function useNetworkInfo() {
  const [detected, setDetected] = useState(null);
  const [info, setInfo] = useState(() => readNetwork(null));

  /* Re-detect connection type (WebRTC) on start, on change, and every 15s */
  useEffect(() => {
    let cancelled = false;
    const conn = getConnection();

    const detect = async () => {
      if (!navigator.onLine) return;
      const type = await detectTypeViaWebRTC();
      if (!cancelled) setDetected(type);
    };

    detect();

    window.addEventListener('online', detect);
    conn?.addEventListener?.('change', detect);
    const interval = setInterval(detect, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener('online', detect);
      conn?.removeEventListener?.('change', detect);
      clearInterval(interval);
    };
  }, []);

  /* Live rtt / downlink / online state */
  useEffect(() => {
    const update = () => {
      const next = readNetwork(detected);
      setInfo((prev) => (sameNetwork(prev, next) ? prev : next));
    };

    const conn = getConnection();

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    conn?.addEventListener?.('change', update);

    const interval = setInterval(update, 4000);
    update();

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      conn?.removeEventListener?.('change', update);
      clearInterval(interval);
    };
  }, [detected]);

  return info;
}