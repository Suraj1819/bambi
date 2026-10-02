// src/pages/About.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Cable,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudOff,
  Code2,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderOpen,
  FolderUp,
  Flag,
  Gauge,
  GitBranch,
  Github,
  Globe2,
  HardDrive,
  History,
  Info,
  KeyRound,
  Laptop,
  Layers3,
  Link2,
  ListChecks,
  LockKeyhole,
  LogIn,
  Monitor,
  MonitorSmartphone,
  Network,
  Package,
  Plus,
  QrCode,
  Radio,
  RadioTower,
  RefreshCw,
  Rocket,
  Route,
  Send,
  Server,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';

/* =========================================================
   DATA
========================================================= */

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'testing', label: 'Testing' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'roadmap', label: 'Roadmap' },
];

const STATS = [
  { value: '2', label: 'Devices per room' },
  { value: '5', label: 'Character room code' },
  { value: '30 min', label: 'Room lifetime' },
  { value: '64 KB', label: 'Chunk size' },
  { value: '0 MB', label: 'Server storage' },
  { value: '14/14', label: 'Test cases passed' },
];

const OVERVIEW_POINTS = [
  'A browser-based peer-to-peer file transfer application',
  'Lets two devices transfer files directly through modern web browsers',
  'No user account or sign-up required',
  'User creates a temporary room and shares a room code or QR code',
  'WebRTC establishes a direct peer-to-peer connection between browsers',
  'Files travel over the WebRTC DataChannel, not through the server',
];

const CONVENTIONAL = [
  'Files must be uploaded to the cloud first',
  'Data often travels through third-party servers',
  'Accounts or storage quotas may be required',
  'Large files need an upload and a download, doubling transfer time',
];

const DIRECT = [
  'Direct device-to-device transfer, no storage step',
  'No account or sign-up needed',
  'Files never rest on a server',
  'Transfer starts the moment the two browsers connect',
];

const FLOW = [
  'Create Room',
  'Join',
  'Signaling',
  'WebRTC Connection',
  'Transfer',
  'Download',
];

const OBJECTIVES = [
  { icon: Rocket, text: 'Build a browser-based file transfer system' },
  { icon: Network, text: 'Establish real-time browser-to-browser communication' },
  { icon: Route, text: 'Use WebRTC for peer-to-peer networking' },
  { icon: RadioTower, text: 'Use Socket.IO only for signaling and room coordination' },
  { icon: Layers3, text: 'Support multiple file transfers' },
  { icon: Gauge, text: 'Display real-time transfer progress' },
  { icon: QrCode, text: 'Provide QR-based room joining' },
  { icon: Database, text: 'Avoid server-side file storage' },
  { icon: MonitorSmartphone, text: 'Responsive desktop and mobile interface' },
];

const SOCKET_EVENTS = [
  'join-room',
  'leave-room',
  'user-joined',
  'user-left',
  'webrtc-offer',
  'webrtc-answer',
  'webrtc-ice-candidate',
  'set-room-lock',
  'kick-peer',
  'end-room',
  'room-ended',
  'room-expired',
];

const PROJECT_TREE = `webdrop/
├─ client/                    React + Vite
│  └─ src/
│     ├─ pages/               Home · Create · Join · Room · Team · About
│     ├─ hooks/               useWebRTC · useFileTransfer · useNetworkInfo
│     ├─ context/             RoomContext  (socket · room · role · users)
│     ├─ components/common/   PeerRadar · Toasts · FeatureCards · NetworkSignalIcon
│     └─ utils/               constants · fileUtils · generateRoomCode
│
└─ server/                    Node.js + Express + Socket.IO
   ├─ signaling               offer · answer · ICE relay
   └─ room manager            in-memory rooms · 2 devices · 30-min expiry`;

const WORKFLOW = [
  {
    icon: Plus,
    title: 'Create Room',
    text: 'User A creates a temporary room',
  },
  {
    icon: Share2,
    title: 'Share Room',
    text: 'Room code, QR code and link are generated',
  },
  {
    icon: LogIn,
    title: 'Join Room',
    text: 'User B joins via code or QR',
  },
  {
    icon: RadioTower,
    title: 'Signaling',
    text: 'Socket.IO exchanges offer / answer / ICE',
  },
  {
    icon: Link2,
    title: 'Peer Connection',
    text: 'WebRTC connects the two browsers',
  },
  {
    icon: FolderOpen,
    title: 'File Selection',
    text: 'User selects or drops files or folders',
  },
  {
    icon: Layers3,
    title: 'Chunking',
    text: 'Files are split into small chunks',
  },
  {
    icon: Send,
    title: 'Transfer',
    text: 'Chunks are sent over RTCDataChannel',
  },
  {
    icon: Boxes,
    title: 'Reconstruction',
    text: 'Receiver rebuilds the file',
  },
  {
    icon: Download,
    title: 'Download',
    text: 'The reconstructed file is saved locally',
  },
];

const SIGNALING = [
  {
    start: 'col-start-2',
    span: 'col-span-2',
    dir: 'right',
    label: 'createOffer() → webrtc-offer',
  },
  {
    start: 'col-start-4',
    span: 'col-span-2',
    dir: 'right',
    label: 'offer forwarded',
  },
  {
    start: 'col-start-4',
    span: 'col-span-2',
    dir: 'left',
    label: 'createAnswer() → webrtc-answer',
  },
  {
    start: 'col-start-2',
    span: 'col-span-2',
    dir: 'left',
    label: 'answer forwarded',
  },
  {
    start: 'col-start-2',
    span: 'col-span-4',
    dir: 'both',
    label: 'ICE candidates  (webrtc-ice-candidate)',
  },
  {
    start: 'col-start-2',
    span: 'col-span-4',
    dir: 'both',
    label: 'DataChannel open: signaling is no longer needed',
  },
];

const PIPELINE = [
  { icon: FileText, label: 'File' },
  { icon: Package, label: 'ArrayBuffer' },
  { icon: Layers3, label: '64 KB chunks' },
  { icon: Cable, label: 'RTCDataChannel' },
  { icon: Laptop, label: 'Receiver' },
  { icon: Boxes, label: 'Reassemble' },
  { icon: FileCheck2, label: 'Blob' },
  { icon: Download, label: 'Download' },
];

