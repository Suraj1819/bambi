// src/pages/CreateRoom.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Loader2,
  Maximize2,
  Radio,
  RefreshCw,
  Share2,
  ShieldCheck,
  Users,
  X,
  Clock,
  Command,
  CircleDot,
  Lock,
  Wifi,
  Zap,
  Server,
  KeyRound,
  FileCheck,
  Globe,
  Download,
  Smartphone,
  AlertCircle,
  Info,
} from 'lucide-react';

import {
  useRoom,
  saveHostToken,
  addRecentRoom,
  clearHostToken,
} from '../context/RoomContext';

import { WEB_APP_URL } from '../utils/constants';

import { toast } from '../components/common/ToastContainer';

/* ============================================================
   CONSTANTS
============================================================ */

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface';

const CAPABILITY_KEYS = [
  { icon: ShieldCheck, titleKey: 'create.capE2eTitle', descKey: 'create.capE2eDesc', tone: 'emerald' },
  { icon: Zap, titleKey: 'create.capP2pTitle', descKey: 'create.capP2pDesc', tone: 'violet' },
  { icon: Clock, titleKey: 'create.capExpireTitle', descKey: 'create.capExpireDesc', tone: 'amber' },
  { icon: Users, titleKey: 'create.capTwoTitle', descKey: 'create.capTwoDesc', tone: 'sky' },
];

const SPEC_KEYS = [
  { labelKey: 'create.specTransport', value: 'WebRTC · DTLS', icon: Server },
  { labelKey: 'create.specSignaling', value: 'Socket.IO', icon: Wifi },
  { labelKey: 'create.specAuth', valueKey: 'create.specAuthValue', icon: KeyRound },
  { labelKey: 'create.specStorage', valueKey: 'create.specStorageValue', icon: FileCheck },
];

const FAQ_KEYS = [
  { qKey: 'create.faq1q', aKey: 'create.faq1a' },
  { qKey: 'create.faq2q', aKey: 'create.faq2a' },
  { qKey: 'create.faq3q', aKey: 'create.faq3a' },
  { qKey: 'create.faq4q', aKey: 'create.faq4a' },
];

/* ============================================================
   HELPERS
============================================================ */

function getDeviceInfo() {
  try {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS device';
    if (/Android/i.test(ua)) return 'Android device';
    if (/Windows/i.test(ua)) return 'Windows device';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac device';
    if (/Linux/i.test(ua)) return 'Linux device';
    return 'Web browser';
  } catch {
    return 'Web browser';
  }
}

async function copyToClipboard(text) {
  if (!text) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
    }
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function InlineCopy({ value, label, variant = 'default', className = '' }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const displayLabel = label || t('create.copy');

  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error(t('create.toastCopyFailed'), t('create.toastCopyManually'));
    }
  };

  const baseStyles =
    variant === 'primary'
      ? 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/[0.08] dark:text-violet-300 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/[0.12]'
      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.08] dark:hover:text-violet-300';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors sm:px-3 sm:text-[12px] ${baseStyles} ${FOCUS_RING} ${className}`}
      aria-label={copied ? t('create.copied') : displayLabel}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.6} />
          <span>{t('create.copied')}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
          <span>{displayLabel}</span>
        </>
      )}
    </button>
  );
}

function ToneStyles(tone) {
  const map = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/[0.08]',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-500/[0.08]',
      text: 'text-violet-600 dark:text-violet-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500/[0.08]',
      text: 'text-amber-600 dark:text-amber-400',
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-500/[0.08]',
      text: 'text-sky-600 dark:text-sky-400',
    },
  };
  return map[tone] || map.violet;
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" strokeWidth={2.4} />
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {children}
      </span>
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
      className={`fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] right-4 z-40 lg:bottom-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur-sm transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.1] dark:bg-[#15171d]/95 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-300 sm:right-5 ${FOCUS_RING}`}
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
    </button>
  );
}

