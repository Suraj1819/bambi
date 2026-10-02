import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  QrCode,
  Radio,
  RefreshCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Users,
  X,
  Zap,
} from 'lucide-react';

import {
  useRoom,
  saveHostToken,
  addRecentRoom,
  clearHostToken,
} from '../context/RoomContext';

import { WEB_APP_URL } from '../utils/constants';

import { toast } from '../components/common/ToastContainer';
import CopyButton from '../components/common/CopyButton';

/* ============================================================
   CONSTANTS
============================================================ */

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20';

const ROOM_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Direct transfer',
    text: 'Files move directly between connected devices.',
  },
  {
    icon: Users,
    title: '2 devices',
    text: 'One room connects one sender and one receiver.',
  },
  {
    icon: Clock3,
    title: '30 minutes',
    text: 'Rooms expire automatically after 30 minutes.',
  },
];

/* ============================================================
   HELPERS
============================================================ */

function getDeviceInfo() {
  try {
    const ua = navigator.userAgent || '';

    if (/iPhone|iPad|iPod/i.test(ua)) {
      return 'iOS device';
    }

    if (/Android/i.test(ua)) {
      return 'Android device';
    }

    if (/Windows/i.test(ua)) {
      return 'Windows device';
    }

    if (/Macintosh|Mac OS X/i.test(ua)) {
      return 'Mac device';
    }

    if (/Linux/i.test(ua)) {
      return 'Linux device';
    }

    return 'Web browser';
  } catch {
    return 'Web browser';
  }
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = 'purple',
}) {
  const isEmerald = tone === 'emerald';

  return (
    <div className="flex items-start gap-3.5">
      <div
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${
            isEmerald
              ? 'bg-emerald-50 dark:bg-emerald-500/[0.09]'
              : 'bg-purple-50 dark:bg-purple-500/[0.09]'
          }
        `}
      >
        <Icon
          className={`
            h-5 w-5
            ${
              isEmerald
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-purple-600 dark:text-purple-400'
            }
          `}
          strokeWidth={2}
        />
      </div>

      <div className="min-w-0">
        <p
          className={`
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.12em]
            ${
              isEmerald
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-purple-600 dark:text-purple-400'
            }
          `}
        >
          {eyebrow}
        </p>

        <h2 className="mt-1 font-heading text-[21px] font-bold leading-tight tracking-[-0.025em] text-slate-900 dark:text-white sm:text-[22px]">
          {title}
        </h2>

        {description && (
          <p className="mt-1.5 max-w-[560px] text-[13px] leading-[20px] text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY CREATE ROOM CONTENT
============================================================ */

function CreateRoomContent({
  loading,
  connected,
  socket,
  onGenerate,
}) {
  const isConnected = connected && socket?.connected;

  return (
    <div>
      <SectionHeader
        icon={Radio}
        eyebrow="New transfer"
        title="Create your transfer room"
        description="Generate a temporary room code and share it with the device that will receive your files."
      />

      {/* PRIMARY CREATE PANEL */}
      <div className="mt-6 rounded-2xl border border-purple-100 bg-purple-50/60 p-5 dark:border-purple-500/10 dark:bg-purple-500/[0.045] sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm dark:bg-white/[0.07] dark:text-purple-400">
              <Zap
                className="h-[18px] w-[18px]"
                strokeWidth={2.2}
              />
            </div>

            <div>
              <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">
                Ready to create a room?
              </p>

              <p className="mt-1 text-[12.5px] leading-5 text-slate-500 dark:text-slate-400">
                WebDrop will generate a unique 5-character code
                that you can share with another device.
              </p>
            </div>
          </div>

          {/* LARGE CTA */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || !isConnected}
            className="
              group
              inline-flex
              h-14
              w-full
              items-center
              justify-center
              gap-2.5
              rounded-2xl
              bg-purple-600
              px-6
              text-[14px]
              font-bold
              text-white
              shadow-[0_14px_35px_-12px_rgba(124,58,237,0.65)]
              transition-all
              duration-200
              hover:bg-purple-700
              hover:shadow-[0_16px_38px_-12px_rgba(124,58,237,0.72)]
              focus:outline-none
              focus-visible:ring-4
              focus-visible:ring-purple-500/25
              active:scale-[0.985]
              disabled:cursor-not-allowed
              disabled:opacity-50
              disabled:shadow-none
            "
          >
            {loading ? (
              <>
                <Loader2
                  className="h-5 w-5 animate-spin"
                  strokeWidth={2.2}
                />
                Creating room...
              </>
            ) : (
              <>
                Generate room
                <ArrowRight
                  className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.4}
                />
              </>
            )}
          </button>

          {/* CONNECTION STATUS */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`
                  h-2 w-2 shrink-0 rounded-full
                  ${
                    isConnected
                      ? 'bg-emerald-500'
                      : 'animate-pulse bg-amber-500'
                  }
                `}
              />

              <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                {isConnected
                  ? 'WebDrop server connected'
                  : 'Connecting to WebDrop server...'}
              </p>
            </div>

            <span className="shrink-0 text-[10.5px] font-medium text-slate-400 dark:text-slate-600">
              Signaling only
            </span>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {ROOM_FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="
              rounded-xl
              border
              border-slate-100
              bg-slate-50/70
              p-3.5
              dark:border-white/[0.05]
              dark:bg-white/[0.025]
            "
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-white/[0.06]">
                <Icon
                  className="h-4 w-4 text-slate-500 dark:text-slate-400"
                  strokeWidth={1.9}
                />
              </div>

              <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
                {title}
              </p>
            </div>

            <p className="mt-2 text-[10.5px] leading-[17px] text-slate-400 dark:text-slate-500">
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* PRIVACY */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/55 px-4 py-3.5 dark:border-emerald-500/10 dark:bg-emerald-500/[0.04]">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
          strokeWidth={2}
        />

        <p className="text-[11.5px] leading-[18px] text-slate-500 dark:text-slate-400">
          WebDrop does not upload or store your files on the
          server. The server is used only to help both devices
          establish a connection.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   GENERATED ROOM CONTENT
============================================================ */

function GeneratedRoomContent({
  roomCode,
  joinUrl,
  onOpenRoom,
  onOpenJoinLink,
  onShare,
  onNewRoom,
  onCancelRoom,
}) {
  return (
    <div>
      {/* HEADER */}
      <SectionHeader
        icon={CheckCircle2}
        eyebrow="Room ready"
        title="Your transfer room is ready"
        description="Share the room code or QR code with the receiving device to connect."
        tone="emerald"
      />

      {/* ======================================================
          ROOM CODE HERO
      ====================================================== */}

      <div className="mt-6">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-400 dark:text-slate-500">
              Room code
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
              Share this code with the other device
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        <div className="rounded-[22px] border border-purple-200/80 bg-gradient-to-br from-purple-50 via-purple-50/80 to-indigo-50/60 p-4 dark:border-purple-500/20 dark:from-purple-500/[0.09] dark:via-purple-500/[0.06] dark:to-indigo-500/[0.05] sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border border-purple-200/60 bg-white/70 px-4 py-3 shadow-sm dark:border-purple-500/10 dark:bg-white/[0.035] sm:min-h-[104px] sm:px-5">
              <p className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[38px] font-black tracking-[0.14em] text-purple-700 dark:text-purple-300 sm:text-[48px] sm:tracking-[0.2em]">
                {roomCode}
              </p>

              <CopyButton
                label="Copy code"
                value={roomCode}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                The receiving device can enter this code on
                WebDrop.
              </p>

              <span className="shrink-0 text-[10px] font-medium text-purple-500 dark:text-purple-400">
                5 characters
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          JOIN LINK
      ====================================================== */}

      <div className="mt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
            Join link
          </span>

          <span className="text-[10.5px] text-slate-400 dark:text-slate-600">
            Direct access
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-white/[0.07] dark:bg-white/[0.025] sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 px-2 py-1">
            <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
              {joinUrl}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <CopyButton
              label="Copy link"
              value={joinUrl}
            />

            <button
              type="button"
              onClick={onOpenJoinLink}
              className={`
                inline-flex
                h-10
                items-center
                justify-center
                gap-1.5
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3.5
                text-[12px]
                font-semibold
                text-slate-600
                transition-all
                hover:border-purple-300
                hover:bg-purple-50
                hover:text-purple-700
                dark:border-white/[0.09]
                dark:bg-white/[0.035]
                dark:text-slate-300
                dark:hover:border-purple-500/30
                dark:hover:bg-purple-500/[0.06]
                dark:hover:text-purple-300
                ${FOCUS_RING}
              `}
              aria-label="Open join link"
            >
              <ExternalLink
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />
              <span className="hidden sm:inline">
                Open
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN ACTIONS
      ====================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto]">
        {/* OPEN TRANSFER */}
        <button
          type="button"
          onClick={onOpenRoom}
          className="
            group
            inline-flex
            h-13
            min-h-[52px]
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-purple-600
            px-5
            text-[13px]
            font-bold
            text-white
            shadow-[0_12px_30px_-13px_rgba(124,58,237,0.75)]
            transition-all
            duration-200
            hover:bg-purple-700
            hover:shadow-[0_14px_34px_-13px_rgba(124,58,237,0.8)]
            focus:outline-none
            focus-visible:ring-4
            focus-visible:ring-purple-500/25
            active:scale-[0.98]
          "
        >
          <Radio
            className="h-[17px] w-[17px]"
            strokeWidth={2.2}
          />

          Open transfer room

          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={2.4}
          />
        </button>

        {/* CANCEL — BESIDE OPEN */}
        <button
          type="button"
          onClick={onCancelRoom}
          className={`
            inline-flex
            min-h-[52px]
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-red-200/80
            bg-white
            px-5
            text-[12.5px]
            font-semibold
            text-red-500
            transition-all
            hover:border-red-300
            hover:bg-red-50
            hover:text-red-600
            dark:border-red-500/15
            dark:bg-white/[0.025]
            dark:text-red-400
            dark:hover:border-red-500/25
            dark:hover:bg-red-500/[0.06]
            dark:hover:text-red-300
            ${FOCUS_RING}
          `}
        >
          <X
            className="h-4 w-4"
            strokeWidth={2}
          />

          Cancel
        </button>
      </div>

      {/* SHARE + NEW ROOM */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onShare}
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            text-[12px]
            font-medium
            text-slate-500
            transition-colors
            hover:text-purple-600
            dark:text-slate-400
            dark:hover:text-purple-400
            ${FOCUS_RING}
          `}
        >
          <Share2
            className="h-3.5 w-3.5"
            strokeWidth={2}
          />

          Share room link
        </button>

        <button
          type="button"
          onClick={onNewRoom}
          className={`
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            text-[12px]
            font-medium
            text-slate-400
            transition-colors
            hover:text-purple-600
            dark:text-slate-500
            dark:hover:text-purple-400
            ${FOCUS_RING}
          `}
        >
          <RefreshCw
            className="h-3.5 w-3.5"
            strokeWidth={2}
          />

          Generate another
        </button>
      </div>

      {/* SECURITY */}
      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/55 px-4 py-3.5 dark:border-emerald-500/10 dark:bg-emerald-500/[0.04]">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
          strokeWidth={2}
        />

        <div>
          <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
            Your files stay between devices
          </p>

          <p className="mt-0.5 text-[11px] leading-[18px] text-slate-500 dark:text-slate-400">
            WebDrop uses the server for signaling only. Your files
            are not uploaded or stored on the server.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   GENERATED QR PANEL
