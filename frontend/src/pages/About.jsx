// src/pages/About.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  Boxes,
  Cable,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudOff,
  Code2,
  Cpu,
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
  LifeBuoy,
  Link2,
  ListChecks,
  LockKeyhole,
  LogIn,
  Mail,
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
  Scale,
  Send,
  Server,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Terminal,
  TrendingUp,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

/* =========================================================
   DATA
========================================================= */

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'stack', label: 'Stack' },
  { id: 'compat', label: 'Compatibility' },
  { id: 'setup', label: 'Setup' },
  { id: 'deploy', label: 'Deployment' },
  { id: 'testing', label: 'Testing' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'faq', label: 'FAQ' },
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
  'join-room', 'leave-room', 'user-joined', 'user-left',
  'webrtc-offer', 'webrtc-answer', 'webrtc-ice-candidate',
  'set-room-lock', 'kick-peer', 'end-room',
  'room-ended', 'room-expired',
];

const PROJECT_TREE = `webdrop/
├─ client/                    React + Vite
│  └─ src/
│     ├─ pages/               Home · Create · Join · Room · Team · About
│     ├─ hooks/               useWebRTC · useFileTransfer · useNetworkInfo
│     ├─ context/             RoomContext
│     ├─ components/common/   PeerRadar · Toasts · FeatureCards
│     └─ utils/               constants · fileUtils · generateRoomCode
│
└─ server/                    Node.js + Express + Socket.IO
   ├─ signaling               offer · answer · ICE relay
   └─ room manager            in-memory rooms · 2 devices · 30-min expiry`;

const SERVER_TREE = `server/
├─ index.js                   Express bootstrap + Socket.IO
├─ config/
│  └─ env.js                  PORT · CORS · TURN credentials
├─ socket/
│  ├─ connection.js           Client connect / disconnect
│  ├─ roomHandlers.js         create · join · leave room
│  ├─ signaling.js            webrtc-offer · answer · ice-candidate
│  └─ hostControls.js         set-room-lock · kick-peer · end-room
├─ managers/
│  ├─ roomManager.js          In-memory Map<code, Room>
│  ├─ cleanup.js              Interval sweep of expired rooms
│  └─ codeGen.js              5-char code with collision guard
└─ utils/
   └─ logger.js               Structured console output`;

const WORKFLOW = [
  { icon: Plus, title: 'Create Room', text: 'User A creates a temporary room' },
  { icon: Share2, title: 'Share Room', text: 'Room code, QR code and link are generated' },
  { icon: LogIn, title: 'Join Room', text: 'User B joins via code or QR' },
  { icon: RadioTower, title: 'Signaling', text: 'Socket.IO exchanges offer / answer / ICE' },
  { icon: Link2, title: 'Peer Connection', text: 'WebRTC connects the two browsers' },
  { icon: FolderOpen, title: 'File Selection', text: 'User selects or drops files or folders' },
  { icon: Layers3, title: 'Chunking', text: 'Files are split into small chunks' },
  { icon: Send, title: 'Transfer', text: 'Chunks are sent over RTCDataChannel' },
  { icon: Boxes, title: 'Reconstruction', text: 'Receiver rebuilds the file' },
  { icon: Download, title: 'Download', text: 'The reconstructed file is saved locally' },
];

const SIGNALING = [
  { start: 'col-start-2', span: 'col-span-2', dir: 'right', label: 'createOffer() → webrtc-offer' },
  { start: 'col-start-4', span: 'col-span-2', dir: 'right', label: 'offer forwarded' },
  { start: 'col-start-4', span: 'col-span-2', dir: 'left', label: 'createAnswer() → webrtc-answer' },
  { start: 'col-start-2', span: 'col-span-2', dir: 'left', label: 'answer forwarded' },
  { start: 'col-start-2', span: 'col-span-4', dir: 'both', label: 'ICE candidates  (webrtc-ice-candidate)' },
  { start: 'col-start-2', span: 'col-span-4', dir: 'both', label: 'DataChannel open: signaling is no longer needed' },
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
  { type: 'file-offer', dir: 'Sender → Receiver', text: 'File details (name, size, type) under a unique transfer ID.' },
  { type: 'file-accept / file-reject', dir: 'Receiver → Sender', text: 'The receiver decides. Nothing moves until accepted.' },
  { type: 'file-start', dir: 'Sender → Receiver', text: 'Marks the beginning of the binary stream.' },
  { type: 'binary chunks', dir: 'Sender → Receiver', text: '64 KB ArrayBuffers carrying the file bytes.' },
  { type: 'file-progress', dir: 'Receiver → Sender', text: 'Bytes received so far, used for live speed and ETA.' },
  { type: 'file-complete', dir: 'Sender → Receiver', text: 'All chunks sent. The receiver assembles the Blob.' },
  { type: 'file-cancel', dir: 'Either direction', text: 'Stops only that transfer. The connection stays open.' },
];

const BACKPRESSURE = [
  'Large files can’t be sent as one huge message, so they are read in 4 MB blocks and sent as 64 KB chunks',
  'dataChannel.bufferedAmount is monitored during the transfer',
  'Sending pauses only when the browser’s send buffer is genuinely full',
  'It resumes instantly on the bufferedamountlow event, with no fixed delay',
  'This keeps browser memory usage under control on very large files',
];

const ALSO_HANDLED = [
  'Chunk sequencing', 'Completion detection', 'Error handling',
  'Per-file cancellation', 'Accept / reject', 'Auto re-queue on reconnect',
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
  { icon: Monitor, title: 'Home', text: 'Create room · Join with a code' },
  { icon: Plus, title: 'Create Room', text: 'Room code · QR code' },
  { icon: LogIn, title: 'Join Room', text: 'Code input · Scan QR' },
  { icon: QrCode, title: 'QR Code', text: 'Scannable QR · Share link' },
  { icon: Route, title: 'Transfer Page', text: 'Peer radar · Drag & drop' },
  { icon: Gauge, title: 'Transfer Progress', text: 'Progress bar · Speed · ETA' },
  { icon: FileCheck2, title: 'Received File', text: 'Download button · Status' },
];

