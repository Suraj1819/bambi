// src/components/common/Footer.jsx

import { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Github,
  Info,
  Lock,
  Network,
  ShieldCheck,
  Users,
  Sparkles,
  Zap,
  Globe,
  Heart,
  Activity,
  CircleDot,
} from 'lucide-react';

import logo from '../../assets/images/Logo.png';
import { useRoom } from '../../context/RoomContext';
import { toast } from './ToastContainer';

const REPO_URL = 'https://github.com/Suraj1819/web-drop';

export default function Footer() {
  const year = new Date().getFullYear();
  const { navLocked } = useRoom();
  const location = useLocation();
  const navigate = useNavigate();

  const guardClick = (e) => {
    if (!navLocked) return;

    e.preventDefault();

    toast.warning(
      'Leave the room first',
      'Finish or cancel your transfer before navigating away.'
    );
  };

  /**
   * Logo click handler:
   * - If already on "/", smooth scroll to top
   * - Otherwise, navigate to "/" (guarded when navLocked)
   */
  const handleLogoClick = useCallback(
    (e) => {
      if (navLocked) {
        e.preventDefault();
        toast.warning(
          'Leave the room first',
          'Finish or cancel your transfer before navigating away.'
        );
        return;
      }

      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Let Link navigate normally
        navigate('/');
      }
    },
    [location.pathname, navigate, navLocked]
  );

  const navClass = `
    group inline-flex items-center gap-1.5
    text-[12px] font-medium
    text-slate-500
    transition-colors duration-200
    dark:text-slate-400
    ${
      navLocked
        ? 'cursor-not-allowed opacity-40'
        : 'hover:text-violet-600 dark:hover:text-violet-400'
    }
  `;

  return (
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-white transition-colors dark:border-white/[0.06] dark:bg-surface">
      {/* =====================================================
          BACKGROUND ACCENTS
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-200/20 blur-3xl dark:bg-violet-500/[0.04]" />
        <div className="absolute -bottom-48 -left-40 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl dark:bg-indigo-500/[0.03]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* =====================================================
            MAIN FOOTER
        ===================================================== */}
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-12">
          {/* ===================================================
              BRAND
          =================================================== */}
          <div className="max-w-sm">
            <Link
              to="/"
              onClick={handleLogoClick}
              aria-label="WebDrop home — scroll to top"
              aria-disabled={navLocked || undefined}
              tabIndex={navLocked ? -1 : undefined}
              className={`group inline-flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                navLocked ? 'cursor-not-allowed opacity-60' : ''
              }`}
            >
              {/* Logo */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 shadow-sm shadow-violet-500/10 transition-all duration-300 group-hover:border-violet-200 group-hover:shadow-md group-hover:shadow-violet-500/20 dark:border-violet-500/15 dark:bg-violet-500/[0.08] dark:group-hover:border-violet-400/30">
                <img
                  src={logo}
                  alt="WebDrop"
                  className={`h-8 w-8 object-contain transition-transform duration-300 ${
                    navLocked ? '' : 'group-hover:scale-105'
                  }`}
                />

                {/* Live pulse dot when connected */}
                {!navLocked && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface" />
                  </span>
                )}
              </div>

              {/* Brand */}
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-heading text-[17px] font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white">
                  WebDrop
                </p>
                <p className="mt-1 text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                  Drop · Connect · Transfer
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-[340px] text-[12px] leading-6 text-slate-500 dark:text-slate-400">
              A browser-based peer-to-peer file transfer platform that lets
              devices connect directly and transfer files without central
              file storage.
            </p>

            {/* Trust badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/15 dark:bg-emerald-500/[0.07] dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
                Peer-to-peer
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 dark:border-violet-500/15 dark:bg-violet-500/[0.07] dark:text-violet-400">
                <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
                No storage
              </span>
            </div>
          </div>

          {/* ===================================================
              PRODUCT
          =================================================== */}
          <div>
            <p
              className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
              style={{ letterSpacing: '0.18em' }}
            >
              Product
            </p>

            <div className="mt-5 flex flex-col items-start gap-3.5">
              <Link
                to="/"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                <CircleDot className="h-3 w-3" strokeWidth={2.4} />
                Overview
              </Link>

              <Link
                to="/create"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                <Zap className="h-3 w-3" strokeWidth={2.4} />
                Create room
              </Link>

              <Link
                to="/join"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
                Join room
              </Link>

              <Link
                to="/about"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                <Info className="h-3.5 w-3.5" strokeWidth={2.2} />
                About WebDrop
              </Link>
            </div>
          </div>

          {/* ===================================================
              PROJECT
          =================================================== */}
          <div>
            <p
              className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
              style={{ letterSpacing: '0.18em' }}
            >
              Project
            </p>

            <div className="mt-5 flex flex-col items-start gap-3.5">
              <Link
                to="/team"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                <Users className="h-3.5 w-3.5" strokeWidth={2.2} />
                <span>Meet the team</span>
                {!navLocked && (
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                    strokeWidth={2.4}
                  />
                )}
              </Link>

              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                <Github className="h-3.5 w-3.5" strokeWidth={2.2} />
                <span>Source code</span>
                {!navLocked && (
                  <ArrowUpRight
                    className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                    strokeWidth={2.4}
                  />
                )}
              </a>

              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <Network
                  className="h-3.5 w-3.5 text-violet-500"
                  strokeWidth={2.2}
                />
                <span>WebRTC · Socket.IO</span>
              </div>
            </div>
          </div>

          {/* ===================================================
              STATUS
          =================================================== */}
          <div>
            <p
              className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
              style={{ letterSpacing: '0.18em' }}
            >
              Status
            </p>

            {/* Connection card */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#FAF9FF] to-white p-4 dark:border-white/[0.07] dark:from-white/[0.03] dark:to-white/[0.01]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <Activity className="h-4 w-4" strokeWidth={2.2} />
                </div>

                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    Direct peer transfer
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                    Signaling helps devices connect. File data travels
                    directly between peers.
                  </p>
                </div>
              </div>

              {/* Tech tags */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['WebRTC', 'DTLS', 'Socket.IO'].map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-violet-100 bg-violet-50/70 px-2 py-1 text-[9px] font-bold text-violet-700 dark:border-violet-500/15 dark:bg-violet-500/[0.08] dark:text-violet-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Room lock warning */}
            {navLocked && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/15 dark:bg-amber-500/[0.06]">
                <Lock
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                  strokeWidth={2.4}
                />

                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    Room navigation locked
                  </p>

                  <p className="mt-0.5 text-[9px] leading-relaxed text-amber-600/80 dark:text-amber-400/70">
                    Finish the current transfer to navigate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            DIVIDER
        ===================================================== */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/[0.06]" />

        {/* =====================================================
            BOTTOM FOOTER
        ===================================================== */}
        <div className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Copyright */}
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              © {year} WebDrop. Crafted with
              <Heart
                className="h-3 w-3 fill-rose-500 text-rose-500"
                strokeWidth={2}
              />
              for the web.
            </p>

            <p className="text-[9px] font-medium text-slate-400 dark:text-slate-600">
              Built as a Computer Science &amp; Engineering project.
            </p>
          </div>

          {/* Tech stack + status */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/[0.07] dark:text-emerald-400 dark:ring-emerald-500/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              React
            </span>

            <span className="text-slate-300 dark:text-slate-700">·</span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              WebRTC
            </span>

            <span className="text-slate-300 dark:text-slate-700">·</span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Socket.IO
            </span>

            <span className="text-slate-300 dark:text-slate-700">·</span>

            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              <Globe className="h-3 w-3" strokeWidth={2.4} />
              Worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}