const PROTOCOL = [
  {
    type: 'file-offer',
    dir: 'Sender → Receiver',
    text: 'File details (name, size, type) under a unique transfer ID.',
  },
  {
    type: 'file-accept / file-reject',
    dir: 'Receiver → Sender',
    text: 'The receiver decides. Nothing moves until accepted.',
  },
  {
    type: 'file-start',
    dir: 'Sender → Receiver',
    text: 'Marks the beginning of the binary stream.',
  },
  {
    type: 'binary chunks',
    dir: 'Sender → Receiver',
    text: '64 KB ArrayBuffers carrying the file bytes.',
  },
  {
    type: 'file-progress',
    dir: 'Receiver → Sender',
    text: 'Bytes received so far, used for live speed and ETA.',
  },
  {
    type: 'file-complete',
    dir: 'Sender → Receiver',
    text: 'All chunks sent. The receiver assembles the Blob.',
  },
  {
    type: 'file-cancel',
    dir: 'Either direction',
    text: 'Stops only that transfer. The connection stays open.',
  },
];

const BACKPRESSURE = [
  'Large files can’t be sent as one huge message, so they are read in 4 MB blocks and sent as 64 KB chunks',
  'dataChannel.bufferedAmount is monitored during the transfer',
  'Sending pauses only when the browser’s send buffer is genuinely full',
  'It resumes instantly on the bufferedamountlow event, with no fixed delay',
  'This keeps browser memory usage under control on very large files',
];

const ALSO_HANDLED = [
  'Chunk sequencing',
  'Completion detection',
  'Error handling',
  'Per-file cancellation',
  'Accept / reject',
  'Auto re-queue on reconnect',
];

const ROOM_RULES = [
  'Room state lives in server memory only',
  'Maximum 2 devices per room',
  'Rooms expire after about 30 minutes',
  'Disconnected users are cleaned up automatically',
  'Expired rooms are removed from memory',
  'Host can lock the room, remove a peer or end the room',
  'No database is required for the MVP',
];

const SCREENS = [
  {
    icon: Monitor,
    title: 'Home',
    text: 'Create room · Join with a code',
  },
  {
    icon: Plus,
    title: 'Create Room',
    text: 'Room code · QR code',
  },
  {
    icon: LogIn,
    title: 'Join Room',
    text: 'Code input · Scan QR',
  },
  {
    icon: QrCode,
    title: 'QR Code',
    text: 'Scannable QR · Share link',
  },
  {
    icon: Route,
    title: 'Transfer Page',
    text: 'Peer radar · Drag & drop',
  },
  {
    icon: Gauge,
    title: 'Transfer Progress',
    text: 'Progress bar · Speed · ETA',
  },
  {
    icon: FileCheck2,
    title: 'Received File',
    text: 'Download button · Status',
  },
];

const TECH = [
  {
    icon: Monitor,
    title: 'Frontend',
    items: [
      'React',
      'Vite',
      'JavaScript',
      'Tailwind CSS',
      'React Router',
      'Socket.IO Client',
      'WebRTC APIs',
      'QR Code',
      'Lucide React',
    ],
  },
  {
    icon: Server,
    title: 'Backend',
    items: ['Node.js', 'Express.js', 'Socket.IO', 'CORS', 'dotenv'],
  },
  {
    icon: Network,
    title: 'Networking',
    items: ['WebRTC', 'RTCDataChannel', 'STUN', 'TURN fallback', 'DTLS'],
  },
  {
    icon: Database,
    title: 'Storage',
    items: ['No database', 'No file storage', 'In-memory room state'],
  },
];

const TESTS = [
  ['Create room', 'Room created with unique code'],
  ['Invalid room code', 'Join attempt rejected with error'],
  ['Join room', 'Second user connects successfully'],
  ['QR code joining', 'Scanning QR joins the correct room'],
  ['Device detection', 'Connected device shown in UI'],
  ['WebRTC connection', 'Peer connection established'],
  ['Send image / PDF', 'File received intact on peer'],
  ['Multiple files', 'All files transferred in sequence'],
  ['Large file', 'Transfer completes without crash'],
  ['Transfer progress', 'Progress bar updates in real time'],
  ['Transfer cancellation', 'Transfer stops cleanly on cancel'],
  ['Download', 'File downloads correctly to device'],
  ['Device disconnect', 'Room updates, peer notified'],
  ['Room expiration', 'Room removed after ~30 minutes'],
];

const SECURITY = [
  'Files are not stored on the backend',
  'Backend does not proxy file data',
  'File contents are never logged',
  'Room codes are validated on join',
  'Rooms are strictly temporary',
  'Room capacity is limited to 2 devices',
  'Only required connection info is exchanged',
  'Peer traffic is encrypted with DTLS',
];

const LIMITATIONS = [
  'WebRTC connectivity depends on network conditions',
  'Devices on different networks may fall back to a TURN relay, which can be slower',
  'Browser memory affects very large file transfers',
  'Only two devices per room',
  'No resume for interrupted transfers yet',
];

const TIMELINE = [
  {
    icon: Target,
    status: 'done',
    title: 'Problem study & planning',
    text: 'Studied the limits of cloud-based sharing, defined the objectives and chose WebRTC with Socket.IO signaling.',
  },
  {
    icon: Server,
    status: 'done',
    title: 'Rooms & signaling server',
    text: 'Built the Node.js + Express backend with in-memory rooms, 5-character codes, 2-device limit and expiry.',
  },
  {
    icon: Cable,
    status: 'done',
    title: 'WebRTC connection',
    text: 'Offer / answer / ICE exchange over Socket.IO, DataChannel setup and connection-state handling.',
  },
  {
    icon: Send,
    status: 'done',
    title: 'File transfer engine',
    text: 'Chunked streaming over the DataChannel, receiver reassembly, progress, multiple files and downloads.',
  },
  {
    icon: Sparkles,
    status: 'done',
    title: 'UI / UX & QR joining',
    text: 'Responsive purple interface, peer radar, QR join, invite links, drag & drop and live status.',
  },
  {
    icon: ShieldCheck,
    status: 'done',
    title: 'Reliability hardening',
    text: 'Backpressure, accept / reject / cancel per transfer, folder transfer, host controls, reconnect re-queue and TURN fallback.',
  },
  {
    icon: Rocket,
    status: 'done',
    title: 'v1.0.0 release',
    text: 'Web app plus Android (.apk) and Windows (.exe) builds, with downloads on the home page.',
  },
  {
    icon: Flag,
    status: 'current',
    title: 'Testing, polish & documentation',
    text: 'Functional testing across devices and networks, performance tuning and project documentation.',
  },
  {
    icon: GitBranch,
    status: 'next',
    title: 'Next milestones',
    text: 'Self-hosted TURN, resumable transfers and stronger room security. See the roadmap below.',
  },
];