/* ============================================================
   CREATE VIEW
============================================================ */

function CreateView({ loading, connected, socket, onGenerate }) {
  const { t } = useTranslation();
  const isConnected = Boolean(connected && socket?.connected);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
      {/* ============ LEFT COLUMN ============ */}
      <div className="min-w-0">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-3 py-1 dark:border-violet-500/20 dark:bg-violet-500/[0.08]">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
            {t('create.badge')}
          </span>
        </div>

        {/* Heading */}
        <h1 className="mt-4 font-heading text-[28px] font-extrabold leading-[1.1] tracking-[-0.035em] text-slate-900 dark:text-white xs:text-[32px] sm:text-[42px] lg:text-[48px]">
          {t('create.titleLine1')}
          <span className="block bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
            {t('create.titleLine2')}
          </span>
        </h1>

        <p className="mt-4 max-w-[560px] text-[13.5px] leading-6 text-slate-600 dark:text-slate-400 sm:mt-5 sm:text-[14.5px] sm:leading-7">
          {t('create.subtitle')}
        </p>

        {/* Primary CTA block */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:mt-8 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                isConnected
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-slate-500'
              }`}
            >
              <Radio className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-slate-900 dark:text-white sm:text-[14px]">
                {t('create.generateTitle')}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[12.5px]">
                {isConnected
                  ? t('create.generateReady')
                  : t('create.generateWaiting')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || !isConnected}
            className={`group mt-4 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-5 text-[13.5px] font-bold text-white shadow-lg shadow-violet-600/20 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-white/[0.08] dark:disabled:text-slate-500 sm:mt-5 sm:h-12 sm:w-auto sm:min-w-[240px] sm:px-6 sm:text-[14px] ${FOCUS_RING}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.6} />
                <span>{t('create.creating')}</span>
              </>
            ) : !isConnected ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.6} />
                <span>{t('create.connecting')}</span>
              </>
            ) : (
              <>
                <span>{t('create.createRoom')}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
              </>
            )}
          </button>

          {/* Status strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
                }`}
              />
              <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                {isConnected ? t('create.serverConnected') : t('create.connectingServer')}
              </span>
            </div>
            <span className="hidden h-3 w-px bg-slate-200 dark:bg-white/[0.08] sm:block" />
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              {t('create.signalingOnly')}
            </span>
          </div>

          {/* Not connected warning */}
          {!isConnected && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-500/15 dark:bg-amber-500/[0.06]">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                strokeWidth={2.4}
              />
              <p className="text-[11.5px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                <strong className="font-semibold">{t('create.waitingConnection')}</strong>{' '}
                {t('create.waitingConnectionBody')}
              </p>
            </div>
          )}
        </div>

        {/* {t('create.capabilities')} section */}
        <div className="mt-8 sm:mt-10">
          <SectionLabel icon={CircleDot}>{t('create.capabilities')}</SectionLabel>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CAPABILITY_KEYS.map(({ icon: Icon, titleKey, descKey, tone }) => {
              const tones = ToneStyles(tone);
              return (
                <div
                  key={titleKey}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-violet-200 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-violet-500/30 sm:p-4"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones.bg} ${tones.text}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <p className="mt-3 text-[13px] font-bold text-slate-900 dark:text-white">
                    {t(titleKey)}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-8 sm:mt-10">
          <SectionLabel icon={Info}>{t('create.commonQuestions')}</SectionLabel>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
            {FAQ_KEYS.map(({ qKey, aKey }, i) => (
              <details
                key={qKey}
                className={`group ${
                  i !== FAQ_KEYS.length - 1
                    ? 'border-b border-slate-100 dark:border-white/[0.06]'
                    : ''
                }`}
              >
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-[12.5px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.03] sm:px-4 [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
                >
                  <span className="pr-2">{t(qKey)}</span>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-transform group-open:rotate-45 group-open:border-violet-300 group-open:bg-violet-50 group-open:text-violet-600 dark:border-white/[0.08] dark:text-slate-500 dark:group-open:border-violet-500/30 dark:group-open:bg-violet-500/[0.08] dark:group-open:text-violet-400">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="px-3.5 pb-3 pr-10 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 sm:px-4">
                  {t(aKey)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* ============ RIGHT COLUMN (STICKY on lg+) ============ */}
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
          <SectionLabel icon={Command}>{t('create.howItWorks')}</SectionLabel>

          <ol className="mt-4 space-y-4">
            {[
              ['create.step1Title', 'create.step1Text'],
              ['create.step2Title', 'create.step2Text'],
              ['create.step3Title', 'create.step3Text'],
            ].map(([titleKey, subKey], i) => (
              <li key={titleKey} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                    {t(titleKey)}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(subKey)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
          <SectionLabel icon={Server}>{t('create.techDetails')}</SectionLabel>

          <dl className="mt-4 space-y-3">
            {SPEC_KEYS.map(({ labelKey, value, valueKey, icon: Icon }) => (
              <div key={labelKey} className="flex items-center justify-between gap-3">
                <dt className="flex min-w-0 items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" strokeWidth={2.2} />
                  <span className="truncate">{t(labelKey)}</span>
                </dt>
                <dd className="shrink-0 text-right font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 sm:text-[11.5px]">
                  {valueKey ? t(valueKey) : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-emerald-50/40 p-4 dark:border-emerald-500/15 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.03] sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-white/[0.06] dark:text-emerald-400">
              <Lock className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-emerald-900 dark:text-emerald-200">
                {t('create.privateTitle')}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                {t('create.privateBody')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================
   READY VIEW  (room code page — fully responsive)
   Primary CTA always visible without scrolling
============================================================ */

function ReadyView({
  roomCode,
  joinUrl,
  onOpenRoom,
  onOpenJoinLink,
  onShare,
  onNewRoom,
  onCancelRoom,
}) {
  const { t } = useTranslation();
  const codeChars = String(roomCode || '').split('');

  return (
    <>
      {/* Fixed bottom CTA — always on screen (mobile + desktop) */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/90 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0f1115]/95 dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)] lg:hidden">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onShare}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-300 ${FOCUS_RING}`}
            aria-label={t('create.shareLink')}
            title={t('create.shareLink')}
          >
            <Share2 className="h-4 w-4" strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={onOpenRoom}
            className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-[13px] font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-700 sm:h-12 sm:px-4 sm:text-[14px] ${FOCUS_RING}`}
          >
            <Radio className="h-4 w-4 shrink-0" strokeWidth={2.4} />
            <span className="truncate">{t('create.enterRoomShort')}</span>
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.6} />
          </button>

          <button
            type="button"
            onClick={onCancelRoom}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-[12px] font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/15 sm:h-12 sm:px-4 sm:text-[13px] ${FOCUS_RING}`}
            aria-label={t('create.cancelRoom')}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
            <span className="hidden xs:inline">Cancel</span>
          </button>
        </div>
      </div>

      {/* Extra bottom padding so content is not hidden behind fixed bar */}
      <div className="grid gap-8 pb-24 lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:pb-0">
        {/* ============ LEFT COLUMN ============ */}
        <div className="min-w-0">
          {/* Success badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {t('create.roomLive')}
            </span>
          </div>

          <h1 className="mt-3 font-heading text-[24px] font-extrabold leading-[1.12] tracking-[-0.035em] text-slate-900 dark:text-white sm:mt-4 sm:text-[36px] lg:text-[44px]">
            {t('create.shareTitle')}
            <span className="block text-slate-400 dark:text-slate-500">
              {t('create.shareSubtitle')}
            </span>
          </h1>

          <p className="mt-2 max-w-[520px] text-[13px] leading-6 text-slate-600 dark:text-slate-400 sm:mt-3 sm:text-[14px]">
            {t('create.shareBody')}
          </p>

          {/* {t('create.roomCode')} card */}
          <div className="mt-4 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-violet-50/40 to-white p-4 dark:border-violet-500/20 dark:from-violet-500/[0.08] dark:via-violet-500/[0.04] dark:to-transparent sm:mt-6 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700/70 dark:text-violet-300/70">
                {t('create.roomCode')}
              </p>
              <InlineCopy value={roomCode} label={t('create.copyCode')} variant="primary" />
            </div>

            <div className="mt-3 flex w-full items-stretch justify-center gap-1.5 sm:mt-4 sm:gap-2.5 md:gap-3">
              {codeChars.map((char, i) => (
                <span
                  key={`${char}-${i}`}
                  className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-violet-200/60 bg-white font-mono text-[18px] font-black text-violet-700 shadow-sm dark:border-violet-500/20 dark:bg-white/[0.04] dark:text-violet-300 xs:h-12 xs:text-[20px] sm:h-14 sm:rounded-xl sm:text-[26px] md:h-16 md:text-[32px]"
                  style={{ maxWidth: '4.5rem' }}
                >
                  {char}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:mt-4 sm:gap-x-4">
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                {t('create.expires')}
              </span>
              <span className="hidden h-3 w-px bg-slate-300 dark:bg-white/[0.1] sm:block" />
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Users className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                {t('create.singleUse')}
              </span>
              <span className="hidden h-3 w-px bg-slate-300 dark:bg-white/[0.1] sm:block" />
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <KeyRound className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                {t('create.caseInsensitive')}
              </span>
            </div>
          </div>

          {/* Desktop primary actions — Enter + Cancel side by side */}
          <div className="mt-4 hidden gap-3 lg:flex">
            <button
              type="button"
              onClick={onOpenRoom}
              className={`inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-6 text-[14px] font-bold text-white shadow-lg shadow-violet-600/20 transition-colors hover:bg-violet-700 ${FOCUS_RING}`}
            >
              <Radio className="h-4 w-4" strokeWidth={2.4} />
              <span>{t('create.enterRoom')}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
            </button>

            <button
              type="button"
              onClick={onCancelRoom}
              className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-[13.5px] font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-red-500/25 dark:bg-transparent dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 ${FOCUS_RING}`}
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
              <span>{t('create.cancelRoom')}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 sm:my-6">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              {t('create.orShareLink')}
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/[0.06]" />
          </div>

          {/* Join link */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                <Globe className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t('create.directLink')}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-700 dark:text-slate-300 sm:text-[11.5px]">
                  {joinUrl}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 xs:flex-row xs:items-center">
              <InlineCopy value={joinUrl} label={t('create.copyLink')} className="w-full xs:flex-1" />
              <button
                type="button"
                onClick={onOpenJoinLink}
                aria-label="Open link in new tab"
                className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.08] dark:hover:text-violet-300 xs:w-auto ${FOCUS_RING}`}
              >
                <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                Open
              </button>
            </div>
          </div>

          {/* Secondary actions */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={onShare}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.08] dark:hover:text-violet-300 ${FOCUS_RING}`}
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              {t('create.shareLink')}
            </button>

            <button
              type="button"
              onClick={onNewRoom}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.08] dark:hover:text-violet-300 ${FOCUS_RING}`}
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} />
              {t('create.newRoom')}
            </button>
          </div>

          {/* Extra cancel link only on tablet mid-sizes if needed; primary cancel is beside Enter */}
          <button
            type="button"
            onClick={onCancelRoom}
            className={`mt-3 hidden items-center gap-1.5 text-[12px] font-medium text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 md:inline-flex lg:hidden ${FOCUS_RING}`}
          >
            <X className="h-3 w-3" strokeWidth={2.4} />
            {t('create.cancelThisRoom')}
          </button>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-500/15 dark:bg-amber-500/[0.06] sm:p-3.5">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              strokeWidth={2.4}
            />
            <p className="text-[11.5px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
              <strong className="font-semibold">{t('create.keepTab')}</strong> {t('create.keepTabBody')}
            </p>
          </div>

          {/* Mobile-only side cards */}
          <div className="mt-6 space-y-4 lg:hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-5">
              <SectionLabel icon={Smartphone}>{t('create.scanToJoin')}</SectionLabel>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                {t('create.scanBody')}
              </p>
              <div className="mt-3 flex justify-center rounded-xl border border-slate-100 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-4">
                <QRCodeSVG
                  value={joinUrl}
                  level="M"
                  size={148}
                  includeMargin={false}
                  className="h-auto w-full max-w-[148px] sm:max-w-[176px]"
                />
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <Download className="h-3 w-3" strokeWidth={2.4} />
                {t('create.scannerWorks')}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-5">
              <SectionLabel icon={Users}>{t('create.receiverDoes')}</SectionLabel>
              <ol className="mt-3 space-y-2.5">
                {[
                  'create.receiver1',
                  'create.receiver2',
                  'create.receiver3',
                  'create.receiver4',
                ].map((stepKey, i) => (
                  <li key={stepKey} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-slate-600 dark:text-slate-300">
                      {t(stepKey)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-emerald-50/40 p-4 dark:border-emerald-500/15 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.03]">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-white/[0.06] dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-emerald-900 dark:text-emerald-200">
                    {t('create.encryptedTitle')}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                    Your files are transferred over an encrypted DTLS channel.
                    Nothing is readable by our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT COLUMN (desktop) ============ */}
        <aside className="hidden min-w-0 space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
            <SectionLabel icon={Smartphone}>{t('create.scanToJoin')}</SectionLabel>
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Point your phone&apos;s camera at this QR. It opens the join page
              instantly.
            </p>
            <div className="mt-4 flex justify-center rounded-xl border border-slate-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <QRCodeSVG value={joinUrl} level="M" size={176} includeMargin={false} />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <Download className="h-3 w-3" strokeWidth={2.4} />
              {t('create.scannerWorks')}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
            <SectionLabel icon={Users}>{t('create.receiverDoes')}</SectionLabel>
            <ol className="mt-4 space-y-3">
              {[
                'create.receiver1',
                'create.receiver2',
                'create.receiver3',
                'create.receiver4',
              ].map((stepKey, i) => (
                <li key={stepKey} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-slate-600 dark:text-slate-300">
                    {t(stepKey)}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-emerald-50/40 p-5 dark:border-emerald-500/15 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.03]">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-white/[0.06] dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-[12.5px] font-bold text-emerald-900 dark:text-emerald-200">
                  {t('create.encryptedTitle')}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                  {t('create.encryptedBody')}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function CreateRoomPage() {
  const { t } = useTranslation();
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const [deviceName] = useState(() => getDeviceInfo());
  const [deviceInfo] = useState(() => getDeviceInfo());

  const navigate = useNavigate();
  const location = useLocation();

  const {
    socket,
    connected,
    setRoomCode: setLocalRoomCode,
    setRole,
    setUsers,
  } = useRoom();

  /* Scroll top on route change */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  /* Join URL */
  const joinUrl = useMemo(() => {
    if (!roomCode) return '';
    return `${WEB_APP_URL}/join?room=${encodeURIComponent(roomCode)}`;
  }, [roomCode]);

  /* Room created event */
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = ({ roomCode: code, hostToken }) => {
      if (!code) {
        setLoading(false);
        toast.error(
          t('create.toastRoomFailed'),
          t('create.toastNoCode')
        );
        return;
      }

      window.setTimeout(() => {
        setLoading(false);
        setRoomCode(code);
        setLocalRoomCode(code);
        setRole('host');
        setUsers([]);

        socket.emit('leave-room', { roomCode: code });

        if (hostToken) {
          saveHostToken(code, hostToken);
        }

        addRecentRoom({ roomCode: code, role: 'host', joinedAt: Date.now() });

        toast.success(t('create.toastRoomCreated'), t('create.toastRoomReady', { code }));

        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }, 300);
    };

    socket.on('room-created', handleRoomCreated);
    return () => socket.off('room-created', handleRoomCreated);
  }, [socket, setLocalRoomCode, setRole, setUsers]);

  /* Generate */
  const handleGenerate = () => {
    if (!socket || !connected || !socket.connected) {
      toast.error(
        t('create.toastServerOffline'),
        t('create.toastServerOfflineBody')
      );
      return;
    }

    if (loading) return;

    setLoading(true);
    socket.emit('create-room', { deviceName, deviceInfo });

    window.setTimeout(() => {
      setLoading((current) => {
        if (!current) return current;
        toast.error(t('create.toastNoResponse'), t('create.toastNoResponseBody'));
        return false;
      });
    }, 8000);
  };

  const handleOpenTransmission = () => {
    if (!roomCode) return;
    navigate(`/room/${roomCode}`);
  };

  const handleOpenJoinLink = () => {
    if (!joinUrl) return;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  /* ============================================================
     SHARE — Uses device's native share sheet
     
     Priority:
     1. navigator.share (device native share sheet — WhatsApp, Telegram, etc.)
     2. Clipboard copy fallback (desktop browsers without native share)
     3. Prompt last resort
  ============================================================ */
  const handleShare = async () => {
    if (!joinUrl || !roomCode) {
      toast.error(t('create.toastNothingShare'), t('create.toastWaitCode'));
      return;
    }

    const shareText = t('create.shareText', { code: roomCode, url: joinUrl });

    const shareData = {
      title: t('create.shareTitleNative'),
      text: shareText,
      url: joinUrl,
    };

    // 1. Native share sheet (mobile + modern desktop browsers)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        if (
          typeof navigator.canShare === 'function' &&
          !navigator.canShare(shareData)
        ) {
          // Fall through to clipboard
        } else {
          await navigator.share(shareData);
          return;
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        // Fall through to clipboard.
      }
    }

    // 2. Clipboard fallback (desktop without native share)
    const ok = await copyToClipboard(joinUrl);

    if (ok) {
      toast.success(
        t('create.toastLinkCopied'),
        t('create.toastLinkCopiedBody')
      );
      return;
    }

    // 3. Last resort — prompt
    try {
      window.prompt('Copy this room link:', joinUrl);
    } catch {
      toast.error(t('create.toastUnableShare'), t('create.toastCopyLinkManually'));
    }
  };

  const handleCancelRoom = () => {
    if (!roomCode) return;
    if (socket) socket.emit('cancel-room', { roomCode });
    clearHostToken(roomCode);
    setRoomCode(null);
    setLocalRoomCode(null);
    setRole(null);
    setUsers([]);
    toast.success(t('create.toastRoomCancelled'), t('create.toastRoomCancelledBody'));
  };

  const handleNewRoom = () => {
    if (roomCode) clearHostToken(roomCode);
    setRoomCode(null);
    setLocalRoomCode(null);
    setRole(null);
    setUsers([]);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FBFAFF] text-slate-900 dark:bg-surface dark:text-white">
      {/* Subtle top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-12 lg:px-10">
        {/* Top nav */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 ${FOCUS_RING}`}
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2.4}
          />
          {t('create.back')}
        </button>

        {/* Main content */}
        <section className="mt-6 sm:mt-12">
          {!roomCode ? (
            <CreateView
              loading={loading}
              connected={connected}
              socket={socket}
              onGenerate={handleGenerate}
            />
          ) : (
            <ReadyView
              roomCode={roomCode}
              joinUrl={joinUrl}
              onOpenRoom={handleOpenTransmission}
              onOpenJoinLink={handleOpenJoinLink}
              onShare={handleShare}
              onNewRoom={handleNewRoom}
              onCancelRoom={handleCancelRoom}
            />
          )}
        </section>
      </main>

      <ScrollToTop />
    </div>
  );
}