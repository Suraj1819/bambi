import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Menu,
  X,
  Lock,
  ChevronDown,
} from 'lucide-react';

import logo from './Logo.png';
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

    toast.warning(
      'Leave the room first',
      'Finish or cancel your transfer before navigating away.'
    );
  };

  const closeMobileMenu = () => {
    if (!navLocked) {
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-surface/90">

      {/* Main Navbar */}
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* ========================================================= */}
        {/* BRAND */}
        {/* ========================================================= */}

        <NavLink
          to="/"
          onClick={(e) => {
            guardClick(e);
            closeMobileMenu();
          }}
          className={`group flex shrink-0 items-center gap-2.5 ${
            navLocked ? 'cursor-not-allowed opacity-60' : ''
          }`}
          aria-label="WebDrop home"
        >
          {/* Logo */}
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover:border-slate-300 group-hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:group-hover:border-white/[0.14]">
            <img
              src={logo}
              alt="WebDrop"
              className="h-7 w-7 object-contain"
            />
          </div>

          {/* Brand */}
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold tracking-[-0.03em] text-slate-900 dark:text-white">
              WebDrop
            </span>

            <span className="mt-1 hidden text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:block">
              Peer-to-peer transfer
            </span>
          </div>
        </NavLink>

        {/* ========================================================= */}
        {/* DESKTOP NAVIGATION */}
        {/* ========================================================= */}

        <nav className="hidden items-center rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 dark:border-white/[0.06] dark:bg-white/[0.025] md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={guardClick}
              className={({ isActive }) =>
                `relative rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200 ${
                  navLocked
                    ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                    : isActive
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70 dark:bg-white/[0.09] dark:text-white dark:ring-white/[0.06]'
                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* ========================================================= */}
        {/* RIGHT CONTROLS */}
        {/* ========================================================= */}

        <div className="flex items-center gap-2">

          {/* Room Status */}
          {navLocked && (
            <div className="hidden items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 dark:border-amber-500/15 dark:bg-amber-500/[0.07] sm:flex">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-500/10">
                <Lock
                  className="h-3 w-3 text-amber-600 dark:text-amber-400"
                  strokeWidth={2.5}
                />
              </div>

              <div className="leading-none">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                  Room active
                </p>

                <p className="mt-1 text-[9px] font-medium text-amber-700/70 dark:text-amber-400/70">
                  Navigation locked
                </p>
              </div>
            </div>
          )}

          {/* Server Status */}
          <div
            className={`hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex ${
              connected
                ? 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/15 dark:bg-emerald-500/[0.06]'
                : 'border-red-200/80 bg-red-50/70 dark:border-red-500/15 dark:bg-red-500/[0.06]'
            }`}
          >
            {/* Status dot */}
            <span className="relative flex h-2 w-2">
              {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              )}

              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  connected
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                }`}
              />
            </span>

            <div className="hidden lg:block leading-none">
              <p
                className={`text-[8px] font-bold uppercase tracking-[0.14em] ${
                  connected
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {connected ? 'Connected' : 'Offline'}
              </p>

              <p className="mt-1 text-[8px] font-medium text-slate-400 dark:text-slate-500">
                Signaling server
              </p>
            </div>

            {/* Compact icon on smaller screens */}
            <div className="lg:hidden">
              {connected ? (
                <Wifi
                  className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2.2}
                />
              ) : (
                <WifiOff
                  className="h-3.5 w-3.5 text-red-600 dark:text-red-400"
                  strokeWidth={2.2}
                />
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-7 w-px bg-slate-200 dark:bg-white/[0.07] sm:block" />

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <span className="transition-transform duration-300 group-hover:rotate-12">
              {isDark ? (
                <Sun
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              ) : (
                <Moon
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              )}
            </span>
          </button>

          {/* Mobile Menu */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-400 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:text-white md:hidden"
          >
            {mobileOpen ? (
              <X
                className="h-4 w-4"
                strokeWidth={2}
              />
            ) : (
              <Menu
                className="h-4 w-4"
                strokeWidth={2}
              />
            )}
          </button>
        </div>
      </div>

      {/* =========================================================== */}
      {/* MOBILE NAVIGATION */}
      {/* =========================================================== */}

      <div
        className={`overflow-hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl transition-all duration-200 dark:border-white/[0.06] dark:bg-surface/95 md:hidden ${
          mobileOpen
            ? 'max-h-[420px] opacity-100'
            : 'max-h-0 border-t-0 opacity-0'
        }`}
      >
        <nav className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6">

          {/* Mobile Status */}
          <div className="mb-3 grid grid-cols-2 gap-2">

            {/* Connection */}
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                connected
                  ? 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/15 dark:bg-emerald-500/[0.06]'
                  : 'border-red-200/80 bg-red-50/70 dark:border-red-500/15 dark:bg-red-500/[0.06]'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connected
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                }`}
              />

              <div className="leading-none">
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Server
                </p>

                <p
                  className={`mt-1 text-[10px] font-semibold ${
                    connected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {connected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Room */}
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                navLocked
                  ? 'border-amber-200/80 bg-amber-50/70 dark:border-amber-500/15 dark:bg-amber-500/[0.06]'
                  : 'border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.025]'
              }`}
            >
              {navLocked ? (
                <Lock
                  className="h-3.5 w-3.5 text-amber-500"
                  strokeWidth={2.2}
                />
              ) : (
                <Wifi
                  className="h-3.5 w-3.5 text-slate-400"
                  strokeWidth={2}
                />
              )}

              <div className="leading-none">
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Room
                </p>

                <p
                  className={`mt-1 text-[10px] font-semibold ${
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
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={(e) => {
                  guardClick(e);

                  if (!navLocked) {
                    setMobileOpen(false);
                  }
                }}
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
                <span>{item.label}</span>

                {!navLocked && (
                  <ChevronDown
                    className="h-3.5 w-3.5 -rotate-90 text-slate-300 dark:text-slate-600"
                    strokeWidth={2}
                  />
                )}
              </NavLink>
            ))}
          </div>

          {/* Mobile Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
            <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              WebDrop
            </span>

            <span className="text-[8px] font-medium text-slate-400 dark:text-slate-500">
              Direct. Private. Fast.
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}