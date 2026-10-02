import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Home,
  RefreshCw,
} from 'lucide-react';

import logo from '../assets/images/Logo.png';

export default function ErrorPage({ error }) {
  const handleReload = () => {
    window.location.reload();
  };

  const errorMessage =
    error?.message ||
    error?.statusText ||
    'An unexpected error occurred while loading this page.';

  return (
    <div
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-[#FBFAFF]
        px-5
        py-12
        dark:bg-[#09090F]
      "
    >
      {/* Background glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[500px]
          w-[500px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-purple-500/[0.055]
          blur-[130px]
          dark:bg-purple-500/[0.045]
        "
      />

      {/* Background grid */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.30]
          dark:opacity-[0.12]
        "
        style={{
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(148,163,184,0.10) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(148,163,184,0.10) 1px,
              transparent 1px
            )
          `,
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(circle at center, black 8%, transparent 72%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, black 8%, transparent 72%)',
        }}
      />

      {/* Top accent */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-px
          w-[min(760px,85%)]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-purple-400/25
          to-transparent
        "
      />

      {/* Decorative left node */}
      <div className="pointer-events-none absolute left-[10%] top-[28%] hidden md:block">
        <div className="relative">
          <div className="h-2 w-2 rounded-full bg-purple-400/40" />

          <div
            className="
              absolute
              left-1/2
              top-1/2
              h-8
              w-8
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              border
              border-purple-400/10
            "
          />
        </div>
      </div>

      {/* Decorative right node */}
      <div className="pointer-events-none absolute right-[11%] top-[34%] hidden md:block">
        <div className="relative">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-400/40 dark:bg-slate-500" />

          <div
            className="
              absolute
              left-1/2
              top-1/2
              h-7
              w-7
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              border
              border-slate-300/30
              dark:border-white/[0.06]
            "
          />
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 w-full max-w-[520px] text-center">
        {/* WebDrop logo */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src={logo}
            alt="WebDrop"
            className="
              h-10
              w-auto
              max-w-[150px]
              object-contain
              dark:brightness-110
            "
          />
        </div>

        {/* Status badge */}
        <div
          className="
            mx-auto
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-red-200/70
            bg-red-50/70
            px-3
            py-1.5
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.15em]
            text-red-500
            backdrop-blur-md
            dark:border-red-400/[0.12]
            dark:bg-red-400/[0.045]
            dark:text-red-400
          "
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
          Application error
        </div>

        {/* Error icon */}
        <div className="mt-7 flex justify-center">
          <div
            className="
              flex
              h-[68px]
              w-[68px]
              items-center
              justify-center
              rounded-[20px]
              border
              border-red-200/70
              bg-white/80
              text-red-500
              shadow-[0_12px_35px_rgba(239,68,68,0.08)]
              backdrop-blur-xl
              dark:border-red-400/[0.12]
              dark:bg-white/[0.035]
              dark:text-red-400
              dark:shadow-none
            "
          >
            <AlertTriangle
              className="h-7 w-7"
              strokeWidth={1.7}
            />
          </div>
        </div>

        {/* Heading */}
        <div className="mt-7">
          <h1
            className="
              font-heading
              text-[30px]
              font-bold
              leading-tight
              tracking-[-0.04em]
              text-slate-900
              sm:text-[38px]
              dark:text-white
            "
          >
            Something went wrong.
          </h1>

          <p
            className="
              mx-auto
              mt-3
              max-w-[420px]
              text-[13px]
              leading-6
              text-slate-500
              sm:text-sm
              dark:text-slate-400
            "
          >
            We couldn't load this page correctly.
            Please try again or return to WebDrop.
          </p>
        </div>

        {/* Error details */}
        <div
          className="
            mx-auto
            mt-7
            max-w-[480px]
            overflow-hidden
            rounded-2xl
            border
            border-slate-200/80
            bg-white/65
            text-left
            shadow-[0_8px_30px_rgba(15,23,42,0.04)]
            backdrop-blur-xl
            dark:border-white/[0.08]
            dark:bg-white/[0.03]
            dark:shadow-none
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200/70
              px-4
              py-2.5
              dark:border-white/[0.07]
            "
          >
            <span
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.13em]
                text-slate-400
                dark:text-slate-500
              "
            >
              Error details
            </span>

            <span
              className="
                rounded-md
                bg-slate-100
                px-1.5
                py-0.5
                text-[9px]
                font-semibold
                uppercase
                tracking-wider
                text-slate-400
                dark:bg-white/[0.05]
                dark:text-slate-500
              "
            >
              Debug
            </span>
          </div>

          <pre
            className="
              max-h-[110px]
              overflow-auto
              whitespace-pre-wrap
              break-words
              px-4
              py-3.5
              font-mono
              text-[11px]
              leading-[18px]
              text-slate-600
              dark:text-slate-400
            "
          >
            {errorMessage}
          </pre>
        </div>

        {/* Actions */}
        <div
          className="
            mt-7
            flex
            flex-col
            items-center
            justify-center
            gap-2.5
            sm:flex-row
          "
        >
          <button
            type="button"
            onClick={handleReload}
            className="
              group
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-purple-600
              px-5
              text-[13px]
              font-semibold
              text-white
              shadow-lg
              shadow-purple-600/15
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-purple-700
              active:translate-y-0
              dark:bg-purple-500
              dark:hover:bg-purple-400
            "
          >
            <RefreshCw
              className="
                h-[15px]
                w-[15px]
                transition-transform
                duration-500
                group-hover:rotate-180
              "
              strokeWidth={2}
            />

            Try Again
          </button>

          <Link
            to="/"
            className="
              group
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white/70
              px-5
              text-[13px]
              font-semibold
              text-slate-600
              backdrop-blur-md
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:border-slate-300
              hover:bg-white
              hover:text-slate-900
              active:translate-y-0
              dark:border-white/[0.09]
              dark:bg-white/[0.035]
              dark:text-slate-300
              dark:hover:border-white/[0.15]
              dark:hover:bg-white/[0.06]
              dark:hover:text-white
            "
          >
            <Home
              className="h-[15px] w-[15px]"
              strokeWidth={1.9}
            />

            Back to Home

            <ArrowUpRight
              className="
                h-3.5
                w-3.5
                opacity-40
                transition-transform
                duration-200
                group-hover:-translate-y-0.5
                group-hover:translate-x-0.5
              "
            />
          </Link>
        </div>

        {/* Tagline */}
        <div
          className="
            mt-9
            flex
            items-center
            justify-center
            gap-2.5
            text-[10px]
            font-medium
            tracking-[0.08em]
            text-slate-400
            dark:text-slate-600
          "
        >
          <span className="h-px w-8 bg-slate-200 dark:bg-white/[0.06]" />

          Drop. Connect. Transfer.

          <span className="h-px w-8 bg-slate-200 dark:bg-white/[0.06]" />
        </div>
      </main>

      {/* Bottom accent */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-1/2
          h-px
          w-[min(900px,90%)]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-purple-300/20
          to-transparent
          dark:via-purple-400/10
        "
      />
    </div>
  );
}