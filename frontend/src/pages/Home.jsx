// src/pages/Home.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Radio,
  ArrowRight,
  Wifi,
  WifiOff,
  Smartphone,
  Laptop,
  Monitor,
  ShieldCheck,
  Zap,
  Signal,
  Lock,
  Globe,
  Activity,
  Cable,
  Server,
  Download,
  ChevronDown,
  Check,
  X,
  Share2,
  Send,
  Eye,
  EyeOff,
  Plus,
  Image as ImageIcon,
  Briefcase,
  GraduationCap,
  Users,
} from 'lucide-react';

import { normalizeRoomCode } from '../utils/generateRoomCode';
import { useRoom } from '../context/RoomContext';
import useNetworkInfo from '../hooks/useNetworkInfo';
import NetworkSignalIcon, {
  signalTone,
} from '../components/common/NetworkSignalIcon';
import FeatureCards from '../components/common/FeatureCards';

const GRID_BG =
  'linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)';

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/25';

/* =========================================================
   APP DOWNLOADS

   When a new version is released:
   1. Add the new version at the TOP of `versions`.
   2. Keep older versions below it.
========================================================= */

const APP_DOWNLOADS = [
  {
    id: 'android',
    name: 'Android',
    ext: '.apk',
    icon: Smartphone,
    requirement: 'Android phones and tablets',
    note: 'You may need to allow "Install unknown apps" during installation.',
    versions: [
      {
        version: '1.0.0',
        url: 'https://github.com/Suraj1819/bambi/releases/download/v1.0.0/WebDrop-1.0.0.apk',
        size: '',
        date: '59 MB',
      },
    ],
  },
  {
    id: 'windows',
    name: 'Windows',
    ext: '.exe',
    icon: Monitor,
    requirement: 'Windows laptops and desktops',
    note: 'If a SmartScreen warning appears, choose "More info" → "Run anyway".',
    versions: [
      {
        version: '1.0.0',
        url: 'https://github.com/Suraj1819/bambi/releases/download/v1.0.0/WebDrop.Setup.1.0.0.exe',
        size: '81 MB',
        date: '',
      },
    ],
  },
];

/* =========================================================
   PAGE CONTENT
========================================================= */

const METRICS = [
  { value: '0 MB', label: 'Stored on our servers' },
  { value: 'No limit', label: 'File size set by WebDrop' },
  { value: '2 devices', label: 'Per private room' },
  { value: '30 min', label: 'Room lifetime' },
];

const STEPS = [
  {
    icon: Radio,
    title: 'Create a room',
    text: 'One click gives you a temporary room with a 5-character code. No account or sign-up.',
  },
  {
    icon: Share2,
    title: 'Invite the other device',
    text: 'Share the code, send the invite link, or let the other person scan the QR code.',
  },
  {
    icon: Send,
    title: 'Send files directly',
    text: 'Pick files or a folder. They travel straight from one browser to the other, and you see live speed and time left.',
  },
];

const USE_CASES = [
  {
    icon: ImageIcon,
    title: 'Phone to laptop',
    text: 'Move photos, videos and screenshots to your computer without cables or messaging apps that compress them.',
  },
  {
    icon: Briefcase,
    title: 'Work files',
    text: 'Hand over large design files, builds or recordings to a colleague without uploading them to a shared drive.',
  },
  {
    icon: GraduationCap,
    title: 'Projects and assignments',
    text: 'Share folders of code, reports and datasets with classmates in a couple of clicks.',
  },
  {
    icon: Users,
    title: 'Friends and family',
    text: 'Send a video or a batch of documents to someone nearby. They only need a browser.',
  },
];

const COMPARISON = [
  {
    topic: 'Where your file goes',
    cloud: 'Uploaded to a company server first',
    webdrop: 'Straight to the other device',
  },
  {
    topic: 'Waiting time',
    cloud: 'Upload, then download',
    webdrop: 'One direct transfer',
  },
  {
    topic: 'Account needed',
    cloud: 'Usually yes',
    webdrop: 'Never',
  },
  {
    topic: 'File size',
    cloud: 'Often capped by plan or storage',
    webdrop: 'No limit set by WebDrop',
  },
  {
    topic: 'Copy left behind',
    cloud: 'Stays on the server until deleted',
    webdrop: 'None, rooms expire in 30 minutes',
  },
];

