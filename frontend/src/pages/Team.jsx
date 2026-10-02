// src/pages/Team.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Cable,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  Download,
  ExternalLink,
  FolderUp,
  Gauge,
  Github,
  Globe2,
  HardDrive,
  Layers3,
  Linkedin,
  ListChecks,
  LockKeyhole,
  Mail,
  Monitor,
  Network,
  Phone,
  QrCode,
  Radio,
  RefreshCw,
  Rocket,
  Server,
  ShieldCheck,
  Smartphone,
  Timer,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

import surajPhoto from '../assets/images/team/suraj.jpg';
import shubhamPhoto from '../assets/images/team/shubham.jpg';
import shivamPhoto from '../assets/images/team/shivam.jpg';

/* =========================================================
   DATA
   ---------------------------------------------------------
   CONTACT DETAILS: fill in email / phone / github / linkedin
   for each member. Any field left as '' is hidden
   automatically, so nothing broken or fake is ever shown.
   - email    : 'name@gmail.com'
   - phone    : '+919876543210'   (with country code)
   - github   : 'https://github.com/username'
   - linkedin : 'https://www.linkedin.com/in/username'
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

    contact: {
      email: '',
      phone: '',
      github: 'https://github.com/Suraj1819',
      linkedin: '',
    },

    description:
      'Built the core of WebDrop: the peer-to-peer transfer engine, and the integration between the frontend, the backend and the native apps.',

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
      'React',
      'JavaScript',
      'Node.js',
      'Express.js',
      'WebRTC',
      'Socket.IO',
      'Tailwind CSS',
      'Git',
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

    contact: {
      email: '',
      phone: '',
      github: '',
      linkedin: '',
    },

    description:
      'Designed and built the WebDrop interface, a clean and responsive experience that works across desktop and mobile in light and dark themes.',

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
      'React',
      'JavaScript',
      'Tailwind CSS',
      'HTML',
      'CSS',
      'Responsive Design',
      'UI Development',
      'Git',
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

    contact: {
      email: '',
      phone: '',
      github: '',
      linkedin: '',
    },

    description:
      'Built the server side of WebDrop: signaling, room management and the networking setup that lets two browsers find each other and connect.',

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
      'Node.js',
      'Express.js',
      'Socket.IO',
      'WebRTC',
      'REST APIs',
      'Networking',
      'JavaScript',
      'Git',
    ],
  },
];

const stats = [
  { value: '2', label: 'Devices per room' },
  { value: '5', label: 'Character room code' },
  { value: '30 min', label: 'Room lifetime' },
  { value: '64 KB', label: 'Chunk size' },
  { value: 'No limit', label: 'File size' },
  { value: '0 MB', label: 'Server storage' },
];

const architectureSteps = [
  {
    number: '01',
    icon: Radio,
    title: 'Create a room',
    text: 'The host creates a temporary room and gets a 5-character code.',
  },
  {
    number: '02',
    icon: QrCode,
    title: 'Share & join',
    text: 'The second device joins using the code, invite link or QR scan.',
  },
  {
    number: '03',
    icon: Server,
    title: 'Signaling',
    text: 'Socket.IO only exchanges the WebRTC offer, answer and ICE candidates.',
  },
  {
    number: '04',
    icon: Network,
    title: 'Direct connection',
    text: 'STUN finds a direct route; TURN is used as a fallback when needed.',
  },
  {
    number: '05',
    icon: Zap,
    title: 'DataChannel',
    text: 'File data flows browser-to-browser over an encrypted channel.',
  },
];

const pipeline = [
  {
    icon: ListChecks,
    title: 'Offer',
    text: 'The sender shares only the file details (name, size, type) under a unique transfer ID.',
  },
  {
    icon: CheckCircle2,
    title: 'Accept or reject',
    text: 'The receiver decides. No file data moves until the offer is accepted.',
  },
  {
    icon: Layers3,
    title: 'Chunked streaming',
    text: 'The file is read in 4 MB blocks and sent as 64 KB chunks, so large files never need to sit in memory at once on the sender.',
  },
  {
    icon: Gauge,
    title: 'Backpressure',
    text: 'The sender watches the DataChannel buffer and waits only when it is genuinely full, then resumes instantly.',
  },
  {
    icon: Timer,
    title: 'Live progress',
    text: 'The receiver acknowledges progress; speed and ETA are computed from real bytes over time, not from chunk size.',
  },
  {
    icon: RefreshCw,
    title: 'Complete or cancel',
    text: 'Cancelling one file only stops that file. The connection stays open for the next transfer.',
  },
];

const features = [
  {
    icon: Network,
    title: 'Peer-to-Peer',
    description:
      'Files are transferred directly between connected devices using WebRTC DataChannel.',
  },
  {
    icon: ShieldCheck,
    title: 'Private Transfer',
    description:
      'WebDrop does not upload the actual file to a central storage server.',
  },
  {
    icon: QrCode,
    title: 'QR Room Join',
    description:
      'Users can quickly join a transfer room by scanning the generated QR code or opening the invite link.',
  },
  {
    icon: Zap,
    title: 'Fast Transfer',
    description:
      'Chunked streaming with backpressure keeps the channel busy without exhausting browser memory.',
  },
  {
    icon: LockKeyhole,
    title: 'Encrypted Connection',
    description:
      'WebRTC connections use secure DTLS-based communication between peers.',
  },
  {
    icon: Smartphone,
    title: 'Cross Device',
    description:
      'Works across laptops, desktops and smartphones, in the browser or in the native apps.',
  },
  {
    icon: FolderUp,
    title: 'Files & Folders',
    description:
      'Choose multiple files or a whole folder, drag and drop them, or paste from the clipboard.',
  },
  {
    icon: Gauge,
    title: 'Live Speed & ETA',
    description:
      'Every transfer shows real-time progress, throughput and estimated time remaining.',
  },
  {
    icon: ListChecks,
    title: 'You Stay in Control',
    description:
      'The receiver can accept or reject each file, and either side can cancel a transfer at any time.',
  },
  {
    icon: RefreshCw,
    title: 'Reconnect Friendly',
    description:
      'If the peer drops, files are queued and resumed automatically when the connection comes back.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description:
      'Incoming-file toasts, optional browser notifications and a completion sound.',
  },
  {
    icon: Download,
    title: 'Desktop & Android Apps',
    description:
      'Download the Windows (.exe) or Android (.apk) app straight from the home page.',
  },
];

const roomControls = [
  'Host can lock the room so no new devices can join',
  'Host can remove a connected peer from the room',
  'Host can end the room for everyone at any time',
  'Guests can leave and rejoin while the room is still open',
  'Rooms are limited to two devices and expire after 30 minutes',
];

const privacyPoints = [
  'File data never touches the WebDrop server',
  'The signaling server only sees room codes and connection details',
  'All peer traffic is encrypted with DTLS',
  'If a TURN relay is needed, it only forwards encrypted packets',
  'No account or sign-up is required',
];

const techGroups = [
  {
    title: 'Frontend',
    icon: Monitor,
    items: ['React', 'Vite', 'JavaScript (JSX)', 'Tailwind CSS', 'React Router', 'Lucide Icons'],
  },
  {
    title: 'Backend',
    icon: Server,
    items: ['Node.js', 'Express.js', 'REST APIs', 'Room management'],
  },
  {
    title: 'Real-time & P2P',
    icon: Cable,
    items: ['WebRTC', 'DataChannel', 'Socket.IO', 'STUN / TURN', 'DTLS'],
  },
  {
    title: 'Tooling & Delivery',
    icon: Code2,
    items: ['Git', 'GitHub', 'Android app (.apk)', 'Windows app (.exe)'],
  },
];

const platforms = [
  { icon: Globe2, name: 'Web', detail: 'Any modern browser', tag: 'Live' },
  { icon: Smartphone, name: 'Android', detail: '.apk · v1.0.0', tag: 'v1.0.0' },
  { icon: Monitor, name: 'Windows', detail: '.exe · v1.0.0', tag: 'v1.0.0' },
];

// Edit this list to match your real roadmap
const futureScope = [
  'Resume interrupted transfers instead of restarting',
  'Stream received files directly to disk for very large files',
  'Rooms with more than two devices',
  'iOS and macOS apps',
  'Self-hosted TURN for faster transfers across different networks',
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
  ].filter(Boolean);
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p
        className="mb-3 text-[10px] font-bold uppercase text-purple-500"
        style={{ letterSpacing: '0.22em' }}
      >
        {eyebrow}
      </p>

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
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
    </div>
  );
}

const CARD =
  'rounded-[28px] border border-slate-200 bg-white dark:border-surface-border dark:bg-surface-card';

const SOFT_CARD =
  'rounded-2xl border border-slate-200 bg-white dark:border-surface-border dark:bg-white/[0.03]';

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/25';

/* Compact icon buttons (used on the member card) */
function ContactIcons({ member }) {
  const links = getContactLinks(member.contact);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {links.map(({ key, label, icon: Icon, href, external }) => (
        <a
          key={key}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          aria-label={`${label} ${member.name}`}
          title={label}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-surface-border dark:bg-white/[0.04] dark:text-slate-400 ${FOCUS_RING}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </a>
      ))}
    </div>
  );
}

