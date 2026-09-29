// src/hooks/useFileTransfer.js
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FILE_CHUNK_SIZE,
  FILE_READ_BLOCK_SIZE,
  BUFFER_HIGH_WATERMARK,
  BUFFER_LOW_WATERMARK,
} from '../utils/constants';
import { downloadBlob, validateFile } from '../utils/fileUtils';

const ACCEPT_TIMEOUT_MS = 5 * 60 * 1000;
const ACK_INTERVAL_MS = 200;
const RECV_UI_INTERVAL_MS = 125;
const SEND_UI_INTERVAL_MS = 200;

// Adaptive backpressure: keep at most ~0.5s worth of data queued on the
// channel. Slow link -> small backlog -> control messages (offer/cancel)
// are never stuck behind seconds of stale data. Fast link -> window grows
// up to BUFFER_HIGH_WATERMARK, so throughput is not capped.
const MIN_WINDOW_BYTES = 256 * 1024;
const TARGET_BACKLOG_SEC = 0.5;

function getWindowBytes(speedBytesPerSec) {
  const wanted = (speedBytesPerSec || 0) * TARGET_BACKLOG_SEC;
  return Math.min(BUFFER_HIGH_WATERMARK, Math.max(MIN_WINDOW_BYTES, wanted));
}

/* ============================================================
   HELPERS (module level — no React state)
============================================================ */