const ROADMAP = [
  {
    key: 'shipped',
    title: 'Shipped',
    version: 'v1.0.0',
    status: 'done',
    items: [
      { icon: Radio, text: 'Room-based transfer with code, QR and link' },
      { icon: Network, text: 'Peer-to-peer over WebRTC DataChannel' },
      { icon: FolderUp, text: 'Multiple files and folder transfer' },
      { icon: ListChecks, text: 'Accept / reject / cancel per file' },
      { icon: Gauge, text: 'Live speed and ETA' },
      { icon: LockKeyhole, text: 'Host controls: lock, remove, end room' },
      { icon: RefreshCw, text: 'Auto re-queue after reconnect' },
      { icon: Cable, text: 'TURN fallback for restrictive networks' },
      { icon: MonitorSmartphone, text: 'Web, Android and Windows apps' },
    ],
  },
  {
    key: 'next',
    title: 'Up next',
    version: 'v1.1 · Proposed',
    status: 'current',
    items: [
      { icon: Server, text: 'Self-hosted TURN with short-lived credentials' },
      { icon: RefreshCw, text: 'Resume interrupted transfers' },
      { icon: HardDrive, text: 'Stream received files straight to disk' },
      { icon: KeyRound, text: 'Password-protected rooms' },
    ],
  },
  {
    key: 'later',
    title: 'Future scope',
    version: 'v2.0 · Proposed',
    status: 'next',
    items: [
      { icon: LockKeyhole, text: 'End-to-end encryption layer' },
      { icon: Users, text: 'Multiple peers per room' },
      { icon: Eye, text: 'Improved file previews' },
      { icon: History, text: 'Transfer history' },
      { icon: Smartphone, text: 'PWA support' },
    ],
  },
];

const STATUS = {
  done: {
    label: 'Done',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  current: {
    label: 'In progress',
    chip: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  next: {
    label: 'Planned',
    chip: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
};

/* =========================================================
   SHARED UI
========================================================= */

const CARD =
  'min-w-0 rounded-[24px] border border-slate-200 bg-white dark:border-surface-border dark:bg-surface-card sm:rounded-[28px]';

const SOFT_CARD =
  'min-w-0 rounded-2xl border border-slate-200 bg-white dark:border-surface-border dark:bg-white/[0.03]';

const INNER =
  'min-w-0 rounded-xl border border-purple-100 bg-[#FAF9FF] dark:border-surface-border dark:bg-white/[0.03]';

const HOVER =
  'transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-900/10 dark:hover:border-purple-400/30 dark:hover:shadow-black/30';

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    io.observe(el);

    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`min-w-0 transition-all duration-700 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto min-w-0 max-w-2xl text-center">
      <p
        className="mb-3 text-[9px] font-bold uppercase text-purple-500 sm:text-[10px]"
        style={{ letterSpacing: '0.22em' }}
      >
        {eyebrow}
      </p>

      <h2 className="break-words font-heading text-[25px] font-extrabold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-[30px] md:text-[34px]">
        {title}
      </h2>

      {description && (
        <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-6 text-slate-500 dark:text-slate-400 sm:mt-4 sm:text-[15px] sm:leading-7">
          {description}
        </p>
      )}
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  tint = false,
  children,
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 overflow-hidden border-b border-slate-200 dark:border-surface-border ${
        tint ? 'bg-white/60 dark:bg-white/[0.015]' : ''
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-3 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-10">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <div className="mt-8 min-w-0 sm:mt-10 md:mt-12">{children}</div>
      </div>
    </section>
  );
}

function IconBox({ icon: Icon, className = '' }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 sm:h-10 sm:w-10 ${className}`}
    >
      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
    </div>
  );
}

function CheckList({ items, tone = 'emerald' }) {
  const color =
    tone === 'red'
      ? 'text-red-500'
      : tone === 'amber'
        ? 'text-amber-500'
        : 'text-emerald-500';

  const Icon = tone === 'amber' ? Info : CheckCircle2;

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex min-w-0 items-start gap-2.5">
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 ${color}`}
            strokeWidth={2.2}
          />

          <span className="min-w-0 break-words text-[12.5px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[13px] sm:leading-6">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatusChip({ status }) {
  const s = STATUS[status];

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${s.chip}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot} ${
          status === 'current' ? 'animate-pulse' : ''
        }`}
      />

      <span className="truncate">{s.label}</span>
    </span>
  );
}

