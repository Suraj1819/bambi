import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  Share2,
  Link as LinkIcon,
  QrCode,
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const DEFAULT_MAX_LENGTH = 200;

/**
 * ShareModal
 *
 * Required props : open, onClose, roomCode, inviteUrl
 * Optional props : onCopyLink, onCopyCode  (toast ke liye parent ke handlers)
 *                  expiryText              (e.g. "24:10")
 *                  locked                  (room lock hai ya nahi)
 *
 * Features: share message edit, WhatsApp / Telegram / Facebook / X / LinkedIn /
 * Email / SMS, native share, QR tab, copy link & code, focus trap, Esc to close,
 * mobile par bottom-sheet.
 */
export default function ShareModal({
  open,
  onClose,
  roomCode,
  inviteUrl,
  onCopyLink,
  onCopyCode,
  expiryText,
  locked = false,
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  const defaultMessage = useMemo(
    () =>
      `Join my WebDrop room ${roomCode} and transfer files directly, device to device.`,
    [roomCode]
  );

  const [tab, setTab] = useState('share'); // 'share' | 'qr'
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(''); // 'link' | 'code' | ''

  /* open hote hi sab reset */
  useEffect(() => {
    if (open) {
      setTab('share');
      setMessage(defaultMessage);
      setCopied('');
    }
  }, [open, defaultMessage]);

  /* focus, scroll lock, Esc, Tab trap, focus restore */
  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = setTimeout(() => closeRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const flashCopied = useCallback((what) => {
    setCopied(what);
    setTimeout(() => setCopied((c) => (c === what ? '' : c)), 1600);
  }, []);

  const copyFallback = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const handleCopyLink = async () => {
    if (onCopyLink) await onCopyLink();
    else await copyFallback(inviteUrl);
    flashCopied('link');
  };

  const handleCopyCode = async () => {
    if (onCopyCode) await onCopyCode();
    else await copyFallback(roomCode);
    flashCopied('code');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: 'WebDrop room',
        text: message,
        url: inviteUrl,
      });
    } catch {
      /* user ne cancel kiya */
    }
  };

  const targets = useMemo(() => {
    const enc = encodeURIComponent;
    const msg = message.trim() || defaultMessage;

    return [
      {
        name: 'WhatsApp',
        href: `https://wa.me/?text=${enc(`${msg} ${inviteUrl}`)}`,
        icon: MessageCircle,
        color: 'bg-[#25D366]',
        external: true,
      },
      {
        name: 'Telegram',
        href: `https://t.me/share/url?url=${enc(inviteUrl)}&text=${enc(msg)}`,
        icon: Send,
        color: 'bg-[#229ED9]',
        external: true,
      },
      {
        name: 'Facebook',
        href: `https://www.facebook.com/sharer/sharer.php?u=${enc(inviteUrl)}`,
        icon: Facebook,
        color: 'bg-[#1877F2]',
        external: true,
      },
      {
        name: 'X',
        href: `https://twitter.com/intent/tweet?text=${enc(msg)}&url=${enc(inviteUrl)}`,
        icon: Twitter,
        color: 'bg-slate-900 dark:bg-slate-700',
        external: true,
      },
      {
        name: 'LinkedIn',
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(inviteUrl)}`,
        icon: Linkedin,
        color: 'bg-[#0A66C2]',
        external: true,
      },
      {
        name: 'Email',
        href: `mailto:?subject=${enc('Join my WebDrop room')}&body=${enc(`${msg}\n\n${inviteUrl}`)}`,
        icon: Mail,
        color: 'bg-rose-500',
      },
      {
        name: 'SMS',
        href: `sms:?body=${enc(`${msg} ${inviteUrl}`)}`,
        icon: MessageSquare,
        color: 'bg-emerald-500',
      },
    ];
  }, [message, defaultMessage, inviteUrl]);

  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
        inviteUrl
      )}`,
    [inviteUrl]
  );

  if (!open) return null;

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const messageChanged = message !== defaultMessage;

  const sectionLabel =
    'text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500';

  const tabBtn = (id) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
      tab === id
        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close share window"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        style={{ animation: 'smFade 0.18s ease-out' }}
      />

      {/* panel */}
      <div
        ref={panelRef}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0f1115] sm:max-w-md sm:rounded-3xl"
        style={{ animation: 'smPop 0.22s ease-out' }}
      >
        {/* drag handle (mobile) */}
        <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* header */}
        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-4 sm:pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-600/25">
              <Share2 size={19} />
            </div>
            <div>
              <h2
                id="share-modal-title"
                className="text-[17px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white"
              >
                Share this room
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Invite a device to transfer files directly
              </p>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {/* room summary */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy room code"
              aria-label={`Copy room code ${roomCode}`}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[15px] font-extrabold tracking-[0.22em] text-slate-900 transition hover:border-violet-300 hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10"
            >
              {roomCode}
              {copied === 'code' ? (
                <Check size={14} className="text-emerald-500" strokeWidth={3} />
              ) : (
                <Copy
                  size={14}
                  className="text-slate-400 transition group-hover:text-violet-500"
                />
              )}
            </button>

            {expiryText && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                <Clock size={12} />
                {expiryText} left
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${
                locked
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}
            >
              {locked ? <Lock size={12} /> : <Unlock size={12} />}
              {locked ? 'Locked' : 'Open to join'}
            </span>
          </div>

          {locked && (
            <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:border-amber-500/15 dark:bg-amber-500/[0.07] dark:text-amber-400">
              This room is locked, so new devices can't join until you unlock it.
            </p>
          )}

          {/* tabs */}
          <div
            role="tablist"
            aria-label="Share method"
            className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70"
          >
            <button
              type="button"
              role="tab"
              id="tab-share"
              aria-selected={tab === 'share'}
              aria-controls="panel-share"
              onClick={() => setTab('share')}
              className={tabBtn('share')}
            >
              <Share2 size={13} />
              Share
            </button>
            <button
              type="button"
              role="tab"
              id="tab-qr"
              aria-selected={tab === 'qr'}
              aria-controls="panel-qr"
              onClick={() => setTab('qr')}
              className={tabBtn('qr')}
            >
              <QrCode size={13} />
              QR code
            </button>
          </div>

          {/* ================= SHARE TAB ================= */}
          {tab === 'share' && (
            <div
              role="tabpanel"
              id="panel-share"
              aria-labelledby="tab-share"
              className="mt-4 space-y-5"
            >
              {/* message */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="share-message" className={sectionLabel}>
                    Message
                  </label>

                  <div className="flex items-center gap-3">
                    {messageChanged && (
                      <button
                        type="button"
                        onClick={() => setMessage(defaultMessage)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:underline dark:text-violet-400"
                      >
                        <RotateCcw size={10} />
                        Reset
                      </button>
                    )}
                    <span className="text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                      {message.length}/{DEFAULT_MAX_LENGTH}
                    </span>
                  </div>
                </div>

                <textarea
                  id="share-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={DEFAULT_MAX_LENGTH}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-violet-400 dark:focus:bg-slate-900"
                />
              </div>

              {/* apps */}
              <div>
                <p className={`mb-3 ${sectionLabel}`}>Share via</p>

                <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                  {targets.map(({ name, href, icon: Icon, color, external }) => (
                    <a
                      key={name}
                      href={href}
                      {...(external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="group flex flex-col items-center gap-1.5 rounded-xl p-1 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                    >
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-95 ${color}`}
                      >
                        <Icon size={21} strokeWidth={2.1} />
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {name}
                      </span>
                    </a>
                  ))}

                  {canNativeShare && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="group flex flex-col items-center gap-1.5 rounded-xl p-1 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-95">
                        <Share2 size={21} strokeWidth={2.1} />
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        More
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= QR TAB ================= */}
          {tab === 'qr' && (
            <div
              role="tabpanel"
              id="panel-qr"
              aria-labelledby="tab-qr"
              className="mt-4 flex flex-col items-center"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700">
                <img
                  src={qrUrl}
                  alt={`QR code to join room ${roomCode}`}
                  width={208}
                  height={208}
                  className="h-52 w-52 max-w-full"
                />
              </div>

              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Scan with the other device's camera to join instantly.
              </p>
            </div>
          )}

          {/* ================= LINK ================= */}
          <div className="mt-5">
            <p className={`mb-2 ${sectionLabel}`}>Invite link</p>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-3 dark:border-slate-800 dark:bg-slate-900/60">
              <LinkIcon size={14} className="shrink-0 text-slate-400" />
              <p
                className="min-w-0 flex-1 truncate font-mono text-[12px] text-slate-700 dark:text-slate-300"
                title={inviteUrl}
              >
                {inviteUrl}
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                  copied === 'link'
                    ? 'bg-emerald-600'
                    : 'bg-violet-600 hover:bg-violet-700'
                }`}
              >
                {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'link' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <span className="sr-only" role="status" aria-live="polite">
              {copied === 'link' && 'Invite link copied'}
              {copied === 'code' && 'Room code copied'}
            </span>
          </div>

          {/* privacy note */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-emerald-50/70 px-3 py-2.5 dark:bg-emerald-500/[0.06]">
            <ShieldCheck
              size={15}
              className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              Files go directly between devices and never touch our servers.
              Anyone with this link or code can join while the room is open.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes smFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes smPop {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"], [role="dialog"] * { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body
  );
}