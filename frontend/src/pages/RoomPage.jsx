import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Copy,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Download,
  Trash2,
  X,
  Wifi,
  WifiOff,
  ShieldCheck,
  CloudUpload,
  Paperclip,
  Laptop,
  Smartphone,
  Monitor,
  Tablet,
  Power,
  Lock,
  Unlock,
  Share2,
  RotateCcw,
  Clock,
  QrCode,
  FolderOpen,
  Send,
  Inbox,
  Activity,
  HardDrive,
  Zap,
  Users,
  RefreshCw,
  File,
  Plus,
  Home,
  AlertTriangle,
  AlertCircle,
  LogOut,
  Copy as CopyIcon,
  DownloadCloud,
  Eraser,
  Gauge,
  Info,
  Link as LinkIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SlidersHorizontal,
  List,
  Grid2X2,
  Eye,
  Folder,
  Timer,
  BarChart3,
  CheckSquare,
  Square,
  CircleDot,
  CircleCheck,
  CircleX,
  ChevronDown,
  ClipboardList,
} from 'lucide-react';

import {
  useRoom,
  getHostToken,
  clearHostToken,
  addRecentRoom,
} from '../context/RoomContext';

import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';

import { toast } from '../components/common/ToastContainer';
import PeerRadar from '../components/common/PeerRadar';
import ShareModal from '../components/common/ShareModal';
import ResizableSidebarLayout, {
  useResizableSidebar,
} from '../components/common/ResizableSidebarLayout';

import {
  detectDevice,
  detectDeviceInfo,
  formatBytes,
  formatETA,
  getFileCategory,
} from '../utils/fileUtils';

const LARGE_FILE_WARNING_BYTES = 500 * 1024 * 1024;

const LOW_TIME_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

const IGNORED_FILES = new Set([
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
]);

/* -------------------------------------------------------------------------- */
/* Date-time helpers                                                          */
/* -------------------------------------------------------------------------- */