============================================================ */

function GeneratedQR({ roomCode, joinUrl }) {
  return (
    <div>
      <SectionHeader
        icon={QrCode}
        eyebrow="Quick connect"
        title="Scan to join"
        description="Use the camera on the receiving device to open this room automatically."
      />

      {/* QR */}
      <div className="mt-6 flex justify-center">
        <div className="rounded-[24px] border border-slate-200 bg-white p-3.5 shadow-[0_10px_32px_rgba(15,23,42,0.07)] dark:border-white/[0.08]">
          <QRCodeSVG
            value={joinUrl}
            level="M"
            includeMargin
            className="h-[190px] w-[190px] sm:h-[205px] sm:w-[205px]"
          />
        </div>
      </div>

      {/* ROOM */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3.5 text-center dark:border-white/[0.05] dark:bg-white/[0.025]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
          Room
        </p>

        <p className="mt-1 font-mono text-[21px] font-bold tracking-[0.2em] text-slate-800 dark:text-slate-200">
          {roomCode}
        </p>

        <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">
          Scan to open the WebDrop join page.
        </p>
      </div>

      {/* FEATURES */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {ROOM_FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="
              flex
              items-start
              gap-2.5
              rounded-xl
              border
              border-slate-100
              bg-white/70
              px-3.5
              py-3
              dark:border-white/[0.05]
              dark:bg-white/[0.025]
            "
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.05]">
              <Icon
                className="h-4 w-4 text-slate-500 dark:text-slate-400"
                strokeWidth={1.9}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
                {title}
              </p>

              <p className="mt-0.5 text-[10.5px] leading-[17px] text-slate-400 dark:text-slate-500">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   HOW IT WORKS
============================================================ */

function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Radio,
      title: 'Create a room',
      text: 'Generate a temporary 5-character room code.',
    },
    {
      number: '02',
      icon: Smartphone,
      title: 'Share the connection',
      text: 'Send the code, link, or QR code to the other device.',
    },
    {
      number: '03',
      icon: ShieldCheck,
      title: 'Transfer directly',
      text: 'Once connected, files move peer-to-peer between devices.',
    },
  ];

  return (
    <div>
      <SectionHeader
        icon={QrCode}
        eyebrow="How it works"
        title="Create and connect"
        description="No account is required, and your files are never stored on the server."
      />

      <div className="mt-6 space-y-2.5">
        {steps.map(
          ({ number, icon: Icon, title, text }) => (
            <div
              key={number}
              className="
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-slate-100
                bg-slate-50/70
                px-3.5
                py-3.5
                dark:border-white/[0.05]
                dark:bg-white/[0.025]
              "
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <Icon
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">
                  <span className="mr-1.5 font-mono text-[10px] text-slate-300 dark:text-slate-600">
                    {number}
                  </span>

                  {title}
                </p>

                <p className="mt-0.5 text-[11px] leading-[18px] text-slate-400 dark:text-slate-500">
                  {text}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* DETAILS */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.025]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            Room lifetime
          </p>

          <div className="mt-2 flex items-center gap-1.5">
            <Clock3
              className="h-4 w-4 text-slate-500 dark:text-slate-400"
              strokeWidth={1.9}
            />

            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              30 minutes
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/[0.05] dark:bg-white/[0.025]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            Devices
          </p>

          <div className="mt-2 flex items-center gap-1.5">
            <Users
              className="h-4 w-4 text-slate-500 dark:text-slate-400"
              strokeWidth={1.9}
            />

            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              2 maximum
            </p>
          </div>
        </div>
      </div>

      {/* PRIVACY */}
      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/55 px-4 py-3.5 dark:border-emerald-500/10 dark:bg-emerald-500/[0.04]">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
          strokeWidth={2}
        />

        <div>
          <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
            Privacy by design
          </p>

          <p className="mt-0.5 text-[10.5px] leading-[17px] text-slate-400 dark:text-slate-500">
            The signaling server helps devices find each other but
            does not receive or store your files.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function CreateRoomPage() {
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const [deviceName] = useState(() => {
    try {
      return getDeviceInfo();
    } catch {
      return 'Web browser';
    }
  });

  const [deviceInfo] = useState(() => getDeviceInfo());

  const navigate = useNavigate();

  const {
    socket,
    connected,
    setRoomCode: setLocalRoomCode,
    setRole,
    setUsers,
  } = useRoom();

  /* ============================================================
     JOIN URL
  ============================================================ */

  const joinUrl = useMemo(() => {
    if (!roomCode) return '';

    return `${WEB_APP_URL}/join?room=${encodeURIComponent(
      roomCode
    )}`;
  }, [roomCode]);

  /* ============================================================
     ROOM CREATED EVENT
  ============================================================ */

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = ({
      roomCode: code,
      hostToken,
    }) => {
      if (!code) {
        setLoading(false);

        toast.error(
          'Room creation failed',
          'The server did not return a room code.'
        );

        return;
      }

      window.setTimeout(() => {
        setLoading(false);

        setRoomCode(code);
        setLocalRoomCode(code);
        setRole('host');
        setUsers([]);

        /*
         * The host room is only joined when the user opens
         * the actual transfer room.
         */
        socket.emit('leave-room', {
          roomCode: code,
        });

        if (hostToken) {
          saveHostToken(code, hostToken);
        }

        addRecentRoom(code, 'host');

        toast.success(
          'Room created',
          `Room ${code} is ready.`
        );
      }, 300);
    };

    socket.on('room-created', handleRoomCreated);

    return () => {
      socket.off('room-created', handleRoomCreated);
    };
  }, [
    socket,
    setLocalRoomCode,
    setRole,
    setUsers,
  ]);

  /* ============================================================
     GENERATE ROOM
  ============================================================ */

  const handleGenerate = () => {
    if (!socket || !connected || !socket.connected) {
      toast.error(
        'Server not connected',
        'Please wait for the WebDrop server connection.'
      );

      return;
    }

    if (loading) return;

    setLoading(true);

    socket.emit('create-room', {
      deviceName,
      deviceInfo,
    });

    window.setTimeout(() => {
      setLoading((current) => {
        if (!current) return current;

        toast.error(
          'No response',
          'The backend did not respond in time.'
        );

        return false;
      });
    }, 8000);
  };

  /* ============================================================
     OPEN TRANSFER ROOM
  ============================================================ */

  const handleOpenTransmission = () => {
    if (!roomCode) return;

    navigate(`/room/${roomCode}`);
  };

  /* ============================================================
     OPEN JOIN LINK
  ============================================================ */

  const handleOpenJoinLink = () => {
    if (!joinUrl) return;

    window.open(
      joinUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  /* ============================================================
     SHARE
  ============================================================ */

  const handleShare = async () => {
    if (!joinUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join my WebDrop room',
          text: `Join my WebDrop room using code ${roomCode}.`,
          url: joinUrl,
        });

        return;
      }

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(joinUrl);

        toast.success(
          'Link copied',
          'Room link copied to clipboard.'
        );

        return;
      }

      toast.info(
        'Share link',
        'Copy the room link manually.'
      );
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }

      console.error('Share failed:', error);

      toast.error(
        'Unable to share',
        'Please copy the room link manually.'
      );
    }
  };

  /* ============================================================
     CANCEL ROOM
  ============================================================ */

  const handleCancelRoom = () => {
    if (!roomCode) return;

    if (socket) {
      socket.emit('cancel-room', {
        roomCode,
      });
    }

    clearHostToken(roomCode);

    setRoomCode(null);
    setLocalRoomCode(null);
    setRole(null);
    setUsers([]);

    toast.success(
      'Room cancelled',
      'The transfer room has been closed.'
    );
  };

  /* ============================================================
     NEW ROOM
  ============================================================ */

  const handleNewRoom = () => {
    if (roomCode) {
      clearHostToken(roomCode);
    }

    setRoomCode(null);
    setLocalRoomCode(null);
    setRole(null);
    setUsers([]);
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FBFAFF] text-slate-900 transition-colors dark:bg-surface dark:text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-purple-500/[0.065] blur-3xl dark:bg-purple-500/[0.075]" />

        <div className="absolute left-[-170px] top-[360px] h-[360px] w-[360px] rounded-full bg-indigo-500/[0.045] blur-3xl dark:bg-indigo-500/[0.055]" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <main className="relative mx-auto w-full max-w-[1280px] px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8">
        <section className="mx-auto max-w-[1120px]">
          {/* ==================================================
              TOP INTRO
          ================================================== */}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-[720px]">
              {/* EYEBROW */}
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-3.5 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/[0.08]">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />

                <span className="text-[12px] font-semibold text-purple-600 dark:text-purple-400">
                  Send files
                </span>
              </div>

              {/* TITLE */}
              <h1 className="mt-3.5 font-heading text-[35px] font-extrabold leading-[1.05] tracking-[-0.045em] text-slate-900 dark:text-white sm:text-[44px] lg:text-[50px]">
                Create a private
                <span className="block text-purple-600 dark:text-purple-400">
                  transfer room.
                </span>
              </h1>

              {/* DESCRIPTION */}
              <p className="mt-4 max-w-[650px] text-[14.5px] leading-6 text-slate-500 dark:text-slate-400 sm:text-[15px] sm:leading-7">
                Generate a temporary room code and share it with
                another device to connect directly. No account and
                no upload to a server.
              </p>
            </div>

            {/* CONNECTION BADGE */}
            <div className="hidden shrink-0 sm:block">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3.5 shadow-[0_4px_18px_rgba(15,23,42,0.03)] backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.025]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                  <ShieldCheck
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500">
                    Connection
                  </p>

                  <p className="mt-0.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                    Peer-to-peer transfer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <div className="mt-7 grid gap-5 lg:grid-cols-[1.28fr_0.92fr] lg:items-start">
            {/* =================================================
                LEFT
            ================================================= */}

            <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.025)] dark:border-white/[0.06] dark:bg-surface-card dark:shadow-none">
              <div className="p-5 sm:p-7">
                {!roomCode ? (
                  <CreateRoomContent
                    loading={loading}
                    connected={connected}
                    socket={socket}
                    onGenerate={handleGenerate}
                  />
                ) : (
                  <GeneratedRoomContent
                    roomCode={roomCode}
                    joinUrl={joinUrl}
                    onOpenRoom={handleOpenTransmission}
                    onOpenJoinLink={handleOpenJoinLink}
                    onShare={handleShare}
                    onNewRoom={handleNewRoom}
                    onCancelRoom={handleCancelRoom}
                  />
                )}
              </div>
            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <aside className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.025)] dark:border-white/[0.06] dark:bg-surface-card dark:shadow-none sm:p-6">
              {roomCode ? (
                <GeneratedQR
                  roomCode={roomCode}
                  joinUrl={joinUrl}
                />
              ) : (
                <HowItWorks />
              )}
            </aside>
          </div>

          {/* ==================================================
              BOTTOM NAV
          ================================================== */}

          <div className="mt-6 border-t border-slate-200/70 pt-5 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`
                group
                inline-flex
                items-center
                gap-2
                rounded-lg
                text-[13px]
                font-medium
                text-slate-500
                transition-colors
                hover:text-slate-900
                dark:text-slate-400
                dark:hover:text-white
                ${FOCUS_RING}
              `}
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