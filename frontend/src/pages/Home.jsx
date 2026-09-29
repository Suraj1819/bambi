import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  ArrowRight,
  Wifi,
  WifiOff,
  Smartphone,
  Laptop,
  ShieldCheck,
  Zap,
  Signal,
  Lock,
  Globe,
  Activity,
  Cable,
  Server,
} from 'lucide-react';

import { normalizeRoomCode } from '../utils/generateRoomCode';
import { useRoom } from '../context/RoomContext';
import useNetworkInfo from '../hooks/useNetworkInfo';
import NetworkSignalIcon, { signalTone } from '../components/common/NetworkSignalIcon';
import FeatureCards from '../components/common/FeatureCards';

const GRID_BG =
  'linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)';

export default function Home() {
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  /* Real-time signaling server status: single source of truth */
  const { connected } = useRoom();

  /* Live connection type (Wi-Fi / mobile data) + signal bars */
  const net = useNetworkInfo();

  const handleCreateRoom = () => {
    setCreating(true);
    navigate('/create');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (code.length === 5) navigate(`/join?room=${code}`);
  };

  return (
    <div className="min-h-screen bg-[#FBFAFF] transition-colors dark:bg-surface">
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
          {/* ================= HERO ================= */}
          <section className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 dark:border-surface-border dark:bg-surface-card sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-purple-200/50 blur-3xl dark:bg-purple-500/10" />
            <div className="pointer-events-none absolute -bottom-40 -left-40 h-[380px] w-[380px] rounded-full bg-indigo-100/40 blur-3xl dark:bg-indigo-500/5" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative z-10">
              {/* Network badge */}
              <div
                role="status"
                aria-live="polite"
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-300 ${
                  connected
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                    : 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      connected ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      connected ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                </span>

                {connected ? (
                  <Wifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                )}

                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                    connected
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {connected ? 'Network available' : 'Network unavailable'}
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

              <p className="mt-8 max-w-[620px] text-[15px] leading-7 text-slate-500 dark:text-slate-400 sm:text-[17px]">
                Send files directly between devices using your browser. WebDrop
                uses WebRTC to establish a peer-to-peer connection, keeping your
                files out of the server.
              </p>

              {/* Actions */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-purple-600 px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-[0_16px_35px_rgba(124,58,237,0.3)] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Radio className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  {creating ? 'Creating…' : 'Create secure room'}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.5}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/join')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-[14px] font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 dark:border-surface-border dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
                >
                  <Cable className="h-4 w-4" strokeWidth={2.2} />
                  Join with a code
                </button>
              </div>

              {/* Technology strip */}
              <div className="mt-12 grid max-w-[600px] grid-cols-3 border-y border-slate-100 py-5 dark:border-white/[0.06]">
                <TechItem icon={Cable} color="text-purple-500" label="Protocol" value="WebRTC" />
                <TechItem
                  icon={Lock}
                  color="text-emerald-500"
                  label="Security"
                  value="DTLS"
                  className="border-x border-slate-100 px-4 dark:border-white/[0.06]"
                />
                <TechItem
                  icon={Globe}
                  color="text-indigo-500"
                  label="Storage"
                  value="0 MB"
                  className="pl-4"
                />
              </div>

              <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Files are transferred directly between connected peers.
              </div>
            </div>
          </section>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="flex flex-col gap-5">
            {/* -------- PEER RADAR -------- */}
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Live topology
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-500">
                      P2P Network
                    </span>
                  </div>
                  <h2 className="mt-2 font-heading text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
                    Peer radar
                  </h2>
                </div>

                <div
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition-colors duration-300 ${
                    connected
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                  }`}
                >
                  <Activity
                    className={`h-3 w-3 ${connected ? 'text-emerald-500' : 'text-amber-500'}`}
                    strokeWidth={2.5}
                  />
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      connected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {connected ? 'Active' : 'Searching'}
                  </span>
                </div>
              </div>

              {/* Radar area */}
              <div className="relative mt-5 h-[275px] overflow-hidden rounded-2xl border border-slate-100 bg-[#FAF9FF] dark:border-white/[0.06] dark:bg-[#101018]">
                <div
                  className="absolute inset-0 opacity-50 dark:opacity-[0.18]"
                  style={{ backgroundImage: GRID_BG, backgroundSize: '28px 28px' }}
                />

                {!connected ? (
                  /* ---------- SEARCHING STATE ---------- */
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative z-10 flex h-[150px] w-[150px] items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-purple-300/30 dark:border-purple-400/10" />
                      <div
                        className="absolute inset-[18px] rounded-full border border-purple-300/40 dark:border-purple-400/15"
                        style={{ animation: 'searchPulse 2s ease-out infinite' }}
                      />
                      <div
                        className="absolute inset-[38px] rounded-full border border-purple-300/50 dark:border-purple-400/20"
                        style={{ animation: 'searchPulse 2s ease-out 0.5s infinite' }}
                      />
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, rgba(124,58,237,0.22) 30deg, transparent 75deg)',
                          animation: 'radarSpin 2.5s linear infinite',
                        }}
                      />

                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-200 bg-white shadow-[0_8px_25px_rgba(124,58,237,0.15)] dark:border-purple-400/20 dark:bg-slate-900">
                        <WifiOff className="h-5 w-5 animate-pulse text-purple-500" strokeWidth={2} />
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-amber-400 dark:border-slate-900">
                          <span className="h-1 w-1 rounded-full bg-white" />
                        </span>
                      </div>

                      <span className="absolute left-[10px] top-[42px] h-1.5 w-1.5 animate-ping rounded-full bg-purple-400" />
                      <span
                        className="absolute right-[14px] top-[82px] h-1.5 w-1.5 animate-ping rounded-full bg-indigo-400"
                        style={{ animationDelay: '400ms' }}
                      />
                      <span
                        className="absolute bottom-[20px] left-[45px] h-1.5 w-1.5 animate-ping rounded-full bg-violet-400"
                        style={{ animationDelay: '800ms' }}
                      />
                    </div>

                    <div className="relative z-10 mt-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-500">
                          Searching for signal
                        </p>
                      </div>
                      <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        Waiting for signaling server...
                      </p>
                    </div>

                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                      {[0, 120, 240].map((d) => (
                        <span
                          key={d}
                          className="h-1 w-1 animate-bounce rounded-full bg-purple-400"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ---------- CONNECTED STATE ---------- */
                  <div className="absolute inset-0">
                    {/* Rings + sweep, centered */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute h-[210px] w-[210px] rounded-full border border-purple-200/50 dark:border-purple-400/10" />
                      <div className="absolute h-[156px] w-[156px] rounded-full border border-purple-200/60 dark:border-purple-400/15" />
                      <div className="absolute h-[96px] w-[96px] rounded-full border border-purple-200/70 dark:border-purple-400/20" />
                      <div
                        className="absolute h-[210px] w-[210px] rounded-full"
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent 0deg, rgba(124,58,237,0.16) 25deg, transparent 55deg)',
                          animation: 'radarSpin 4s linear infinite',
                        }}
                      />
                    </div>

                    {/* Connection paths (percent-based so they match peer positions) */}
                    <svg
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <line
                        x1="17" y1="32" x2="50" y2="50"
                        stroke="rgba(124,58,237,0.32)"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                        vectorEffect="non-scaling-stroke"
                      />
                      <line
                        x1="83" y1="62" x2="50" y2="50"
                        stroke="rgba(124,58,237,0.32)"
                        strokeWidth="1.5"
                        strokeDasharray="5 5"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    {/* Data packets */}
                    <span className="packet packet-left" />
                    <span className="packet packet-right" />

                    {/* Central node */}
                    <div className="animate-peer-center absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                      <div className="absolute -inset-8 rounded-full border border-purple-400/10" />
                      <div
                        className="absolute -inset-12 rounded-full border border-purple-400/10"
                        style={{ animation: 'networkPulse 2.5s ease-out infinite' }}
                      />
                      <div className="relative flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_10px_30px_rgba(124,58,237,0.35)]">
                        <Server className="h-7 w-7 text-white" strokeWidth={2} />
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-[#101018]">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      </div>
                      <div className="absolute left-1/2 top-[68px] -translate-x-1/2 whitespace-nowrap rounded-full border border-purple-200/70 bg-white/90 px-2.5 py-1 backdrop-blur dark:border-purple-400/10 dark:bg-slate-900/80">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-400">
                          WebRTC Node
                        </span>
                      </div>
                    </div>

                    {/* Laptop peer */}
                    <PeerNode
                      icon={Laptop}
                      label="Laptop"
                      tone="emerald"
                      className="animate-peer-left left-[12%] top-[22%]"
                    />

                    {/* Mobile peer */}
                    <PeerNode
                      icon={Smartphone}
                      label="Mobile"
                      tone="amber"
                      className="animate-peer-right right-[11%] top-[50%]"
                    />

                    {/* Signal card: live network type + bars */}
                    <div className="animate-peer-right absolute right-[6%] top-[8%] flex items-center gap-2.5 rounded-xl border border-purple-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-purple-400/10 dark:bg-slate-900/80">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
                        <NetworkSignalIcon
                          kind={net.kind}
                          bars={net.bars}
                          className={`h-4 w-4 ${signalTone(net.bars)}`}
                          strokeWidth={2.4}
                        />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          {net.label}
                        </p>
                        <p className={`text-[10px] font-bold ${signalTone(net.bars)}`}>
                          {net.quality}
                          {net.downlink ? ` · ${net.downlink} Mbps` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Bottom status */}
                    <div className="animate-peer-up absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <StatusChip icon={Signal} iconColor="text-emerald-500" label="Connection" value="Ready" valueColor="text-emerald-500" />
                      <StatusChip icon={Zap} iconColor="text-purple-500" label="Route" value="Direct P2P" valueColor="text-purple-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div className="mt-5 flex gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    connected
                      ? 'bg-purple-50 dark:bg-purple-500/10'
                      : 'bg-amber-50 dark:bg-amber-500/10'
                  }`}
                >
                  <ShieldCheck
                    className={`h-4 w-4 ${
                      connected
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-amber-500'
                    }`}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                    {connected ? 'Server-assisted discovery' : 'Searching for signal'}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {connected
                      ? 'Signaling helps devices find each other. File data then travels directly between peers.'
                      : 'Connecting to the signaling server. Peer discovery will start once the signal is available.'}
                  </p>
                </div>
              </div>
            </section>

            {/* -------- JOIN ROOM -------- */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Quick connect
                  </p>
                  <h2 className="mt-1.5 font-heading text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
                    Join a room
                  </h2>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                  <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                </div>
              </div>

              <form onSubmit={handleJoin} className="mt-5 flex items-center gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
                  placeholder="X7K92"
                  maxLength={5}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Room code"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] font-bold tracking-[0.18em] text-slate-900 outline-none transition-all placeholder:font-normal placeholder:tracking-[0.15em] placeholder:text-slate-300 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 dark:border-surface-border dark:bg-white/[0.03] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-purple-400 dark:focus:bg-white/[0.05]"
                />
                <button
                  type="submit"
                  disabled={code.length !== 5}
                  aria-label="Join room"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm transition-all hover:bg-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
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

        {/* ================= FEATURES ================= */}
        <div className="mt-6 sm:mt-8">
          <FeatureCards />
        </div>
      </main>

      {/* ================= ANIMATIONS ================= */}
      <style>{`
        @keyframes radarSpin { to { transform: rotate(360deg); } }

        @keyframes networkPulse {
          0% { transform: scale(0.7); opacity: 0.7; }
          70%, 100% { transform: scale(1.2); opacity: 0; }
        }

        @keyframes searchPulse {
          0% { transform: scale(0.7); opacity: 0.8; }
          70%, 100% { transform: scale(1.25); opacity: 0; }
        }

        @keyframes peerLeft {
          from { opacity: 0; transform: translateX(-18px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes peerRight {
          from { opacity: 0; transform: translateX(18px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes peerUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes peerCenter {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .animate-peer-left { animation: peerLeft 0.6s ease-out both; }
        .animate-peer-right { animation: peerRight 0.6s ease-out 0.15s both; }
        .animate-peer-up { animation: peerUp 0.6s ease-out 0.45s both; }
        .animate-peer-center { animation: peerCenter 0.7s ease-out 0.3s both; }

        /* Packets travel along the same lines as the SVG paths */
        .packet {
          position: absolute;
          width: 8px;
          height: 8px;
          margin: -4px 0 0 -4px;
          border-radius: 9999px;
          background: #7c3aed;
          box-shadow: 0 0 10px rgba(124,58,237,0.8);
          opacity: 0;
        }
        .packet-left { animation: packetLeft 2.2s linear 0.9s infinite; }
        .packet-right { animation: packetRight 2.2s linear 1.5s infinite; }

        @keyframes packetLeft {
          0% { left: 17%; top: 32%; opacity: 0; }
          15%, 85% { opacity: 1; }
          100% { left: 50%; top: 50%; opacity: 0; }
        }
        @keyframes packetRight {
          0% { left: 50%; top: 50%; opacity: 0; }
          15%, 85% { opacity: 1; }
          100% { left: 83%; top: 62%; opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-peer-left, .animate-peer-right, .animate-peer-up,
          .animate-peer-center, .packet { animation: none !important; }
          .animate-peer-center { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   Small presentational helpers
========================================================= */

function TechItem({ icon: Icon, color, label, value, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon className={`h-4 w-4 ${color}`} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}

const PEER_TONES = {
  emerald: {
    box: 'border-emerald-200 dark:border-emerald-500/20',
    icon: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  amber: {
    box: 'border-amber-200 dark:border-amber-500/20',
    icon: 'text-amber-500',
    dot: 'bg-amber-500',
  },
};

function PeerNode({ icon: Icon, label, tone, className = '' }) {
  const t = PEER_TONES[tone];
  return (
    <div className={`absolute z-10 flex flex-col items-center ${className}`}>
      <div
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${t.box}`}
      >
        <Icon className={`h-[18px] w-[18px] ${t.icon}`} strokeWidth={2} />
        <span
          className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${t.dot}`}
        />
      </div>
      <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
    </div>
  );
}

function StatusChip({ icon: Icon, iconColor, label, value, valueColor }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2 backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/80">
      <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={2.1} />
      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className={`text-[10px] font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}