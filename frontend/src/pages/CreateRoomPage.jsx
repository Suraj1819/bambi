import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Radio,
  RefreshCw,
  Loader2,
  Check,
  Copy,
  Share2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Clock3,
  HardDrive,
  Network,
  X,
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

export default function CreateRoomPage() {
  const navigate = useNavigate();

  const {
    socket,
    deviceName,
    deviceInfo,
    setRoomCode,
    setRole,
    setUsers,
  } = useRoom();

  const [loading, setLoading] = useState(false);
  const [roomCode, setLocalRoomCode] = useState(null);

  /* ============================================================
     ROOM CREATED LISTENER
  ============================================================ */

  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = ({
      roomCode: code,
      room,
      hostToken,
    }) => {
      setTimeout(() => {
        setLoading(false);

        setRoomCode(code);
        setRole('host');

        /*
         * Soft-leave:
         * Host is not considered inside the active room until
         * "Open transmission room" is clicked.
         */
        if (code) {
          socket.emit('leave-room', {
            roomCode: code,
          });
        }

        setUsers([]);
        setLocalRoomCode(code);

        if (hostToken) {
          saveHostToken(code, hostToken);
        }

        addRecentRoom(code, 'host');

        toast.success(
          'Room created',
          `Code ${code} is live. Open transmission when ready.`
        );
      }, 700);
    };

    socket.on('room-created', onRoomCreated);

    return () => {
      socket.off('room-created', onRoomCreated);
    };
  }, [
    socket,
    deviceName,
    setRoomCode,
    setRole,
    setUsers,
  ]);

  /* ============================================================
     GENERATE ROOM
  ============================================================ */

  const handleGenerate = () => {
    if (!socket) {
      toast.error(
        'Server not connected',
        'Please check the backend.'
      );

      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    socket.emit('create-room', {
      deviceName,
      deviceInfo,
    });

    setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          toast.error(
            'No response',
            'Backend did not respond in time.'
          );
        }

        return false;
      });
    }, 8000);
  };

  /* ============================================================
     CANCEL ROOM
  ============================================================ */

  const handleCancelRoom = () => {
    if (!roomCode) return;

    /*
     * Tell backend that host explicitly cancelled the room.
     */
    if (socket) {
      socket.emit('cancel-room', {
        roomCode,
      });
    }

    /*
     * Remove locally saved host token.
     */
    clearHostToken(roomCode);

    /*
     * Reset local room state.
     */
    setLocalRoomCode(null);
    setRoomCode(null);
    setRole(null);
    setUsers([]);

    toast.success(
      'Room cancelled',
      'The transfer room has been closed.'
    );
  };

  /* ============================================================
     CREATE ANOTHER ROOM
  ============================================================ */

  const handleNewRoom = () => {
    if (roomCode) {
      clearHostToken(roomCode);
    }

    setLocalRoomCode(null);
    setRoomCode(null);
    setRole(null);
    setUsers([]);
  };

  /* ============================================================
     PRODUCTION JOIN URL
  ============================================================ */

  const joinUrl = roomCode
    ? `${WEB_APP_URL}/join?room=${roomCode}`
    : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FBFAFF] transition-colors dark:bg-surface">

      {/* ========================================================
          BACKGROUND DECORATION
      ======================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-purple-500/[0.07] blur-3xl dark:bg-purple-500/[0.08]" />

        <div className="absolute right-[-180px] top-[240px] h-[380px] w-[380px] rounded-full bg-indigo-500/[0.05] blur-3xl dark:bg-indigo-500/[0.06]" />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <main className="relative mx-auto w-full max-w-[1440px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8 xl:px-10">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <section className="mx-auto max-w-[1100px]">

          <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">

            <div className="max-w-2xl">

              {/* EYEBROW */}

              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-purple-50/80 px-3 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/[0.08]">

                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-purple-500 opacity-50" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-purple-500" />
                </span>

                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-400">
                  Outbound transfer
                </span>

              </div>

              <h1 className="mt-5 font-heading text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] text-slate-900 dark:text-white sm:text-[48px] lg:text-[56px]">
                Create a private
                <span className="block text-purple-600 dark:text-purple-400">
                  transfer room.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-[14px] leading-6 text-slate-500 dark:text-slate-400 sm:text-[16px] sm:leading-7">
                Generate a temporary room and connect another device
                directly. Your files stay between the two browsers.
              </p>

            </div>

            {/* HEADER STATUS */}

            <div className="hidden shrink-0 sm:block">

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-white/[0.025] dark:shadow-none">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                  <Radio
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    Transfer mode
                  </p>

                  <p className="mt-1 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                    Peer-to-peer
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* ====================================================
              BEFORE ROOM CREATED
          ==================================================== */}

          {!roomCode ? (

            <div className="mt-10 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/[0.06] dark:bg-surface-card dark:shadow-none sm:mt-12">

              {/* TOP SECTION */}

              <div className="p-6 sm:p-8 lg:p-10">

                <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                      <ShieldCheck
                        className="h-5 w-5 text-purple-600 dark:text-purple-400"
                        strokeWidth={2}
                      />
                    </div>

                    <div>
                      <h2 className="font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[24px]">
                        Ready to connect
                      </h2>

                      <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-500 dark:text-slate-400 sm:text-[14px]">
                        Create a temporary handshake room. No files are
                        uploaded or stored on the WebDrop server.
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">

                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                      Direct transfer
                    </span>

                  </div>

                </div>

                {/* STATS */}

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <InfoStat
                    icon={Smartphone}
                    label="Capacity"
                    value="2 devices"
                  />

                  <InfoStat
                    icon={HardDrive}
                    label="Server storage"
                    value="0 MB"
                  />

                  <InfoStat
                    icon={Network}
                    label="Transfer"
                    value="WebRTC P2P"
                  />

                </div>

              </div>

              {/* ACTION AREA */}

              <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 dark:border-white/[0.05] dark:bg-white/[0.015] sm:px-8 lg:px-10">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-start gap-2.5">

                    <Clock3
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                      strokeWidth={1.8}
                    />

                    <p className="text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                      Rooms automatically expire after 30 minutes
                      of inactivity.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading || !socket}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 py-3.5 text-[13px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.65)] transition-all duration-200 hover:bg-purple-700 hover:shadow-[0_14px_35px_-12px_rgba(124,58,237,0.7)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >

                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating room...
                      </>
                    ) : (
                      <>
                        <Radio
                          className="h-5 w-5"
                          strokeWidth={2.2}
                        />

                        Generate room code

                        <ArrowRight
                          className="h-4 w-4"
                          strokeWidth={2.2}
                        />
                      </>
                    )}

                  </button>

                </div>

                {!socket && (
                  <p className="mt-3 text-right text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Waiting for server connection...
                  </p>
                )}

              </div>

            </div>

          ) : (

            /* ====================================================
               ROOM CREATED
            ==================================================== */

            <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 lg:grid-cols-[1.15fr_0.85fr]">

              {/* ==================================================
                  ROOM DETAILS
              ================================================== */}

              <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/[0.06] dark:bg-surface-card dark:shadow-none">

                <div className="p-6 sm:p-8 lg:p-10">

                  {/* STATUS */}

                  <div className="flex items-center justify-between gap-4">

                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">

                      <Check
                        className="h-3.5 w-3.5 text-emerald-500"
                        strokeWidth={3}
                      />

                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                        Room ready
                      </span>

                    </div>

                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      30 min expiry
                    </span>

                  </div>

                  {/* ROOM CODE */}

                  <div className="mt-8">

                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                      Your room code
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-4">

                      <h2 className="font-mono text-[38px] font-extrabold tracking-[0.18em] text-slate-900 dark:text-white sm:text-[54px]">
                        {roomCode}
                      </h2>

                      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-500/10 sm:flex">
                        <Radio
                          className="h-5 w-5 text-purple-600 dark:text-purple-400"
                          strokeWidth={2}
                        />
                      </div>

                    </div>

                    <p className="mt-4 max-w-xl text-[13px] leading-6 text-slate-500 dark:text-slate-400 sm:text-[14px]">
                      Share this code with the second device, or
                      scan the QR code to join automatically.
                    </p>

                  </div>

                  {/* COPY ACTIONS */}

                  <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">

                    <CopyButton
                      label="Copy room code"
                      value={roomCode}
                      icon={Copy}
                    />

                    <CopyButton
                      label="Copy join link"
                      value={joinUrl}
                      icon={Share2}
                    />

                  </div>

                  {/* URL */}

                  <div className="mt-4">

                    <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                      Join URL
                    </p>

                    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-white/[0.05] dark:bg-white/[0.025]">

                      <p className="break-all font-mono text-[10px] leading-5 text-slate-400 dark:text-slate-500 sm:text-[11px]">
                        {joinUrl}
                      </p>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    ROOM ACTIONS
                ================================================== */}

                <div className="border-t border-slate-100 bg-slate-50/60 p-5 dark:border-white/[0.05] dark:bg-white/[0.015] sm:p-6">

                  <div className="flex flex-col gap-2.5 sm:flex-row">

                    {/* OPEN TRANSMISSION */}

                    <button
                      type="button"
                      onClick={() => navigate(`/room/${roomCode}`)}
                      className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 py-3.5 text-[13px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.65)] transition-all duration-200 hover:bg-purple-700 hover:shadow-[0_14px_35px_-12px_rgba(124,58,237,0.7)] active:scale-[0.98]"
                    >
                      Open transmission room

                      <ExternalLink
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={2.2}
                      />
                    </button>

                    {/* CANCEL ROOM */}

                    <button
                      type="button"
                      onClick={handleCancelRoom}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-[13px] font-semibold text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-100 active:scale-[0.98] dark:border-red-500/20 dark:bg-red-500/[0.07] dark:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/[0.12]"
                    >
                      <X
                        className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90"
                        strokeWidth={2.2}
                      />

                      Cancel room
                    </button>

                  </div>

                </div>

              </div>

              {/* ==================================================
                  QR PANEL
              ================================================== */}

              <div className="flex flex-col overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.25)] backdrop-blur dark:border-white/[0.06] dark:bg-surface-card dark:shadow-none">

                <div className="p-6 sm:p-8 lg:p-10">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2.5">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                        <QrCode
                          className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400"
                          strokeWidth={2}
                        />
                      </div>

                      <div>
                        <h3 className="font-heading text-[16px] font-bold text-slate-900 dark:text-white sm:text-[18px]">
                          Scan to join
                        </h3>

                        <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                          Use your second device
                        </p>
                      </div>

                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                      QR
                    </span>

                  </div>

                  {/* QR */}

                  <div className="mt-8 flex items-center justify-center">

                    <div className="relative rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_15px_45px_-25px_rgba(15,23,42,0.3)] dark:border-white/[0.05]">

                      <div className="rounded-xl bg-white p-1">

                        <QRCodeSVG
                          value={joinUrl}
                          size={200}
                          level="M"
                          bgColor="#ffffff"
                          fgColor="#0f172a"
                          marginSize={1}
                          className="h-auto w-[180px] sm:w-[200px]"
                        />

                      </div>

                    </div>

                  </div>

                  <p className="mx-auto mt-7 max-w-sm text-center text-[12px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[13px]">
                    Scan this QR code with your other device.
                    The room code will be filled automatically.
                  </p>

                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-semibold text-slate-600 transition-all hover:border-purple-200 hover:text-purple-600 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-300 dark:hover:border-purple-500/20 dark:hover:text-purple-400"
                  >
                    Open join link

                    <ExternalLink
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2}
                    />
                  </a>

                </div>

                {/* SECURITY NOTE */}

                <div className="mt-auto border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.015] sm:px-8">

                  <div className="flex items-start gap-2.5">

                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      strokeWidth={2}
                    />

                    <p className="text-[10px] leading-4 text-slate-400 dark:text-slate-500">
                      Your files are transferred directly between
                      connected devices.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          )}

          {/* ======================================================
              BOTTOM ACTIONS
          ====================================================== */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-6 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">

            <Link
              to="/"
              className="group inline-flex items-center justify-center gap-2 text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:justify-start"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-0.5">
                ←
              </span>

              Back to overview
            </Link>

            {roomCode && (
              <button
                type="button"
                onClick={handleNewRoom}
                className="group inline-flex items-center justify-center gap-2 text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <RefreshCw
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180"
                  strokeWidth={1.9}
                />

                Create another room
              </button>
            )}

          </div>

        </section>

      </main>
    </div>
  );
}

/* ================================================================
   INFO STAT
================================================================ */

function InfoStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5 dark:border-white/[0.05] dark:bg-white/[0.025]">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/[0.05] dark:shadow-none">

        <Icon
          className="h-4 w-4 text-slate-500 dark:text-slate-400"
          strokeWidth={1.8}
        />

      </div>

      <div className="min-w-0">

        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
          {label}
        </p>

        <p className="mt-1 truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
          {value}
        </p>

      </div>

    </div>
  );
}