// Every transfer gets its own unique id (this is the "transferId").
let transferCounter = 0;
function makeTransferId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  transferCounter += 1;
  return `t-${Date.now().toString(36)}-${transferCounter}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * Real throughput = bytes moved / elapsed time over a rolling window.
 * Never derived from FILE_CHUNK_SIZE or from a single chunk.
 */
function makeSpeedTracker(windowMs = 2000, minSampleMs = 100) {
  const samples = [{ t: performance.now(), b: 0 }];
  let speed = 0;

  return {
    update(bytes) {
      const now = performance.now();
      const last = samples[samples.length - 1];
      if (now - last.t < minSampleMs) return speed;

      samples.push({ t: now, b: bytes });

      const cutoff = now - windowMs;
      while (samples.length > 2 && samples[1].t <= cutoff) samples.shift();

      const first = samples[0];
      const dt = (now - first.t) / 1000;
      speed = dt > 0 ? Math.max(0, (bytes - first.b) / dt) : 0;
      return speed;
    },
    get() {
      return speed;
    },
  };
}

function safeSend(dc, payload) {
  if (!dc || dc.readyState !== 'open') return false;
  try {
    dc.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[transfer] send failed:', err);
    return false;
  }
}

/**
 * Backpressure wait. Wakes on: buffer drained below `low` (event, not
 * polling), channel close, OR the transfer being aborted.
 * The 1 s timer is only a safety net; the caller re-checks bufferedAmount.
 */
function waitForDrain(dc, signal, low) {
  return new Promise((resolve) => {
    if (signal.aborted || dc.readyState !== 'open' || dc.bufferedAmount <= low) {
      resolve();
      return;
    }

    let timer;
    const done = () => {
      dc.removeEventListener('bufferedamountlow', done);
      dc.removeEventListener('close', done);
      signal.removeEventListener('abort', done);
      clearTimeout(timer);
      resolve();
    };

    dc.addEventListener('bufferedamountlow', done);
    dc.addEventListener('close', done);
    signal.addEventListener('abort', done);
    timer = setTimeout(done, 1000);
  });
}

/** Wait until everything has left the buffer — abortable. */
function waitForEmpty(dc, signal) {
  return new Promise((resolve) => {
    let timer;
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const check = () => {
      if (signal.aborted || dc.readyState !== 'open' || dc.bufferedAmount === 0) {
        done();
      } else {
        timer = setTimeout(check, 50);
      }
    };
    signal.addEventListener('abort', done);
    check();
  });
}

function readBlock(file, start, total) {
  const end = Math.min(start + FILE_READ_BLOCK_SIZE, total);
  const p = file.slice(start, end).arrayBuffer();
  p.catch(() => {}); // avoid unhandled rejection if we abort before awaiting it
  return p;
}

function makeJob(file, meta) {
  return {
    file,
    meta,
    controller: new AbortController(),
    cancelReason: null, // null | 'local' | 'receiver' | 'disconnected'
    stage: 'idle', // 'idle' | 'offered' | 'streaming'
    resolveDecision: null,
    decisionTimer: null,
  };
}

/** Cancel one transfer: aborts every wait it may be blocked on. */
function cancelJob(job, reason) {
  if (!job || job.cancelReason) return;
  job.cancelReason = reason;
  job.controller.abort();
  if (job.resolveDecision) {
    job.resolveDecision(reason === 'disconnected' ? 'disconnected' : 'cancelled');
  }
}

function waitForDecision(job) {
  return new Promise((resolve) => {
    if (job.cancelReason) {
      resolve(job.cancelReason === 'disconnected' ? 'disconnected' : 'cancelled');
      return;
    }
    job.stage = 'offered';
    job.resolveDecision = (decision) => {
      clearTimeout(job.decisionTimer);
      job.decisionTimer = null;
      job.resolveDecision = null;
      resolve(decision);
    };
    job.decisionTimer = setTimeout(() => {
      if (job.resolveDecision) job.resolveDecision('timeout');
    }, ACCEPT_TIMEOUT_MS);
  });
}

function applyPatch(list, id, patch, onlyFrom) {
  return list.map((f) => {
    if (f.fileId !== id || f.status === 'completed') return f;
    if (onlyFrom && !onlyFrom.includes(f.status)) return f;
    return { ...f, ...patch };
  });
}

/* ============================================================
   HOOK
============================================================ */

/**
 * Transfer lifecycle (all per-transfer, keyed by a unique fileId/transferId):
 *
 *  Sender job:   offer -> (accept | reject | cancel | timeout) -> stream -> complete
 *  Receiver:     offer (pending) -> accept -> file-start -> chunks -> file-complete
 *
 * Nothing here ever touches the RTCPeerConnection / DataChannel lifecycle.
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

  // Always call the latest getDataChannel without re-creating callbacks.
  const getDcRef = useRef(getDataChannel);
  getDcRef.current = getDataChannel;
  const getDc = useCallback(() => getDcRef.current?.() ?? null, []);

  // ---- Sender-side state (per transfer) ----
  const jobsRef = useRef(new Map()); // fileId -> job
  const pendingFilesRef = useRef([]); // queued while channel is down
  const flushingRef = useRef(false);
  const retryFileRef = useRef(new Map()); // fileId -> File
  const sendSpeedTrackers = useRef(new Map());
  const streamChainRef = useRef(Promise.resolve()); // one stream at a time

  // ---- Receiver-side state ----
  const acceptedRef = useRef(new Set()); // ids the user accepted (gate for file-start)
  const activeRecvRef = useRef(null); // { id, size, mimeType, chunks, received, ... }

  const patchOutgoing = useCallback((id, patch, onlyFrom) => {
    setOutgoing((prev) => applyPatch(prev, id, patch, onlyFrom));
  }, []);

  const patchIncoming = useCallback((id, patch, onlyFrom) => {
    setIncoming((prev) => applyPatch(prev, id, patch, onlyFrom));
  }, []);

  /* ============================================================
     SENDER
  ============================================================ */

  const requeueJob = useCallback(
    (job) => {
      const { meta, file } = job;
      if (!pendingFilesRef.current.some((i) => i.meta.fileId === meta.fileId)) {
        pendingFilesRef.current.push({ file, meta });
      }
      patchOutgoing(meta.fileId, {
        status: 'queued',
        bytesSent: 0,
        bytesReceived: 0,
        speed: 0,
      });
    },
    [patchOutgoing]
  );

  // Called when a job stopped because of cancel / disconnect.
  const settleStopped = useCallback(
    (job) => {
      const id = job.meta.fileId;
      if (job.cancelReason === 'disconnected') {
        requeueJob(job);
      } else {
        patchOutgoing(id, { status: 'cancelled', speed: 0 });
        retryFileRef.current.delete(id);
      }
    },
    [requeueJob, patchOutgoing]
  );

  const runExclusive = useCallback((fn) => {
    const run = streamChainRef.current.then(() => fn());
    streamChainRef.current = run.catch(() => {});
    return run;
  }, []);

  /**
   * Streams one file. Every wait inside is abortable through job.controller,
   * so cancellation can never leave this function stuck.
   */
  const streamFile = useCallback(
    async (job) => {
      const { file, meta, controller } = job;
      const id = meta.fileId;
      const dc = getDc();

      if (job.cancelReason) {
        settleStopped(job);
        return;
      }
      if (!dc || dc.readyState !== 'open') {
        job.cancelReason = 'disconnected';
        settleStopped(job);
        return;
      }

      job.stage = 'streaming';
      patchOutgoing(id, {
        status: 'transferring',
        bytesSent: 0,
        bytesReceived: 0,
        speed: 0,
      });

      const tracker = makeSpeedTracker();
      sendSpeedTrackers.current.set(id, tracker);
      const startedAt = performance.now();

      // Adaptive window (see getWindowBytes)
      let high = MIN_WINDOW_BYTES;
      let low = Math.min(BUFFER_LOW_WATERMARK, Math.floor(high / 2));
      dc.bufferedAmountLowThreshold = low;

      if (!safeSend(dc, { type: 'file-start', ...meta })) {
        job.cancelReason = 'disconnected';
        settleStopped(job);
        return;
      }

      const total = file.size;

      const stopped = () => {
        if (job.cancelReason) return true;
        if (dc.readyState !== 'open') {
          job.cancelReason = 'disconnected';
          return true;
        }
        return false;
      };

      try {
        let offset = 0;
        let lastUi = 0;
        // Prefetch: next block is read from disk while this one is being sent.
        let pendingBlock = total > 0 ? readBlock(file, 0, total) : null;

        while (offset < total) {
          if (stopped()) break;

          const blockEnd = Math.min(offset + FILE_READ_BLOCK_SIZE, total);
          const block = await pendingBlock;
          if (stopped()) break;

          pendingBlock = blockEnd < total ? readBlock(file, blockEnd, total) : null;

          for (let i = 0; i < block.byteLength; i += FILE_CHUNK_SIZE) {
            if (stopped()) break;

            // Window follows the measured delivery speed.
            high = getWindowBytes(tracker.get());
            low = Math.min(BUFFER_LOW_WATERMARK, Math.floor(high / 2));

            // Wait ONLY when the buffer is really too full.
            while (dc.bufferedAmount > high) {
              dc.bufferedAmountLowThreshold = low;
              await waitForDrain(dc, controller.signal, low);
              if (stopped()) break;
              high = getWindowBytes(tracker.get());
              low = Math.min(BUFFER_LOW_WATERMARK, Math.floor(high / 2));
            }
            if (stopped()) break;

            const len = Math.min(FILE_CHUNK_SIZE, block.byteLength - i);
            dc.send(new Uint8Array(block, i, len));

            const now = Date.now();
            if (now - lastUi > SEND_UI_INTERVAL_MS) {
              lastUi = now;
              const sent = offset + i + len;
              patchOutgoing(id, { bytesSent: sent }, ['transferring']);
            }
          }

          if (stopped()) break;
          offset = blockEnd;
        }

        if (stopped()) {
          settleStopped(job);
          return;
        }

        safeSend(dc, { type: 'file-complete', fileId: id });
        await waitForEmpty(dc, controller.signal);

        if (job.cancelReason) {
          settleStopped(job);
          return;
        }

        if (dc.readyState !== 'open' && dc.bufferedAmount > 0) {
          patchOutgoing(id, { status: 'failed', speed: 0 });
          return;
        }

        const secs = Math.max((performance.now() - startedAt) / 1000, 0.001);
        console.log(
          `[send] ${meta.name}: ${(total / 1048576).toFixed(1)} MB in ${secs.toFixed(
            1
          )}s = ${(total / 1048576 / secs).toFixed(2)} MB/s`
        );

        patchOutgoing(id, {
          status: 'completed',
          bytesSent: total,
          bytesReceived: total,
          progress: 100,
          speed: 0,
        });
        retryFileRef.current.delete(id);
      } catch (err) {
        console.error('[send] stream error:', err);
        if (dc.readyState !== 'open') {
          job.cancelReason = job.cancelReason || 'disconnected';
          settleStopped(job);
          return;
        }
        safeSend(dc, { type: 'file-cancel', fileId: id }); // let receiver clean up
        patchOutgoing(id, { status: 'failed', speed: 0 });
      }
    },
    [getDc, patchOutgoing, settleStopped]
  );

  /** offer -> wait for decision -> stream. Always cleans up its own state. */
  const runJob = useCallback(
    async (job) => {
      const { meta } = job;
      const id = meta.fileId;
      jobsRef.current.set(id, job);

      try {
        const dc = getDc();
        if (!dc || dc.readyState !== 'open') {
          requeueJob(job);
          return;
        }

        patchOutgoing(id, {
          status: 'waiting',
          bytesSent: 0,
          bytesReceived: 0,
          speed: 0,
        });

        if (!safeSend(dc, { type: 'file-offer', files: [meta] })) {
          requeueJob(job);
          return;
        }

        const decision = await waitForDecision(job);

        if (decision === 'accepted') {
          await runExclusive(() => streamFile(job));
          return;
        }

        if (decision === 'rejected') {
          patchOutgoing(id, { status: 'rejected', speed: 0 });
          retryFileRef.current.delete(id);
          return;
        }

        if (decision === 'timeout') {
          safeSend(getDc(), { type: 'file-cancel', fileId: id });
          patchOutgoing(id, { status: 'failed', speed: 0 });
          return;
        }

        // 'cancelled' | 'disconnected'
        settleStopped(job);
      } catch (err) {
        console.error('[send] transfer error:', err);
        safeSend(getDc(), { type: 'file-cancel', fileId: id });
        patchOutgoing(id, { status: 'failed', speed: 0 });
      } finally {
        if (job.decisionTimer) clearTimeout(job.decisionTimer);
        job.decisionTimer = null;
        job.resolveDecision = null;
        jobsRef.current.delete(id);
        sendSpeedTrackers.current.delete(id);
      }
    },
    [getDc, patchOutgoing, requeueJob, settleStopped, runExclusive, streamFile]
  );

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
          fileId: makeTransferId(),
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        };

        retryFileRef.current.set(meta.fileId, file);

        const dc = getDc();
        const isOpen = Boolean(dc) && dc.readyState === 'open';

        setOutgoing((prev) => [
          ...prev,
          {
            ...meta,
            progress: 0,
            bytesSent: 0,
            bytesReceived: 0,
            speed: 0,
            status: isOpen ? 'waiting' : 'queued',
            direction: 'out',
          },
        ]);

        if (!isOpen) {
          console.warn('[send] DataChannel not open — queueing until it is (re)established');
          pendingFilesRef.current.push({ file, meta });
          continue;
        }

        await runJob(makeJob(file, meta));
      }
    },
    [getDc, runJob]
  );

  const flushPendingFiles = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;

    try {
      while (pendingFilesRef.current.length > 0) {
        const dc = getDc();
        if (!dc || dc.readyState !== 'open') return;

        const { file, meta } = pendingFilesRef.current.shift();
        console.log('[send] Connection back, resuming queued file:', meta.name);
        await runJob(makeJob(file, meta));

        // Job re-queued itself (peer went away again) — stop until next open.
        if (pendingFilesRef.current.some((i) => i.meta.fileId === meta.fileId)) return;
      }
    } finally {
      flushingRef.current = false;
    }
  }, [getDc, runJob]);

  useEffect(() => {
    if (dataChannelOpen) {
      flushPendingFiles();
    }
  }, [dataChannelOpen, flushPendingFiles]);

  // Stop every send loop if the component unmounts.
  useEffect(() => {
    const jobs = jobsRef.current;
    return () => {
      jobs.forEach((job) => cancelJob(job, 'local'));
    };
  }, []);

  /* ============================================================
     RECEIVER: message handling
  ============================================================ */

  const handleIncomingData = useCallback(
    (event) => {
      const data = event.data;

      /* ---------------- control messages ---------------- */
      if (typeof data === 'string') {
        let msg;
        try {
          msg = JSON.parse(data);
        } catch {
          return;
        }
        if (!msg || typeof msg.type !== 'string') return;

        switch (msg.type) {
          // ===== receiver side =====
          case 'file-offer': {
            if (!Array.isArray(msg.files)) return;

            for (const f of msg.files) {
              if (!f || typeof f.fileId !== 'string') continue;
              // A fresh offer always starts from a clean slate for that id.
              acceptedRef.current.delete(f.fileId);
              if (activeRecvRef.current?.id === f.fileId) activeRecvRef.current = null;
            }

            setIncoming((prev) => {
              const next = [...prev];
              for (const f of msg.files) {
                if (!f || typeof f.fileId !== 'string') continue;
                const idx = next.findIndex((x) => x.fileId === f.fileId);
                const entry = {
                  ...f,
                  progress: 0,
                  bytesReceived: 0,
                  speed: 0,
                  status: 'pending',
                  direction: 'in',
                };
                if (idx >= 0) next[idx] = entry;
                else next.push(entry);
              }
              return next;
            });
            return;
          }

          case 'file-start': {
            const id = msg.fileId;
            // Ignore file-start for anything the user did not accept
            // (cancelled / rejected / stale) — prevents zombie transfers.
            if (!acceptedRef.current.has(id)) return;

            const prev = activeRecvRef.current;
            if (prev && prev.id !== id) {
              patchIncoming(prev.id, { status: 'failed', speed: 0 }, ['receiving']);
            }

            activeRecvRef.current = {
              id,
              size: Number(msg.size),
              mimeType: msg.mimeType || 'application/octet-stream',
              chunks: [],
              received: 0,
              lastUi: 0,
              lastAck: 0,
              tracker: makeSpeedTracker(),
            };

            patchIncoming(id, { status: 'receiving', bytesReceived: 0, speed: 0 }, [
              'pending',
              'receiving',
            ]);
            return;
          }

          case 'file-complete': {
            const active = activeRecvRef.current;
            if (!active || active.id !== msg.fileId) return; // stale / cancelled

            activeRecvRef.current = null;
            acceptedRef.current.delete(active.id);

            if (Number.isFinite(active.size) && active.received !== active.size) {
              console.error('[recv] size mismatch', active.received, active.size);
              patchIncoming(active.id, { status: 'failed', speed: 0 });
              return;
            }

            const blob = new Blob(active.chunks, { type: active.mimeType });
            active.chunks = [];

            patchIncoming(active.id, {
              status: 'completed',
              blob,
              progress: 100,
              bytesReceived: active.received,
              speed: 0,
            });
            return;
          }

          case 'file-cancel': {
            // Sender cancelled this transfer.
            const id = msg.fileId;
            acceptedRef.current.delete(id);
            if (activeRecvRef.current?.id === id) activeRecvRef.current = null;
            patchIncoming(id, { status: 'cancelled', speed: 0 });
            return;
          }

          // ===== sender side =====
          case 'file-accept': {
            const job = jobsRef.current.get(msg.fileId);
            if (job && job.stage === 'offered' && job.resolveDecision) {
              job.resolveDecision('accepted');
            }
            return;
          }

          case 'file-reject': {
            const job = jobsRef.current.get(msg.fileId);
            if (job && job.stage === 'offered' && job.resolveDecision) {
              job.resolveDecision('rejected');
            }
            return;
          }

          case 'file-cancel-by-receiver': {
            const job = jobsRef.current.get(msg.fileId);
            if (!job) return; // already finished — nothing to do
            cancelJob(job, 'receiver'); // breaks accept-wait / backpressure wait / send loop
            sendSpeedTrackers.current.delete(msg.fileId);
            patchOutgoing(msg.fileId, { status: 'cancelled', speed: 0 }, [
              'waiting',
              'queued',
              'transferring',
            ]);
            return;
          }

          case 'file-progress': {
            const tracker = sendSpeedTrackers.current.get(msg.fileId);
            if (!tracker) return; // stale ACK from a finished/cancelled transfer
            const received = Number(msg.received) || 0;
            const speed = tracker.update(received);
            setOutgoing((prev) =>
              prev.map((f) =>
                f.fileId === msg.fileId && f.status === 'transferring'
                  ? { ...f, bytesReceived: received, speed }
                  : f
              )
            );
            return;
          }

          default:
            return;
        }
      }

      /* ---------------- binary chunk ---------------- */
      // Chunks belong to the single active transfer. If there is none
      // (cancelled / stale), they are simply dropped.
      const active = activeRecvRef.current;
      if (!active) return;

      let chunk;
      if (data instanceof ArrayBuffer) {
        chunk = data;
      } else if (ArrayBuffer.isView(data)) {
        chunk = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      } else {
        return;
      }

      active.chunks.push(chunk);
      active.received += chunk.byteLength;

      if (Number.isFinite(active.size) && active.received > active.size) {
        // Protocol violation — abort this transfer only.
        const id = active.id;
        activeRecvRef.current = null;
        acceptedRef.current.delete(id);
        safeSend(getDc(), { type: 'file-cancel-by-receiver', fileId: id });
        patchIncoming(id, { status: 'failed', speed: 0 });
        return;
      }

      const speed = active.tracker.update(active.received);
      const now = Date.now();
      const isLast = Number.isFinite(active.size) && active.received >= active.size;

      if (now - active.lastUi > RECV_UI_INTERVAL_MS || isLast) {
        active.lastUi = now;
        patchIncoming(active.id, { bytesReceived: active.received, speed }, ['receiving']);
      }

      // ACK to sender (~5/s) — sender derives its real speed from this.
      if (now - active.lastAck > ACK_INTERVAL_MS) {
        active.lastAck = now;
        safeSend(getDc(), {
          type: 'file-progress',
          fileId: active.id,
          received: active.received,
        });
      }
    },
    [getDc, patchIncoming, patchOutgoing]
  );

  /* ============================================================
     Accept / Reject / Cancel (receiver actions)
  ============================================================ */

  const acceptOffer = useCallback(
    (fileId) => {
      const dc = getDc();
      if (!dc || dc.readyState !== 'open') return;

      acceptedRef.current.add(fileId);
      if (!safeSend(dc, { type: 'file-accept', fileId })) {
        acceptedRef.current.delete(fileId);
        return;
      }
      patchIncoming(fileId, { status: 'receiving', bytesReceived: 0, speed: 0 }, ['pending']);
    },
    [getDc, patchIncoming]
  );

  const rejectOffer = useCallback(
    (fileId) => {
      acceptedRef.current.delete(fileId);
      safeSend(getDc(), { type: 'file-reject', fileId });
      patchIncoming(fileId, { status: 'rejected', speed: 0 }, ['pending']);
    },
    [getDc, patchIncoming]
  );

  const cancelIncoming = useCallback(
    (fileId) => {
      // 1. Stop accepting data for this transfer and drop everything it buffered
      acceptedRef.current.delete(fileId);
      if (activeRecvRef.current?.id === fileId) {
        activeRecvRef.current.chunks = [];
        activeRecvRef.current = null;
      }

      // 2. Tell the sender (channel stays open)
      safeSend(getDc(), { type: 'file-cancel-by-receiver', fileId });

      // 3. Update UI immediately; receiver is idle again
      patchIncoming(fileId, { status: 'cancelled', speed: 0, bytesReceived: 0 }, [
        'pending',
        'receiving',
      ]);
    },
    [getDc, patchIncoming]
  );

  /* ============================================================
     Cancel (sender action)
  ============================================================ */

  const cancelOutgoing = useCallback(
    (fileId) => {
      const job = jobsRef.current.get(fileId);

      pendingFilesRef.current = pendingFilesRef.current.filter(
        (item) => item.meta.fileId !== fileId
      );
      retryFileRef.current.delete(fileId);
      sendSpeedTrackers.current.delete(fileId);

      patchOutgoing(fileId, { status: 'cancelled', speed: 0 }, [
        'waiting',
        'queued',
        'transferring',
      ]);

      if (job) {
        // Notify receiver first (ordered after any chunks already sent),
        // then abort the job so no further chunk is ever sent.
        safeSend(getDc(), { type: 'file-cancel', fileId });
        cancelJob(job, 'local');
      }
    },
    [getDc, patchOutgoing]
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
        const row = incomingRef.current.find((f) => f.fileId === fileId);
        if (row?.status === 'pending') rejectOffer(fileId);
        else if (row?.status === 'receiving') cancelIncoming(fileId);
        setIncoming((prev) => prev.filter((f) => f.fileId !== fileId));
      } else {
        const queued = pendingFilesRef.current.some((i) => i.meta.fileId === fileId);
        if (jobsRef.current.has(fileId) || queued) cancelOutgoing(fileId);
        retryFileRef.current.delete(fileId);
        setOutgoing((prev) => prev.filter((f) => f.fileId !== fileId));
      }
    },
    [rejectOffer, cancelIncoming, cancelOutgoing]
  );

  const clearAll = useCallback(() => {
    // Cancel running/pending transfers first so the other side stops too
    outgoingRef.current
      .filter((f) => ['waiting', 'queued', 'transferring'].includes(f.status))
      .forEach((f) => cancelOutgoing(f.fileId));

    incomingRef.current.forEach((f) => {
      if (f.status === 'pending') rejectOffer(f.fileId);
      else if (f.status === 'receiving') cancelIncoming(f.fileId);
    });

    setOutgoing([]);
    setIncoming([]);

    activeRecvRef.current = null;
    acceptedRef.current.clear();
    sendSpeedTrackers.current.clear();
    retryFileRef.current.clear();
    pendingFilesRef.current = [];
    // jobsRef is NOT cleared: aborted jobs remove themselves when they unwind.
  }, [cancelOutgoing, rejectOffer, cancelIncoming]);

  const clearCompleted = useCallback(() => {
    const done = ['completed', 'rejected', 'cancelled', 'failed'];
    setOutgoing((prev) => prev.filter((f) => !done.includes(f.status)));
    setIncoming((prev) => prev.filter((f) => !done.includes(f.status)));
  }, []);

  /* ============================================================
     Peer disconnect: outgoing files re-queue, incoming fail
  ============================================================ */

  const markPeerDisconnected = useCallback(() => {
    // Each running job unwinds through settleStopped -> re-queued (exactly once)
    jobsRef.current.forEach((job) => cancelJob(job, 'disconnected'));

    setIncoming((prev) =>
      prev.map((f) =>
        ['pending', 'receiving'].includes(f.status)
          ? { ...f, status: 'failed', speed: 0 }
          : f
      )
    );

    activeRecvRef.current = null;
    acceptedRef.current.clear();
    sendSpeedTrackers.current.clear();
  }, []);

  /* ============================================================
     Retry (failed outgoing) — always a brand-new transfer id
  ============================================================ */

  const retryFile = useCallback(
    (fileId) => {
      const file = retryFileRef.current.get(fileId);
      if (!file) return false;

      const newId = makeTransferId();
      retryFileRef.current.delete(fileId);
      retryFileRef.current.set(newId, file);

      const meta = {
        fileId: newId,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      };

      const dc = getDc();
      const isOpen = Boolean(dc) && dc.readyState === 'open';

      setOutgoing((prev) =>
        prev.map((f) =>
          f.fileId === fileId
            ? {
                ...f,
                fileId: newId,
                status: isOpen ? 'waiting' : 'queued',
                bytesSent: 0,
                bytesReceived: 0,
                progress: 0,
                speed: 0,
              }
            : f
        )
      );

      if (!isOpen) {
        pendingFilesRef.current.push({ file, meta });
        return true;
      }

      runJob(makeJob(file, meta));
      return true;
    },
    [getDc, runJob]
  );

  return {
    outgoing,
    incoming,
    sendFiles,
    handleIncomingData,
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