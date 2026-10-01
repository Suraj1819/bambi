import { Link } from 'react-router-dom';
import { Github, ArrowUpRight, Lock } from 'lucide-react';

import logo from '../../assets/images/Logo.png';
import { useRoom } from '../../context/RoomContext';
import { toast } from './ToastContainer';

export default function Footer() {
  const year = new Date().getFullYear();

  // navLocked = true jab tak user RoomPage me hai (sender ho ya receiver).
  // Navbar bhi yahi flag use karta hai.
  const { navLocked } = useRoom();

  const guardClick = (e) => {
    if (!navLocked) return;

    e.preventDefault();
    toast.warning(
      'Leave the room first',
      'Finish or cancel your transfer before navigating away.'
    );
  };

  // Har footer link ke liye common props (click block + a11y)
  const lockProps = {
    onClick: guardClick,
    'aria-disabled': navLocked || undefined,
    tabIndex: navLocked ? -1 : undefined,
  };

  const linkClass = `transition-colors duration-200 ${
    navLocked
      ? 'cursor-not-allowed opacity-40'
      : 'hover:text-slate-900 dark:hover:text-white'
  }`;

  return (
    <footer className="border-t border-slate-200/80 bg-white transition-colors dark:border-white/[0.06] dark:bg-surface">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-8 py-8 sm:py-9 lg:flex-row lg:items-center lg:justify-between">

          {/* BRAND */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="WebDrop home"
              {...lockProps}
              className={`group flex items-center gap-3 ${
                navLocked ? 'cursor-not-allowed opacity-60' : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <img
                  src={logo}
                  alt="WebDrop"
                  className={`h-9 w-9 object-contain transition-transform duration-200 ${
                    navLocked ? '' : 'group-hover:scale-[1.04]'
                  }`}
                />
              </div>

              <div>
                <p className="text-[15px] font-bold leading-none tracking-[-0.025em] text-slate-900 dark:text-white">
                  WebDrop
                </p>

                <p className="mt-1.5 text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                  Direct peer-to-peer file transfer
                </p>
              </div>
            </Link>
          </div>

          {/* NAVIGATION */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12px] font-medium text-slate-500 dark:text-slate-400"
          >
            <Link to="/" {...lockProps} className={linkClass}>
              Overview
            </Link>

            <Link to="/create" {...lockProps} className={linkClass}>
              Create room
            </Link>

            <Link to="/join" {...lockProps} className={linkClass}>
              Join room
            </Link>

            <a
              href="https://github.com/Suraj1819/web-drop"
              target="_blank"
              rel="noopener noreferrer"
              {...lockProps}
              className={`group flex items-center gap-1.5 ${linkClass}`}
            >
              <Github className="h-3.5 w-3.5" strokeWidth={1.9} />

              <span>Source</span>

              {!navLocked && (
                <ArrowUpRight
                  className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                  strokeWidth={2}
                />
              )}
            </a>

            {navLocked && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Lock className="h-3 w-3" strokeWidth={2.4} />
                Locked in room
              </span>
            )}
          </nav>

          {/* COPYRIGHT */}
          <div className="flex flex-col gap-1 lg:items-end">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              © {year} WebDrop
            </p>

            <p className="text-[10px] text-slate-400 dark:text-slate-600">
              Files never touch our servers.
            </p>
          </div>
        </div>

        {/* BOTTOM LINE */}
        <div className="border-t border-slate-100 py-4 dark:border-white/[0.05]">
          <div className="flex flex-col gap-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Peer-to-peer transfer</span>

            <span>WebRTC · DTLS · Socket.IO</span>
          </div>
        </div>
      </div>
    </footer>
  );
}