// src/pages/JoinRoom.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Check,
  Copy,
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

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'End-to-end encrypted',
    desc: 'Every byte travels over an encrypted WebRTC DataChannel.',
    tone: 'emerald',
  },
  {
    icon: KeyRound,
    title: 'Code-based access',
    desc: 'Only someone with the 5-character code can join.',
    tone: 'violet',
  },
  {
    icon: Clock3,
    title: 'Auto-expires',
    desc: 'Rooms close themselves after 30 minutes.',
    tone: 'amber',
  },
  {
    icon: Users,
    title: 'Two devices only',
    desc: 'One sender, one receiver. Nothing in between.',
    tone: 'sky',
  },
];

const SPECS = [
  { label: 'Transport', value: 'WebRTC · DTLS', icon: Server },
  { label: 'Signaling', value: 'Socket.IO', icon: Wifi },
  { label: 'Auth', value: 'Room code only', icon: KeyRound },
  { label: 'Storage', value: 'Zero on server', icon: FileCheck },
];

const FAQS = [
  {
    q: 'Where do I find the room code?',
    a: 'The sending device shows a 5-character code and a QR. Ask them to share either one with you.',
  },
  {
    q: 'The code expired — what now?',
    a: 'Rooms close automatically after 30 minutes. Ask the sender to generate a fresh room and share the new code.',
  },
  {
    q: 'Someone else already joined. Can I still connect?',
    a: 'Each room holds exactly two devices. The host can remove the other device from their room to make space for you.',
  },
  {
    q: 'Why does the camera show "unavailable"?',
    a: 'Your browser needs camera permission for scanning. You can always type the code manually instead.',
  },
];

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
      className={`fixed bottom-5 right-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur-sm transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.1] dark:bg-[#15171d]/95 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-300 ${FOCUS_RING}`}
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

  /* Scroll top on route change */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  /* Read room code from URL */
  useEffect(() => {
    const urlCode = searchParams.get('room') || searchParams.get('code');
    if (!urlCode) return;

    const cleaned = normalizeRoomCode(urlCode);
    if (isValidRoomCode(cleaned)) {
      setCode(cleaned);
      toast.info('Room code detected', `Code ${cleaned} prefilled.`);
    } else {
      toast.warning('Invalid code', 'Please enter the code manually.');
    }
  }, [searchParams]);

  /* Start QR scanner */
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
            'Camera unavailable',
            denied
              ? 'Camera permission was denied. Allow it in your browser settings, or type the code instead.'
              : noCamera
                ? 'No camera was found on this device. Type the code instead.'
                : 'Could not start the camera. Please try again or type the code.',
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

  /* Handle QR result */
  const handleQrResult = (decodedText) => {
    if (scanHandledRef.current) return;

    try {
      const cleaned = parseRoomInput(decodedText);
      if (!isValidRoomCode(cleaned)) return;

      scanHandledRef.current = true;
      setCode(cleaned);
      setError('');

      toast.success('QR scanned', `Code ${cleaned} detected.`);
      stopScanner();
    } catch (err) {
      console.error('[QR Scanner] QR processing error:', err);
    }
  };

  /* Stop scanner */
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

  /* Cleanup scanner */
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

  /* Manual code input */
  const handleChange = (e) => {
    const cleaned = normalizeRoomCode(e.target.value);
    setCode(cleaned);

    if (error) setError('');
    if (joinStage) setJoinStage('');
  };

  /* Paste from clipboard */
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = parseRoomInput(text);

      if (isValidRoomCode(cleaned)) {
        setCode(cleaned);
        setError('');
        setJoinStage('');
        toast.success('Code pasted', `Code ${cleaned} detected.`);
      } else {
        toast.warning(
          'No room code found',
          'The clipboard does not contain a valid room code or link.',
        );
      }
    } catch {
      toast.warning(
        'Paste unavailable',
        'Allow clipboard access in your browser, or type the code instead.',
      );
    }
  };

  /* Check room */
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

  /* Join room */
  const handleJoinRoom = async (e) => {
    if (e) e.preventDefault();
    if (joining) return;

    if (!isValidRoomCode(code)) {
      setError('Please enter a valid 5-character room code.');
      return;
    }

    if (!socket || !connected || !socket.connected) {
      setError(
        'Connecting to WebDrop server. Please wait a moment and try again.',
      );
      return;
    }

    const roomCode = normalizeRoomCode(code);

    setError('');
    setJoining(true);
    setJoinStage('Finding room…');

    try {
      const response = await checkRoom(roomCode);

      if (!response?.success) {
        const serverMessage =
          response?.message ||
          'Room not found. Please check the room code and try again.';

        setError(serverMessage);
        setJoinStage('');
        setJoining(false);

        toast.error('Room unavailable', serverMessage);
        return;
      }

      setJoinStage('Room found');

      await new Promise((resolve) => {
        setTimeout(resolve, 350);
      });

      setJoinStage('Establishing connection…');

      addRecentRoom({
        roomCode,
        role: 'guest',
        deviceName,
        joinedAt: Date.now(),
        lastJoinedAt: Date.now(),
      });

      if (showScanner) {
        await stopScanner();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });

      navigate(`/room/${roomCode}`);
    } catch (err) {
      console.error('[JoinRoom] Room check failed:', err);

      let message = 'Failed to check the room. Please try again.';

      if (err?.message === 'Room check timed out.') {
        message =
          'Room check timed out. Please check your connection and try again.';
      }

      if (err?.message === 'WebDrop server is not connected.') {
        message =
          'WebDrop server is not connected. Please wait a moment and try again.';
      }

      if (err?.message === 'Socket connection is not available.') {
        message = 'Connection to the WebDrop server is unavailable.';
      }

      setError(message);
      setJoinStage('');
      setJoining(false);

      toast.error('Connection failed', message);
    }
  };

  /* Cancel */
  const handleCancel = async () => {
    if (showScanner || scannerRef.current) {
      await stopScanner();
    }

    setJoining(false);
    setJoinStage('');
    setError('');
    setCode('');

    toast.info('Join cancelled', 'Room code and connection attempt were cleared.');
  };

  /* Recent rooms */
  const recentRooms = useMemo(() => getRecentRooms(), []);
  const codeReady = code.length === 5;
  const isConnected = Boolean(connected && socket?.connected);

  return (
    <div className="relative min-h-screen bg-[#FBFAFF] text-slate-900 transition-colors dark:bg-surface dark:text-white">
      {/* Top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-10">
        {/* Top nav */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 ${FOCUS_RING}`}
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2.4}
          />
          Back to home
        </button>

        <section className="mt-8 sm:mt-12">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
            {/* ============ LEFT COLUMN ============ */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1 dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                  Join a transfer
                </span>
              </div>

              {/* Heading — same size as CreateRoom */}
              <h1 className="mt-4 font-heading text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[42px] lg:text-[48px]">
                Enter your
                <span className="block bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                  room code.
                </span>
              </h1>

              <p className="mt-5 max-w-[560px] text-[14.5px] leading-7 text-slate-600 dark:text-slate-400">
                Type the code from the sending device — or scan its QR. As soon
                as you connect, files travel directly between the two devices.
              </p>

              {/* ============ JOIN FORM CARD ============ */}
              <form
                onSubmit={handleJoinRoom}
                noValidate
                className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6"
              >
                {/* Header */}
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
                        Your room code
                      </p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {codeReady
                          ? 'Code looks good — ready to connect.'
                          : '5 characters. Letters O, I and digits 0, 1 are skipped.'}
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

                {/* Input */}
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
                      aria-label="Room code"
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

                  {/* Paste / clear row */}
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-[11.5px] leading-5 text-slate-400 dark:text-slate-500">
                      Paste a code or full invite link.
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

                  {/* Error */}
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
                </div>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    or scan
                  </span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-white/[0.06]" />
                </div>

                {/* QR toggle button */}
                {!showScanner && (
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    disabled={joining}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.02] dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.06] dark:hover:text-violet-300 ${FOCUS_RING}`}
                  >
                    <Camera className="h-4 w-4" strokeWidth={2.2} />
                    Scan QR code
                  </button>
                )}

                {/* QR scanner view */}
                {showScanner && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.07] dark:bg-white/[0.025]">
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Camera
                          className="h-4 w-4 text-violet-600 dark:text-violet-400"
                          strokeWidth={2.2}
                        />
                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                          Scan room QR
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={stopScanner}
                        aria-label="Close QR scanner"
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
                        Point your camera at the QR code on the sending device.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <button
                    type="submit"
                    disabled={joining || !codeReady || !isConnected}
                    className={`inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-6 text-[14px] font-bold text-white shadow-lg shadow-violet-600/20 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-slate-500 ${FOCUS_RING}`}
                  >
                    {joining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.6} />
                        <span>{joinStage || 'Connecting…'}</span>
                      </>
                    ) : !isConnected ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.6} />
                        <span>Connecting…</span>
                      </>
                    ) : (
                      <>
                        <span>Connect to room</span>
                        <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={joining}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-red-500/20 dark:hover:bg-red-500/[0.06] dark:hover:text-red-400 sm:w-auto ${FOCUS_RING}`}
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Clear
                  </button>
                </div>

                {/* Status strip */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
                      }`}
                    />
                    <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {isConnected ? 'Server connected' : 'Connecting to server…'}
                    </span>
                  </div>
                  <span className="hidden h-3 w-px bg-slate-200 dark:bg-white/[0.08] sm:block" />
                  <span className="text-[12px] text-slate-400 dark:text-slate-500">
                    Signaling only — no file storage
                  </span>
                </div>

                {/* Not connected warning */}
                {!isConnected && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-500/15 dark:bg-amber-500/[0.06]">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                      strokeWidth={2.4}
                    />
                    <p className="text-[11.5px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                      <strong className="font-semibold">Waiting for connection.</strong>{' '}
                      Joining will become available once we reach the WebDrop
                      server. Usually a few seconds.
                    </p>
                  </div>
                )}
              </form>

              {/* ============ RECENT ROOMS ============ */}
              {recentRooms.length > 0 && (
                <div className="mt-6">
                  <SectionLabel icon={History}>Recent rooms</SectionLabel>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {recentRooms.map((room) => (
                      <button
                        key={`${room.roomCode}-${room.lastJoinedAt}`}
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
                          {room.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ CAPABILITIES ============ */}
              <div className="mt-10">
                <SectionLabel icon={CircleDot}>Capabilities</SectionLabel>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {CAPABILITIES.map(({ icon: Icon, title, desc, tone }) => {
                    const t = ToneStyles(tone);
                    return (
                      <div
                        key={title}
                        className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-violet-200 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-violet-500/30"
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.bg} ${t.text}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                        <p className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white">
                          {title}
                        </p>
                        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============ FAQS ============ */}
              <div className="mt-10">
                <SectionLabel icon={Info}>Common questions</SectionLabel>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
                  {FAQS.map(({ q, a }, i) => (
                    <details
                      key={q}
                      className={`group ${
                        i !== FAQS.length - 1
                          ? 'border-b border-slate-100 dark:border-white/[0.06]'
                          : ''
                      }`}
                    >
                      <summary
                        className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[12.5px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
                      >
                        <span className="pr-2">{q}</span>
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
                        {a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            {/* ============ RIGHT COLUMN (STICKY) ============ */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={Command}>How joining works</SectionLabel>

                <ol className="mt-4 space-y-4">
                  {JOIN_STEPS.map(({ icon: Icon, title, text }, i) => (
                    <li key={title} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                          {title}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={Server}>Technical details</SectionLabel>

                <dl className="mt-4 space-y-3">
                  {SPECS.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                        <Icon
                          className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
                          strokeWidth={2.2}
                        />
                        {label}
                      </dt>
                      <dd className="text-right font-mono text-[11.5px] font-semibold text-slate-800 dark:text-slate-200">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Troubleshooting */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={LifeBuoy}>Code not working?</SectionLabel>

                <ul className="mt-4 space-y-3">
                  {TROUBLESHOOTING.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      <Icon
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                        strokeWidth={2.2}
                      />
                      <span className="text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Device card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <SectionLabel icon={Smartphone}>You're joining as</SectionLabel>

                <p className="mt-3 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                  {deviceName}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                  This is how the sender will see your device.
                </p>
              </div>

              {/* Security */}
              <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-emerald-50/40 p-5 dark:border-emerald-500/15 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.03]">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-white/[0.06] dark:text-emerald-400">
                    <Lock className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-emerald-900 dark:text-emerald-200">
                      Private by design
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                      Files travel encrypted between the two devices. Nothing
                      is stored on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <ScrollToTop />
    </div>
  );
}