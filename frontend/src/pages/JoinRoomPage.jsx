import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Hash,
  Camera,
  X,
  ScanLine,
  ShieldCheck,
  Smartphone,
  History,
  ClipboardPaste,
  LifeBuoy,
  Lock,
  Users,
  Clock3,
  KeyRound,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

import {
  normalizeRoomCode,
  isValidRoomCode,
} from '../utils/generateRoomCode';

import { toast } from '../components/common/ToastContainer';

import { detectDevice } from '../utils/fileUtils';

import {
  addRecentRoom,
  getRecentRooms,
  useRoom,
} from '../context/RoomContext';

/* ============================================================
   CONTENT
============================================================ */

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/25';

const JOIN_STEPS = [
  {
    icon: KeyRound,
    title: 'Get the code',
    text: 'Ask the sender for the 5-character code, or the QR code shown in their room.',
  },
  {
    icon: ScanLine,
    title: 'Enter or scan it',
    text: 'Type the code, paste it, or scan the QR with your camera.',
  },
  {
    icon: ShieldCheck,
    title: 'Connect directly',
    text: 'Your device connects straight to the sender. Files never go through a server.',
  },
];

const TROUBLESHOOTING = [
  {
    icon: Clock3,
    text: 'Rooms expire after 30 minutes. Ask the sender for a fresh code if yours is older.',
  },
  {
    icon: Users,
    text: 'A room holds two devices. If someone else has already joined, the sender can remove them.',
  },
  {
    icon: Lock,
    text: 'The sender can lock a room. Ask them to unlock it, then try again.',
  },
];

/* ============================================================
   HELPERS
============================================================ */

/* Accepts a plain code ("ABCDE") or a full invite link
   ("https://.../join?room=ABCDE") and returns a clean code. */
function parseRoomInput(text = '') {
  const raw = String(text).trim();
  let candidate = raw;

  try {
    const url = new URL(raw);

    candidate =
      url.searchParams.get('room') ||
      url.searchParams.get('code') ||
      raw;
  } catch {
    candidate = raw;
  }

  return normalizeRoomCode(candidate);
}

/* Only focus the input automatically on devices with a real
   pointer, so phones do not pop the keyboard open on load. */
function canAutoFocus() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia('(pointer: fine)').matches;
}

/* ============================================================
   PAGE
============================================================ */

