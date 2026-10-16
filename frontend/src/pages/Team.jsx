// src/pages/Team.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bug,
  Cable,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Code2,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileCode,
  FolderUp,
  Gauge,
  GitBranch,
  Github,
  Globe2,
  GraduationCap,
  HardDrive,
  Instagram,
  Layers3,
  LifeBuoy,
  Linkedin,
  ListChecks,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Network,
  Package,
  Phone,
  QrCode,
  Radio,
  RefreshCw,
  Rocket,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Timer,
  TrendingUp,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

import surajPhoto from '../assets/images/team/suraj.jpg';
import shubhamPhoto from '../assets/images/team/shubham.jpg';
import shivamPhoto from '../assets/images/team/shivam.jpg';

/* =========================================================
   CONSTANTS
========================================================= */

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface';

const CARD =
  'rounded-[28px] border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]';

const SOFT_CARD =
  'rounded-2xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]';

/* =========================================================
   DATA
========================================================= */

const teamMembers = [
  {
    id: 'suraj',
    name: 'Suraj Kumar',
    regNo: '23105135019',
    branch: 'Computer Science & Engineering',
    shortBranch: 'CSE',
    role: 'Full Stack Developer',
    focus: 'Transfer engine & integration',
    photo: surajPhoto,
    availability: 'Full-time project',
    joinedAt: 'Aug 2024',

    contact: {
      email: '',
      phone: '',
      github: 'https://github.com/Suraj1819',
      linkedin: '',
      instagram: '',
    },

    bio:
      'Full-stack developer who led WebDrop from idea to a working product. Built the transfer engine, the integration between layers, and shipped the Windows and Android apps.',

    description:
      'Built the core of WebDrop: the peer-to-peer transfer engine and the integration between the frontend, the backend and the native apps.',

    highlights: [
      'WebRTC peer connection and DataChannel setup',
      'Chunked streaming (4 MB blocks, 64 KB chunks) with backpressure',
      'Offer, accept, reject and cancel transfer protocol',
    ],

    contributions: [
      'WebRTC peer connection and DataChannel setup',
      'Chunked streaming (4 MB blocks, 64 KB chunks) with backpressure',
      'Offer, accept, reject and cancel transfer protocol',
      'Real-time speed and ETA calculation',
      'Auto-resume and queueing after a peer reconnects',
      'File, folder, drag-and-drop and clipboard transfer',
      'Frontend–backend integration and deployment',
      'Windows (.exe) and Android (.apk) app packaging',
    ],

    skills: [
      { name: 'React', level: 92 },
      { name: 'JavaScript', level: 90 },
      { name: 'Node.js', level: 85 },
      { name: 'Express.js', level: 82 },
      { name: 'WebRTC', level: 88 },
      { name: 'Socket.IO', level: 85 },
      { name: 'Tailwind CSS', level: 80 },
      { name: 'Git', level: 88 },
    ],
  },

  {
    id: 'shubham',
    name: 'Shubham Kumar',
    regNo: '23105135014',
    branch: 'Computer Science & Engineering',
    shortBranch: 'CSE',
    role: 'Frontend & UI Developer',
    focus: 'Interface & user experience',
    photo: shubhamPhoto,
    availability: 'Full-time project',
    joinedAt: 'Aug 2024',

    contact: {
      email: '',
      phone: '',
      github: '',
      linkedin: '',
      instagram: '',
    },

    bio:
      'Frontend developer focused on making WebDrop feel simple. Owns the visual system, the responsive layout, and every screen a user touches.',

    description:
      'Designed and built the WebDrop interface — a clean, responsive experience that works on desktop and mobile, in light and dark themes.',

    highlights: [
      'Home, Create room and Join room screens',
      'QR code display, QR scan and invite-link join flow',
      'Responsive layout and light / dark theme',
    ],

    contributions: [
      'Home, Create room and Join room screens',
      'QR code display, QR scan and invite-link join flow',
      'Responsive layout and light / dark theme',
      'Transfer UI: file list, progress bars, accept / reject prompts',
      'Toasts, browser notifications and completion sound',
      'Navigation lock while inside a room',
      'Footer, Team page and overall visual consistency',
    ],

    skills: [
      { name: 'React', level: 88 },
      { name: 'JavaScript', level: 85 },
      { name: 'Tailwind CSS', level: 92 },
      { name: 'HTML', level: 90 },
      { name: 'CSS', level: 88 },
      { name: 'Responsive Design', level: 90 },
      { name: 'UI Development', level: 88 },
      { name: 'Git', level: 82 },
    ],
  },

  {
    id: 'shivam',
    name: 'Shivam Kumar Singh',
    regNo: '23105135007',
    branch: 'Computer Science & Engineering',
    shortBranch: 'CSE',
    role: 'Backend & Networking',
    focus: 'Signaling & room management',
    photo: shivamPhoto,
    availability: 'Full-time project',
    joinedAt: 'Aug 2024',

    contact: {
      email: '',
      phone: '',
      github: '',
      linkedin: '',
      instagram: '',
    },

    bio:
      'Backend engineer who owns the server side — signaling, room lifecycle, and the networking that lets two browsers find each other.',

    description:
      'Built the server side of WebDrop: signaling, room management and the networking setup that lets two browsers find each other and connect.',

    highlights: [
      'Node.js and Express server with REST APIs',
      'Socket.IO signaling for offer, answer and ICE candidates',
      '5-character room codes with 30-minute expiry',
    ],

    contributions: [
      'Node.js and Express server with REST APIs',
      'Socket.IO signaling for offer, answer and ICE candidates',
      '5-character room codes with 30-minute expiry',
      'Two-device limit, room lock, remove peer and end room',
      'STUN / TURN configuration with relay fallback',
      'Peer coordination on join, leave and rejoin',
      'Cleanup of expired and abandoned rooms',
    ],

    skills: [
      { name: 'Node.js', level: 90 },
      { name: 'Express.js', level: 88 },
      { name: 'Socket.IO', level: 92 },
      { name: 'WebRTC', level: 82 },
      { name: 'REST APIs', level: 88 },
      { name: 'Networking', level: 85 },
      { name: 'JavaScript', level: 88 },
      { name: 'Git', level: 85 },
    ],
  },
];

