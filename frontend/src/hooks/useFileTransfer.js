// src/hooks/useFileTransfer.js

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  FILE_CHUNK_SIZE,
  FILE_READ_BLOCK_SIZE,
  BUFFER_HIGH_WATERMARK,
  BUFFER_LOW_WATERMARK,
} from '../utils/constants';

import {
  downloadBlob,
  validateFile,
} from '../utils/fileUtils';

import { playSound } from '../utils/soundManager';

/* ============================================================
   CONFIG
============================================================ */

const ACCEPT_TIMEOUT_MS = 5 * 60 * 1000;

/*
 * Receiver ACK -> sender.
 * ACK is used for sender-side speed information.
 */
const ACK_INTERVAL_MS = 200;

/*
 * UI is updated frequently enough to look live,
 * but not once per every tiny chunk.
 */
const RECV_UI_INTERVAL_MS = 50;
const SEND_UI_INTERVAL_MS = 50;

/*
 * Adaptive backpressure.
 */
const MIN_WINDOW_BYTES = 256 * 1024;
const TARGET_BACKLOG_SEC = 0.5;

/* ============================================================
   ADAPTIVE WINDOW
============================================================ */

function getWindowBytes(speedBytesPerSec) {
  const wanted =
    (speedBytesPerSec || 0) *
    TARGET_BACKLOG_SEC;

  return Math.min(
    BUFFER_HIGH_WATERMARK,
    Math.max(
      MIN_WINDOW_BYTES,
      wanted
    )
  );
}

/* ============================================================
   TRANSFER ID
============================================================ */

let transferCounter = 0;