export default function JoinRoomPage() {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinStage, setJoinStage] = useState('');
  const [error, setError] = useState('');
  const [deviceName] = useState(() => detectDevice());
  const [autoFocus] = useState(canAutoFocus);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  /*
   * Socket + room context.
   *
   * We only use the socket here for `check-room`.
   * We DO NOT emit `join-room` from this page.
   *
   * Actual joining will happen inside RoomPage.
   */
  const { socket, connected } = useRoom();

  const [showScanner, setShowScanner] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const scannerRef = useRef(null);
  const startingScannerRef = useRef(false);
  const scanHandledRef = useRef(false);

  /* ============================================================
     READ ROOM CODE FROM URL
  ============================================================ */

  useEffect(() => {
    const urlCode =
      searchParams.get('room') ||
      searchParams.get('code');

    if (!urlCode) {
      return;
    }

    const cleaned = normalizeRoomCode(urlCode);

    if (isValidRoomCode(cleaned)) {
      setCode(cleaned);

      toast.info(
        'Room code detected',
        `Code ${cleaned} prefilled.`
      );
    } else {
      toast.warning(
        'Invalid code',
        'Please enter the code manually.'
      );
    }
  }, [searchParams]);

  /* ============================================================
     START QR SCANNER
  ============================================================ */

  useEffect(() => {
    if (!showScanner) {
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      if (startingScannerRef.current) {
        return;
      }

      startingScannerRef.current = true;
      scanHandledRef.current = false;

      try {
        await new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });

        if (cancelled) {
          return;
        }

        const readerElement =
          document.getElementById('qr-reader');

        if (!readerElement) {
          throw new Error(
            'QR reader element was not rendered.'
          );
        }

        /*
         * Prevent duplicate scanner instances.
         */
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {}

          try {
            scannerRef.current.clear();
          } catch {}

          scannerRef.current = null;
        }

        const html5QrCode =
          new Html5Qrcode('qr-reader');

        scannerRef.current = html5QrCode;

        /*
         * "environment" prefers the rear camera on phones,
         * and still works on laptops that only have a webcam.
         */
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleQrResult(decodedText);
          },
          () => {
            /*
             * Ignore continuous QR decode errors
             * while no QR code is visible.
             */
          }
        );

        if (cancelled) {
          try {
            await html5QrCode.stop();
          } catch {}

          return;
        }

        setIsCameraActive(true);
      } catch (err) {
        console.error(
          '[QR Scanner] Camera start failed:',
          err
        );

        if (!cancelled) {
          setIsCameraActive(false);

          const reason = String(err?.name || err || '');

          const denied =
            /NotAllowed|Permission/i.test(reason);

          const noCamera =
            /NotFound|Overconstrained/i.test(reason);

          toast.error(
            'Camera unavailable',
            denied
              ? 'Camera permission was denied. Allow it in your browser settings, or type the code instead.'
              : noCamera
              ? 'No camera was found on this device. Type the code instead.'
              : 'Could not start the camera. Please try again or type the code.'
          );

          setShowScanner(false);
        }
      } finally {
        startingScannerRef.current = false;
      }
    };

    startCamera();

    return () => {
      cancelled = true;
    };
  }, [showScanner]);

  /* ============================================================
     HANDLE QR RESULT
  ============================================================ */

  const handleQrResult = (decodedText) => {
    if (scanHandledRef.current) {
      return;
    }

    try {
      /*
       * QR may contain a full invite link or only the code.
       */
      const cleaned = parseRoomInput(decodedText);

      if (!isValidRoomCode(cleaned)) {
        return;
      }

      scanHandledRef.current = true;

      setCode(cleaned);
      setError('');

      toast.success(
        'QR scanned',
        `Code ${cleaned} detected.`
      );

      stopScanner();
    } catch (err) {
      console.error(
        '[QR Scanner] QR processing error:',
        err
      );
    }
  };

  /* ============================================================
     STOP SCANNER
  ============================================================ */

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    scannerRef.current = null;

    setIsCameraActive(false);
    setShowScanner(false);

    if (!scanner) {
      return;
    }

    try {
      await scanner.stop();
    } catch (err) {
      console.warn(
        '[QR Scanner] Stop failed:',
        err
      );
    }

    try {
      scanner.clear();
    } catch (err) {
      console.warn(
        '[QR Scanner] Clear failed:',
        err
      );
    }
  };

  /* ============================================================
     CLEANUP SCANNER
  ============================================================ */

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      scannerRef.current = null;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear();
            } catch {}
          });
      }
    };
  }, []);

  /* ============================================================
     MANUAL CODE INPUT
  ============================================================ */

  const handleChange = (e) => {
    const cleaned =
      normalizeRoomCode(e.target.value);

    setCode(cleaned);

    if (error) {
      setError('');
    }

    if (joinStage) {
      setJoinStage('');
    }
  };

  /* ============================================================
     PASTE FROM CLIPBOARD
  ============================================================ */

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = parseRoomInput(text);

      if (isValidRoomCode(cleaned)) {
        setCode(cleaned);
        setError('');
        setJoinStage('');

        toast.success(
          'Code pasted',
          `Code ${cleaned} detected.`
        );
      } else {
        toast.warning(
          'No room code found',
          'The clipboard does not contain a valid room code or link.'
        );
      }
    } catch {
      toast.warning(
        'Paste unavailable',
        'Allow clipboard access in your browser, or type the code instead.'
      );
    }
  };

  /* ============================================================
     CHECK ROOM
  ============================================================ */

  const checkRoom = (roomCode) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(
          new Error(
            'Socket connection is not available.'
          )
        );

        return;
      }

      if (!connected || !socket.connected) {
        reject(
          new Error(
            'WebDrop server is not connected.'
          )
        );

        return;
      }

      let completed = false;

      const timeout = setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;

        reject(
          new Error(
            'Room check timed out.'
          )
        );
      }, 10000);

      /*
       * IMPORTANT:
       *
       * `check-room` only checks whether the room exists.
       * It does NOT join the room.
       *
       * Actual `join-room` happens later inside RoomPage.
       */
      socket.emit(
        'check-room',
        {
          roomCode,
        },
        (response) => {
          if (completed) {
            return;
          }

          completed = true;
          clearTimeout(timeout);

          resolve(response);
        }
      );
    });
  };

  /* ============================================================
     JOIN ROOM
  ============================================================ */

  const handleJoinRoom = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (joining) {
      return;
    }

    if (!isValidRoomCode(code)) {
      setError(
        'Please enter a valid 5-character room code.'
      );

      return;
    }

    /*
     * Server connection must be ready before checking
     * whether the room exists.
     */
    if (!socket || !connected || !socket.connected) {
      setError(
        'Connecting to WebDrop server. Please wait a moment and try again.'
      );

      return;
    }

    const roomCode = normalizeRoomCode(code);

    setError('');
    setJoining(true);

    /*
     * ==========================================================
     * STEP 1
     * Finding room…
     * ==========================================================
     */

    setJoinStage('Finding room…');

    try {
      /*
       * Actual realtime server check.
       */
      const response = await checkRoom(roomCode);

      /*
       * ========================================================
       * ROOM NOT FOUND
       * ========================================================
       *
       * Do NOT show "Room found".
       * Do NOT navigate.
       */

      if (!response?.success) {
        const serverMessage =
          response?.message ||
          'Room not found. Please check the room code and try again.';

        setError(serverMessage);
        setJoinStage('');
        setJoining(false);

        toast.error(
          'Room unavailable',
          serverMessage
        );

        return;
      }

      /*
       * ========================================================
       * STEP 2
       * Room found
       * ========================================================
       */

      setJoinStage('Room found');

      /*
       * Give the user a short visible transition so that
       * "Room found" is actually visible before the next stage.
       */
      await new Promise((resolve) => {
        setTimeout(resolve, 350);
      });

      /*
       * ========================================================
       * STEP 3
       * Establishing connection…
       * ========================================================
       */

      setJoinStage('Establishing connection…');

      /*
       * Save recent room only after the server has confirmed
       * that the room actually exists.
       */
      addRecentRoom(roomCode, 'guest');

      /*
       * Stop QR camera before navigation.
       */
      if (showScanner) {
        await stopScanner();
      }

      /*
       * Give "Establishing connection…" enough time to render
       * before moving to RoomPage.
       */
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });

      /*
       * Actual room joining happens inside RoomPage.
       */
      navigate(`/room/${roomCode}`);
    } catch (err) {
      console.error(
        '[JoinRoom] Room check failed:',
        err
      );

      let message =
        'Failed to check the room. Please try again.';

      if (
        err?.message ===
        'Room check timed out.'
      ) {
        message =
          'Room check timed out. Please check your connection and try again.';
      }

      if (
        err?.message ===
        'WebDrop server is not connected.'
      ) {
        message =
          'WebDrop server is not connected. Please wait a moment and try again.';
      }

      if (
        err?.message ===
        'Socket connection is not available.'
      ) {
        message =
          'Connection to the WebDrop server is unavailable.';
      }

      setError(message);
      setJoinStage('');
      setJoining(false);

      toast.error(
        'Connection failed',
        message
      );
    }
  };

  /* ============================================================
     CANCEL JOIN / RESET
  ============================================================ */

  const handleCancel = async () => {
    if (showScanner || scannerRef.current) {
      await stopScanner();
    }

    setJoining(false);
    setJoinStage('');
    setError('');
    setCode('');

    toast.info(
      'Join cancelled',
      'Room code and connection attempt were cleared.'
    );
  };

  /* ============================================================
     RECENT ROOMS
  ============================================================ */

  const recentRooms = getRecentRooms();

  const codeReady = code.length === 5;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FBFAFF] transition-colors dark:bg-surface">
      {/* ========================================================
          BACKGROUND DECORATION
      ======================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-purple-500/[0.07] blur-3xl dark:bg-purple-500/[0.08]" />
        <div className="absolute left-[-160px] top-[360px] h-[360px] w-[360px] rounded-full bg-indigo-500/[0.05] blur-3xl dark:bg-indigo-500/[0.06]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <main className="relative mx-auto w-full max-w-[1440px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8 xl:px-10">
        <section className="mx-auto max-w-[1100px]">
          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-3 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/[0.08]">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                <span className="text-[12px] font-semibold text-purple-600 dark:text-purple-400">
                  Receive files
                </span>
              </div>

              <h1 className="mt-5 font-heading text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] text-slate-900 dark:text-white sm:text-[48px] lg:text-[56px]">
                Join a private
                <span className="block text-purple-600 dark:text-purple-400">
                  transfer room.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[14px] leading-6 text-slate-500 dark:text-slate-400 sm:text-[16px] sm:leading-7">
                Enter the room code from the sending device, or scan its QR
                code, to connect directly. No account and no upload to a
                server.
              </p>
            </div>

            <div className="hidden shrink-0 sm:block">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.025]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                  <ShieldCheck
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Connection
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                    Encrypted, peer-to-peer
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:mt-12 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            {/* ==================================================
                LEFT: JOIN FORM + RECENT ROOMS
            ================================================== */}

            <div>
              <form
                onSubmit={handleJoinRoom}
                noValidate
                className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white dark:border-white/[0.06] dark:bg-surface-card"
              >
                <div className="p-6 sm:p-8">
                  {/* FORM HEADER */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                        <Hash
                          className="h-5 w-5 text-purple-600 dark:text-purple-400"
                          strokeWidth={2}
                        />
                      </div>

                      <div>
                        <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
                          Room code
                        </p>
                        <h2 className="mt-0.5 font-heading text-[18px] font-bold text-slate-900 dark:text-white">
                          Enter your connection code
                        </h2>
                      </div>
                    </div>

                    <span
                      className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:inline-flex ${
                        codeReady
                          ? 'border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-400'
                          : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          codeReady
                            ? 'bg-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                      {codeReady
                        ? 'Ready to connect'
                        : 'Waiting for code'}
                    </span>
                  </div>

                  {/* ROOM INPUT */}
                  <div className="mt-7">
                    <div className="relative">
                      <Hash
                        className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 dark:text-slate-600"
                        strokeWidth={2}
                      />

                      <input
                        type="text"
                        value={code}
                        onChange={handleChange}
                        placeholder="X7K92"
                        maxLength={5}
                        autoFocus={autoFocus}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        disabled={joining}
                        aria-label="Room code"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={
                          error
                            ? 'room-code-error'
                            : 'room-code-hint'
                        }
                        className={`h-[82px] w-full rounded-2xl border bg-white pl-14 pr-16 text-center font-mono text-[29px] font-extrabold tracking-[0.32em] text-slate-900 caret-purple-600 placeholder:font-sans placeholder:tracking-[0.25em] placeholder:text-slate-300 focus:outline-none focus:ring-4 disabled:opacity-70 dark:bg-white/[0.025] dark:text-white dark:placeholder:text-slate-600 sm:h-[94px] sm:text-[38px] sm:tracking-[0.4em] ${
                          error
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10 dark:border-red-500/30'
                            : 'border-slate-200 focus:border-purple-400 focus:ring-purple-500/10 dark:border-white/[0.08] dark:focus:border-purple-400 dark:focus:ring-purple-400/10'
                        }`}
                      />

                      {code.length > 0 && code.length < 5 && (
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                          {code.length}/5
                        </span>
                      )}

                      {codeReady && (
                        <div className="absolute right-5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                          <ShieldCheck
                            className="h-4 w-4 text-emerald-500"
                            strokeWidth={2.2}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <p
                        id="room-code-hint"
                        className="text-[11px] leading-5 text-slate-400 dark:text-slate-500 sm:text-[12px]"
                      >
                        5 characters. The letters O and I and the numbers 0 and 1 are not used.
                      </p>

                      <div className="flex shrink-0 items-center gap-3">
                        {!code && (
                          <button
                            type="button"
                            onClick={handlePaste}
                            disabled={joining}
                            className={`inline-flex items-center gap-1.5 rounded-md text-[12px] font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50 dark:text-purple-400 dark:hover:text-purple-300 ${FOCUS_RING}`}
                          >
                            <ClipboardPaste
                              className="h-3.5 w-3.5"
                              strokeWidth={2.2}
                            />
                            Paste
                          </button>
                        )}

                        {code && (
                          <button
                            type="button"
                            onClick={() => {
                              setCode('');
                              setError('');
                              setJoinStage('');
                            }}
                            className={`rounded-md text-[12px] font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 ${FOCUS_RING}`}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ERROR */}
                    {error && (
                      <div
                        id="room-code-error"
                        role="alert"
                        className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/[0.06]"
                      >
                        <p className="text-[13px] font-medium text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* DIVIDER */}
                  <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                    <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
                      or
                    </span>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                  </div>

                  {/* QR SCANNER BUTTON */}
                  {!showScanner && (
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      disabled={joining}
                      className={`inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3.5 text-[13px] font-semibold text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.02] dark:text-slate-200 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/[0.06] dark:hover:text-purple-300 ${FOCUS_RING}`}
                    >
                      <Camera
                        className="h-4 w-4"
                        strokeWidth={2}
                      />
                      Scan QR code
                    </button>
                  )}

                  {/* QR SCANNER */}
                  {showScanner && (
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.07] dark:bg-white/[0.025]">
                      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/[0.05]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Camera
                              className="h-4 w-4 text-purple-600 dark:text-purple-400"
                              strokeWidth={2}
                            />
                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                              Scan room QR
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={stopScanner}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white ${FOCUS_RING}`}
                            aria-label="Close QR scanner"
                          >
                            <X
                              className="h-4 w-4"
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="relative min-h-[300px]">
                        <div
                          id="qr-reader"
                          className="w-full"
                        />

                        {!isCameraActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/95 dark:bg-slate-950/95">
                            <div className="text-center">
                              <Loader2
                                className="mx-auto h-6 w-6 animate-spin text-purple-600 dark:text-purple-400"
                                strokeWidth={2}
                              />
                              <p className="mt-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                Starting camera…
                              </p>
                              <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">
                                Allow camera access if your browser asks.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-200/80 px-4 py-3 dark:border-white/[0.05]">
                        <p className="text-center text-[12px] leading-5 text-slate-400 dark:text-slate-500">
                          Point your camera at the QR code displayed on the
                          sending device.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ==================================================
                    ACTION AREA
                ================================================== */}

                <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 dark:border-white/[0.05] dark:bg-white/[0.015] sm:px-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      disabled={joining || !codeReady}
                      className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 text-[14px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.65)] transition-all duration-200 hover:bg-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:flex-1"
                    >
                      {joining ? (
                        <>
                          <Loader2
                            className="h-5 w-5 animate-spin"
                            strokeWidth={2}
                          />
                          {joinStage || 'Connecting…'}
                        </>
                      ) : (
                        <>
                          Connect to peer
                          <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                            strokeWidth={2.4}
                          />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 active:scale-[0.98] dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-slate-300 dark:hover:border-red-500/20 dark:hover:bg-red-500/[0.06] dark:hover:text-red-400 sm:w-auto"
                    >
                      <X
                        className="h-4 w-4"
                        strokeWidth={2.2}
                      />
                      Cancel
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <ShieldCheck
                      className="h-3.5 w-3.5 text-emerald-500"
                      strokeWidth={2}
                    />
                    <p className="text-[12px] text-slate-400 dark:text-slate-500">
                      Direct peer-to-peer connection. No account required.
                    </p>
                  </div>
                </div>
              </form>

              {/* ====================================================
                  RECENT ROOMS
              ==================================================== */}

              {recentRooms.length > 0 && (
                <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.05]">
                      <History
                        className="h-4 w-4 text-slate-500 dark:text-slate-400"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                        Recent rooms
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
                        Stored on this device only. Tap one to fill the code.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {recentRooms.map((room) => (
                      <button
                        key={`${room.roomCode}-${room.at}`}
                        type="button"
                        onClick={() => {
                          const cleaned =
                            normalizeRoomCode(
                              room.roomCode
                            );

                          if (isValidRoomCode(cleaned)) {
                            setCode(cleaned);
                            setError('');
                            setJoinStage('');
                          }
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-200 dark:hover:border-purple-500/20 dark:hover:bg-purple-500/[0.06] dark:hover:text-purple-300 ${FOCUS_RING}`}
                      >
                        <span className="font-mono tracking-[0.16em]">
                          {room.roomCode}
                        </span>

                        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                          {room.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ==================================================
                RIGHT: GUIDE
            ================================================== */}

            <aside className="flex flex-col gap-6">
              {/* HOW IT WORKS */}
              <div className="rounded-[22px] border border-slate-200/80 bg-white p-6 dark:border-white/[0.06] dark:bg-surface-card">
                <h2 className="font-heading text-[16px] font-bold text-slate-900 dark:text-white">
                  How joining works
                </h2>

                <ol className="mt-5 space-y-5">
                  {JOIN_STEPS.map(
                    ({ icon: Icon, title, text }, i) => (
                      <li
                        key={title}
                        className="flex items-start gap-3.5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                          <Icon
                            className="h-4 w-4"
                            strokeWidth={2}
                          />
                        </span>

                        <div>
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                            <span className="mr-1.5 font-mono text-slate-300 dark:text-slate-600">
                              {i + 1}.
                            </span>
                            {title}
                          </p>

                          <p className="mt-1 text-[12.5px] leading-6 text-slate-500 dark:text-slate-400">
                            {text}
                          </p>
                        </div>
                      </li>
                    )
                  )}
                </ol>
              </div>

              {/* TROUBLESHOOTING */}
              <div className="rounded-[22px] border border-slate-200/80 bg-white p-6 dark:border-white/[0.06] dark:bg-surface-card">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.05]">
                    <LifeBuoy
                      className="h-4 w-4 text-slate-500 dark:text-slate-400"
                      strokeWidth={1.9}
                    />
                  </span>

                  <h2 className="font-heading text-[16px] font-bold text-slate-900 dark:text-white">
                    Code not working?
                  </h2>
                </div>

                <ul className="mt-4 space-y-3.5">
                  {TROUBLESHOOTING.map(
                    ({ icon: Icon, text }) => (
                      <li
                        key={text}
                        className="flex items-start gap-3"
                      >
                        <Icon
                          className="mt-1 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
                          strokeWidth={1.9}
                        />

                        <span className="text-[12.5px] leading-6 text-slate-500 dark:text-slate-400">
                          {text}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* DEVICE */}
              <div className="flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white px-5 py-4 dark:border-white/[0.06] dark:bg-surface-card">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05]">
                  <Smartphone
                    className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    strokeWidth={1.9}
                  />
                </span>

                <div className="min-w-0">
                  <p className="text-[12px] text-slate-400 dark:text-slate-500">
                    Joining as
                  </p>

                  <p className="truncate text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                    {deviceName}
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* ====================================================
              BOTTOM ACTIONS
          ==================================================== */}

          <div className="mt-8 border-t border-slate-200/70 pt-6 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`group inline-flex items-center gap-2 rounded-lg text-[13px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ${FOCUS_RING}`}
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                strokeWidth={2}
              />
              Back to overview
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}