const stats = [
  { value: '2', label: 'Devices per room', icon: Users },
  { value: '5', label: 'Character code', icon: Tag },
  { value: '30 min', label: 'Room lifetime', icon: Clock },
  { value: '64 KB', label: 'Chunk size', icon: Package },
  { value: 'No limit', label: 'File size', icon: TrendingUp },
  { value: '0 MB', label: 'Server storage', icon: Database },
];

const projectInfo = [
  { icon: Layers3, label: 'Project', value: 'WebDrop' },
  { icon: Rocket, label: 'Version', value: '1.0.0' },
  { icon: Users, label: 'Team size', value: '3 members' },
  { icon: Code2, label: 'Domain', value: 'Web Development & Networking' },
  { icon: Network, label: 'Core technology', value: 'WebRTC DataChannel' },
  { icon: Smartphone, label: 'Platforms', value: 'Web, Android, Windows' },
];

const architectureSteps = [
  {
    number: '01',
    icon: Radio,
    title: 'Create a room',
    text: 'The host creates a temporary room and gets a 5-character code.',
    tech: 'REST + Socket',
  },
  {
    number: '02',
    icon: QrCode,
    title: 'Share & join',
    text: 'The second device joins using the code, invite link or QR scan.',
    tech: 'Room code / QR',
  },
  {
    number: '03',
    icon: Server,
    title: 'Signaling',
    text: 'Socket.IO only exchanges the WebRTC offer, answer and ICE candidates.',
    tech: 'Socket.IO',
  },
  {
    number: '04',
    icon: Network,
    title: 'Direct connection',
    text: 'STUN finds a direct route; TURN is used as a fallback when needed.',
    tech: 'STUN / TURN',
  },
  {
    number: '05',
    icon: Zap,
    title: 'DataChannel',
    text: 'File data flows browser-to-browser over an encrypted channel.',
    tech: 'WebRTC DTLS',
  },
];

const pipeline = [
  {
    icon: ListChecks,
    title: 'Offer',
    text: 'The sender shares only the file details (name, size, type) under a unique transfer ID.',
    detail: 'Small metadata message, no file bytes yet.',
  },
  {
    icon: CheckCircle2,
    title: 'Accept or reject',
    text: 'The receiver decides. No file data moves until the offer is accepted.',
    detail: 'Full user control — nothing auto-accepted.',
  },
  {
    icon: Layers3,
    title: 'Chunked streaming',
    text: 'The file is read in 4 MB blocks and sent as 64 KB chunks, so large files never need to sit in memory at once.',
    detail: 'Streams work for multi-GB files.',
  },
  {
    icon: Gauge,
    title: 'Backpressure',
    text: 'The sender watches the DataChannel buffer and waits only when it is genuinely full, then resumes instantly.',
    detail: 'No memory exhaustion, no stalls.',
  },
  {
    icon: Timer,
    title: 'Live progress',
    text: 'The receiver acknowledges progress; speed and ETA are computed from real bytes over time.',
    detail: 'Accurate speed, not a fake bar.',
  },
  {
    icon: RefreshCw,
    title: 'Complete or cancel',
    text: 'Cancelling one file only stops that file. The connection stays open for the next transfer.',
    detail: 'Independent transfer lifecycle.',
  },
];

