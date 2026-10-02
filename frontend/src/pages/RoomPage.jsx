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
  LogOut,
  Copy as CopyIcon,
  DownloadCloud,
  Eraser,
  Gauge,
  Info,
  Link as LinkIcon,
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

import {
  detectDevice,
  detectDeviceInfo,
  formatBytes,
  formatETA,
  getFileCategory,
} from '../utils/fileUtils';

const LARGE_FILE_WARNING_BYTES = 500 * 1024 * 1024;

const IGNORED_FILES = new Set([
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
]);

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
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center dark:border-slate-800 dark:bg-slate-900/20">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800/80 dark:text-slate-500">
        {incoming ? <Inbox size={18} /> : <Send size={18} />}
      </div>

      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {incoming ? 'No incoming files' : 'No outgoing files'}
      </p>

      <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-500 dark:text-slate-500">
        {incoming
          ? 'Files received from the peer will appear here.'
          : 'Drag files into the drop zone above, paste, or choose files.'}
      </p>

      {!incoming && onShare && (
        <button
          type="button"
          onClick={onShare}
          className="mt-3 inline-flex h-9 w-full max-w-[220px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 active:scale-[0.98] dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400 sm:h-8 sm:w-auto sm:text-[10px]"
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
/* File row — PC actions on the RIGHT                                         */
/* -------------------------------------------------------------------------- */

function FileRow({
  file,
  direction,
  onAccept,
  onReject,
  onDownload,
  onRetry,
  onCancel,
  onRemove,
  onCopyName,
}) {
  const isIncoming = direction === 'incoming';
  const status = file?.status || 'pending';

  const isPending =
    status === 'pending' || status === 'waiting' || status === 'offer';

  const isActive =
    status === 'sending' ||
    status === 'receiving' ||
    status === 'transferring' ||
    status === 'active';

  const isCompleted =
    status === 'completed' || status === 'success' || status === 'done';

  const isFailed = status === 'failed' || status === 'error';

  const isCancelled =
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'rejected';

  const transferred = isIncoming
    ? Number(file?.bytesReceived || file?.receivedBytes || 0)
    : Number(file?.bytesSent || file?.sentBytes || 0);

  const calculatedProgress =
    file?.size > 0 ? (transferred / file.size) * 100 : 0;

  const progress = Math.min(
    100,
    Math.max(
      0,
      isCompleted
        ? 100
        : Math.max(Number(file?.progress || 0), calculatedProgress),
    ),
  );

  const speed = Number(file?.speed || file?.bytesPerSecond || 0);
  const eta = Number(file?.eta || file?.remainingTime || 0);
  const fileId = file?.fileId || file?.id;

  const handleRemoveClick = () => onRemove?.(fileId, direction);

  return (
    <div
      className={`rounded-2xl border bg-white px-3 py-3 shadow-sm transition hover:border-slate-300 dark:bg-[#0f1115] dark:hover:border-slate-700 ${
        isCancelled
          ? 'border-red-200 dark:border-red-900/50'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <FileTypeIcon file={file} />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <p
              className="min-w-0 flex-1 break-words text-xs font-bold leading-5 text-slate-900 dark:text-white sm:truncate sm:leading-normal"
              title={file?.name}
            >
              {file?.name || 'Unnamed file'}
            </p>

            <button
              type="button"
              onClick={() => onCopyName?.(file?.name)}
              className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800 sm:flex"
              title="Copy filename"
              aria-label="Copy filename"
            >
              <CopyIcon size={12} />
            </button>

            <span className="shrink-0 pt-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {formatBytes(file?.size || 0)}
            </span>
          </div>

          {isActive ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${
                    isIncoming ? 'bg-blue-500' : 'bg-violet-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="w-9 shrink-0 text-right text-[9px] font-bold text-slate-500 dark:text-slate-400">
                {Math.round(progress)}%
              </span>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              {isPending && isIncoming && (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Waiting for approval
                </span>
              )}

              {isCompleted && (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Completed
                </span>
              )}

              {isFailed && (
                <span className="font-semibold text-red-600 dark:text-red-400">
                  Transfer failed
                </span>
              )}

              {isCancelled && (
                <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                  <XCircle size={11} />
                  Cancelled
                </span>
              )}

              {!isPending &&
                !isCompleted &&
                !isFailed &&
                !isCancelled &&
                !isActive && (
                  <span className="text-slate-400 dark:text-slate-500">
                    {isIncoming ? 'Incoming' : 'Outgoing'}
                  </span>
                )}
            </div>
          )}

          {isActive && (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                {isIncoming ? 'Receiving' : 'Sending'}
              </span>

              <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-slate-500">
                {speed > 0 && <span>{formatSpeed(speed)}</span>}
                {eta > 0 && <span>{formatETA(eta)}</span>}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
            {isPending && isIncoming && (
              <>
                <button
                  type="button"
                  onClick={() => onAccept?.(fileId)}
                  className="flex h-9 flex-1 min-w-[100px] items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 text-[11px] font-bold text-white shadow-sm transition active:scale-95"
                >
                  <CheckCircle size={14} />
                  Accept
                </button>

                <button
                  type="button"
                  onClick={() => onReject?.(fileId)}
                  className="flex h-9 flex-1 min-w-[100px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition active:scale-95 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
                >
                  <X size={14} />
                  Reject
                </button>
              </>
            )}

            {isActive && (
              <button
                type="button"
                onClick={() => onCancel?.(fileId)}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 text-[11px] font-bold text-red-500 transition active:scale-95 dark:border-red-900/50"
              >
                <X size={14} />
                Cancel
              </button>
            )}

            {isCompleted && isIncoming && (
              <button
                type="button"
                onClick={() => onDownload?.(fileId)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download size={16} />
                Download
              </button>
            )}

            {isFailed && (
              <button
                type="button"
                onClick={() => onRetry?.(fileId)}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition active:scale-95 dark:border-slate-700 dark:text-slate-300"
              >
                <RotateCcw size={14} />
                Retry
              </button>
            )}

            {!isActive && !isPending && !isCompleted && !isFailed && (
              <button
                type="button"
                onClick={handleRemoveClick}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition active:scale-95 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:hover:bg-red-500/10"
                title="Remove"
                aria-label="Remove file"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {isPending && isIncoming && (
            <>
              <button
                type="button"
                onClick={() => onReject?.(fileId)}
                className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={12} />
                Reject
              </button>

              <button
                type="button"
                onClick={() => onAccept?.(fileId)}
                className="flex h-8 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-[10px] font-bold text-white transition hover:bg-violet-700"
              >
                <CheckCircle size={12} />
                Accept
              </button>
            </>
          )}

          {isActive && (
            <button
              type="button"
              onClick={() => onCancel?.(fileId)}
              className="flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-[10px] font-bold text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
              title="Cancel transfer"
              aria-label="Cancel transfer"
            >
              <X size={12} />
              Cancel
            </button>
          )}

          {isCompleted && isIncoming && (
            <button
              type="button"
              onClick={() => onDownload?.(fileId)}
              title="Download file"
              aria-label={`Download ${file?.name || 'file'}`}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download size={13} />
              Download
            </button>
          )}

          {isFailed && (
            <button
              type="button"
              onClick={() => onRetry?.(fileId)}
              className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw size={12} />
              Retry
            </button>
          )}

          {!isActive && !isPending && !isCompleted && !isFailed && (
            <button
              type="button"
              onClick={handleRemoveClick}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:hover:bg-red-500/10"
              title="Remove"
              aria-label="Remove file"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
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

  const [joining, setJoining] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [roomExpired, setRoomExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const qrRef = useRef(null);
  const joinedRef = useRef(false);
  const disconnectingRef = useRef(false);
  const hostTokenRef = useRef(getHostToken(roomCode));

  /* ------------------------------------------------------------------------ */
  /* Stable refs for context setters                                          */
  /* ------------------------------------------------------------------------ */

  const setUsersRef = useRef(setUsers);
  const setLockedRef = useRef(setLocked);
  const setExpiresAtRef = useRef(setExpiresAt);
  const setRoomExpiredRef = useRef(setRoomExpired);
  const setRoomErrorRef = useRef(setRoomError);

  useEffect(() => {
    setUsersRef.current = setUsers;
    setLockedRef.current = setLocked;
    setExpiresAtRef.current = setExpiresAt;
    setRoomExpiredRef.current = setRoomExpired;
    setRoomErrorRef.current = setRoomError;
  }, [setUsers, setLocked]);

  /* Track incoming file IDs we've already toasted for. */
  const notifiedIncomingRef = useRef(new Set());

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

          addRecentRoom?.({
            roomCode,
            role: detectedRole,
            deviceName,
            joinedAt: Date.now(),
          });

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
    };

    const handleUserJoined = (payload) => {
      if (payload?.users) setUsersRef.current(payload.users);
      if (typeof payload?.locked === 'boolean')
        setLockedRef.current(payload.locked);
      if (payload?.expiresAt) setExpiresAtRef.current(payload.expiresAt);
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
      clearHostToken(roomCode);
      setRoomErrorRef.current('The host ended this room.');
      toast.error('The host ended this room.');
    };

    const handleKicked = () => {
      clearHostToken(roomCode);
      setRoomErrorRef.current('You were removed from this room.');
      toast.error('You were removed from this room.');
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
  }, [socket, roomCode]);

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
      (response) => {
        if (response?.success === false) {
          disconnectingRef.current = false;
          toast.error(response?.message || 'Unable to end room.');
          return;
        }

        clearHostToken(roomCode);
        setRoomErrorRef.current('This room has been ended by the host.');
        toast.success('Room ended.');
      },
    );
  }, [role, socket, roomCode]);

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

    navigate('/');
  }, [socket, roomCode, navigate]);

  const handleLeaveRoom = useCallback(() => {
    setConfirmLeaveOpen(true);
  }, []);

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
    copyText(roomCode, 'Room code copied.');
  }, [roomCode, copyText]);

  const handleCopyInvite = useCallback(() => {
    copyText(inviteUrl, 'Invite link copied.');
  }, [inviteUrl, copyText]);

  const handleCopyName = useCallback(
    (name) => {
      copyText(name, 'Filename copied.');
    },
    [copyText],
  );

  const handleShare = useCallback(async () => {
    if (!navigator.share) {
      handleCopyInvite();
      return;
    }

    try {
      await navigator.share({
        title: 'Join WebDrop room',
        text: `Join my WebDrop room: ${roomCode}`,
        url: inviteUrl,
      });
    } catch {
      // User cancelled.
    }
  }, [roomCode, inviteUrl, handleCopyInvite]);

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

  /* Close QR on outside click / Escape */
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

  const failedFiles = [...incoming, ...outgoing].filter(
    (file) => file.status === 'failed' || file.status === 'error',
  );

  const cancelledFiles = [...incoming, ...outgoing].filter(
    (file) =>
      file.status === 'cancelled' ||
      file.status === 'canceled' ||
      file.status === 'rejected',
  );

  /* ------------------------------------------------------------------------ */
  /* Toast when a new incoming file offer arrives                             */
  /* ------------------------------------------------------------------------ */
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
      toast.success(
        `Incoming file: ${f.name || 'Unnamed file'} (${formatBytes(
          f.size || 0,
        )})`,
      );
    } else if (offers.length > 1) {
      const total = offers.reduce((s, f) => s + Number(f.size || 0), 0);
      toast.success(
        `${offers.length} incoming files (${formatBytes(
          total,
        )}) waiting for approval`,
      );
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

    const fn = transferRef.current?.removeFile;
    if (typeof fn !== 'function') return;

    try {
      fn(fileId, direction);
    } catch {
      try {
        fn(fileId);
      } catch {
        // swallow
      }
    }
  }, []);

  const handleClearCompleted = useCallback(() => {
    transferRef.current?.clearCompleted?.();
  }, []);

  const handleRetryAllFailed = useCallback(() => {
    if (!failedFiles.length) return;
    failedFiles.forEach((file) => {
      const id = file.fileId || file.id;
      transferRef.current?.retryFile?.(id);
    });
    toast.success(`Retrying ${failedFiles.length} file(s)...`);
  }, [failedFiles]);

  const handleClearCancelled = useCallback(() => {
    if (!cancelledFiles.length) return;

    cancelledFiles.forEach((file) => {
      const id = file.fileId || file.id;
      const direction = incoming.some((f) => (f.fileId || f.id) === id)
        ? 'incoming'
        : 'outgoing';
      transferRef.current?.removeFile?.(id, direction);
    });

    toast.success('Cleared cancelled files.');
  }, [cancelledFiles, incoming]);

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

  const radarFlow = useMemo(() => {
    if (activeOutgoing.length) return 'outgoing';
    if (activeIncoming.length) return 'incoming';
    if (connected) return 'connected';
    return 'idle';
  }, [activeOutgoing.length, activeIncoming.length, connected]);

  const YouIcon = getDeviceIconFromInfo(deviceInfo, deviceName);

  const peerDeviceName = getDeviceLabel(
    peer?.deviceInfo || {},
    peer?.deviceName || '',
  );

  const PeerIcon = getDeviceIconFromInfo(
    peer?.deviceInfo || {},
    peer?.deviceName || '',
  );

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
                <Share2 size={14} />
                Invite
              </button>

              {/* QR dropdown — single unified style on ALL screen sizes (no full-screen modal) */}
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
                    {/* Header */}
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

                    {/* QR image */}
                    <div className="flex items-center justify-center rounded-xl bg-white p-2 sm:p-3">
                      <img
                        src={qrUrl}
                        alt="WebDrop room QR code"
                        className="h-auto w-full max-w-[170px] sm:max-w-[220px]"
                      />
                    </div>

                    {/* Invite link */}
                    <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900/60 sm:mt-3 sm:px-3 sm:py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:text-[10px]">
                        Invite link
                      </p>

                      <p className="mt-0.5 truncate font-mono text-[10px] text-slate-700 dark:text-slate-300 sm:mt-1 sm:text-[11px]">
                        {inviteUrl}
                      </p>
                    </div>

                    {/* Copy link */}
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

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
              >
                <Share2 size={14} />
                Share
              </button>

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
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />
              Expires in {expiryText}
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

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
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

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <HardDrive
                      size={16}
                      className="text-violet-600 dark:text-violet-400"
                    />

                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Files in this room
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Incoming and outgoing transfers for this session.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                    {incoming.length + outgoing.length} total
                  </span>

                  {failedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRetryAllFailed}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <RotateCcw size={11} />
                      Retry all ({failedFiles.length})
                    </button>
                  )}

                  {completedIncoming.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadAllCompleted}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                    >
                      <DownloadCloud size={11} />
                      Download all
                    </button>
                  )}

                  {(completedIncoming.length > 0 ||
                    completedOutgoing.length > 0) && (
                    <button
                      type="button"
                      onClick={handleClearCompleted}
                      className="text-[11px] font-bold text-slate-500 transition hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                    >
                      Clear completed
                    </button>
                  )}

                  {cancelledFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCancelled}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 transition hover:text-red-600 dark:text-red-400"
                    >
                      <Eraser size={11} />
                      Clear cancelled
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Inbox
                        size={14}
                        className="text-violet-600 dark:text-violet-400"
                      />

                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Incoming
                      </span>

                      {pendingIncoming.length > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          {pendingIncoming.length} waiting
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {incoming.length} files
                    </span>
                  </div>

                  {incoming.length === 0 ? (
                    <EmptyQueue type="incoming" />
                  ) : (
                    <div className="space-y-2">
                      {incoming.map((file) => (
                        <FileRow
                          key={file.fileId || file.id}
                          file={file}
                          direction="incoming"
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onDownload={handleDownload}
                          onRetry={handleRetry}
                          onCancel={(id) => handleCancel(id, 'incoming')}
                          onRemove={handleRemove}
                          onCopyName={handleCopyName}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send
                        size={14}
                        className="text-violet-600 dark:text-violet-400"
                      />

                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Outgoing
                      </span>

                      {activeOutgoing.length > 0 && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-extrabold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                          {activeOutgoing.length} active
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {outgoing.length} files
                    </span>
                  </div>

                  {outgoing.length === 0 ? (
                    <EmptyQueue
                      type="outgoing"
                      onShare={() => fileInputRef.current?.click()}
                    />
                  ) : (
                    <div className="space-y-2">
                      {outgoing.map((file) => (
                        <FileRow
                          key={file.fileId || file.id}
                          file={file}
                          direction="outgoing"
                          onRetry={handleRetry}
                          onCancel={(id) => handleCancel(id, 'outgoing')}
                          onRemove={handleRemove}
                          onCopyName={handleCopyName}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0f1115]">
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
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
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

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
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

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
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

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
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
                className={`rounded-3xl border p-5 shadow-sm transition ${
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500">
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
                          onClick={handleCopyInvite}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
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

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-[#0f1115]">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
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

                <div>
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
        </div>
      </main>

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
    </div>
  );
}