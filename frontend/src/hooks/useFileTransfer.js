import { useCallback, useRef, useState } from 'react';
import {
  FILE_CHUNK_SIZE,
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

/** Yield to the browser so the UI stays responsive during large transfers */
function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function useFileTransfer({ getDataChannel }) {
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);

  const incomingBuffers = useRef(new Map());
  const receiveOrder = useRef([]);
  const acceptResolversRef = useRef(new Map());
  const cancelledRef = useRef(new Set());
  const lastAckSentRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const lastRecvUiUpdateRef = useRef(0);
  const sendSpeedTrackers = useRef(new Map());
  const recvSpeedTrackers = useRef(new Map());
  const retryFileRef = useRef(new Map());

  /* ============================================================
     SEND — sequential, streamed (no full-file arrayBuffer)
  ============================================================ */
  const sendFiles = useCallback(
    async (files) => {
      const dc = getDataChannel();
      if (!dc || dc.readyState !== 'open') {
        console.warn('[send] DataChannel not open');
        return;
      }

      const valid = [];
      for (const file of files) {
        const err = validateFile(file);
        if (err) continue;
        valid.push(file);
      }
      if (valid.length === 0) return;

      // One file at a time: offer → wait accept → stream fully → next
      for (const file of valid) {
        const meta = {
          fileId: generateFileId(),
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        };

        setOutgoing((prev) => [
          ...prev,
          {
            ...meta,
            progress: 0,
            bytesSent: 0,
            speed: 0,
            status: 'waiting',
            direction: 'out',
          },
        ]);

        retryFileRef.current.set(meta.fileId, file);

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
          continue;
        }

        await sendSingleFile(dc, file, meta);
      }
    },
    [getDataChannel]
  );

  /**
   * Stream a file in small slices — never load the whole file into RAM.
   * Progress UI is throttled (~8 updates/sec) so React stays responsive
   * even for multi‑GB transfers.
   */
  const sendSingleFile = async (dc, file, meta) => {
    setOutgoing((prev) =>
      prev.map((f) =>
        f.fileId === meta.fileId ? { ...f, status: 'transferring' } : f
      )
    );

    dc.send(JSON.stringify({ type: 'file-start', ...meta }));

    const total = file.size;
    let offset = 0;
    let chunksSinceYield = 0;

    const tracker = makeSpeedTracker();
    sendSpeedTrackers.current.set(meta.fileId, tracker);
    lastUiUpdateRef.current = 0;

    while (offset < total) {
      if (cancelledRef.current.has(meta.fileId)) {
        try {
          dc.send(JSON.stringify({ type: 'file-cancel', fileId: meta.fileId }));
        } catch {}
        sendSpeedTrackers.current.delete(meta.fileId);
        return;
      }

      if (dc.readyState !== 'open') {
        setOutgoing((prev) =>
          prev.map((f) =>
            f.fileId === meta.fileId ? { ...f, status: 'failed' } : f
          )
        );
        sendSpeedTrackers.current.delete(meta.fileId);
        return;
      }

      if (dc.bufferedAmount > BUFFER_HIGH_WATERMARK) {
        await waitForDrain(dc);
      }

      // Read only the next small slice — never the whole file
      const end = Math.min(offset + FILE_CHUNK_SIZE, total);
      const slice = file.slice(offset, end);
      const chunk = await slice.arrayBuffer();
      dc.send(chunk);
      offset = end;

      const speed = tracker.update(offset);

      // Throttle React state updates to ~8 times per second
      const now = Date.now();
      if (now - lastUiUpdateRef.current > 125 || offset >= total) {
        lastUiUpdateRef.current = now;
        setOutgoing((prev) =>
          prev.map((f) =>
            f.fileId === meta.fileId
              ? { ...f, bytesSent: offset, speed }
              : f
          )
        );
      }

      // Yield to the event loop every ~32 chunks so the UI never freezes
      chunksSinceYield += 1;
      if (chunksSinceYield >= 32) {
        chunksSinceYield = 0;
        await yieldToMain();
      }
    }

    dc.send(JSON.stringify({ type: 'file-complete', fileId: meta.fileId }));
    setOutgoing((prev) =>
      prev.map((f) =>
        f.fileId === meta.fileId
          ? { ...f, status: 'completed', bytesSent: total, progress: 100 }
          : f
      )
    );

    sendSpeedTrackers.current.delete(meta.fileId);
    retryFileRef.current.delete(meta.fileId);
  };

  const waitForDrain = (dc) =>
    new Promise((resolve) => {
      const check = () => {
        if (dc.bufferedAmount <= BUFFER_LOW_WATERMARK) resolve();
        else setTimeout(check, 50);
      };
      check();
    });

  /* ============================================================
     RECEIVE — progress UI also throttled
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
          setIncoming((prev) => [
            ...prev,
            ...msg.files.map((f) => ({
              ...f,
              progress: 0,
              bytesReceived: 0,
              speed: 0,
              status: 'pending',
              direction: 'in',
            })),
          ]);
          return;
        }

        if (msg.type === 'file-progress') {
          const { fileId, received } = msg;
          setOutgoing((prev) =>
            prev.map((f) =>
              f.fileId === fileId ? { ...f, bytesReceived: received } : f
            )
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
                ? { ...f, status: 'completed', blob, progress: 100 }
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
              f.fileId === fileId ? { ...f, status: 'cancelled' } : f
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

      // Binary chunk — always append to the first file in receive order
      const nextFileId = receiveOrder.current[0];
      if (!nextFileId) return;

      const entry = incomingBuffers.current.get(nextFileId);
      if (!entry) {
        receiveOrder.current.shift();
        return;
      }

      const chunk = data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer;
      entry.chunks.push(chunk);
      entry.received += chunk.byteLength || (data.byteLength ?? 0);

      const tracker = recvSpeedTrackers.current.get(nextFileId);
      const speed = tracker ? tracker.update(entry.received) : 0;

      // Throttle receive progress UI (~8 updates/sec)
      const now = Date.now();
      if (now - lastRecvUiUpdateRef.current > 125) {
        lastRecvUiUpdateRef.current = now;
        setIncoming((prev) =>
          prev.map((f) =>
            f.fileId === nextFileId
              ? { ...f, bytesReceived: entry.received, speed }
              : f
          )
        );
      }

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

      setOutgoing((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, status: 'cancelled' } : f
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
          f.fileId === fileId ? { ...f, status: 'cancelled' } : f
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
          if (file && ['waiting', 'transferring'].includes(file.status)) {
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
    setOutgoing([]);
    setIncoming([]);
    incomingBuffers.current.clear();
    receiveOrder.current = [];
    acceptResolversRef.current.clear();
    cancelledRef.current.clear();
    sendSpeedTrackers.current.clear();
    recvSpeedTrackers.current.clear();
    retryFileRef.current.clear();
  }, []);

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

  const markPeerDisconnected = useCallback(() => {
    setOutgoing((prev) =>
      prev.map((f) =>
        ['waiting', 'transferring'].includes(f.status)
          ? { ...f, status: 'failed' }
          : f
      )
    );
    setIncoming((prev) =>
      prev.map((f) =>
        ['pending', 'receiving'].includes(f.status)
          ? { ...f, status: 'failed' }
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
      if (!dc || dc.readyState !== 'open' || !file) return false;

      cancelledRef.current.delete(fileId);
      setOutgoing((prev) =>
        prev.map((f) =>
          f.fileId === fileId
            ? { ...f, status: 'waiting', bytesSent: 0, speed: 0 }
            : f
        )
      );

      const meta = {
        fileId,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      };
      dc.send(JSON.stringify({ type: 'file-offer', files: [meta] }));

      new Promise((resolve) => {
        acceptResolversRef.current.set(fileId, resolve);
        setTimeout(() => {
          if (acceptResolversRef.current.has(fileId)) {
            acceptResolversRef.current.delete(fileId);
            resolve('timeout');
          }
        }, 300000);
      }).then((result) => {
        if (result !== 'accepted') {
          setOutgoing((prev) =>
            prev.map((f) =>
              f.fileId === fileId
                ? {
                    ...f,
                    status: result === 'cancelled' ? 'cancelled' : 'rejected',
                  }
                : f
            )
          );
          return;
        }
        sendSingleFile(dc, file, meta);
      });

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