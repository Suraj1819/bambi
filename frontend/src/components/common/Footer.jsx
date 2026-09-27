import { Link } from 'react-router-dom';
import { Radio, Github } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/70 bg-white/60 transition-colors dark:border-surface-border dark:bg-surface/60">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
            <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[14px] font-bold tracking-tight text-slate-900 dark:text-white">
              WebDrop
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Browser-to-browser file transfer.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-slate-500 dark:text-slate-400">
          <Link to="/" className="transition-colors hover:text-slate-900 dark:hover:text-white">
            Overview
          </Link>
          <Link to="/create" className="transition-colors hover:text-slate-900 dark:hover:text-white">
            Create room
          </Link>
          <Link to="/join" className="transition-colors hover:text-slate-900 dark:hover:text-white">
            Join room
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            <Github className="h-3.5 w-3.5" strokeWidth={2} />
            Source
          </a>
        </div>

        <p className="text-[12px] text-slate-400 dark:text-slate-500">
          &copy; {year} WebDrop. Files never touch our servers.
        </p>
      </div>
    </footer>
  );
}
