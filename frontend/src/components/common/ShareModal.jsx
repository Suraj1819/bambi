import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

/**
 * ShareModal
 * Share button par click karne par ye window khulti hai:
 * WhatsApp, Telegram, Facebook, X, LinkedIn, Email, SMS + Copy link + (device ka) native share.
 */
export default function ShareModal({
  open,
  onClose,
  roomCode,
  inviteUrl,
  onCopyLink,
  onCopyCode,
}) {
  const closeRef = useRef(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Esc se band + page scroll lock + focus
  useEffect(() => {
    if (!open) return undefined;

    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setCopiedLink(false);
      setCopiedCode(false);
    }
  }, [open]);

  if (!open) return null;

  const text = `Join my WebDrop room ${roomCode} and transfer files directly, device to device.`;
  const enc = encodeURIComponent;

  const targets = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${enc(`${text} ${inviteUrl}`)}`,
      icon: MessageCircle,
      color: 'bg-[#25D366]',
      external: true,
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${enc(inviteUrl)}&text=${enc(text)}`,
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
      href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(inviteUrl)}`,
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
      href: `mailto:?subject=${enc('Join my WebDrop room')}&body=${enc(`${text}\n\n${inviteUrl}`)}`,
      icon: Mail,
      color: 'bg-rose-500',
    },
    {
      name: 'SMS',
      href: `sms:?body=${enc(`${text} ${inviteUrl}`)}`,
      icon: MessageSquare,
      color: 'bg-emerald-500',
    },
  ];

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNative = async () => {
    try {
      await navigator.share({ title: 'WebDrop room', text, url: inviteUrl });
    } catch {
      // user ne cancel kiya
    }
  };

  const handleCopyLink = async () => {
    await onCopyLink?.();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1600);
  };

  const handleCopyCode = async () => {
    await onCopyCode?.();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <button
        type="button"
        aria-label="Close share window"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0f1115]">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <Share2 size={18} />
            </div>
            <div>
              <h2
                id="share-modal-title"
                className="text-base font-extrabold text-slate-900 dark:text-white"
              >
                Share room
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invite someone to join this room
              </p>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* apps grid */}
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Share via
            </p>

            <div className="grid grid-cols-4 gap-3">
              {targets.map(({ name, href, icon: Icon, color, external }) => (
                <a
                  key={name}
                  href={href}
                  {...(external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="group flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95 ${color}`}
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
                  onClick={handleNative}
                  className="group flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95">
                    <Share2 size={21} strokeWidth={2.1} />
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    More
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* link */}
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Invite link
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-3 dark:border-slate-800 dark:bg-slate-900/60">
              <LinkIcon size={14} className="shrink-0 text-slate-400" />
              <p className="min-w-0 flex-1 truncate font-mono text-[12px] text-slate-700 dark:text-slate-300">
                {inviteUrl}
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-bold text-white transition hover:bg-violet-700 active:scale-95"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* code */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Room code
              </p>
              <p className="mt-0.5 font-mono text-lg font-extrabold tracking-[0.2em] text-slate-900 dark:text-white">
                {roomCode}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 active:scale-95 dark:border-slate-700 dark:bg-[#15171d] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
            >
              {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedCode ? 'Copied' : 'Copy code'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}