const features = [
  { icon: Network, title: 'Peer-to-Peer', category: 'Core', description: 'Files are transferred directly between connected devices using WebRTC DataChannel.' },
  { icon: ShieldCheck, title: 'Private Transfer', category: 'Security', description: 'WebDrop does not upload the actual file to a central storage server.' },
  { icon: QrCode, title: 'QR Room Join', category: 'UX', description: 'Users can quickly join a transfer room by scanning the generated QR code or opening the invite link.' },
  { icon: Zap, title: 'Fast Transfer', category: 'Core', description: 'Chunked streaming with backpressure keeps the channel busy without exhausting browser memory.' },
  { icon: LockKeyhole, title: 'Encrypted Connection', category: 'Security', description: 'WebRTC connections use secure DTLS-based communication between peers.' },
  { icon: Smartphone, title: 'Cross Device', category: 'Platform', description: 'Works across laptops, desktops and smartphones, in the browser or in the native apps.' },
  { icon: FolderUp, title: 'Files & Folders', category: 'Feature', description: 'Choose multiple files or a whole folder, drag and drop them, or paste from the clipboard.' },
  { icon: Gauge, title: 'Live Speed & ETA', category: 'Feature', description: 'Every transfer shows real-time progress, throughput and estimated time remaining.' },
  { icon: ListChecks, title: 'You Stay in Control', category: 'Feature', description: 'The receiver can accept or reject each file, and either side can cancel a transfer at any time.' },
  { icon: RefreshCw, title: 'Reconnect Friendly', category: 'Core', description: 'If the peer drops, files are queued and resumed automatically when the connection comes back.' },
  { icon: Bell, title: 'Notifications', category: 'UX', description: 'Incoming-file toasts, optional browser notifications and a completion sound.' },
  { icon: Download, title: 'Desktop & Android', category: 'Platform', description: 'Download the Windows (.exe) or Android (.apk) app straight from the home page.' },
];

const roadmap = [
  { version: 'v1.0.0', date: 'Q4 2024', status: 'Released', title: 'First public release', items: ['Peer-to-peer file transfer', '5-character rooms with 30-min expiry', 'Windows and Android apps', 'QR join, invite links, dark mode'] },
  { version: 'v1.1.0', date: 'Q1 2025', status: 'In progress', title: 'Reliability pass', items: ['Resume interrupted transfers', 'Stream to disk for very large files', 'Self-hosted TURN server', 'Better error recovery'] },
  { version: 'v1.2.0', date: 'Q2 2025', status: 'Planned', title: 'Beyond two devices', items: ['Rooms with 3+ devices', 'iOS and macOS apps', 'Transfer history', 'Shared folder presets'] },
];

const changelog = [
  { version: 'v1.0.0', date: 'Oct 2024', type: 'Initial', notes: 'First working version with WebRTC transfer, Socket.IO signaling, and native app builds.' },
  { version: 'v0.9.0', date: 'Sep 2024', type: 'Beta', notes: 'Internal beta with 30-minute rooms, QR scanning, and multi-file support.' },
  { version: 'v0.5.0', date: 'Aug 2024', type: 'Alpha', notes: 'Proof-of-concept with two-browser P2P transfer and basic room flow.' },
];

const techGroups = [
  { title: 'Frontend', icon: Monitor, items: ['React', 'Vite', 'JavaScript (JSX)', 'Tailwind CSS', 'React Router', 'Lucide Icons'], detail: 'Single-page app with a component-driven UI and utility-first styling.' },
  { title: 'Backend', icon: Server, items: ['Node.js', 'Express.js', 'REST APIs', 'Room management'], detail: 'Lightweight server responsible for signaling and room lifecycle only.' },
  { title: 'Real-time & P2P', icon: Cable, items: ['WebRTC', 'DataChannel', 'Socket.IO', 'STUN / TURN', 'DTLS'], detail: 'The core protocol stack that carries files directly between peers.' },
  { title: 'Tooling & Delivery', icon: Code2, items: ['Git', 'GitHub', 'Android (.apk)', 'Windows (.exe)'], detail: 'Source control plus packaged builds for desktop and mobile.' },
];