const TECH = [
  { icon: Monitor, title: 'Frontend', items: ['React', 'Vite', 'JavaScript', 'Tailwind CSS', 'React Router', 'Socket.IO Client', 'WebRTC APIs', 'QR Code', 'Lucide React'] },
  { icon: Server, title: 'Backend', items: ['Node.js', 'Express.js', 'Socket.IO', 'CORS', 'dotenv'] },
  { icon: Network, title: 'Networking', items: ['WebRTC', 'RTCDataChannel', 'STUN', 'TURN fallback', 'DTLS'] },
  { icon: Database, title: 'Storage', items: ['No database', 'No file storage', 'In-memory room state'] },
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
  { icon: Target, status: 'done', title: 'Problem study & planning', text: 'Studied the limits of cloud-based sharing, defined the objectives and chose WebRTC with Socket.IO signaling.' },
  { icon: Server, status: 'done', title: 'Rooms & signaling server', text: 'Built the Node.js + Express backend with in-memory rooms, 5-character codes, 2-device limit and expiry.' },
  { icon: Cable, status: 'done', title: 'WebRTC connection', text: 'Offer / answer / ICE exchange over Socket.IO, DataChannel setup and connection-state handling.' },
  { icon: Send, status: 'done', title: 'File transfer engine', text: 'Chunked streaming over the DataChannel, receiver reassembly, progress, multiple files and downloads.' },
  { icon: Sparkles, status: 'done', title: 'UI / UX & QR joining', text: 'Responsive purple interface, peer radar, QR join, invite links, drag & drop and live status.' },
  { icon: ShieldCheck, status: 'done', title: 'Reliability hardening', text: 'Backpressure, accept / reject / cancel per transfer, folder transfer, host controls, reconnect re-queue and TURN fallback.' },
  { icon: Rocket, status: 'done', title: 'v1.0.0 release', text: 'Web app plus Android (.apk) and Windows (.exe) builds, with downloads on the home page.' },
  { icon: Flag, status: 'current', title: 'Testing, polish & documentation', text: 'Functional testing across devices and networks, performance tuning and project documentation.' },
  { icon: GitBranch, status: 'next', title: 'Next milestones', text: 'Self-hosted TURN, resumable transfers and stronger room security.' },
];

