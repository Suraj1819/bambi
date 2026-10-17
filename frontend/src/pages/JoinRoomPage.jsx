// src/pages/JoinRoom.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
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
  Radio,
  Command,
  CircleDot,
  Server,
  Wifi,
  FileCheck,
  Info,
  AlertCircle,
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
   CONSTANTS
============================================================ */

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface';

const CAPABILITY_KEYS = [
  { icon: ShieldCheck, titleKey: 'join.capE2eTitle', descKey: 'join.capE2eDesc', tone: 'emerald' },
  { icon: KeyRound, titleKey: 'join.capCodeTitle', descKey: 'join.capCodeDesc', tone: 'violet' },
  { icon: Clock3, titleKey: 'join.capExpireTitle', descKey: 'join.capExpireDesc', tone: 'amber' },
  { icon: Users, titleKey: 'join.capTwoTitle', descKey: 'join.capTwoDesc', tone: 'sky' },
];

const SPEC_KEYS = [
  { labelKey: 'join.specTransport', value: 'WebRTC · DTLS', icon: Server },
  { labelKey: 'join.specSignaling', value: 'Socket.IO', icon: Wifi },
  { labelKey: 'join.specAuth', valueKey: 'join.specAuthValue', icon: KeyRound },
  { labelKey: 'join.specStorage', valueKey: 'join.specStorageValue', icon: FileCheck },
];

const FAQ_KEYS = [
  { qKey: 'join.faq1q', aKey: 'join.faq1a' },
  { qKey: 'join.faq2q', aKey: 'join.faq2a' },
  { qKey: 'join.faq3q', aKey: 'join.faq3a' },
  { qKey: 'join.faq4q', aKey: 'join.faq4a' },
];

const JOIN_STEP_KEYS = [
  { icon: KeyRound, titleKey: 'join.step1Title', textKey: 'join.step1Text' },
  { icon: ScanLine, titleKey: 'join.step2Title', textKey: 'join.step2Text' },
  { icon: ShieldCheck, titleKey: 'join.step3Title', textKey: 'join.step3Text' },
];

const TROUBLE_KEYS = [
  { icon: Clock3, textKey: 'join.trouble1' },
  { icon: Users, textKey: 'join.trouble2' },
  { icon: Lock, textKey: 'join.trouble3' },
];

/* ============================================================
   HELPERS
============================================================ */

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

function canAutoFocus() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(pointer: fine)').matches;
}

function getDeviceName() {
  try {
    return detectDevice();
  } catch {
    return 'Web browser';
  }
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className={`fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] right-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur-sm transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.1] dark:bg-[#15171d]/95 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-300 sm:right-5 lg:bottom-5 ${FOCUS_RING}`}
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
    </button>
  );
}

