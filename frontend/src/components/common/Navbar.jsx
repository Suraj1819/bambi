import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Wifi, WifiOff, Moon, Sun, Menu, X, Lock } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../../context/ThemeContext';
import { useRoom } from '../../context/RoomContext';
import { toast } from './ToastContainer';

const NAV_ITEMS = [
  { label: 'Overview', to: '/' },
  { label: 'Create room', to: '/create' },
  { label: 'Join room', to: '/join' },
];

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { connected, navLocked } = useRoom();
  const [mobileOpen, setMobileOpen] = useState(false);

  const guardClick = (e) => {
    if (!navLocked) return;
    e.preventDefault();
    toast.warning('Leave the room first', 'Finish or cancel your transfer before navigating away.');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md transition-colors dark:border-surface-border dark:bg-surface/85">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <NavLink
          to="/"
          className={`shrink-0 ${navLocked ? 'cursor-not-allowed opacity-60' : ''}`}
          onClick={(e) => {
            guardClick(e);
            if (!navLocked) setMobileOpen(false);
          }}
        >
          <Logo />
        </NavLink>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 p-1 dark:border-surface-border dark:bg-white/5 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={guardClick}
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors ${
                  navLocked
                    ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                    : isActive
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {navLocked && (
            <div className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex">
              <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400" style={{ letterSpacing: '0.12em' }}>
                In room
              </span>
            </div>
          )}
          <div
            className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 sm:flex ${
              connected
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                : 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10'
            }`}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
            )}
            <span
              className={`text-[10px] font-bold uppercase ${
                connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
              }`}
              style={{ letterSpacing: '0.12em' }}
            >
              {connected ? 'Server online' : 'Server offline'}
            </span>
          </div>

          <button
            type="button"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-surface-border dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {isDark ? (
              <Sun className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={2} />
            )}
          </button>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-surface-border dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-surface-border dark:bg-surface/95 md:hidden">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={(e) => {
                  guardClick(e);
                  if (!navLocked) setMobileOpen(false);
                }}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors ${
                    navLocked
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                      : isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