const SERVER_SEES = [
  'The room code',
  'That two devices are connecting',
  'Connection setup messages (offer, answer, ICE)',
];

const SERVER_NEVER = [
  'Your files or their contents',
  'File names, sizes or types',
  'Anything you transfer after connecting',
];

const FAQ = [
  {
    q: 'Are my files stored anywhere?',
    a: 'No. File data travels directly between the two devices over an encrypted WebRTC connection. The WebDrop server only helps the devices find each other. If a relay (TURN) is needed on a strict network, it forwards encrypted packets and cannot read them.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'WebDrop does not set one. Files are streamed in small chunks so large transfers do not fill up browser memory. In practice, the limit is your connection speed and the free space on the receiving device.',
  },
  {
    q: 'Do both devices need to be on the same Wi-Fi?',
    a: 'No. WebDrop looks for the most direct route between the devices and falls back to a relay when a direct path is not possible. Transfers on the same network are usually the fastest.',
  },
  {
    q: 'How long does a room stay open?',
    a: 'A room holds two devices and expires after 30 minutes. The host can lock it, remove the other device, or end it at any time.',
  },
  {
    q: 'What happens if the connection drops?',
    a: 'Files waiting to be sent are queued and continue automatically when the other device reconnects. Cancelling one file never affects the others.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. WebDrop runs in any modern browser. The Windows and Android apps are optional and can be downloaded from this page.',
  },
];

function detectPlatform() {
  if (typeof navigator === 'undefined') return null;

  const ua = navigator.userAgent || '';

  if (/android/i.test(ua)) return 'android';
  if (/windows/i.test(ua)) return 'windows';

  return null;
}

/* Starts a download without leaving or reloading the page,
   and without opening a new tab. */
