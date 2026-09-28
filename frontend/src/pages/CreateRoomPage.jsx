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
  Shield,
} from 'lucide-react';

import {
  useRoom,
  saveHostToken,
  addRecentRoom,
  clearHostToken,
} from '../context/RoomContext';

import { WEB_APP_URL } from '../utils/constants';

import { toast } from '../components/common/ToastContainer';
import StatCard from '../components/common/StatCard';
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

  const [loading, setLoading] =
    useState(false);

  const [roomCode, setLocalRoomCode] =
    useState(null);


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
          socket.emit(
            'leave-room',
            {
              roomCode: code,
            }
          );
        }

        setUsers([]);

        setLocalRoomCode(code);

        if (hostToken) {
          saveHostToken(
            code,
            hostToken
          );
        }

        addRecentRoom(
          code,
          'host'
        );

        toast.success(
          'Room created',
          `Code ${code} is live. Open transmission when ready.`
        );
      }, 700);
    };


    socket.on(
      'room-created',
      onRoomCreated
    );


    return () => {
      socket.off(
        'room-created',
        onRoomCreated
      );
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


    socket.emit(
      'create-room',
      {
        deviceName,
        deviceInfo,
      }
    );


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
     CREATE ANOTHER ROOM
  ============================================================ */

  const handleNewRoom = () => {
    if (roomCode) {
      clearHostToken(
        roomCode
      );
    }


    setLocalRoomCode(null);
    setRoomCode(null);
    setRole(null);
    setUsers([]);
  };


  /* ============================================================
     PRODUCTION JOIN URL

     IMPORTANT:
     Do NOT use window.location.origin here.

     Android Capacitor uses a local WebView origin such as
     https://localhost, which would create an incorrect QR/link.

     Always use the public Vercel web application URL.
  ============================================================ */

  const joinUrl = roomCode
    ? `${WEB_APP_URL}/join?room=${roomCode}`
    : '';


  return (
    <div className="min-h-screen bg-[#FBFAFF] transition-colors dark:bg-surface">

      <div className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-start justify-between gap-6">

          <div className="min-w-0 flex-1">

            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Outbound Transfer
            </p>


            <h1 className="mt-3 font-heading text-[28px] font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-[44px] lg:text-[52px]">
              Create a private room
            </h1>


            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[16px]">
              Generate a temporary handshake space. Your files stay between the two browsers —
              nothing is uploaded.
            </p>

          </div>


          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/10 sm:flex">

            <Radio
              className="h-6 w-6 text-purple-600 dark:text-purple-400"
              strokeWidth={2.2}
            />

          </div>

        </div>


        {/* ======================================================
            BEFORE ROOM CREATED
        ====================================================== */}

        {!roomCode ? (

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-surface-border dark:bg-surface-card dark:shadow-none sm:mt-12 sm:p-10">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">

                <Shield
                  className="h-5 w-5 text-purple-600 dark:text-purple-400"
                  strokeWidth={2.2}
                />

              </div>


              <div>

                <h2 className="font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[26px]">
                  Ready when you are
                </h2>


                <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[15px]">
                  One room, two devices, zero uploads. Rooms expire automatically after 30 minutes
                  of inactivity.
                </p>

              </div>

            </div>


            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">

              <StatCard
                label="Capacity"
                value="2 devices"
              />

              <StatCard
                label="Retention"
                value="0 MB stored"
              />

              <StatCard
                label="Protocol"
                value="WebRTC P2P"
              />

            </div>


            <div className="mt-8">

              <button
                onClick={handleGenerate}
                disabled={
                  loading ||
                  !socket
                }
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-glow transition-all hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >

                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />

                    Creating room…
                  </>
                ) : (
                  <>
                    <Radio
                      className="h-5 w-5"
                      strokeWidth={2.2}
                    />

                    Generate room code
                  </>
                )}

              </button>


              {!socket && (
                <p className="mt-3 text-[13px] text-amber-600 dark:text-amber-400">
                  Waiting for server connection…
                </p>
              )}

            </div>

          </div>

        ) : (

          /* ====================================================
             ROOM CREATED
          ==================================================== */

          <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 lg:grid-cols-2 lg:gap-6">

            {/* ==================================================
                ROOM DETAILS
            ================================================== */}

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-surface-border dark:bg-surface-card dark:shadow-none sm:p-8 lg:p-10">

              <div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-600 dark:text-purple-400">
                  Your Room
                </p>


                <div className="mt-4 flex items-center justify-between gap-4">

                  <h2 className="font-mono text-[32px] font-extrabold tracking-[0.18em] text-slate-900 dark:text-white sm:text-[52px]">
                    {roomCode}
                  </h2>


                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">

                    <Check
                      className="h-5 w-5 text-emerald-500 dark:text-emerald-400"
                      strokeWidth={3}
                    />

                  </div>

                </div>


                <p className="mt-5 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[15px]">
                  Share this code or scan the QR from your second device. Open transmission when
                  you are ready — the room stays live.
                </p>


                {/* ==================================================
                    COPY BUTTONS
                ================================================== */}

                <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">

                  <CopyButton
                    label="Copy code"
                    value={roomCode}
                    icon={Copy}
                  />

                  <CopyButton
                    label="Copy link"
                    value={joinUrl}
                    icon={Share2}
                  />

                </div>


                {/* ==================================================
                    PRODUCTION JOIN URL
                ================================================== */}

                <p className="mt-4 break-all rounded-lg bg-slate-50 px-3 py-2.5 font-mono text-[12px] text-slate-400 dark:bg-white/[0.03] dark:text-slate-500">
                  {joinUrl}
                </p>

              </div>


              {/* ==================================================
                  OPEN TRANSMISSION
              ================================================== */}

              <button
                onClick={() =>
                  navigate(
                    `/room/${roomCode}`
                  )
                }
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-purple-700 active:scale-[0.98]"
              >

                Open transmission room

                <ExternalLink
                  className="h-4 w-4"
                  strokeWidth={2.4}
                />

              </button>

            </div>


            {/* ==================================================
                QR CODE
            ================================================== */}

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-surface-border dark:bg-surface-card dark:shadow-none sm:p-8 lg:p-10">

              <div className="flex items-center gap-2.5">

                <QrCode
                  className="h-5 w-5 text-purple-600 dark:text-purple-400"
                  strokeWidth={2.2}
                />

                <h3 className="font-heading text-[18px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[20px]">
                  Scan to join
                </h3>

              </div>


              <div className="mt-8 flex flex-1 items-center justify-center">

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-transparent">

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


              <p className="mt-8 text-center text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[14px]">
                Open the camera on your other device. WebDrop will prefill the room code
                automatically.
              </p>


              {/* ==================================================
                  OPEN JOIN LINK
              ================================================== */}

              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 py-2 text-[14px] font-semibold text-slate-700 transition-colors hover:text-purple-600 dark:text-slate-200 dark:hover:text-purple-400"
              >

                Open join link

                <ExternalLink
                  className="h-4 w-4"
                  strokeWidth={2.4}
                />

              </a>

            </div>

          </div>
        )}


        {/* ======================================================
            FOOTER ACTIONS
        ====================================================== */}

        <div className="mt-10 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">

          <Link
            to="/"
            className="inline-flex items-center justify-center text-[14px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:justify-start"
          >
            ← Back to overview
          </Link>


          {roomCode && (

            <button
              onClick={handleNewRoom}
              className="inline-flex items-center justify-center gap-2 text-[14px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >

              <RefreshCw className="h-4 w-4" />

              Create another room

            </button>

          )}

        </div>

      </div>

    </div>
  );
}