/* Labelled buttons (used inside the profile modal) */
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
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-surface-border dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-purple-400/30 dark:hover:bg-purple-500/10 dark:hover:text-purple-300 ${FOCUS_RING}`}
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
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-surface-border dark:bg-surface-card">
      {/* PROFILE (opens modal) */}
      <button
        type="button"
        onClick={() => onOpen(member)}
        aria-label={`View ${member.name}'s full profile`}
        className={`w-full flex-1 rounded-t-[28px] p-5 text-left sm:p-6 ${FOCUS_RING}`}
      >
        {/* PHOTO */}
        <div className="mx-auto mb-5 h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-100 dark:border-surface-card dark:bg-slate-800">
          <img
            src={member.photo}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        {/* BASIC INFO */}
        <div className="text-center">
          <h3 className="font-heading text-[19px] font-bold tracking-tight text-slate-900 dark:text-white">
            {member.name}
          </h3>

          <p className="mt-1 text-[13px] font-semibold text-purple-600 dark:text-purple-400">
            {member.role}
          </p>

          <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
            {member.focus}
          </p>
        </div>

        {/* DETAILS */}
        <div className="mt-5 space-y-2.5 rounded-2xl border border-slate-100 p-4 dark:border-white/[0.06]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-medium text-slate-400">Registration no.</span>
            <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              {member.regNo}
            </span>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-medium text-slate-400">Branch</span>
            <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              {member.shortBranch}
            </span>
          </div>
        </div>

        {/* CONTRIBUTIONS PREVIEW */}
        <ul className="mt-5 space-y-2">
          {member.contributions.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
                strokeWidth={2.4}
              />
              <span className="text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
          <span>View full profile</span>
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </div>
      </button>

      {/* CONTACT ROW */}
      {hasContacts && (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <ContactIcons member={member} />
        </div>
      )}
    </article>
  );
}