const platforms = [
  { icon: Globe2, name: 'Web', detail: 'Any modern browser', tag: 'Live', tone: 'emerald' },
  { icon: Smartphone, name: 'Android', detail: '.apk · v1.0.0', tag: 'v1.0.0', tone: 'violet' },
  { icon: Monitor, name: 'Windows', detail: '.exe · v1.0.0', tag: 'v1.0.0', tone: 'sky' },
];

const faqs = [
  { q: 'Is WebDrop really free?', a: 'Yes. No account, no subscription, no hidden limits. The entire project is open source.' },
  { q: 'Where are my files stored?', a: "They aren't. Files travel directly between the two devices. The server only helps them find each other." },
  { q: 'Does it work across different networks?', a: 'Yes. WebRTC tries a direct path first and falls back to a relay (TURN) when a direct connection is impossible.' },
  { q: 'Can I use it offline?', a: 'Not fully — the two devices still need to reach our signaling server once to establish a connection. After that, transfers are direct.' },
  { q: 'Why is there a 30-minute limit?', a: 'Rooms are meant to be short-lived. After 30 minutes they self-destruct, so nothing lingers. You can always create a new one.' },
];

const privacyPoints = [
  'File data never touches the WebDrop server',
  'The signaling server only sees room codes and connection details',
  'All peer traffic is encrypted with DTLS',
  'If a TURN relay is needed, it only forwards encrypted packets',
  'No account or sign-up is required',
];

const roomControls = [
  'Host can lock the room so no new devices can join',
  'Host can remove a connected peer from the room',
  'Host can end the room for everyone at any time',
  'Guests can leave and rejoin while the room is still open',
  'Rooms are limited to two devices and expire after 30 minutes',
];

/* =========================================================
   HELPERS
========================================================= */

function getContactLinks(contact = {}) {
  const phone = (contact.phone || '').replace(/[^\d+]/g, '');

  return [
    contact.email && {
      key: 'email',
      label: 'Email',
      icon: Mail,
      href: `mailto:${contact.email}`,
      external: false,
    },
    phone && {
      key: 'phone',
      label: 'Call',
      icon: Phone,
      href: `tel:${phone}`,
      external: false,
    },
    contact.github && {
      key: 'github',
      label: 'GitHub',
      icon: Github,
      href: contact.github,
      external: true,
    },
    contact.linkedin && {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      href: contact.linkedin,
      external: true,
    },
    contact.instagram && {
      key: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      href: contact.instagram,
      external: true,
    },
  ].filter(Boolean);
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
      className={`fixed bottom-5 right-5 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.1] dark:bg-[#15171d]/95 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-300 ${FOCUS_RING}`}
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
    </button>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1 dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
          {Icon && <Icon className="h-3 w-3 text-violet-600 dark:text-violet-400" strokeWidth={2.4} />}
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
            {eyebrow}
          </span>
        </div>
      )}

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

