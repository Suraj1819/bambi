import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  ArrowRight,
  Wifi,
  Smartphone,
  Laptop,
  ShieldCheck,
  Zap,
  Signal,
  Lock,
  Globe,
  Activity,
  Cable,
} from 'lucide-react';

import { normalizeRoomCode } from '../utils/generateRoomCode';
import FeatureCards from '../components/common/FeatureCards';

export default function Home() {
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [radarReady, setRadarReady] = useState(false);

  const navigate = useNavigate();

  /* =========================================================
     NETWORK STATUS
  ========================================================= */

  useEffect(() => {
    let readyTimer;

    const handleOnline = () => {
      setIsOnline(true);

      setRadarReady(false);

      readyTimer = setTimeout(() => {
        setRadarReady(true);
      }, 1800);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setRadarReady(false);

      if (readyTimer) {
        clearTimeout(readyTimer);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      readyTimer = setTimeout(() => {
        setRadarReady(true);
      }, 500);
    }

    return () => {
      if (readyTimer) {
        clearTimeout(readyTimer);
      }

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* =========================================================
     CREATE ROOM
  ========================================================= */

  const handleCreateRoom = () => {
    setCreating(true);
    navigate('/create');
  };

  /* =========================================================
     JOIN ROOM
  ========================================================= */

  const handleJoin = (e) => {
    e.preventDefault();

    if (code.length === 5) {
      navigate(`/join?room=${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAFF] transition-colors dark:bg-surface">

      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">

          {/* =========================================================
              HERO
          ========================================================= */}

          <section className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 dark:border-surface-border dark:bg-surface-card sm:p-10 lg:p-12">

            {/* Background glow */}

            <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-purple-200/50 blur-3xl dark:bg-purple-500/10" />

            <div className="pointer-events-none absolute -bottom-40 -left-40 h-[380px] w-[380px] rounded-full bg-indigo-100/40 blur-3xl dark:bg-indigo-500/5" />

            {/* Decorative grid */}

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative z-10">

              {/* Status */}

              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                  isOnline
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                }`}
              >

                <span className="relative flex h-2 w-2">

                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />

                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />

                </span>

                <span
                  className={`text-[9px] font-bold uppercase tracking-[0.18em] ${
                    isOnline
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {isOnline ? 'Network available' : 'Network offline'}
                </span>

              </div>


              {/* Heading */}

              <h1 className="mt-8 max-w-[800px] font-heading text-[44px] font-extrabold leading-[0.92] tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[60px] lg:text-[72px] xl:text-[82px]">

                Drop.

                <br />

                <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Connect.
                </span>

                <br />

                Transfer.

              </h1>


              {/* Description */}

              <p className="mt-8 max-w-[620px] text-[15px] leading-7 text-slate-500 dark:text-slate-400 sm:text-[17px]">
                Send files directly between devices using your browser.
                WebDrop uses WebRTC to establish a peer-to-peer connection,
                keeping your files out of the server.
              </p>


              {/* Actions */}

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                <button
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-[0_16px_35px_rgba(124,58,237,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <Radio
                    className="h-[18px] w-[18px]"
                    strokeWidth={2.2}
                  />

                  {creating ? 'Creating…' : 'Create secure room'}

                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.5}
                  />

                </button>


                <button
                  onClick={() => navigate('/join')}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-[14px] font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-surface-border dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
                >
                  Join with a code
                </button>

              </div>


              {/* Technology strip */}

              <div className="mt-12 grid max-w-[600px] grid-cols-3 border-y border-slate-100 py-5 dark:border-white/[0.06]">

                <div className="flex items-center gap-2">

                  <Cable className="h-4 w-4 text-purple-500" />

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Protocol
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      WebRTC
                    </p>

                  </div>

                </div>


                <div className="flex items-center gap-2 border-x border-slate-100 px-4 dark:border-white/[0.06]">

                  <Lock className="h-4 w-4 text-emerald-500" />

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Security
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      DTLS
                    </p>

                  </div>

                </div>


                <div className="flex items-center gap-2 pl-4">

                  <Globe className="h-4 w-4 text-indigo-500" />

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Storage
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      0 MB
                    </p>

                  </div>

                </div>

              </div>


              {/* Bottom note */}

              <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">

                <ShieldCheck className="h-4 w-4 text-emerald-500" />

                Files are transferred directly between connected peers.

              </div>

            </div>

          </section>


          {/* =========================================================
              RIGHT COLUMN
          ========================================================= */}

          <div className="flex flex-col gap-5">


            {/* =======================================================
                NETWORK RADAR
            ======================================================= */}

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card sm:p-7">

              {/* Header */}

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Live topology
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-purple-500">
                      P2P Network
                    </span>

                  </div>

                  <h2 className="mt-2 font-heading text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
                    Peer radar
                  </h2>

                </div>


                {/* Live status */}

                <div
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 ${
                    radarReady
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                  }`}
                >

                  <Activity
                    className={`h-3 w-3 ${
                      radarReady ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                    strokeWidth={2.5}
                  />

                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider ${
                      radarReady
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {radarReady ? 'Active' : 'Searching'}
                  </span>

                </div>

              </div>


              {/* =====================================================
                  RADAR AREA
              ===================================================== */}

              <div className="relative mt-5 h-[275px] overflow-hidden rounded-2xl border border-slate-100 bg-[#FAF9FF] dark:border-white/[0.06] dark:bg-[#101018]">

                {!radarReady ? (

                  /* =================================================
                     SEARCHING STATE
                  ================================================= */

                  <div className="absolute inset-0 flex flex-col items-center justify-center">

                    {/* Grid */}

                    <div
                      className="absolute inset-0 opacity-50 dark:opacity-[0.18]"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                      }}
                    />


                    {/* Searching radar */}

                    <div className="relative z-10 flex h-[150px] w-[150px] items-center justify-center">

                      {/* Outer ring */}

                      <div className="absolute inset-0 rounded-full border border-purple-300/30 dark:border-purple-400/10" />


                      {/* Middle ring */}

                      <div
                        className="absolute inset-[18px] rounded-full border border-purple-300/40 dark:border-purple-400/15"
                        style={{
                          animation: 'searchPulse 2s ease-out infinite',
                        }}
                      />


                      {/* Inner ring */}

                      <div
                        className="absolute inset-[38px] rounded-full border border-purple-300/50 dark:border-purple-400/20"
                        style={{
                          animation: 'searchPulse 2s ease-out 0.5s infinite',
                        }}
                      />


                      {/* Radar sweep */}

                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, rgba(124,58,237,0.22) 30deg, transparent 75deg)',
                          animation: 'radarSpin 2.5s linear infinite',
                        }}
                      />


                      {/* Center node */}

                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-200 bg-white shadow-[0_8px_25px_rgba(124,58,237,0.15)] dark:border-purple-400/20 dark:bg-slate-900">

                        <Wifi
                          className="h-5 w-5 animate-pulse text-purple-500"
                          strokeWidth={2}
                        />

                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-amber-400 dark:border-slate-900">

                          <span className="h-1 w-1 rounded-full bg-white" />

                        </span>

                      </div>


                      {/* Scanning dots */}

                      <span className="absolute left-[10px] top-[42px] h-1.5 w-1.5 animate-ping rounded-full bg-purple-400" />

                      <span
                        className="absolute right-[14px] top-[82px] h-1.5 w-1.5 animate-ping rounded-full bg-indigo-400"
                        style={{
                          animationDelay: '400ms',
                        }}
                      />

                      <span
                        className="absolute bottom-[20px] left-[45px] h-1.5 w-1.5 animate-ping rounded-full bg-violet-400"
                        style={{
                          animationDelay: '800ms',
                        }}
                      />

                    </div>


                    {/* Searching text */}

                    <div className="relative z-10 mt-2 text-center">

                      <div className="flex items-center justify-center gap-2">

                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-500">
                          {isOnline
                            ? 'Searching for peers'
                            : 'Network offline'}
                        </p>

                      </div>

                      <p className="mt-1.5 text-[9px] text-slate-400 dark:text-slate-500">
                        {isOnline
                          ? 'Scanning for nearby connections...'
                          : 'Waiting for network connection...'}
                      </p>

                    </div>


                    {/* Bottom scanning dots */}

                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">

                      <span className="h-1 w-1 animate-bounce rounded-full bg-purple-400" />

                      <span
                        className="h-1 w-1 animate-bounce rounded-full bg-purple-400"
                        style={{
                          animationDelay: '120ms',
                        }}
                      />

                      <span
                        className="h-1 w-1 animate-bounce rounded-full bg-purple-400"
                        style={{
                          animationDelay: '240ms',
                        }}
                      />

                    </div>

                  </div>

                ) : (

                  /* =================================================
                     READY RADAR
                  ================================================= */

                  <div className="absolute inset-0">

                    {/* Grid */}

                    <div
                      className="absolute inset-0 opacity-50 dark:opacity-[0.18]"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                      }}
                    />


                    {/* Radar circles */}

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

                      <div className="absolute -left-[105px] -top-[105px] h-[210px] w-[210px] rounded-full border border-purple-200/50 dark:border-purple-400/10" />

                      <div className="absolute -left-[78px] -top-[78px] h-[156px] w-[156px] rounded-full border border-purple-200/60 dark:border-purple-400/15" />

                      <div className="absolute -left-[48px] -top-[48px] h-[96px] w-[96px] rounded-full border border-purple-200/70 dark:border-purple-400/20" />


                      {/* Radar sweep */}

                      <div
                        className="absolute -left-[105px] -top-[105px] h-[210px] w-[210px] rounded-full"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, rgba(124,58,237,0.16) 25deg, transparent 55deg)',
                          animation: 'radarSpin 4s linear infinite',
                        }}
                      />

                    </div>


                    {/* Connection paths */}

                    <svg
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 500 275"
                      preserveAspectRatio="none"
                    >

                      <path
                        d="M 95 88 Q 185 100 250 137"
                        fill="none"
                        stroke="rgba(124,58,237,0.28)"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                      />

                      <path
                        d="M 405 174 Q 330 155 250 137"
                        fill="none"
                        stroke="rgba(124,58,237,0.28)"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                      />

                    </svg>


                    {/* =================================================
                        CENTRAL WEBRTC NODE
                    ================================================= */}

                    <div className="animate-peer-center absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">

                      {/* Outer waves */}

                      <div className="absolute -inset-8 rounded-full border border-purple-400/10" />

                      <div
                        className="absolute -inset-12 rounded-full border border-purple-400/10"
                        style={{
                          animation: 'networkPulse 2.5s ease-out infinite',
                        }}
                      />


                      {/* Node */}

                      <div className="relative flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_10px_30px_rgba(124,58,237,0.35)]">

                        <Wifi
                          className="h-7 w-7 text-white"
                          strokeWidth={2}
                        />

                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-[#101018]">

                          <span className="h-1.5 w-1.5 rounded-full bg-white" />

                        </span>

                      </div>


                      {/* Node label */}

                      <div className="absolute left-1/2 top-[68px] -translate-x-1/2 whitespace-nowrap rounded-full border border-purple-200/70 bg-white/90 px-2.5 py-1 backdrop-blur dark:border-purple-400/10 dark:bg-slate-900/80">

                        <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-400">
                          WebRTC Node
                        </span>

                      </div>

                    </div>


                    {/* =================================================
                        LAPTOP PEER
                    ================================================= */}

                    <div className="animate-peer-left absolute left-[12%] top-[24%] flex flex-col items-center">

                      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-500/20 dark:bg-slate-900">

                        <Laptop
                          className="h-[18px] w-[18px] text-emerald-500"
                          strokeWidth={2}
                        />

                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />

                      </div>

                      <span className="mt-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        Laptop
                      </span>

                    </div>


                    {/* =================================================
                        MOBILE PEER
                    ================================================= */}

                    <div className="animate-peer-right absolute right-[11%] top-[53%] flex flex-col items-center">

                      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-white shadow-sm dark:border-amber-500/20 dark:bg-slate-900">

                        <Smartphone
                          className="h-[18px] w-[18px] text-amber-500"
                          strokeWidth={2}
                        />

                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-amber-500 dark:border-slate-900" />

                      </div>

                      <span className="mt-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        Mobile
                      </span>

                    </div>


                    {/* =================================================
                        PACKET ANIMATION
                    ================================================= */}

                    <div className="absolute left-[28%] top-[36%] h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(124,58,237,0.8)]">

                      <span
                        className="absolute inset-0 rounded-full bg-purple-400"
                        style={{
                          animation: 'packetMove 2s linear infinite',
                        }}
                      />

                    </div>


                    {/* =================================================
                        WIFI SIGNAL
                    ================================================= */}

                    <div className="absolute right-[14%] top-[13%] flex items-center gap-2 rounded-xl border border-purple-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-purple-400/10 dark:bg-slate-900/80">

                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">

                        <Wifi
                          className="h-3.5 w-3.5 text-purple-500"
                          strokeWidth={2.4}
                        />

                      </div>

                      <div>

                        <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                          Signal
                        </p>

                        <p className="text-[9px] font-bold text-emerald-500">
                          Strong
                        </p>

                      </div>

                    </div>


                    {/* =================================================
                        BOTTOM STATUS
                    ================================================= */}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">

                      <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2 backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/80">

                        <Signal
                          className="h-3.5 w-3.5 text-emerald-500"
                          strokeWidth={2}
                        />

                        <div>

                          <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                            Connection
                          </p>

                          <p className="text-[9px] font-bold text-emerald-500">
                            Ready
                          </p>

                        </div>

                      </div>


                      <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2 backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/80">

                        <Zap
                          className="h-3.5 w-3.5 text-purple-500"
                          strokeWidth={2.2}
                        />

                        <div>

                          <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                            Route
                          </p>

                          <p className="text-[9px] font-bold text-purple-500">
                            Direct P2P
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </div>


              {/* =====================================================
                  RADAR EXPLANATION
              ===================================================== */}

              <div className="mt-5 flex gap-3">

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    radarReady
                      ? 'bg-purple-50 dark:bg-purple-500/10'
                      : 'bg-amber-50 dark:bg-amber-500/10'
                  }`}
                >

                  <ShieldCheck
                    className={`h-4 w-4 ${
                      radarReady
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-amber-500'
                    }`}
                    strokeWidth={2}
                  />

                </div>


                <div>

                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">

                    {radarReady
                      ? 'Server-assisted discovery'
                      : isOnline
                        ? 'Searching for connections'
                        : 'Network connection unavailable'}

                  </p>

                  <p className="mt-1 text-[12px] leading-relaxed text-slate-400 dark:text-slate-500">

                    {radarReady
                      ? 'Signaling helps devices find each other. File data then travels directly between peers.'
                      : isOnline
                        ? 'Scanning the network for available peer connections.'
                        : 'Reconnect to the network to start peer discovery.'}

                  </p>

                </div>

              </div>

            </section>


            {/* =======================================================
                JOIN ROOM
            ======================================================= */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card sm:p-7">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Quick connect
                  </p>

                  <h2 className="mt-1.5 font-heading text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
                    Join a room
                  </h2>

                </div>


                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">

                  <Radio
                    className="h-4 w-4 text-purple-600 dark:text-purple-400"
                    strokeWidth={2}
                  />

                </div>

              </div>


              <form
                onSubmit={handleJoin}
                className="mt-5 flex items-center gap-2"
              >

                <input
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(normalizeRoomCode(e.target.value))
                  }
                  placeholder="X7K92"
                  maxLength={5}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] font-bold tracking-[0.18em] text-slate-900 outline-none transition-all placeholder:font-normal placeholder:tracking-[0.15em] placeholder:text-slate-300 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-surface-border dark:bg-white/[0.03] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-purple-400 dark:focus:bg-white/[0.05]"
                />

                <button
                  type="submit"
                  disabled={code.length !== 5}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm transition-all hover:bg-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >

                  <ArrowRight
                    className="h-5 w-5"
                    strokeWidth={2.5}
                  />

                </button>

              </form>


              <div className="mt-3 flex items-center gap-2">

                <Lock className="h-3.5 w-3.5 text-emerald-500" />

                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  5-character room code · No account required
                </p>

              </div>

            </section>

          </div>

        </div>


        {/* =========================================================
            FEATURES
        ========================================================= */}

        <div className="mt-6 sm:mt-8">
          <FeatureCards />
        </div>

      </main>


      {/* =============================================================
          ANIMATIONS
      ============================================================= */}

      <style>{`

        /* =========================================================
           RADAR SWEEP
        ========================================================= */

        @keyframes radarSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }


        /* =========================================================
           NETWORK PULSE
        ========================================================= */

        @keyframes networkPulse {
          0% {
            transform: scale(0.7);
            opacity: 0.7;
          }

          70% {
            transform: scale(1.2);
            opacity: 0;
          }

          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }


        /* =========================================================
           SEARCHING RADAR
        ========================================================= */

        @keyframes searchPulse {
          0% {
            transform: scale(0.7);
            opacity: 0.8;
          }

          70% {
            transform: scale(1.25);
            opacity: 0;
          }

          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }


        /* =========================================================
           PACKET MOVEMENT
        ========================================================= */

        @keyframes packetMove {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }

          20% {
            opacity: 1;
          }

          80% {
            opacity: 1;
          }

          100% {
            transform: translate(190px, 35px);
            opacity: 0;
          }
        }


        /* =========================================================
           PEER ENTRY ANIMATIONS
        ========================================================= */

        @keyframes peerLeft {
          from {
            opacity: 0;
            transform: translateX(-18px) scale(0.9);
          }

          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }


        @keyframes peerRight {
          from {
            opacity: 0;
            transform: translateX(18px) scale(0.9);
          }

          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }


        @keyframes peerCenter {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.7);
          }

          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }


        .animate-peer-left {
          animation: peerLeft 0.6s ease-out both;
        }


        .animate-peer-right {
          animation: peerRight 0.6s ease-out 0.15s both;
        }


        .animate-peer-center {
          animation: peerCenter 0.7s ease-out 0.3s both;
        }

      `}</style>

    </div>
  );
}