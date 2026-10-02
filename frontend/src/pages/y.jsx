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

const LARGE_FILE_WARNING_BYTES =
  500 * 1024 * 1024;

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

  if (
    name.includes('ipad') ||
    name.includes('tablet')
  ) {
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

function getDeviceTypeFromInfo(
  deviceInfo = {},
  deviceName = '',
) {
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
    return values.includes('ipad')
      ? 'tablet'
      : 'phone';
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

  if (
    values.includes('tablet') ||
    values.includes('ipad')
  ) {
    return 'tablet';
  }

  return 'unknown';
}

function getDeviceIconFromInfo(
  deviceInfo = {},
  deviceName = '',
) {
  const type = getDeviceTypeFromInfo(
    deviceInfo,
    deviceName,
  );

  if (type === 'phone') return Smartphone;
  if (type === 'tablet') return Tablet;
  if (type === 'desktop') return Laptop;

  return getDeviceIcon(deviceName);
}

function getDeviceLabel(
  deviceInfo = {},
  deviceName = '',
) {
  const platform = String(
    deviceInfo?.platform ||
      deviceInfo?.os ||
      deviceInfo?.system ||
      '',
  ).toLowerCase();

  const type = getDeviceTypeFromInfo(
    deviceInfo,
    deviceName,
  );

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

  if (platform.includes('linux')) {
    return 'Linux PC';
  }

  if (
    platform.includes('chromeos') ||
    platform.includes('chrome os')
  ) {
    return 'ChromeOS PC';
  }

  if (platform.includes('android')) {
    return 'Android device';
  }

  if (platform.includes('ios')) {
    const name = String(
      deviceInfo?.model ||
        deviceInfo?.name ||
        deviceName,
    ).toLowerCase();

    return name.includes('ipad')
      ? 'iPad'
      : 'iPhone';
  }

  if (type === 'desktop') return 'Computer';
  if (type === 'tablet') return 'Tablet';
  if (type === 'phone') return 'Mobile device';

  return (
    deviceName ||
    deviceInfo?.name ||
    'Connected device'
  );
}

/* -------------------------------------------------------------------------- */
/* File helpers                                                               */
/* -------------------------------------------------------------------------- */

function getFileExtension(file = {}) {
  const name =
    file?.name ||
    file?.fileName ||
    '';

  const cleanName = name
    .split('?')[0]
    .split('#')[0];

  const parts = cleanName.split('.');

  if (parts.length < 2) return '';

  return parts
    .pop()
    .toLowerCase();
}

function getFileTypeMeta(file = {}) {
  const mime = String(
    file?.mimeType ||
      file?.type ||
      '',
  ).toLowerCase();

  const extension =
    getFileExtension(file);

  const category =
    getFileCategory(mime);

  if (
    mime === 'application/pdf' ||
    extension === 'pdf'
  ) {
    return {
      type: 'pdf',
      label: 'PDF',
      Icon: FileText,
      wrapper:
        'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
      badge:
        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    };
  }

  if (
    category === 'image' ||
    mime.startsWith('image/')
  ) {
    return {
      type: 'image',
      label: 'Image',
      Icon: FileImage,
      wrapper:
        'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      badge:
        'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    };
  }

  if (
    category === 'video' ||
    mime.startsWith('video/')
  ) {
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

  if (
    category === 'audio' ||
    mime.startsWith('audio/')
  ) {
    return {
      type: 'audio',
      label: 'Audio',
      Icon: FileAudio,
      wrapper:
        'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400',
      badge:
        'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
    };
  }

  if (
    category === 'archive' ||
    [
      'zip',
      'rar',
      '7z',
      'tar',
      'gz',
      'bz2',
      'xz',
    ].includes(extension)
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
    label: extension
      ? extension.toUpperCase()
      : 'File',
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
        {meta.label.length > 7
          ? meta.label.slice(0, 6)
          : meta.label}
      </span>
    </div>
  );
}

function formatSpeed(bytesPerSecond = 0) {
  if (
    !bytesPerSecond ||
    bytesPerSecond <= 0
  ) {
    return '—';
  }

  return `${formatBytes(
    bytesPerSecond,
  )}/s`;
}

/* -------------------------------------------------------------------------- */
/* Folder helpers                                                             */
/* -------------------------------------------------------------------------- */

function withRelativePath(
  file,
  relativePath = '',
) {
  if (!file) return file;

  const path =
    relativePath ||
    file.webkitRelativePath ||
    file.name;

  try {
    Object.defineProperty(
      file,
      'relativePath',
      {
        value: path,
        configurable: true,
        writable: true,
      },
    );
  } catch {
    try {
      file.relativePath = path;
    } catch {
      // Ignore readonly File objects.
    }
  }

  return file;
}

async function walkEntry(
  entry,
  parentPath = '',
) {
  if (!entry) return [];

  if (entry.isFile) {
    return new Promise(
      (resolve) => {
        entry.file((file) => {
          if (
            IGNORED_FILES.has(
              file.name,
            )
          ) {
            resolve([]);
            return;
          }

          const relativePath =
            parentPath
              ? `${parentPath}/${file.name}`
              : file.name;

          resolve([
            withRelativePath(
              file,
              relativePath,
            ),
          ]);
        });
      },
    );
  }

  if (entry.isDirectory) {
    const reader =
      entry.createReader();

    const entries = [];

    const readEntries = () =>
      new Promise(
        (resolve, reject) => {
          reader.readEntries(
            (batch) => {
              if (!batch.length) {
                resolve();
                return;
              }

              entries.push(
                ...batch,
              );

              readEntries().then(
                resolve,
                reject,
              );
            },
            reject,
          );
        },
      );

    await readEntries();

    const currentPath =
      parentPath
        ? `${parentPath}/${entry.name}`
        : entry.name;

    const files = [];

    for (const child of entries) {
      const nested =
        await walkEntry(
          child,
          currentPath,
        );

      files.push(...nested);
    }

    return files;
  }

  return [];
}

async function collectDroppedFiles(
  dataTransfer,
) {
  const files = [];

  if (!dataTransfer) {
    return files;
  }

  const items = Array.from(
    dataTransfer.items || [],
  );

  if (items.length) {
    for (const item of items) {
      if (item.kind !== 'file') {
        continue;
      }

      const entry =
        item.webkitGetAsEntry?.();

      if (entry) {
        const nested =
          await walkEntry(entry);

        files.push(...nested);
      } else {
        const file =
          item.getAsFile?.();

        if (
          file &&
          !IGNORED_FILES.has(
            file.name,
          )
        ) {
          files.push(
            withRelativePath(file),
          );
        }
      }
    }

    return files;
  }

  return Array.from(
    dataTransfer.files || [],
  )
    .filter(
      (file) =>
        !IGNORED_FILES.has(
          file.name,
        ),
    )
    .map((file) =>
      withRelativePath(file),
    );
}

function collectInputFiles(
  fileList,
) {
  return Array.from(fileList || [])
    .filter(
      (file) =>
        !IGNORED_FILES.has(
          file.name,
        ),
    )
    .map((file) =>
      withRelativePath(
        file,
        file.webkitRelativePath ||
          file.name,
      ),
    );
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111318]">
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

function InfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800/70">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
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

function EmptyQueue({ type }) {
  const incoming =
    type === 'incoming';

  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
        {incoming ? (
          <Inbox size={17} />
        ) : (
          <Send size={17} />
        )}
      </div>

      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {incoming
          ? 'No incoming files'
          : 'No outgoing files'}
      </p>

      <p className="mt-1 max-w-xs text-[11px] leading-5 text-slate-500 dark:text-slate-500">
        {incoming
          ? 'Files received from the peer will appear here.'
          : 'Files you send will appear here.'}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* File row                                                                   */
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
}) {
  const isIncoming =
    direction === 'incoming';

  const status =
    file?.status || 'pending';

  const isPending =
    status === 'pending' ||
    status === 'waiting' ||
    status === 'offer';

  const isActive =
    status === 'sending' ||
    status === 'receiving' ||
    status === 'transferring' ||
    status === 'active';

  const isCompleted =
    status === 'completed' ||
    status === 'success' ||
    status === 'done';

  const isFailed =
    status === 'failed' ||
    status === 'error';

  const isCancelled =
    status === 'cancelled' ||
    status === 'canceled' ||
    status === 'rejected';

  const transferred =
    isIncoming
      ? Number(
          file?.bytesReceived ||
            file?.receivedBytes ||
            0,
        )
      : Number(
          file?.bytesSent ||
            file?.sentBytes ||
            0,
        );

  const calculatedProgress =
    file?.size > 0
      ? (transferred /
          file.size) *
        100
      : 0;

  const progress = Math.min(
    100,
    Math.max(
      0,
      isCompleted
        ? 100
        : Math.max(
            Number(
              file?.progress || 0,
            ),
            calculatedProgress,
          ),
    ),
  );

  const speed = Number(
    file?.speed ||
      file?.bytesPerSecond ||
      0,
  );

  const eta = Number(
    file?.eta ||
      file?.remainingTime ||
      0,
  );

  const fileId =
    file?.fileId ||
    file?.id;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#111318] dark:hover:border-slate-700">
      {/* Top row: icon + info + actions (desktop) */}
      <div className="flex min-w-0 items-start gap-3">
        <FileTypeIcon file={file} />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <p
              className="min-w-0 flex-1 break-words text-xs font-bold leading-5 text-slate-900 dark:text-white sm:truncate sm:leading-normal"
              title={file?.name}
            >
              {file?.name ||
                'Unnamed file'}
            </p>

            <span className="shrink-0 pt-0.5 text-[10px] text-slate-400">
              {formatBytes(
                file?.size || 0,
              )}
            </span>
          </div>

          {isActive ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${
                    isIncoming
                      ? 'bg-blue-500'
                      : 'bg-violet-600'
                  }`}
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <span className="w-9 shrink-0 text-right text-[9px] font-bold text-slate-500">
                {Math.round(
                  progress,
                )}
                %
              </span>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
              {isPending &&
                isIncoming && (
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
                <span>
                  Cancelled
                </span>
              )}

              {!isPending &&
                !isCompleted &&
                !isFailed &&
                !isCancelled &&
                !isActive && (
                  <span>
                    {isIncoming
                      ? 'Incoming'
                      : 'Outgoing'}
                  </span>
                )}
            </div>
          )}

          {isActive && (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[9px] font-semibold text-slate-400">
                {isIncoming
                  ? 'Receiving'
                  : 'Sending'}
              </span>

              <div className="flex items-center gap-2 text-[9px] text-slate-400">
                {speed > 0 && (
                  <span>
                    {formatSpeed(
                      speed,
                    )}
                  </span>
                )}

                {eta > 0 && (
                  <span>
                    {formatETA(eta)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons - desktop / tablet (inline) */}
          <div className="mt-2 hidden items-center gap-1.5 sm:flex">
            {isPending &&
              isIncoming && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onReject?.(
                        fileId,
                      )
                    }
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <X size={12} />
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onAccept?.(
                        fileId,
                      )
                    }
                    className="flex h-8 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-[10px] font-bold text-white transition hover:bg-violet-700"
                  >
                    <CheckCircle
                      size={12}
                    />
                    Accept
                  </button>
                </>
              )}

            {isActive && (
              <button
                type="button"
                onClick={() =>
                  onCancel?.(fileId)
                }
                className="flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-[10px] font-bold text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
                title="Cancel transfer"
                aria-label="Cancel transfer"
              >
                <X size={12} />
                Cancel
              </button>
            )}

            {isCompleted &&
              isIncoming && (
                <button
                  type="button"
                  onClick={() =>
                    onDownload?.(
                      fileId,
                    )
                  }
                  title="Download file"
                  aria-label={`Download ${
                    file?.name ||
                    'file'
                  }`}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download
                    size={13}
                  />
                  Download
                </button>
              )}

            {isFailed && (
              <button
                type="button"
                onClick={() =>
                  onRetry?.(fileId)
                }
                className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw
                  size={12}
                />
                Retry
              </button>
            )}

            {!isActive &&
              !isPending &&
              !isCompleted &&
              !isFailed && (
                <button
                  type="button"
                  onClick={() =>
                    onRemove?.(fileId)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-red-500 dark:border-slate-700 dark:hover:bg-slate-800"
                  title="Remove"
                  aria-label="Remove file"
                >
                  <Trash2
                    size={13}
                  />
                </button>
              )}
          </div>
        </div>

        {/* Small screen inline icon-only actions (top right) */}
        <div className="flex shrink-0 items-center gap-1 sm:hidden">
          {isPending &&
            isIncoming && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onReject?.(fileId)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Reject file"
                >
                  <X size={14} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAccept?.(fileId)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700"
                  aria-label="Accept file"
                >
                  <CheckCircle
                    size={14}
                  />
                </button>
              </>
            )}

          {isActive && (
            <button
              type="button"
              onClick={() =>
                onCancel?.(fileId)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
              title="Cancel transfer"
              aria-label="Cancel transfer"
            >
              <X size={14} />
            </button>
          )}

          {isFailed && (
            <button
              type="button"
              onClick={() =>
                onRetry?.(fileId)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Retry"
            >
              <RotateCcw
                size={14}
              />
            </button>
          )}

          {!isActive &&
            !isPending &&
            !isCompleted &&
            !isFailed && (
              <button
                type="button"
                onClick={() =>
                  onRemove?.(fileId)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-red-500 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Remove"
                aria-label="Remove file"
              >
                <Trash2 size={13} />
              </button>
            )}
        </div>
      </div>

      {/* Mobile-only full-width Download button (below file) */}
      {isCompleted && isIncoming && (
        <button
          type="button"
          onClick={() =>
            onDownload?.(fileId)
          }
          title="Download file"
          aria-label={`Download ${
            file?.name || 'file'
          }`}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-200 dark:hover:bg-slate-800 sm:hidden"
        >
          <Download size={16} />
          Download
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function RoomPage() {
  const { roomCode: urlCode } =
    useParams();

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

  const deviceName =
    ctxDeviceName ||
    detectDevice();

  const deviceInfo =
    ctxDeviceInfo ||
    detectDeviceInfo();

  const roomCode = (
    urlCode || ''
  ).toUpperCase();

  const [joining, setJoining] =
    useState(true);

  const [roomError, setRoomError] =
    useState('');

  const [roomExpired, setRoomExpired] =
    useState(false);

  const [expiresAt, setExpiresAt] =
    useState(null);

  const [
    notifyEnabled,
    setNotifyEnabled,
  ] = useState(false);

  const [showQr, setShowQr] =
    useState(false);

  const [isDragging, setIsDragging] =
    useState(false);

  const [now, setNow] = useState(
    Date.now(),
  );

  const fileInputRef =
    useRef(null);

  const folderInputRef =
    useRef(null);

  const qrRef = useRef(null);

  const joinedRef =
    useRef(false);

  const disconnectingRef =
    useRef(false);

  const hostTokenRef = useRef(
    getHostToken(roomCode),
  );

  /* ---------------------------------------------------------------------- */
  /* Join                                                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!socket || !roomCode) {
      return;
    }

    if (joinedRef.current) {
      return;
    }

    let mounted = true;

    const joinRoom = () => {
      if (
        !mounted ||
        !socket.connected
      ) {
        return;
      }

      setJoining(true);
      setRoomError('');
      setRoomExpired(false);

      socket.emit(
        'join-room',
        {
          roomCode,
          deviceName,
          deviceInfo,
          hostToken:
            hostTokenRef.current ||
            null,
        },
        (response) => {
          if (!mounted) {
            return;
          }

          if (!response?.success) {
            setJoining(false);

            setRoomError(
              response?.message ||
                'Unable to join room.',
            );

            return;
          }

          joinedRef.current = true;

          const room =
            response.room ||
            response;

          const roomUsers =
            room.users || [];

          const currentUser =
            roomUsers.find(
              (user) =>
                user.socketId ===
                socket.id,
            );

          const detectedRole =
            currentUser?.isHost
              ? 'host'
              : 'guest';

          setRoomCode(roomCode);
          setRole(detectedRole);
          setUsers(roomUsers);

          setLocked(
            Boolean(
              room.locked,
            ),
          );

          if (room.expiresAt) {
            setExpiresAt(
              room.expiresAt,
            );
          }

          addRecentRoom?.({
            roomCode,
            role: detectedRole,
            deviceName,
            joinedAt: Date.now(),
          });

          setTimeout(() => {
            if (mounted) {
              setJoining(false);
            }
          }, 300);
        },
      );
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once(
        'connect',
        joinRoom,
      );
    }

    const fallback =
      setTimeout(() => {
        if (
          mounted &&
          !joinedRef.current
        ) {
          setJoining(false);

          setRoomError(
            'Unable to connect to the room server.',
          );
        }
      }, 8000);

    return () => {
      mounted = false;

      clearTimeout(fallback);

      socket.off(
        'connect',
        joinRoom,
      );
    };
  }, [
    socket,
    roomCode,
    deviceName,
    deviceInfo,
    setRoomCode,
    setRole,
    setUsers,
    setLocked,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Navigation lock                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    setNavLocked?.(true);

    const handleBeforeUnload = (
      event,
    ) => {
      if (
        disconnectingRef.current
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload,
      );

      setNavLocked?.(false);
    };
  }, [setNavLocked]);

  /* ---------------------------------------------------------------------- */
  /* Clock                                                                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const timer =
      setInterval(() => {
        setNow(Date.now());
      }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Automatic expiry                                                        */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (
      !expiresAt ||
      roomExpired
    ) {
      return;
    }

    const remaining =
      new Date(
        expiresAt,
      ).getTime() - now;

    if (remaining <= 0) {
      clearHostToken(roomCode);
      setRoomExpired(true);
      setRoomError('');
      setUsers([]);
      setLocked(false);

      toast.error(
        'This room has expired.',
      );
    }
  }, [
    expiresAt,
    now,
    roomExpired,
    roomCode,
    setUsers,
    setLocked,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Room socket events                                                      */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!socket) return;

    const handleUsers = (
      room,
    ) => {
      if (!room) return;

      if (room.users) {
        setUsers(room.users);
      }

      if (
        typeof room.locked ===
        'boolean'
      ) {
        setLocked(room.locked);
      }

      if (room.expiresAt) {
        setExpiresAt(
          room.expiresAt,
        );
      }
    };

    const handleUserJoined = (
      payload,
    ) => {
      if (payload?.users) {
        setUsers(
          payload.users,
        );
      }

      if (
        typeof payload?.locked ===
        'boolean'
      ) {
        setLocked(
          payload.locked,
        );
      }

      if (payload?.expiresAt) {
        setExpiresAt(
          payload.expiresAt,
        );
      }
    };

    const handleUserLeft = (
      payload,
    ) => {
      if (payload?.users) {
        setUsers(payload.users);
      }
    };

    const handleRoomLock = (
      payload,
    ) => {
      if (
        typeof payload?.locked ===
        'boolean'
      ) {
        setLocked(
          payload.locked,
        );
      }
    };

    const handleRoomExpired =
      () => {
        clearHostToken(
          roomCode,
        );

        setRoomExpired(true);
        setRoomError('');
        setUsers([]);
        setLocked(false);

        toast.error(
          'This room has expired.',
        );
      };

    const handleRoomEnded =
      () => {
        clearHostToken(
          roomCode,
        );

        setRoomError(
          'The host ended this room.',
        );

        toast.error(
          'The host ended this room.',
        );
      };

    const handleKicked = () => {
      clearHostToken(
        roomCode,
      );

      setRoomError(
        'You were removed from this room.',
      );

      toast.error(
        'You were removed from this room.',
      );
    };

    socket.on(
      'room-state',
      handleUsers,
    );

    socket.on(
      'user-joined',
      handleUserJoined,
    );

    socket.on(
      'user-left',
      handleUserLeft,
    );

    socket.on(
      'room-lock-changed',
      handleRoomLock,
    );

    socket.on(
      'room-expired',
      handleRoomExpired,
    );

    socket.on(
      'room-ended',
      handleRoomEnded,
    );

    socket.on(
      'kicked',
      handleKicked,
    );

    return () => {
      socket.off(
        'room-state',
        handleUsers,
      );

      socket.off(
        'user-joined',
        handleUserJoined,
      );

      socket.off(
        'user-left',
        handleUserLeft,
      );

      socket.off(
        'room-lock-changed',
        handleRoomLock,
      );

      socket.off(
        'room-expired',
        handleRoomExpired,
      );

      socket.off(
        'room-ended',
        handleRoomEnded,
      );

      socket.off(
        'kicked',
        handleKicked,
      );
    };
  }, [
    socket,
    roomCode,
    setUsers,
    setLocked,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Notifications                                                           */
  /* ---------------------------------------------------------------------- */

  const requestNotifications =
    useCallback(async () => {
      if (
        typeof window ===
          'undefined' ||
        !('Notification' in window)
      ) {
        return false;
      }

      if (
        Notification.permission ===
        'granted'
      ) {
        setNotifyEnabled(true);
        return true;
      }

      if (
        Notification.permission ===
        'denied'
      ) {
        return false;
      }

      try {
        const permission =
          await Notification.requestPermission();

        const enabled =
          permission === 'granted';

        setNotifyEnabled(
          enabled,
        );

        return enabled;
      } catch {
        return false;
      }
    }, []);

  /* ---------------------------------------------------------------------- */
  /* WebRTC                                                                  */
  /* ---------------------------------------------------------------------- */

  const transferRef =
    useRef(null);

  const onIncomingData =
    useCallback((event) => {
      transferRef.current?.handleIncomingData(
        event,
      );
    }, []);

  const webrtc = useWebRTC({
    socket,
    roomCode,
    role,
    onIncomingData,
    rejoinNonce,
  });

  const transfer =
    useFileTransfer({
      getDataChannel:
        webrtc.getDataChannel,
      dataChannelOpen:
        webrtc.dataChannelOpen,
    });

  transferRef.current =
    transfer;

  /* ---------------------------------------------------------------------- */
  /* Peer                                                                    */
  /* ---------------------------------------------------------------------- */

  const peer = useMemo(() => {
    return (
      users?.find(
        (user) =>
          user.socketId !==
          socket?.id,
      ) || null
    );
  }, [users, socket]);

  const peerCount =
    users?.length || 0;

  const connected =
    Boolean(
      webrtc.dataChannelOpen &&
        peer,
    );

  const [peerReveal, setPeerReveal] =
    useState('idle');

  const peerVisible =
    Boolean(peer);

  useEffect(() => {
    if (!peer) {
      setPeerReveal('idle');
      return;
    }

    setPeerReveal(
      'listening',
    );

    const timer1 =
      setTimeout(() => {
        setPeerReveal(
          'fetching',
        );
      }, 800);

    const timer2 =
      setTimeout(() => {
        setPeerReveal(
          'ready',
        );
      }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [peer?.socketId]);

  useEffect(() => {
    if (!peer) {
      transfer.markPeerDisconnected?.();
    }
  }, [peer, transfer]);

  /* ---------------------------------------------------------------------- */
  /* Connection state                                                        */
  /* ---------------------------------------------------------------------- */

  const previousConnected =
    useRef(false);

  useEffect(() => {
    if (
      connected &&
      !previousConnected.current
    ) {
      toast.success(
        'Secure connection established.',
      );
    }

    if (
      !connected &&
      previousConnected.current &&
      peer
    ) {
      toast.error(
        'Connection lost.',
      );
    }

    previousConnected.current =
      connected;
  }, [connected, peer]);

  /* ---------------------------------------------------------------------- */
  /* Host WebRTC start                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (
      role !== 'host' ||
      !peer ||
      peerReveal !== 'ready'
    ) {
      return;
    }

    if (
      webrtc.connectionState ===
      'new'
    ) {
      webrtc.startAsHost?.();
    }
  }, [
    role,
    peer,
    peerReveal,
    webrtc.connectionState,
    webrtc.startAsHost,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Host controls                                                           */
  /* ---------------------------------------------------------------------- */

  const handleToggleLock =
    useCallback(() => {
      if (
        role !== 'host' ||
        !socket
      ) {
        return;
      }

      const previous =
        Boolean(locked);

      const next =
        !previous;

      setLocked(next);

      socket.emit(
        'set-room-lock',
        {
          roomCode,
          locked: next,
          hostToken:
            hostTokenRef.current,
        },
        (response) => {
          if (
            response?.success ===
            false
          ) {
            setLocked(
              previous,
            );

            toast.error(
              response?.message ||
                'Unable to update room lock.',
            );

            return;
          }

          if (
            typeof response?.locked ===
            'boolean'
          ) {
            setLocked(
              response.locked,
            );
          }
        },
      );
    }, [
      role,
      socket,
      roomCode,
      locked,
      setLocked,
    ]);

  const handleKickPeer =
    useCallback(
      (socketId) => {
        if (
          role !== 'host' ||
          !socket ||
          !socketId
        ) {
          return;
        }

        socket.emit(
          'kick-peer',
          {
            roomCode,
            socketId,
            hostToken:
              hostTokenRef.current,
          },
          (response) => {
            if (
              response?.success ===
              false
            ) {
              toast.error(
                response?.message ||
                  'Unable to remove peer.',
              );

              return;
            }

            toast.success(
              'Peer removed from room.',
            );
          },
        );
      },
      [
        role,
        socket,
        roomCode,
      ],
    );

  const handleEndRoom =
    useCallback(() => {
      if (
        role !== 'host' ||
        !socket
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          'End this room? The connected device will be disconnected and this room cannot be used again.',
        );

      if (!confirmed) {
        return;
      }

      disconnectingRef.current =
        true;

      socket.emit(
        'end-room',
        {
          roomCode,
          hostToken:
            hostTokenRef.current,
        },
        (response) => {
          if (
            response?.success ===
            false
          ) {
            disconnectingRef.current =
              false;

            toast.error(
              response?.message ||
                'Unable to end room.',
            );

            return;
          }

          clearHostToken(
            roomCode,
          );

          setRoomError(
            'This room has been ended by the host.',
          );

          toast.success(
            'Room ended.',
          );
        },
      );
    }, [
      role,
      socket,
      roomCode,
    ]);

  /* ---------------------------------------------------------------------- */
  /* Invite                                                                  */
  /* ---------------------------------------------------------------------- */

  const inviteUrl = useMemo(() => {
    if (
      typeof window ===
      'undefined'
    ) {
      return `/join?room=${roomCode}`;
    }

    return `${window.location.origin}/join?room=${roomCode}`;
  }, [roomCode]);

  const copyText =
    useCallback(
      async (
        text,
        message,
      ) => {
        try {
          if (
            navigator.clipboard &&
            window.isSecureContext
          ) {
            await navigator.clipboard.writeText(
              text,
            );

            toast.success(
              message,
            );

            return;
          }

          const textarea =
            document.createElement(
              'textarea',
            );

          textarea.value = text;
          textarea.setAttribute(
            'readonly',
            '',
          );

          textarea.style.position =
            'fixed';
          textarea.style.left =
            '-9999px';
          textarea.style.top =
            '0';

          document.body.appendChild(
            textarea,
          );

          textarea.focus();
          textarea.select();
          textarea.setSelectionRange(
            0,
            textarea.value.length,
          );

          const copied =
            document.execCommand(
              'copy',
            );

          textarea.remove();

          if (!copied) {
            throw new Error(
              'Copy failed',
            );
          }

          toast.success(
            message,
          );
        } catch {
          toast.error(
            'Unable to copy.',
          );
        }
      },
      [],
    );

  const handleCopyRoom =
    useCallback(() => {
      copyText(
        roomCode,
        'Room code copied.',
      );
    }, [
      roomCode,
      copyText,
    ]);

  const handleCopyInvite =
    useCallback(() => {
      copyText(
        inviteUrl,
        'Invite link copied.',
      );
    }, [
      inviteUrl,
      copyText,
    ]);

  const handleShare =
    useCallback(async () => {
      if (!navigator.share) {
        handleCopyInvite();
        return;
      }

      try {
        await navigator.share({
          title:
            'Join WebDrop room',
          text: `Join my WebDrop room: ${roomCode}`,
          url: inviteUrl,
        });
      } catch {
        // User cancelled.
      }
    }, [
      roomCode,
      inviteUrl,
      handleCopyInvite,
    ]);

  /* ---------------------------------------------------------------------- */
  /* File selection                                                          */
  /* ---------------------------------------------------------------------- */

  const sendSelectedFiles =
    useCallback(
      async (files) => {
        if (!files?.length) {
          return;
        }

        if (!connected) {
          toast.error(
            'Connect to a peer before sending files.',
          );

          return;
        }

        const totalSize =
          files.reduce(
            (sum, file) =>
              sum +
              Number(
                file?.size || 0,
              ),
            0,
          );

        if (
          totalSize >=
          LARGE_FILE_WARNING_BYTES
        ) {
          toast.warning(
            `You are sending ${formatBytes(totalSize)}. Keep this tab open until the transfer finishes.`,
          );
        }

        await requestNotifications();

        transfer.sendFiles(
          files,
        );
      },
      [
        connected,
        transfer,
        requestNotifications,
      ],
    );

  const handleInputChange =
    useCallback(
      async (event) => {
        const files =
          collectInputFiles(
            event.target.files,
          );

        await sendSelectedFiles(
          files,
        );

        event.target.value = '';
      },
      [sendSelectedFiles],
    );

  const handleFolderChange =
    useCallback(
      async (event) => {
        const files =
          collectInputFiles(
            event.target.files,
          );

        if (files.length > 1) {
          toast.success(
            `${files.length} files found in selected folder.`,
          );
        }

        await sendSelectedFiles(
          files,
        );

        event.target.value = '';
      },
      [sendSelectedFiles],
    );

  /* ---------------------------------------------------------------------- */
  /* Drag and drop                                                           */
  /* ---------------------------------------------------------------------- */

  const handleDragOver =
    useCallback(
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (connected) {
          setIsDragging(true);
        }
      },
      [connected],
    );

  const handleDragLeave =
    useCallback((event) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragging(false);
    }, []);

  const handleDrop =
    useCallback(
      async (event) => {
        event.preventDefault();
        event.stopPropagation();

        setIsDragging(false);

        if (!connected) {
          toast.error(
            'Connect to a peer before sending files.',
          );

          return;
        }

        const files =
          await collectDroppedFiles(
            event.dataTransfer,
          );

        await sendSelectedFiles(
          files,
        );
      },
      [
        connected,
        sendSelectedFiles,
      ],
    );

  /* ---------------------------------------------------------------------- */
  /* Paste                                                                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handlePaste =
      async (event) => {
        if (!connected) return;

        const items =
          Array.from(
            event.clipboardData
              ?.items || [],
          );

        const files = [];

        for (const item of items) {
          if (
            item.kind !== 'file'
          ) {
            continue;
          }

          const file =
            item.getAsFile?.();

          if (file) {
            files.push(
              withRelativePath(
                file,
              ),
            );
          }
        }

        if (files.length) {
          event.preventDefault();

          await sendSelectedFiles(
            files,
          );
        }
      };

    window.addEventListener(
      'paste',
      handlePaste,
    );

    return () => {
      window.removeEventListener(
        'paste',
        handlePaste,
      );
    };
  }, [
    connected,
    sendSelectedFiles,
  ]);

  /* ---------------------------------------------------------------------- */
  /* QR                                                                      */
  /* ---------------------------------------------------------------------- */

  const qrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(
      inviteUrl,
    )}`;
  }, [inviteUrl]);

  /* ---------------------------------------------------------------------- */
  /* Close QR on outside click / Escape                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!showQr) {
      return;
    }

    const handleEscape =
      (event) => {
        if (event.key === 'Escape') {
          setShowQr(false);
        }
      };

    const handlePointerDown =
      (event) => {
        if (
          qrRef.current &&
          !qrRef.current.contains(
            event.target,
          )
        ) {
          setShowQr(false);
        }
      };

    document.addEventListener(
      'keydown',
      handleEscape,
    );

    document.addEventListener(
      'mousedown',
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      );

      document.removeEventListener(
        'mousedown',
        handlePointerDown,
      );
    };
  }, [showQr]);

  /* ---------------------------------------------------------------------- */
  /* Transfer calculations                                                   */
  /* ---------------------------------------------------------------------- */

  const incoming =
    transfer.incoming || [];

  const outgoing =
    transfer.outgoing || [];

  const activeIncoming =
    incoming.filter(
      (file) =>
        file.status ===
          'receiving' ||
        file.status ===
          'transferring' ||
        file.status ===
          'active',
    );

  const activeOutgoing =
    outgoing.filter(
      (file) =>
        file.status ===
          'sending' ||
        file.status ===
          'transferring' ||
        file.status ===
          'active',
    );

  const pendingIncoming =
    incoming.filter(
      (file) =>
        file.status ===
          'pending' ||
        file.status ===
          'waiting' ||
        file.status ===
          'offer',
    );

  const completedIncoming =
    incoming.filter(
      (file) =>
        file.status ===
          'completed' ||
        file.status ===
          'success' ||
        file.status ===
          'done',
    );

  const completedOutgoing =
    outgoing.filter(
      (file) =>
        file.status ===
          'completed' ||
        file.status ===
          'success' ||
        file.status ===
          'done',
    );

  const totalIncomingReceived =
    incoming.reduce(
      (sum, file) =>
        sum +
        Number(
          file.bytesReceived ||
            file.receivedBytes ||
            0,
        ),
      0,
    );

  const totalOutgoingSent =
    outgoing.reduce(
      (sum, file) =>
        sum +
        Number(
          file.bytesSent ||
            file.sentBytes ||
            0,
        ),
      0,
    );

  const totalActiveSpeed =
    [
      ...activeIncoming,
      ...activeOutgoing,
    ].reduce(
      (sum, file) =>
        sum +
        Number(
          file.speed ||
            file.bytesPerSecond ||
            0,
        ),
      0,
    );

  /* ---------------------------------------------------------------------- */
  /* Transfer actions                                                        */
  /* ---------------------------------------------------------------------- */

  const handleAccept =
    useCallback(
      (fileId) => {
        transfer.acceptOffer?.(
          fileId,
        );
      },
      [transfer],
    );

  const handleReject =
    useCallback(
      (fileId) => {
        transfer.rejectOffer?.(
          fileId,
        );
      },
      [transfer],
    );

  const handleDownload =
    useCallback(
      (fileId) => {
        transfer.downloadFile?.(
          fileId,
        );
      },
      [transfer],
    );

  const handleRetry =
    useCallback(
      (fileId) => {
        transfer.retryFile?.(
          fileId,
        );
      },
      [transfer],
    );

  const handleCancel =
    useCallback(
      (fileId, direction) => {
        if (
          direction ===
          'incoming'
        ) {
          transfer.cancelIncoming?.(
            fileId,
          );
        } else {
          transfer.cancelOutgoing?.(
            fileId,
          );
        }
      },
      [transfer],
    );

  const handleRemove =
    useCallback(
      (fileId, direction) => {
        transfer.removeFile?.(
          fileId,
          direction,
        );
      },
      [transfer],
    );

  const handleClearCompleted =
    useCallback(() => {
      transfer.clearCompleted?.();
    }, [transfer]);

  /* ---------------------------------------------------------------------- */
  /* Expiry                                                                  */
  /* ---------------------------------------------------------------------- */

  const expiryText = useMemo(() => {
    if (!expiresAt) {
      return '30 minute session';
    }

    const remaining =
      new Date(
        expiresAt,
      ).getTime() - now;

    if (remaining <= 0) {
      return 'Expired';
    }

    return formatETA(
      Math.ceil(
        remaining / 1000,
      ),
    );
  }, [
    expiresAt,
    now,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Radar                                                                   */
  /* ---------------------------------------------------------------------- */

  const radarFlow =
    useMemo(() => {
      if (
        activeOutgoing.length
      ) {
        return 'outgoing';
      }

      if (
        activeIncoming.length
      ) {
        return 'incoming';
      }

      if (connected) {
        return 'connected';
      }

      return 'idle';
    }, [
      activeOutgoing.length,
      activeIncoming.length,
      connected,
    ]);

  const YouIcon =
    getDeviceIconFromInfo(
      deviceInfo,
      deviceName,
    );

  const peerDeviceName =
    getDeviceLabel(
      peer?.deviceInfo || {},
      peer?.deviceName || '',
    );

  const PeerIcon =
    getDeviceIconFromInfo(
      peer?.deviceInfo || {},
      peer?.deviceName || '',
    );

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                 */
  /* ---------------------------------------------------------------------- */

  if (joining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAFF] px-6 dark:bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Loader2
              size={26}
              className="animate-spin"
            />
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Joining room
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Establishing your secure
            session...
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-widest text-slate-600 dark:border-slate-800 dark:bg-[#111318] dark:text-slate-300">
            {roomCode}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Expired screen                                                          */
  /* ---------------------------------------------------------------------- */

  if (roomExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAFF] px-5 py-10 dark:bg-surface">
        <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-[#111318] sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Clock size={30} />
          </div>

          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            WebDrop session
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Room Expired
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            This WebDrop room has reached
            its 30-minute lifetime. The
            connection is no longer
            available.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Room code
            </p>

            <p className="mt-1 font-mono text-lg font-extrabold tracking-[0.2em] text-slate-700 dark:text-slate-200">
              {roomCode}
            </p>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white transition hover:bg-violet-700"
            >
              <Plus size={15} />
              Create New Room
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/join')
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
            >
              <RefreshCw size={15} />
              Join Room
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
            >
              <Home size={15} />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Room error                                                              */
  /* ---------------------------------------------------------------------- */

  if (roomError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAFF] px-6 dark:bg-surface">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-[#111318]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <XCircle size={27} />
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Room unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {roomError}
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold tracking-widest text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {roomCode}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-700"
            >
              <Plus size={14} />
              Create New Room
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/join')
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
            >
              <RefreshCw size={14} />
              Join Room
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/')
            }
            className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300"
          >
            <Home size={14} />
            Home
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Main UI                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#FBFAFF] text-slate-900 dark:bg-surface dark:text-white">
      {/* Header */}
      <header className="relative z-20 border-b border-slate-200/80 bg-[#FBFAFF] dark:border-slate-800/80 dark:bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      connected
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />

                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Transmission Room
                  </span>
                </div>

                <span className="hidden h-4 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

                <span
                  className={`text-xs font-bold ${
                    connected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {connected
                    ? 'Peer connected'
                    : peer
                      ? 'Establishing connection'
                      : 'Waiting for peer'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  WebDrop
                </h1>

                <span className="text-slate-300 dark:text-slate-700">
                  /
                </span>

                <button
                  type="button"
                  onClick={
                    handleCopyRoom
                  }
                  className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-[0.16em] text-slate-800 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#111318] dark:text-slate-200 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
                >
                  {roomCode}

                  <Copy
                    size={14}
                    className="text-slate-400 transition group-hover:text-violet-500"
                  />
                </button>

                {role ===
                  'host' && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                    Host
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Direct peer-to-peer
                transfer · no server
                file storage
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={
                  handleCopyRoom
                }
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#111318] dark:text-slate-300"
              >
                <Copy size={14} />
                Code
              </button>

              <button
                type="button"
                onClick={
                  handleCopyInvite
                }
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#111318] dark:text-slate-300"
              >
                <Share2 size={14} />
                Invite
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setShowQr(
                      (value) =>
                        !value,
                    )
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#111318] dark:text-slate-300"
                >
                  <QrCode size={14} />
                  QR
                </button>

                {showQr && (
                  <>
                    {/* Desktop QR dropdown */}
                    <div
                      ref={qrRef}
                      className="absolute right-0 top-12 z-50 hidden w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-[#111318] sm:block"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Scan to join
                          </p>

                          <p className="text-xs text-slate-500">
                            Room {roomCode}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowQr(
                              false,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                          aria-label="Close QR"
                        >
                          <X size={17} />
                        </button>
                      </div>

                      <div className="flex items-center justify-center rounded-xl bg-white p-3">
                        <img
                          src={qrUrl}
                          alt="WebDrop room QR code"
                          className="h-auto w-full max-w-[220px]"
                        />
                      </div>

                      <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">
                        Scan this code from
                        another device to join
                        the room.
                      </p>
                    </div>

                    {/* Mobile QR modal */}
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm sm:hidden">
                      <div
                        ref={qrRef}
                        className="w-[calc(100vw-2rem)] max-w-sm max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-[#111318]"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-bold text-slate-900 dark:text-white">
                              Scan to join
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              Room {roomCode}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setShowQr(
                                false,
                              )
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            aria-label="Close QR"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="flex w-full items-center justify-center rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-200">
                          <img
                            src={qrUrl}
                            alt="WebDrop room QR code"
                            className="h-auto w-full max-w-[260px]"
                          />
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-center dark:bg-slate-900/70">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Room code
                          </p>

                          <p className="mt-1 font-mono text-sm font-extrabold tracking-[0.18em] text-slate-800 dark:text-slate-200">
                            {roomCode}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowQr(
                              false,
                            )
                          }
                          className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={
                  handleShare
                }
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
              >
                <Share2 size={14} />
                Share
              </button>

              {role ===
                'host' && (
                <>
                  <button
                    type="button"
                    onClick={
                      handleToggleLock
                    }
                    className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
                      locked
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-[#111318] dark:text-slate-300'
                    }`}
                  >
                    {locked ? (
                      <Lock
                        size={14}
                      />
                    ) : (
                      <Unlock
                        size={14}
                      />
                    )}

                    {locked
                      ? 'Locked'
                      : 'Lock room'}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleEndRoom
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
                  >
                    <Power
                      size={14}
                    />
                    End Room
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} />
              Expires in{' '}
              {expiryText}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 font-bold ${
                peerCount >= 2
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : ''
              }`}
            >
              <Users size={13} />
              {peerCount}/2 devices
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck
                  size={13}
                />
              </span>
              Direct encrypted
              channel
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Power size={13} />
              {webrtc.connectionState}
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* Left */}
          <aside className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111318]">
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
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}
                  >
                    {connected ? (
                      <Wifi
                        size={16}
                      />
                    ) : (
                      <Activity
                        size={16}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <PeerRadar
                  role={role}
                  peer={peer}
                  peerVisible={
                    peerVisible
                  }
                  peerReveal={
                    peerReveal
                  }
                  connected={
                    connected
                  }
                  flow={radarFlow}
                  deviceName={
                    deviceName
                  }
                  deviceInfo={
                    deviceInfo
                  }
                  YouIcon={
                    YouIcon
                  }
                  PeerIcon={
                    PeerIcon
                  }
                  onKickPeer={
                    handleKickPeer
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111318]">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <ShieldCheck
                    size={17}
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Direct Encrypted Channel
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Browser-to-browser
                    connection
                  </p>
                </div>
              </div>

              <InfoRow
                icon={ShieldCheck}
                label="Transfer"
                value="WebRTC DataChannel"
              />

              <InfoRow
                icon={Lock}
                label="Storage"
                value="No server storage"
              />

              <InfoRow
                icon={Wifi}
                label="Signaling"
                value="Socket.IO"
              />

              <InfoRow
                icon={Clock}
                label="Room lifetime"
                value="30 minutes"
              />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111318]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Connection
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    WebRTC transport
                    state
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                    connected
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}
                >
                  {connected
                    ? 'Connected'
                    : 'Waiting'}
                </span>
              </div>

              <InfoRow
                icon={Power}
                label="Peer state"
                value={
                  webrtc.connectionState ||
                  'new'
                }
              />

              <InfoRow
                icon={Wifi}
                label="Data channel"
                value={
                  webrtc.dataChannelOpen
                    ? 'Open'
                    : 'Closed'
                }
              />

              <InfoRow
                icon={Users}
                label="Devices"
                value={`${peerCount}/2`}
              />
            </section>
          </aside>

          {/* Right */}
          <section className="min-w-0 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Devices"
                value={`${peerCount}/2`}
                subtext={
                  peer
                    ? peerDeviceName
                    : 'Waiting for peer'
                }
              />

              <StatCard
                icon={Inbox}
                label="Incoming"
                value={formatBytes(
                  totalIncomingReceived,
                )}
                subtext={`${incoming.length} file${
                  incoming.length ===
                  1
                    ? ''
                    : 's'
                }`}
              />

              <StatCard
                icon={Send}
                label="Outgoing"
                value={formatBytes(
                  totalOutgoingSent,
                )}
                subtext={`${outgoing.length} file${
                  outgoing.length ===
                  1
                    ? ''
                    : 's'
                }`}
              />

              <StatCard
                icon={Zap}
                label="Speed"
                value={formatSpeed(
                  totalActiveSpeed,
                )}
                subtext={
                  connected
                    ? 'Live transfer'
                    : 'No active transfer'
                }
              />
            </div>

            {/* Upload */}
            <section
              onDragOver={
                handleDragOver
              }
              onDragEnter={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={handleDrop}
              className={`relative overflow-hidden rounded-3xl border bg-white shadow-sm transition dark:bg-[#111318] ${
                isDragging
                  ? 'border-violet-500 bg-violet-50/40 dark:border-violet-500 dark:bg-violet-500/5'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition ${
                      connected
                        ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
                  >
                    <CloudUpload
                      size={28}
                    />
                  </div>

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                    File transfer
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {connected
                      ? 'Drop files here'
                      : 'Waiting for peer'}
                  </h2>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {connected
                      ? 'Drag files or folders here, or choose files manually. Everything is transferred directly between the two devices.'
                      : 'Keep this room open. A second device must join before files can be transferred.'}
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      disabled={!connected}
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Paperclip
                        size={15}
                      />
                      Choose files
                    </button>

                    <button
                      type="button"
                      disabled={!connected}
                      onClick={() =>
                        folderInputRef.current?.click()
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
                    >
                      <FolderOpen
                        size={15}
                      />
                      Choose folder
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {[
                      'P2P',
                      'WebRTC',
                      'No upload server',
                      'Paste supported',
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
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
                    onChange={
                      handleInputChange
                    }
                  />

                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    webkitdirectory=""
                    directory=""
                    className="hidden"
                    onChange={
                      handleFolderChange
                    }
                  />
                </div>
              </div>
            </section>

            {/* Files */}
            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111318]">
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

                  <p className="mt-1 text-xs text-slate-500">
                    Incoming and outgoing
                    transfers for this
                    session.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {incoming.length +
                      outgoing.length}{' '}
                    total
                  </span>

                  {(completedIncoming.length >
                    0 ||
                    completedOutgoing.length >
                      0) && (
                    <button
                      type="button"
                      onClick={
                        handleClearCompleted
                      }
                      className="text-[11px] font-bold text-slate-500 transition hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                    >
                      Clear completed
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {/* Incoming */}
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

                      {pendingIncoming.length >
                        0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          {
                            pendingIncoming.length
                          }{' '}
                          waiting
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400">
                      {incoming.length}{' '}
                      files
                    </span>
                  </div>

                  {incoming.length ===
                  0 ? (
                    <EmptyQueue
                      type="incoming"
                    />
                  ) : (
                    <div className="space-y-2">
                      {incoming.map(
                        (file) => (
                          <FileRow
                            key={
                              file.fileId ||
                              file.id
                            }
                            file={file}
                            direction="incoming"
                            onAccept={
                              handleAccept
                            }
                            onReject={
                              handleReject
                            }
                            onDownload={
                              handleDownload
                            }
                            onRetry={
                              handleRetry
                            }
                            onCancel={(
                              id,
                            ) =>
                              handleCancel(
                                id,
                                'incoming',
                              )
                            }
                            onRemove={(
                              id,
                            ) =>
                              handleRemove(
                                id,
                                'incoming',
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Outgoing */}
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

                      {activeOutgoing.length >
                        0 && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-extrabold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                          {
                            activeOutgoing.length
                          }{' '}
                          active
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400">
                      {outgoing.length}{' '}
                      files
                    </span>
                  </div>

                  {outgoing.length ===
                  0 ? (
                    <EmptyQueue
                      type="outgoing"
                    />
                  ) : (
                    <div className="space-y-2">
                      {outgoing.map(
                        (file) => (
                          <FileRow
                            key={
                              file.fileId ||
                              file.id
                            }
                            file={file}
                            direction="outgoing"
                            onRetry={
                              handleRetry
                            }
                            onCancel={(
                              id,
                            ) =>
                              handleCancel(
                                id,
                                'outgoing',
                              )
                            }
                            onRemove={(
                              id,
                            ) =>
                              handleRemove(
                                id,
                                'outgoing',
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Session overview */}
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111318]">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400">
                      Session overview
                    </p>

                    <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                      Room activity
                    </h3>
                  </div>

                  <Activity
                    size={18}
                    className="text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Files
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                      {incoming.length +
                        outgoing.length}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Total transfers
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                      {activeIncoming.length +
                        activeOutgoing.length}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Current transfers
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Received
                    </p>

                    <p className="mt-1 truncate text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatBytes(
                        totalIncomingReceived,
                      )}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Downloaded this
                      room
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sent
                    </p>

                    <p className="mt-1 truncate text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatBytes(
                        totalOutgoingSent,
                      )}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Uploaded this room
                    </p>
                  </div>
                </div>
              </div>

              {/* Connected devices */}
              <div
                className={`rounded-3xl border p-5 shadow-sm transition ${
                  connected &&
                  peerCount >= 2
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111318]'
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[10px] font-extrabold uppercase tracking-[0.15em] ${
                          connected &&
                          peerCount >= 2
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-violet-600 dark:text-violet-400'
                        }`}
                      >
                        Connected Devices
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                          connected &&
                          peerCount >= 2
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
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
                      connected &&
                      peerCount >= 2
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
                  >
                    {connected &&
                    peerCount >= 2 ? (
                      <CheckCircle
                        size={18}
                      />
                    ) : (
                      <Users
                        size={18}
                      />
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-3 ${
                    connected &&
                    peerCount >= 2
                      ? 'border-emerald-200 bg-white dark:border-emerald-500/20 dark:bg-[#111318]'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold ${
                        connected &&
                        peerCount >= 2
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {connected &&
                      peerCount >= 2
                        ? 'Connected Devices 2/2'
                        : `Connected Devices ${peerCount}/2`}
                    </span>

                    <span
                      className={`h-2 w-2 rounded-full ${
                        connected &&
                        peerCount >= 2
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    {/* YOU */}
                    <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-500/10 dark:bg-violet-500/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                        <YouIcon
                          size={19}
                        />
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

                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {getDeviceLabel(
                            deviceInfo,
                            deviceName,
                          )}
                        </p>
                      </div>

                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    </div>

                    {/* PEER */}
                    {peer ? (
                      <div
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          connected
                            ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/10 dark:bg-emerald-500/5'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            connected
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <PeerIcon
                            size={19}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {peerDeviceName}
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {peer?.deviceInfo
                              ?.browser ||
                              'Web browser'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {role ===
                            'host' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleKickPeer(
                                  peer.socketId,
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                              title="Remove peer"
                              aria-label="Remove peer"
                            >
                              <X
                                size={15}
                              />
                            </button>
                          )}

                          <span
                            className={`h-2 w-2 rounded-full ${
                              connected
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-800">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <Users
                            size={18}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Waiting for another
                            device
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Share the room code
                            or QR.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Status */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-[#111318]">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    connected
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}
                >
                  {connected ? (
                    <CheckCircle
                      size={17}
                    />
                  ) : (
                    <RefreshCw
                      size={17}
                    />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {connected
                      ? 'Ready for peer-to-peer transfer'
                      : 'Room is ready and waiting'}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Room {roomCode} ·{' '}
                    {role === 'host'
                      ? 'Host'
                      : 'Guest'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    size={13}
                    className="text-emerald-500"
                  />
                  No server file
                  storage
                </span>

                <span className="hidden h-3 w-px bg-slate-200 sm:block dark:bg-slate-700" />

                <span className="inline-flex items-center gap-1.5">
                  <Zap size={13} />
                  {formatSpeed(
                    totalActiveSpeed,
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}