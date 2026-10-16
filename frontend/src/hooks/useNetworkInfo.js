
import { useEffect, useState } from 'react';

const QUALITY = ['No signal', 'Weak', 'Fair', 'Good', 'Excellent'];

const KIND_LABELS = {
  wifi: 'Wi-Fi',
  cellular: 'Mobile data',
  ethernet: 'Ethernet',
  unknown: 'Wi-Fi',
  none: 'No network',
};

const KNOWN_TYPES = ['wifi', 'ethernet', 'cellular'];

const getConnection = () => {
  if (typeof navigator === 'undefined') return null;

  return (
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null
  );
};

/**
 * Best-effort network type detection.
 * Browser support varies by device and browser version.
 */
async function detectTypeViaWebRTC() {
  if (typeof RTCPeerConnection === 'undefined') return null;

  let pc;

  try {
    pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('network-probe');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const timeout = setTimeout(resolve, 2000);

      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    const stats = await pc.getStats();

    let detectedType = null;

    stats.forEach((report) => {
      if (
        !detectedType &&
        report.type === 'local-candidate' &&
        KNOWN_TYPES.includes(report.networkType)
      ) {
        detectedType = report.networkType;
      }
    });

    return detectedType;
  } catch {
    return null;
  } finally {
    try {
      pc?.close();
    } catch {
      // Ignore cleanup errors.
    }
  }
}

function estimateBars({ online, effectiveType, downlink, rtt }) {
  if (!online) return 0;

  const scores = [];

  if (typeof rtt === 'number' && rtt > 0) {
    scores.push(
      rtt <= 60 ? 4 :
      rtt <= 150 ? 3 :
      rtt <= 400 ? 2 : 1
    );
  }

  if (typeof downlink === 'number' && downlink > 0) {
    scores.push(
      downlink >= 8 ? 4 :
      downlink >= 3 ? 3 :
      downlink >= 1 ? 2 : 1
    );
  }

  if (scores.length > 0) {
    return Math.round(
      scores.reduce((total, score) => total + score, 0) /
      scores.length
    );
  }

  const qualityByType = {
    '4g': 4,
    '3g': 2,
    '2g': 1,
    'slow-2g': 1,
  };

  return qualityByType[effectiveType] ?? 3;
}

function readNetwork(detectedType) {
  const conn = getConnection();
  const online =
    typeof navigator === 'undefined' ? false : navigator.onLine;

  const browserType = KNOWN_TYPES.includes(conn?.type)
    ? conn.type
    : null;

  const detected = KNOWN_TYPES.includes(detectedType)
    ? detectedType
    : null;

  // Prefer the browser's reported type, then WebRTC detection.
  const actualType = browserType || detected;

  /*
   * Fallback for browsers that expose neither type.
   * This assumes Wi-Fi for display only; it cannot verify
   * whether the device is using Wi-Fi, mobile data, or Ethernet.
   */
  const kind = !online
    ? 'none'
    : actualType || 'unknown';

  const effectiveType = conn?.effectiveType;
  const downlink =
    typeof conn?.downlink === 'number' ? conn.downlink : undefined;
  const rtt = typeof conn?.rtt === 'number' ? conn.rtt : undefined;

  const bars = estimateBars({
    online,
    effectiveType,
    downlink,
    rtt,
  });

  return {
    online,
    supported: Boolean(conn),
    kind,
    label: online
      ? KIND_LABELS[kind] || 'Wi-Fi'
      : 'No network',
    effectiveType,
    downlink,
    rtt,
    bars,
    quality: QUALITY[bars],
  };
}

function sameNetwork(a, b) {
  return (
    a.online === b.online &&
    a.kind === b.kind &&
    a.bars === b.bars &&
    a.rtt === b.rtt &&
    a.downlink === b.downlink &&
    a.effectiveType === b.effectiveType
  );
}

export default function useNetworkInfo() {
  const [detected, setDetected] = useState(null);
  const [info, setInfo] = useState(() => readNetwork(null));

  useEffect(() => {
    let cancelled = false;
    const conn = getConnection();

    const detect = async () => {
      if (!navigator.onLine) return;

      const browserType = KNOWN_TYPES.includes(conn?.type)
        ? conn.type
        : null;

      const webrtcType = await detectTypeViaWebRTC();

      if (!cancelled) {
        setDetected(browserType || webrtcType || null);
      }
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

  useEffect(() => {
    const update = () => {
      const next = readNetwork(detected);
      setInfo((previous) =>
        sameNetwork(previous, next) ? previous : next
      );
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