const ROADMAP = [
  {
    key: 'shipped', title: 'Shipped', version: 'v1.0.0', status: 'done',
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
    key: 'next', title: 'Up next', version: 'v1.1 · Proposed', status: 'current',
    items: [
      { icon: Server, text: 'Self-hosted TURN with short-lived credentials' },
      { icon: RefreshCw, text: 'Resume interrupted transfers' },
      { icon: HardDrive, text: 'Stream received files straight to disk' },
      { icon: KeyRound, text: 'Password-protected rooms' },
    ],
  },
  {
    key: 'later', title: 'Future scope', version: 'v2.0 · Proposed', status: 'next',
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
  done: { label: 'Done', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', dot: 'bg-emerald-500' },
  current: { label: 'In progress', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300', dot: 'bg-violet-500' },
  next: { label: 'Planned', chip: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300', dot: 'bg-slate-400' },
};

const BROWSERS = [
  { name: 'Chrome', version: '90+', status: 'full', note: 'Full WebRTC support' },
  { name: 'Edge', version: '90+', status: 'full', note: 'Chromium-based, full support' },
  { name: 'Firefox', version: '88+', status: 'full', note: 'Full WebRTC support' },
  { name: 'Safari', version: '15+', status: 'partial', note: 'Works, some DataChannel quirks' },
  { name: 'Opera', version: '76+', status: 'full', note: 'Chromium-based, full support' },
  { name: 'Brave', version: '1.20+', status: 'full', note: 'Chromium-based, full support' },
];

const USE_CASES = [
  { icon: Laptop, title: 'Phone to laptop', text: 'Move photos, videos and screenshots to your computer without cables.' },
  { icon: Users, title: 'Team handoff', text: 'Share large design files, builds or recordings with a colleague.' },
  { icon: FileText, title: 'Projects & assignments', text: 'Send folders of code, reports and datasets to classmates.' },
  { icon: FolderUp, title: 'Folder sync', text: 'Transfer entire directory trees in one go, preserving structure.' },
  { icon: QrCode, title: 'Device to device', text: 'Send from one phone to another without an internet account.' },
  { icon: Globe2, title: 'Across networks', text: 'Works over the internet, not just on the same Wi-Fi.' },
];

const COMPARISON = [
  { topic: 'Where files go', cloud: 'Uploaded to a company server', webdrop: 'Straight to the other device' },
  { topic: 'Waiting time', cloud: 'Upload, then download', webdrop: 'One direct transfer' },
  { topic: 'Account needed', cloud: 'Usually yes', webdrop: 'Never' },
  { topic: 'File size', cloud: 'Often capped by plan', webdrop: 'No limit set by us' },
  { topic: 'Copy left behind', cloud: 'Stays on the server', webdrop: 'None, rooms expire' },
  { topic: 'Cost', cloud: 'Free tier + paid plans', webdrop: 'Completely free' },
];

const METRICS = [
  { label: 'Transfer speed', value: 'Network-bound', note: 'Limited only by the slower peer' },
  { label: 'Connection setup', value: '< 3s', note: 'Signaling round-trip' },
  { label: 'Memory usage', value: '< 50 MB', note: 'Per 1 GB file streamed' },
  { label: 'Concurrent files', value: 'Unlimited', note: 'Sequential queue' },
  { label: 'Chunk overhead', value: '~1%', note: 'Protocol metadata' },
  { label: 'Latency impact', value: 'None', note: 'No server in the path' },
];

const GLOSSARY = [
  { term: 'WebRTC', def: 'Web Real-Time Communication. Browser APIs for peer-to-peer audio, video and data.' },
  { term: 'RTCDataChannel', def: 'Bidirectional data channel over WebRTC. Carries the actual file bytes.' },
  { term: 'Socket.IO', def: 'Real-time bidirectional event library. Used only for signaling.' },
  { term: 'Signaling', def: 'The process of two peers exchanging connection information before a direct link.' },
  { term: 'STUN', def: 'Session Traversal Utilities for NAT. Helps peers discover their public addresses.' },
  { term: 'TURN', def: 'Traversal Using Relays around NAT. Relay fallback when a direct path is impossible.' },
  { term: 'ICE', def: 'Interactive Connectivity Establishment. The framework that tries multiple paths.' },
  { term: 'DTLS', def: 'Datagram Transport Layer Security. Encrypts the WebRTC transport.' },
  { term: 'Backpressure', def: 'Pausing sends when the buffer is full, so memory stays under control.' },
  { term: 'Blob', def: 'A binary large object in the browser. The reassembled file before download.' },
];

const FAQ_ITEMS = [
  { q: 'Is WebDrop really free?', a: 'Yes. No account, no subscription, no hidden limits. The entire project is open source.' },
  { q: 'Do I need to install anything?', a: 'No. WebDrop runs in any modern browser. The Windows and Android apps are optional.' },
  { q: 'Are my files stored on a server?', a: 'Never. Files travel directly between the two devices. The server only helps them find each other.' },
  { q: 'Does it work across different networks?', a: 'Yes. WebRTC tries a direct path first and falls back to a TURN relay when a direct connection is impossible.' },
  { q: 'Can I use it offline?', a: 'Not fully. Both devices still need to reach the signaling server once to establish a connection. After that, transfers are direct.' },
  { q: 'Why is there a 30-minute limit?', a: 'Rooms are meant to be short-lived. After 30 minutes they self-destruct, so nothing lingers.' },
  { q: 'Is there a file size limit?', a: 'No limit set by WebDrop. In practice, the limit is your connection speed and free disk space on the receiver.' },
  { q: 'What happens if the connection drops?', a: 'Active transfers pause and resume automatically when the peer reconnects.' },
];

const PERF_ROWS = [
  ['100 MB file', 'Same Wi-Fi', '~4 s', '~25 MB/s'],
  ['100 MB file', 'Different networks', '~10 s', '~10 MB/s (relay)'],
  ['1 GB file', 'Same Wi-Fi', '~45 s', '~22 MB/s'],
  ['1 GB file', 'Different networks', '~2 min', '~8 MB/s (relay)'],
  ['10 GB file', 'Same Wi-Fi', '~8 min', '~20 MB/s'],
  ['10 GB file', 'Different networks', '~25 min', '~7 MB/s (relay)'],
];

/* ===== NEW DATA ===== */

const SETUP_STEPS = [
  {
    number: '01',
    icon: Terminal,
    title: 'Clone the repository',
    cmd: 'git clone https://github.com/Suraj1819/web-drop.git\ncd web-drop',
  },
  {
    number: '02',
    icon: Package,
    title: 'Install client dependencies',
    cmd: 'cd client\nnpm install',
  },
  {
    number: '03',
    icon: Package,
    title: 'Install server dependencies',
    cmd: 'cd ../server\nnpm install',
  },
  {
    number: '04',
    icon: KeyRound,
    title: 'Configure environment',
    cmd: '# server/.env\nPORT=5000\nCLIENT_ORIGIN=http://localhost:5173\nTURN_URL=\nTURN_USER=\nTURN_PASS=',
  },
  {
    number: '05',
    icon: Rocket,
    title: 'Start both servers',
    cmd: '# Terminal 1 — server\nnpm run dev\n\n# Terminal 2 — client\ncd ../client && npm run dev',
  },
];

const DEPLOY_STEPS = [
  {
    icon: Monitor,
    title: 'Frontend → Vercel',
    items: [
      'Import the client folder as a new project',
      'Build command: npm run build',
      'Output directory: dist',
      'Set VITE_SOCKET_URL to your server URL',
    ],
  },
  {
    icon: Server,
    title: 'Backend → Render',
    items: [
      'Create a new Web Service from the server folder',
      'Runtime: Node',
      'Build command: npm install',
      'Start command: node index.js',
      'Add CLIENT_ORIGIN to env variables',
    ],
  },
  {
    icon: Network,
    title: 'TURN (optional)',
    items: [
      'Deploy coturn or use a managed TURN provider',
      'Add TURN_URL, TURN_USER, TURN_PASS to the server env',
      'Enables connections across restrictive NATs',
    ],
  },
];

const PRIVACY_SUMMARY = [
  { icon: FileText, title: 'What we collect', text: 'Nothing. No account, no email, no analytics. Room codes and device names live only in memory and disappear when the room closes.' },
  { icon: Eye, title: 'What we never see', text: 'Your file contents. Files are transferred directly between browsers over an encrypted WebRTC DataChannel.' },
  { icon: Server, title: 'What the server sees', text: 'Only connection information: room codes, offer / answer, ICE candidates. Never file data.' },
  { icon: Clock, title: 'How long it lasts', text: 'Room state lives in memory and is swept on expiry (30 minutes). Nothing is persisted to disk.' },
  { icon: ShieldCheck, title: 'Encryption', text: 'The DataChannel uses DTLS. Even a TURN relay only forwards encrypted packets it cannot read.' },
  { icon: Users, title: 'Third parties', text: 'None. WebDrop does not embed trackers, ads or third-party analytics.' },
];

const CREDITS = [
  { icon: Code2, title: 'Built with', text: 'React, Vite, Tailwind CSS, Node.js, Express, Socket.IO and the native WebRTC APIs.' },
  { icon: Award, title: 'Academic context', text: 'A B.Tech Mini-Project in the Computer Science & Engineering department, 2026–27.' },
  { icon: Github, title: 'Open source', text: 'Released under the MIT License. Source code, issues and pull requests live on GitHub.' },
  { icon: Users, title: 'Team', text: 'Three students: Suraj Kumar, Shubham Kumar and Shivam Kumar Singh. See the Team page for details.' },
  { icon: LifeBuoy, title: 'Support', text: 'Found a bug or want a feature? Open an issue on GitHub — it is the fastest way to reach us.' },
  { icon: Mail, title: 'Contact', text: 'For academic or press enquiries, reach out via the contact links on the Team page.' },
];

/* =========================================================
   SHARED UI
========================================================= */

const CARD =
  'min-w-0 rounded-[24px] border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02] sm:rounded-[28px]';

const SOFT_CARD =
  'min-w-0 rounded-2xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]';

const INNER =
  'min-w-0 rounded-xl border border-violet-100 bg-[#FAF9FF] dark:border-white/[0.06] dark:bg-white/[0.02]';

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
      { threshold: 0.08 },
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
      className="fixed bottom-5 right-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.1] dark:bg-[#15171d]/95 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-300"
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
    </button>
  );
}

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="mx-auto min-w-0 max-w-2xl text-center">
      {eyebrow && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1 dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
          {Icon && <Icon className="h-3 w-3 text-violet-600 dark:text-violet-400" strokeWidth={2.4} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
            {eyebrow}
          </span>
        </div>
      )}

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

function Section({ id, eyebrow, title, description, icon, tint = false, children }) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 overflow-hidden border-b border-slate-200 dark:border-white/[0.06] ${
        tint ? 'bg-white/60 dark:bg-white/[0.015]' : ''
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-3 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-10">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} icon={icon} />
        <div className="mt-8 min-w-0 sm:mt-10 md:mt-12">{children}</div>
      </div>
    </section>
  );
}

function IconBox({ icon: Icon, className = '' }) {
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 sm:h-10 sm:w-10 ${className}`}>
      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
    </div>
  );
}

function CheckList({ items, tone = 'emerald' }) {
  const color = tone === 'red' ? 'text-red-500' : tone === 'amber' ? 'text-amber-500' : 'text-emerald-500';
  const Icon = tone === 'amber' ? Info : CheckCircle2;

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex min-w-0 items-start gap-2.5">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} strokeWidth={2.2} />
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
    <span className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${s.chip}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot} ${status === 'current' ? 'animate-pulse' : ''}`} />
      <span className="truncate">{s.label}</span>
    </span>
  );
}