function IconBox({ icon: Icon, className = '' }) {
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 ${className}`}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
    </div>
  );
}

function CheckList({ items }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.2} />
          <span className="text-[12.5px] leading-6 text-slate-600 dark:text-slate-300">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactIcons({ member }) {
  const links = getContactLinks(member.contact);
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {links.map(({ key, label, icon: Icon, href, external }) => (
        <a
          key={key}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          aria-label={`${label} — ${member.name}`}
          title={label}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.08] dark:hover:text-violet-300 ${FOCUS_RING}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </a>
      ))}
    </div>
  );
}

function ContactButtons({ member }) {
  const links = getContactLinks(member.contact);

  if (links.length === 0) {
    return (
      <p className="text-[12px] text-slate-400">
        Contact details will be added soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {links.map(({ key, label, icon: Icon, href, external }) => (
        <a
          key={key}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition-colors duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.08] dark:hover:text-violet-300 ${FOCUS_RING}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.9} />
          {label}
        </a>
      ))}
    </div>
  );
}

function MemberCard({ member, onOpen }) {
  const hasContacts = getContactLinks(member.contact).length > 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
      <button
        type="button"
        onClick={() => onOpen(member)}
        aria-label={`View ${member.name}'s profile`}
        className={`flex h-full w-full flex-1 flex-col p-5 text-left sm:p-6 ${FOCUS_RING}`}
      >
        {/* Circular avatar with availability dot */}
        <div className="relative mx-auto mb-5 h-28 w-28 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg ring-1 ring-slate-200/60 dark:border-surface-card dark:bg-slate-800 dark:ring-white/[0.06]">
            <img src={member.photo} alt="" className="h-full w-full object-cover" />
          </div>

          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-surface-card">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>

        {/* Name + role */}
        <div className="text-center">
          <h3 className="font-heading text-[18px] font-extrabold tracking-[-0.02em] text-slate-900 dark:text-white">
            {member.name}
          </h3>

          <p className="mt-1 text-[12.5px] font-bold text-violet-600 dark:text-violet-400">
            {member.role}
          </p>

          <p className="mt-0.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
            {member.focus}
          </p>
        </div>

        {/* Registration info box */}
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Registration no.
            </span>
            <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-100">
              {member.regNo}
            </span>
          </div>

          <div className="my-2.5 h-px bg-slate-100 dark:bg-white/[0.06]" />

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Branch
            </span>
            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">
              {member.shortBranch}
            </span>
          </div>
        </div>

        {/* Highlights */}
        <ul className="mt-5 flex-1 space-y-2.5">
          {member.highlights.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
              <span className="text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-5 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400">
          <span>View full profile</span>
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </div>
      </button>

      {hasContacts && (
        <div className="border-t border-slate-100 px-5 py-3.5 dark:border-white/[0.06]">
          <ContactIcons member={member} />
        </div>
      )}
    </article>
  );
}