function MemberModal({ member, onClose }) {
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

  if (!member) return null;

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
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-surface-border dark:bg-surface-card"
      >
        {/* CLOSE */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-purple-300 hover:text-purple-600 dark:border-surface-border dark:bg-white/[0.05] dark:text-slate-400 dark:hover:text-white ${FOCUS_RING}`}
        >
          <X className="h-4 w-4" />
        </button>

        {/* HEADER */}
        <div className="relative overflow-hidden border-b border-slate-200 p-6 dark:border-surface-border sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-200/50 blur-3xl dark:bg-purple-500/10" />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-purple-100 bg-slate-100 shadow-md dark:border-surface-border dark:bg-slate-800">
              <img
                src={member.photo}
                alt={member.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="font-heading text-[24px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                {member.name}
              </h2>

              <p className="mt-1 text-[14px] font-semibold text-purple-600 dark:text-purple-400">
                {member.role}
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                  Reg. no. {member.regNo}
                </span>

                <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                  {member.branch}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-7 p-6 sm:p-8">
          {/* CONTACT */}
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
              Get in touch
            </h3>
            <div className="mt-3">
              <ContactButtons member={member} />
            </div>
          </div>

          <div>
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">About</h3>
            <p className="mt-3 text-[14px] leading-7 text-slate-500 dark:text-slate-400">
              {member.description}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-purple-500" />
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
                What {member.name.split(' ')[0]} built
              </h3>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {member.contributions.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-[#FAF9FF] p-3 dark:border-surface-border dark:bg-white/[0.03]"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                    strokeWidth={2.2}
                  />
                  <span className="text-[12px] leading-5 text-slate-600 dark:text-slate-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-purple-500" />
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
                Technical skills
              </h3>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {member.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-purple-100 bg-purple-50/60 px-3 py-2 text-[12px] font-semibold text-purple-700 dark:border-purple-500/15 dark:bg-purple-500/10 dark:text-purple-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckList({ items }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
            strokeWidth={2.2}
          />
          <span className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function Team() {
  const [selectedMember, setSelectedMember] = useState(null);

  return (
    <main className="min-h-screen bg-[#FBFAFF] text-slate-900 transition-colors dark:bg-surface dark:text-white">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-surface-border">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-purple-200/50 blur-3xl dark:bg-purple-500/10" />
          <div className="absolute -bottom-40 -left-40 h-[380px] w-[380px] rounded-full bg-indigo-100/40 blur-3xl dark:bg-indigo-500/5" />
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-10">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-500 transition-all hover:border-purple-300 hover:text-purple-600 dark:border-surface-border dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
            />
            Back to WebDrop
          </Link>

          <div className="mx-auto mt-14 max-w-3xl text-center sm:mt-16">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 dark:border-purple-500/20 dark:bg-purple-500/10">
              <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-[12px] font-semibold text-purple-700 dark:text-purple-300">
                Project team
              </span>
            </div>

            <h1 className="font-heading text-[40px] font-extrabold leading-[0.98] tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[56px] lg:text-[68px]">
              Meet the people
              <span className="block bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                behind WebDrop.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-7 text-slate-500 dark:text-slate-400 sm:text-[16px]">
              WebDrop is a browser-based peer-to-peer file transfer application,
              built as a collaborative Computer Science &amp; Engineering project.
              Files go straight from one device to another over WebRTC, never
              through our servers.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: Globe2, label: 'Web application' },
                { icon: Network, label: 'Peer-to-peer' },
                { icon: Code2, label: 'CSE project' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 dark:border-surface-border dark:bg-white/[0.03] dark:text-slate-400"
                >
                  <Icon className="h-3.5 w-3.5 text-purple-500" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* STATS STRIP */}
          <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-surface-border dark:bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white px-4 py-5 text-center dark:bg-surface-card"
              >
                <p className="font-heading text-[20px] font-extrabold tracking-tight text-purple-600 dark:text-purple-400 sm:text-[22px]">
                  {s.value}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          TEAM MEMBERS
      ========================================================= */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <SectionHeading
          eyebrow="The Team"
          title="Three people. One project."
          description="Each member owned a clear part of WebDrop. Open a profile to see exactly what they built, or reach out directly."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <MemberCard key={member.id} member={member} onOpen={setSelectedMember} />
          ))}
        </div>
      </section>

      {/* =========================================================
          WORK DIVISION
      ========================================================= */}
      <section className="border-y border-slate-200 bg-white/60 dark:border-surface-border dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            eyebrow="Who Built What"
            title="How the work was divided."
            description="WebDrop has three layers: the interface, the server, and the transfer engine that connects them. Each of us took one."
          />

          <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.id} className={`${CARD} flex flex-col p-6`}>
                <div className="flex items-center gap-3.5">
                  <img
                    src={member.photo}
                    alt=""
                    className="h-12 w-12 rounded-full border border-purple-100 object-cover dark:border-surface-border"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="text-[12px] font-medium text-purple-600 dark:text-purple-400">
                      {member.focus}
                    </p>
                  </div>
                </div>

                <div className="my-5 h-px bg-slate-100 dark:bg-white/[0.06]" />

                <CheckList items={member.contributions} />

                <button
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className={`mt-6 inline-flex items-center gap-1.5 self-start rounded-lg text-[12px] font-semibold text-slate-500 transition-colors hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 ${FOCUS_RING}`}
                >
                  View profile
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PROJECT OVERVIEW
      ========================================================= */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            eyebrow="About WebDrop"
            title="Built for direct file transfer."
            description="WebDrop is designed around a simple idea: connect two devices and transfer files directly, without relying on traditional cloud file storage."
          />

          <div className="mx-auto mt-12 max-w-5xl">
            <div className={`${CARD} overflow-hidden`}>
              <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
                {/* LEFT */}
                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-500/10" />

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
                      <div className="rounded-xl border border-purple-100 bg-[#FAF9FF] p-4 dark:border-surface-border dark:bg-white/[0.03]">
                        <p className="text-[12px] font-bold text-slate-900 dark:text-white">
                          No cloud storage
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                          Transferred files are never stored on a central server.
                        </p>
                      </div>

                      <div className="rounded-xl border border-purple-100 bg-[#FAF9FF] p-4 dark:border-surface-border dark:bg-white/[0.03]">
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

                {/* RIGHT */}
                <div className="border-t border-slate-200 bg-[#FAF9FF] p-6 dark:border-surface-border dark:bg-white/[0.02] sm:p-8 lg:border-l lg:border-t-0">
                  <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    Project information
                  </p>

                  <div className="mt-6 space-y-5">
                    {[
                      { icon: Layers3, label: 'Project', value: 'WebDrop' },
                      { icon: Rocket, label: 'Version', value: '1.0.0' },
                      { icon: Users, label: 'Team size', value: '3 members' },
                      {
                        icon: Code2,
                        label: 'Domain',
                        value: 'Web Development & Networking',
                      },
                      {
                        icon: Network,
                        label: 'Core technology',
                        value: 'WebRTC DataChannel',
                      },
                      {
                        icon: Smartphone,
                        label: 'Platforms',
                        value: 'Web, Android, Windows',
                      },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
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

      {/* =========================================================
          ARCHITECTURE
      ========================================================= */}
      <section className="border-y border-slate-200 bg-white/60 dark:border-surface-border dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            eyebrow="Architecture"
            title="How WebDrop works."
            description="The signaling server helps peers discover each other, while the actual file data travels directly between the connected browsers."
          />

          <div className="mx-auto mt-12 max-w-6xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {architectureSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <div key={step.number} className={`${SOFT_CARD} relative p-5`}>
                    <div className="flex items-center justify-between">
                      <IconBox icon={Icon} />
                      <span className="font-mono text-[11px] font-bold tracking-widest text-purple-200 dark:text-purple-500/40">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-5 text-[14px] font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
                      {step.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 hidden items-center justify-center gap-2 md:flex">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-purple-300 dark:via-purple-500/20 dark:to-purple-500/20" />
              <div className="rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-[11px] font-semibold text-purple-600 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                Direct peer connection
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-purple-300 to-purple-300 dark:via-purple-500/20 dark:to-purple-500/20" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRANSFER PIPELINE
      ========================================================= */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            eyebrow="Transfer Engine"
            title="What happens to a file."
            description="Every file follows the same lifecycle, and each transfer is independent, so one cancelled file never breaks the next."
          />

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pipeline.map((step, i) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className={`${SOFT_CARD} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-900/10 dark:hover:border-purple-400/30 dark:hover:shadow-black/30`}
                >
                  <div className="flex items-center justify-between">
                    <IconBox icon={Icon} />
                    <span className="font-mono text-[11px] font-bold tracking-widest text-purple-200 dark:text-purple-500/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="mt-5 text-[14px] font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-[12px] leading-6 text-slate-500 dark:text-slate-400">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}
      <section className="border-y border-slate-200 bg-white/60 dark:border-surface-border dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
            eyebrow="Core Features"
            title="What the project delivers."
            description="A simple user experience built on browser-native networking technologies."
          />

          <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className={`${SOFT_CARD} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-900/10 dark:hover:border-purple-400/30 dark:hover:shadow-black/30`}
                >
                  <IconBox icon={Icon} />

                  <h3 className="mt-5 text-[14px] font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-[12px] leading-6 text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          ROOMS & PRIVACY
      ========================================================= */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
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

      {/* =========================================================
          TECHNOLOGY STACK
      ========================================================= */}
      <section className="border-y border-slate-200 bg-white/60 dark:border-surface-border dark:bg-white/[0.015]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <SectionHeading
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
                    <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
                      {group.title}
                    </h3>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-purple-100 bg-purple-50/60 px-2.5 py-1.5 text-[11px] font-semibold text-purple-700 dark:border-purple-500/15 dark:bg-purple-500/10 dark:text-purple-300"
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

      {/* =========================================================
          PLATFORMS + FUTURE SCOPE
      ========================================================= */}
      <section>
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
            {/* PLATFORMS */}
            <div className={`${CARD} p-6 sm:p-8`}>
              <IconBox icon={HardDrive} className="h-11 w-11" />
              <h3 className="mt-6 font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">
                Available platforms
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                Use WebDrop in the browser, or install the app on your device.
              </p>

              <div className="mt-5 space-y-3">
                {platforms.map(({ icon: Icon, name, detail, tag }) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#FAF9FF] p-3.5 dark:border-surface-border dark:bg-white/[0.03]"
                  >
                    <IconBox icon={Icon} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                        {name}
                      </p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">{detail}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      {tag}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-[13px] font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300 dark:hover:bg-purple-500/20"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
                Get the app from the home page
              </Link>
            </div>

            {/* FUTURE SCOPE */}
            <div className={`${CARD} p-6 sm:p-8`}>
              <IconBox icon={Rocket} className="h-11 w-11" />
              <h3 className="mt-6 font-heading text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">
                Future scope
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                Ideas we would like to build next.
              </p>

              <ul className="mt-5 space-y-3">
                {futureScope.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#FAF9FF] p-3.5 dark:border-surface-border dark:bg-white/[0.03]"
                  >
                    <Database className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <span className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          GITHUB / PROJECT CTA
      ========================================================= */}
      <section className="border-t border-slate-200 dark:border-surface-border">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-purple-500/20 bg-slate-950 px-6 py-12 text-center shadow-xl shadow-purple-900/20 sm:px-10">
            <div className="pointer-events-none absolute left-1/2 top-[-160px] h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-purple-500/25 blur-3xl" />
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
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-bold text-slate-900 transition-all hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(124,58,237,0.35)] transition-all hover:-translate-y-0.5 hover:bg-purple-700"
                >
                  <Radio className="h-4 w-4" />
                  Create a room
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MODAL
      ========================================================= */}
      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </main>
  );
}