function startDownload(url) {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener noreferrer';
  a.setAttribute('download', '');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');

  const navigate = useNavigate();

  /* Real-time signaling server status */
  const { connected } = useRoom();

  /* Live connection type + signal bars */
  const net = useNetworkInfo();

  const currentPlatform = useMemo(detectPlatform, []);

  const handleCreateRoom = () => {
    setCreating(true);
    navigate('/create');
  };

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
                  className={`text-[12px] font-semibold ${
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
                Send files of any size directly between devices, right from your
                browser. WebDrop connects the two devices with WebRTC, so your
                files never pass through or sit on our servers.
              </p>

              {/* Actions */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

                <DownloadDropdown currentPlatform={currentPlatform} />
              </div>

              {/* Technology strip */}
              <div className="mt-12 grid max-w-[600px] grid-cols-3 border-y border-slate-100 py-5 dark:border-white/[0.06]">
                <TechItem icon={Cable} color="text-purple-500" label="Protocol" value="WebRTC" />
                <TechItem
                  icon={Lock}
                  color="text-emerald-500"
                  label="Encryption"
                  value="DTLS"
                  className="border-x border-slate-100 px-4 dark:border-white/[0.06]"
                />
                <TechItem
                  icon={Globe}
                  color="text-indigo-500"
                  label="Server storage"
                  value="0 MB"
                  className="pl-4"
                />
              </div>

              <div className="mt-6 flex items-center gap-2 text-[12px] text-slate-400 dark:text-slate-500">
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
                  <p className="text-[12px] font-semibold text-purple-600 dark:text-purple-400">
                    Live topology
                  </p>
                  <h2 className="mt-1 font-heading text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
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
                    className={`text-[11px] font-semibold ${
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
                  /* SEARCHING STATE */
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
                        <p className="text-[12px] font-semibold text-purple-500">
                          Searching for signal
                        </p>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        Waiting for signaling server…
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
                  /* CONNECTED STATE */
                  <div className="absolute inset-0">
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

                    <svg
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <line x1="17" y1="32" x2="50" y2="50" stroke="rgba(124,58,237,0.32)" strokeWidth="1.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
                      <line x1="83" y1="62" x2="50" y2="50" stroke="rgba(124,58,237,0.32)" strokeWidth="1.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
                    </svg>

                    <span className="packet packet-left" />
                    <span className="packet packet-right" />

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
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                          WebRTC node
                        </span>
                      </div>
                    </div>

                    <PeerNode icon={Laptop} label="Laptop" tone="emerald" className="animate-peer-left left-[12%] top-[22%]" />
                    <PeerNode icon={Smartphone} label="Mobile" tone="amber" className="animate-peer-right right-[11%] top-[50%]" />

                    {/* Signal card */}
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
                        <p className="text-[10px] font-medium text-slate-400">{net.label}</p>
                        <p className={`text-[11px] font-bold ${signalTone(net.bars)}`}>
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
                      connected ? 'text-purple-600 dark:text-purple-400' : 'text-amber-500'
                    }`}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
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
                  <p className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">
                    Quick connect
                  </p>
                  <h2 className="mt-1 font-heading text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
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
                <p className="text-[12px] text-slate-400 dark:text-slate-500">
                  5-character room code. No account required.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* ================= METRICS ================= */}
        <section aria-label="WebDrop at a glance" className="mt-6 sm:mt-8">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-surface-border dark:bg-white/[0.06] lg:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-white px-5 py-6 text-center dark:bg-surface-card">
                <dt className="sr-only">{m.label}</dt>
                <dd className="font-heading text-[24px] font-extrabold tracking-tight text-purple-600 dark:text-purple-400 sm:text-[28px]">
                  {m.value}
                </dd>
                <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400" aria-hidden="true">
                  {m.label}
                </p>
              </div>
            ))}
          </dl>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="mt-16 sm:mt-24">
          <SectionHeading
            title="Three steps. No sign-up."
            description="From opening the page to the first file arriving usually takes under a minute."
          />

          <ol className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="font-mono text-[13px] font-bold text-purple-200 dark:text-purple-500/40">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 text-[16px] font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ================= USE CASES ================= */}
        <section className="mt-16 sm:mt-24">
          <SectionHeading
            title="Made for everyday transfers."
            description="Whenever two devices need to swap files quickly, without the detour through a cloud drive."
          />

          <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-[14px] font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-[12.5px] leading-6 text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <div className="mt-16 sm:mt-24">
          <FeatureCards />
        </div>

        {/* ================= COMPARISON ================= */}
        <section className="mt-16 sm:mt-24">
          <SectionHeading
            title="Why not just upload it somewhere?"
            description="Cloud sharing makes sense for files you want to keep. For a quick hand-off between two devices, a direct transfer is simpler and more private."
          />

          <div className="mx-auto mt-10 max-w-4xl overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-surface-border dark:bg-surface-card">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-surface-border">
                  <th scope="col" className="w-[28%] px-5 py-4">
                    <span className="sr-only">Topic</span>
                  </th>
                  <th scope="col" className="px-5 py-4 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                    Typical cloud sharing
                  </th>
                  <th scope="col" className="bg-purple-50/70 px-5 py-4 text-[13px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                    WebDrop
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.topic}
                    className={i !== COMPARISON.length - 1 ? 'border-b border-slate-100 dark:border-white/[0.06]' : ''}
                  >
                    <th scope="row" className="px-5 py-4 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                      {row.topic}
                    </th>
                    <td className="px-5 py-4 text-[13px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-start gap-2">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
                        {row.cloud}
                      </span>
                    </td>
                    <td className="bg-purple-50/40 px-5 py-4 text-[13px] font-medium text-slate-700 dark:bg-purple-500/[0.05] dark:text-slate-200">
                      <span className="inline-flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.8} />
                        {row.webdrop}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= PRIVACY ================= */}
        <section className="mt-16 sm:mt-24">
          <div className="grid overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-surface-border dark:bg-surface-card lg:grid-cols-[1fr_1.1fr]">
            <div className="relative p-7 sm:p-10">
              <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-500/10" />
              <div className="relative">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                </span>
                <h2 className="mt-6 font-heading text-[26px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[32px]">
                  Private by design, not by promise.
                </h2>
                <p className="mt-4 text-[14px] leading-7 text-slate-500 dark:text-slate-400">
                  WebDrop&apos;s server has one job: introducing two devices to
                  each other. Once they are connected, everything you send is
                  encrypted with DTLS and goes directly between them. There is
                  nothing on our side to leak, because there is nothing stored.
                </p>
                <Link
                  to="/team"
                  className={`mt-6 inline-flex items-center gap-2 rounded-lg text-[13px] font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-white ${FOCUS_RING}`}
                >
                  See how it is built
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              </div>
            </div>

            <div className="grid gap-px border-t border-slate-200 bg-slate-200 dark:border-surface-border dark:bg-white/[0.06] sm:grid-cols-2 lg:border-l lg:border-t-0">
              <VisibilityColumn icon={Eye} tone="neutral" title="What the server sees" items={SERVER_SEES} />
              <VisibilityColumn icon={EyeOff} tone="good" title="What it never sees" items={SERVER_NEVER} />
            </div>
          </div>
        </section>

        {/* ================= APPS / DOWNLOAD ================= */}
        <section id="download" className="mt-16 scroll-mt-24 sm:mt-24">
          <SectionHeading
            title="Use WebDrop on any device."
            description="Open it in your browser with nothing to install, or add the app to your phone or computer. Downloads start right here, you stay on this page."
          />

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {/* Web */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
                  <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white">Web</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Any modern browser</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  No install
                </span>
              </div>
              <p className="mt-3 flex-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                Works on phones, tablets, laptops and desktops. Nothing to download.
              </p>
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={creating}
                className={`mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3.5 text-[12px] font-semibold text-white hover:bg-purple-700 disabled:opacity-60 ${FOCUS_RING}`}
              >
                <Radio className="h-3.5 w-3.5" strokeWidth={2.4} />
                Open in browser
              </button>
            </div>

            {APP_DOWNLOADS.map((item) => (
              <DownloadItem key={item.id} item={item} currentPlatform={currentPlatform} />
            ))}
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section className="mt-16 sm:mt-24">
          <SectionHeading
            title="Frequently asked questions"
            description="Quick answers about privacy, limits and how connections work."
          />

          <div className="mx-auto mt-10 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/[0.06] dark:border-surface-border dark:bg-surface-card">
            {FAQ.map((item) => (
              <details key={item.q} className="group">
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14px] font-semibold text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/[0.03] sm:px-6 [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
                >
                  {item.q}
                  <Plus
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-45"
                    strokeWidth={2.4}
                  />
                </summary>
                <p className="px-5 pb-5 text-[13px] leading-7 text-slate-500 dark:text-slate-400 sm:px-6">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="mt-16 sm:mt-24">
          <div className="relative overflow-hidden rounded-[28px] border border-purple-500/20 bg-slate-950 px-6 py-12 text-center shadow-xl shadow-purple-900/20 sm:px-10 sm:py-14">
            <div className="pointer-events-none absolute left-1/2 top-[-160px] h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-purple-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-[-80px] h-[260px] w-[260px] rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative">
              <h2 className="font-heading text-[28px] font-extrabold tracking-tight text-white sm:text-[38px]">
                Ready to send your first file?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[14px] leading-7 text-slate-400 sm:text-[15px]">
                Create a room, share the code, and start transferring. It takes
                less than a minute and nothing is stored afterwards.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-purple-600 px-6 py-3.5 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.35)] transition-all hover:-translate-y-0.5 hover:bg-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Radio className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  {creating ? 'Creating…' : 'Create secure room'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/join')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/[0.1] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                >
                  <Cable className="h-4 w-4" strokeWidth={2.2} />
                  Join with a code
                </button>
              </div>
            </div>
          </div>
        </section>
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
        .packet {
          position: absolute;
          width: 8px;
          height: 8px;
          margin: -4px 0 0 -4px;
          border-radius: 9999px;
          background: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.8);
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
          .animate-peer-left,
          .animate-peer-right,
          .animate-peer-up,
          .animate-peer-center,
          .packet { animation: none !important; }
          .animate-peer-center { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   DOWNLOAD ITEM

   Shared by the dropdown and the "Use WebDrop on any device"
   section. Downloads start in place: no new tab, no page
   change, so the user always stays on the home page.
========================================================= */

function DownloadItem({ item, currentPlatform, menu = false, onStarted }) {
  const [started, setStarted] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const [latest, ...older] = item.versions;

  if (!latest) return null;

  const Icon = item.icon;
  const meta = [latest.size, latest.date].filter(Boolean).join(' · ');

  const begin = (version) => {
    startDownload(version.url);
    setStarted(version.version);

    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStarted(null), 3000);

    onStarted?.();
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-surface-border dark:bg-white/[0.03] md:bg-white md:p-5 md:dark:bg-surface-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
          <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-bold text-slate-900 dark:text-white">{item.name}</p>

            <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {item.ext}
            </span>

            {currentPlatform === item.id && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                Your device
              </span>
            )}
          </div>

          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">v{latest.version}</span>{' '}
            <span className="text-emerald-600 dark:text-emerald-400">· Latest</span>
            {meta ? ` · ${meta}` : ''}
          </p>
        </div>

        {menu && (
          <button
            type="button"
            role="menuitem"
            onClick={() => begin(latest)}
            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[12px] font-semibold text-white transition-colors ${
              started === latest.version ? 'bg-emerald-600' : 'bg-purple-600 hover:bg-purple-700'
            } ${FOCUS_RING}`}
          >
            {started === latest.version ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                Started
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
                Download
              </>
            )}
          </button>
        )}
      </div>

      {item.requirement && !menu && (
        <p className="mt-3 text-[12px] font-medium text-slate-600 dark:text-slate-300">{item.requirement}</p>
      )}

      {item.note && (
        <p className="mt-2.5 flex-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          {item.note}
        </p>
      )}

      {!menu && (
        <button
          type="button"
          onClick={() => begin(latest)}
          className={`mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[12px] font-semibold text-white transition-colors ${
            started === latest.version ? 'bg-emerald-600' : 'bg-purple-600 hover:bg-purple-700'
          } ${FOCUS_RING}`}
        >
          {started === latest.version ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
              Download started
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
              Download for {item.name}
            </>
          )}
        </button>
      )}

      {started && (
        <p role="status" className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
          Your download has started. Check your downloads folder.
        </p>
      )}

      {older.length > 0 && (
        <details className="mt-2.5 border-t border-slate-200 pt-2.5 dark:border-white/[0.06]">
          <summary className="cursor-pointer select-none text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
            Older versions ({older.length})
          </summary>

          <ul className="mt-2 flex flex-col gap-1.5">
            {older.map((v) => (
              <li key={v.version} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-slate-600 dark:text-slate-300">
                  v{v.version}
                  {[v.size, v.date].filter(Boolean).length > 0 &&
                    ` · ${[v.size, v.date].filter(Boolean).join(' · ')}`}
                </span>

                <button
                  type="button"
                  onClick={() => begin(v)}
                  className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:underline dark:text-purple-400"
                >
                  <Download className="h-3 w-3" strokeWidth={2.4} />
                  {started === v.version ? 'Started' : 'Download'}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* =========================================================
   DOWNLOAD APP DROPDOWN

   - Desktop / tablet: popover under the button.
   - Phones: bottom sheet that slides up, so it is never cut
     off or pushed outside the screen.
   - Opens and closes with a smooth transition.
   - Downloads start in place, the user stays on the home page.
========================================================= */

const CLOSE_MS = 220;

function DownloadDropdown({ currentPlatform }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 360 });

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  /* Put user's platform first */
  const items = useMemo(
    () =>
      [...APP_DOWNLOADS].sort(
        (a, b) => Number(b.id === currentPlatform) - Number(a.id === currentPlatform)
      ),
    [currentPlatform]
  );

  const updatePosition = useCallback(() => {
    const isSheet = window.innerWidth < 640;
    setSheet(isSheet);

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect || isSheet) return;

    const width = Math.min(380, window.innerWidth - 16);
    let left = rect.left;

    if (left + width > window.innerWidth - 8) {
      left = window.innerWidth - width - 8;
    }
    left = Math.max(8, left);

    setPos({ top: rect.bottom + 8, left, width });
  }, []);

  /* Mount first, then animate in. Animate out, then unmount. */
  useEffect(() => {
    if (open) {
      updatePosition();
      setMounted(true);

      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setShown(true))
      );

      return () => cancelAnimationFrame(raf);
    }

    setShown(false);
    const t = setTimeout(() => setMounted(false), CLOSE_MS);

    return () => clearTimeout(t);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (e) => {
      if (window.innerWidth < 640) return; // sheet closes via backdrop

      const insidePanel = panelRef.current?.contains(e.target);
      const insideButton = buttonRef.current?.contains(e.target);

      if (!insidePanel && !insideButton) setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  /* Lock page scroll while the bottom sheet is open */
  useEffect(() => {
    if (!mounted || !sheet) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, sheet]);

  /* Let the user see "Download started", then close smoothly */
  const handleStarted = () => {
    setTimeout(() => setOpen(false), 1100);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-6 py-3.5 text-[14px] font-semibold text-purple-700 transition-all hover:-translate-y-0.5 hover:bg-purple-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20"
      >
        <Download className="h-4 w-4" strokeWidth={2.2} />
        Download app
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.4}
        />
      </button>

      {mounted &&
        createPortal(
          sheet ? (
            /* ---------- Phone: bottom sheet ---------- */
            <div className="fixed inset-0 z-[100]">
              <div
                onClick={() => setOpen(false)}
                aria-hidden="true"
                className={`absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none ${
                  shown ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <div
                ref={panelRef}
                role="menu"
                aria-label="Download app"
                className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-4 pt-3 shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none dark:border-surface-border dark:bg-surface-card ${
                  shown ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              >
                <div className="mx-auto h-1 w-10 rounded-full bg-slate-200 dark:bg-white/15" />

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
                      Download WebDrop
                    </h2>
                    <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                      Choose your device. You stay on this page.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 dark:border-surface-border dark:text-slate-400 ${FOCUS_RING}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {items.map((item) => (
                    <DownloadItem
                      key={item.id}
                      item={item}
                      currentPlatform={currentPlatform}
                      menu
                      onStarted={handleStarted}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ---------- Tablet / desktop: popover ---------- */
            <div
              ref={panelRef}
              role="menu"
              aria-label="Download app"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className={`fixed z-[100] max-h-[70vh] origin-top-left overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl transition duration-200 ease-out motion-reduce:transition-none dark:border-surface-border dark:bg-surface-card ${
                shown
                  ? 'translate-y-0 scale-100 opacity-100'
                  : '-translate-y-1 scale-95 opacity-0'
              }`}
            >
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <DownloadItem
                    key={item.id}
                    item={item}
                    currentPlatform={currentPlatform}
                    menu
                    onStarted={handleStarted}
                  />
                ))}
              </div>
            </div>
          ),
          document.body
        )}
    </>
  );
}

/* =========================================================
   SMALL PRESENTATIONAL HELPERS
========================================================= */

function SectionHeading({ title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="font-heading text-[26px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[34px]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[14px] leading-7 text-slate-500 dark:text-slate-400 sm:text-[15px]">
          {description}
        </p>
      )}
    </div>
  );
}

function VisibilityColumn({ icon: Icon, tone, title, items }) {
  const good = tone === 'good';

  return (
    <div className="bg-white p-6 dark:bg-surface-card sm:p-7">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          good
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>

      <h3 className="mt-4 text-[14px] font-bold text-slate-900 dark:text-white">{title}</h3>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            {good ? (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2.4} />
            )}
            <span className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TechItem({ icon: Icon, color, label, value, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon className={`h-4 w-4 ${color}`} />
      <div>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300">{value}</p>
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
      <span className="mt-1.5 text-[10px] font-medium text-slate-400">{label}</span>
    </div>
  );
}

function StatusChip({ icon: Icon, iconColor, label, value, valueColor }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2 backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/80">
      <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={2.1} />
      <div>
        <p className="text-[10px] font-medium text-slate-400">{label}</p>
        <p className={`text-[11px] font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}