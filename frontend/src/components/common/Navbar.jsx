import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Menu,
  X,
  Lock,
  ChevronRight,
  Home,
  PlusCircle,
  LogIn,
  Github,
  Copy,
  Check,
  ArrowUpRight,
  Info,
  Users,
  Zap,
  ShieldCheck,
  Activity,
  CircleCheck,
  CircleX,
  Gauge,
  Bell,
  BellRing,
  Clock3,
  ExternalLink,
  Trash2,
  RefreshCw,
  Eraser,
  UserRound,
  Crown,
} from 'lucide-react';

import logo from '../../assets/images/Logo.png';
import { useTheme } from '../../context/ThemeContext';
import { useRoom } from '../../context/RoomContext';
import { toast } from './ToastContainer';
import NetworkSignalIcon, { signalTone } from './NetworkSignalIcon';
import useNetworkInfo from '../../hooks/useNetworkInfo';
import {
  loadSeenRoomCodes,
  saveSeenRoomCodes,
} from '../../utils/recentRooms';
import LangToggle from './LangToggle';

const REPO_URL = 'https://github.com/Suraj1819/web-drop';

const NAV_ITEMS = [
  { labelKey: 'nav.overview', to: '/', icon: Home },
  { labelKey: 'nav.create', to: '/create', icon: PlusCircle },
  { labelKey: 'nav.join', to: '/join', icon: LogIn },
  { labelKey: 'nav.about', to: '/about', icon: Info },
  { labelKey: 'nav.team', to: '/team', icon: Users },
];

const iconButton =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-400/[0.08] dark:hover:text-violet-300';

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) throw new Error('Clipboard copy failed');
}

