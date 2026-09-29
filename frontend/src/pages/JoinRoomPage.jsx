import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Loader2,
  Hash,
  Camera,
  X,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Clock3,
  History,
  RotateCcw,
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
} from '../context/RoomContext';

export default function JoinRoomPage() {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [deviceName] = useState(() => detectDevice());

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showScanner, setShowScanner] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const scannerRef = useRef(null);
  const startingScannerRef = useRef(false);

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

        await html5QrCode.start(
          {
            facingMode: {
              exact: 'environment',
            },
          },
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

        if (!cancelled) {
          setIsCameraActive(true);
        }
      } catch (err) {
        console.error(
          '[QR Scanner] Camera start failed:',
          err
        );

        if (!cancelled) {
          setIsCameraActive(false);

          toast.error(
            'Camera Error',
            'Could not access camera. Please allow camera permission and try again.'
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
    try {
      let scannedCode = decodedText;

      /*
       * QR may contain:
       *
       * https://webdrop.../join?room=ABCDE
       *
       * OR:
       *
       * ABCDE
       */

      try {
        const url = new URL(decodedText);

        scannedCode =
          url.searchParams.get('room') ||
          url.searchParams.get('code') ||
          decodedText;
      } catch {
        scannedCode = decodedText;
      }

      const cleaned =
        normalizeRoomCode(scannedCode);

      if (!isValidRoomCode(cleaned)) {
        return;
      }

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
  };

  /* ============================================================
     JOIN ROOM
  ============================================================ */

  const handleJoinRoom = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!isValidRoomCode(code)) {
      setError(
        'Please enter a valid 5-character room code.'
      );

      return;
    }

    setError('');
    setJoining(true);

    try {
      /*
       * Save recent room locally.
       */
      addRecentRoom(code, 'guest');

      /*
       * Stop QR camera before navigation.
       */
      if (showScanner) {
        await stopScanner();
      }

      navigate(`/room/${code}`);
    } catch (err) {
      console.error(
        '[JoinRoom] Failed:',
        err
      );

      setError(
        'Failed to connect to the room. Please try again.'
      );

      toast.error(
        'Connection failed',
        'Peer unreachable or room expired.'
      );

      setJoining(false);
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

              {/* EYEBROW */}

              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-3 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/[0.08]">

                <span className="relative flex h-1.5 w-1.5">

                  <span className="absolute inset-0 animate-ping rounded-full bg-purple-500 opacity-50" />

                  <span className="relative h-1.5 w-1.5 rounded-full bg-purple-500" />

                </span>

                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-400">
                  Inbound transfer
                </span>

              </div>

              <h1 className="mt-5 font-heading text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] text-slate-900 dark:text-white sm:text-[48px] lg:text-[56px]">

                Join a private

                <span className="block text-purple-600 dark:text-purple-400">
                  transfer room.
                </span>

              </h1>

              <p className="mt-5 max-w-xl text-[14px] leading-6 text-slate-500 dark:text-slate-400 sm:text-[16px] sm:leading-7">
                Enter the room code from the sending device or
                scan its QR code to connect directly.
              </p>

            </div>

            {/* HEADER STATUS */}

            <div className="hidden shrink-0 sm:block">

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-white/[0.025] dark:shadow-none">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">

                  <ScanLine
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    strokeWidth={2}
                  />

                </div>

                <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    Connection
                  </p>

                  <p className="mt-1 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                    No account required
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ====================================================
              JOIN CARD
          ==================================================== */}

          <form
            onSubmit={handleJoinRoom}
            className="mt-10 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/[0.06] dark:bg-surface-card dark:shadow-none sm:mt-12"
          >

            {/* ==================================================
                FORM CONTENT
            ================================================== */}

            <div className="p-6 sm:p-8 lg:p-10">

              <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">

                <div>

                  <div className="flex items-center gap-2.5">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">

                      <Hash
                        className="h-5 w-5 text-purple-600 dark:text-purple-400"
                        strokeWidth={2}
                      />

                    </div>

                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Room code
                      </p>

                      <h2 className="mt-0.5 font-heading text-[18px] font-bold text-slate-900 dark:text-white">
                        Enter your connection code
                      </h2>

                    </div>

                  </div>

                </div>

                <div className="flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                    P2P ready
                  </span>

                </div>

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
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    disabled={joining}
                    aria-label="Room code"
                    className="h-[82px] w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-16 text-center font-mono text-[29px] font-extrabold tracking-[0.32em] text-slate-900 caret-purple-600 placeholder:font-sans placeholder:text-slate-300 placeholder:tracking-[0.25em] focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 disabled:opacity-70 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-purple-400 dark:focus:ring-purple-400/10 sm:h-[94px] sm:text-[38px] sm:tracking-[0.4em]"
                  />

                  {code.length > 0 && code.length < 5 && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400 dark:bg-white/[0.05] dark:text-slate-500">
                      {code.length}/5
                    </span>
                  )}

                  {code.length === 5 && (
                    <div className="absolute right-5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">

                      <ShieldCheck
                        className="h-4 w-4 text-emerald-500"
                        strokeWidth={2.2}
                      />

                    </div>
                  )}

                </div>

                <div className="mt-3 flex items-center justify-between gap-4">

                  <p className="text-[10px] leading-5 text-slate-400 dark:text-slate-500 sm:text-[11px]">
                    5 characters · O, 0, I and 1 are excluded
                  </p>

                  {code && (
                    <button
                      type="button"
                      onClick={() => {
                        setCode('');
                        setError('');
                      }}
                      className="shrink-0 text-[10px] font-semibold text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}

                </div>

              </div>

              {/* ==================================================
                  QR SCANNER BUTTON
              ================================================== */}

              {!showScanner && (

                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  disabled={joining}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-3.5 text-[12px] font-semibold text-slate-600 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.02] dark:text-slate-300 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/[0.06] dark:hover:text-purple-300 sm:text-[13px]"
                >

                  <Camera
                    className="h-4 w-4"
                    strokeWidth={2}
                  />

                  Scan QR code instead

                </button>

              )}

              {/* ==================================================
                  QR SCANNER
              ================================================== */}

              {showScanner && (

                <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.07] dark:bg-white/[0.025]">

                  <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/[0.05]">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <Camera
                          className="h-4 w-4 text-purple-600 dark:text-purple-400"
                          strokeWidth={2}
                        />

                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Scan room QR
                        </span>

                      </div>

                      <button
                        type="button"
                        onClick={stopScanner}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white"
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

                          <p className="mt-3 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                            Starting camera...
                          </p>

                        </div>

                      </div>

                    )}

                  </div>

                  <div className="border-t border-slate-200/80 px-4 py-3 dark:border-white/[0.05]">

                    <p className="text-center text-[10px] leading-4 text-slate-400 dark:text-slate-500">
                      Point your camera at the QR code displayed
                      on the sending device.
                    </p>

                  </div>

                </div>

              )}

              {/* ERROR */}

              {error && (

                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/[0.06]">

                  <p className="text-[12px] font-medium text-red-600 dark:text-red-400">
                    {error}
                  </p>

                </div>

              )}

            </div>

            {/* ==================================================
                ACTION AREA
            ================================================== */}

            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 dark:border-white/[0.05] dark:bg-white/[0.015] sm:px-8 lg:px-10">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                {/* CONNECT */}

                <button
                  type="submit"
                  disabled={
                    joining ||
                    code.length !== 5
                  }
                  className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 text-[13px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.65)] transition-all duration-200 hover:bg-purple-700 hover:shadow-[0_14px_35px_-12px_rgba(124,58,237,0.7)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:flex-1"
                >

                  {joining ? (
                    <>
                      <Loader2
                        className="h-5 w-5 animate-spin"
                        strokeWidth={2}
                      />

                      Connecting...
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

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-slate-300 dark:hover:border-red-500/20 dark:hover:bg-red-500/[0.06] dark:hover:text-red-400 sm:w-auto"
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

                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Direct peer-to-peer connection · No account required
                </p>

              </div>

            </div>

          </form>

          {/* ====================================================
              RECENT ROOMS
          ==================================================== */}

          {recentRooms.length > 0 && (

            <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-none sm:p-6">

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.05]">

                  <History
                    className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    strokeWidth={1.8}
                  />

                </div>

                <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                    Recent rooms
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    Stored on this device only
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
                        normalizeRoomCode(room.roomCode);

                      if (isValidRoomCode(cleaned)) {
                        setCode(cleaned);
                        setError('');
                      }
                    }}
                    className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[11px] font-semibold text-slate-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-200 dark:hover:border-purple-500/20 dark:hover:bg-purple-500/[0.06] dark:hover:text-purple-300"
                  >

                    <span className="font-mono tracking-[0.16em]">
                      {room.roomCode}
                    </span>

                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400 shadow-sm dark:bg-white/[0.05] dark:text-slate-500 dark:shadow-none">
                      {room.role}
                    </span>

                  </button>

                ))}

              </div>

            </div>

          )}

          {/* ====================================================
              BOTTOM ACTIONS
          ==================================================== */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-6 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">

            <button
              type="button"
              onClick={() => navigate('/')}
              className="group inline-flex items-center justify-center gap-2 text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:justify-start"
            >

              <span className="transition-transform duration-200 group-hover:-translate-x-0.5">
                ←
              </span>

              Back to overview

            </button>

            <div className="hidden items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 sm:flex">

              <Smartphone
                className="h-3.5 w-3.5"
                strokeWidth={1.8}
              />

              Joining as
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {deviceName}
              </span>

            </div>

          </div>

          {/* MOBILE DEVICE */}

          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 sm:hidden">

            <Smartphone
              className="h-3.5 w-3.5"
              strokeWidth={1.8}
            />

            Joining as

            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {deviceName}
            </span>

          </div>

        </section>

      </main>
    </div>
  );
}