import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FILE_CHUNK_SIZE,
  FILE_READ_BLOCK_SIZE,
  BUFFER_HIGH_WATERMARK,
  BUFFER_LOW_WATERMARK,
} from '../utils/constants';
import { generateFileId, downloadBlob, validateFile } from '../utils/fileUtils';

function makeSpeedTracker() {
  let lastBytes = 0;
  let lastTime = Date.now();
  let smoothed = 0;

  return {
    update(currentBytes) {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      if (dt < 0.15) return smoothed;

      const dBytes = currentBytes - lastBytes;
      const instant = dBytes / dt;
      smoothed = smoothed === 0 ? instant : smoothed * 0.7 + instant * 0.3;

      lastBytes = currentBytes;
      lastTime = now;
      return smoothed;
    },
    reset() {
      lastBytes = 0;
      lastTime = Date.now();
      smoothed = 0;
    },
    get() {
      return smoothed;
    },
  };
}

/**
 * Buffer BUFFER_LOW_WATERMARK tak khali hone ka intezaar karta hai.
 * Polling ki jagah 'bufferedamountlow' event use hota hai, taaki
 * buffer khali hote hi sender turant dobara chal pade (koi 50ms ka gap nahi).
 */
function waitForDrain(dc) {
  return new Promise((resolve) => {
    if (dc.readyState !== 'open' || dc.bufferedAmount <= BUFFER_LOW_WATERMARK) {
      resolve();
      return;
    }

    let timer;
    const done = () => {
      dc.removeEventListener('bufferedamountlow', done);
      dc.removeEventListener('close', done);
      clearTimeout(timer);
      resolve();
    };

    dc.addEventListener('bufferedamountlow', done);
    dc.addEventListener('close', done);
    timer = setTimeout(done, 1000); // safety net
  });
}

/** Sab data network par nikal jaye (bufferedAmount == 0) tab tak ruko */
function waitForEmpty(dc) {
  return new Promise((resolve) => {
    const check = () => {
      if (dc.readyState !== 'open' || dc.bufferedAmount === 0) resolve();
      else setTimeout(check, 50);
    };
    check();
  });
}

/**
 * `dataChannelOpen` (from useWebRTC) is accepted so this hook knows the
 * moment the connection comes back and can automatically flush anything
 * that was queued while it was down.
 */