function NodeCard({ icon: Icon, title, sub, accent = false }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 sm:p-4 ${
      accent
        ? 'border-violet-300 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/20'
        : 'border-slate-200 bg-[#FAF9FF] dark:border-white/[0.06] dark:bg-white/[0.02]'
    }`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
        accent ? 'bg-white/15' : 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400'
      }`}>
        <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className={`truncate text-[13px] font-bold sm:text-[14px] ${accent ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          {title}
        </p>
        {sub && (
          <p className={`mt-0.5 break-words text-[11px] sm:text-[12px] ${accent ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Timeline({ items }) {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-violet-400 via-violet-200 to-transparent dark:from-violet-500/60 dark:via-violet-500/20 md:left-1/2 md:-translate-x-1/2" />

      {items.map((item, i) => {
        const Icon = item.icon;
        const left = i % 2 === 0;
        const s = STATUS[item.status];

        return (
          <Reveal key={item.title} delay={60} className="relative mb-5 md:grid md:grid-cols-2 md:gap-10 lg:gap-14">
            <div className={`absolute left-4 top-6 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#FBFAFF] dark:border-surface md:left-1/2 ${s.dot} ${
              item.status === 'current' ? 'ring-4 ring-violet-300/50 dark:ring-violet-500/30' : ''
            }`} />

            <div className={`ml-9 min-w-0 ${SOFT_CARD} p-4 sm:ml-10 sm:p-5 md:ml-0 ${
              left ? 'md:col-start-1' : 'md:col-start-2'
            }`}>
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

function MobileSignalingSequence() {
  const steps = [
    { number: '01', title: 'Browser A creates offer', text: 'createOffer() generates the WebRTC offer.', icon: Laptop },
    { number: '02', title: 'Offer reaches Browser B', text: 'Socket.IO forwards the offer to the other browser.', icon: RadioTower },
    { number: '03', title: 'Browser B creates answer', text: 'createAnswer() generates the response.', icon: Smartphone },
    { number: '04', title: 'Answer returns to Browser A', text: 'Socket.IO forwards the answer back.', icon: RadioTower },
    { number: '05', title: 'ICE candidates exchanged', text: 'Both browsers discover possible network paths.', icon: Network },
    { number: '06', title: 'DataChannel opens', text: 'Signaling is no longer needed for file transfer.', icon: Cable },
  ];

  return (
    <div className="space-y-2.5 sm:hidden">
      {steps.map(({ number, title, text, icon: Icon }) => (
        <div key={number} className="flex min-w-0 items-start gap-3 rounded-xl border border-violet-100 bg-[#FAF9FF] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold text-violet-400">{number}</span>
              <p className="min-w-0 break-words text-[12px] font-bold text-slate-800 dark:text-slate-100">{title}</p>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{text}</p>
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
  /* Scroll top on mount */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#FBFAFF] text-slate-900 transition-colors dark:bg-surface dark:text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[280px] w-[280px] rounded-full bg-violet-200/50 blur-3xl sm:h-[420px] sm:w-[420px] dark:bg-violet-500/10" />
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
            className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 transition-colors duration-200 hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white sm:px-3.5 sm:text-[12px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to WebDrop
          </Link>

          <div className="mx-auto mt-10 min-w-0 max-w-3xl text-center sm:mt-14 md:mt-16">
            <div className="mx-auto mb-5 flex max-w-2xl flex-wrap items-center justify-center gap-1.5 sm:mb-6 sm:gap-2">
              {['B.Tech Mini-Project', 'Computer Science & Engineering', '2026–27', 'v1.0.0'].map((b) => (
                <span
                  key={b}
                  className="max-w-full rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 sm:px-3 sm:text-[10px] sm:tracking-[0.14em]"
                >
                  {b}
                </span>
              ))}
            </div>

            <h1 className="break-words font-heading text-[36px] font-extrabold leading-[0.98] tracking-[-0.045em] text-slate-900 dark:text-white sm:text-[48px] md:text-[56px] lg:text-[68px]">
              Everything about
              <span className="block bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                WebDrop.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-[13px] leading-6 text-slate-500 dark:text-slate-400 sm:mt-6 sm:text-[15px] sm:leading-7 md:text-[16px]">
              A browser-based peer-to-peer file transfer system built on WebRTC.
              Idea, architecture, transfer engine, testing, deployment, privacy
              and the roadmap ahead.
            </p>

            <p className="mt-3 font-heading text-[16px] font-bold italic text-violet-600 dark:text-violet-400 sm:mt-4 sm:text-[18px]">
              "Drop. Connect. Transfer."
            </p>

            <div className="mx-auto mt-7 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center">
              <Link
                to="/create"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-violet-700 sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px]"
              >
                <Radio className="h-4 w-4" />
                Create secure room
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>

              <Link
                to="/team"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-700 transition-colors duration-200 hover:border-violet-200 hover:bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06] sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px]"
              >
                <Users className="h-4 w-4" />
                Meet the team
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-white/[0.06] dark:bg-white/[0.06] sm:mt-14 sm:grid-cols-3 lg:grid-cols-6">
            {STATS.map((s) => (
              <div key={s.label} className="flex min-w-0 min-h-[82px] flex-col items-center justify-center bg-white px-2.5 py-4 text-center dark:bg-surface-card sm:min-h-[90px] sm:px-4 sm:py-5">
                <p className="font-heading text-[18px] font-extrabold tracking-tight text-violet-600 dark:text-violet-400 sm:text-[22px]">{s.value}</p>
                <p className="mt-1 max-w-[110px] text-[8px] font-bold uppercase leading-3 tracking-[0.08em] text-slate-400 sm:text-[10px] sm:tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <nav aria-label="On this page" className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-1.5 sm:mt-8 sm:gap-2">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 transition-colors duration-200 hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white sm:px-3.5 sm:text-[12px]"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* OVERVIEW */}
      <Section
        id="overview"
        icon={Wifi}
        eyebrow="Introduction"
        title="What is WebDrop?"
        description="WebDrop lets two devices transfer files directly through their browsers. Nothing is uploaded and nothing is stored."
      >
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5 lg:grid-cols-2">
          <Reveal>
            <div className={`${CARD} h-full p-5 sm:p-8`}>
              <IconBox icon={Wifi} className="h-10 w-10 sm:h-11 sm:w-11" />
              <h3 className="mt-5 font-heading text-[19px] font-bold tracking-tight sm:mt-6 sm:text-[20px]">In a nutshell</h3>
              <div className="mt-4 sm:mt-5">
                <CheckList items={OVERVIEW_POINTS} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className={`${CARD} relative h-full overflow-hidden p-5 sm:p-8`}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />
              <div className="relative flex h-full min-w-0 flex-col justify-center gap-4 sm:gap-5">
                <div className="grid min-w-0 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                  <NodeCard icon={Laptop} title="Device A" sub="Creates the room" />
                  <div className="flex items-center justify-center gap-1.5 text-violet-400 sm:gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 sm:px-3 sm:text-[10px]">Direct</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <NodeCard icon={Smartphone} title="Device B" sub="Joins with code / QR" />
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="h-px flex-1 border-t border-dashed border-violet-300 dark:border-violet-500/30" />
                  <NodeCard icon={Wifi} title="WebDrop Room" sub="signaling only" accent />
                  <div className="h-px flex-1 border-t border-dashed border-violet-300 dark:border-violet-500/30" />
                </div>

                <p className="text-center text-[11px] font-semibold leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">
                  Not cloud storage. Files never rest on a server.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* PROBLEM */}
      <Section
        id="problem"
        icon={Target}
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
                  <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 sm:text-[10px]">Conventional</p>
                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">The cloud detour</h3>
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
                    <span className="text-[12.5px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[13px] sm:leading-6">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="h-full min-w-0 rounded-[24px] border border-violet-300 bg-gradient-to-br from-white to-violet-50 p-5 shadow-lg shadow-violet-900/5 dark:border-violet-400/30 dark:from-surface-card dark:to-violet-500/[0.07] sm:rounded-[28px] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 sm:text-[10px]">WebDrop</p>
                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Direct peer-to-peer</h3>
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

        <Reveal className="mx-auto mt-8 max-w-4xl sm:mt-10">
          <div className={`${CARD} overflow-hidden`}>
            <table className="w-full border-collapse text-left text-[12px] sm:text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-[#FAF9FF] dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-5">Topic</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-5">Typical cloud sharing</th>
                  <th className="bg-violet-50/70 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 sm:px-5">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                      WebDrop
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.topic} className={i !== COMPARISON.length - 1 ? 'border-b border-slate-100 dark:border-white/[0.06]' : ''}>
                    <th className="px-4 py-3 text-left text-[11.5px] font-semibold text-slate-800 dark:text-slate-200 sm:px-5 sm:text-[12.5px]">{row.topic}</th>
                    <td className="px-4 py-3 text-[11.5px] text-slate-500 dark:text-slate-400 sm:px-5 sm:text-[12.5px]">
                      <span className="inline-flex items-start gap-2">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
                        {row.cloud}
                      </span>
                    </td>
                    <td className="bg-violet-50/40 px-4 py-3 text-[11.5px] font-medium text-slate-700 dark:bg-violet-500/[0.05] dark:text-slate-200 sm:px-5 sm:text-[12.5px]">
                      <span className="inline-flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.8} />
                        {row.webdrop}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal className="mx-auto mt-6 max-w-4xl sm:mt-8">
          <div className={`${CARD} relative overflow-hidden p-5 text-center sm:p-8`}>
            <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[240px] w-[420px] -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />
            <p className="relative text-[9px] font-bold uppercase tracking-[0.2em] text-violet-500 sm:text-[10px]">Core problem</p>
            <p className="relative mt-3 break-words font-heading text-[16px] font-bold leading-snug text-slate-900 dark:text-white sm:text-[22px]">
              "How can users transfer files directly between browsers without storing the files on a central server?"
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-1.5 sm:mt-8 sm:gap-2">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 sm:gap-2">
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 sm:px-3.5 sm:text-[12px]">{step}</span>
              {i < FLOW.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600 sm:h-3.5 sm:w-3.5" />}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-6xl sm:mt-14">
          <p className="mb-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mb-5 sm:text-[10px]">Project objectives</p>
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {OBJECTIVES.map(({ icon, text }, i) => (
              <Reveal key={text} delay={(i % 3) * 80}>
                <div className={`${SOFT_CARD} flex min-w-0 items-center gap-3 p-3.5 sm:p-4`}>
                  <IconBox icon={icon} />
                  <p className="min-w-0 break-words text-[12px] font-semibold leading-5 text-slate-700 dark:text-slate-200 sm:text-[13px]">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ARCHITECTURE */}
      <Section
        id="architecture"
        icon={Layers3}
        eyebrow="System Architecture"
        title="Signaling here. Files there."
        description="The backend only helps two browsers find each other. The actual file bytes flow directly between them."
      >
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          <Reveal>
            <div className={`${CARD} p-5 sm:p-8`}>
              <div className="grid min-w-0 items-center gap-3 sm:gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <NodeCard icon={Monitor} title="Frontend" sub="React + Vite" />
                <div className="flex min-w-0 flex-col items-center gap-1 px-2 text-center sm:px-4">
                  <RadioTower className="h-5 w-5 text-violet-500" />
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 sm:text-[12px]">Socket.IO</p>
                  <p className="max-w-xs text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">Signaling only: room info, offer / answer, ICE</p>
                </div>
                <NodeCard icon={Server} title="Backend" sub="Node.js + Express" />
              </div>

              <div className="my-5 flex items-center gap-2 sm:my-6 sm:gap-3">
                <div className="h-px flex-1 border-t border-dashed border-slate-200 dark:border-white/10" />
                <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.15em] text-slate-400 sm:text-[10px] sm:tracking-[0.18em]">Browser to browser</span>
                <div className="h-px flex-1 border-t border-dashed border-slate-200 dark:border-white/10" />
              </div>

              <div className="grid min-w-0 items-center gap-3 sm:gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <NodeCard icon={Laptop} title="Browser A" sub="Sender or receiver" />
                <div className="flex min-w-0 flex-col items-center gap-2">
                  <div className="h-1.5 w-full min-w-[120px] max-w-[260px] rounded-full bg-gradient-to-r from-violet-500 via-violet-500 to-indigo-500 sm:h-2" />
                  <p className="text-center text-[11px] font-bold text-violet-600 dark:text-violet-400 sm:text-[12px]">WebRTC DataChannel</p>
                  <p className="max-w-[260px] text-center text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">Actual file data, never through the backend</p>
                </div>
                <NodeCard icon={Smartphone} title="Browser B" sub="Sender or receiver" />
              </div>
            </div>
          </Reveal>

          <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
            <Reveal>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={Code2} />
                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Client structure</h3>
                </div>
                <pre className="mt-4 max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-[9px] leading-5 text-slate-300 dark:border-white/10 sm:mt-5 sm:p-5 sm:text-[11.5px] sm:leading-6">
                  {PROJECT_TREE}
                </pre>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={Server} />
                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Server structure</h3>
                </div>
                <pre className="mt-4 max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-[9px] leading-5 text-slate-300 dark:border-white/10 sm:mt-5 sm:p-5 sm:text-[11.5px] sm:leading-6">
                  {SERVER_TREE}
                </pre>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className={`${CARD} p-5 sm:p-8`}>
              <div className="flex items-center gap-3">
                <IconBox icon={RadioTower} />
                <div className="min-w-0">
                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Signaling events</h3>
                  <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400 sm:text-[13px]">Everything the Socket.IO server relays. File data is not part of this list.</p>
                </div>
              </div>

              <div className="mt-4 flex min-w-0 flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                {SOCKET_EVENTS.map((e) => (
                  <span key={e} className="max-w-full break-all rounded-lg border border-violet-100 bg-violet-50/60 px-2 py-1.5 font-mono text-[9px] font-semibold text-violet-700 dark:border-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300 sm:px-2.5 sm:text-[11px]">{e}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* WORKFLOW */}
      <Section
        id="workflow"
        icon={Route}
        eyebrow="Workflow"
        title="How WebDrop works, end to end."
        description="From creating a room to downloading the file in ten steps."
        tint
      >
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {WORKFLOW.map((step, i) => (
            <Reveal key={step.title} delay={(i % 5) * 70}>
              <div className={`${SOFT_CARD} relative h-full p-4 sm:p-5`}>
                <div className="flex items-center justify-between">
                  <IconBox icon={step.icon} />
                  <span className="font-mono text-[10px] font-bold tracking-widest text-violet-200 dark:text-violet-500/40 sm:text-[11px]">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-4 text-[13px] font-bold text-slate-900 dark:text-white sm:mt-5 sm:text-[14px]">{step.title}</h3>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-10 max-w-4xl sm:mt-14">
          <div className={`${CARD} p-5 sm:p-8`}>
            <div className="flex min-w-0 items-center gap-3">
              <IconBox icon={RadioTower} />
              <div className="min-w-0">
                <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">WebRTC signaling sequence</h3>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">Socket.IO carries connection information only, never files.</p>
              </div>
            </div>

            <div className="relative mt-6 hidden sm:block">
              <div className="grid grid-cols-3 text-center">
                {[
                  { icon: Laptop, label: 'Browser A' },
                  { icon: Server, label: 'Socket.IO' },
                  { icon: Smartphone, label: 'Browser B' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{label}</span>
                  </div>
                ))}
              </div>

              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-[16.666%] w-px border-l border-dashed border-violet-200 dark:border-violet-500/20" />
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px border-l border-dashed border-violet-200 dark:border-violet-500/20" />
                <div className="pointer-events-none absolute inset-y-0 left-[83.333%] w-px border-l border-dashed border-violet-200 dark:border-violet-500/20" />

                {SIGNALING.map((row) => (
                  <div key={row.label} className="relative grid grid-cols-6 py-3">
                    <div className={`${row.start} ${row.span} min-w-0`}>
                      <p className="break-words px-2 pb-1 text-center text-[10px] font-semibold text-slate-600 dark:text-slate-300 md:text-[11px]">{row.label}</p>
                      <div className="flex items-center text-violet-500">
                        {row.dir !== 'right' && <ChevronLeft className="-mr-1 h-4 w-4 shrink-0" />}
                        <div className="h-0 flex-1 border-t-2 border-violet-400 dark:border-violet-400/70" />
                        {row.dir !== 'left' && <ChevronRight className="-ml-1 h-4 w-4 shrink-0" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
                  <p className="text-[11px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[12px]">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* TRANSFER */}
      <Section
        id="transfer"
        icon={Send}
        eyebrow="Transfer Engine"
        title="What happens to a file."
        description="Every transfer is independent, so cancelling one file never breaks the next."
      >
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          <Reveal>
            <div className={`${CARD} p-5 sm:p-8`}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-[10px]">DataChannel pipeline</p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2">
                {PIPELINE.map(({ icon: Icon, label }, i) => (
                  <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex min-h-9 items-center gap-1.5 rounded-xl border border-violet-100 bg-[#FAF9FF] px-2.5 py-2 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-3 sm:py-2.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400 sm:h-4 sm:w-4" />
                      <span className="whitespace-nowrap text-[9.5px] font-semibold text-slate-700 dark:text-slate-200 sm:text-[12px]">{label}</span>
                    </div>
                    {i < PIPELINE.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600 sm:h-3.5 sm:w-3.5" />}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:mt-5 sm:text-[12px]">
                A metadata message is sent first, binary chunks follow, and a Blob is rebuilt on the receiver, with no server involved.
              </p>
            </div>
          </Reveal>

          <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
            <Reveal>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={ListChecks} />
                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Protocol messages</h3>
                </div>

                <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
                  {PROTOCOL.map((p) => (
                    <div key={p.type} className={`${INNER} p-3`}>
                      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                        <code className="max-w-full break-all font-mono text-[10px] font-bold text-violet-700 dark:text-violet-300 sm:text-[12px]">{p.type}</code>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">{p.dir}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">{p.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={Gauge} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-violet-500 sm:text-[10px]">Engineering detail</p>
                    <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Backpressure &amp; reliability</h3>
                  </div>
                </div>

                <div className="mt-5">
                  <CheckList items={BACKPRESSURE} />
                </div>

                <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mt-6 sm:text-[10px]">Also handled</p>

                <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                  {ALSO_HANDLED.map((t) => (
                    <span key={t} className="rounded-full border border-violet-100 bg-violet-50/60 px-2.5 py-1.5 text-[9.5px] font-semibold text-violet-700 dark:border-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300 sm:px-3 sm:text-[11px]">{t}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ROOMS */}
      <Section
        id="rooms"
        icon={Clock}
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
                  <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Room &amp; connection management</h3>
                </div>
                <div className="mt-5">
                  <CheckList items={ROOM_RULES} />
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`${CARD} h-full p-5 sm:p-8`}>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-[10px]">Room state</p>
                <div className="mt-4 flex min-w-0 flex-col gap-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white shadow-lg shadow-violet-900/20 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-violet-200 sm:text-[10px]">Room</p>
                    <p className="font-mono text-[23px] font-bold tracking-[0.1em] sm:text-[26px]">X7K92</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-violet-200 sm:text-[10px]">Expires in</p>
                    <p className="font-mono text-[18px] font-bold sm:text-[20px]">24:32</p>
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
            <p className="mb-4 mt-7 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mt-8 sm:mb-4 sm:text-[10px]">Key screens</p>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {SCREENS.map((s, i) => (
                <Reveal key={s.title} delay={(i % 4) * 70}>
                  <div className={`${SOFT_CARD} h-full p-4 sm:p-5`}>
                    <IconBox icon={s.icon} />
                    <h3 className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white sm:mt-4 sm:text-[14px]">{s.title}</h3>
                    <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* TECH STACK */}
      <Section
        id="stack"
        icon={Cpu}
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
                  <h3 className="text-[13px] font-bold text-slate-900 dark:text-white sm:text-[14px]">{g.title}</h3>
                </div>
                <div className="mt-4 flex min-w-0 flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                  {g.items.map((item) => (
                    <span key={item} className="max-w-full break-words rounded-lg border border-violet-100 bg-violet-50/60 px-2 py-1.5 text-[9.5px] font-semibold text-violet-700 dark:border-violet-500/15 dark:bg-violet-500/10 dark:text-violet-300 sm:px-2.5 sm:text-[11px]">{item}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-8 max-w-5xl sm:mt-10">
          <div className={`${CARD} p-5 sm:p-8`}>
            <div className="flex items-center gap-3">
              <IconBox icon={TrendingUp} />
              <div className="min-w-0">
                <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Performance profile</h3>
                <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400 sm:text-[13px]">Measured on typical consumer connections.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {METRICS.map((m) => (
                <div key={m.label} className="rounded-xl border border-slate-100 bg-[#FAF9FF] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                  <p className="mt-1.5 text-[16px] font-extrabold text-slate-900 dark:text-white sm:text-[18px]">{m.value}</p>
                  <p className="mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">{m.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.06]">
              <table className="w-full text-left text-[11px] sm:text-[12.5px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-4">File size</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-4">Network</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-4">Time</th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-4">Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {PERF_ROWS.map((row, i) => (
                    <tr key={i} className={i !== PERF_ROWS.length - 1 ? 'border-b border-slate-100 dark:border-white/[0.06]' : ''}>
                      <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-200 sm:px-4">{row[0]}</td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 sm:px-4">{row[1]}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-200 sm:px-4">{row[2]}</td>
                      <td className="px-3 py-2.5 font-mono text-emerald-600 dark:text-emerald-400 sm:px-4">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* COMPATIBILITY */}
      <Section
        id="compat"
        icon={MonitorSmartphone}
        eyebrow="Compatibility"
        title="Works on every major browser."
        description="WebRTC is supported across all modern browsers. Here's what we tested."
        tint
      >
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          <Reveal>
            <div className={`${CARD} overflow-hidden`}>
              <table className="w-full text-left text-[11.5px] sm:text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#FAF9FF] dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-5">Browser</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-5">Min. version</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:px-5">Support</th>
                    <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:table-cell sm:px-5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {BROWSERS.map((b, i) => (
                    <tr key={b.name} className={i !== BROWSERS.length - 1 ? 'border-b border-slate-100 dark:border-white/[0.06]' : ''}>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 sm:px-5">{b.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 sm:px-5">{b.version}</td>
                      <td className="px-4 py-3 sm:px-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'full'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'full' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {b.status === 'full' ? 'Full' : 'Partial'}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 sm:table-cell sm:px-5">{b.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <div>
            <p className="mb-4 mt-7 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mt-8 sm:mb-4 sm:text-[10px]">Where people use it</p>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {USE_CASES.map((s, i) => (
                <Reveal key={s.title} delay={(i % 3) * 70}>
                  <div className={`${SOFT_CARD} h-full p-4 sm:p-5`}>
                    <IconBox icon={s.icon} />
                    <h3 className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white sm:mt-4 sm:text-[14px]">{s.title}</h3>
                    <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* SETUP (NEW) */}
      <Section
        id="setup"
        icon={Terminal}
        eyebrow="Developer Setup"
        title="Run WebDrop locally."
        description="Five steps from a fresh clone to a running development environment."
      >
        <div className="mx-auto max-w-4xl space-y-3">
          {SETUP_STEPS.map((s, i) => (
            <Reveal key={s.number} delay={i * 70}>
              <div className={`${CARD} p-5`}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                    <s.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-violet-400 sm:text-[11px]">{s.number}</span>
                      <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white sm:text-[14.5px]">
                        {s.title}
                      </h3>
                    </div>

                    <pre className="mt-3 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3.5 font-mono text-[10px] leading-5 text-slate-300 dark:border-white/10 sm:text-[12px] sm:leading-6">
                      {s.cmd}
                    </pre>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* DEPLOYMENT (NEW) */}
      <Section
        id="deploy"
        icon={Rocket}
        eyebrow="Deployment"
        title="Ship it to production."
        description="Suggested hosting layout for the client, the server and the TURN relay."
        tint
      >
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5 lg:grid-cols-3">
          {DEPLOY_STEPS.map((d, i) => (
            <Reveal key={d.title} delay={i * 100}>
              <div className={`${CARD} h-full p-5 sm:p-6`}>
                <div className="flex items-center gap-3">
                  <IconBox icon={d.icon} />
                  <h3 className="text-[14px] font-bold text-slate-900 dark:text-white sm:text-[15px]">
                    {d.title}
                  </h3>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {d.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
                      <span className="text-[12px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[12.5px]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mx-auto mt-6 max-w-4xl">
          <div className={`${INNER} flex items-start gap-3 p-4`}>
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" strokeWidth={2.4} />
            <p className="text-[12px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[12.5px]">
              <strong className="font-semibold">Note:</strong> self-hosted TURN is optional. WebDrop works without it, but adding a relay helps devices on restrictive networks connect reliably.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* TESTING */}
      <Section
        id="testing"
        icon={CheckCircle2}
        eyebrow="Testing"
        title="Functional test results."
        description="Every planned test case passed."
      >
        <Reveal className="mx-auto max-w-5xl">
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 bg-[#FAF9FF] px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row sm:items-center sm:px-6">
              <p className="text-[12px] font-bold text-slate-900 dark:text-white sm:text-[13px]">Functional testing plan</p>
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
                    i < TESTS.length - (TESTS.length % 2 === 0 ? 2 : 1) ? 'border-b' : ''
                  } ${i % 2 === 0 ? 'sm:border-r' : ''}`}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[12px] font-semibold text-slate-800 dark:text-slate-100 sm:text-[13px]">{name}</p>
                    <p className="break-words text-[11px] leading-5 text-slate-500 dark:text-slate-400 sm:text-[12px]">{expected}</p>
                  </div>
                  <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 sm:block sm:text-[10px]">Passed</span>
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
                <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Security &amp; privacy</h3>
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
                <h3 className="font-heading text-[17px] font-bold sm:text-[18px]">Limitations</h3>
              </div>
              <div className="mt-5">
                <CheckList items={LIMITATIONS} tone="amber" />
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* TIMELINE */}
      <Section
        id="timeline"
        icon={History}
        eyebrow="Project Timeline"
        title="How WebDrop was built."
        description="From the first idea to the v1.0.0 release, phase by phase."
        tint
      >
        <Timeline items={TIMELINE} />
      </Section>

      {/* ROADMAP */}
      <Section
        id="roadmap"
        icon={Rocket}
        eyebrow="Roadmap"
        title="Where WebDrop goes next."
        description="What has shipped, what is coming up, and what we would like to build."
      >
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5 lg:grid-cols-3">
          {ROADMAP.map((lane, i) => (
            <Reveal key={lane.key} delay={i * 100}>
              <div className={`h-full min-w-0 rounded-[24px] border p-5 sm:rounded-[28px] sm:p-7 ${
                lane.status === 'current'
                  ? 'border-violet-300 bg-gradient-to-br from-white to-violet-50 shadow-lg shadow-violet-900/5 dark:border-violet-400/30 dark:from-surface-card dark:to-violet-500/[0.07]'
                  : 'border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]'
              }`}>
                <div className="flex min-w-0 items-start justify-between gap-2.5 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">{lane.version}</p>
                    <h3 className="mt-1 break-words font-heading text-[18px] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[20px]">{lane.title}</h3>
                  </div>
                  <StatusChip status={lane.status} />
                </div>

                <ul className="mt-5 space-y-2 sm:mt-6 sm:space-y-2.5">
                  {lane.items.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex min-w-0 items-start gap-2.5 rounded-xl border border-slate-100 bg-white/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03] sm:gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${lane.status === 'done' ? 'text-emerald-500' : 'text-violet-600 dark:text-violet-400'}`} strokeWidth={2.1} />
                      <span className="min-w-0 break-words text-[11.5px] font-medium leading-5 text-slate-700 dark:text-slate-200 sm:text-[13px]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* PRIVACY SUMMARY (NEW) */}
      <Section
        id="privacy"
        icon={Scale}
        eyebrow="Privacy Summary"
        title="What we collect. What we don't."
        description="WebDrop is designed to know as little about you as possible."
        tint
      >
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {PRIVACY_SUMMARY.map((p, i) => (
            <Reveal key={p.title} delay={(i % 3) * 70}>
              <div className={`${SOFT_CARD} h-full p-4 sm:p-5`}>
                <IconBox icon={p.icon} />
                <h3 className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white sm:mt-4 sm:text-[14px]">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[11.5px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[12.5px] sm:leading-6">
                  {p.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Credits */}
        <div className="mx-auto mt-10 max-w-6xl sm:mt-14">
          <p className="mb-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:mb-5 sm:text-[10px]">
            Credits &amp; License
          </p>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {CREDITS.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 70}>
                <div className={`${SOFT_CARD} h-full p-4 sm:p-5`}>
                  <div className="flex items-center gap-3">
                    <IconBox icon={c.icon} />
                    <h3 className="text-[13px] font-bold text-slate-900 dark:text-white sm:text-[14px]">
                      {c.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[11.5px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[12.5px] sm:leading-6">
                    {c.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* GLOSSARY */}
      <Section
        id="glossary"
        icon={BookOpen}
        eyebrow="Glossary"
        title="Technical terms explained."
        description="A quick reference for the acronyms and protocols used in WebDrop."
      >
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {GLOSSARY.map((g, i) => (
            <Reveal key={g.term} delay={(i % 3) * 70}>
              <div className={`${SOFT_CARD} h-full p-4 sm:p-5`}>
                <code className="font-mono text-[12px] font-bold text-violet-700 dark:text-violet-300 sm:text-[13px]">
                  {g.term}
                </code>
                <p className="mt-2 text-[11.5px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[12.5px] sm:leading-6">
                  {g.def}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section
        id="faq"
        icon={LifeBuoy}
        eyebrow="FAQ"
        title="Questions we get often."
        tint
      >
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <details
              key={q}
              className={`group ${i !== FAQ_ITEMS.length - 1 ? 'border-b border-slate-100 dark:border-white/[0.06]' : ''}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-[12.5px] font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="pr-2">{q}</span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-transform group-open:rotate-45 dark:border-white/[0.08] dark:text-slate-500">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="px-5 pb-3.5 pr-10 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                {a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* CONCLUSION */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-3 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[24px] border border-violet-500/20 bg-slate-950 px-5 py-10 text-center shadow-xl shadow-violet-900/20 sm:rounded-[28px] sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute left-1/2 top-[-160px] h-[280px] w-[440px] -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl sm:h-[320px] sm:w-[560px]" />
            <div className="pointer-events-none absolute -bottom-32 right-[-80px] h-[220px] w-[220px] rounded-full bg-indigo-500/20 blur-3xl sm:h-[260px] sm:w-[260px]" />

            <div className="relative min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-violet-300 sm:text-[10px]">Conclusion</p>

              <h2 className="mt-3 break-words font-heading text-[22px] font-extrabold leading-tight tracking-tight text-white sm:text-[30px] md:text-[34px]">
                Socket.IO coordinates the connection.
                <span className="block bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  WebRTC DataChannel transfers the file.
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-[12.5px] leading-6 text-slate-400 sm:text-[14px] sm:leading-7">
                WebDrop shows how modern browser technologies can be combined into a direct peer-to-peer file transfer system with no accounts, no uploads and no storage.
              </p>

              <p className="mt-4 font-heading text-[15px] font-bold italic text-violet-300 sm:mt-5 sm:text-[16px]">
                "Drop. Connect. Transfer."
              </p>

              <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center">
                <Link
                  to="/create"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-[12px] font-bold text-white transition-colors duration-200 hover:bg-violet-700 sm:w-auto sm:text-[13px]"
                >
                  <Radio className="h-4 w-4" />
                  Try WebDrop
                </Link>

                <a
                  href="https://github.com/Suraj1819/web-drop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-[12px] font-bold text-slate-900 transition-colors duration-200 hover:bg-slate-100 sm:w-auto sm:text-[13px]"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>

                <Link
                  to="/team"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-[12px] font-bold text-white transition-colors duration-200 hover:bg-white/10 sm:w-auto sm:text-[13px]"
                >
                  <Globe2 className="h-4 w-4" />
                  Meet the team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScrollToTop />
    </main>
  );
}