function formatTime(timestamp, fallback) {
  if (!timestamp) return fallback;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function Navbar() {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  const {
    connected,
    navLocked,
    recentRooms = [],
    rejoinRoom,
    removeRecentRoom,
    clearRecentRooms,
    refreshRecentRooms,
  } = useRoom();

  const location = useLocation();
  const navigate = useNavigate();
  const net = useNetworkInfo();

  const roomMatch = useMatch('/room/:roomCode');
  const roomCode = roomMatch?.params?.roomCode?.toUpperCase() || '';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joiningCode, setJoiningCode] = useState('');
  const [seenRooms, setSeenRooms] = useState(() => loadSeenRoomCodes());

  const headerRef = useRef(null);
  const statusRef = useRef(null);
  const notificationRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const bars = net.online ? net.bars : 0;
  const localRooms = Array.isArray(recentRooms) ? recentRooms : [];

  useEffect(() => {
    setMobileOpen(false);
    setStatusOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 5);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setStatusOpen(false);
        setNotificationsOpen(false);
      }
    };

    const handleOutsideClick = (event) => {
      if (
        mobileOpen &&
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setMobileOpen(false);
      }

      if (
        statusOpen &&
        statusRef.current &&
        !statusRef.current.contains(event.target)
      ) {
        setStatusOpen(false);
      }

      if (
        notificationsOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        if (window.innerWidth >= 640) {
          setNotificationsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, {
      passive: true,
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [mobileOpen, statusOpen, notificationsOpen]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    if (notificationsOpen && isMobile) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }

    return undefined;
  }, [notificationsOpen]);

  const guardClick = (event) => {
    if (!navLocked) return;

    event.preventDefault();

    toast.warning(
      t('toast.transferInProgress'),
      t('toast.transferInProgressBody'),
    );
  };

  const handleCopyRoom = useCallback(async () => {
    if (!roomCode) return;

    try {
      await copyText(roomCode);
      setCopied(true);
      toast.success(
        t('toast.codeCopied'),
        t('toast.codeCopiedBody', { code: roomCode }),
      );

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1800);
    } catch {
      toast.error(t('toast.copyFailed'), t('toast.copyFailedBody'));
    }
  }, [roomCode, t]);

  const markNotificationsSeen = useCallback(() => {
    const codes = localRooms.map((room) => room.roomCode);
    setSeenRooms(codes);
    saveSeenRoomCodes(codes);
  }, [localRooms]);

  const unreadCount = localRooms.filter(
    (room) => !seenRooms.includes(room.roomCode),
  ).length;

  const handleNotificationsToggle = () => {
    const nextOpen = !notificationsOpen;

    setNotificationsOpen(nextOpen);
    setStatusOpen(false);
    setMobileOpen(false);

    if (nextOpen) {
      refreshRecentRooms?.();
      markNotificationsSeen();
    }
  };

  const handleRejoin = async (targetCode) => {
    if (!targetCode || typeof rejoinRoom !== 'function') {
      toast.error(
        t('toast.rejoinUnavailable'),
        t('toast.rejoinUnavailableBody'),
      );
      return;
    }

    if (!connected) {
      toast.error(t('toast.serverOffline'), t('toast.serverOfflineBody'));
      return;
    }

    setJoiningCode(targetCode);

    try {
      const result = await rejoinRoom(targetCode);

      if (!result?.success) {
        toast.error(
          t('toast.unableRejoin'),
          result?.message || t('toast.unableRejoinBody'),
        );
        return;
      }

      setNotificationsOpen(false);
      setMobileOpen(false);

      const code = result.roomCode || targetCode;
      toast.success(
        t('toast.roomRejoined'),
        t('toast.roomRejoinedBody', { code }),
      );

      navigate(`/room/${code}`);
    } catch (error) {
      toast.error(
        t('toast.rejoinFailed'),
        error?.message || t('toast.tryAgain'),
      );
    } finally {
      setJoiningCode('');
    }
  };

  const handleRemoveRecentRoom = (targetCode) => {
    if (typeof removeRecentRoom !== 'function') return;

    removeRecentRoom(targetCode);
    setSeenRooms((previous) =>
      previous.filter((code) => code !== targetCode),
    );
  };

  const handleClearAll = () => {
    if (!localRooms.length) return;

    if (typeof clearRecentRooms === 'function') {
      clearRecentRooms();
    } else if (typeof removeRecentRoom === 'function') {
      localRooms.forEach((room) => removeRecentRoom(room.roomCode));
    }

    setSeenRooms([]);
    saveSeenRoomCodes([]);
    toast.success(t('toast.cleared'), t('toast.clearedBody'));
  };

  const connectionTone = connected
    ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07] dark:text-emerald-400'
    : 'border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-500/20 dark:bg-red-500/[0.07] dark:text-red-400';

  const renderNetworkIcon = (extraClass = '') => (
    <NetworkSignalIcon
      kind={net.kind}
      bars={bars}
      online={net.online}
      className={`h-4 w-4 ${
        net.online ? signalTone(bars) : 'text-red-500 dark:text-red-400'
      } ${extraClass}`}
      strokeWidth={2.2}
    />
  );

  const closeMobileMenu = () => setMobileOpen(false);

  const roomsSubtitle =
    localRooms.length === 1
      ? t('notifications.subtitle', { count: localRooms.length })
      : t('notifications.subtitle_plural', { count: localRooms.length });

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-2xl transition-shadow duration-200 dark:border-white/[0.07] dark:bg-surface/95 ${
        scrolled
          ? 'shadow-[0_6px_28px_rgba(15,23,42,0.07)] dark:shadow-[0_6px_28px_rgba(0,0,0,0.25)]'
          : ''
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-2 focus:z-[70] focus:rounded-lg focus:bg-violet-600 focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        {t('nav.skipToContent')}
      </a>

      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-3 sm:h-[68px] sm:gap-3 sm:px-5 lg:gap-4 lg:px-7 xl:px-9">
        <NavLink
          to="/"
          onClick={(event) => {
            guardClick(event);
            if (!navLocked) closeMobileMenu();
          }}
          aria-label={t('nav.homeAria')}
          aria-disabled={navLocked || undefined}
          className={`group flex min-w-0 shrink-0 items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 sm:gap-2.5 ${
            navLocked ? 'cursor-not-allowed opacity-60' : ''
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors group-hover:border-violet-300 dark:border-white/[0.09] dark:bg-white/[0.045] dark:group-hover:border-violet-400/30 sm:h-10 sm:w-10">
            <img
              src={logo}
              alt=""
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            />
          </span>

          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-[16px] font-extrabold tracking-[-0.045em] text-slate-900 dark:text-white sm:text-[18px]">
              {t('brand.name')}
            </span>
            <span className="mt-1.5 hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 sm:block">
              {t('brand.tagline')}
            </span>
          </span>
        </NavLink>

        <nav
          aria-label={t('nav.primaryNav')}
          className="mx-auto hidden min-w-0 flex-1 items-center justify-center lg:flex"
        >
          <div className="flex min-w-0 items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 dark:border-white/[0.07] dark:bg-white/[0.025] xl:gap-1">
            {NAV_ITEMS.map(({ labelKey, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 xl:gap-2 xl:px-3 xl:text-xs ${
                    navLocked
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                      : isActive
                        ? 'bg-white text-violet-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-white/[0.09] dark:text-violet-300 dark:ring-white/[0.07]'
                        : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.055] dark:hover:text-white'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.1} />
                {t(labelKey)}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {navLocked && (
            <div className="hidden max-w-[210px] items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 py-1.5 pl-2.5 pr-1.5 sm:flex dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>

              <span className="hidden whitespace-nowrap text-[10px] font-bold text-amber-700 dark:text-amber-400 xl:inline">
                {t('room.active')}
              </span>

              {roomCode && (
                <button
                  type="button"
                  onClick={handleCopyRoom}
                  title={t('room.copyCode')}
                  aria-label={`${t('room.copyCode')} ${roomCode}`}
                  className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 font-mono text-[11px] font-bold tracking-wider text-amber-700 shadow-sm hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:bg-white/[0.07] dark:text-amber-300 dark:hover:bg-white/[0.12]"
                >
                  <span className="truncate">{roomCode}</span>
                  {copied ? (
                    <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 shrink-0 opacity-60" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={handleNotificationsToggle}
              aria-label={`${t('notifications.title')}${unreadCount ? `, ${unreadCount}` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              title={t('notifications.bellTitle')}
              className={`${iconButton} relative ${
                notificationsOpen
                  ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/[0.09] dark:text-violet-300'
                  : ''
              }`}
            >
              {unreadCount > 0 ? (
                <BellRing className="h-[17px] w-[17px]" strokeWidth={2.1} />
              ) : (
                <Bell className="h-[17px] w-[17px]" strokeWidth={2.1} />
              )}

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-violet-600 px-1 text-[9px] font-extrabold leading-none text-white dark:border-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-[65] bg-slate-950/40 backdrop-blur-sm sm:hidden"
                  onClick={() => setNotificationsOpen(false)}
                  aria-hidden="true"
                />

                <div
                  role="dialog"
                  aria-label={t('notifications.recentAria')}
                  className={[
                    'fixed inset-x-3 top-[max(4.5rem,env(safe-area-inset-top)+3.5rem)] z-[70]',
                    'sm:absolute sm:inset-x-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2',
                    'w-auto sm:w-[min(380px,calc(100vw-1.25rem))]',
                    'max-h-[min(520px,calc(100dvh-6rem))]',
                    'flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15',
                    'dark:border-white/[0.09] dark:bg-surface-card dark:shadow-black/40',
                  ].join(' ')}
                >
                  <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.025] sm:gap-3 sm:p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 dark:border-violet-400/15 dark:bg-violet-400/[0.08] sm:h-10 sm:w-10">
                      <Bell
                        className="h-4 w-4 text-violet-600 dark:text-violet-400 sm:h-5 sm:w-5"
                        strokeWidth={2.2}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white sm:text-sm">
                        {t('notifications.title')}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                        {roomsSubtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => refreshRecentRooms?.()}
                      title={t('notifications.refresh')}
                      aria-label={t('notifications.refresh')}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-violet-300"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      aria-label={t('notifications.close')}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {localRooms.length === 0 ? (
                    <div className="flex-1 px-5 py-8 text-center sm:py-9">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.03] sm:h-12 sm:w-12">
                        <Bell className="h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
                      </div>
                      <p className="mt-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">
                        {t('notifications.emptyTitle')}
                      </p>
                      <p className="mx-auto mt-1.5 max-w-[240px] text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
                        {t('notifications.emptyBody')}
                      </p>
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-2.5">
                      {localRooms.map((room) => {
                        const isJoining = joiningCode === room.roomCode;
                        const isHost = room.role === 'host';

                        return (
                          <div
                            key={`${room.roomCode}-${room.role}-${room.at}`}
                            className="group rounded-xl p-2.5 transition-colors hover:bg-slate-50 sm:p-3 dark:hover:bg-white/[0.035]"
                          >
                            <div className="flex items-start gap-2.5 sm:gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
                                  isHost
                                    ? 'border border-amber-100 bg-amber-50 dark:border-amber-400/15 dark:bg-amber-400/[0.08]'
                                    : 'border border-sky-100 bg-sky-50 dark:border-sky-400/15 dark:bg-sky-400/[0.08]'
                                }`}
                              >
                                {isHost ? (
                                  <Crown
                                    className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 sm:h-4 sm:w-4"
                                    strokeWidth={2.2}
                                  />
                                ) : (
                                  <UserRound
                                    className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 sm:h-4 sm:w-4"
                                    strokeWidth={2.2}
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <p className="font-mono text-[12px] font-extrabold tracking-[0.12em] text-slate-900 dark:text-white sm:text-sm">
                                    {room.roomCode}
                                  </p>

                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                      isHost
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                                        : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
                                    }`}
                                  >
                                    {isHost ? t('room.host') : t('room.guest')}
                                  </span>

                                  {!seenRooms.includes(room.roomCode) && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                  )}
                                </div>

                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 sm:mt-1">
                                  <Clock3 className="h-3 w-3 shrink-0 opacity-70" />
                                  {formatTime(
                                    room.at || room.joinedAt,
                                    t('notifications.recentRoomFallback'),
                                  )}
                                </p>

                                <div className="mt-2 flex items-center gap-1.5 sm:mt-2.5 sm:gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRejoin(room.roomCode)}
                                    disabled={Boolean(joiningCode) || navLocked}
                                    className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-violet-600/15 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial"
                                  >
                                    {isJoining ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <ExternalLink className="h-3 w-3" />
                                    )}
                                    {isJoining
                                      ? t('notifications.rejoining')
                                      : t('notifications.rejoin')}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveRecentRoom(room.roomCode)
                                    }
                                    title={t('notifications.removeTitle')}
                                    aria-label={t('notifications.removeRoom', {
                                      code: room.roomCode,
                                    })}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/[0.08] dark:hover:text-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
                    <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {t('notifications.footer')}
                    </p>

                    {localRooms.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Eraser className="h-3 w-3" strokeWidth={2.4} />
                        {t('notifications.clearAll')}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Connection status — desktop */}
          <div ref={statusRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setStatusOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              aria-haspopup="dialog"
              aria-expanded={statusOpen}
              aria-label={t('status.openDetails')}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 xl:px-3 ${connectionTone}`}
            >
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <span
                  className={`absolute inset-0 rounded-full ${
                    connected ? 'bg-emerald-400/10' : 'bg-red-400/10'
                  }`}
                />
                {renderNetworkIcon('relative')}
              </span>

              <span className="hidden text-left leading-none xl:block">
                <span className="flex items-center gap-1.5 text-[10px] font-bold">
                  {connected
                    ? t('status.serverOnline')
                    : t('status.serverOffline')}
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      connected ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                </span>
                <span className="mt-1.5 block max-w-[120px] truncate text-[10px] font-medium opacity-70">
                  {net.label} · {net.quality}
                </span>
              </span>

              <ChevronRight
                className={`hidden h-3 w-3 shrink-0 opacity-60 transition-transform xl:block ${
                  statusOpen ? 'rotate-90' : ''
                }`}
              />
            </button>

            {statusOpen && (
              <div
                role="dialog"
                aria-label={t('status.connectionOverview')}
                className="absolute right-0 top-full z-[60] mt-2 w-[min(310px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/[0.09] dark:bg-surface-card dark:shadow-black/30"
              >
                <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.025]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 dark:border-violet-400/15 dark:bg-violet-400/[0.08]">
                      <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {t('status.connectionOverview')}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {t('status.networkStatus')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatusOpen(false)}
                      aria-label={t('status.closeDetails')}
                      className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('status.signalingServer')}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${
                        connected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {connected ? (
                        <CircleCheck className="h-3.5 w-3.5" />
                      ) : (
                        <CircleX className="h-3.5 w-3.5" />
                      )}
                      {connected
                        ? t('status.connected')
                        : t('status.disconnected')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('status.networkType')}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {renderNetworkIcon()}
                      <span className="truncate">{net.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('status.networkQuality')}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {net.online ? net.quality : t('status.unavailable')}
                    </span>
                  </div>

                  {typeof net.downlink === 'number' && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Gauge className="h-3.5 w-3.5" />
                        {t('status.estimatedSpeed')}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {net.downlink} Mbps
                      </span>
                    </div>
                  )}

                  {typeof net.rtt === 'number' && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t('status.estimatedLatency')}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {net.rtt} ms
                      </span>
                    </div>
                  )}

                  <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-400/10 dark:bg-violet-400/[0.045]">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {t('status.peerHelp')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!navLocked && (
            <NavLink
              to="/create"
              onClick={guardClick}
              className="hidden h-10 shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white shadow-sm shadow-violet-600/20 transition-colors hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface xl:inline-flex"
            >
              <Zap className="h-3.5 w-3.5" fill="currentColor" />
              <span>{t('nav.startTransfer')}</span>
              <ArrowUpRight className="h-3 w-3 opacity-80" />
            </NavLink>
          )}

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={guardClick}
            aria-label={t('github.aria')}
            title={t('github.view')}
            aria-disabled={navLocked || undefined}
            tabIndex={navLocked ? -1 : undefined}
            className={`${iconButton} hidden xl:inline-flex ${
              navLocked ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            <Github className="h-4 w-4" strokeWidth={2} />
          </a>

          <LangToggle className={iconButton} />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
            title={isDark ? t('theme.light') : t('theme.dark')}
            className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-400/[0.08] dark:hover:text-violet-300"
          >
            {isDark ? (
              <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
            )}
          </button>

          <button
            type="button"
            aria-label={
              mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')
            }
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-400/[0.08] dark:hover:text-violet-300 lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        aria-hidden={!mobileOpen}
        className={`overflow-hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-2xl transition-[max-height,opacity] duration-200 dark:border-white/[0.06] dark:bg-surface/95 lg:hidden ${
          mobileOpen
            ? 'max-h-[calc(100dvh-56px)] overflow-y-auto opacity-100'
            : 'pointer-events-none max-h-0 border-transparent opacity-0'
        }`}
      >
        <div className="mx-auto w-full max-w-[1440px] px-2.5 py-2.5 sm:px-5 sm:py-3">
          <div className="mb-2.5 grid grid-cols-2 gap-2">
            <div
              className={`relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border px-2.5 py-2.5 ${
                connected
                  ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-50/40 dark:border-emerald-500/20 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.03]'
                  : 'border-red-200/80 bg-gradient-to-br from-red-50 to-red-50/40 dark:border-red-500/20 dark:from-red-500/[0.08] dark:to-red-500/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                    connected
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                  }`}
                >
                  {renderNetworkIcon()}
                </span>
                {connected && (
                  <span className="flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-emerald-700 dark:bg-white/[0.06] dark:text-emerald-400">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    {t('room.live')}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${
                    connected
                      ? 'text-emerald-700/80 dark:text-emerald-400/80'
                      : 'text-red-700/80 dark:text-red-400/80'
                  }`}
                >
                  {t('room.server')}
                </p>
                <p className="mt-0.5 truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">
                  {connected ? net.label : t('room.offline')}
                </p>
              </div>
            </div>

            <div
              className={`relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border px-2.5 py-2.5 ${
                navLocked
                  ? 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-50/40 dark:border-amber-500/20 dark:from-amber-500/[0.08] dark:to-amber-500/[0.03]'
                  : 'border-violet-200/80 bg-gradient-to-br from-violet-50 to-violet-50/40 dark:border-violet-400/20 dark:from-violet-400/[0.08] dark:to-violet-400/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                    navLocked
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                      : 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
                {navLocked && (
                  <span className="flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-amber-700 dark:bg-white/[0.06] dark:text-amber-400">
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                    {t('room.activeShort')}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[9px] font-extrabold uppercase tracking-[0.12em] ${
                    navLocked
                      ? 'text-amber-700/80 dark:text-amber-400/80'
                      : 'text-violet-700/80 dark:text-violet-400/80'
                  }`}
                >
                  {t('room.active').split(' ')[0]}
                </p>
                <p className="mt-0.5 truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">
                  {navLocked ? t('room.activeShort') : t('room.ready')}
                </p>
              </div>
            </div>
          </div>

          <nav aria-label={t('nav.mobileNav')} className="space-y-0.5">
            {NAV_ITEMS.map(({ labelKey, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={(event) => {
                  guardClick(event);
                  if (!navLocked) closeMobileMenu();
                }}
                aria-disabled={navLocked || undefined}
                tabIndex={!mobileOpen || navLocked ? -1 : undefined}
                className={({ isActive }) =>
                  `flex min-h-9 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                    navLocked
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                      : isActive
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-400/[0.09] dark:text-violet-300'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
                  }`
                }
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                  <span className="truncate">{t(labelKey)}</span>
                </span>
                {navLocked ? (
                  <Lock className="h-3 w-3 shrink-0 opacity-60" strokeWidth={2.2} />
                ) : (
                  <ChevronRight
                    className="h-3 w-3 shrink-0 opacity-50"
                    strokeWidth={2.2}
                  />
                )}
              </NavLink>
            ))}

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={guardClick}
              aria-disabled={navLocked || undefined}
              tabIndex={!mobileOpen || navLocked ? -1 : undefined}
              className={`flex min-h-9 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                navLocked
                  ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Github className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                <span className="truncate">{t('nav.source')}</span>
              </span>
              {navLocked ? (
                <Lock className="h-3 w-3 shrink-0 opacity-60" strokeWidth={2.2} />
              ) : (
                <ArrowUpRight
                  className="h-3 w-3 shrink-0 opacity-50"
                  strokeWidth={2.2}
                />
              )}
            </a>
          </nav>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2 dark:border-white/[0.07]">
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {t('brand.name')}
            </span>
            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
              {t('brand.footerTagline')}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          header *,
          header *::before,
          header *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </header>
  );
}