export function useFileTransfer({ getDataChannel, dataChannelOpen }) {
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);

  const outgoingRef = useRef([]);
  const incomingRef = useRef([]);
  useEffect(() => {
    outgoingRef.current = outgoing;
  }, [outgoing]);
  useEffect(() => {
    incomingRef.current = incoming;
  }, [incoming]);

  const incomingBuffers = useRef(new Map());
  const receiveOrder = useRef([]);
  const acceptResolversRef = useRef(new Map());
  const cancelledRef = useRef(new Set());
  const lastAckSentRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const lastRecvUiUpdateRef = useRef(0);

  // Sender side: speed ab receiver ke ACK (file-progress) se nikalti hai,
  // buffer me daali gayi bytes se nahi. Isliye speed/ETA asli dikhte hain.
  const sendSpeedTrackers = useRef(new Map());
  const recvSpeedTrackers = useRef(new Map());
  const retryFileRef = useRef(new Map());

  const pendingFilesRef = useRef([]);
  const flushingRef = useRef(false);

  /* ============================================================
     SEND ONE FILE'S OFFER, WAIT FOR ACCEPT, THEN STREAM IT
  ============================================================ */
  const offerAndSend = async (dc, file, meta) => {
    dc.send(
      JSON.stringify({
        type: 'file-offer',
        files: [meta],
      })
    );

    const result = await new Promise((resolve) => {
      acceptResolversRef.current.set(meta.fileId, resolve);

      setTimeout(() => {
        if (acceptResolversRef.current.has(meta.fileId)) {
          acceptResolversRef.current.delete(meta.fileId);
          resolve('timeout');
        }
      }, 300000);
    });

    if (result !== 'accepted') {
      setOutgoing((prev) =>
        prev.map((f) =>
          f.fileId === meta.fileId
            ? {
                ...f,
                status: result === 'cancelled' ? 'cancelled' : 'rejected',
              }
            : f
        )
      );
      return;
    }

    await sendSingleFile(dc, file, meta);
  };

  /* ============================================================
     SEND — sequential, streamed
  ============================================================ */
  const sendFiles = useCallback(
    async (files) => {
      const valid = [];
      for (const file of files) {
        const err = validateFile(file);
        if (err) continue;
        valid.push(file);
      }
      if (valid.length === 0) return;

      for (const file of valid) {
        const meta = {
          fileId: generateFileId(),
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        };

        retryFileRef.current.set(meta.fileId, file);

        const dc = getDataChannel();
        const isOpen = Boolean(dc) && dc.readyState === 'open';

        setOutgoing((prev) => [
          ...prev,
          {
            ...meta,
            progress: 0,
            bytesSent: 0,
            speed: 0,
            status: isOpen ? 'waiting' : 'queued',
            direction: 'out',
          },
        ]);

        if (!isOpen) {
          console.warn(
            '[send] DataChannel not open yet — queueing file until connection is (re)established'
          );
          pendingFilesRef.current.push({ file, meta });
          continue;
        }

        await offerAndSend(dc, file, meta);
      }
    },
    [getDataChannel]
  );

  /* ============================================================
     FLUSH QUEUED FILES (DataChannel reopen hone par)
  ============================================================ */
  const flushPendingFiles = useCallback(async () => {
    if (flushingRef.current) return;
    if (pendingFilesRef.current.length === 0) return;

    flushingRef.current = true;

    const queue = pendingFilesRef.current;
    pendingFilesRef.current = [];

    try {
      for (let i = 0; i < queue.length; i++) {
        const { file, meta } = queue[i];
        const dc = getDataChannel();

        if (!dc || dc.readyState !== 'open') {
          pendingFilesRef.current.push(...queue.slice(i));
          return;
        }

        console.log('[send] Connection back, resuming queued file:', meta.name);

        setOutgoing((prev) =>
          prev.map((f) =>
            f.fileId === meta.fileId ? { ...f, status: 'waiting' } : f
          )
        );

        await offerAndSend(dc, file, meta);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [getDataChannel]);

  useEffect(() => {
    if (dataChannelOpen) {
      flushPendingFiles();
    }
  }, [dataChannelOpen, flushPendingFiles]);

  /**
   * Fast streaming send:
   *  - file ko 4 MB ke blocks me padhta hai (har 16 KB ke liye alag read nahi)
   *  - block ko 64 KB chunks me kaat kar zero-copy view se bhejta hai
   *  - backpressure: bufferedamountlow event se (polling nahi)
   *  - speed = receiver ke ACK se (asli speed), buffer se nahi
   */
  const sendSingleFile = async (dc, file, meta) => {
    if (cancelledRef.current.has(meta.fileId)) {
      try {
        dc.send(JSON.stringify({ type: 'file-cancel', fileId: meta.fileId }));
      } catch {}
      setOutgoing((prev) =>
        prev.map((f) =>
          f.fileId === meta.fileId && f.status !== 'completed'
            ? { ...f, status: 'cancelled', speed: 0 }
            : f
        )
      );
      return;
    }

    setOutgoing((prev) =>
      prev.map((f) =>
        f.fileId === meta.fileId ? { ...f, status: 'transferring' } : f
      )
    );

    dc.bufferedAmountLowThreshold = BUFFER_LOW_WATERMARK;
    dc.send(JSON.stringify({ type: 'file-start', ...meta }));

    const total = file.size;
    let offset = 0;

    // ACK-based speed tracker (file-progress handler isko update karta hai)
    sendSpeedTrackers.current.set(meta.fileId, makeSpeedTracker());
    lastUiUpdateRef.current = 0;

    // true return kare to loop rok do (cancel / connection drop)
    const shouldStop = () => {
      if (cancelledRef.current.has(meta.fileId)) {
        try {
          dc.send(JSON.stringify({ type: 'file-cancel', fileId: meta.fileId }));
        } catch {}
        sendSpeedTrackers.current.delete(meta.fileId);
        setOutgoing((prev) =>
          prev.map((f) =>
            f.fileId === meta.fileId && f.status !== 'completed'
              ? { ...f, status: 'cancelled', speed: 0 }
              : f
          )
        );
        return true;
      }

      if (dc.readyState !== 'open') {
        console.warn('[send] DataChannel dropped mid-transfer, re-queueing:', meta.name);

        setOutgoing((prev) =>
          prev.map((f) =>
            f.fileId === meta.fileId
              ? { ...f, status: 'queued', bytesSent: 0, bytesReceived: 0, speed: 0 }
              : f
          )
        );

        pendingFilesRef.current.push({ file, meta });
        sendSpeedTrackers.current.delete(meta.fileId);
        return true;
      }

      return false;
    };

    while (offset < total) {
      if (shouldStop()) return;

      const blockEnd = Math.min(offset + FILE_READ_BLOCK_SIZE, total);
      const block = await file.slice(offset, blockEnd).arrayBuffer();

      for (let i = 0; i < block.byteLength; i += FILE_CHUNK_SIZE) {
        if (shouldStop()) return;

        if (dc.bufferedAmount > BUFFER_HIGH_WATERMARK) {
          await waitForDrain(dc);
          if (shouldStop()) return;
        }

        const len = Math.min(FILE_CHUNK_SIZE, block.byteLength - i);
        dc.send(new Uint8Array(block, i, len));

        // UI update (fallback progress) — ~5 baar per second
        const now = Date.now();
        if (now - lastUiUpdateRef.current > 200) {
          lastUiUpdateRef.current = now;
          const sent = offset + i + len;
          setOutgoing((prev) =>
            prev.map((f) =>
              f.fileId === meta.fileId ? { ...f, bytesSent: sent } : f
            )
          );
        }
      }

      offset = blockEnd;
    }

    dc.send(JSON.stringify({ type: 'file-complete', fileId: meta.fileId }));

    // Sab bytes network par nikalne tak "Sent" mat dikhao
    await waitForEmpty(dc);

    const dropped = dc.readyState !== 'open' && dc.bufferedAmount > 0;

    setOutgoing((prev) =>
      prev.map((f) =>
        f.fileId === meta.fileId
          ? dropped
            ? { ...f, status: 'failed', speed: 0 }
            : {
                ...f,
                status: 'completed',
                bytesSent: total,
                bytesReceived: total,
                progress: 100,
                speed: 0,
              }
          : f
      )
    );

    sendSpeedTrackers.current.delete(meta.fileId);
    if (!dropped) retryFileRef.current.delete(meta.fileId);
  };

  /* ============================================================
     RECEIVE
  ============================================================ */
  const handleIncomingData = useCallback(
    (event) => {
      const data = event.data;

      if (typeof data === 'string') {
        let msg;
        try {
          msg = JSON.parse(data);
        } catch {
          return;
        }

        if (msg.type === 'file-offer') {
          setIncoming((prev) => {
            const next = [...prev];

            for (const f of msg.files) {
              const idx = next.findIndex((x) => x.fileId === f.fileId);

              const entry = {
                ...f,
                progress: 0,
                bytesReceived: 0,
                speed: 0,
                status: 'pending',
                direction: 'in',
              };

              if (idx >= 0) {
                next[idx] = entry;
              } else {
                next.push(entry);
              }
            }

            return next;
          });
          return;
        }

        // Receiver ka ACK -> sender ki asli progress + asli speed
        if (msg.type === 'file-progress') {
          const { fileId, received } = msg;
          const tracker = sendSpeedTrackers.current.get(fileId);
          const speed = tracker ? tracker.update(received) : 0;

          setOutgoing((prev) =>
            prev.map((f) => {
              if (f.fileId !== fileId) return f;
              return f.status === 'transferring'
                ? { ...f, bytesReceived: received, speed }
                : { ...f, bytesReceived: received };
            })
          );
          return;
        }

        if (msg.type === 'file-start') {
          incomingBuffers.current.set(msg.fileId, {
            meta: msg,
            chunks: [],
            received: 0,
          });
          receiveOrder.current.push(msg.fileId);
          recvSpeedTrackers.current.set(msg.fileId, makeSpeedTracker());

          setIncoming((prev) =>
            prev.map((f) =>
              f.fileId === msg.fileId ? { ...f, status: 'receiving' } : f
            )
          );
          return;
        }

        if (msg.type === 'file-complete') {
          const entry = incomingBuffers.current.get(msg.fileId);
          if (!entry) return;

          const blob = new Blob(entry.chunks, {
            type: entry.meta.mimeType || 'application/octet-stream',
          });

          setIncoming((prev) =>
            prev.map((f) =>
              f.fileId === msg.fileId
                ? {
                    ...f,
                    status: 'completed',
                    blob,
                    progress: 100,
                    bytesReceived: entry.meta.size,
                    speed: 0,
                  }
                : f
            )
          );

          incomingBuffers.current.delete(msg.fileId);
          receiveOrder.current = receiveOrder.current.filter(
            (id) => id !== msg.fileId
          );
          recvSpeedTrackers.current.delete(msg.fileId);
          return;
        }

        if (msg.type === 'file-cancel') {
          const { fileId } = msg;
          incomingBuffers.current.delete(fileId);
          receiveOrder.current = receiveOrder.current.filter(
            (id) => id !== fileId
          );
          recvSpeedTrackers.current.delete(fileId);
          setIncoming((prev) =>
            prev.map((f) =>
              f.fileId === fileId && f.status !== 'completed'
                ? { ...f, status: 'cancelled', speed: 0 }
                : f
            )
          );
          return;
        }

        if (msg.type === 'file-cancel-by-receiver') {
          const { fileId } = msg;
          cancelledRef.current.add(fileId);
          setOutgoing((prev) =>
            prev.map((f) =>
              f.fileId === fileId ? { ...f, status: 'cancelled' } : f
            )
          );
          return;
        }
        return;
      }

      // Binary chunk — hamesha receive order ki pehli file me jodo
      const nextFileId = receiveOrder.current[0];
      if (!nextFileId) return;

      const entry = incomingBuffers.current.get(nextFileId);
      if (!entry) {
        receiveOrder.current.shift();
        return;
      }

      const chunk = data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer;
      entry.chunks.push(chunk);
      entry.received += chunk.byteLength;

      const tracker = recvSpeedTrackers.current.get(nextFileId);
      const speed = tracker ? tracker.update(entry.received) : 0;

      const now = Date.now();
      const isLastChunk = entry.received >= entry.meta.size;
      if (now - lastRecvUiUpdateRef.current > 125 || isLastChunk) {
        lastRecvUiUpdateRef.current = now;
        setIncoming((prev) =>
          prev.map((f) =>
            f.fileId === nextFileId
              ? { ...f, bytesReceived: entry.received, speed }
              : f
          )
        );
      }

      // ACK sender ko (~5 baar per second) — sender isi se apni speed nikalta hai
      if (now - lastAckSentRef.current > 200) {
        lastAckSentRef.current = now;
        const dc = getDataChannel();
        if (dc && dc.readyState === 'open') {
          try {
            dc.send(
              JSON.stringify({
                type: 'file-progress',
                fileId: nextFileId,
                received: entry.received,
              })
            );
          } catch {}
        }
      }
    },
    [getDataChannel]
  );

  /* ============================================================
     Accept / Reject
  ============================================================ */
  const acceptOffer = useCallback(
    (fileId) => {
      const dc = getDataChannel();
      if (!dc || dc.readyState !== 'open') return;
      dc.send(JSON.stringify({ type: 'file-accept', fileId }));
      setIncoming((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: 'receiving' } : f
        )
      );
    },
    [getDataChannel]
  );

  const rejectOffer = useCallback(
    (fileId) => {
      const dc = getDataChannel();
      if (!dc || dc.readyState !== 'open') return;
      dc.send(JSON.stringify({ type: 'file-reject', fileId }));
      setIncoming((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: 'rejected' } : f
        )
      );
    },
    [getDataChannel]
  );

  /* ============================================================
     Cancel
  ============================================================ */
  const cancelOutgoing = useCallback(
    (fileId) => {
      cancelledRef.current.add(fileId);
      sendSpeedTrackers.current.delete(fileId);

      pendingFilesRef.current = pendingFilesRef.current.filter(
        (item) => item.meta.fileId !== fileId
      );

      setOutgoing((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: 'cancelled', speed: 0 } : f
        )
      );

      const dc = getDataChannel();
      if (dc && dc.readyState === 'open') {
        try {
          dc.send(JSON.stringify({ type: 'file-cancel', fileId }));
        } catch (err) {
          console.error('[send] failed to send cancel:', err);
        }
      }

      const resolver = acceptResolversRef.current.get(fileId);
      if (resolver) {
        resolver('cancelled');
        acceptResolversRef.current.delete(fileId);
      }
    },
    [getDataChannel]
  );

  const cancelIncoming = useCallback(
    (fileId) => {
      incomingBuffers.current.delete(fileId);
      receiveOrder.current = receiveOrder.current.filter((id) => id !== fileId);
      recvSpeedTrackers.current.delete(fileId);

      const dc = getDataChannel();
      if (dc && dc.readyState === 'open') {
        try {
          dc.send(JSON.stringify({ type: 'file-cancel-by-receiver', fileId }));
        } catch (err) {
          console.error('[recv] failed to send cancel:', err);
        }
      }

      setIncoming((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: 'cancelled', speed: 0 } : f
        )
      );
    },
    [getDataChannel]
  );

  const wrappedHandler = useCallback(
    (event) => {
      const data = event.data;
      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'file-accept') {
            const resolver = acceptResolversRef.current.get(msg.fileId);
            if (resolver) {
              resolver('accepted');
              acceptResolversRef.current.delete(msg.fileId);
            }
            return;
          }
          if (msg.type === 'file-reject') {
            const resolver = acceptResolversRef.current.get(msg.fileId);
            if (resolver) {
              resolver('rejected');
              acceptResolversRef.current.delete(msg.fileId);
            }
            return;
          }
        } catch {}
      }
      handleIncomingData(event);
    },
    [handleIncomingData]
  );

  /* ============================================================
     Download
  ============================================================ */
  const downloadFile = useCallback(
    (fileId) => {
      const file = incoming.find((f) => f.fileId === fileId);
      if (!file || !file.blob) return;
      downloadBlob(file.blob, file.name);
    },
    [incoming]
  );

  /* ============================================================
     Remove / Clear
  ============================================================ */
  const removeFile = useCallback(
    (fileId, direction) => {
      if (direction === 'in') {
        setIncoming((prev) => prev.filter((f) => f.fileId !== fileId));
        incomingBuffers.current.delete(fileId);
        receiveOrder.current = receiveOrder.current.filter((id) => id !== fileId);
        recvSpeedTrackers.current.delete(fileId);
      } else {
        setOutgoing((prev) => {
          const file = prev.find((f) => f.fileId === fileId);
          if (file && ['waiting', 'transferring', 'queued'].includes(file.status)) {
            cancelOutgoing(fileId);
          }
          return prev.filter((f) => f.fileId !== fileId);
        });
        sendSpeedTrackers.current.delete(fileId);
      }
    },
    [cancelOutgoing]
  );

  const clearAll = useCallback(() => {
    // Pehle chal rahe / pending transfers ko cancel karo taaki dusri taraf bhi ruk jaye
    outgoingRef.current
      .filter((f) => ['waiting', 'queued', 'transferring'].includes(f.status))
      .forEach((f) => cancelOutgoing(f.fileId));

    incomingRef.current.forEach((f) => {
      if (f.status === 'pending') rejectOffer(f.fileId);
      else if (f.status === 'receiving') cancelIncoming(f.fileId);
    });

    setOutgoing([]);
    setIncoming([]);
    incomingBuffers.current.clear();
    receiveOrder.current = [];
    acceptResolversRef.current.clear();
    // NOTE: cancelledRef ko clear NAHI karte — sender loop usi se rukta hai
    sendSpeedTrackers.current.clear();
    recvSpeedTrackers.current.clear();
    retryFileRef.current.clear();
    pendingFilesRef.current = [];
  }, [cancelOutgoing, rejectOffer, cancelIncoming]);

  const clearCompleted = useCallback(() => {
    setOutgoing((prev) =>
      prev.filter(
        (f) => !['completed', 'rejected', 'cancelled', 'failed'].includes(f.status)
      )
    );
    setIncoming((prev) =>
      prev.filter(
        (f) => !['completed', 'rejected', 'cancelled', 'failed'].includes(f.status)
      )
    );
  }, []);

  /* ============================================================
     Peer disconnect: outgoing files re-queue, incoming fail
  ============================================================ */
  const markPeerDisconnected = useCallback(() => {
    setOutgoing((prev) =>
      prev.map((f) => {
        if (['waiting', 'transferring'].includes(f.status)) {
          const file = retryFileRef.current.get(f.fileId);

          if (file) {
            pendingFilesRef.current.push({
              file,
              meta: {
                fileId: f.fileId,
                name: f.name,
                size: f.size,
                mimeType: f.mimeType,
              },
            });

            return { ...f, status: 'queued', bytesSent: 0, bytesReceived: 0, speed: 0 };
          }

          return { ...f, status: 'failed', speed: 0 };
        }
        return f;
      })
    );
    setIncoming((prev) =>
      prev.map((f) =>
        ['pending', 'receiving'].includes(f.status)
          ? { ...f, status: 'failed', speed: 0 }
          : f
      )
    );
    sendSpeedTrackers.current.clear();
    recvSpeedTrackers.current.clear();
  }, []);

  const retryFile = useCallback(
    (fileId) => {
      const dc = getDataChannel();
      const file = retryFileRef.current.get(fileId);
      if (!file) return false;

      cancelledRef.current.delete(fileId);

      const meta = {
        fileId,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      };

      if (!dc || dc.readyState !== 'open') {
        setOutgoing((prev) =>
          prev.map((f) =>
            f.fileId === fileId
              ? { ...f, status: 'queued', bytesSent: 0, bytesReceived: 0, speed: 0 }
              : f
          )
        );
        pendingFilesRef.current.push({ file, meta });
        return true;
      }

      setOutgoing((prev) =>
        prev.map((f) =>
          f.fileId === fileId
            ? { ...f, status: 'waiting', bytesSent: 0, bytesReceived: 0, speed: 0 }
            : f
        )
      );

      offerAndSend(dc, file, meta);

      return true;
    },
    [getDataChannel]
  );

  return {
    outgoing,
    incoming,
    sendFiles,
    handleIncomingData: wrappedHandler,
    downloadFile,
    acceptOffer,
    rejectOffer,
    cancelOutgoing,
    cancelIncoming,
    removeFile,
    clearAll,
    clearCompleted,
    markPeerDisconnected,
    retryFile,
  };
}