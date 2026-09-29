import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

import logo from '../../assets/images/Logo.png';
import { useTheme } from '../../context/ThemeContext';
import { useRoom } from '../../context/RoomContext';
import { toast } from './ToastContainer';
import NetworkSignalIcon, { signalTone } from './NetworkSignalIcon';
import useNetworkInfo from '../../hooks/useNetworkInfo';

const NAV_ITEMS = [
  { label: 'Overview', to: '/', icon: Home },
  { label: 'Create room', to: '/create', icon: PlusCircle },
  { label: 'Join room', to: '/join', icon: LogIn },
];

const iconBtn =
  'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:text-white';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { connected, navLocked } = useRoom();
  const location = useLocation();
  const net = useNetworkInfo();
  // Signaling down -> show 0 bars, otherwise real estimated bars
  const bars = connected ? net.bars : 0;

  const [mobileOpen, setMobileOpen] = useState(false);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* Close mobile menu on Escape */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const guardClick = (e) => {
    if (!navLocked) return;
    e.preventDefault();
    toast.warning(
      'Leave the room first',
      'Finish or cancel your transfer before navigating away.'
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-surface/90">
      {/* ================= MAIN BAR ================= */}
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Brand */}
        <NavLink
          to="/"
          onClick={guardClick}
          aria-label="WebDrop home"
          className={`group flex shrink-0 items-center gap-2.5 ${
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
            <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:block">
              Peer-to-peer transfer
            </span>
          </div>
        </NavLink>

        {/* Desktop navigation */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 dark:border-white/[0.06] dark:bg-white/[0.025] md:flex"
        >
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={guardClick}
              aria-disabled={navLocked}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200 ${
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
        <div className="flex items-center gap-2">
          {/* Room lock badge */}
          {navLocked && (
            <div className="hidden items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 dark:border-amber-500/15 dark:bg-amber-500/[0.07] sm:flex">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-500/10">
                <Lock
                  className="h-3 w-3 text-amber-600 dark:text-amber-400"
                  strokeWidth={2.5}
                />
              </div>
              <div className="hidden leading-none lg:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                  Room active
                </p>
                <p className="mt-1 text-[10px] font-medium text-amber-700/70 dark:text-amber-400/70">
                  Navigation locked
                </p>
              </div>
            </div>
          )}

          {/* Server status */}
          <div
            role="status"
            aria-live="polite"
            className={`hidden items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-300 sm:flex ${
              connected
                ? 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/15 dark:bg-emerald-500/[0.06]'
                : 'border-red-200/80 bg-red-50/70 dark:border-red-500/15 dark:bg-red-500/[0.06]'
            }`}
          >
            <div className="relative flex h-5 w-5 items-center justify-center">
              {connected ? (
                <span className="absolute -inset-1 rounded-full bg-emerald-400/10 animate-[signalGlow_2s_ease-in-out_infinite]" />
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

            <div className="hidden leading-none lg:block">
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
          </div>

          <div className="hidden h-7 w-px bg-slate-200 dark:bg-white/[0.07] sm:block" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
            ? 'max-h-[440px] border-t border-slate-200/70 opacity-100 dark:border-white/[0.06]'
            : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <nav
          aria-label="Mobile"
          className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6"
        >
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

            <div
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                navLocked
                  ? 'border-amber-200/80 bg-amber-50/70 dark:border-amber-500/15 dark:bg-amber-500/[0.06]'
                  : 'border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.025]'
              }`}
            >
              <Lock
                className={`h-4 w-4 ${
                  navLocked ? 'text-amber-500' : 'text-slate-400'
                }`}
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
          </div>

          {/* Links */}
          <div className="space-y-1">
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={guardClick}
                aria-disabled={navLocked}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-[13px] font-semibold transition-all ${
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

      {/* ================= ANIMATIONS ================= */}
      <style>{`
        @keyframes wifiOffline {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.65; }
          25% { transform: translateY(-2px) rotate(-4deg); opacity: 0.9; }
          50% { transform: translateY(2px) rotate(4deg); opacity: 0.65; }
          75% { transform: translateY(-2px) rotate(-3deg); opacity: 0.9; }
        }
        @keyframes wifiOnline {
          0%, 100% { transform: scale(0.92); opacity: 0.75; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes signalGlow {
          0%, 100% { transform: scale(0.7); opacity: 0.15; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          header * { animation: none !important; }
        }
      `}</style>
    </header>
  );
}