function MemberModal({ member, onClose }) {
  const [tab, setTab] = useState('about');

  useEffect(() => {
    if (!member) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [member, onClose]);

  useEffect(() => {
    if (!member) setTab('about');
  }, [member]);

  if (!member) return null;

  const tabs = [
    { id: 'about', label: 'About', icon: BookOpen },
    { id: 'work', label: 'Work', icon: ListChecks },
    { id: 'skills', label: 'Skills', icon: Code2 },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${member.name} profile`}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/[0.09] dark:bg-surface-card"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors duration-200 hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.09] dark:bg-white/[0.05] dark:text-slate-400 dark:hover:text-white ${FOCUS_RING}`}
        >
          <X className="h-4 w-4" strokeWidth={2.4} />
        </button>

        <div className="relative overflow-hidden border-b border-slate-100 p-6 dark:border-white/[0.06] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md dark:border-surface-card dark:bg-slate-800">
              <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="font-heading text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                {member.name}
              </h2>
              <p className="mt-1 text-[13px] font-semibold text-violet-600 dark:text-violet-400">
                {member.role}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                  Reg. {member.regNo}
                </span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10.5px] font-semibold text-violet-700 dark:bg-violet-500/[0.1] dark:text-violet-300">
                  {member.shortBranch}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700 dark:bg-emerald-500/[0.1] dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {member.availability}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-100 dark:border-white/[0.06]">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 text-[12.5px] font-semibold transition-colors duration-200 ${
                tab === id
                  ? 'border-b-2 border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              } ${FOCUS_RING}`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {label}
            </button>
          ))}
        </div>

        <div className="max-h-[calc(92vh-300px)] overflow-y-auto p-6 sm:p-8">
          {tab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Bio</h3>
                <p className="mt-2 text-[13px] leading-7 text-slate-600 dark:text-slate-400">{member.bio}</p>
              </div>

              <div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">What they built</h3>
                <p className="mt-2 text-[13px] leading-7 text-slate-600 dark:text-slate-400">{member.description}</p>
              </div>

              <div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Contact</h3>
                <div className="mt-3">
                  <ContactButtons member={member} />
                </div>
              </div>
            </div>
          )}

          {tab === 'work' && (
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Contributions</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {member.contributions.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
                    <span className="text-[12px] leading-5 text-slate-600 dark:text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Technical skills</h3>
              <div className="mt-4 space-y-3">
                {member.skills.map(({ name, level }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{name}</span>
                      <span className="font-mono text-[11px] text-slate-400">{level}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{ width: `${level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function Team() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeFeatureCategory, setActiveFeatureCategory] = useState('All');

  const featureCategories = useMemo(
    () => ['All', ...new Set(features.map((f) => f.category))],
    [],
  );

  const filteredFeatures = useMemo(
    () =>
      activeFeatureCategory === 'All'
        ? features
        : features.filter((f) => f.category === activeFeatureCategory),
    [activeFeatureCategory],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <main className="min-h-screen bg-[#FBFAFF] text-slate-900 transition-colors dark:bg-surface dark:text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />
          <div className="absolute -bottom-40 -left-40 h-[380px] w-[380px] rounded-full bg-indigo-100/40 blur-3xl dark:bg-indigo-500/5" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-10">
          <Link
            to="/"
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition-colors duration-200 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 ${FOCUS_RING}`}
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2.4} />
            Back to home
          </Link>

          <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-14">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1 dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
              <Users className="h-3 w-3 text-violet-600 dark:text-violet-400" strokeWidth={2.4} />
              <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                Project team · 3 members
              </span>
            </div>

            <h1 className="font-heading text-[36px] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[52px] lg:text-[64px]">
              Meet the people
              <span className="block bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                behind WebDrop.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[14.5px] leading-7 text-slate-600 dark:text-slate-400 sm:text-[16px]">
              WebDrop is a browser-based peer-to-peer file transfer application,
              built as a collaborative Computer Science &amp; Engineering project.
              Files go straight from one device to another over WebRTC, never
              through our servers.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: Globe2, label: 'Web application' },
                { icon: Network, label: 'Peer-to-peer' },
                { icon: Code2, label: 'CSE project' },
                { icon: GraduationCap, label: '3rd year' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300"
                >
                  <Icon className="h-3 w-3 text-violet-500" strokeWidth={2.4} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-white/[0.06] dark:bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white px-4 py-5 text-center dark:bg-surface-card">
                <Icon className="mx-auto mb-2 h-4 w-4 text-violet-500" strokeWidth={2.2} />
                <p className="font-heading text-[20px] font-extrabold tracking-tight text-violet-600 dark:text-violet-400 sm:text-[22px]">
                  {value}
                </p>
                <p className="mt-1 text-[10.5px] font-medium text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <SectionHeading
          icon={Users}
          eyebrow="The Team"
          title="Three people. One project."
          description="Each member owned a clear part of WebDrop. Open a profile to see exactly what they built, or reach out directly."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <MemberCard key={member.id} member={member} onOpen={setSelectedMember} />
          ))}
        </div>
      </section>

      {/* ABOUT WEBDROP */}
      <section className="border-y border-slate-200 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            eyebrow="About WebDrop"
            title="Built for direct file transfer."
            description="WebDrop is designed around a simple idea: connect two devices and transfer files directly, without relying on traditional cloud file storage."
          />

          <div className="mx-auto mt-12 max-w-6xl">
            <div className={`${CARD} overflow-hidden`}>
              <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
                <div className="relative bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/30 p-6 dark:from-violet-500/[0.06] dark:via-transparent dark:to-indigo-500/[0.04] sm:p-8 lg:p-10">
                  <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />

                  <div className="relative">
                    <IconBox icon={Wifi} className="h-11 w-11" />

                    <h3 className="mt-6 font-heading text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
                      Drop. Connect. Transfer.
                    </h3>

                    <p className="mt-4 text-[14px] leading-7 text-slate-500 dark:text-slate-400">
                      WebDrop creates a temporary room that lets two devices find
                      each other and establish a peer-to-peer connection. Socket.IO
                      is used only for signaling, while the WebRTC DataChannel
                      carries the actual file data directly between the two
                      browsers.
                    </p>

                    <p className="mt-3 text-[14px] leading-7 text-slate-500 dark:text-slate-400">
                      Because the file never reaches a central server, there is no
                      upload step, no storage cost and no file-size limit imposed
                      by the application.
                    </p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-violet-100 bg-white/80 p-4 backdrop-blur-sm dark:border-violet-500/[0.15] dark:bg-white/[0.03]">
                        <p className="text-[12px] font-bold text-slate-900 dark:text-white">
                          No cloud storage
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                          Transferred files are never stored on a central server.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-white/80 p-4 backdrop-blur-sm dark:border-violet-500/[0.15] dark:bg-white/[0.03]">
                        <p className="text-[12px] font-bold text-slate-900 dark:text-white">
                          Temporary rooms
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                          A short-lived room gives two devices a simple way to connect.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-6 dark:border-white/[0.06] dark:from-white/[0.02] dark:to-transparent sm:p-8 lg:border-l lg:border-t-0">
                  <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    Project information
                  </p>

                  <div className="mt-6 space-y-5">
                    {projectInfo.map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" strokeWidth={2.2} />
                        <div>
                          <p className="text-[11px] font-medium text-slate-400">{label}</p>
                          <p className="mt-0.5 text-[14px] font-semibold text-slate-800 dark:text-slate-200">
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORK DIVISION */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            icon={ListChecks}
            eyebrow="Who Built What"
            title="How the work was divided."
            description="WebDrop has three layers: the interface, the server, and the transfer engine. Each of us took one."
          />

          <div className="mx-auto mt-12 grid max-w-6xl gap-4 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.id} className={`${CARD} flex flex-col p-5`}>
                <div className="flex items-center gap-3">
                  <img
                    src={member.photo}
                    alt=""
                    className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm dark:border-surface-card"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="text-[11.5px] font-medium text-violet-600 dark:text-violet-400">
                      {member.focus}
                    </p>
                  </div>
                </div>

                <div className="my-4 h-px bg-slate-100 dark:bg-white/[0.06]" />

                <CheckList items={member.contributions} />

                <button
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className={`mt-5 inline-flex items-center gap-1.5 self-start rounded-lg text-[12px] font-semibold text-slate-500 transition-colors duration-200 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 ${FOCUS_RING}`}
                >
                  View profile
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="border-y border-slate-200 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            icon={Network}
            eyebrow="Architecture"
            title="How WebDrop works."
            description="The signaling server helps peers discover each other, while the actual file data travels directly between the connected browsers."
          />

          <div className="mx-auto mt-12 max-w-6xl">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {architectureSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className={`${SOFT_CARD} relative p-4`}>
                    <div className="flex items-center justify-between">
                      <IconBox icon={Icon} />
                      <span className="font-mono text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-600">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[13px] font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[11.5px] leading-5 text-slate-500 dark:text-slate-400">
                      {step.text}
                    </p>

                    <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                      <Tag className="h-2.5 w-2.5" strokeWidth={2.4} />
                      {step.tech}
                    </span>

                    {i < architectureSteps.length - 1 && (
                      <ChevronRight
                        className="absolute -right-1.5 top-1/2 hidden h-3 w-3 -translate-y-1/2 text-slate-300 dark:text-slate-700 lg:block"
                        strokeWidth={2.4}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            icon={Layers3}
            eyebrow="Transfer Engine"
            title="What happens to a file."
            description="Every file follows the same lifecycle, and each transfer is independent — so one cancelled file never breaks the next."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pipeline.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className={`${SOFT_CARD} p-4`}>
                  <div className="flex items-center justify-between">
                    <IconBox icon={Icon} />
                    <span className="font-mono text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-600">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[13px] font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[11.5px] leading-6 text-slate-500 dark:text-slate-400">
                    {step.text}
                  </p>

                  <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-[10.5px] leading-4 text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400">
                    <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0 text-violet-500" strokeWidth={2.4} />
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-slate-200 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            icon={Star}
            eyebrow="Core Features"
            title="What the project delivers."
            description="A simple user experience built on browser-native networking technologies."
          />

          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-1.5">
            {featureCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFeatureCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 ${
                  activeFeatureCategory === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-violet-500/[0.1] dark:hover:text-violet-300'
                } ${FOCUS_RING}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-8 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={`${SOFT_CARD} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <IconBox icon={Icon} />
                    <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/[0.1] dark:text-violet-300">
                      {feature.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[13px] font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-[11.5px] leading-6 text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROOMS & PRIVACY */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            icon={ShieldCheck}
            eyebrow="Rooms & Privacy"
            title="Simple to control. Private by design."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
            <div className={`${CARD} p-6 sm:p-8`}>
              <IconBox icon={Clock} className="h-11 w-11" />
              <h3 className="mt-6 font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">
                Room management
              </h3>
              <CheckList items={roomControls} />
            </div>

            <div className={`${CARD} p-6 sm:p-8`}>
              <IconBox icon={ShieldCheck} className="h-11 w-11" />
              <h3 className="mt-6 font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">
                Privacy &amp; security
              </h3>
              <CheckList items={privacyPoints} />
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="border-y border-slate-200 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            icon={Rocket}
            eyebrow="Roadmap"
            title="Where WebDrop is going."
            description="Current release, in-progress work, and what's next on the list."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
            {roadmap.map((release) => {
              const statusColor =
                release.status === 'Released'
                  ? 'emerald'
                  : release.status === 'In progress'
                    ? 'amber'
                    : 'slate';

              return (
                <div key={release.version} className={`${CARD} p-5`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[14px] font-bold text-slate-900 dark:text-white">
                      {release.version}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                        statusColor === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/[0.1] dark:text-emerald-400'
                          : statusColor === 'amber'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/[0.1] dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'
                      }`}
                    >
                      {release.status}
                    </span>
                    <span className="text-[11px] text-slate-400">{release.date}</span>
                  </div>

                  <h3 className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white">
                    {release.title}
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {release.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CircleDot className="mt-1.5 h-2.5 w-2.5 shrink-0 text-violet-500" strokeWidth={2.4} />
                        <span className="text-[11.5px] leading-5 text-slate-600 dark:text-slate-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            icon={Cpu}
            eyebrow="Technology Stack"
            title="Modern tools, lightweight result."
            description="Browser and server-side technologies combined for a fast peer-to-peer experience."
          />

          <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {techGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className={`${SOFT_CARD} p-5`}>
                  <div className="flex items-center gap-3">
                    <IconBox icon={Icon} />
                    <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">
                      {group.title}
                    </h3>
                  </div>

                  <p className="mt-3 text-[11.5px] leading-5 text-slate-500 dark:text-slate-400">
                    {group.detail}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10.5px] font-semibold text-slate-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PLATFORMS + CHANGELOG */}
      <section className="border-y border-slate-200 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
            <div className={`${CARD} p-6 sm:p-8`}>
              <IconBox icon={HardDrive} className="h-11 w-11" />
              <h3 className="mt-6 font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">
                Available platforms
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                Use WebDrop in the browser, or install the app on your device.
              </p>

              <div className="mt-5 space-y-3">
                {platforms.map(({ icon: Icon, name, detail, tag, tone }) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                  >
                    <IconBox icon={Icon} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                        {name}
                      </p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">
                        {detail}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        tone === 'emerald'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : tone === 'violet'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
                      }`}
                    >
                      {tag}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/"
                className={`mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-[13px] font-semibold text-violet-700 transition-colors duration-200 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20 ${FOCUS_RING}`}
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
                Get the app from the home page
              </Link>
            </div>

            <div className={`${CARD} p-6 sm:p-8`}>
              <IconBox icon={GitBranch} className="h-11 w-11" />
              <h3 className="mt-6 font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">
                Changelog
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                How WebDrop evolved from a prototype to a working product.
              </p>

              <div className="relative mt-5 pl-7">
                <div className="absolute left-2 top-2 h-[calc(100%-1rem)] w-px bg-slate-200 dark:bg-white/[0.08]" />
                {changelog.map((entry) => (
                  <div key={entry.version} className="relative mb-5 last:mb-0">
                    <span className="absolute -left-[22px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-violet-500 bg-white dark:bg-surface-card">
                      <span className="h-1 w-1 rounded-full bg-violet-500" />
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[12.5px] font-bold text-slate-900 dark:text-white">
                        {entry.version}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        {entry.type}
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        {entry.date}
                      </span>
                    </div>

                    <p className="mt-1 text-[11.5px] leading-5 text-slate-500 dark:text-slate-400">
                      {entry.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading icon={LifeBuoy} eyebrow="FAQ" title="Questions we get often." />

          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
            {faqs.map(({ q, a }, i) => (
              <details
                key={q}
                className={`group ${i !== faqs.length - 1 ? 'border-b border-slate-100 dark:border-white/[0.06]' : ''}`}
              >
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-[12.5px] font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
                >
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
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 dark:border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-violet-500/20 bg-slate-950 px-6 py-12 text-center shadow-xl shadow-violet-900/20 sm:px-10">
            <div className="pointer-events-none absolute left-1/2 top-[-160px] h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-[-80px] h-[260px] w-[260px] rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                <Github className="h-5 w-5" />
              </div>

              <h2 className="mt-6 font-heading text-[26px] font-extrabold tracking-tight text-white sm:text-[34px]">
                Explore the WebDrop project
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-[14px] leading-7 text-slate-400">
                View the source code, project structure and development work on
                GitHub, or create a room and try WebDrop yourself.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="https://github.com/Suraj1819/bambi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-bold text-slate-900 transition-colors duration-200 hover:bg-slate-100 ${FOCUS_RING}`}
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <Link
                  to="/create"
                  className={`inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-violet-600/25 transition-colors duration-200 hover:bg-violet-700 ${FOCUS_RING}`}
                >
                  <Radio className="h-4 w-4" />
                  Create a room
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      <ScrollToTop />
    </main>
  );
}