function NodeCard({ icon: Icon, title, sub, accent = false }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 sm:p-4 ${
        accent
          ? 'border-purple-300 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/20'
          : 'border-slate-200 bg-[#FAF9FF] dark:border-surface-border dark:bg-white/[0.03]'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
          accent
            ? 'bg-white/15'
            : 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
        }`}
      >
        <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <p
          className={`truncate text-[13px] font-bold sm:text-[14px] ${
            accent
              ? 'text-white'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {title}
        </p>

        {sub && (
          <p
            className={`mt-0.5 break-words text-[11px] sm:text-[12px] ${
              accent
                ? 'text-purple-100'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TIMELINE
========================================================= */

function Timeline({ items }) {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-purple-400 via-purple-200 to-transparent dark:from-purple-500/60 dark:via-purple-500/20 md:left-1/2 md:-translate-x-1/2" />

      {items.map((item, i) => {
        const Icon = item.icon;
        const left = i % 2 === 0;
        const s = STATUS[item.status];

        return (
          <Reveal
            key={item.title}
            delay={60}
            className="relative mb-5 md:grid md:grid-cols-2 md:gap-10 lg:gap-14"
          >
            <div
              className={`absolute left-4 top-6 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#FBFAFF] dark:border-surface md:left-1/2 ${
                s.dot
              } ${
                item.status === 'current'
                  ? 'ring-4 ring-purple-300/50 dark:ring-purple-500/30'
                  : ''
              }`}
            />

            <div
              className={`ml-9 min-w-0 ${HOVER} ${SOFT_CARD} p-4 sm:ml-10 sm:p-5 md:ml-0 ${
                left ? 'md:col-start-1' : 'md:col-start-2'
              }`}
            >
              <div className="flex min-w-0 items-start justify-between gap-2.5 sm:gap-3">
                <IconBox icon={Icon} />

                <StatusChip status={item.status} />
              </div>

              <p className="mt-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:mt-4 sm:text-[10px]">
                Phase {String(i + 1).padStart(2, '0')}
              </p>

              <h3 className="mt-1 break-words text-[14px] font-bold text-slate-900 dark:text-white sm:text-[15px]">
                {item.title}
              </h3>

              <p className="mt-2 break-words text-[12px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[13px] sm:leading-6">
                {item.text}
              </p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* =========================================================
   MOBILE SIGNALING FLOW
========================================================= */

function MobileSignalingSequence() {
  const steps = [
    {
      number: '01',
      title: 'Browser A creates offer',
      text: 'createOffer() generates the WebRTC offer.',
      icon: Laptop,
    },
    {
      number: '02',
      title: 'Offer reaches Browser B',
      text: 'Socket.IO forwards the offer to the other browser.',
      icon: RadioTower,
    },
    {
      number: '03',
      title: 'Browser B creates answer',
      text: 'createAnswer() generates the response.',
      icon: Smartphone,
    },
    {
      number: '04',
      title: 'Answer returns to Browser A',
      text: 'Socket.IO forwards the answer back.',
      icon: RadioTower,
    },
    {
      number: '05',
      title: 'ICE candidates exchanged',
      text: 'Both browsers discover possible network paths.',
      icon: Network,
    },
    {
      number: '06',
      title: 'DataChannel opens',
      text: 'Signaling is no longer needed for file transfer.',
      icon: Cable,
    },
  ];

  return (
    <div className="space-y-2.5 sm:hidden">
      {steps.map(({ number, title, text, icon: Icon }) => (
        <div
          key={number}
          className="flex min-w-0 items-start gap-3 rounded-xl border border-purple-100 bg-[#FAF9FF] p-3.5 dark:border-surface-border dark:bg-white/[0.03]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold text-purple-400">
                {number}
              </span>

              <p className="min-w-0 break-words text-[12px] font-bold text-slate-800 dark:text-slate-100">
                {title}
              </p>
            </div>

            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function About() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#FBFAFF] text-slate-900 transition-colors dark:bg-surface dark:text-white">
      {/* ===================== HERO ===================== */}

      <section className="relative overflow-hidden border-b border-slate-200 dark:border-surface-border">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[280px] w-[280px] rounded-full bg-purple-200/50 blur-3xl sm:h-[420px] sm:w-[420px] dark:bg-purple-500/10" />

          <div className="absolute -bottom-40 -left-40 h-[280px] w-[280px] rounded-full bg-indigo-100/40 blur-3xl sm:h-[380px] sm:w-[380px] dark:bg-indigo-500/5" />

          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-3 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10 md:pb-20 md:pt-14 lg:px-10">
          <Link
            to="/"
            className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 transition-all hover:border-purple-300 hover:text-purple-600 dark:border-surface-border dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white sm:px-3.5 sm:text-[12px]"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
            />

            Back to WebDrop
          </Link>

          <div className="mx-auto mt-10 min-w-0 max-w-3xl text-center sm:mt-14 md:mt-16">
            <div className="mx-auto mb-5 flex max-w-2xl flex-wrap items-center justify-center gap-1.5 sm:mb-6 sm:gap-2">
              {[
                'B.Tech Mini-Project',
                'Computer Science & Engineering',
                '2026–27',
                'v1.0.0',
              ].map((b) => (
                <span
                  key={b}
                  className="max-w-full rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 sm:px-3 sm:text-[10px] sm:tracking-[0.14em]"
                >
                  {b}
                </span>
              ))}
            </div>

            <h1 className="break-words font-heading text-[36px] font-extrabold leading-[0.98] tracking-[-0.045em] text-slate-900 dark:text-white sm:text-[48px] md:text-[56px] lg:text-[68px]">
              Everything about
              <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                WebDrop.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-[13px] leading-6 text-slate-500 dark:text-slate-400 sm:mt-6 sm:text-[15px] sm:leading-7 md:text-[16px]">
              A browser-based peer-to-peer file transfer system built on
              WebRTC. This page walks through the idea, architecture,
              transfer engine, testing, project timeline and the roadmap
              ahead.
            </p>

            <p className="mt-3 font-heading text-[16px] font-bold italic text-purple-600 dark:text-purple-400 sm:mt-4 sm:text-[18px]">
              “Drop. Connect. Transfer.”
            </p>

            <div className="mx-auto mt-7 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center">
              <Link
                to="/create"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-purple-700 sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px]"
              >
                <Radio className="h-4 w-4" />
                Create secure room
                <ArrowRight
                  className="h-4 w-4"
                  strokeWidth={2.5}
                />
              </Link>

              <Link
                to="/team"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-700 transition-all hover:border-purple-200 hover:bg-slate-50 dark:border-surface-border dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06] sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px]"
              >
                <Users className="h-4 w-4" />
                Meet the team
              </Link>
            </div>
          </div>

          {/* STATS */}

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-surface-border dark:bg-white/[0.06] sm:mt-14 sm:grid-cols-3 lg:grid-cols-6">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex min-w-0 min-h-[82px] flex-col items-center justify-center bg-white px-2.5 py-4 text-center dark:bg-surface-card sm:min-h-[90px] sm:px-4 sm:py-5"
              >
                <p className="font-heading text-[18px] font-extrabold tracking-tight text-purple-600 dark:text-purple-400 sm:text-[22px]">
                  {s.value}
                </p>

                <p className="mt-1 max-w-[110px] text-[8px] font-bold uppercase leading-3 tracking-[0.08em] text-slate-400 sm:text-[10px] sm:tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* QUICK NAV */}

          <nav
            aria-label="On this page"
            className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-1.5 sm:mt-8 sm:gap-2"
          >
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 transition-colors hover:border-purple-300 hover:text-purple-600 dark:border-surface-border dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white sm:px-3.5 sm:text-[12px]"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* ===================== OVERVIEW ===================== */}

      <Section
        id="overview"
        eyebrow="Introduction"
        title="What is WebDrop?"
        description="WebDrop lets two devices transfer files directly through their browsers. Nothing is uploaded and nothing is stored."
      >
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5 lg:grid-cols-2">
          <Reveal>
            <div className={`${CARD} h-full p-5 sm:p-8`}>
              <IconBox icon={Wifi} className="h-10 w-10 sm:h-11 sm:w-11" />

              <h3 className="mt-5 font-heading text-[19px] font-bold tracking-tight sm:mt-6 sm:text-[20px]">
                In a nutshell
              </h3>

              <div className="mt-4 sm:mt-5">
                <CheckList items={OVERVIEW_POINTS} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className={`${CARD} relative h-full overflow-hidden p-5 sm:p-8`}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-500/10" />

              <div className="relative flex h-full min-w-0 flex-col justify-center gap-4 sm:gap-5">
                <div className="grid min-w-0 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                  <NodeCard
                    icon={Laptop}
                    title="Device A"
                    sub="Creates the room"
                  />

                  <div className="flex items-center justify-center gap-1.5 text-purple-400 sm:gap-2">
                    <ChevronLeft className="h-4 w-4" />

                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 sm:px-3 sm:text-[10px]">
                      Direct
                    </span>

                    <ChevronRight className="h-4 w-4" />
                  </div>

                  <NodeCard
                    icon={Smartphone}
                    title="Device B"
                    sub="Joins with code / QR"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="h-px flex-1 border-t border-dashed border-purple-300 dark:border-purple-500/30" />

                  <NodeCard
                    icon={Wifi}
                    title="WebDrop Room"
                    sub="signaling only"
                    accent
                  />

                  <div className="h-px flex-1 border-t border-dashed border-purple-300 dark:border-purple-500/30" />
                </div>

                <p className="text-center text-[11px] font-semibold leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">
                  Not cloud storage. Files never rest on a server.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ===================== PROBLEM / SOLUTION ===================== */}

      <Section
        id="problem"
        eyebrow="Problem & Solution"
        title="Why a direct transfer?"
        description="Nearby devices rarely need permanent cloud storage. They just need a quick, direct way to hand over a file."
        tint
      >
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5 lg:grid-cols-2">
          <Reveal>
            <div className={`${CARD} h-full p-5 sm:p-8`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
                  <Cloud className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 sm:text-[10px]">
                    Conventional
                  </p>

                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                    The cloud detour
                  </h3>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-xl border border-red-100 bg-red-50/50 p-3 text-[11px] font-semibold text-red-600 dark:border-red-500/15 dark:bg-red-500/5 dark:text-red-400 sm:gap-2 sm:text-[12px]">
                <Laptop className="h-4 w-4" />
                Upload
                <ArrowRight className="h-3.5 w-3.5" />
                <Database className="h-4 w-4" />
                Store
                <ArrowRight className="h-3.5 w-3.5" />
                <Smartphone className="h-4 w-4" />
                Download
              </div>

              <ul className="mt-5 space-y-2.5">
                {CONVENTIONAL.map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                    <span className="text-[12.5px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[13px] sm:leading-6">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="h-full min-w-0 rounded-[24px] border border-purple-300 bg-gradient-to-br from-white to-purple-50 p-5 shadow-lg shadow-purple-900/5 dark:border-purple-400/30 dark:from-surface-card dark:to-purple-500/[0.07] sm:rounded-[28px] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Zap className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 sm:text-[10px]">
                    WebDrop
                  </p>

                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                    Direct peer-to-peer
                  </h3>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/15 dark:bg-emerald-500/5 dark:text-emerald-400 sm:gap-2 sm:text-[12px]">
                <Laptop className="h-4 w-4" />
                <ChevronLeft className="h-3.5 w-3.5" />
                <ChevronRight className="h-3.5 w-3.5" />
                <Smartphone className="h-4 w-4" />
                No storage step
              </div>

              <div className="mt-5">
                <CheckList items={DIRECT} />
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-6 max-w-4xl sm:mt-8">
          <div className={`${CARD} relative overflow-hidden p-5 text-center sm:p-8`}>
            <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[240px] w-[420px] -translate-x-1/2 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-500/10" />

            <p className="relative text-[9px] font-bold uppercase tracking-[0.2em] text-purple-500 sm:text-[10px]">
              Core problem
            </p>

            <p className="relative mt-3 break-words font-heading text-[16px] font-bold leading-snug text-slate-900 dark:text-white sm:text-[22px]">
              “How can users transfer files directly between browsers
              without storing the files on a central server?”
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-1.5 sm:mt-8 sm:gap-2">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 sm:gap-2">
              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-[10px] font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 sm:px-3.5 sm:text-[12px]">
                {step}
              </span>

              {i < FLOW.length - 1 && (
                <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600 sm:h-3.5 sm:w-3.5" />
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-6xl sm:mt-14">
          <p className="mb-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mb-5 sm:text-[10px]">
            Project objectives
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {OBJECTIVES.map(({ icon, text }, i) => (
              <Reveal key={text} delay={(i % 3) * 80}>
                <div className={`${SOFT_CARD} ${HOVER} flex min-w-0 items-center gap-3 p-3.5 sm:p-4`}>
                  <IconBox icon={icon} />

                  <p className="min-w-0 break-words text-[12px] font-semibold leading-5 text-slate-700 dark:text-slate-200 sm:text-[13px]">
                    {text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ===================== ARCHITECTURE ===================== */}

      <Section
        id="architecture"
        eyebrow="System Architecture"
        title="Signaling here. Files there."
        description="The backend only helps two browsers find each other. The actual file bytes flow directly between them."
      >
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          <Reveal>
            <div className={`${CARD} p-5 sm:p-8`}>
              <div className="grid min-w-0 items-center gap-3 sm:gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <NodeCard
                  icon={Monitor}
                  title="Frontend"
                  sub="React + Vite"
                />

                <div className="flex min-w-0 flex-col items-center gap-1 px-2 text-center sm:px-4">
                  <RadioTower className="h-5 w-5 text-purple-500" />

                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 sm:text-[12px]">
                    Socket.IO
                  </p>

                  <p className="max-w-xs text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
                    Signaling only: room info, offer / answer, ICE
                  </p>
                </div>

                <NodeCard
                  icon={Server}
                  title="Backend"
                  sub="Node.js + Express"
                />
              </div>

              <div className="my-5 flex items-center gap-2 sm:my-6 sm:gap-3">
                <div className="h-px flex-1 border-t border-dashed border-slate-200 dark:border-white/10" />

                <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.15em] text-slate-400 sm:text-[10px] sm:tracking-[0.18em]">
                  Browser to browser
                </span>

                <div className="h-px flex-1 border-t border-dashed border-slate-200 dark:border-white/10" />
              </div>

              <div className="grid min-w-0 items-center gap-3 sm:gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <NodeCard
                  icon={Laptop}
                  title="Browser A"
                  sub="Sender or receiver"
                />

                <div className="flex min-w-0 flex-col items-center gap-2">
                  <div className="h-1.5 w-full min-w-[120px] max-w-[260px] rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 sm:h-2" />

                  <p className="text-center text-[11px] font-bold text-purple-600 dark:text-purple-400 sm:text-[12px]">
                    WebRTC DataChannel
                  </p>

                  <p className="max-w-[260px] text-center text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
                    Actual file data, never through the backend
                  </p>
                </div>

                <NodeCard
                  icon={Smartphone}
                  title="Browser B"
                  sub="Sender or receiver"
                />
              </div>

              <p className="mt-5 text-center text-[10px] font-semibold leading-5 text-slate-500 dark:text-slate-400 sm:mt-6 sm:text-[12px]">
                Socket.IO → signaling only
                <span className="mx-1.5">·</span>
                WebRTC DataChannel → actual file transfer
              </p>
            </div>
          </Reveal>

          <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Reveal>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={Code2} />

                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                    Project structure
                  </h3>
                </div>

                <pre className="mt-4 max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-[9px] leading-5 text-slate-300 dark:border-white/10 sm:mt-5 sm:p-5 sm:text-[11.5px] sm:leading-6">
                  {PROJECT_TREE}
                </pre>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={RadioTower} />

                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                    Signaling events
                  </h3>
                </div>

                <p className="mt-3 text-[12px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[13px] sm:leading-6">
                  Everything the Socket.IO server relays. File data is not
                  part of this list.
                </p>

                <div className="mt-4 flex min-w-0 flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                  {SOCKET_EVENTS.map((e) => (
                    <span
                      key={e}
                      className="max-w-full break-all rounded-lg border border-purple-100 bg-purple-50/60 px-2 py-1.5 font-mono text-[9px] font-semibold text-purple-700 dark:border-purple-500/15 dark:bg-purple-500/10 dark:text-purple-300 sm:px-2.5 sm:text-[11px]"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ===================== WORKFLOW ===================== */}

      <Section
        id="workflow"
        eyebrow="Workflow"
        title="How WebDrop works, end to end."
        description="From creating a room to downloading the file in ten steps."
        tint
      >
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {WORKFLOW.map((step, i) => (
            <Reveal key={step.title} delay={(i % 5) * 70}>
              <div className={`${SOFT_CARD} ${HOVER} relative h-full p-4 sm:p-5`}>
                <div className="flex items-center justify-between">
                  <IconBox icon={step.icon} />

                  <span className="font-mono text-[10px] font-bold tracking-widest text-purple-200 dark:text-purple-500/40 sm:text-[11px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-4 text-[13px] font-bold text-slate-900 dark:text-white sm:mt-5 sm:text-[14px]">
                  {step.title}
                </h3>

                <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* SIGNALING SEQUENCE */}

        <Reveal className="mx-auto mt-10 max-w-4xl sm:mt-14">
          <div className={`${CARD} p-5 sm:p-8`}>
            <div className="flex min-w-0 items-center gap-3">
              <IconBox icon={RadioTower} />

              <div className="min-w-0">
                <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                  WebRTC signaling sequence
                </h3>

                <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">
                  Socket.IO carries connection information only, never files.
                </p>
              </div>
            </div>

            {/* Desktop / Tablet diagram */}

            <div className="relative mt-6 hidden sm:block">
              <div className="grid grid-cols-3 text-center">
                {[
                  { icon: Laptop, label: 'Browser A' },
                  { icon: Server, label: 'Socket.IO' },
                  { icon: Smartphone, label: 'Browser B' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>

                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-[16.666%] w-px border-l border-dashed border-purple-200 dark:border-purple-500/20" />

                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px border-l border-dashed border-purple-200 dark:border-purple-500/20" />

                <div className="pointer-events-none absolute inset-y-0 left-[83.333%] w-px border-l border-dashed border-purple-200 dark:border-purple-500/20" />

                {SIGNALING.map((row) => (
                  <div
                    key={row.label}
                    className="relative grid grid-cols-6 py-3"
                  >
                    <div className={`${row.start} ${row.span} min-w-0`}>
                      <p className="break-words px-2 pb-1 text-center text-[10px] font-semibold text-slate-600 dark:text-slate-300 md:text-[11px]">
                        {row.label}
                      </p>

                      <div className="flex items-center text-purple-500">
                        {row.dir !== 'right' && (
                          <ChevronLeft className="-mr-1 h-4 w-4 shrink-0" />
                        )}

                        <div className="h-0 flex-1 border-t-2 border-purple-400 dark:border-purple-400/70" />

                        {row.dir !== 'left' && (
                          <ChevronRight className="-ml-1 h-4 w-4 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile diagram */}

            <div className="mt-5 sm:hidden">
              <MobileSignalingSequence />
            </div>

            <div className="mt-5 grid gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-3">
              {[
                'Socket.IO does not transfer files. It only exchanges connection information.',
                'Offer and answer establish session parameters between the browsers.',
                'ICE candidates help both browsers discover possible network paths.',
              ].map((t) => (
                <div key={t} className={`${INNER} p-3`}>
                  <p className="text-[11px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[12px]">
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ===================== TRANSFER ENGINE ===================== */}

      <Section
        id="transfer"
        eyebrow="Transfer Engine"
        title="What happens to a file."
        description="Every transfer is independent, so cancelling one file never breaks the next."
      >
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          <Reveal>
            <div className={`${CARD} p-5 sm:p-8`}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-[10px]">
                DataChannel pipeline
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2">
                {PIPELINE.map(({ icon: Icon, label }, i) => (
                  <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex min-h-9 items-center gap-1.5 rounded-xl border border-purple-100 bg-[#FAF9FF] px-2.5 py-2 dark:border-surface-border dark:bg-white/[0.03] sm:px-3 sm:py-2.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400 sm:h-4 sm:w-4" />

                      <span className="whitespace-nowrap text-[9.5px] font-semibold text-slate-700 dark:text-slate-200 sm:text-[12px]">
                        {label}
                      </span>
                    </div>

                    {i < PIPELINE.length - 1 && (
                      <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600 sm:h-3.5 sm:w-3.5" />
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:mt-5 sm:text-[12px]">
                A metadata message is sent first, binary chunks follow, and a
                Blob is rebuilt on the receiver, with no server involved.
              </p>
            </div>
          </Reveal>

          <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
            {/* protocol */}

            <Reveal>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={ListChecks} />

                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                    Protocol messages
                  </h3>
                </div>

                <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
                  {PROTOCOL.map((p) => (
                    <div key={p.type} className={`${INNER} p-3`}>
                      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                        <code className="max-w-full break-all font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300 sm:text-[12px]">
                          {p.type}
                        </code>

                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          {p.dir}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">
                        {p.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid min-w-0 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3">
                  <pre className="max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3.5 font-mono text-[9px] leading-5 text-slate-300 sm:p-4 sm:text-[11px]">
{`{
  "type": "file-offer",
  "files": [{
    "fileId": "9b1d…",
    "name": "document.pdf",
    "size": 2456789,
    "mimeType": "application/pdf"
  }]
}`}
                  </pre>

                  <pre className="max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3.5 font-mono text-[9px] leading-5 text-slate-300 sm:p-4 sm:text-[11px]">
{`{
  "type": "file-progress",
  "fileId": "9b1d…",
  "received": 1200000
}`}
                  </pre>
                </div>
              </div>
            </Reveal>

            {/* backpressure */}

            <Reveal delay={120}>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={Gauge} />

                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-purple-500 sm:text-[10px]">
                      Engineering detail
                    </p>

                    <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                      Backpressure &amp; reliability
                    </h3>
                  </div>
                </div>

                <div className="mt-5">
                  <CheckList items={BACKPRESSURE} />
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-purple-100 bg-[#FAF9FF] p-3 dark:border-surface-border dark:bg-white/[0.03] sm:mt-6 sm:gap-2 sm:p-4">
                  {['File', 'Chunk', 'Buffer check'].map((t, i) => (
                    <div key={t} className="flex items-center gap-1.5 sm:gap-2">
                      <span className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200 sm:px-3 sm:text-[12px]">
                        {t}
                      </span>

                      <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600 sm:h-3.5 sm:w-3.5" />
                    </div>
                  ))}

                  <span className="rounded-lg border border-purple-300 px-2.5 py-1.5 text-[10px] font-bold text-purple-700 dark:border-purple-400/40 dark:text-purple-300 sm:px-3 sm:text-[12px]">
                    Space available?
                  </span>

                  <span className="rounded-lg bg-red-50 px-2 py-1.5 text-[9px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400 sm:px-2.5 sm:text-[11px]">
                    No → Wait
                  </span>

                  <span className="rounded-lg bg-emerald-50 px-2 py-1.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:px-2.5 sm:text-[11px]">
                    Yes → Send
                  </span>
                </div>

                <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mt-6 sm:text-[10px]">
                  Also handled
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                  {ALSO_HANDLED.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-purple-100 bg-purple-50/60 px-2.5 py-1.5 text-[9.5px] font-semibold text-purple-700 dark:border-purple-500/15 dark:bg-purple-500/10 dark:text-purple-300 sm:px-3 sm:text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ===================== ROOMS & UI ===================== */}

      <Section
        id="rooms"
        eyebrow="Rooms & Interface"
        title="Temporary rooms. Simple screens."
        tint
      >
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
            <Reveal>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={Clock} />

                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                    Room &amp; connection management
                  </h3>
                </div>

                <div className="mt-5">
                  <CheckList items={ROOM_RULES} />
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-[10px]">
                  Room state
                </p>

                <div className="mt-4 flex min-w-0 flex-col gap-4 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-4 text-white shadow-lg shadow-purple-900/20 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-purple-200 sm:text-[10px]">
                      Room
                    </p>

                    <p className="font-mono text-[23px] font-bold tracking-[0.1em] sm:text-[26px]">
                      X7K92
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-purple-200 sm:text-[10px]">
                      Expires in
                    </p>

                    <p className="font-mono text-[18px] font-bold sm:text-[20px]">
                      24:32
                    </p>
                  </div>
                </div>

                <pre className="mt-4 max-w-full overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-[9px] leading-5 text-slate-300 sm:p-5 sm:text-[11.5px] sm:leading-6">
{`Room
 ├─ Room Code
 ├─ Created At
 ├─ Expiry Time
 └─ Connected Users
     ├─ Device A   (host)
     └─ Device B   (guest)`}
                </pre>
              </div>
            </Reveal>
          </div>

          <div>
            <p className="mb-4 mt-7 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mt-8 sm:mb-4 sm:text-[10px]">
              Key screens
            </p>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {SCREENS.map((s, i) => (
                <Reveal key={s.title} delay={(i % 4) * 70}>
                  <div className={`${SOFT_CARD} ${HOVER} h-full p-4 sm:p-5`}>
                    <IconBox icon={s.icon} />

                    <h3 className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white sm:mt-4 sm:text-[14px]">
                      {s.title}
                    </h3>

                    <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">
                      {s.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ===================== TECH STACK ===================== */}

      <Section
        id="stack"
        eyebrow="Technology Stack"
        title="Modern tools, lightweight result."
        description="No database and no file storage: only in-memory room state."
      >
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {TECH.map((g, i) => (
            <Reveal key={g.title} delay={i * 70}>
              <div className={`${SOFT_CARD} h-full p-4 sm:p-5`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={g.icon} />

                  <h3 className="text-[13px] font-bold text-slate-900 dark:text-white sm:text-[14px]">
                    {g.title}
                  </h3>
                </div>

                <div className="mt-4 flex min-w-0 flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                  {g.items.map((item) => (
                    <span
                      key={item}
                      className="max-w-full break-words rounded-lg border border-purple-100 bg-purple-50/60 px-2 py-1.5 text-[9.5px] font-semibold text-purple-700 dark:border-purple-500/15 dark:bg-purple-500/10 dark:text-purple-300 sm:px-2.5 sm:text-[11px]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== TESTING ===================== */}

      <Section
        id="testing"
        eyebrow="Testing"
        title="Functional test results."
        description="Every planned test case passed."
        tint
      >
        <Reveal className="mx-auto max-w-5xl">
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 bg-[#FAF9FF] px-4 py-4 dark:border-surface-border dark:bg-white/[0.02] sm:flex-row sm:items-center sm:px-6">
              <p className="text-[12px] font-bold text-slate-900 dark:text-white sm:text-[13px]">
                Functional testing plan
              </p>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 sm:px-3 sm:text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {TESTS.length} / {TESTS.length} passed
              </span>
            </div>

            <div className="grid sm:grid-cols-2">
              {TESTS.map(([name, expected], i) => (
                <div
                  key={name}
                  className={`flex min-w-0 items-start gap-2.5 border-slate-100 px-4 py-3.5 dark:border-white/[0.06] sm:px-6 ${
                    i < TESTS.length - (TESTS.length % 2 === 0 ? 2 : 1)
                      ? 'border-b'
                      : ''
                  } ${i % 2 === 0 ? 'sm:border-r' : ''}`}
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                    strokeWidth={2.4}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[12px] font-semibold text-slate-800 dark:text-slate-100 sm:text-[13px]">
                      {name}
                    </p>

                    <p className="break-words text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">
                      {expected}
                    </p>
                  </div>

                  <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 sm:block sm:text-[10px]">
                    Passed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mx-auto mt-6 grid max-w-5xl gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2">
          <Reveal>
            <div className={`${CARD} h-full p-5 sm:p-8`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </div>

                <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                  Security &amp; privacy
                </h3>
              </div>

              <div className="mt-5">
                <CheckList items={SECURITY} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className={`${CARD} h-full p-5 sm:p-8`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Info className="h-[18px] w-[18px]" />
                </div>

                <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">
                  Limitations
                </h3>
              </div>

              <div className="mt-5">
                <CheckList items={LIMITATIONS} tone="amber" />
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ===================== TIMELINE ===================== */}

      <Section
        id="timeline"
        eyebrow="Project Timeline"
        title="How WebDrop was built."
        description="From the first idea to the v1.0.0 release, phase by phase."
      >
        <Timeline items={TIMELINE} />
      </Section>

      {/* ===================== ROADMAP ===================== */}

      <Section
        id="roadmap"
        eyebrow="Roadmap"
        title="Where WebDrop goes next."
        description="What has shipped, what is coming up, and what we would like to build."
        tint
      >
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5 lg:grid-cols-3">
          {ROADMAP.map((lane, i) => (
            <Reveal key={lane.key} delay={i * 100}>
              <div
                className={`h-full min-w-0 rounded-[24px] border p-5 sm:rounded-[28px] sm:p-7 ${
                  lane.status === 'current'
                    ? 'border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-lg shadow-purple-900/5 dark:border-purple-400/30 dark:from-surface-card dark:to-purple-500/[0.07]'
                    : 'border-slate-200 bg-white dark:border-surface-border dark:bg-surface-card'
                }`}
              >
                <div className="flex min-w-0 items-start justify-between gap-2.5 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                      {lane.version}
                    </p>

                    <h3 className="mt-1 break-words font-heading text-[18px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[20px]">
                      {lane.title}
                    </h3>
                  </div>

                  <StatusChip status={lane.status} />
                </div>

                <ul className="mt-5 space-y-2 sm:mt-6 sm:space-y-2.5">
                  {lane.items.map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="flex min-w-0 items-start gap-2.5 rounded-xl border border-slate-100 bg-white/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03] sm:gap-3"
                    >
                      <Icon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          lane.status === 'done'
                            ? 'text-emerald-500'
                            : 'text-purple-600 dark:text-purple-400'
                        }`}
                        strokeWidth={2.1}
                      />

                      <span className="min-w-0 break-words text-[11.5px] font-medium leading-5 text-slate-700 dark:text-slate-200 sm:text-[13px]">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ===================== CONCLUSION / CTA ===================== */}

      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-3 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[24px] border border-purple-500/20 bg-slate-950 px-5 py-10 text-center shadow-xl shadow-purple-900/20 sm:rounded-[28px] sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute left-1/2 top-[-160px] h-[280px] w-[440px] -translate-x-1/2 rounded-full bg-purple-500/25 blur-3xl sm:h-[320px] sm:w-[560px]" />

            <div className="pointer-events-none absolute -bottom-32 right-[-80px] h-[220px] w-[220px] rounded-full bg-indigo-500/20 blur-3xl sm:h-[260px] sm:w-[260px]" />

            <div className="relative min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-purple-300 sm:text-[10px]">
                Conclusion
              </p>

              <h2 className="mt-3 break-words font-heading text-[22px] font-extrabold leading-tight tracking-tight text-white sm:text-[30px] md:text-[34px]">
                Socket.IO coordinates the connection.
                <span className="block bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  WebRTC DataChannel transfers the file.
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-[12.5px] leading-6 text-slate-400 sm:text-[14px] sm:leading-7">
                WebDrop shows how modern browser technologies can be combined
                into a direct peer-to-peer file transfer system with no
                accounts, no uploads and no storage.
              </p>

              <p className="mt-4 font-heading text-[15px] font-bold italic text-purple-300 sm:mt-5 sm:text-[16px]">
                “Drop. Connect. Transfer.”
              </p>

              <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center">
                <Link
                  to="/create"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-[12px] font-bold text-white transition-colors hover:bg-purple-700 sm:w-auto sm:text-[13px]"
                >
                  <Radio className="h-4 w-4" />
                  Try WebDrop
                </Link>

                <a
                  href="https://github.com/Suraj1819/web-drop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-[12px] font-bold text-slate-900 transition-colors hover:bg-slate-100 sm:w-auto sm:text-[13px]"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>

                <Link
                  to="/team"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-[12px] font-bold text-white transition-colors hover:bg-white/10 sm:w-auto sm:text-[13px]"
                >
                  <Globe2 className="h-4 w-4" />
                  Meet the team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}