function formatDateTime(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function isLowTime(expiresAt, now) {
  if (!expiresAt) return false;
  const remaining = new Date(expiresAt).getTime() - now;
  return remaining > 0 && remaining < LOW_TIME_THRESHOLD_MS;
}

/* -------------------------------------------------------------------------- */
/* Device helpers                                                             */
/* -------------------------------------------------------------------------- */

function getDeviceIcon(deviceName = '') {
  const name = String(deviceName).toLowerCase();

  if (
    name.includes('iphone') ||
    name.includes('android') ||
    name.includes('phone')
  ) {
    return Smartphone;
  }

  if (name.includes('ipad') || name.includes('tablet')) {
    return Tablet;
  }

  if (
    name.includes('windows') ||
    name.includes('mac') ||
    name.includes('linux') ||
    name.includes('desktop') ||
    name.includes('laptop') ||
    name.includes('pc')
  ) {
    return Laptop;
  }

  return Monitor;
}

function getDeviceTypeFromInfo(deviceInfo = {}, deviceName = '') {
  const values = [
    deviceInfo?.platform,
    deviceInfo?.os,
    deviceInfo?.system,
    deviceInfo?.deviceType,
    deviceInfo?.type,
    deviceInfo?.category,
    deviceInfo?.name,
    deviceName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    values.includes('iphone') ||
    values.includes('ios') ||
    values.includes('ipad')
  ) {
    return values.includes('ipad') ? 'tablet' : 'phone';
  }

  if (
    values.includes('android') ||
    values.includes('mobile') ||
    values.includes('phone')
  ) {
    return 'phone';
  }

  if (
    values.includes('windows') ||
    values.includes('macos') ||
    values.includes('mac os') ||
    values.includes('linux') ||
    values.includes('desktop') ||
    values.includes('pc') ||
    values.includes('laptop') ||
    values.includes('chromeos') ||
    values.includes('chrome os')
  ) {
    return 'desktop';
  }

  if (values.includes('tablet') || values.includes('ipad')) {
    return 'tablet';
  }

  return 'unknown';
}

function getDeviceIconFromInfo(deviceInfo = {}, deviceName = '') {
  const type = getDeviceTypeFromInfo(deviceInfo, deviceName);

  if (type === 'phone') return Smartphone;
  if (type === 'tablet') return Tablet;
  if (type === 'desktop') return Laptop;

  return getDeviceIcon(deviceName);
}

function parseAndroidVersion(deviceInfo = {}) {
  const candidates = [
    deviceInfo?.userAgent,
    deviceInfo?.ua,
    deviceInfo?.platform,
    deviceInfo?.os,
    deviceInfo?.system,
    deviceInfo?.osVersion,
    deviceInfo?.version,
  ]
    .filter(Boolean)
    .map((v) => String(v));

  for (const raw of candidates) {
    const m = raw.match(/android[\s/]+([\d.]+)/i);
    if (m && m[1]) {
      const parts = m[1].split('.');
      const trimmed =
        parts.length > 1 && /^0+$/.test(parts[1]) ? parts[0] : m[1];
      return trimmed;
    }
  }

  return null;
}

function getDeviceLabel(deviceInfo = {}, deviceName = '') {
  const platform = String(
    deviceInfo?.platform || deviceInfo?.os || deviceInfo?.system || '',
  ).toLowerCase();

  const type = getDeviceTypeFromInfo(deviceInfo, deviceName);

  if (
    platform.includes('windows') ||
    platform.includes('win32') ||
    platform.includes('win64')
  ) {
    return 'Windows PC';
  }

  if (
    platform.includes('macos') ||
    platform.includes('mac os') ||
    platform.includes('darwin')
  ) {
    return 'Mac';
  }

  if (platform.includes('linux')) return 'Linux PC';

  if (platform.includes('chromeos') || platform.includes('chrome os')) {
    return 'ChromeOS PC';
  }

  if (platform.includes('android')) {
    const version = parseAndroidVersion(deviceInfo);
    if (version) return `Android ${version}`;
    return 'Android device';
  }

  if (platform.includes('ios')) {
    const name = String(
      deviceInfo?.model || deviceInfo?.name || deviceName,
    ).toLowerCase();

    return name.includes('ipad') ? 'iPad' : 'iPhone';
  }

  const androidVersion = parseAndroidVersion(deviceInfo);
  if (androidVersion && type === 'phone') {
    return `Android ${androidVersion}`;
  }

  if (type === 'desktop') return 'Computer';
  if (type === 'tablet') return 'Tablet';
  if (type === 'phone') return 'Mobile device';

  return deviceName || deviceInfo?.name || 'Connected device';
}

/* -------------------------------------------------------------------------- */
/* File helpers                                                               */
/* -------------------------------------------------------------------------- */

function getFileExtension(file = {}) {
  const name = file?.name || file?.fileName || '';
  const cleanName = name.split('?')[0].split('#')[0];
  const parts = cleanName.split('.');

  if (parts.length < 2) return '';

  return parts.pop().toLowerCase();
}

function getFileTypeMeta(file = {}) {
  const mime = String(file?.mimeType || file?.type || '').toLowerCase();
  const extension = getFileExtension(file);
  const category = getFileCategory(mime);

  if (mime === 'application/pdf' || extension === 'pdf') {
    return {
      type: 'pdf',
      label: 'PDF',
      Icon: FileText,
      wrapper: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
      badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    };
  }

  if (category === 'image' || mime.startsWith('image/')) {
    return {
      type: 'image',
      label: 'Image',
      Icon: FileImage,
      wrapper: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    };
  }

  if (category === 'video' || mime.startsWith('video/')) {
    return {
      type: 'video',
      label: 'Video',
      Icon: FileVideo,
      wrapper:
        'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
      badge:
        'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    };
  }

  if (category === 'audio' || mime.startsWith('audio/')) {
    return {
      type: 'audio',
      label: 'Audio',
      Icon: FileAudio,
      wrapper: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400',
      badge:
        'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
    };
  }

  if (
    category === 'archive' ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)
  ) {
    return {
      type: 'archive',
      label: 'Archive',
      Icon: FileArchive,
      wrapper:
        'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
      badge:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };
  }

  return {
    type: 'document',
    label: extension ? extension.toUpperCase() : 'File',
    Icon: File,
    wrapper:
      'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
  };
}

function FileTypeIcon({ file }) {
  const meta = getFileTypeMeta(file);
  const Icon = meta.Icon;

  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.wrapper}`}
    >
      <Icon size={19} />

      <span
        className={`absolute -bottom-1 -right-1 rounded px-1 py-[1px] text-[7px] font-extrabold leading-none ${meta.badge}`}
      >
        {meta.label.length > 7 ? meta.label.slice(0, 6) : meta.label}
      </span>
    </div>
  );
}

function statusLabelText(status = '') {
  if (['completed', 'success', 'done'].includes(status)) return 'Completed';
  if (['failed', 'error'].includes(status)) return 'Failed';
  if (['cancelled', 'canceled', 'rejected'].includes(status)) return 'Cancelled';
  if (['sending', 'receiving', 'transferring', 'active'].includes(status)) return 'In progress';
  return 'Waiting';
}

function formatSpeed(bytesPerSecond = 0) {
  if (!bytesPerSecond || bytesPerSecond <= 0) {
    return '—';
  }

  return `${formatBytes(bytesPerSecond)}/s`;
}

function getConnectionQuality(speedBytesPerSec, connected) {
  if (!connected) {
    return { label: 'Disconnected', tone: 'red', level: 0 };
  }
  if (!speedBytesPerSec || speedBytesPerSec <= 0) {
    return { label: 'Idle', tone: 'slate', level: 0 };
  }

  const mbps = speedBytesPerSec / (1024 * 1024);

  if (mbps >= 5) return { label: 'Excellent', tone: 'emerald', level: 4 };
  if (mbps >= 1.5) return { label: 'Good', tone: 'emerald', level: 3 };
  if (mbps >= 0.5) return { label: 'Fair', tone: 'amber', level: 2 };
  return { label: 'Poor', tone: 'red', level: 1 };
}

/* -------------------------------------------------------------------------- */
/* Folder helpers                                                             */
/* -------------------------------------------------------------------------- */

function withRelativePath(file, relativePath = '') {
  if (!file) return file;

  const path = relativePath || file.webkitRelativePath || file.name;

  try {
    Object.defineProperty(file, 'relativePath', {
      value: path,
      configurable: true,
      writable: true,
    });
  } catch {
    try {
      file.relativePath = path;
    } catch {
      // Ignore readonly File objects.
    }
  }

  return file;
}

async function walkEntry(entry, parentPath = '') {
  if (!entry) return [];

  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => {
        if (IGNORED_FILES.has(file.name)) {
          resolve([]);
          return;
        }

        const relativePath = parentPath
          ? `${parentPath}/${file.name}`
          : file.name;

        resolve([withRelativePath(file, relativePath)]);
      });
    });
  }

  if (entry.isDirectory) {
    const reader = entry.createReader();
    const entries = [];

    const readEntries = () =>
      new Promise((resolve, reject) => {
        reader.readEntries((batch) => {
          if (!batch.length) {
            resolve();
            return;
          }

          entries.push(...batch);

          readEntries().then(resolve, reject);
        }, reject);
      });

    await readEntries();

    const currentPath = parentPath
      ? `${parentPath}/${entry.name}`
      : entry.name;

    const files = [];

    for (const child of entries) {
      const nested = await walkEntry(child, currentPath);
      files.push(...nested);
    }

    return files;
  }

  return [];
}

async function collectDroppedFiles(dataTransfer) {
  const files = [];

  if (!dataTransfer) return files;

  const items = Array.from(dataTransfer.items || []);

  if (items.length) {
    for (const item of items) {
      if (item.kind !== 'file') continue;

      const entry = item.webkitGetAsEntry?.();

      if (entry) {
        const nested = await walkEntry(entry);
        files.push(...nested);
      } else {
        const file = item.getAsFile?.();
        if (file && !IGNORED_FILES.has(file.name)) {
          files.push(withRelativePath(file));
        }
      }
    }

    return files;
  }

  return Array.from(dataTransfer.files || [])
    .filter((file) => !IGNORED_FILES.has(file.name))
    .map((file) => withRelativePath(file));
}

function collectInputFiles(fileList) {
  return Array.from(fileList || [])
    .filter((file) => !IGNORED_FILES.has(file.name))
    .map((file) =>
      withRelativePath(file, file.webkitRelativePath || file.name),
    );
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition dark:border-slate-800 dark:bg-[#0f1115]">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
          <Icon size={16} />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>

      <p className="truncate text-lg font-bold text-slate-900 dark:text-white">
        {value}
      </p>

      {subtext && (
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-500">
          {subtext}
        </p>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800/70">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
          <Icon size={15} />
        </div>

        <span className="truncate text-sm text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>

      <span className="max-w-[60%] truncate text-right text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}

function EmptyQueue({ type, onShare }) {
  const incoming = type === 'incoming';

  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center dark:border-slate-800 dark:bg-slate-900/20">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800/80 dark:text-slate-500">
        {incoming ? <Inbox size={20} /> : <Send size={20} />}
      </div>

      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {incoming ? 'No incoming files' : 'No outgoing files'}
      </p>

      <p className="mt-1.5 max-w-xs text-[11px] leading-5 text-slate-500 dark:text-slate-500">
        {incoming
          ? 'Files received from the peer will appear here.'
          : 'Drag files into the drop zone above, paste, or choose files.'}
      </p>

      {!incoming && onShare && (
        <button
          type="button"
          onClick={onShare}
          className="mt-4 inline-flex h-9 w-full max-w-[220px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 active:scale-[0.98] dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400 sm:h-8 sm:w-auto sm:text-[10px]"
        >
          <Paperclip size={12} />
          Choose files
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Speedometer / connection indicator                                         */
/* -------------------------------------------------------------------------- */

function SpeedometerIndicator({ quality }) {
  const angle = useMemo(() => {
    const clamped = Math.max(0, Math.min(4, quality.level));
    return -70 + (clamped / 4) * 140;
  }, [quality.level]);

  const toneColor =
    quality.tone === 'emerald'
      ? 'text-emerald-500'
      : quality.tone === 'amber'
        ? 'text-amber-500'
        : quality.tone === 'red'
          ? 'text-red-500'
          : 'text-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold ${toneColor} transition-colors`}
      title={`Link: ${quality.label}`}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <Gauge size={14} />
        <span
          className="absolute left-1/2 top-1/2 h-[7px] w-[1.5px] origin-bottom rounded-full"
          style={{
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            transformOrigin: '50% 100%',
            backgroundColor: 'currentColor',
            transition: 'transform 400ms ease',
          }}
        />
      </span>
      {quality.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* File row                                         */
/* -------------------------------------------------------------------------- */

function EnhancedFileRow({
  file,
  direction,
  selected,
  onToggleSelect,
  onAccept,
  onReject,
  onDownload,
  onRetry,
  onCancel,
  onRemove,
  onCopyName,
  onDetails,
  compact = false,
}) {
  const isIncoming = direction === 'incoming';
  const status = file?.status || 'pending';
  const isPending = ['pending', 'waiting', 'offer'].includes(status);
  const isActive = ['sending', 'receiving', 'transferring', 'active'].includes(status);
  const isCompleted = ['completed', 'success', 'done'].includes(status);
  const isFailed = ['failed', 'error'].includes(status);
  const isCancelled = ['cancelled', 'canceled', 'rejected'].includes(status);
  const transferred = isIncoming
    ? Number(file?.bytesReceived || file?.receivedBytes || 0)
    : Number(file?.bytesSent || file?.sentBytes || 0);
  const calculatedProgress = file?.size > 0 ? (transferred / file.size) * 100 : 0;
  const progress = Math.min(100, Math.max(0, isCompleted ? 100 : Math.max(Number(file?.progress || 0), calculatedProgress)));
  const speed = Number(file?.speed || file?.bytesPerSecond || 0);
  const eta = Number(file?.eta || file?.remainingTime || 0);
  const fileId = file?.fileId || file?.id;
  const meta = getFileTypeMeta(file);
  const Icon = meta.Icon;
  const [showDetails, setShowDetails] = useState(false);
  const detailRows = [
    ['Type', file?.mimeType || file?.type || meta.label],
    ['Size', formatBytes(file?.size || 0)],
    ['Direction', isIncoming ? 'Received' : 'Sent'],
    ['Status', statusLabelText(status)],
    ['Transferred', `${formatBytes(transferred)} (${Math.round(progress)}%)`],
    ['Speed', formatSpeed(speed)],
    ['Path', file?.relativePath || file?.name || '—'],
  ];

  const statusLabel = isActive
    ? isIncoming ? 'Receiving' : 'Sending'
    : isPending
      ? isIncoming ? 'Waiting for approval' : 'Queued'
      : isCompleted
        ? 'Completed'
        : isFailed
          ? 'Transfer failed'
          : isCancelled
            ? 'Cancelled'
            : status;

  const statusClass = isActive
    ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400'
    : isPending
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
      : isCompleted
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
        : isFailed || isCancelled
          ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className={`group rounded-2xl border bg-white p-3 shadow-sm transition dark:bg-[#0f1115] ${selected ? 'border-violet-400 ring-2 ring-violet-500/10 dark:border-violet-500' : 'border-slate-200 hover:border-violet-200 dark:border-slate-800 dark:hover:border-violet-500/30'}`}>
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={() => onToggleSelect?.(fileId)}
          className="mt-2 shrink-0 text-slate-300 transition hover:text-violet-600 dark:text-slate-700 dark:hover:text-violet-400"
          aria-label={selected ? 'Deselect file' : 'Select file'}
        >
          {selected ? <CheckSquare size={17} className="text-violet-600 dark:text-violet-400" /> : <Square size={17} />}
        </button>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.wrapper}`}>
          <Icon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 break-words text-xs font-bold leading-5 text-slate-900 dark:text-white sm:truncate" title={file?.name}>
              {file?.name || 'Unnamed file'}
            </p>
            <span className="shrink-0 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {formatBytes(file?.size || 0)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${statusClass}`}>
              {statusLabel}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {meta.label}
            </span>
            {file?.relativePath && file.relativePath !== file.name && (
              <span className="max-w-[220px] truncate text-[9px] text-slate-400 dark:text-slate-500" title={file.relativePath}>
                {file.relativePath}
              </span>
            )}
          </div>

          {isActive && (
            <>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full transition-[width] duration-200 ${isIncoming ? 'bg-blue-500' : 'bg-violet-600'}`} style={{ width: `${progress}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-[9px] font-bold text-slate-500 dark:text-slate-400">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-slate-400 dark:text-slate-500">
                <span>{formatBytes(transferred)} / {formatBytes(file?.size || 0)}</span>
                <span>{speed > 0 ? formatSpeed(speed) : '—'} {eta > 0 ? `· ${formatETA(eta)}` : ''}</span>
              </div>
            </>
          )}

          {isCompleted && (
            <div className="mt-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              {isIncoming ? 'Ready to download' : 'Delivered to peer'}
            </div>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <button type="button" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails} className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 ${showDetails ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' : 'text-slate-400'}`} title="View file details" aria-label="View file details">
            <Eye size={14} />
          </button>
          <button type="button" onClick={() => onCopyName?.(file?.name)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800 dark:hover:text-violet-400" title="Copy filename">
            <CopyIcon size={14} />
          </button>
          {isPending && isIncoming && (
            <>
              <button type="button" onClick={() => onReject?.(fileId)} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><X size={12} />Reject</button>
              <button type="button" onClick={() => onAccept?.(fileId)} className="flex h-8 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-[10px] font-bold text-white transition hover:bg-violet-700"><CheckCircle size={12} />Accept</button>
            </>
          )}
          {isActive && <button type="button" onClick={() => onCancel?.(fileId)} className="flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-[10px] font-bold text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-500/10"><X size={12} />Cancel</button>}
          {isCompleted && isIncoming && <button type="button" onClick={() => onDownload?.(fileId)} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-200"><Download size={13} />Download</button>}
          {isFailed && <button type="button" onClick={() => onRetry?.(fileId)} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"><RotateCcw size={12} />Retry</button>}
          {!isActive && !isPending && <button type="button" onClick={() => onRemove?.(fileId, direction)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" title="Remove"><Trash2 size={13} /></button>}
        </div>

      </div>

      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
        {isPending && isIncoming && (
          <>
            <button type="button" onClick={() => onAccept?.(fileId)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-[10px] font-bold text-white"><CheckCircle size={13} />Accept</button>
            <button type="button" onClick={() => onReject?.(fileId)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[10px] font-bold dark:border-slate-700"><X size={13} />Reject</button>
          </>
        )}
        {isActive && <button type="button" onClick={() => onCancel?.(fileId)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 text-[10px] font-bold text-red-500 dark:border-red-900/50"><X size={13} />Cancel</button>}
        {isCompleted && isIncoming && <button type="button" onClick={() => onDownload?.(fileId)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[10px] font-bold dark:border-slate-700"><Download size={13} />Download</button>}
        {isFailed && <button type="button" onClick={() => onRetry?.(fileId)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[10px] font-bold dark:border-slate-700"><RotateCcw size={13} />Retry</button>}
      </div>

      {showDetails && (
        <div className="mt-3 hidden rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-1 dark:border-slate-800 dark:bg-slate-900/50 xl:block">
          {detailRows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
              <span className="max-w-[70%] break-all text-right text-[11px] font-semibold text-slate-800 dark:text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirmation modal                                                         */
/* -------------------------------------------------------------------------- */

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0f1115]">
        <div className="p-6">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
              destructive
                ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
            }`}
          >
            {destructive ? (
              <AlertTriangle size={26} />
            ) : (
              <ShieldCheck size={26} />
            )}
          </div>

          <h2 className="text-center text-lg font-extrabold text-slate-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
            {message}
          </p>
        </div>

        <div className="flex gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl text-xs font-bold text-white transition ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Removed / Kicked modal (intermediate phase)                                */
/* -------------------------------------------------------------------------- */

function KickedModal({ open, reason, roomCode, onConfirm }) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') onConfirm?.();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onConfirm]);

  if (!open) return null;

  const isEnded = reason === 'ended';
  const isKicked = reason === 'kicked';

  const title = isEnded
    ? 'Room Ended'
    : isKicked
      ? 'Removed from Room'
      : 'Disconnected';

  const message = isEnded
    ? 'The host has ended this room. All transfers have been stopped.'
    : isKicked
      ? 'The host removed you from this room. You can no longer send or receive files.'
      : 'You have been disconnected from this room.';

  const subMessage = isEnded
    ? 'You can create a new room or join another one.'
    : isKicked
      ? 'If you believe this was a mistake, ask the host for a new invite.'
      : 'Please rejoin to continue.';

  const iconBg = isEnded
    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    : isKicked
      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
      : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400';

  const Icon = isEnded ? Power : isKicked ? LogOut : XCircle;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0f1115]">
        <div
          className={`h-1.5 w-full ${
            isEnded
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500'
              : isKicked
                ? 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500'
                : 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500'
          }`}
        />

        <div className="p-6">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}
          >
            <Icon size={26} />
          </div>

          <p
            className={`text-center text-[10px] font-extrabold uppercase tracking-[0.2em] ${
              isEnded
                ? 'text-amber-600 dark:text-amber-400'
                : isKicked
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            WebDrop session
          </p>

          <h2 className="mt-2 text-center text-lg font-extrabold text-slate-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
            {message}
          </p>

          <p className="mt-1.5 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
            {subMessage}
          </p>

          {roomCode && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Room code
                  </p>

                  <p className="mt-1 font-mono text-base font-extrabold tracking-[0.2em] text-slate-700 dark:text-slate-200">
                    {roomCode}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                    isEnded
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      : isKicked
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
                  }`}
                >
                  {isEnded ? 'Ended' : isKicked ? 'Kicked' : 'Closed'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Home size={15} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function RoomPage() {
  const { roomCode: urlCode } = useParams();
  const navigate = useNavigate();

  const {
    socket,
    deviceName: ctxDeviceName,
    deviceInfo: ctxDeviceInfo,
    setRoomCode,
    setRole,
    role,
    users,
    setUsers,
    locked,
    setLocked,
    setNavLocked,
    rejoinNonce,
  } = useRoom();

  const deviceName = ctxDeviceName || detectDevice();
  const deviceInfo = ctxDeviceInfo || detectDeviceInfo();
  const roomCode = (urlCode || '').toUpperCase();

  const sidebar = useResizableSidebar();

  const [joining, setJoining] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [roomExpired, setRoomExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [fileSearch, setFileSearch] = useState('');
  const [fileFilter, setFileFilter] = useState('all');
  const [fileSort, setFileSort] = useState('newest');
  const [fileView, setFileView] = useState('list');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [activity, setActivity] = useState([]);
  const [incomingOfferToast, setIncomingOfferToast] = useState(null);

  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const [removedPhase, setRemovedPhase] = useState(null);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const qrRef = useRef(null);
  const joinedRef = useRef(false);
  const disconnectingRef = useRef(false);
  const hostTokenRef = useRef(getHostToken(roomCode));

  const setUsersRef = useRef(setUsers);
  const setLockedRef = useRef(setLocked);
  const setExpiresAtRef = useRef(setExpiresAt);
  const setCreatedAtRef = useRef(setCreatedAt);
  const setRoomExpiredRef = useRef(setRoomExpired);
  const setRoomErrorRef = useRef(setRoomError);

  useEffect(() => {
    setUsersRef.current = setUsers;
    setLockedRef.current = setLocked;
    setExpiresAtRef.current = setExpiresAt;
    setCreatedAtRef.current = setCreatedAt;
    setRoomExpiredRef.current = setRoomExpired;
    setRoomErrorRef.current = setRoomError;
  }, [setUsers, setLocked]);

  const notifiedIncomingRef = useRef(new Set());
  const activitySnapshotRef = useRef(new Map());

  const pushActivity = useCallback((message, tone = 'violet') => {
    setActivity((items) => [
      { id: `${Date.now()}-${Math.random()}`, message, tone, time: Date.now() },
      ...items,
    ].slice(0, 30));
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Join                                                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!socket || !roomCode) return;
    if (joinedRef.current) return;

    let mounted = true;

    const joinRoom = () => {
      if (!mounted || !socket.connected) return;

      setJoining(true);
      setRoomError('');
      setRoomExpired(false);

      socket.emit(
        'join-room',
        {
          roomCode,
          deviceName,
          deviceInfo,
          hostToken: hostTokenRef.current || null,
        },
        (response) => {
          if (!mounted) return;

          if (!response?.success) {
            setJoining(false);
            setRoomError(response?.message || 'Unable to join room.');
            return;
          }

          joinedRef.current = true;

          const room = response.room || response;
          const roomUsers = room.users || [];
          const currentUser = roomUsers.find(
            (user) => user.socketId === socket.id,
          );
          const detectedRole = currentUser?.isHost ? 'host' : 'guest';

          setRoomCode(roomCode);
          setRole(detectedRole);
          setUsersRef.current(roomUsers);
          setLockedRef.current(Boolean(room.locked));

          if (room.expiresAt) setExpiresAtRef.current(room.expiresAt);

          if (room.createdAt) {
            setCreatedAtRef.current(room.createdAt);
          } else if (room.expiresAt) {
            setCreatedAtRef.current(
              new Date(
                new Date(room.expiresAt).getTime() - 30 * 60 * 1000,
              ).toISOString(),
            );
          }

          // Persist on THIS device only — host or guest from join response
          try {
            addRecentRoom?.({
              roomCode,
              role: detectedRole === 'host' ? 'host' : 'guest',
              deviceName,
              joinedAt: Date.now(),
            });
          } catch {
            // Recent-room persistence must never block joining
          }

          setTimeout(() => {
            if (mounted) setJoining(false);
          }, 300);
        },
      );
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    const fallback = setTimeout(() => {
      if (mounted && !joinedRef.current) {
        setJoining(false);
        setRoomError('Unable to connect to the room server.');
      }
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(fallback);
      socket.off('connect', joinRoom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomCode, deviceName]);

  useEffect(() => {
    setNavLocked?.(true);

    const handleBeforeUnload = (event) => {
      if (disconnectingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setNavLocked?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* Always open Room page from the top (never mid-page) */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollTop();

    // Prevent browser restoring previous scroll position on SPA navigations
    const previous = window.history.scrollRestoration;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Re-assert after layout / join spinner settles
    const t1 = window.setTimeout(scrollTop, 50);
    const t2 = window.setTimeout(scrollTop, 300);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if ('scrollRestoration' in window.history && previous) {
        window.history.scrollRestoration = previous;
      }
    };
  }, [roomCode]);

  // After join completes, ensure we are still at the top
  useEffect(() => {
    if (joining) return;
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [joining]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!expiresAt || roomExpired) return;

    const remaining = new Date(expiresAt).getTime() - now;

    if (remaining <= 0) {
      clearHostToken(roomCode);
      setRoomExpiredRef.current(true);
      setRoomErrorRef.current('');
      setUsersRef.current([]);
      setLockedRef.current(false);
      toast.error('This room has expired.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, now, roomExpired, roomCode]);

  /* ------------------------------------------------------------------------ */
  /* Room socket events                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!socket) return;

    const handleUsers = (room) => {
      if (!room) return;
      if (room.users) setUsersRef.current(room.users);
      if (typeof room.locked === 'boolean') setLockedRef.current(room.locked);
      if (room.expiresAt) setExpiresAtRef.current(room.expiresAt);
      if (room.createdAt) setCreatedAtRef.current(room.createdAt);
    };

    const handleUserJoined = (payload) => {
      if (payload?.users) setUsersRef.current(payload.users);
      if (typeof payload?.locked === 'boolean')
        setLockedRef.current(payload.locked);
      if (payload?.expiresAt) setExpiresAtRef.current(payload.expiresAt);
      if (payload?.createdAt) setCreatedAtRef.current(payload.createdAt);
    };

    const handleUserLeft = (payload) => {
      if (payload?.users) setUsersRef.current(payload.users);
    };

    const handleRoomLock = (payload) => {
      if (typeof payload?.locked === 'boolean')
        setLockedRef.current(payload.locked);
    };

    const handleRoomExpired = () => {
      clearHostToken(roomCode);
      setRoomExpiredRef.current(true);
      setRoomErrorRef.current('');
      setUsersRef.current([]);
      setLockedRef.current(false);
      toast.error('This room has expired.');
    };

    const handleRoomEnded = () => {
      if (disconnectingRef.current) return;

      clearHostToken(roomCode);

      try {
        socket.emit('leave-room', { roomCode });
      } catch {
        // ignore
      }

      if (role === 'host') {
        disconnectingRef.current = true;
        navigate('/', { replace: true });
        return;
      }

      setRemovedPhase('ended');
    };

    const handleKicked = () => {
      if (disconnectingRef.current) return;

      clearHostToken(roomCode);

      try {
        socket.emit('leave-room', { roomCode });
      } catch {
        // ignore
      }

      setRemovedPhase('kicked');
    };

    socket.on('room-state', handleUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('room-lock-changed', handleRoomLock);
    socket.on('room-expired', handleRoomExpired);
    socket.on('room-ended', handleRoomEnded);
    socket.on('kicked', handleKicked);

    return () => {
      socket.off('room-state', handleUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('room-lock-changed', handleRoomLock);
      socket.off('room-expired', handleRoomExpired);
      socket.off('room-ended', handleRoomEnded);
      socket.off('kicked', handleKicked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomCode, navigate, role]);

  const requestNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotifyEnabled(true);
      return true;
    }

    if (Notification.permission === 'denied') return false;

    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setNotifyEnabled(enabled);
      return enabled;
    } catch {
      return false;
    }
  }, []);

  const transferRef = useRef(null);

  const onIncomingData = useCallback((event) => {
    transferRef.current?.handleIncomingData(event);
  }, []);

  const webrtc = useWebRTC({
    socket,
    roomCode,
    role,
    onIncomingData,
    rejoinNonce,
  });

  const transfer = useFileTransfer({
    getDataChannel: webrtc.getDataChannel,
    dataChannelOpen: webrtc.dataChannelOpen,
  });

  transferRef.current = transfer;

  const peer = useMemo(() => {
    return users?.find((user) => user.socketId !== socket?.id) || null;
  }, [users, socket]);

  const peerCount = users?.length || 0;
  const connected = Boolean(webrtc.dataChannelOpen && peer);
  const peerSocketId = peer?.socketId || null;

  const [peerReveal, setPeerReveal] = useState('idle');
  const peerVisible = Boolean(peer);

  useEffect(() => {
    if (!peer) {
      setPeerReveal('idle');
      return;
    }

    setPeerReveal('listening');
    const timer1 = setTimeout(() => setPeerReveal('fetching'), 800);
    const timer2 = setTimeout(() => setPeerReveal('ready'), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerSocketId]);

  useEffect(() => {
    if (!peerSocketId) {
      transferRef.current?.markPeerDisconnected?.();
    }
  }, [peerSocketId]);

  const previousConnected = useRef(false);

  useEffect(() => {
    if (connected && !previousConnected.current) {
      toast.success('Secure connection established.');
    }

    if (!connected && previousConnected.current && peer) {
      toast.error('Connection lost.');
    }

    previousConnected.current = connected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, peerSocketId]);

  useEffect(() => {
    if (role !== 'host' || !peer || peerReveal !== 'ready') return;
    if (webrtc.connectionState === 'new') webrtc.startAsHost?.();
  }, [role, peer, peerReveal, webrtc.connectionState, webrtc.startAsHost]);

  const handleToggleLock = useCallback(() => {
    if (role !== 'host' || !socket) return;

    const previous = Boolean(locked);
    const next = !previous;

    setLocked(next);

    socket.emit(
      'set-room-lock',
      {
        roomCode,
        locked: next,
        hostToken: hostTokenRef.current,
      },
      (response) => {
        if (response?.success === false) {
          setLocked(previous);
          toast.error(response?.message || 'Unable to update room lock.');
          return;
        }

        if (typeof response?.locked === 'boolean') {
          setLocked(response.locked);
        }

        toast.success(next ? 'Room locked.' : 'Room unlocked.');
      },
    );
  }, [role, socket, roomCode, locked, setLocked]);

  const handleKickPeer = useCallback(
    (socketId) => {
      if (role !== 'host' || !socket || !socketId) return;

      socket.emit(
        'kick-peer',
        {
          roomCode,
          socketId,
          hostToken: hostTokenRef.current,
        },
        (response) => {
          if (response?.success === false) {
            toast.error(response?.message || 'Unable to remove peer.');
            return;
          }

          toast.success('Peer removed from room.');
        },
      );
    },
    [role, socket, roomCode],
  );

  const performEndRoom = useCallback(() => {
    if (role !== 'host' || !socket) return;

    disconnectingRef.current = true;

    socket.emit(
      'end-room',
      {
        roomCode,
        hostToken: hostTokenRef.current,
      },
      () => {
        clearHostToken(roomCode);

        try {
          socket.emit('leave-room', { roomCode });
        } catch {
          // ignore
        }

        navigate('/', { replace: true });
      },
    );
  }, [role, socket, roomCode, navigate]);

  const handleEndRoom = useCallback(() => {
    if (role !== 'host' || !socket) return;
    setConfirmEndOpen(true);
  }, [role, socket]);

  const performLeaveRoom = useCallback(() => {
    disconnectingRef.current = true;

    try {
      socket?.emit?.('leave-room', { roomCode });
    } catch {
      // ignore
    }

    navigate('/', { replace: true });
  }, [socket, roomCode, navigate]);

  const handleLeaveRoom = useCallback(() => {
    setConfirmLeaveOpen(true);
  }, []);

  const handleRemovedConfirm = useCallback(() => {
    disconnectingRef.current = true;
    setRemovedPhase(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `/join?room=${roomCode}`;
    }

    return `${window.location.origin}/join?room=${roomCode}`;
  }, [roomCode]);

  const copyText = useCallback(async (text, message) => {
    if (!text) {
      toast.error('Nothing to copy.');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success(message);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const copied = document.execCommand('copy');
      textarea.remove();

      if (!copied) throw new Error('Copy failed');
      toast.success(message);
    } catch {
      toast.error('Unable to copy.');
    }
  }, []);

  const handleCopyRoom = useCallback(() => {
    return copyText(roomCode, 'Room code copied.');
  }, [roomCode, copyText]);

  const handleCopyInvite = useCallback(() => {
    return copyText(inviteUrl, 'Invite link copied.');
  }, [inviteUrl, copyText]);

  const handleCopyName = useCallback(
    (name) => {
      copyText(name, 'Filename copied.');
    },
    [copyText],
  );

  const handleShare = useCallback(() => {
    setShowShare(true);
  }, []);

  const sendSelectedFiles = useCallback(
    async (files) => {
      if (!files?.length) return;

      if (!connected) {
        toast.error('Connect to a peer before sending files.');
        return;
      }

      const totalSize = files.reduce(
        (sum, file) => sum + Number(file?.size || 0),
        0,
      );

      if (totalSize >= LARGE_FILE_WARNING_BYTES) {
        toast.warning(
          `You are sending ${formatBytes(
            totalSize,
          )}. Keep this tab open until the transfer finishes.`,
        );
      }

      await requestNotifications();
      transferRef.current?.sendFiles?.(files);
    },
    [connected, requestNotifications],
  );

  const handleInputChange = useCallback(
    async (event) => {
      const files = collectInputFiles(event.target.files);
      await sendSelectedFiles(files);
      event.target.value = '';
    },
    [sendSelectedFiles],
  );

  const handleFolderChange = useCallback(
    async (event) => {
      const files = collectInputFiles(event.target.files);

      if (files.length > 1) {
        toast.success(`${files.length} files found in selected folder.`);
      }

      await sendSelectedFiles(files);
      event.target.value = '';
    },
    [sendSelectedFiles],
  );

  const handleDragOver = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (connected) setIsDragging(true);
    },
    [connected],
  );

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (!connected) {
        toast.error('Connect to a peer before sending files.');
        return;
      }

      const files = await collectDroppedFiles(event.dataTransfer);
      await sendSelectedFiles(files);
    },
    [connected, sendSelectedFiles],
  );

  useEffect(() => {
    const handlePaste = async (event) => {
      if (!connected) return;

      const items = Array.from(event.clipboardData?.items || []);
      const files = [];

      for (const item of items) {
        if (item.kind !== 'file') continue;

        const file = item.getAsFile?.();
        if (file) files.push(withRelativePath(file));
      }

      if (files.length) {
        event.preventDefault();
        await sendSelectedFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [connected, sendSelectedFiles]);

  const qrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(
      inviteUrl,
    )}`;
  }, [inviteUrl]);

  useEffect(() => {
    if (!showQr) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowQr(false);
    };

    const handlePointerDown = (event) => {
      if (qrRef.current && !qrRef.current.contains(event.target)) {
        setShowQr(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [showQr]);

  const incoming = transfer.incoming || [];
  const outgoing = transfer.outgoing || [];

  const activeIncoming = incoming.filter(
    (file) =>
      file.status === 'receiving' ||
      file.status === 'transferring' ||
      file.status === 'active',
  );

  const activeOutgoing = outgoing.filter(
    (file) =>
      file.status === 'sending' ||
      file.status === 'transferring' ||
      file.status === 'active',
  );

  const pendingIncoming = incoming.filter(
    (file) =>
      file.status === 'pending' ||
      file.status === 'waiting' ||
      file.status === 'offer',
  );

  const completedIncoming = incoming.filter(
    (file) =>
      file.status === 'completed' ||
      file.status === 'success' ||
      file.status === 'done',
  );

  const completedOutgoing = outgoing.filter(
    (file) =>
      file.status === 'completed' ||
      file.status === 'success' ||
      file.status === 'done',
  );

  const cancelledIncoming = incoming.filter(
    (file) =>
      file.status === 'cancelled' ||
      file.status === 'canceled' ||
      file.status === 'rejected',
  );

  const cancelledOutgoing = outgoing.filter(
    (file) =>
      file.status === 'cancelled' ||
      file.status === 'canceled' ||
      file.status === 'rejected',
  );

  const failedIncoming = incoming.filter(
    (file) => file.status === 'failed' || file.status === 'error',
  );

  const failedOutgoing = outgoing.filter(
    (file) => file.status === 'failed' || file.status === 'error',
  );

  useEffect(() => {
    if (!incoming.length) return;

    const notified = notifiedIncomingRef.current;
    const fresh = [];

    incoming.forEach((file) => {
      const id = file.fileId || file.id;
      if (!id) return;
      if (notified.has(id)) return;
      notified.add(id);
      fresh.push(file);
    });

    if (!fresh.length) return;

    const offers = fresh.filter((file) => {
      const s = file.status || 'pending';
      return s === 'pending' || s === 'waiting' || s === 'offer';
    });

    const autoStarted = fresh.filter((file) => {
      const s = file.status || 'pending';
      return s === 'receiving' || s === 'transferring' || s === 'active';
    });

    if (offers.length === 1) {
      const f = offers[0];
      setIncomingOfferToast(f);
    } else if (offers.length > 1) {
      const total = offers.reduce((s, f) => s + Number(f.size || 0), 0);
      setIncomingOfferToast({
        fileId: offers[0].fileId || offers[0].id,
        name: `${offers.length} files are waiting`,
        size: total,
        multiple: true,
        count: offers.length,
      });
    }

    if (autoStarted.length === 1) {
      const f = autoStarted[0];
      toast.success(
        `Receiving ${f.name || 'file'} (${formatBytes(f.size || 0)})...`,
      );
    } else if (autoStarted.length > 1) {
      const total = autoStarted.reduce((s, f) => s + Number(f.size || 0), 0);
      toast.success(
        `Receiving ${autoStarted.length} files (${formatBytes(total)})...`,
      );
    }
  }, [incoming]);

  useEffect(() => {
    const allFiles = [
      ...incoming.map((file) => ({ ...file, __direction: 'incoming' })),
      ...outgoing.map((file) => ({ ...file, __direction: 'outgoing' })),
    ];

    allFiles.forEach((file) => {
      const id = file.fileId || file.id;
      if (!id) return;

      const status = file.status || 'pending';
      const previous = activitySnapshotRef.current.get(id);

      if (!previous) {
        activitySnapshotRef.current.set(id, status);
        pushActivity(
          `${file.__direction === 'incoming' ? 'Incoming' : 'Outgoing'} file added: ${file.name || 'Unnamed file'}`,
          file.__direction === 'incoming' ? 'blue' : 'violet',
        );
        return;
      }

      if (previous === status) return;
      activitySnapshotRef.current.set(id, status);

      if (['completed', 'success', 'done'].includes(status)) {
        pushActivity(`${file.name || 'File'} completed`, 'emerald');
      } else if (['failed', 'error'].includes(status)) {
        pushActivity(`${file.name || 'File'} failed`, 'red');
      } else if (['cancelled', 'canceled', 'rejected'].includes(status)) {
        pushActivity(`${file.name || 'File'} cancelled`, 'red');
      } else if (['sending', 'receiving', 'transferring', 'active'].includes(status)) {
        pushActivity(
          `${file.__direction === 'incoming' ? 'Receiving' : 'Sending'} ${file.name || 'file'}`,
          'violet',
        );
      }
    });
  }, [incoming, outgoing, pushActivity]);

  const totalIncomingReceived = incoming.reduce(
    (sum, file) =>
      sum + Number(file.bytesReceived || file.receivedBytes || 0),
    0,
  );

  const totalOutgoingSent = outgoing.reduce(
    (sum, file) => sum + Number(file.bytesSent || file.sentBytes || 0),
    0,
  );

  const totalActiveSpeed = [...activeIncoming, ...activeOutgoing].reduce(
    (sum, file) => sum + Number(file.speed || file.bytesPerSecond || 0),
    0,
  );

  const connectionQuality = getConnectionQuality(
    totalActiveSpeed,
    connected,
  );

  const handleAccept = useCallback(
    (fileId) => transferRef.current?.acceptOffer?.(fileId),
    [],
  );

  const handleReject = useCallback(
    (fileId) => transferRef.current?.rejectOffer?.(fileId),
    [],
  );

  const handleDownload = useCallback(
    (fileId) => transferRef.current?.downloadFile?.(fileId),
    [],
  );

  const handleRetry = useCallback(
    (fileId) => transferRef.current?.retryFile?.(fileId),
    [],
  );

  const handleCancel = useCallback((fileId, direction) => {
    if (direction === 'incoming') {
      transferRef.current?.cancelIncoming?.(fileId);
    } else {
      transferRef.current?.cancelOutgoing?.(fileId);
    }
  }, []);

  const handleRemove = useCallback((fileId, direction) => {
    if (!fileId) return;
    const dir = direction === 'incoming' || direction === 'in' ? 'in' : 'out';
    transferRef.current?.removeFile?.(fileId, dir);
  }, []);

  const allRoomFiles = [
    ...incoming.map((file) => ({ ...file, __direction: 'incoming' })),
    ...outgoing.map((file) => ({ ...file, __direction: 'outgoing' })),
  ];

  const filteredRoomFiles = (() => {
    const query = fileSearch.trim().toLowerCase();

    const result = allRoomFiles.filter((file) => {
      const status = file.status || 'pending';
      const active = ['sending', 'receiving', 'transferring', 'active'].includes(status);
      const completed = ['completed', 'success', 'done'].includes(status);
      const waiting = ['pending', 'waiting', 'offer'].includes(status);
      const failed = ['failed', 'error'].includes(status);
      const cancelled = ['cancelled', 'canceled', 'rejected'].includes(status);

      if (fileFilter === 'active' && !active) return false;
      if (fileFilter === 'completed' && !completed) return false;
      if (fileFilter === 'waiting' && !waiting) return false;
      if (fileFilter === 'failed' && !failed) return false;
      if (fileFilter === 'cancelled' && !cancelled) return false;
      if (fileFilter === 'incoming' && file.__direction !== 'incoming') return false;
      if (fileFilter === 'outgoing' && file.__direction !== 'outgoing') return false;

      if (!query) return true;

      const haystack = [
        file.name,
        file.relativePath,
        file.webkitRelativePath,
        file.type,
        file.mimeType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...result].sort((a, b) => {
      if (fileSort === 'name-asc') return String(a.name || '').localeCompare(String(b.name || ''));
      if (fileSort === 'name-desc') return String(b.name || '').localeCompare(String(a.name || ''));
      if (fileSort === 'largest') return Number(b.size || 0) - Number(a.size || 0);
      if (fileSort === 'smallest') return Number(a.size || 0) - Number(b.size || 0);
      if (fileSort === 'status') return String(a.status || '').localeCompare(String(b.status || ''));
      return Number(b.createdAt || b.startedAt || b.timestamp || 0) - Number(a.createdAt || a.startedAt || a.timestamp || 0);
    });
  })();

  const filteredIncomingFiles = filteredRoomFiles.filter(
    (file) => file.__direction === 'incoming',
  );

  const filteredOutgoingFiles = filteredRoomFiles.filter(
    (file) => file.__direction === 'outgoing',
  );

  const selectedRoomFiles = useMemo(
    () => allRoomFiles.filter((file) => selectedFiles.has(file.fileId || file.id)),
    [allRoomFiles, selectedFiles],
  );

  const selectedIncomingCompleted = selectedRoomFiles.filter(
    (file) => file.__direction === 'incoming' && ['completed', 'success', 'done'].includes(file.status),
  );

  const selectedFailed = selectedRoomFiles.filter(
    (file) => ['failed', 'error'].includes(file.status),
  );

  const toggleFileSelection = useCallback((fileId) => {
    if (!fileId) return;
    setSelectedFiles((current) => {
      const next = new Set(current);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedFiles(new Set()), []);

  const handleBulkDownload = useCallback(() => {
    if (!selectedIncomingCompleted.length) {
      toast.error('Select completed incoming files first.');
      return;
    }
    selectedIncomingCompleted.forEach((file) => {
      transferRef.current?.downloadFile?.(file.fileId || file.id);
    });
    toast.success(`Downloading ${selectedIncomingCompleted.length} selected file(s)...`);
    clearSelection();
  }, [selectedIncomingCompleted, clearSelection]);

  const handleBulkRetry = useCallback(() => {
    if (!selectedFailed.length) {
      toast.error('Select failed files first.');
      return;
    }
    selectedFailed.forEach((file) => {
      transferRef.current?.retryFile?.(file.fileId || file.id);
    });
    toast.success(`Retrying ${selectedFailed.length} selected file(s)...`);
    clearSelection();
  }, [selectedFailed, clearSelection]);

  const handleBulkCancel = useCallback(() => {
    const activeSelected = selectedRoomFiles.filter((file) =>
      ['sending', 'receiving', 'transferring', 'active'].includes(file.status),
    );

    activeSelected.forEach((file) => {
      handleCancel(file.fileId || file.id, file.__direction);
    });

    if (activeSelected.length) {
      toast.success(`Cancelled ${activeSelected.length} transfer(s).`);
    }
    clearSelection();
  }, [selectedRoomFiles, clearSelection]);

  const handleBulkRemove = useCallback(() => {
    if (!selectedRoomFiles.length) return;
    selectedRoomFiles.forEach((file) => {
      handleRemove(file.fileId || file.id, file.__direction);
    });
    toast.success(`Removed ${selectedRoomFiles.length} file(s) from the room list.`);
    clearSelection();
  }, [selectedRoomFiles, clearSelection]);

  const handleAcceptAll = useCallback(() => {
    if (!pendingIncoming.length) return;
    pendingIncoming.forEach((file) => handleAccept(file.fileId || file.id));
    toast.success(`Accepted ${pendingIncoming.length} incoming file(s).`);
  }, [pendingIncoming, handleAccept]);

  const handleRejectAll = useCallback(() => {
    if (!pendingIncoming.length) return;
    pendingIncoming.forEach((file) => handleReject(file.fileId || file.id));
    toast.success(`Rejected ${pendingIncoming.length} incoming file(s).`);
  }, [pendingIncoming, handleReject]);

  const handleClearCompletedIncoming = useCallback(() => {
    if (!completedIncoming.length) {
      toast.success('Nothing to clear.');
      return;
    }

    completedIncoming.forEach((file) => {
      const id = file.fileId || file.id;
      transferRef.current?.removeFile?.(id, 'in');
    });

    toast.success(
      `Cleared ${completedIncoming.length} completed incoming file(s).`,
    );
  }, [completedIncoming]);

  const handleClearCompletedOutgoing = useCallback(() => {
    if (!completedOutgoing.length) {
      toast.success('Nothing to clear.');
      return;
    }

    completedOutgoing.forEach((file) => {
      const id = file.fileId || file.id;
      transferRef.current?.removeFile?.(id, 'out');
    });

    toast.success(
      `Cleared ${completedOutgoing.length} completed outgoing file(s).`,
    );
  }, [completedOutgoing]);

  const handleClearCancelledIncoming = useCallback(() => {
    const dead = failedIncoming.concat(cancelledIncoming);

    if (!dead.length) {
      toast.success('Nothing to clear.');
      return;
    }

    dead.forEach((file) => {
      const id = file.fileId || file.id;
      transferRef.current?.removeFile?.(id, 'in');
    });

    toast.success(`Cleared ${dead.length} cancelled incoming file(s).`);
  }, [cancelledIncoming, failedIncoming]);

  const handleClearCancelledOutgoing = useCallback(() => {
    const dead = failedOutgoing.concat(cancelledOutgoing);

    if (!dead.length) {
      toast.success('Nothing to clear.');
      return;
    }

    dead.forEach((file) => {
      const id = file.fileId || file.id;
      transferRef.current?.removeFile?.(id, 'out');
    });

    toast.success(`Cleared ${dead.length} cancelled outgoing file(s).`);
  }, [cancelledOutgoing, failedOutgoing]);

  const handleRetryAllFailedOutgoing = useCallback(() => {
    if (!failedOutgoing.length) return;
    failedOutgoing.forEach((file) => {
      const id = file.fileId || file.id;
      transferRef.current?.retryFile?.(id);
    });
    toast.success(`Retrying ${failedOutgoing.length} outgoing file(s)...`);
  }, [failedOutgoing]);

  const handleRetryAllFailedIncoming = useCallback(() => {
    if (!failedIncoming.length) return;
    failedIncoming.forEach((file) => {
      const id = file.fileId || file.id;
      transferRef.current?.retryFile?.(id);
    });
    toast.success(`Retrying ${failedIncoming.length} incoming file(s)...`);
  }, [failedIncoming]);

  const handleDownloadAllCompleted = useCallback(() => {
    if (!completedIncoming.length) return;
    completedIncoming.forEach((file) => {
      transferRef.current?.downloadFile?.(file.fileId || file.id);
    });
    toast.success(`Downloading ${completedIncoming.length} file(s)...`);
  }, [completedIncoming]);

  const expiryText = useMemo(() => {
    if (!expiresAt) return '30 minute session';

    const remaining = new Date(expiresAt).getTime() - now;
    if (remaining <= 0) return 'Expired';

    return formatETA(Math.ceil(remaining / 1000));
  }, [expiresAt, now]);

  const lowTime = useMemo(
    () => isLowTime(expiresAt, now),
    [expiresAt, now],
  );

  const createdAtText = useMemo(
    () => formatDateTime(createdAt),
    [createdAt],
  );

  const endsAtText = useMemo(() => {
    if (expiresAt) return formatDateTime(expiresAt);
    if (createdAt) {
      const t = new Date(createdAt).getTime() + 30 * 60 * 1000;
      return formatDateTime(t);
    }
    return '—';
  }, [expiresAt, createdAt]);

  const radarFlow = useMemo(() => {
    const sending = activeOutgoing.length > 0;
    const receiving = activeIncoming.length > 0;
    if (sending && receiving) return 'both';
    if (sending) return 'out';
    if (receiving) return 'in';
    return null;
  }, [activeOutgoing.length, activeIncoming.length]);

  const YouIcon = getDeviceIconFromInfo(deviceInfo, deviceName);

  const peerDeviceName = getDeviceLabel(
    peer?.deviceInfo || {},
    peer?.deviceName || '',
  );

  const PeerIcon = getDeviceIconFromInfo(
    peer?.deviceInfo || {},
    peer?.deviceName || '',
  );

  if (removedPhase) {
    return (
      <KickedModal
        open={true}
        reason={removedPhase}
        roomCode={roomCode}
        onConfirm={handleRemovedConfirm}
      />
    );
  }

  if (joining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAFF] px-6 dark:bg-[#0a0b0e]">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Loader2 size={26} className="animate-spin" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Joining room
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Establishing your secure session...
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-widest text-slate-600 dark:border-slate-800 dark:bg-[#0f1115] dark:text-slate-300">
            {roomCode}
          </div>
        </div>
      </div>
    );
  }

  if (roomExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FBFAFF] via-white to-[#F3EEFF] px-5 py-10 dark:from-[#0a0b0e] dark:via-[#0d0e13] dark:to-[#0a0b0e]">
        <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0f1115]">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />

          <div className="p-7 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 shadow-sm dark:from-amber-500/10 dark:to-amber-500/5 dark:text-amber-400">
              <Clock size={30} />
            </div>

            <p className="mt-5 text-center text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
              WebDrop session
            </p>

            <h1 className="mt-2 text-center text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Session Expired
            </h1>

            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
              This room reached its 30-minute lifetime and is no longer
              available. Start a fresh room to continue transferring files.
            </p>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Room code
                  </p>

                  <p className="mt-1 font-mono text-lg font-extrabold tracking-[0.2em] text-slate-700 dark:text-slate-200">
                    {roomCode}
                  </p>
                </div>

                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Expired
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
              >
                <Plus size={15} />
                New Room
              </button>

              <button
                type="button"
                onClick={() => navigate('/join')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
              >
                <RefreshCw size={15} />
                Join Room
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
              >
                <Home size={15} />
                Home
              </button>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-400 dark:text-slate-500">
              Tip: rooms are private by default — only people with the code can
              join.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (roomError) {
    const isKicked = roomError.toLowerCase().includes('removed');
    const isEnded = roomError.toLowerCase().includes('ended');
    const isUnavailable =
      !isKicked &&
      !isEnded &&
      (roomError.toLowerCase().includes('unavailable') ||
        roomError.toLowerCase().includes('invalid') ||
        roomError.toLowerCase().includes('not found') ||
        roomError.toLowerCase().includes('full') ||
        roomError.toLowerCase().includes('locked'));

    const icon = isKicked ? (
      <LogOut size={28} />
    ) : isEnded ? (
      <Power size={28} />
    ) : isUnavailable ? (
      <Lock size={28} />
    ) : (
      <XCircle size={28} />
    );

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FBFAFF] via-white to-[#FFF1F1] px-5 py-10 dark:from-[#0a0b0e] dark:via-[#0d0e13] dark:to-[#0a0b0e]">
        <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0f1115]">
          <div className="h-1.5 w-full bg-gradient-to-r from-red-400 via-red-500 to-rose-500" />

          <div className="p-7 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 shadow-sm dark:from-red-500/10 dark:to-red-500/5 dark:text-red-400">
              {icon}
            </div>

            <p className="mt-5 text-center text-[10px] font-extrabold uppercase tracking-[0.22em] text-red-600 dark:text-red-400">
              WebDrop session
            </p>

            <h1 className="mt-2 text-center text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {isKicked
                ? 'Removed from room'
                : isEnded
                  ? 'Room ended'
                  : isUnavailable
                    ? 'Room unavailable'
                    : 'Something went wrong'}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
              {roomError}
            </p>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Room code
                  </p>

                  <p className="mt-1 font-mono text-lg font-extrabold tracking-[0.2em] text-slate-700 dark:text-slate-200">
                    {roomCode}
                  </p>
                </div>

                <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  {isKicked
                    ? 'Kicked'
                    : isEnded
                      ? 'Ended'
                      : isUnavailable
                        ? 'Closed'
                        : 'Error'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
              >
                <Plus size={15} />
                Create New Room
              </button>

              <button
                type="button"
                onClick={() => navigate('/join')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
              >
                <RefreshCw size={15} />
                Join Another Room
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
            >
              <Home size={14} />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFAFF] text-slate-900 dark:bg-[#0a0b0e] dark:text-white">
      <header className="relative z-20 border-b border-slate-200/80 bg-[#FBFAFF] dark:border-slate-800/80 dark:bg-[#0a0b0e]">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      connected
                        ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                        : peer
                          ? 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]'
                          : 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
                    }`}
                  />

                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Transmission Room
                  </span>
                </div>

                <span className="hidden h-4 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                    connected
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : peer
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                  }`}
                >
                  {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {connected
                    ? 'Connected'
                    : peer
                      ? 'Connecting'
                      : 'Disconnected'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  WebDrop
                </h1>

                <span className="text-slate-300 dark:text-slate-700">/</span>

                <button
                  type="button"
                  onClick={handleCopyRoom}
                  className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-[0.16em] text-slate-800 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-200 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
                >
                  {roomCode}
                  <Copy
                    size={14}
                    className="text-slate-400 transition group-hover:text-violet-500"
                  />
                </button>

                {role === 'host' && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                    Host
                  </span>
                )}

                {role === 'guest' && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Guest
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Direct peer-to-peer transfer · no server file storage
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sidebar toggle: now visible on ALL screen sizes (lg and up) */}
              <button
                type="button"
                onClick={sidebar.toggleCollapsed}
                aria-expanded={!sidebar.sidebarCollapsed}
                aria-controls="app-sidebar"
                title={
                  sidebar.sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'
                }
                className="hidden lg:inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
              >
                {sidebar.sidebarCollapsed ? (
                  <PanelLeftOpen size={14} />
                ) : (
                  <PanelLeftClose size={14} />
                )}
                <span>
                  {sidebar.sidebarCollapsed ? 'Show panel' : 'Hide panel'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyRoom}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
              >
                <Copy size={14} />
                Code
              </button>

              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
              >
                <LinkIcon size={14} />
                Invite
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-haspopup="dialog"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
              >
                <Share2 size={14} />
                Share
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQr((value) => !value)}
                  aria-expanded={showQr}
                  aria-haspopup="dialog"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
                >
                  <QrCode size={14} />
                  QR
                </button>

                {showQr && (
                  <div
                    ref={qrRef}
                    role="dialog"
                    aria-label="Scan to join"
                    className="absolute right-0 top-12 z-50 w-[min(19rem,calc(100vw-1rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-[#0f1115] sm:w-[min(20rem,calc(100vw-2rem))] sm:p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                          Scan to join
                        </p>

                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                          Room {roomCode}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowQr(false)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white sm:h-8 sm:w-8"
                        aria-label="Close QR"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-center rounded-xl bg-white p-2 sm:p-3">
                      <img
                        src={qrUrl}
                        alt="WebDrop room QR code"
                        className="h-auto w-full max-w-[170px] sm:max-w-[220px]"
                      />
                    </div>

                    <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900/60 sm:mt-3 sm:px-3 sm:py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:text-[10px]">
                        Invite link
                      </p>

                      <p className="mt-0.5 truncate font-mono text-[10px] text-slate-700 dark:text-slate-300 sm:mt-1 sm:text-[11px]">
                        {inviteUrl}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-[11px] font-bold text-white transition hover:bg-violet-700 sm:h-10 sm:text-xs"
                    >
                      <LinkIcon size={13} />
                      Copy link
                    </button>

                    <p className="mt-2 text-center text-[9px] leading-3 text-slate-400 dark:text-slate-500 sm:mt-3 sm:text-[10px] sm:leading-4">
                      Scan the QR from another device, or share the link.
                    </p>
                  </div>
                )}
              </div>

              {role === 'host' && (
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
                    locked
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400'
                  }`}
                >
                  {locked ? <Lock size={14} /> : <Unlock size={14} />}
                  {locked ? 'Locked' : 'Lock'}
                </button>
              )}

              <button
                type="button"
                onClick={handleLeaveRoom}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                title="Leave room"
              >
                <LogOut size={14} />
                Leave
              </button>

              {role === 'host' && (
                <button
                  type="button"
                  onClick={handleEndRoom}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  <Power size={14} />
                  End Room
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
            <span
              className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-sm font-extrabold tracking-wide transition-colors ${
                lowTime
                  ? 'bg-red-50 text-red-600 ring-1 ring-red-300 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-900/60'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200'
              }`}
              role={lowTime ? 'alert' : undefined}
            >
              <span
                className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  lowTime
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300'
                }`}
                style={
                  lowTime
                    ? { animation: 'roomAlertBlink 1s ease-in-out infinite' }
                    : undefined
                }
              >
                {lowTime && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-400/60" />
                )}

                {lowTime ? (
                  <AlertCircle size={15} className="relative" strokeWidth={2.6} />
                ) : (
                  <Clock size={13} className="relative" strokeWidth={2.4} />
                )}
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">
                {lowTime ? 'Ending soon' : 'Expires in'}
              </span>

              <span className="font-mono text-sm font-extrabold tabular-nums sm:text-base">
                {expiryText}
              </span>
            </span>

            <span
              className={`inline-flex items-center gap-1.5 font-bold ${
                peerCount >= 2 ? 'text-emerald-600 dark:text-emerald-400' : ''
              }`}
            >
              <Users size={13} />
              {peerCount}/2 devices
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck size={13} />
              </span>
              Direct encrypted channel
            </span>

            <span
              className={`inline-flex items-center gap-1.5 font-bold transition-colors ${
                connected
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {connected ? 'Connected' : 'Disconnected'}
            </span>

            <SpeedometerIndicator quality={connectionQuality} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[1400px] overflow-x-clip px-3 pb-24 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:pl-8 lg:pr-24">
        <ResizableSidebarLayout
          controller={sidebar}
          sidebarPosition="right"
          sidebar={
            <aside
              id="app-sidebar"
              className="min-w-0 min-h-0 space-y-3"
            >
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
                <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
                        Live topology
                      </p>

                      <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                        Peer radar
                      </h2>
                    </div>

                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        connected
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                      }`}
                    >
                      {connected ? <Wifi size={16} /> : <Activity size={16} />}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <PeerRadar
                    role={role}
                    peer={peer}
                    peerVisible={peerVisible}
                    peerReveal={peerReveal}
                    connected={connected}
                    flow={radarFlow}
                    connectionState={webrtc.connectionState}
                    deviceName={deviceName}
                    deviceInfo={deviceInfo}
                    YouIcon={YouIcon}
                    PeerIcon={PeerIcon}
                    onKickPeer={handleKickPeer}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Direct Encrypted Channel
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Browser-to-browser connection
                    </p>
                  </div>
                </div>

                <InfoRow
                  icon={ShieldCheck}
                  label="Transfer"
                  value="WebRTC DataChannel"
                />
                <InfoRow icon={Lock} label="Storage" value="No server storage" />
                <InfoRow icon={Wifi} label="Signaling" value="Socket.IO" />
                <InfoRow icon={Clock} label="Created at" value={createdAtText} />
                <InfoRow icon={Clock} label="Ends at" value={endsAtText} />
                <InfoRow icon={Clock} label="Room lifetime" value="30 minutes" />
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Connection
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      WebRTC transport state
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                      connected
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    }`}
                  >
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <InfoRow
                  icon={Power}
                  label="Peer state"
                  value={webrtc.connectionState || 'new'}
                />
                <InfoRow
                  icon={Wifi}
                  label="Data channel"
                  value={webrtc.dataChannelOpen ? 'Open' : 'Closed'}
                />
                <InfoRow icon={Users} label="Devices" value={`${peerCount}/2`} />
                <InfoRow
                  icon={Gauge}
                  label="Link quality"
                  value={connectionQuality.label}
                />
              </section>
            </aside>
          }
        >
          {/* ============================================================
              MAIN CONTENT
          ============================================================ */}
          <section className="min-w-0 space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Devices"
                value={`${peerCount}/2`}
                subtext={peer ? peerDeviceName : 'Waiting for peer'}
              />

              <StatCard
                icon={Inbox}
                label="Incoming"
                value={formatBytes(totalIncomingReceived)}
                subtext={`${incoming.length} file${
                  incoming.length === 1 ? '' : 's'
                }`}
              />

              <StatCard
                icon={Send}
                label="Outgoing"
                value={formatBytes(totalOutgoingSent)}
                subtext={`${outgoing.length} file${
                  outgoing.length === 1 ? '' : 's'
                }`}
              />

              <StatCard
                icon={Zap}
                label="Speed"
                value={formatSpeed(totalActiveSpeed)}
                subtext={connected ? `${connectionQuality.label} link` : 'Idle'}
              />
            </div>

            <section
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative overflow-hidden rounded-3xl border-2 border-dashed bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-sm transition dark:from-violet-500/[0.07] dark:via-[#0f1115] dark:to-fuchsia-500/[0.07] ${
                isDragging
                  ? 'border-solid border-violet-500 bg-violet-100/60 dark:border-violet-500 dark:bg-violet-500/10'
                  : 'border-violet-200/70 hover:border-violet-300 dark:border-violet-500/30 dark:hover:border-violet-500/50'
              }`}
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/15" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/15" />

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition ${
                      connected
                        ? 'bg-white/80 text-violet-600 shadow-sm ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20'
                        : 'bg-white/70 text-slate-400 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800/60 dark:text-slate-500 dark:ring-slate-800'
                    }`}
                  >
                    <CloudUpload size={28} />
                  </div>

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                    File transfer
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {connected ? 'Drop files here' : 'Waiting for peer'}
                  </h2>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {connected
                      ? 'Drag files or folders here, or choose files manually. Everything is transferred directly between the two devices.'
                      : 'Keep this room open. A second device must join before files can be transferred.'}
                  </p>

                  <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <button
                      type="button"
                      disabled={!connected}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10"
                    >
                      <Paperclip size={15} />
                      Choose files
                    </button>

                    <button
                      type="button"
                      disabled={!connected}
                      onClick={() => folderInputRef.current?.click()}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400 sm:h-10"
                    >
                      <FolderOpen size={15} />
                      Choose folder
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {[
                      'P2P',
                      'WebRTC',
                      'No upload server',
                      'Paste supported',
                      'Ctrl+V',
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleInputChange}
                  />

                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    webkitdirectory=""
                    directory=""
                    className="hidden"
                    onChange={handleFolderChange}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              {/* FILE MANAGER HEADER */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
                <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                          <HardDrive size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
                            Transfer manager
                          </p>
                          <h2 className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                            Files in this room
                          </h2>
                          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Received files and sent files are managed separately so you can quickly see what came from the peer and what you transferred.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[470px]">
                      <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/60">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total files</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">{allRoomFiles.length}</p>
                        <p className="mt-0.5 truncate text-[9px] text-slate-400">{incoming.length} received · {outgoing.length} sent</p>
                      </div>
                      <div className="min-w-0 rounded-2xl bg-violet-50 px-3 py-2.5 dark:bg-violet-500/10">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-violet-500">Active</p>
                        <p className="mt-1 text-sm font-extrabold text-violet-700 dark:text-violet-400">{activeIncoming.length + activeOutgoing.length}</p>
                        <p className="mt-0.5 text-[9px] text-violet-500/80">Live transfers</p>
                      </div>
                      <div className="min-w-0 rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-500/10">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-500">Received</p>
                        <p className="mt-1 truncate text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{formatBytes(totalIncomingReceived)}</p>
                        <p className="mt-0.5 text-[9px] text-emerald-600/70">From peer</p>
                      </div>
                      <div className="min-w-0 rounded-2xl bg-blue-50 px-3 py-2.5 dark:bg-blue-500/10">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-blue-500">Sent</p>
                        <p className="mt-1 truncate text-sm font-extrabold text-blue-700 dark:text-blue-400">{formatBytes(totalOutgoingSent)}</p>
                        <p className="mt-0.5 text-[9px] text-blue-600/70">To peer</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={fileSearch}
                        onChange={(event) => setFileSearch(event.target.value)}
                        placeholder="Search received and sent files..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-200"
                      />
                      {fileSearch && (
                        <button
                          type="button"
                          onClick={() => setFileSearch('')}
                          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={fileSort}
                        onChange={(event) => setFileSort(event.target.value)}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                      >
                        <option value="newest">Newest</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="largest">Largest</option>
                        <option value="smallest">Smallest</option>
                        <option value="status">Status</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setFileView(fileView === 'list' ? 'grid' : 'list')}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                      >
                        {fileView === 'list' ? <Grid2X2 size={14} /> : <List size={14} />}
                        <span className="hidden sm:inline">{fileView === 'list' ? 'Grid' : 'List'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowConnectionDetails((value) => !value)}
                        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${showConnectionDetails ? 'border-violet-300 bg-violet-50 text-violet-600 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-400' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300'}`}
                      >
                        <SlidersHorizontal size={14} />
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {[
                      ['all', 'All', allRoomFiles.length],
                      ['active', 'Active', activeIncoming.length + activeOutgoing.length],
                      ['waiting', 'Waiting', pendingIncoming.length],
                      ['completed', 'Completed', completedIncoming.length + completedOutgoing.length],
                      ['failed', 'Failed', failedIncoming.length + failedOutgoing.length],
                      ['cancelled', 'Cancelled', cancelledIncoming.length + cancelledOutgoing.length],
                    ].map(([value, label, count]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFileFilter(value)}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold transition ${fileFilter === value ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-violet-50 hover:text-violet-600 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-violet-500/10 dark:hover:text-violet-400'}`}
                      >
                        {label}
                        <span className={fileFilter === value ? 'text-white/70' : 'text-slate-400'}>{count}</span>
                      </button>
                    ))}
                  </div>

                  {selectedFiles.size > 0 && (
                    <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-500/20 dark:bg-violet-500/10 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-violet-300">
                        <CheckSquare size={15} />
                        {selectedFiles.size} file{selectedFiles.size === 1 ? '' : 's'} selected
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedIncomingCompleted.length > 0 && (
                          <button type="button" onClick={handleBulkDownload} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-[10px] font-bold text-white">
                            <Download size={12} /> Download received
                          </button>
                        )}
                        {selectedFailed.length > 0 && (
                          <button type="button" onClick={handleBulkRetry} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300">
                            <RotateCcw size={12} /> Retry
                          </button>
                        )}
                        {selectedRoomFiles.some((file) => ['sending', 'receiving', 'transferring', 'active'].includes(file.status)) && (
                          <button type="button" onClick={handleBulkCancel} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-[10px] font-bold text-red-500 dark:border-red-900/50 dark:bg-[#15171d]">
                            <X size={12} /> Cancel
                          </button>
                        )}
                        <button type="button" onClick={handleBulkRemove} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300">
                          <Trash2 size={12} /> Remove
                        </button>
                        <button type="button" onClick={clearSelection} className="inline-flex h-8 items-center rounded-lg px-2.5 text-[10px] font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-800">
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {showConnectionDetails && (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoRow icon={Wifi} label="Connection" value={connected ? 'Connected' : 'Disconnected'} />
                      <InfoRow icon={Zap} label="Live speed" value={formatSpeed(totalActiveSpeed)} />
                      <InfoRow icon={Gauge} label="Quality" value={connectionQuality.label} />
                      <InfoRow icon={ShieldCheck} label="Transport" value="WebRTC DataChannel" />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================
                  RECEIVED SECTION
              ============================ */}
              <div
                id="webdrop-receive-files"
                className="min-w-0 scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl dark:border-slate-800 dark:bg-[#0f1115]"
              >
                {/* Header */}
                <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-sky-50 via-blue-50/40 to-white p-5 dark:border-slate-800 dark:from-blue-500/[0.08] dark:via-slate-900/50 dark:to-[#0f1115] sm:p-6">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/10" />

                  <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-lg shadow-blue-500/25">
                        <Inbox size={24} strokeWidth={2.4} className="text-white" />
                        {pendingIncoming.length > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-md dark:border-[#0f1115]">
                            {pendingIncoming.length}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Received Files
                          </h3>
                          <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                            {incoming.length}
                          </span>
                        </div>

                        <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-600 dark:text-slate-400">
                          Files the other device sent to you. Review, approve, and download them here — nothing is stored on the server.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {activeIncoming.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-extrabold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600" />
                              </span>
                              {activeIncoming.length} receiving
                            </span>
                          )}
                          {pendingIncoming.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">
                              <Clock size={10} strokeWidth={2.8} />
                              {pendingIncoming.length} awaiting approval
                            </span>
                          )}
                          {completedIncoming.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                              <CheckCircle size={10} strokeWidth={2.8} />
                              {completedIncoming.length} ready
                            </span>
                          )}
                          {failedIncoming.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold text-red-700 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20">
                              <AlertCircle size={10} strokeWidth={2.8} />
                              {failedIncoming.length} failed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                      {pendingIncoming.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleAcceptAll}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 text-[11px] font-extrabold text-white shadow-md shadow-blue-600/25 transition hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.97]"
                          >
                            <CheckCircle size={14} strokeWidth={2.6} />
                            Accept all
                            <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-extrabold">
                              {pendingIncoming.length}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRejectAll}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.97] dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-500/10"
                          >
                            <XCircle size={14} />
                            Reject all
                          </button>
                        </>
                      )}
                      {completedIncoming.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDownloadAllCompleted}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 text-[11px] font-extrabold text-emerald-700 shadow-sm transition hover:shadow-md active:scale-[0.97] dark:border-emerald-500/30 dark:from-emerald-500/15 dark:to-emerald-500/10 dark:text-emerald-400"
                        >
                          <DownloadCloud size={14} strokeWidth={2.4} />
                          Download all
                          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                            {completedIncoming.length}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Data received
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          <HardDrive size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-base font-extrabold text-slate-900 dark:text-white">
                        {formatBytes(totalIncomingReceived)}
                      </p>
                    </div>

                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Ready
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {completedIncoming.length}
                      </p>
                    </div>

                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-amber-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Awaiting
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                          <Clock size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-extrabold text-amber-600 dark:text-amber-400">
                        {pendingIncoming.length}
                      </p>
                    </div>

                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-red-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Failed
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                          <AlertCircle size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-extrabold text-red-600 dark:text-red-400">
                        {failedIncoming.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/30 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const ids = filteredIncomingFiles.map((file) => file.fileId || file.id).filter(Boolean);
                        setSelectedFiles((current) => {
                          const next = new Set(current);
                          const every = ids.length > 0 && ids.every((id) => next.has(id));
                          ids.forEach((id) => (every ? next.delete(id) : next.add(id)));
                          return next;
                        });
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                    >
                      {filteredIncomingFiles.length > 0 &&
                      filteredIncomingFiles.every((file) => selectedFiles.has(file.fileId || file.id)) ? (
                        <CheckSquare size={12} className="text-blue-600" />
                      ) : (
                        <Square size={12} />
                      )}
                      Select all
                    </button>

                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                      Showing {filteredIncomingFiles.length} of {incoming.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {failedIncoming.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRetryAllFailedIncoming}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-[10px] font-bold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900/50 dark:bg-[#15171d] dark:text-red-400"
                      >
                        <RotateCcw size={12} />
                        Retry failed
                      </button>
                    )}
                    {failedIncoming.length + cancelledIncoming.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCancelledIncoming}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                      >
                        <Eraser size={12} />
                        Clear errors
                      </button>
                    )}
                    {completedIncoming.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCompletedIncoming}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                      >
                        <CheckCircle size={12} />
                        Clear completed
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5">
                  {filteredIncomingFiles.length === 0 ? (
                    <EmptyQueue type="incoming" />
                  ) : (
                    <div className={fileView === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'space-y-2.5'}>
                      {filteredIncomingFiles.map((file) => (
                        <EnhancedFileRow
                          key={`received-${file.fileId || file.id}`}
                          file={file}
                          direction="incoming"
                          selected={selectedFiles.has(file.fileId || file.id)}
                          onToggleSelect={toggleFileSelection}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onDownload={handleDownload}
                          onRetry={handleRetry}
                          onCancel={(id) => handleCancel(id, 'incoming')}
                          onRemove={handleRemove}
                          onCopyName={handleCopyName}
                          compact={fileView === 'grid'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ============================
                  SENT SECTION
              ============================ */}
              <div
                id="webdrop-send-files"
                className="min-w-0 scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl dark:border-slate-800 dark:bg-[#0f1115]"
              >
                {/* Header */}
                <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-violet-50 via-fuchsia-50/40 to-white p-5 dark:border-slate-800 dark:from-violet-500/[0.08] dark:via-slate-900/50 dark:to-[#0f1115] sm:p-6">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10" />

                  <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
                        <CloudUpload size={24} strokeWidth={2.4} className="text-white" />
                        {failedOutgoing.length > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-extrabold text-white shadow-md dark:border-[#0f1115]">
                            {failedOutgoing.length}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Sent Files
                          </h3>
                          <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                            {outgoing.length}
                          </span>
                        </div>

                        <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-600 dark:text-slate-400">
                          Files you have transferred to the other device. Track delivery in real time and retry any failures.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {activeOutgoing.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-extrabold text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/20">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-600" />
                              </span>
                              {activeOutgoing.length} sending
                            </span>
                          )}
                          {completedOutgoing.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                              <CheckCircle size={10} strokeWidth={2.8} />
                              {completedOutgoing.length} delivered
                            </span>
                          )}
                          {failedOutgoing.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold text-red-700 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20">
                              <AlertCircle size={10} strokeWidth={2.8} />
                              {failedOutgoing.length} failed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                      {failedOutgoing.length > 0 && (
                        <button
                          type="button"
                          onClick={handleRetryAllFailedOutgoing}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-300 bg-gradient-to-br from-red-50 to-red-100 px-4 text-[11px] font-extrabold text-red-700 shadow-sm transition hover:shadow-md active:scale-[0.97] dark:border-red-500/30 dark:from-red-500/15 dark:to-red-500/10 dark:text-red-400"
                        >
                          <RotateCcw size={14} strokeWidth={2.6} />
                          Retry failed
                          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                            {failedOutgoing.length}
                          </span>
                        </button>
                      )}
                      {completedOutgoing.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCompletedOutgoing}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 active:scale-[0.97] dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10"
                        >
                          <CheckCircle size={14} />
                          Clear delivered
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-violet-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Data sent
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                          <HardDrive size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-base font-extrabold text-slate-900 dark:text-white">
                        {formatBytes(totalOutgoingSent)}
                      </p>
                    </div>

                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Delivered
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        {completedOutgoing.length}
                      </p>
                    </div>

                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-violet-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Sending
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                          <Zap size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-extrabold text-violet-600 dark:text-violet-400">
                        {activeOutgoing.length}
                      </p>
                    </div>

                    <div className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-red-200 hover:shadow-sm dark:border-slate-800 dark:bg-[#15171d]">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Failed
                        </p>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                          <AlertCircle size={11} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-extrabold text-red-600 dark:text-red-400">
                        {failedOutgoing.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/30 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const ids = filteredOutgoingFiles.map((file) => file.fileId || file.id).filter(Boolean);
                        setSelectedFiles((current) => {
                          const next = new Set(current);
                          const every = ids.length > 0 && ids.every((id) => next.has(id));
                          ids.forEach((id) => (every ? next.delete(id) : next.add(id)));
                          return next;
                        });
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                    >
                      {filteredOutgoingFiles.length > 0 &&
                      filteredOutgoingFiles.every((file) => selectedFiles.has(file.fileId || file.id)) ? (
                        <CheckSquare size={12} className="text-violet-600" />
                      ) : (
                        <Square size={12} />
                      )}
                      Select all
                    </button>

                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                      Showing {filteredOutgoingFiles.length} of {outgoing.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {failedOutgoing.length + cancelledOutgoing.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCancelledOutgoing}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                      >
                        <Eraser size={12} />
                        Clear errors
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5">
                  {filteredOutgoingFiles.length === 0 ? (
                    <EmptyQueue type="outgoing" onShare={() => fileInputRef.current?.click()} />
                  ) : (
                    <div className={fileView === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'space-y-2.5'}>
                      {filteredOutgoingFiles.map((file) => (
                        <EnhancedFileRow
                          key={`sent-${file.fileId || file.id}`}
                          file={file}
                          direction="outgoing"
                          selected={selectedFiles.has(file.fileId || file.id)}
                          onToggleSelect={toggleFileSelection}
                          onRetry={handleRetry}
                          onCancel={(id) => handleCancel(id, 'outgoing')}
                          onRemove={handleRemove}
                          onCopyName={handleCopyName}
                          compact={fileView === 'grid'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400">
                      Session overview
                    </p>

                    <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                      Room activity
                    </h3>
                  </div>

                  <Activity size={18} className="text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Files
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                      {incoming.length + outgoing.length}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Total transfers
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                      {activeIncoming.length + activeOutgoing.length}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Current transfers
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Received
                    </p>

                    <p className="mt-1 truncate text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatBytes(totalIncomingReceived)}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Downloaded this room
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sent
                    </p>

                    <p className="mt-1 truncate text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatBytes(totalOutgoingSent)}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Uploaded this room
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`min-w-0 rounded-3xl border p-5 shadow-sm transition ${
                  connected && peerCount >= 2
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1115]'
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[10px] font-extrabold uppercase tracking-[0.15em] ${
                          connected && peerCount >= 2
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-violet-600 dark:text-violet-400'
                        }`}
                      >
                        Connected Devices
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                          connected && peerCount >= 2
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                        }`}
                      >
                        {peerCount}/2
                      </span>
                    </div>

                    <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                      Room participants
                    </h3>
                  </div>

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      connected && peerCount >= 2
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500'
                    }`}
                  >
                    {connected && peerCount >= 2 ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Users size={18} />
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-3 ${
                    connected && peerCount >= 2
                      ? 'border-emerald-200 bg-white dark:border-emerald-500/20 dark:bg-[#0f1115]'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold ${
                        connected && peerCount >= 2
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {connected && peerCount >= 2
                        ? 'Connected Devices 2/2'
                        : `Connected Devices ${peerCount}/2`}
                    </span>

                    <span
                      className={`h-2 w-2 rounded-full ${
                        connected && peerCount >= 2
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-500/10 dark:bg-violet-500/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                        <YouIcon size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {deviceName}
                          </p>

                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white">
                            You
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {getDeviceLabel(deviceInfo, deviceName)}
                        </p>
                      </div>

                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    </div>

                    {peer ? (
                      <div
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          connected
                            ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/10 dark:bg-emerald-500/5'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            connected
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-white text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
                          }`}
                        >
                          <PeerIcon size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {peerDeviceName}
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {peer?.deviceInfo?.browser || 'Web browser'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {role === 'host' && (
                            <button
                              type="button"
                              onClick={() => handleKickPeer(peer.socketId)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                              title="Remove peer"
                              aria-label="Remove peer"
                            >
                              <X size={15} />
                            </button>
                          )}

                          <span
                            className={`h-2 w-2 rounded-full ${
                              connected ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-800">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500">
                          <Users size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Waiting for another device
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            Share the room code or QR.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleShare}
                          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                        >
                          <Share2 size={12} />
                          Share
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400">Live transfer</p>
                    <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Transfer dashboard</h3>
                  </div>
                  <BarChart3 size={18} className="text-slate-400" />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Current speed</p>
                      <p className="mt-1 truncate text-2xl font-extrabold text-slate-900 dark:text-white">{formatSpeed(totalActiveSpeed)}</p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                      <Zap size={20} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>{activeIncoming.length + activeOutgoing.length} active transfer{activeIncoming.length + activeOutgoing.length === 1 ? '' : 's'}</span>
                    <span>{connectionQuality.label}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                    <div className={`h-full rounded-full transition-all ${connected ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'}`} style={{ width: `${Math.min(100, Math.max(connected ? 18 : 0, totalActiveSpeed ? Math.min(100, (totalActiveSpeed / (10 * 1024 * 1024)) * 100) : 0))}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="min-w-0 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Sent</p>
                    <p className="mt-1 truncate text-base font-extrabold text-slate-900 dark:text-white">{formatBytes(totalOutgoingSent)}</p>
                    <p className="mt-1 text-[9px] text-slate-400">{outgoing.length} outgoing files</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Received</p>
                    <p className="mt-1 truncate text-base font-extrabold text-slate-900 dark:text-white">{formatBytes(totalIncomingReceived)}</p>
                    <p className="mt-1 text-[9px] text-slate-400">{incoming.length} incoming files</p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400">Session history</p>
                    <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Activity timeline</h3>
                  </div>
                  <ClipboardList size={18} className="text-slate-400" />
                </div>

                <div className="mt-4 max-h-[255px] space-y-2 overflow-auto pr-1">
                  {activity.length === 0 ? (
                    <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center dark:border-slate-800">
                      <Activity size={22} className="text-slate-300 dark:text-slate-600" />
                      <p className="mt-2 text-xs font-semibold text-slate-500">No activity yet</p>
                      <p className="mt-1 text-[10px] text-slate-400">Room events will appear here.</p>
                    </div>
                  ) : activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-2.5 dark:border-slate-800">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.tone === 'emerald' ? 'bg-emerald-500' : item.tone === 'red' ? 'bg-red-500' : item.tone === 'blue' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-300">{item.message}</p>
                        <p className="mt-0.5 text-[9px] text-slate-400">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-[#0f1115]">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    connected
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  }`}
                >
                  {connected ? (
                    <CheckCircle size={17} />
                  ) : (
                    <WifiOff size={17} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {connected
                      ? 'Ready for peer-to-peer transfer'
                      : 'Waiting for a peer to connect'}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Room {roomCode} · {role === 'host' ? 'Host' : 'Guest'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  No server storage
                </span>

                <span className="hidden h-3 w-px bg-slate-200 sm:block dark:bg-slate-700" />

                <span className="inline-flex items-center gap-1.5">
                  <Zap size={13} />
                  {formatSpeed(totalActiveSpeed)}
                </span>

                <span className="hidden h-3 w-px bg-slate-200 sm:block dark:bg-slate-700" />

                <span className="inline-flex items-center gap-1.5">
                  <Info size={13} />
                  Press Ctrl+V to paste
                </span>
              </div>
            </div>
          </section>
        </ResizableSidebarLayout>
      </main>

      {/* Premium desktop Quick Access Dock — RIGHT edge */}
      <nav
        aria-label="Desktop transfer shortcuts"
        className="fixed right-3 top-1/2 z-[130] hidden -translate-y-1/2 flex-col gap-2 rounded-[26px] border border-white/80 bg-white/80 p-2 shadow-[0_16px_48px_rgba(48,35,90,0.18)] backdrop-blur-2xl lg:flex dark:border-white/10 dark:bg-[#151520]/85"
      >
        <button
          type="button"
          onClick={() => document.getElementById('webdrop-send-files')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          title="Go to Send files"
          className="group relative flex h-[66px] w-[66px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[19px] border border-violet-400/20 bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 text-white shadow-[0_8px_20px_rgba(109,40,217,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(109,40,217,0.36)] active:scale-[0.96]"
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-80" />
          <CloudUpload size={19} strokeWidth={2.4} className="relative" />
          <span className="relative text-[11px] font-extrabold tracking-wide">Send</span>
          {outgoing.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border border-white/25 bg-white/20 px-1 text-[9px] font-extrabold text-white">
              {outgoing.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => document.getElementById('webdrop-receive-files')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          title="Go to Received files"
          className="group relative flex h-[66px] w-[66px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[19px] border border-sky-300/60 bg-gradient-to-br from-white via-sky-50 to-indigo-50 text-slate-800 shadow-[0_6px_18px_rgba(59,130,246,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-[0_10px_24px_rgba(59,130,246,0.2)] active:scale-[0.96] dark:border-sky-400/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 dark:text-white"
        >
          <Inbox size={19} strokeWidth={2.4} className="text-sky-600 dark:text-sky-300" />
          <span className="text-[11px] font-extrabold tracking-wide">Receive</span>
          {incoming.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-sky-600 px-1 text-[9px] font-extrabold text-white dark:bg-sky-500">
              {incoming.length}
            </span>
          )}
          {pendingIncoming.length > 0 && (
            <span className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 dark:border-slate-900" />
          )}
        </button>

        <span className="mx-auto h-px w-8 bg-slate-200 dark:bg-slate-700" />

        <button
          type="button"
          disabled={!connected}
          onClick={() => fileInputRef.current?.click()}
          title="Quick send files"
          className="group relative flex h-[52px] w-[66px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] border border-slate-200 bg-white text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
        >
          <Plus size={16} strokeWidth={2.6} />
          <span className="text-[9px] font-extrabold tracking-wide">Add</span>
        </button>

        <button
          type="button"
          disabled={!connected}
          onClick={() => folderInputRef.current?.click()}
          title="Quick send folder"
          className="group relative flex h-[52px] w-[66px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] border border-slate-200 bg-white text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
        >
          <FolderOpen size={16} strokeWidth={2.4} />
          <span className="text-[9px] font-extrabold tracking-wide">Folder</span>
        </button>

        <span className="mx-auto h-px w-8 bg-slate-200 dark:bg-slate-700" />

        {pendingIncoming.length > 0 && (
          <button
            type="button"
            onClick={handleAcceptAll}
            title={`Accept all ${pendingIncoming.length} incoming files`}
            className="group relative flex h-[52px] w-[66px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            <CheckCircle size={16} strokeWidth={2.6} />
            <span className="text-[9px] font-extrabold tracking-wide">Accept</span>
            <span className="absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[8px] font-extrabold text-white">
              {pendingIncoming.length}
            </span>
          </button>
        )}

        {completedIncoming.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadAllCompleted}
            title={`Download all ${completedIncoming.length} completed files`}
            className="group relative flex h-[52px] w-[66px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] border border-blue-300 bg-blue-50 text-blue-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
          >
            <DownloadCloud size={16} strokeWidth={2.4} />
            <span className="text-[9px] font-extrabold tracking-wide">Save</span>
            <span className="absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-extrabold text-white">
              {completedIncoming.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top"
          aria-label="Back to top"
          className="group relative flex h-[40px] w-[66px] items-center justify-center overflow-hidden rounded-[14px] border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-400 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
        >
          <ChevronDown size={15} className="rotate-180" strokeWidth={2.6} />
        </button>
      </nav>

      {/* Liquid-glass quick navigation for phones */}
      <nav
        aria-label="File transfer quick navigation"
        className="fixed inset-x-3 bottom-[max(10px,env(safe-area-inset-bottom))] z-[120] mx-auto w-auto max-w-[420px] rounded-[24px] border border-white/90 bg-white/90 p-2 shadow-[0_12px_34px_rgba(35,25,75,0.20)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/80 sm:inset-x-4 sm:bottom-4 sm:max-w-[440px] dark:border-white/10 dark:bg-[#11121a]/90 dark:supports-[backdrop-filter]:bg-[#11121a]/80 lg:hidden"
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => document.getElementById('webdrop-send-files')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="group relative flex min-h-[52px] min-w-0 items-center justify-center gap-2 rounded-[16px] border border-violet-400/20 bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 px-2.5 text-white shadow-[0_5px_14px_rgba(109,40,217,0.24)] transition duration-200 hover:shadow-[0_8px_20px_rgba(109,40,217,0.30)] active:scale-[0.97]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/15 shadow-inner">
              <CloudUpload size={17} strokeWidth={2.3} />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-[13px] font-extrabold leading-4 tracking-wide">Send</span>
              <span className="block text-[10px] font-medium text-white/75">{outgoing.length} files</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('webdrop-receive-files')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="group relative flex min-h-[52px] min-w-0 items-center justify-center gap-2 rounded-[16px] border border-sky-200/80 bg-gradient-to-br from-white via-sky-50/90 to-indigo-50/80 px-2.5 text-slate-800 shadow-[0_4px_13px_rgba(59,130,246,0.09)] transition duration-200 hover:border-sky-300 hover:shadow-[0_7px_18px_rgba(59,130,246,0.14)] active:scale-[0.97] dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 dark:text-white"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-100/80 text-sky-700 dark:border-sky-400/10 dark:bg-sky-400/10 dark:text-sky-300">
              <Inbox size={17} strokeWidth={2.3} />
              {pendingIncoming.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-extrabold text-white dark:border-[#11121a]">
                  {pendingIncoming.length}
                </span>
              )}
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-[13px] font-extrabold leading-4 tracking-wide">Receive</span>
              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {pendingIncoming.length ? `${pendingIncoming.length} waiting` : `${incoming.length} files`}
              </span>
            </span>
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            disabled={!connected}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 active:scale-[0.96] disabled:opacity-40 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
          >
            <Plus size={13} strokeWidth={2.6} />
            Add files
          </button>

          <button
            type="button"
            disabled={!connected}
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 active:scale-[0.96] disabled:opacity-40 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
          >
            <FolderOpen size={13} strokeWidth={2.4} />
            Folder
          </button>

          {pendingIncoming.length > 0 && (
            <button
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-[11px] font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 active:scale-[0.96] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
            >
              <CheckCircle size={13} strokeWidth={2.6} />
              Accept {pendingIncoming.length}
            </button>
          )}

          {completedIncoming.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAllCompleted}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 text-[11px] font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-[0.96] dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
            >
              <DownloadCloud size={13} strokeWidth={2.4} />
              Save all
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 active:scale-[0.96] dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
          >
            <Share2 size={13} strokeWidth={2.4} />
            Invite
          </button>
        </div>
      </nav>

      {/* Actionable incoming-file toast */}
      {incomingOfferToast && (
        <div role="status" className="fixed right-2 top-[max(8px,env(safe-area-inset-top))] z-[250] w-[min(340px,calc(100vw-1rem))] overflow-hidden rounded-[20px] border border-white/85 bg-white/92 p-3 shadow-[0_14px_42px_rgba(35,25,75,0.24)] backdrop-blur-2xl animate-in slide-in-from-top-2 fade-in duration-200 sm:right-4 sm:top-[max(16px,env(safe-area-inset-top))] sm:w-[min(360px,calc(100vw-2rem))] sm:rounded-3xl sm:p-4 dark:border-white/10 dark:bg-[#171722]/95">
          <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 text-white shadow-md shadow-violet-500/20 sm:h-11 sm:w-11 sm:rounded-2xl"><Inbox size={17} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2"><p className="text-sm font-extrabold text-slate-900 dark:text-white">Incoming file{incomingOfferToast.multiple ? 's' : ''}</p><button type="button" onClick={() => setIncomingOfferToast(null)} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10" aria-label="Dismiss incoming file notification"><X size={15} /></button></div>
              <p className="mt-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{incomingOfferToast.name || 'A file is ready to send'}</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{formatBytes(incomingOfferToast.size || 0)} · Waiting for your approval</p>
              <div className="mt-2.5 flex gap-2 sm:mt-3">
                <button type="button" onClick={() => { if (incomingOfferToast.multiple) { handleAcceptAll(); } else { handleAccept(incomingOfferToast.fileId); } setIncomingOfferToast(null); }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 text-[11px] font-extrabold text-white shadow-md shadow-violet-600/20 transition hover:brightness-110 active:scale-[0.98] sm:px-3 sm:text-xs"><CheckCircle size={14} />Accept{incomingOfferToast.multiple ? ' all' : ''}</button>
                <button type="button" onClick={() => { if (incomingOfferToast.multiple) { pendingIncoming.forEach((file) => handleReject(file.fileId || file.id)); } else { handleReject(incomingOfferToast.fileId); } setIncomingOfferToast(null); }} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-2.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 sm:px-3 sm:text-xs dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10"><X size={14} />Decline</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        roomCode={roomCode}
        inviteUrl={inviteUrl}
        onCopyLink={handleCopyInvite}
        onCopyCode={handleCopyRoom}
      />

      <ConfirmModal
        open={confirmEndOpen}
        title="End this room?"
        message="The connected device will be disconnected and this room cannot be used again."
        confirmLabel="End Room"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirmEndOpen(false)}
        onConfirm={() => {
          setConfirmEndOpen(false);
          performEndRoom();
        }}
      />

      <ConfirmModal
        open={confirmLeaveOpen}
        title="Leave this room?"
        message={
          role === 'host'
            ? 'You will leave the room, but it will stay open. You can rejoin later using the same room code. To close the room permanently, use End Room.'
            : 'You will be disconnected from the peer. Active transfers will be cancelled.'
        }
        confirmLabel="Leave"
        cancelLabel="Stay"
        destructive
        onCancel={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false);
          performLeaveRoom();
        }}
      />

      <style>{`
        @keyframes roomAlertBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(0.88); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="alert"] * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}