function ToneStyles(tone) {
  const map = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/[0.08]',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-500/[0.08]',
      text: 'text-violet-600 dark:text-violet-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500/[0.08]',
      text: 'text-amber-600 dark:text-amber-400',
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-500/[0.08]',
      text: 'text-sky-600 dark:text-sky-400',
    },
  };
  return map[tone] || map.violet;
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" strokeWidth={2.4} />
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {children}
      </span>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function JoinRoomPage() {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinStage, setJoinStage] = useState('');
  const [error, setError] = useState('');
  const [deviceName] = useState(() => getDeviceName());
  const [autoFocus] = useState(canAutoFocus);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { socket, connected } = useRoom();

  const [showScanner, setShowScanner] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const scannerRef = useRef(null);
  const startingScannerRef = useRef(false);
  const scanHandledRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const urlCode = searchParams.get('room') || searchParams.get('code');
    if (!urlCode) return;

    const cleaned = normalizeRoomCode(urlCode);
    if (isValidRoomCode(cleaned)) {
      setCode(cleaned);
      toast.info(t('join.toastCodeDetected'), t('join.toastCodePrefilled', { code: cleaned }));
    } else {
      toast.warning(t('join.toastInvalidCode'), t('join.toastEnterManually'));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showScanner) return;

    let cancelled = false;

    const startCamera = async () => {
      if (startingScannerRef.current) return;

      startingScannerRef.current = true;
      scanHandledRef.current = false;

      try {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (cancelled) return;

        const readerElement = document.getElementById('qr-reader');
        if (!readerElement) {
          throw new Error('QR reader element was not rendered.');
        }

        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {}
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => handleQrResult(decodedText),
          () => {},
        );

        if (cancelled) {
          try {
            await html5QrCode.stop();
          } catch {}
          return;
        }

        setIsCameraActive(true);
      } catch (err) {
        console.error('[QR Scanner] Camera start failed:', err);

        if (!cancelled) {
          setIsCameraActive(false);

          const reason = String(err?.name || err || '');
          const denied = /NotAllowed|Permission/i.test(reason);
          const noCamera = /NotFound|Overconstrained/i.test(reason);

          toast.error(
            t('join.toastCameraUnavailable'),
            denied
              ? t('join.toastCameraDenied')
              : noCamera
                ? t('join.toastNoCamera')
                : t('join.toastCameraFail'),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner]);

  const handleQrResult = (decodedText) => {
    if (scanHandledRef.current) return;

    try {
      const cleaned = parseRoomInput(decodedText);
      if (!isValidRoomCode(cleaned)) return;

      scanHandledRef.current = true;
      setCode(cleaned);
      setError('');

      toast.success(t('join.toastQrScanned'), t('join.toastCodeDetectedShort', { code: cleaned }));
      stopScanner();
    } catch (err) {
      console.error('[QR Scanner] QR processing error:', err);
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    setIsCameraActive(false);
    setShowScanner(false);

    if (!scanner) return;

    try {
      await scanner.stop();
    } catch (err) {
      console.warn('[QR Scanner] Stop failed:', err);
    }

    try {
      scanner.clear();
    } catch (err) {
      console.warn('[QR Scanner] Clear failed:', err);
    }
  };

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

  const handleChange = (e) => {
    const cleaned = normalizeRoomCode(e.target.value);
    setCode(cleaned);

    if (error) setError('');
    if (joinStage) setJoinStage('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = parseRoomInput(text);

      if (isValidRoomCode(cleaned)) {
        setCode(cleaned);
        setError('');
        setJoinStage('');
        toast.success(t('join.toastCodePasted'), t('join.toastCodeDetectedShort', { code: cleaned }));
      } else {
        toast.warning(t('join.toastNoCodeClipboard'), t('join.toastNoCodeClipboardBody'));
      }
    } catch {
      toast.warning(t('join.toastPasteUnavailable'), t('join.toastPasteUnavailableBody'));
    }
  };

  const checkRoom = (roomCode) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket connection is not available.'));
        return;
      }

      if (!connected || !socket.connected) {
        reject(new Error('WebDrop server is not connected.'));
        return;
      }

      let completed = false;

      const timeout = setTimeout(() => {
        if (completed) return;
        completed = true;
        reject(new Error('Room check timed out.'));
      }, 10000);

      socket.emit('check-room', { roomCode }, (response) => {
        if (completed) return;
        completed = true;
        clearTimeout(timeout);
        resolve(response);
      });
    });
  };

  const handleJoinRoom = async (e) => {
    if (e) e.preventDefault();
    if (joining) return;

    if (!isValidRoomCode(code)) {
      setError(t('join.errorInvalidCode'));
      return;
    }

    if (!socket || !connected || !socket.connected) {
      setError(t('join.errorConnecting'));
      return;
    }

    const roomCode = normalizeRoomCode(code);

    setError('');
    setJoining(true);
    setJoinStage(t('join.stageFinding'));

    try {
      const response = await checkRoom(roomCode);

      if (!response?.success) {
        const serverMessage =
          response?.message ||
          t('join.errorNotFound');

        setError(serverMessage);
        setJoinStage('');
        setJoining(false);

        toast.error(t('join.toastRoomUnavailable'), serverMessage);
        return;
      }

      setJoinStage(t('join.stageFound'));

      await new Promise((resolve) => {
        setTimeout(resolve, 350);
      });

      setJoinStage(t('join.stageEstablishing'));

      // Save as GUEST on this device only (notifications)
      try {
        addRecentRoom({
          roomCode,
          role: 'guest',
          deviceName,
          joinedAt: Date.now(),
          lastJoinedAt: Date.now(),
        });
      } catch (err) {
        console.warn('[JoinRoom] addRecentRoom failed:', err);
      }

      if (showScanner) {
        await stopScanner();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });

      navigate(`/room/${roomCode}`);
    } catch (err) {
      console.error('[JoinRoom] Room check failed:', err);

      let message = t('join.errorCheckFailed');

      if (err?.message === 'Room check timed out.') {
        message =
          t('join.errorTimeout');
      }

      if (err?.message === 'WebDrop server is not connected.') {
        message =
          t('join.errorServer');
      }

      if (err?.message === 'Socket connection is not available.') {
        message = t('join.errorSocket');
      }

      setError(message);
      setJoinStage('');
      setJoining(false);

      toast.error(t('join.toastConnectionFailed'), message);
    }
  };

  const handleCancel = async () => {
    if (showScanner || scannerRef.current) {
      await stopScanner();
    }

    setJoining(false);
    setJoinStage('');
    setError('');
    setCode('');

    toast.info(t('join.toastJoinCancelled'), t('join.toastJoinCancelledBody'));
  };

  const recentRooms = useMemo(() => getRecentRooms(), []);
  const codeReady = code.length === 5;
  const isConnected = Boolean(connected && socket?.connected);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FBFAFF] text-slate-900 transition-colors dark:bg-surface dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-8 sm:px-6 sm:pb-28 sm:pt-12 lg:px-10 lg:pb-16">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 ${FOCUS_RING}`}
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2.4}
          />
          {t('join.back')}
        </button>

        <section className="mt-8 sm:mt-12">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
            {/* LEFT */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1 dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                  {t('join.badge')}
                </span>
              </div>

              <h1 className="mt-4 font-heading text-[28px] font-extrabold leading-[1.08] tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[42px] lg:text-[48px]">
                {t('join.titleLine1')}
                <span className="block bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                  {t('join.titleLine2')}
                </span>
              </h1>

              <p className="mt-4 max-w-[560px] text-[13.5px] leading-6 text-slate-600 dark:text-slate-400 sm:mt-5 sm:text-[14.5px] sm:leading-7">
                Type the code from the sending device — {t('join.orScan')} its QR. As soon
                as you connect, files travel directly between the two devices.
              </p>

              <form
                onSubmit={handleJoinRoom}
                noValidate
                className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:mt-8 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        codeReady
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-slate-500'
                      }`}
                    >
                      <Hash className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-900 dark:text-white">
                        {t('join.yourCode')}
                      </p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {codeReady
                          ? t('join.codeReady')
                          : t('join.codeHint')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-flex ${
                      codeReady
                        ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-400'
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
                    {codeReady ? 'Ready' : 'Waiting'}
                  </span>
                </div>

                <div className="mt-6">
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
                      aria-label={t('join.roomCodeAria')}
                      inputMode="text"
                      aria-invalid={error ? true : undefined}
                      className={`h-[72px] w-full rounded-2xl border bg-white pl-14 pr-16 text-center font-mono text-[26px] font-extrabold tracking-[0.32em] text-slate-900 caret-violet-600 placeholder:font-sans placeholder:tracking-[0.25em] placeholder:text-slate-300 focus:outline-none focus:ring-4 disabled:opacity-70 dark:bg-white/[0.025] dark:text-white dark:placeholder:text-slate-600 sm:h-[84px] sm:text-[34px] sm:tracking-[0.4em] ${
                        error
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10 dark:border-red-500/30'
                          : 'border-slate-200 focus:border-violet-400 focus:ring-violet-500/10 dark:border-white/[0.08] dark:focus:border-violet-400 dark:focus:ring-violet-400/10'
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
                    <p className="text-[11.5px] leading-5 text-slate-400 dark:text-slate-500">
                      {t('join.pasteHint')}
                    </p>

                    <div className="flex shrink-0 items-center gap-3">
                      {!code && (
                        <button
                          type="button"
                          onClick={handlePaste}
                          disabled={joining}
                          className={`inline-flex items-center gap-1.5 rounded-md text-[12px] font-semibold text-violet-600 hover:text-violet-800 disabled:opacity-50 dark:text-violet-400 dark:hover:text-violet-300 ${FOCUS_RING}`}
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

                  {error && (
                    <div
                      role="alert"
                      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/[0.06]"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                          strokeWidth={2.4}
                        />
                        <p className="text-[12.5px] font-medium leading-relaxed text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Primary actions — desktop only (lg+). Mobile + tablet use sticky bar */}
                  <div className="mt-5 hidden items-center gap-2.5 lg:flex lg:gap-3">
                    <button
                      type="submit"
                      disabled={joining || !codeReady || !isConnected}
                      className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-[13.5px] font-bold text-white shadow-lg shadow-violet-600/20 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-slate-500 sm:h-12 sm:px-6 sm:text-[14px] ${FOCUS_RING}`}
                    >
                      {joining ? (
                        <>
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2.6} />
                          <span className="truncate">{joinStage || t('join.connecting')}</span>
                        </>
                      ) : !isConnected ? (
                        <>
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2.6} />
                          <span className="truncate">{t('join.connecting')}</span>
                        </>
                      ) : (
                        <>
                          <Radio className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                          <span className="truncate">{t('join.connect')}</span>
                          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.6} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={joining}
                      className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 text-[12.5px] font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/25 dark:bg-transparent dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 sm:h-12 sm:gap-2 sm:px-5 sm:text-[13.5px] ${FOCUS_RING}`}
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
                      <span>{t('join.cancel')}</span>
                    </button>
                  </div>
                </div>

                <div className="my-5 flex items-center gap-4 sm:my-6">
                  <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('join.orScan')}
                  </span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                </div>

                {!showScanner && (
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    disabled={joining}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.02] dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.06] dark:hover:text-violet-300 ${FOCUS_RING}`}
                  >
                    <Camera className="h-4 w-4" strokeWidth={2.2} />
                    {t('join.scanQr')}
                  </button>
                )}

                {showScanner && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.07] dark:bg-white/[0.025]">
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Camera
                          className="h-4 w-4 text-violet-600 dark:text-violet-400"
                          strokeWidth={2.2}
                        />
                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                          {t('join.scanRoomQr')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={stopScanner}
                        aria-label={t('join.closeScanner')}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white ${FOCUS_RING}`}
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>

                    <div className="relative min-h-[300px]">
                      <div id="qr-reader" className="w-full" />

                      {!isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/95 dark:bg-slate-950/95">
                          <div className="text-center">
                            <Loader2
                              className="mx-auto h-6 w-6 animate-spin text-violet-600 dark:text-violet-400"
                              strokeWidth={2.2}
                            />
                            <p className="mt-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                              {t('join.startingCamera')}
                            </p>
                            <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">
                              {t('join.allowCamera')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200/80 px-4 py-3 dark:border-white/[0.05]">
                      <p className="text-center text-[12px] leading-5 text-slate-400 dark:text-slate-500">
                        {t('join.pointCamera')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
                      }`}
                    />
                    <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {isConnected ? t('join.serverConnected') : t('join.connectingServer')}
                    </span>
                  </div>
                  <span className="hidden h-3 w-px bg-slate-200 dark:bg-white/[0.08] sm:block" />
                  <span className="text-[12px] text-slate-400 dark:text-slate-500">
                    {t('join.signalingOnly')}
                  </span>
                </div>

                {!isConnected && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-500/15 dark:bg-amber-500/[0.06]">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                      strokeWidth={2.4}
                    />
                    <p className="text-[11.5px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                      <strong className="font-semibold">{t('join.waitingConnection')}</strong>{' '}
                      {t('join.waitingConnectionBody')}
                    </p>
                  </div>
                )}
              </form>

              {recentRooms.length > 0 && (
                <div className="mt-6">
                  <SectionLabel icon={History}>{t('join.recentRooms')}</SectionLabel>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {recentRooms.map((room) => (
                      <button
                        key={`${room.roomCode}-${room.lastJoinedAt || room.joinedAt || room.at}`}
                        type="button"
                        onClick={() => {
                          const cleaned = normalizeRoomCode(room.roomCode);
                          if (isValidRoomCode(cleaned)) {
                            setCode(cleaned);
                            setError('');
                            setJoinStage('');
                          }
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-violet-500/20 dark:hover:bg-violet-500/[0.06] dark:hover:text-violet-300 ${FOCUS_RING}`}
                      >
                        <span className="font-mono tracking-[0.16em]">
                          {room.roomCode}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                          {t(room.role === 'host' ? 'join.roleHost' : 'join.roleGuest')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10">
                <SectionLabel icon={CircleDot}>{t('join.capabilities')}</SectionLabel>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {CAPABILITY_KEYS.map(({ icon: Icon, titleKey, descKey, tone }) => {
                    const tones = ToneStyles(tone);
                    return (
                      <div
                        key={titleKey}
                        className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-violet-200 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-violet-500/30"
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones.bg} ${tones.text}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <p className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white">
                          {t(titleKey)}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {t(descKey)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-10">
                <SectionLabel icon={Info}>{t('join.commonQuestions')}</SectionLabel>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
                  {FAQ_KEYS.map(({ qKey, aKey }, i) => (
                    <details
                      key={qKey}
                      className={`group ${
                        i !== FAQ_KEYS.length - 1
                          ? 'border-b border-slate-100 dark:border-white/[0.06]'
                          : ''
                      }`}
                    >
                      <summary
                        className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[12.5px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
                      >
                        <span className="pr-2">{t(qKey)}</span>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-transform group-open:rotate-45 group-open:border-violet-300 group-open:bg-violet-50 group-open:text-violet-600 dark:border-white/[0.08] dark:text-slate-500 dark:group-open:border-violet-500/30 dark:group-open:bg-violet-500/[0.08] dark:group-open:text-violet-400">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path
                              d="M4 1v6M1 4h6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      </summary>
                      <p className="px-4 pb-3 pr-10 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {t(aKey)}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={Command}>{t('join.howJoining')}</SectionLabel>

                <ol className="mt-4 space-y-4">
                  {JOIN_STEP_KEYS.map(({ icon: Icon, titleKey, textKey }, i) => (
                    <li key={titleKey} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                          {t(titleKey)}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {t(textKey)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={Server}>{t('join.techDetails')}</SectionLabel>

                <dl className="mt-4 space-y-3">
                  {SPEC_KEYS.map(({ labelKey, value, valueKey, icon: Icon }) => (
                    <div key={labelKey} className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                        <Icon
                          className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
                          strokeWidth={2.2}
                        />
                        {t(labelKey)}
                      </dt>
                      <dd className="text-right font-mono text-[11.5px] font-semibold text-slate-800 dark:text-slate-200">
                        {valueKey ? t(valueKey) : value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={LifeBuoy}>{t('join.codeNotWorking')}</SectionLabel>

                <ul className="mt-4 space-y-3">
                  {TROUBLE_KEYS.map(({ icon: Icon, textKey }) => (
                    <li key={textKey} className="flex items-start gap-2.5">
                      <Icon
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                        strokeWidth={2.2}
                      />
                      <span className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {t(textKey)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={Smartphone}>{t('join.joiningAs')}</SectionLabel>

                <p className="mt-3 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                  {deviceName}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {t('join.deviceHint')}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-emerald-50/40 p-5 dark:border-emerald-500/15 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.03]">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-white/[0.06] dark:text-emerald-400">
                    <Lock className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-emerald-900 dark:text-emerald-200">
                      {t('join.privateTitle')}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                      {t('join.privateBody')}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {/* Fixed bottom CTA — mobile + tablet (lg:hidden), same pattern as CreateRoom ReadyView */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/90 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0f1115]/95 dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)] lg:hidden">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleJoinRoom}
            disabled={joining || !codeReady || !isConnected}
            className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-[13px] font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-slate-500 sm:h-12 sm:px-4 sm:text-[14px] ${FOCUS_RING}`}
          >
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2.6} />
                <span className="truncate">{joinStage || t('join.connecting')}</span>
              </>
            ) : !isConnected ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2.6} />
                <span className="truncate">{t('join.connecting')}</span>
              </>
            ) : (
              <>
                <Radio className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                <span className="truncate">{t('join.connect')}</span>
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.6} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={joining}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-[12px] font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/15 sm:h-12 sm:px-4 sm:text-[13px] ${FOCUS_RING}`}
            aria-label={t('join.cancel')}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
            <span className="hidden xs:inline sm:inline">{t('join.cancel')}</span>
          </button>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}