import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useMatch, useNavigate } from 'react-router-dom';
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
  CircleHelp,
  CircleCheck,
  CircleX,
  Gauge,
  Bell,
  BellRing,
  Clock3,
  ExternalLink,
  Trash2,
  RefreshCw,
} from 'lucide-react';

import logo from '../../assets/images/Logo.png';
import { useTheme } from '../../context/ThemeContext';
import { useRoom } from '../../context/RoomContext';
import { toast } from './ToastContainer';
import NetworkSignalIcon, { signalTone } from './NetworkSignalIcon';
import useNetworkInfo from '../../hooks/useNetworkInfo';

const REPO_URL = 'https://github.com/Suraj1819/web-drop';

const NAV_ITEMS = [
  { label: 'Overview', to: '/', icon: Home },
  { label: 'Create room', to: '/create', icon: PlusCircle },
  { label: 'Join room', to: '/join', icon: LogIn },
  { label: 'About', to: '/about', icon: Info },
  { label: 'Team', to: '/team', icon: Users },
];

const iconButton =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-400/[0.08] dark:hover:text-violet-300';

const NOTIFICATION_SEEN_KEY = 'webdrop-notifications-seen';

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

function getSeenRooms() {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(NOTIFICATION_SEEN_KEY) || '[]'
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatTime(timestamp) {
  if (!timestamp) return 'Recent room';

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return 'Recent room';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  const {
    connected,
    navLocked,
    recentRooms = [],
    rejoinRoom,
    removeRecentRoom,
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
  const [seenRooms, setSeenRooms] = useState(() => getSeenRooms());

  const headerRef = useRef(null);
  const statusRef = useRef(null);
  const notificationRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const bars = net.online ? net.bars : 0;

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

  /* Lock body scroll when notifications is open on mobile */
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
      'Transfer in progress',
      'Finish or cancel your current transfer before navigating away.'
    );
  };

  const handleCopyRoom = useCallback(async () => {
    if (!roomCode) return;

    try {
      await copyText(roomCode);
      setCopied(true);
      toast.success('Room code copied', `${roomCode} is ready to share.`);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1800);
    } catch {
      toast.error('Copy failed', 'Please copy the room code manually.');
    }
  }, [roomCode]);

  const markNotificationsSeen = useCallback(() => {
    const codes = recentRooms.map((room) => room.roomCode);

    setSeenRooms(codes);

    try {
      window.localStorage.setItem(
        NOTIFICATION_SEEN_KEY,
        JSON.stringify(codes)
      );
    } catch {
      // Notifications remain usable for this session.
    }
  }, [recentRooms]);

  const unreadCount = recentRooms.filter(
    (room) => !seenRooms.includes(room.roomCode)
  ).length;

  const handleNotificationsToggle = () => {
    const nextOpen = !notificationsOpen;

    setNotificationsOpen(nextOpen);
    setStatusOpen(false);

    if (nextOpen) {
      refreshRecentRooms?.();
      markNotificationsSeen();
    }
  };

  const handleRejoin = async (targetCode) => {
    if (!targetCode || typeof rejoinRoom !== 'function') {
      toast.error(
        'Rejoin unavailable',
        'Room rejoining is not configured yet.'
      );
      return;
    }

    if (!connected) {
      toast.error(
        'Server offline',
        'Connect to the signaling server before rejoining.'
      );
      return;
    }

    setJoiningCode(targetCode);

    try {
      const result = await rejoinRoom(targetCode);

      if (!result?.success) {
        toast.error(
          'Unable to rejoin',
          result?.message || 'The room may have expired or be full.'
        );
        return;
      }

      setNotificationsOpen(false);
      setMobileOpen(false);

      toast.success(
        'Room rejoined',
        `Reconnected to room ${result.roomCode || targetCode}.`
      );

      navigate(`/room/${result.roomCode || targetCode}`);
    } catch (error) {
      toast.error(
        'Rejoin failed',
        error?.message || 'Please try again.'
      );
    } finally {
      setJoiningCode('');
    }
  };

  const handleRemoveRecentRoom = (targetCode) => {
    if (typeof removeRecentRoom !== 'function') return;

    removeRecentRoom(targetCode);
    setSeenRooms((previous) =>
      previous.filter((code) => code !== targetCode)
    );
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
        Skip to content
      </a>

      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-3 sm:h-[68px] sm:gap-3 sm:px-5 lg:gap-4 lg:px-7 xl:px-9">
        <NavLink
          to="/"
          onClick={(event) => {
            guardClick(event);
            if (!navLocked) closeMobileMenu();
          }}
          aria-label="WebDrop home"
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
              WebDrop
            </span>
            <span className="mt-1.5 hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 sm:block">
              Drop. Connect. Transfer.
            </span>
          </span>
        </NavLink>

        <nav
          aria-label="Primary navigation"
          className="mx-auto hidden min-w-0 flex-1 items-center justify-center lg:flex"
        >
          <div className="flex min-w-0 items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 dark:border-white/[0.07] dark:bg-white/[0.025] xl:gap-1">
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
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
                {label}
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
                Room active
              </span>

              {roomCode && (
                <button
                  type="button"
                  onClick={handleCopyRoom}
                  title="Copy room code"
                  aria-label={`Copy room code ${roomCode}`}
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
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              title="Recent rooms and notifications"
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
                  aria-label="Notifications and recent rooms"
                  className={[
                    'fixed left-3 right-3 top-[72px] z-[70]',
                    'sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2',
                    'w-auto sm:w-[min(360px,calc(100vw-20px))]',
                    'max-h-[calc(100dvh-90px)] sm:max-h-none',
                    'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15',
                    'dark:border-white/[0.09] dark:bg-surface-card dark:shadow-black/40',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.025] sm:p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 dark:border-violet-400/15 dark:bg-violet-400/[0.08] sm:h-10 sm:w-10">
                      <Bell
                        className="h-4 w-4 text-violet-600 dark:text-violet-400 sm:h-5 sm:w-5"
                        strokeWidth={2.2}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white sm:text-sm">
                        Notifications
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-[11px]">
                        Your recently visited rooms
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => refreshRecentRooms?.()}
                      title="Refresh recent rooms"
                      aria-label="Refresh recent rooms"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-violet-300"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      aria-label="Close notifications"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700 sm:hidden dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {recentRooms.length === 0 ? (
                    <div className="px-5 py-8 text-center sm:py-9">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.03] sm:h-12 sm:w-12">
                        <Bell className="h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
                      </div>
                      <p className="mt-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">
                        No recent rooms
                      </p>
                      <p className="mx-auto mt-1.5 max-w-[230px] text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
                        Rooms you leave will appear here so you can try to rejoin them later.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[calc(100dvh-200px)] overflow-y-auto p-2 sm:max-h-[min(390px,65vh)]">
                      {recentRooms.map((room) => {
                        const isJoining = joiningCode === room.roomCode;

                        return (
                          <div
                            key={room.roomCode}
                            className="group rounded-xl p-2.5 transition-colors hover:bg-slate-50 sm:p-3 dark:hover:bg-white/[0.035]"
                          >
                            <div className="flex items-start gap-2.5 sm:gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-100 bg-violet-50 sm:h-9 sm:w-9 sm:rounded-xl dark:border-violet-400/10 dark:bg-violet-400/[0.07]">
                                <Clock3
                                  className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 sm:h-4 sm:w-4"
                                  strokeWidth={2.2}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-[12px] font-extrabold tracking-[0.12em] text-slate-900 dark:text-white sm:text-sm">
                                    {room.roomCode}
                                  </p>
                                  {!seenRooms.includes(room.roomCode) && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                  )}
                                </div>

                                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:mt-1">
                                  {room.role === 'host' ? 'Host room' : 'Guest room'}
                                  {' · '}
                                  {formatTime(room.at)}
                                </p>

                                <div className="mt-2 flex items-center gap-1.5 sm:mt-3 sm:gap-2">
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
                                    {isJoining ? 'Rejoining…' : 'Rejoin'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRecentRoom(room.roomCode)}
                                    title="Remove from recent rooms"
                                    aria-label={`Remove room ${room.roomCode} from recent rooms`}
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

                  <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-4 sm:py-3">
                    <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Rejoining works only while the room still exists and the server permits access.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Connection status — desktop only */}
          <div ref={statusRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setStatusOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              aria-haspopup="dialog"
              aria-expanded={statusOpen}
              aria-label="Open connection details"
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
                  {connected ? 'Server online' : 'Server offline'}
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
                aria-label="Connection details"
                className="absolute right-0 top-full z-[60] mt-2 w-[min(310px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/[0.09] dark:bg-surface-card dark:shadow-black/30"
              >
                <div className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.025]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 dark:border-violet-400/15 dark:bg-violet-400/[0.08]">
                      <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Connection overview
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Your current network status
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatusOpen(false)}
                      aria-label="Close connection details"
                      className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Signaling server
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
                      {connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Network type
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {renderNetworkIcon()}
                      <span className="truncate">{net.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Network quality
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {net.online ? net.quality : 'Unavailable'}
                    </span>
                  </div>

                  {typeof net.downlink === 'number' && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Gauge className="h-3.5 w-3.5" />
                        Estimated speed
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {net.downlink} Mbps
                      </span>
                    </div>
                  )}

                  {typeof net.rtt === 'number' && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Estimated latency
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
                        WebDrop transfers files directly between peers when possible. The signaling server helps devices discover and connect to each other.
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
              <span>Start transfer</span>
              <ArrowUpRight className="h-3 w-3 opacity-80" />
            </NavLink>
          )}

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={guardClick}
            aria-label="View WebDrop source on GitHub"
            title="View on GitHub"
            aria-disabled={navLocked || undefined}
            tabIndex={navLocked ? -1 : undefined}
            className={`${iconButton} hidden xl:inline-flex ${
              navLocked ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            <Github className="h-4 w-4" strokeWidth={2} />
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
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
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
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

      {/* Mobile / tablet panel — compact, fits screen */}
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
          {/* Compact status row */}
          {/* Status cards — modern rounded */}
<div className="mb-2.5 grid grid-cols-2 gap-2">
  {/* Server / Network card */}
  <div
    className={`relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border px-2.5 py-2.5 transition-colors ${
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
          Live
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
        Server
      </p>
      <p className="mt-0.5 truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">
        {connected ? net.label : 'Offline'}
      </p>
    </div>
  </div>

  {/* Room card */}
  <div
    className={`relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border px-2.5 py-2.5 transition-colors ${
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
          Active
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
        Room
      </p>
      <p className="mt-0.5 truncate text-[12px] font-bold text-slate-800 dark:text-slate-100">
        {navLocked ? 'Active' : 'Ready'}
      </p>
    </div>
  </div>
</div>

          {/* Nav links — compact */}
          <nav aria-label="Mobile navigation" className="space-y-0.5">
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
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
                  <span className="truncate">{label}</span>
                </span>

                {navLocked ? (
                  <Lock className="h-3 w-3 shrink-0 opacity-60" strokeWidth={2.2} />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-50" strokeWidth={2.2} />
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
                <span className="truncate">Source</span>
              </span>
              {navLocked ? (
                <Lock className="h-3 w-3 shrink-0 opacity-60" strokeWidth={2.2} />
              ) : (
                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-50" strokeWidth={2.2} />
              )}
            </a>
          </nav>

          {/* Compact footer */}
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2 dark:border-white/[0.07]">
            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              WebDrop
            </span>
            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
              Direct. Private. Fast.
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