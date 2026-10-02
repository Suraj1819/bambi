import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useMatch } from 'react-router-dom';
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

const iconBtn =
  'flex h-9 w-9 items-center justify-center rounded-xl border lg:h-10 lg:w-10 border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:text-white';

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { connected, navLocked } = useRoom();
  const location = useLocation();
  const net = useNetworkInfo();

  // Signaling down -> 0 bars, otherwise real estimated bars
  const bars = connected ? net.bars : 0;

  // /room/ABCDE  ->  "ABCDE"  (context par depend nahi karta)
  const roomMatch = useMatch('/room/:roomCode');
  const roomCode = roomMatch?.params?.roomCode?.toUpperCase() || '';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);

  const headerRef = useRef(null);
  const statusRef = useRef(null);

  /* Route change par menus band */
  useEffect(() => {
    setMobileOpen(false);
    setStatusOpen(false);
  }, [location.pathname]);

  /* Scroll par subtle shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Escape + bahar click par menus band */
  useEffect(() => {
    if (!mobileOpen && !statusOpen) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setStatusOpen(false);
      }
    };
    const onPointer = (e) => {
      if (mobileOpen && headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
      if (statusOpen && statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusOpen(false);
      }
    };

    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [mobileOpen, statusOpen]);

  const guardClick = (e) => {
    if (!navLocked) return;
    e.preventDefault();
    toast.warning(
      'Leave the room first',
      'Finish or cancel your transfer before navigating away.'
    );
  };

  const handleCopyRoom = useCallback(async () => {
    if (!roomCode) return;
    try {
      await copyText(roomCode);
      setCopied(true);
      toast.success('Copied', `Room code ${roomCode} copied.`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Copy failed', 'Please copy the code manually.');
    }
  }, [roomCode]);

  const statusTone = connected
    ? 'border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-50 dark:border-emerald-500/15 dark:bg-emerald-500/[0.06] dark:hover:bg-emerald-500/10'
    : 'border-red-200/80 bg-red-50/70 hover:bg-red-50 dark:border-red-500/15 dark:bg-red-500/[0.06] dark:hover:bg-red-500/10';

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-xl transition-shadow duration-300 dark:border-white/[0.06] dark:bg-surface/90 ${
        scrolled ? 'shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]' : ''
      }`}
    >
      {/* Accessibility: keyboard users ke liye skip link (page me <main id="main-content"> chahiye) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-purple-600 focus:px-3 focus:py-2 focus:text-[12px] focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* ================= MAIN BAR ================= */}
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[68px] lg:gap-4 lg:px-8 xl:px-10">
        {/* Brand */}
        <NavLink
          to="/"
          onClick={guardClick}
          aria-label="WebDrop home"
          aria-disabled={navLocked || undefined}
          className={`group flex shrink-0 items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 ${
            navLocked ? 'cursor-not-allowed opacity-60' : ''
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:border-slate-300 group-hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:group-hover:border-white/[0.14]">
            <img src={logo} alt="" className="h-7 w-7 object-contain" />
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
              WebDrop
            </span>
            <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 lg:block">
              Peer-to-peer transfer
            </span>
          </div>
        </NavLink>

        {/* Desktop navigation */}
        <nav
          aria-label="Primary"
          className="hidden min-w-0 items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 dark:border-white/[0.06] dark:bg-white/[0.025] md:flex lg:gap-1"
        >
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={guardClick}
              aria-disabled={navLocked || undefined}
              tabIndex={navLocked ? -1 : undefined}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-200 focus:outline-none lg:px-4 lg:py-2 lg:text-[12px] focus-visible:ring-2 focus-visible:ring-purple-500/40 ${
                  navLocked
                    ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                    : isActive
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70 dark:bg-white/[0.09] dark:text-white dark:ring-white/[0.06]'
                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
          {/* Room chip: room code + copy (sirf room me) */}
          {navLocked && (
            <div className="hidden items-center gap-1 rounded-xl border border-amber-200/80 bg-amber-50/80 py-1.5 pl-3 pr-1.5 dark:border-amber-500/15 dark:bg-amber-500/[0.07] sm:flex">
              <Lock
                className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                strokeWidth={2.4}
              />

              <div className="mx-1.5 hidden leading-none xl:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                  Room active
                </p>
                <p className="mt-1 text-[10px] font-medium text-amber-700/70 dark:text-amber-400/70">
                  Navigation locked
                </p>
              </div>

              {roomCode && (
                <button
                  type="button"
                  onClick={handleCopyRoom}
                  title="Copy room code"
                  aria-label={`Copy room code ${roomCode}`}
                  className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-mono text-[12px] font-bold tracking-[0.12em] text-amber-700 shadow-sm transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:bg-white/[0.06] dark:text-amber-300 dark:hover:bg-white/10"
                >
                  {roomCode}
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
                  ) : (
                    <Copy className="h-3 w-3 opacity-60" strokeWidth={2.4} />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Server / network status + details popover */}
          <div ref={statusRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setStatusOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={statusOpen}
              aria-label="Connection details"
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-300 focus:outline-none lg:py-2 xl:px-3 focus-visible:ring-2 focus-visible:ring-purple-500/40 ${statusTone}`}
            >
              <div className="relative flex h-5 w-5 items-center justify-center">
                {connected ? (
                  <span className="absolute -inset-1 animate-[signalGlow_2s_ease-in-out_infinite] rounded-full bg-emerald-400/10" />
                ) : (
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-400/10" />
                )}
                <NetworkSignalIcon
                  kind={net.kind}
                  bars={bars}
                  className={`relative h-4 w-4 ${
                    connected ? signalTone(bars) : 'text-red-500 dark:text-red-400'
                  }`}
                  strokeWidth={2.3}
                />
              </div>

              <div className="hidden text-left leading-none xl:block">
                <p
                  className={`text-[9px] font-bold uppercase tracking-[0.14em] ${
                    connected
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {connected ? 'Connected' : 'Offline'}
                </p>
                <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {connected ? `${net.label} · ${net.quality}` : 'Signaling server'}
                </p>
              </div>
            </button>

            {statusOpen && (
              <div
                role="dialog"
                aria-label="Connection details"
                className="absolute right-0 top-full z-50 mt-2 w-[min(270px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 dark:border-white/[0.08] dark:bg-surface-card"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Connection
                </p>

                <dl className="mt-2 divide-y divide-slate-100 text-[12px] dark:divide-white/[0.06]">
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-slate-500 dark:text-slate-400">Signaling server</dt>
                    <dd
                      className={`flex items-center gap-1.5 font-semibold ${
                        connected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          connected ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {connected ? 'Online' : 'Offline'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-slate-500 dark:text-slate-400">Network</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-100">
                      {net.label || '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-slate-500 dark:text-slate-400">Quality</dt>
                    <dd className="font-semibold capitalize text-slate-800 dark:text-slate-100">
                      {connected ? net.quality || '—' : '—'}
                    </dd>
                  </div>
                </dl>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  Files go directly between browsers. The server only helps them find each other.
                </p>
              </div>
            )}
          </div>

          <div className="hidden h-7 w-px bg-slate-200 dark:bg-white/[0.07] lg:block" />

          {/* Source */}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={guardClick}
            aria-label="View source on GitHub"
            aria-disabled={navLocked || undefined}
            tabIndex={navLocked ? -1 : undefined}
            title="Source on GitHub"
            className={`${iconBtn} hidden lg:flex ${
              navLocked ? 'cursor-not-allowed opacity-40 hover:bg-white dark:hover:bg-white/[0.025]' : ''
            }`}
          >
            <Github className="h-4 w-4" strokeWidth={2} />
          </a>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className={`group ${iconBtn}`}
          >
            <span className="transition-transform duration-300 group-hover:rotate-12">
              {isDark ? (
                <Sun className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={2} />
              )}
            </span>
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
            className={`${iconBtn} md:hidden`}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* ================= MOBILE NAV ================= */}
      <div
        id="mobile-nav"
        className={`overflow-hidden bg-white/95 backdrop-blur-xl transition-all duration-200 dark:bg-surface/95 md:hidden ${
          mobileOpen
            ? 'max-h-[560px] border-t border-slate-200/70 opacity-100 dark:border-white/[0.06]'
            : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <nav aria-label="Mobile" className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6">
          {/* Status cards */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                connected
                  ? 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/15 dark:bg-emerald-500/[0.06]'
                  : 'border-red-200/80 bg-red-50/70 dark:border-red-500/15 dark:bg-red-500/[0.06]'
              }`}
            >
              <NetworkSignalIcon
                kind={net.kind}
                bars={bars}
                className={`h-4 w-4 ${
                  connected ? signalTone(bars) : 'text-red-500 dark:text-red-400'
                }`}
                strokeWidth={2.2}
              />
              <div className="leading-none">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Server
                </p>
                <p
                  className={`mt-1 text-[11px] font-semibold ${
                    connected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {connected ? net.label : 'Offline'}
                </p>
              </div>
            </div>

            {navLocked && roomCode ? (
              <button
                type="button"
                onClick={handleCopyRoom}
                aria-label={`Copy room code ${roomCode}`}
                className="flex items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-left dark:border-amber-500/15 dark:bg-amber-500/[0.06]"
              >
                <Lock className="h-4 w-4 text-amber-500" strokeWidth={2.2} />
                <div className="min-w-0 flex-1 leading-none">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Room · tap to copy
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[12px] font-bold tracking-[0.12em] text-amber-600 dark:text-amber-400">
                    {roomCode}
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
                    ) : (
                      <Copy className="h-3 w-3 opacity-60" strokeWidth={2.4} />
                    )}
                  </p>
                </div>
              </button>
            ) : (
              <div
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                  navLocked
                    ? 'border-amber-200/80 bg-amber-50/70 dark:border-amber-500/15 dark:bg-amber-500/[0.06]'
                    : 'border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.025]'
                }`}
              >
                <Lock
                  className={`h-4 w-4 ${navLocked ? 'text-amber-500' : 'text-slate-400'}`}
                  strokeWidth={2.2}
                />
                <div className="leading-none">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Room
                  </p>
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      navLocked
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {navLocked ? 'Active' : 'Ready'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="space-y-1">
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-[13px] font-semibold transition-all sm:py-2.5 ${
                    navLocked
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                      : isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.07] dark:text-white'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                  }`
                }
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" strokeWidth={2.1} />
                  {label}
                </span>

                {navLocked ? (
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600"
                    strokeWidth={2}
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
              tabIndex={navLocked ? -1 : undefined}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-[13px] font-semibold transition-all ${
                navLocked
                  ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Github className="h-4 w-4" strokeWidth={2.1} />
                Source
              </span>
              {navLocked ? (
                <Lock className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600"
                  strokeWidth={2}
                />
              )}
            </a>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              WebDrop
            </span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Direct. Private. Fast.
            </span>
          </div>
        </nav>
      </div>

      <style>{`
        @keyframes signalGlow {
          0%, 100% { transform: scale(0.7); opacity: 0.15; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          header * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </header>
  );
}