function makeTransferId() {
  try {
    if (
      typeof crypto !== 'undefined' &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }
  } catch {}

  transferCounter += 1;

  return `t-${Date.now().toString(36)}-${transferCounter}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* ============================================================
   SPEED TRACKER
============================================================ */

function makeSpeedTracker(
  windowMs = 2000,
  minSampleMs = 50
) {
  const samples = [
    {
      t: performance.now(),
      b: 0,
    },
  ];

  let speed = 0;

  return {
    update(bytes) {
      const now = performance.now();

      const last =
        samples[samples.length - 1];

      if (
        now - last.t <
        minSampleMs
      ) {
        return speed;
      }

      samples.push({
        t: now,
        b: bytes,
      });

      const cutoff =
        now - windowMs;

      while (
        samples.length > 2 &&
        samples[1].t <= cutoff
      ) {
        samples.shift();
      }

      const first =
        samples[0];

      const dt =
        (now - first.t) / 1000;

      speed =
        dt > 0
          ? Math.max(
              0,
              (bytes - first.b) / dt
            )
          : 0;

      return speed;
    },

    get() {
      return speed;
    },
  };
}

/* ============================================================
   SAFE SEND
============================================================ */

function safeSend(
  dc,
  payload
) {
  if (
    !dc ||
    dc.readyState !== 'open'
  ) {
    return false;
  }

  try {
    dc.send(
      typeof payload === 'string'
        ? payload
        : JSON.stringify(payload)
    );

    return true;
  } catch (error) {
    console.warn(
      '[transfer] send failed:',
      error
    );

    return false;
  }
}

/* ============================================================
   BACKPRESSURE
============================================================ */

function waitForDrain(
  dc,
  signal,
  low
) {
  return new Promise(
    (resolve) => {
      if (
        signal.aborted ||
        dc.readyState !== 'open' ||
        dc.bufferedAmount <= low
      ) {
        resolve();
        return;
      }

      let timer;

      const done = () => {
        dc.removeEventListener(
          'bufferedamountlow',
          done
        );

        dc.removeEventListener(
          'close',
          done
        );

        signal.removeEventListener(
          'abort',
          done
        );

        clearTimeout(timer);

        resolve();
      };

      dc.addEventListener(
        'bufferedamountlow',
        done
      );

      dc.addEventListener(
        'close',
        done
      );

      signal.addEventListener(
        'abort',
        done
      );

      timer = setTimeout(
        done,
        1000
      );
    }
  );
}

/* ============================================================
   WAIT FOR EMPTY BUFFER
============================================================ */

function waitForEmpty(
  dc,
  signal
) {
  return new Promise(
    (resolve) => {
      let timer;

      const done = () => {
        clearTimeout(timer);

        signal.removeEventListener(
          'abort',
          done
        );

        resolve();
      };

      const check = () => {
        if (
          signal.aborted ||
          dc.readyState !== 'open' ||
          dc.bufferedAmount === 0
        ) {
          done();
        } else {
          timer = setTimeout(
            check,
            30
          );
        }
      };

      signal.addEventListener(
        'abort',
        done
      );

      check();
    }
  );
}

/* ============================================================
   FILE BLOCK READER
============================================================ */

function readBlock(
  file,
  start,
  total
) {
  const end = Math.min(
    start + FILE_READ_BLOCK_SIZE,
    total
  );

  return file
    .slice(start, end)
    .arrayBuffer();
}

/* ============================================================
   TRANSFER JOB
============================================================ */

function makeJob(
  file,
  meta
) {
  return {
    file,
    meta,

    controller:
      new AbortController(),

    cancelReason: null,

    stage: 'idle',

    resolveDecision: null,

    decisionTimer: null,
  };
}

/* ============================================================
   CANCEL JOB
============================================================ */

function cancelJob(
  job,
  reason
) {
  if (
    !job ||
    job.cancelReason
  ) {
    return;
  }

  job.cancelReason = reason;

  job.controller.abort();

  if (job.resolveDecision) {
    job.resolveDecision(
      reason === 'disconnected'
        ? 'disconnected'
        : 'cancelled'
    );
  }
}

/* ============================================================
   WAIT FOR RECEIVER DECISION
============================================================ */

function waitForDecision(
  job
) {
  return new Promise(
    (resolve) => {
      if (job.cancelReason) {
        resolve(
          job.cancelReason ===
            'disconnected'
            ? 'disconnected'
            : 'cancelled'
        );

        return;
      }

      job.stage =
        'offered';

      job.resolveDecision = (
        decision
      ) => {
        clearTimeout(
          job.decisionTimer
        );

        job.decisionTimer =
          null;

        job.resolveDecision =
          null;

        resolve(decision);
      };

      job.decisionTimer =
        setTimeout(() => {
          if (
            job.resolveDecision
          ) {
            job.resolveDecision(
              'timeout'
            );
          }
        }, ACCEPT_TIMEOUT_MS);
    }
  );
}

/* ============================================================
   PATCH HELPER
============================================================ */

function applyPatch(
  list,
  id,
  patch,
  onlyFrom
) {
  return list.map(
    (file) => {
      if (
        file.fileId !== id ||
        file.status === 'completed'
      ) {
        return file;
      }

      if (
        onlyFrom &&
        !onlyFrom.includes(
          file.status
        )
      ) {
        return file;
      }

      return {
        ...file,
        ...patch,
      };
    }
  );
}

/* ============================================================
   HOOK
============================================================ */

export function useFileTransfer({
  getDataChannel,
  dataChannelOpen,
}) {
  const [outgoing, setOutgoing] =
    useState([]);

  const [incoming, setIncoming] =
    useState([]);

  const outgoingRef =
    useRef([]);

  const incomingRef =
    useRef([]);

  useEffect(() => {
    outgoingRef.current =
      outgoing;
  }, [outgoing]);

  useEffect(() => {
    incomingRef.current =
      incoming;
  }, [incoming]);

  /* ============================================================
     DATA CHANNEL ACCESS
  ============================================================ */

  const getDcRef =
    useRef(getDataChannel);

  getDcRef.current =
    getDataChannel;

  const getDc =
    useCallback(
      () =>
        getDcRef.current?.() ??
        null,
      []
    );

  /* ============================================================
     SENDER STATE
  ============================================================ */

  const jobsRef =
    useRef(new Map());

  const pendingFilesRef =
    useRef([]);

  const flushingRef =
    useRef(false);

  const retryFileRef =
    useRef(new Map());

  const sendSpeedTrackers =
    useRef(new Map());

  /*
   * Actual binary streams must remain serialized.
   *
   * Offers/decisions can happen in parallel,
   * but chunks from different files must NOT
   * interleave on the same DataChannel.
   */
  const streamChainRef =
    useRef(Promise.resolve());

  /* ============================================================
     RECEIVER STATE
  ============================================================ */

  const acceptedRef =
    useRef(new Set());

  /*
   * Only one actual binary stream at a time.
   *
   * Multiple incoming offers can still remain
   * pending/accepted simultaneously.
   */
  const activeRecvRef =
    useRef(null);

  /* ============================================================
     PATCH OUTGOING
  ============================================================ */

  const patchOutgoing =
    useCallback(
      (
        id,
        patch,
        onlyFrom
      ) => {
        setOutgoing(
          (prev) =>
            applyPatch(
              prev,
              id,
              patch,
              onlyFrom
            )
        );
      },
      []
    );

  /* ============================================================
     PATCH INCOMING
  ============================================================ */

  const patchIncoming =
    useCallback(
      (
        id,
        patch,
        onlyFrom
      ) => {
        setIncoming(
          (prev) =>
            applyPatch(
              prev,
              id,
              patch,
              onlyFrom
            )
        );
      },
      []
    );

  /* ============================================================
     REQUEUE JOB
  ============================================================ */

  const requeueJob =
    useCallback(
      (job) => {
        const {
          meta,
          file,
        } = job;

        if (
          !pendingFilesRef.current.some(
            (item) =>
              item.meta.fileId ===
              meta.fileId
          )
        ) {
          pendingFilesRef.current.push({
            file,
            meta,
          });
        }

        patchOutgoing(
          meta.fileId,
          {
            status: 'queued',
            bytesSent: 0,
            bytesReceived: 0,
            progress: 0,
            speed: 0,
          }
        );
      },
      [patchOutgoing]
    );

  /* ============================================================
     STOPPED TRANSFER
  ============================================================ */

  const settleStopped =
    useCallback(
      (job) => {
        const id =
          job.meta.fileId;

        if (
          job.cancelReason ===
          'disconnected'
        ) {
          requeueJob(job);
        } else {
          patchOutgoing(
            id,
            {
              status: 'cancelled',
              speed: 0,
            }
          );

          retryFileRef.current.delete(
            id
          );
        }
      },
      [
        requeueJob,
        patchOutgoing,
      ]
    );

  /* ============================================================
     EXCLUSIVE BINARY STREAM
  ============================================================ */

  const runExclusive =
    useCallback(
      (fn) => {
        const run =
          streamChainRef.current.then(
            () => fn()
          );

        streamChainRef.current =
          run.catch(() => {});

        return run;
      },
      []
    );

  /* ============================================================
     STREAM FILE
  ============================================================ */

  const streamFile =
    useCallback(
      async (job) => {
        const {
          file,
          meta,
          controller,
        } = job;

        const id =
          meta.fileId;

        const dc =
          getDc();

        if (
          job.cancelReason
        ) {
          settleStopped(job);
          return;
        }

        if (
          !dc ||
          dc.readyState !== 'open'
        ) {
          job.cancelReason =
            'disconnected';

          settleStopped(job);
          return;
        }

        job.stage =
          'streaming';

        patchOutgoing(
          id,
          {
            status: 'transferring',
            bytesSent: 0,
            bytesReceived: 0,
            progress: 0,
            speed: 0,
          }
        );

        const tracker =
          makeSpeedTracker();

        sendSpeedTrackers.current.set(
          id,
          tracker
        );

        const startedAt =
          performance.now();

        let high =
          MIN_WINDOW_BYTES;

        let low =
          Math.min(
            BUFFER_LOW_WATERMARK,
            Math.floor(
              high / 2
            )
          );

        dc.bufferedAmountLowThreshold =
          low;

        /* ======================================================
           FILE START
        ====================================================== */

        const fileStartSent =
          safeSend(
            dc,
            {
              type: 'file-start',
              ...meta,
            }
          );

        if (!fileStartSent) {
          job.cancelReason =
            'disconnected';

          settleStopped(job);
          return;
        }

        /*
         * Actual file transfer has started.
         */
        playSound('send');

        const total =
          Number(file.size) || 0;

        const stopped = () => {
          if (
            job.cancelReason
          ) {
            return true;
          }

          if (
            dc.readyState !==
            'open'
          ) {
            job.cancelReason =
              'disconnected';

            return true;
          }

          return false;
        };

        try {
          let offset = 0;
          let lastUi = 0;

          let pendingBlock =
            total > 0
              ? readBlock(
                  file,
                  0,
                  total
                )
              : null;

          /*
           * Empty file.
           */
          if (total === 0) {
            patchOutgoing(
              id,
              {
                bytesSent: 0,
                progress: 100,
              },
              ['transferring']
            );
          }

          while (
            offset < total
          ) {
            if (stopped()) {
              break;
            }

            const blockEnd =
              Math.min(
                offset +
                  FILE_READ_BLOCK_SIZE,
                total
              );

            const block =
              await pendingBlock;

            if (stopped()) {
              break;
            }

            pendingBlock =
              blockEnd < total
                ? readBlock(
                    file,
                    blockEnd,
                    total
                  )
                : null;

            for (
              let i = 0;
              i < block.byteLength;
              i += FILE_CHUNK_SIZE
            ) {
              if (stopped()) {
                break;
              }

              high =
                getWindowBytes(
                  tracker.get()
                );

              low =
                Math.min(
                  BUFFER_LOW_WATERMARK,
                  Math.floor(
                    high / 2
                  )
                );

              while (
                dc.bufferedAmount >
                high
              ) {
                dc.bufferedAmountLowThreshold =
                  low;

                await waitForDrain(
                  dc,
                  controller.signal,
                  low
                );

                if (stopped()) {
                  break;
                }

                high =
                  getWindowBytes(
                    tracker.get()
                  );

                low =
                  Math.min(
                    BUFFER_LOW_WATERMARK,
                    Math.floor(
                      high / 2
                    )
                  );
              }

              if (stopped()) {
                break;
              }

              const len =
                Math.min(
                  FILE_CHUNK_SIZE,
                  block.byteLength -
                    i
                );

              try {
                dc.send(
                  new Uint8Array(
                    block,
                    i,
                    len
                  )
                );
              } catch (error) {
                console.error(
                  '[send] Chunk send failed:',
                  error
                );

                job.cancelReason =
                  'disconnected';

                break;
              }

              /*
               * IMPORTANT:
               * Local sender progress is updated
               * immediately after dc.send().
               */
              const sent =
                Math.min(
                  total,
                  offset +
                    i +
                    len
                );

              /*
               * Update local speed tracker
               * using ACTUAL sent bytes.
               */
              const speed =
                tracker.update(
                  sent
                );

              const now =
                Date.now();

              /*
               * Update UI frequently enough
               * to visibly move the progress bar.
               */
              if (
                now - lastUi >=
                  SEND_UI_INTERVAL_MS ||
                sent >= total
              ) {
                lastUi = now;

                const progress =
                  total > 0
                    ? Math.min(
                        100,
                        (sent /
                          total) *
                          100
                      )
                    : 100;

                patchOutgoing(
                  id,
                  {
                    bytesSent:
                      sent,

                    progress,

                    speed,
                  },
                  ['transferring']
                );
              }
            }

            if (stopped()) {
              break;
            }

            offset =
              blockEnd;
          }

          if (stopped()) {
            settleStopped(job);
            return;
          }

          /* ======================================================
             FILE COMPLETE
          ====================================================== */

          const completeSent =
            safeSend(
              dc,
              {
                type:
                  'file-complete',

                fileId:
                  id,
              }
            );

          if (!completeSent) {
            job.cancelReason =
              'disconnected';

            settleStopped(job);
            return;
          }

          /*
           * Wait until all binary data + file-complete
           * has left the local DataChannel buffer.
           */
          await waitForEmpty(
            dc,
            controller.signal
          );

          if (
            job.cancelReason
          ) {
            settleStopped(job);
            return;
          }

          if (
            dc.readyState !==
              'open' &&
            dc.bufferedAmount > 0
          ) {
            patchOutgoing(
              id,
              {
                status:
                  'failed',

                speed: 0,
              }
            );

            return;
          }

          const secs =
            Math.max(
              (performance.now() -
                startedAt) /
                1000,
              0.001
            );

          console.log(
            `[send] ${meta.name}: ${(total / 1048576).toFixed(
              1
            )} MB in ${secs.toFixed(
              1
            )}s = ${(total / 1048576 / secs).toFixed(
              2
            )} MB/s`
          );

          /*
           * ALWAYS force final 100%.
           */
          patchOutgoing(
            id,
            {
              status:
                'completed',

              bytesSent:
                total,

              bytesReceived:
                total,

              progress:
                100,

              speed:
                0,
            }
          );

          retryFileRef.current.delete(
            id
          );
        } catch (error) {
          console.error(
            '[send] stream error:',
            error
          );

          if (
            dc.readyState !==
            'open'
          ) {
            job.cancelReason =
              job.cancelReason ||
              'disconnected';

            settleStopped(job);
            return;
          }

          safeSend(
            dc,
            {
              type:
                'file-cancel',

              fileId:
                id,
            }
          );

          patchOutgoing(
            id,
            {
              status:
                'failed',

              speed:
                0,
            }
          );
        }
      },
      [
        getDc,
        patchOutgoing,
        settleStopped,
      ]
    );

  /* ============================================================
     RUN SEND JOB
     
     IMPORTANT:
     - Offer is sent immediately.
     - Function does NOT need to be awaited by sendFiles().
     - Multiple receiver decisions can happen in parallel.
     - Actual binary streams remain serialized by runExclusive().
  ============================================================ */

  const runJob =
    useCallback(
      async (job) => {
        const {
          meta,
        } = job;

        const id =
          meta.fileId;

        jobsRef.current.set(
          id,
          job
        );

        try {
          const dc =
            getDc();

          if (
            !dc ||
            dc.readyState !==
              'open'
          ) {
            requeueJob(job);
            return;
          }

          patchOutgoing(
            id,
            {
              status:
                'waiting',

              bytesSent:
                0,

              bytesReceived:
                0,

              progress:
                0,

              speed:
                0,
            }
          );

          /*
           * Send offer immediately.
           *
           * This allows:
           * File A
           * File B
           * File C
           *
           * to all appear on receiver side.
           */
          const offerSent =
            safeSend(
              dc,
              {
                type:
                  'file-offer',

                files: [
                  meta,
                ],
              }
            );

          if (!offerSent) {
            requeueJob(job);
            return;
          }

          /*
           * Wait for receiver decision.
           *
           * Other files can independently
           * wait for their own decisions.
           */
          const decision =
            await waitForDecision(
              job
            );

          if (
            decision ===
            'accepted'
          ) {
            /*
             * Only binary transfer is exclusive.
             *
             * Therefore multiple accepted files
             * are queued safely.
             */
            await runExclusive(
              () =>
                streamFile(job)
            );

            return;
          }

          if (
            decision ===
            'rejected'
          ) {
            patchOutgoing(
              id,
              {
                status:
                  'rejected',

                speed:
                  0,
              }
            );

            retryFileRef.current.delete(
              id
            );

            return;
          }

          if (
            decision ===
            'timeout'
          ) {
            safeSend(
              getDc(),
              {
                type:
                  'file-cancel',

                fileId:
                  id,
              }
            );

            patchOutgoing(
              id,
              {
                status:
                  'failed',

                speed:
                  0,
              }
            );

            return;
          }

          /*
           * cancelled / disconnected
           */
          settleStopped(job);
        } catch (error) {
          console.error(
            '[send] transfer error:',
            error
          );

          safeSend(
            getDc(),
            {
              type:
                'file-cancel',

              fileId:
                id,
            }
          );

          patchOutgoing(
            id,
            {
              status:
                'failed',

              speed:
                0,
            }
          );
        } finally {
          if (
            job.decisionTimer
          ) {
            clearTimeout(
              job.decisionTimer
            );
          }

          job.decisionTimer =
            null;

          job.resolveDecision =
            null;

          jobsRef.current.delete(
            id
          );

          sendSpeedTrackers.current.delete(
            id
          );
        }
      },
      [
        getDc,
        patchOutgoing,
        requeueJob,
        settleStopped,
        runExclusive,
        streamFile,
      ]
    );

  /* ============================================================
     SEND FILES
     
     IMPORTANT:
     DO NOT await runJob().
     
     All offers are sent immediately.
  ============================================================ */

  const sendFiles =
    useCallback(
      async (files) => {
        const valid = [];

        for (
          const file of files
        ) {
          const error =
            validateFile(file);

          if (error) {
            console.warn(
              '[send] Invalid file:',
              file?.name,
              error
            );

            continue;
          }

          valid.push(file);
        }

        if (
          valid.length === 0
        ) {
          return;
        }

        const dc =
          getDc();

        const isOpen =
          Boolean(dc) &&
          dc.readyState ===
            'open';

        /*
         * First create ALL outgoing entries.
         *
         * This makes the UI immediately show
         * the complete selected batch.
         */
        const newEntries = [];

        const immediateJobs = [];

        for (
          const file of valid
        ) {
          const meta = {
            fileId:
              makeTransferId(),

            name:
              file.name,

            size:
              file.size,

            mimeType:
              file.type ||
              'application/octet-stream',
          };

          retryFileRef.current.set(
            meta.fileId,
            file
          );

          newEntries.push({
            ...meta,

            progress:
              0,

            bytesSent:
              0,

            bytesReceived:
              0,

            speed:
              0,

            status:
              isOpen
                ? 'waiting'
                : 'queued',

            direction:
              'out',
          });

          if (isOpen) {
            immediateJobs.push({
              file,
              meta,
            });
          } else {
            pendingFilesRef.current.push({
              file,
              meta,
            });
          }
        }

        setOutgoing(
          (prev) => [
            ...prev,
            ...newEntries,
          ]
        );

        /*
         * IMPORTANT:
         * Start ALL offer jobs without await.
         *
         * This means receiver gets all offers.
         */
        if (isOpen) {
          for (
            const item of
              immediateJobs
          ) {
            void runJob(
              makeJob(
                item.file,
                item.meta
              )
            );
          }
        } else {
          console.warn(
            '[send] DataChannel not open — files queued.'
          );
        }
      },
      [
        getDc,
        runJob,
      ]
    );

  /* ============================================================
     FLUSH QUEUED FILES
  ============================================================ */

  const flushPendingFiles =
    useCallback(
      async () => {
        if (
          flushingRef.current
        ) {
          return;
        }

        flushingRef.current =
          true;

        try {
          while (
            pendingFilesRef.current
              .length > 0
          ) {
            const dc =
              getDc();

            if (
              !dc ||
              dc.readyState !==
                'open'
            ) {
              return;
            }

            /*
             * Take all currently queued files
             * as a batch.
             */
            const batch =
              pendingFilesRef.current.splice(
                0
              );

            console.log(
              `[send] Connection back, sending ${batch.length} queued file offer(s).`
            );

            for (
              const item of batch
            ) {
              /*
               * Do NOT await.
               *
               * All queued offers should reach
               * receiver immediately.
               */
              void runJob(
                makeJob(
                  item.file,
                  item.meta
                )
              );
            }
          }
        } finally {
          flushingRef.current =
            false;
        }
      },
      [
        getDc,
        runJob,
      ]
    );

  /* ============================================================
     CHANNEL OPEN -> FLUSH QUEUE
  ============================================================ */

  useEffect(() => {
    if (
      dataChannelOpen
    ) {
      flushPendingFiles();
    }
  }, [
    dataChannelOpen,
    flushPendingFiles,
  ]);

  /* ============================================================
     UNMOUNT
  ============================================================ */

  useEffect(() => {
    const jobs =
      jobsRef.current;

    return () => {
      jobs.forEach(
        (job) => {
          cancelJob(
            job,
            'local'
          );
        }
      );
    };
  }, []);

  /* ============================================================
     RECEIVER - INCOMING DATA
  ============================================================ */

  const handleIncomingData =
    useCallback(
      (event) => {
        const data =
          event.data;

        /* ======================================================
           CONTROL MESSAGE
        ====================================================== */

        if (
          typeof data ===
          'string'
        ) {
          let msg;

          try {
            msg =
              JSON.parse(data);
          } catch {
            return;
          }

          if (
            !msg ||
            typeof msg.type !==
              'string'
          ) {
            return;
          }

          switch (
            msg.type
          ) {
            /* ==================================================
               FILE OFFER
            ================================================== */

            case 'file-offer': {
              if (
                !Array.isArray(
                  msg.files
                )
              ) {
                return;
              }

              setIncoming(
                (prev) => {
                  const next =
                    [...prev];

                  for (
                    const file of
                      msg.files
                  ) {
                    if (
                      !file ||
                      typeof file.fileId !==
                        'string'
                    ) {
                      continue;
                    }

                    /*
                     * IMPORTANT:
                     * Do NOT reject a new offer just because
                     * another file is pending/receiving.
                     *
                     * Multiple offers must remain visible.
                     */

                    const existingIndex =
                      next.findIndex(
                        (item) =>
                          item.fileId ===
                          file.fileId
                      );

                    if (
                      existingIndex >=
                      0
                    ) {
                      /*
                       * Do not reset an already
                       * active transfer.
                       */
                      const existing =
                        next[
                          existingIndex
                        ];

                      if (
                        [
                          'receiving',
                          'completed',
                        ].includes(
                          existing.status
                        )
                      ) {
                        continue;
                      }

                      next[
                        existingIndex
                      ] = {
                        ...existing,
                        ...file,
                      };

                      continue;
                    }

                    next.push({
                      ...file,

                      progress:
                        0,

                      bytesReceived:
                        0,

                      speed:
                        0,

                      status:
                        'pending',

                      direction:
                        'in',
                    });
                  }

                  return next;
                }
              );

              return;
            }

            /* ==================================================
               FILE START
            ================================================== */

            case 'file-start': {
              const id =
                msg.fileId;

              /*
               * User must have accepted this file.
               */
              if (
                !acceptedRef.current.has(
                  id
                )
              ) {
                return;
              }

              /*
               * Sender streams files sequentially.
               *
               * If another stream is somehow active,
               * mark that old stream failed rather than
               * corrupting its data.
               */
              const previous =
                activeRecvRef.current;

              if (
                previous &&
                previous.id !== id
              ) {
                patchIncoming(
                  previous.id,
                  {
                    status:
                      'failed',

                    speed:
                      0,
                  },
                  [
                    'receiving',
                  ]
                );

                previous.chunks =
                  [];
              }

              activeRecvRef.current =
                {
                  id,

                  size:
                    Number(
                      msg.size
                    ),

                  mimeType:
                    msg.mimeType ||
                    'application/octet-stream',

                  chunks: [],

                  received:
                    0,

                  lastUi:
                    0,

                  lastAck:
                    0,

                  tracker:
                    makeSpeedTracker(),
                };

              patchIncoming(
                id,
                {
                  status:
                    'receiving',

                  bytesReceived:
                    0,

                  progress:
                    0,

                  speed:
                    0,
                },
                [
                  'pending',
                  'receiving',
                ]
              );

              return;
            }

            /* ==================================================
               FILE COMPLETE
            ================================================== */

            case 'file-complete': {
              const active =
                activeRecvRef.current;

              if (
                !active ||
                active.id !==
                  msg.fileId
              ) {
                return;
              }

              activeRecvRef.current =
                null;

              acceptedRef.current.delete(
                active.id
              );

              /*
               * Validate final size.
               */
              if (
                Number.isFinite(
                  active.size
                ) &&
                active.received !==
                  active.size
              ) {
                console.error(
                  '[recv] size mismatch',
                  active.received,
                  active.size
                );

                patchIncoming(
                  active.id,
                  {
                    status:
                      'failed',

                    speed:
                      0,
                  }
                );

                active.chunks =
                  [];

                return;
              }

              try {
                const blob =
                  new Blob(
                    active.chunks,
                    {
                      type:
                        active.mimeType,
                    }
                  );

                const receivedBytes =
                  active.received;

                active.chunks =
                  [];

                patchIncoming(
                  active.id,
                  {
                    status:
                      'completed',

                    blob,

                    progress:
                      100,

                    bytesReceived:
                      receivedBytes,

                    speed:
                      0,
                  }
                );

                /*
                 * Sound ONLY after successful completion.
                 */
                playSound(
                  'received'
                );
              } catch (error) {
                console.error(
                  '[recv] Blob creation failed:',
                  error
                );

                active.chunks =
                  [];

                patchIncoming(
                  active.id,
                  {
                    status:
                      'failed',

                    speed:
                      0,
                  }
                );
              }

              return;
            }

            /* ==================================================
               FILE CANCEL
            ================================================== */

            case 'file-cancel': {
              const id =
                msg.fileId;

              acceptedRef.current.delete(
                id
              );

              if (
                activeRecvRef.current
                  ?.id ===
                id
              ) {
                activeRecvRef.current.chunks =
                  [];

                activeRecvRef.current =
                  null;
              }

              patchIncoming(
                id,
                {
                  status:
                    'cancelled',

                  speed:
                    0,
                }
              );

              return;
            }

            /* ==================================================
               FILE ACCEPT
            ================================================== */

            case 'file-accept': {
              const job =
                jobsRef.current.get(
                  msg.fileId
                );

              if (
                job &&
                job.stage ===
                  'offered' &&
                job.resolveDecision
              ) {
                job.resolveDecision(
                  'accepted'
                );
              }

              return;
            }

            /* ==================================================
               FILE REJECT
            ================================================== */

            case 'file-reject': {
              const job =
                jobsRef.current.get(
                  msg.fileId
                );

              if (
                job &&
                job.stage ===
                  'offered' &&
                job.resolveDecision
              ) {
                job.resolveDecision(
                  'rejected'
                );
              }

              return;
            }

            /* ==================================================
               RECEIVER CANCELLED
            ================================================== */

            case 'file-cancel-by-receiver': {
              const job =
                jobsRef.current.get(
                  msg.fileId
                );

              if (!job) {
                return;
              }

              cancelJob(
                job,
                'receiver'
              );

              sendSpeedTrackers.current.delete(
                msg.fileId
              );

              patchOutgoing(
                msg.fileId,
                {
                  status:
                    'cancelled',

                  speed:
                    0,
                },
                [
                  'waiting',
                  'queued',
                  'transferring',
                ]
              );

              return;
            }

            /* ==================================================
               FILE PROGRESS ACK
            ================================================== */

            case 'file-progress': {
              const tracker =
                sendSpeedTrackers.current.get(
                  msg.fileId
                );

              if (!tracker) {
                return;
              }

              const received =
                Math.max(
                  0,
                  Number(
                    msg.received
                  ) || 0
                );

              const outgoingFile =
                outgoingRef.current.find(
                  (file) =>
                    file.fileId ===
                    msg.fileId
                );

              if (
                !outgoingFile
              ) {
                return;
              }

              const speed =
                tracker.update(
                  Math.min(
                    outgoingFile.size,
                    received
                  )
                );

              const progress =
                outgoingFile.size >
                0
                  ? Math.min(
                      100,
                      (received /
                        outgoingFile.size) *
                        100
                    )
                  : 0;

              setOutgoing(
                (prev) =>
                  prev.map(
                    (file) =>
                      file.fileId ===
                        msg.fileId &&
                      file.status ===
                        'transferring'
                        ? {
                            ...file,

                            bytesReceived:
                              received,

                            speed,

                            /*
                             * Receiver ACK progress
                             * can also be shown.
                             *
                             * Local bytesSent remains
                             * the actual send progress.
                             */
                            remoteProgress:
                              progress,
                          }
                        : file
                  )
              );

              return;
            }

            default:
              return;
          }
        }

        /* ======================================================
           BINARY CHUNK
        ====================================================== */

        const active =
          activeRecvRef.current;

        if (!active) {
          return;
        }

        let chunk;

        if (
          data instanceof
          ArrayBuffer
        ) {
          chunk =
            data;
        } else if (
          ArrayBuffer.isView(
            data
          )
        ) {
          chunk =
            data.buffer.slice(
              data.byteOffset,
              data.byteOffset +
                data.byteLength
            );
        } else {
          return;
        }

        active.chunks.push(
          chunk
        );

        active.received +=
          chunk.byteLength;

        /*
         * Sender sent more than expected.
         */
        if (
          Number.isFinite(
            active.size
          ) &&
          active.received >
            active.size
        ) {
          const id =
            active.id;

          active.chunks =
            [];

          activeRecvRef.current =
            null;

          acceptedRef.current.delete(
            id
          );

          safeSend(
            getDc(),
            {
              type:
                'file-cancel-by-receiver',

              fileId:
                id,
            }
          );

          patchIncoming(
            id,
            {
              status:
                'failed',

              speed:
                0,
            }
          );

          return;
        }

        const speed =
          active.tracker.update(
            active.received
          );

        const now =
          Date.now();

        const isLast =
          Number.isFinite(
            active.size
          ) &&
          active.received >=
            active.size;

        /*
         * LIVE RECEIVING PROGRESS.
         */
        if (
          now -
            active.lastUi >=
            RECV_UI_INTERVAL_MS ||
          isLast
        ) {
          active.lastUi =
            now;

          const progress =
            active.size > 0
              ? Math.min(
                  100,
                  (active.received /
                    active.size) *
                    100
                )
              : 0;

          patchIncoming(
            active.id,
            {
              bytesReceived:
                active.received,

              progress,

              speed,
            },
            [
              'receiving',
            ]
          );
        }

        /*
         * ACK approximately every 200ms.
         */
        if (
          now -
            active.lastAck >=
            ACK_INTERVAL_MS ||
          isLast
        ) {
          active.lastAck =
            now;

          safeSend(
            getDc(),
            {
              type:
                'file-progress',

              fileId:
                active.id,

              received:
                active.received,
            }
          );
        }
      },
      [
        getDc,
        patchIncoming,
        patchOutgoing,
      ]
    );

  /* ============================================================
     ACCEPT OFFER
  ============================================================ */

  const acceptOffer =
    useCallback(
      (fileId) => {
        const dc =
          getDc();

        if (
          !dc ||
          dc.readyState !==
            'open'
        ) {
          return;
        }

        const row =
          incomingRef.current.find(
            (file) =>
              file.fileId ===
              fileId
          );

        if (
          !row ||
          row.status !==
            'pending'
        ) {
          return;
        }

        /*
         * Multiple files can be accepted.
         *
         * Only actual binary streaming is serialized.
         */
        acceptedRef.current.add(
          fileId
        );

        const sent =
          safeSend(
            dc,
            {
              type:
                'file-accept',

              fileId,
            }
          );

        if (!sent) {
          acceptedRef.current.delete(
            fileId
          );

          return;
        }

        /*
         * Show accepted state immediately.
         */
        patchIncoming(
          fileId,
          {
            status:
              'receiving',

            bytesReceived:
              0,

            progress:
              0,

            speed:
              0,
          },
          [
            'pending',
          ]
        );
      },
      [
        getDc,
        patchIncoming,
      ]
    );

  /* ============================================================
     REJECT OFFER
  ============================================================ */

  const rejectOffer =
    useCallback(
      (fileId) => {
        acceptedRef.current.delete(
          fileId
        );

        safeSend(
          getDc(),
          {
            type:
              'file-reject',

            fileId,
          }
        );

        patchIncoming(
          fileId,
          {
            status:
              'rejected',

            speed:
              0,
          },
          [
            'pending',
          ]
        );
      },
      [
        getDc,
        patchIncoming,
      ]
    );

  /* ============================================================
     CANCEL INCOMING
  ============================================================ */

  const cancelIncoming =
    useCallback(
      (fileId) => {
        acceptedRef.current.delete(
          fileId
        );

        if (
          activeRecvRef.current
            ?.id ===
          fileId
        ) {
          activeRecvRef.current.chunks =
            [];

          activeRecvRef.current =
            null;
        }

        /*
         * Tell sender to stop.
         */
        safeSend(
          getDc(),
          {
            type:
              'file-cancel-by-receiver',

            fileId,
          }
        );

        patchIncoming(
          fileId,
          {
            status:
              'cancelled',

            speed:
              0,

            progress:
              0,

            bytesReceived:
              0,
          },
          [
            'pending',
            'receiving',
          ]
        );
      },
      [
        getDc,
        patchIncoming,
      ]
    );

  /* ============================================================
     CANCEL OUTGOING
  ============================================================ */

  const cancelOutgoing =
    useCallback(
      (fileId) => {
        const job =
          jobsRef.current.get(
            fileId
          );

        pendingFilesRef.current =
          pendingFilesRef.current.filter(
            (item) =>
              item.meta.fileId !==
              fileId
          );

        retryFileRef.current.delete(
          fileId
        );

        sendSpeedTrackers.current.delete(
          fileId
        );

        patchOutgoing(
          fileId,
          {
            status:
              'cancelled',

            speed:
              0,
          },
          [
            'waiting',
            'queued',
            'transferring',
          ]
        );

        if (job) {
          /*
           * Tell receiver first.
           */
          safeSend(
            getDc(),
            {
              type:
                'file-cancel',

              fileId,
            }
          );

          /*
           * Abort sender.
           */
          cancelJob(
            job,
            'local'
          );
        }
      },
      [
        getDc,
        patchOutgoing,
      ]
    );

  /* ============================================================
     DOWNLOAD
  ============================================================ */

  const downloadFile =
    useCallback(
      (fileId) => {
        const file =
          incoming.find(
            (item) =>
              item.fileId ===
              fileId
          );

        if (
          !file ||
          !file.blob
        ) {
          return;
        }

        downloadBlob(
          file.blob,
          file.name
        );
      },
      [incoming]
    );

  /* ============================================================
     REMOVE FILE
     
     direction: 'in' | 'out'
  ============================================================ */

  const removeFile =
    useCallback(
      (
        fileId,
        direction
      ) => {
        if (!fileId) return;

        /*
         * Accept both 'in' and 'incoming',
         * and both 'out' and 'outgoing'.
         */
        const dir =
          direction === 'in' ||
          direction === 'incoming'
            ? 'in'
            : direction === 'out' ||
                direction === 'outgoing'
              ? 'out'
              : null;

        if (dir === 'in' || dir === null) {
          const row =
            incomingRef.current.find(
              (file) =>
                file.fileId ===
                fileId
            );

          if (row) {
            if (row.status === 'pending') {
              rejectOffer(fileId);
            } else if (row.status === 'receiving') {
              cancelIncoming(fileId);
            }

            setIncoming((prev) =>
              prev.filter(
                (file) =>
                  file.fileId !== fileId
              )
            );
          }

          if (dir === 'in') return;
        }

        if (dir === 'out' || dir === null) {
          const queued =
            pendingFilesRef.current.some(
              (item) =>
                item.meta.fileId ===
                fileId
            );

          if (
            jobsRef.current.has(fileId) ||
            queued
          ) {
            cancelOutgoing(fileId);
          }

          retryFileRef.current.delete(fileId);

          setOutgoing((prev) =>
            prev.filter(
              (file) =>
                file.fileId !== fileId
            )
          );
        }
      },
      [
        rejectOffer,
        cancelIncoming,
        cancelOutgoing,
      ]
    );

  /* ============================================================
     CLEAR ALL
  ============================================================ */

  const clearAll =
    useCallback(
      () => {
        outgoingRef.current
          .filter(
            (file) =>
              [
                'waiting',
                'queued',
                'transferring',
              ].includes(
                file.status
              )
          )
          .forEach(
            (file) =>
              cancelOutgoing(
                file.fileId
              )
          );

        incomingRef.current.forEach(
          (file) => {
            if (
              file.status ===
              'pending'
            ) {
              rejectOffer(
                file.fileId
              );
            } else if (
              file.status ===
              'receiving'
            ) {
              cancelIncoming(
                file.fileId
              );
            }
          }
        );

        setOutgoing([]);

        setIncoming([]);

        activeRecvRef.current =
          null;

        acceptedRef.current.clear();

        sendSpeedTrackers.current.clear();

        retryFileRef.current.clear();

        pendingFilesRef.current =
          [];
      },
      [
        cancelOutgoing,
        rejectOffer,
        cancelIncoming,
      ]
    );

  /* ============================================================
     CLEAR COMPLETED
     
     Only removes successfully completed transfers.
     Keeps cancelled / rejected / failed / active / pending.
  ============================================================ */

  const clearCompleted =
    useCallback(
      () => {
        const keep = (file) =>
          file.status !== 'completed';

        setOutgoing((prev) =>
          prev.filter(keep)
        );

        setIncoming((prev) =>
          prev.filter(keep)
        );
      },
      []
    );

  /* ============================================================
     CLEAR CANCELLED
     
     Removes cancelled / rejected / failed transfers.
     Keeps completed / active / pending.
  ============================================================ */

  const clearCancelled =
    useCallback(
      () => {
        const dead = [
          'cancelled',
          'canceled',
          'rejected',
          'failed',
        ];

        const keep = (file) =>
          !dead.includes(file.status);

        setOutgoing((prev) =>
          prev.filter(keep)
        );

        setIncoming((prev) =>
          prev.filter(keep)
        );
      },
      []
    );

  /* ============================================================
     PEER DISCONNECTED
  ============================================================ */

  const markPeerDisconnected =
    useCallback(
      () => {
        /*
         * Stop every running sender.
         *
         * They will be requeued.
         */
        jobsRef.current.forEach(
          (job) =>
            cancelJob(
              job,
              'disconnected'
            )
        );

        /*
         * Incoming transfers cannot resume.
         */
        setIncoming(
          (prev) =>
            prev.map(
              (file) =>
                [
                  'pending',
                  'receiving',
                ].includes(
                  file.status
                )
                  ? {
                      ...file,

                      status:
                        'failed',

                      speed:
                        0,
                    }
                  : file
            )
        );

        activeRecvRef.current =
          null;

        acceptedRef.current.clear();

        sendSpeedTrackers.current.clear();
      },
      []
    );

  /* ============================================================
     RETRY FILE
  ============================================================ */

  const retryFile =
    useCallback(
      (fileId) => {
        const file =
          retryFileRef.current.get(
            fileId
          );

        if (!file) {
          return false;
        }

        const newId =
          makeTransferId();

        retryFileRef.current.delete(
          fileId
        );

        retryFileRef.current.set(
          newId,
          file
        );

        const meta = {
          fileId:
            newId,

          name:
            file.name,

          size:
            file.size,

          mimeType:
            file.type ||
            'application/octet-stream',
        };

        const dc =
          getDc();

        const isOpen =
          Boolean(dc) &&
          dc.readyState ===
            'open';

        setOutgoing(
          (prev) =>
            prev.map(
              (item) =>
                item.fileId ===
                fileId
                  ? {
                      ...item,

                      fileId:
                        newId,

                      status:
                        isOpen
                          ? 'waiting'
                          : 'queued',

                      bytesSent:
                        0,

                      bytesReceived:
                        0,

                      progress:
                        0,

                      speed:
                        0,
                    }
                  : item
            )
        );

        if (!isOpen) {
          pendingFilesRef.current.push({
            file,
            meta,
          });

          return true;
        }

        /*
         * Do not await.
         *
         * Retry behaves exactly like
         * a newly selected file.
         */
        void runJob(
          makeJob(
            file,
            meta
          )
        );

        return true;
      },
      [
        getDc,
        runJob,
      ]
    );

  /* ============================================================
     RETURN
  ============================================================ */

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
    clearCancelled,

    markPeerDisconnected,

    retryFile,
  };
}