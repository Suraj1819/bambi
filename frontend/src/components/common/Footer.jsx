// src/components/common/Footer.jsx

import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Github,
  Info,
  Lock,
  Network,
  ShieldCheck,
  Users,
} from 'lucide-react';

import logo from '../../assets/images/Logo.png';
import { useRoom } from '../../context/RoomContext';
import { toast } from './ToastContainer';

const REPO_URL = 'https://github.com/Suraj1819/web-drop';

export default function Footer() {
  const year = new Date().getFullYear();
  const { navLocked } = useRoom();

  const guardClick = (e) => {
    if (!navLocked) return;

    e.preventDefault();

    toast.warning(
      'Leave the room first',
      'Finish or cancel your transfer before navigating away.'
    );
  };

  const navClass = `
    inline-flex items-center gap-1.5
    text-[12px] font-medium
    text-slate-500
    transition-all duration-200
    dark:text-slate-400
    ${
      navLocked
        ? 'cursor-not-allowed opacity-40'
        : 'hover:text-purple-600 dark:hover:text-purple-400'
    }
  `;

  return (
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-white transition-colors dark:border-white/[0.06] dark:bg-surface">

      {/* =====================================================
          BACKGROUND ACCENTS
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-purple-200/20 blur-3xl dark:bg-purple-500/[0.04]" />

        <div className="absolute -bottom-48 -left-40 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl dark:bg-indigo-500/[0.03]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* =====================================================
            MAIN FOOTER
        ===================================================== */}
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12">

          {/* ===================================================
              BRAND
          =================================================== */}
          <div className="max-w-sm">

            <Link
              to="/"
              onClick={guardClick}
              aria-label="WebDrop home"
              aria-disabled={navLocked || undefined}
              tabIndex={navLocked ? -1 : undefined}
              className={`group inline-flex items-center gap-3 ${
                navLocked
                  ? 'cursor-not-allowed opacity-60'
                  : ''
              }`}
            >
              {/* LOGO */}
              <div
                className="
                  relative flex h-11 w-11 shrink-0
                  items-center justify-center
                  rounded-xl
                  border border-purple-100
                  bg-purple-50
                  shadow-sm
                  shadow-purple-500/10
                  dark:border-purple-500/15
                  dark:bg-purple-500/[0.08]
                "
              >
                <img
                  src={logo}
                  alt="WebDrop"
                  className={`
                    h-8 w-8 object-contain
                    transition-transform duration-300
                    ${navLocked ? '' : 'group-hover:scale-105'}
                  `}
                />
              </div>

              {/* BRAND NAME */}
              <div>
                <p className="font-heading text-[17px] font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white">
                  WebDrop
                </p>

                <p className="mt-1 text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                  Drop. Connect. Transfer.
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-[330px] text-[12px] leading-6 text-slate-500 dark:text-slate-400">
              A browser-based peer-to-peer file transfer platform that lets
              devices connect directly and transfer files without central
              file storage.
            </p>

            {/* SECURITY BADGE */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 dark:border-emerald-500/15 dark:bg-emerald-500/[0.07]">
              <ShieldCheck
                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                strokeWidth={2.2}
              />

              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                Peer-to-peer · No file storage
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
                Overview
              </Link>

              <Link
                to="/create"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                Create room
              </Link>

              <Link
                to="/join"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                Join room
              </Link>

              <Link
                to="/about"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={navClass}
              >
                <Info
                  className="h-3.5 w-3.5"
                  strokeWidth={1.9}
                />

                About WebDrop
              </Link>
            </div>
          </div>

          {/* ===================================================
              TEAM
          =================================================== */}
          <div>
            <p
              className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
              style={{ letterSpacing: '0.18em' }}
            >
              Project
            </p>

            <div className="mt-5 flex flex-col items-start gap-3.5">

              {/* TEAM LINK */}
              <Link
                to="/team"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={`${navClass} group`}
              >
                <Users
                  className="h-3.5 w-3.5"
                  strokeWidth={1.9}
                />

                <span>Meet the team</span>

                {!navLocked && (
                  <ArrowUpRight
                    className="
                      h-3 w-3
                      opacity-0
                      transition-all duration-200
                      group-hover:-translate-y-0.5
                      group-hover:translate-x-0.5
                      group-hover:opacity-100
                    "
                    strokeWidth={2}
                  />
                )}
              </Link>

              {/* GITHUB */}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={guardClick}
                aria-disabled={navLocked || undefined}
                tabIndex={navLocked ? -1 : undefined}
                className={`${navClass} group`}
              >
                <Github
                  className="h-3.5 w-3.5"
                  strokeWidth={1.9}
                />

                <span>Source code</span>

                {!navLocked && (
                  <ArrowUpRight
                    className="
                      h-3 w-3
                      opacity-0
                      transition-all duration-200
                      group-hover:-translate-y-0.5
                      group-hover:translate-x-0.5
                      group-hover:opacity-100
                    "
                    strokeWidth={2}
                  />
                )}
              </a>

              {/* TECHNOLOGY */}
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <Network
                  className="h-3.5 w-3.5 text-purple-500"
                  strokeWidth={1.9}
                />

                <span>WebRTC · Socket.IO</span>
              </div>
            </div>
          </div>

          {/* ===================================================
              STATUS / CONNECTION
          =================================================== */}
          <div>
            <p
              className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
              style={{ letterSpacing: '0.18em' }}
            >
              WebDrop
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-[#FAF9FF] p-4 dark:border-surface-border dark:bg-white/[0.025]">

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  <Network
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
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

              {/* TECH TAGS */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['WebRTC', 'DTLS', 'Socket.IO'].map((item) => (
                  <span
                    key={item}
                    className="
                      rounded-md
                      border border-purple-100
                      bg-purple-50/70
                      px-2 py-1
                      text-[9px]
                      font-bold
                      text-purple-700
                      dark:border-purple-500/15
                      dark:bg-purple-500/[0.08]
                      dark:text-purple-300
                    "
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* ROOM LOCK */}
            {navLocked && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/15 dark:bg-amber-500/[0.06]">
                <Lock
                  className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                  strokeWidth={2.2}
                />

                <div>
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    Room navigation locked
                  </p>

                  <p className="mt-0.5 text-[9px] text-amber-600/80 dark:text-amber-400/70">
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
        <div className="h-px bg-slate-100 dark:bg-white/[0.05]" />

        {/* =====================================================
            BOTTOM FOOTER
        ===================================================== */}
        <div className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between">

          {/* COPYRIGHT */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              © {year} WebDrop. All rights reserved.
            </p>

            <p className="text-[9px] font-medium text-slate-400 dark:text-slate-600">
              Built as a Computer Science &amp; Engineering project.
            </p>
          </div>

          {/* TECH / STATUS */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

            <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Peer-to-peer
            </span>

            <span className="hidden h-3 w-px bg-slate-200 dark:bg-white/[0.07] sm:block" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600">
              React
            </span>

            <span className="text-[9px] text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600">
              WebRTC
            </span>

            <span className="text-[9px] text-slate-300 dark:text-slate-700">
              ·
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600">
              Socket.IO
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}