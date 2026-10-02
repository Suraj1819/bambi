import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  FileQuestion,
  Home,
  SearchX,
} from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-[#FBFAFF] px-6 py-16 transition-colors dark:bg-[#09090F]">
      {/* ======================================================
         BACKGROUND
      ====================================================== */}

      {/* Ambient glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[420px]
          w-[420px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-purple-500/[0.07]
          blur-[110px]
          dark:bg-purple-500/[0.06]
        "
      />

      {/* Grid */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.35]
          dark:opacity-[0.16]
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
          backgroundSize: '42px 42px',
          maskImage:
            'radial-gradient(circle at center, black 15%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, black 15%, transparent 75%)',
        }}
      />

      {/* Top subtle line */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-px
          w-[min(700px,80%)]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-purple-400/30
          to-transparent
        "
      />

      {/* ======================================================
         DECORATIVE ROUTE NODES
      ====================================================== */}

      <div className="pointer-events-none absolute left-[12%] top-[28%] hidden sm:block">
        <div className="relative">
          <div className="h-2 w-2 rounded-full bg-purple-400/50" />

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
              border-purple-400/10
            "
          />
        </div>
      </div>

      <div className="pointer-events-none absolute right-[14%] top-[35%] hidden sm:block">
        <div className="relative">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-400/50 dark:bg-slate-500" />

          <div
            className="
              absolute
              left-1/2
              top-1/2
              h-6
              w-6
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              border
              border-slate-300/40
              dark:border-white/[0.06]
            "
          />
        </div>
      </div>

      {/* ======================================================
         MAIN CONTENT
      ====================================================== */}

      <main className="relative z-10 mx-auto w-full max-w-2xl text-center">
        {/* Status badge */}
        <div
          className="
            mx-auto
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-purple-200/80
            bg-purple-50/70
            px-3
            py-1.5
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.14em]
            text-purple-600
            shadow-sm
            backdrop-blur-md
            dark:border-purple-400/[0.14]
            dark:bg-purple-400/[0.055]
            dark:text-purple-400
          "
        >
          <span className="relative flex h-2 w-2">
            <span
              className="
                absolute
                inline-flex
                h-full
                w-full
                animate-ping
                rounded-full
                bg-purple-400
                opacity-40
              "
            />

            <span
              className="
                relative
                inline-flex
                h-2
                w-2
                rounded-full
                bg-purple-500
              "
            />
          </span>

          Route unavailable
        </div>

        {/* 404 */}
        <div className="relative mt-7">
          <h1
            className="
              select-none
              text-[110px]
              font-black
              leading-[0.8]
              tracking-[-0.09em]
              text-slate-900
              sm:text-[170px]
              dark:text-white
            "
          >
            404
          </h1>

          {/* Broken route indicator */}
          <div className="mx-auto mt-7 flex max-w-[260px] items-center justify-center">
            <div
              className="
                h-px
                flex-1
                bg-gradient-to-r
                from-transparent
                to-slate-300
                dark:to-white/10
              "
            />

            <div
              className="
                mx-3
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                border
                border-purple-200/70
                bg-purple-50/70
                text-purple-500
                shadow-sm
                dark:border-purple-400/[0.12]
                dark:bg-purple-400/[0.05]
                dark:text-purple-400
              "
            >
              <SearchX
                className="h-4 w-4"
                strokeWidth={1.8}
              />
            </div>

            <div
              className="
                h-px
                flex-1
                bg-gradient-to-l
                from-transparent
                to-slate-300
                dark:to-white/10
              "
            />
          </div>
        </div>

        {/* Heading */}
        <div className="mt-8">
          <h2
            className="
              font-heading
              text-2xl
              font-bold
              tracking-[-0.025em]
              text-slate-900
              sm:text-[28px]
              dark:text-white
            "
          >
            This route doesn't exist.
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-md
              text-sm
              leading-6
              text-slate-500
              dark:text-slate-400
            "
          >
            The page you're looking for may have been
            moved, removed, or the URL may be incorrect.
          </p>
        </div>

        {/* ==================================================
           ROUTE INFO CARD
        ================================================== */}

        <div
          className="
            mx-auto
            mt-8
            flex
            max-w-md
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-200/80
            bg-white/70
            p-3
            text-left
            shadow-[0_8px_30px_rgba(15,23,42,0.05)]
            backdrop-blur-xl
            dark:border-white/[0.08]
            dark:bg-white/[0.035]
            dark:shadow-none
          "
        >
          {/* Icon */}
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-purple-50
              text-purple-500
              dark:bg-purple-400/[0.07]
              dark:text-purple-400
            "
          >
            <FileQuestion
              className="h-[18px] w-[18px]"
              strokeWidth={1.8}
            />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p
              className="
                text-[12px]
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              Page not found
            </p>

            <p
              className="
                mt-0.5
                text-[11px]
                leading-4
                text-slate-400
                dark:text-slate-500
              "
            >
              Check the address and try again.
            </p>
          </div>

          {/* Status */}
          <div
            className="
              hidden
              rounded-lg
              border
              border-purple-200/70
              bg-purple-50/50
              px-2
              py-1
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-purple-500
              sm:block
              dark:border-purple-400/[0.10]
              dark:bg-purple-400/[0.04]
              dark:text-purple-400
            "
          >
            404
          </div>
        </div>

        {/* ==================================================
           ACTIONS
        ================================================== */}

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
          {/* Primary: Back to Home */}
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
              bg-purple-600
              px-5
              text-[13px]
              font-semibold
              text-white
              shadow-lg
              shadow-purple-600/20
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-purple-700
              hover:shadow-xl
              hover:shadow-purple-600/25
              active:translate-y-0
              dark:bg-purple-500
              dark:shadow-purple-500/15
              dark:hover:bg-purple-400
              dark:hover:shadow-purple-500/20
            "
          >
            <Home
              className="h-4 w-4"
              strokeWidth={2}
            />

            Back to Home

            <ArrowUpRight
              className="
                h-3.5
                w-3.5
                opacity-60
                transition-transform
                duration-200
                group-hover:-translate-y-0.5
                group-hover:translate-x-0.5
              "
            />
          </Link>

          {/* Secondary: Go Back */}
          <button
            type="button"
            onClick={handleGoBack}
            className="
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-purple-200/80
              bg-white/70
              px-5
              text-[13px]
              font-semibold
              text-purple-600
              shadow-[0_1px_2px_rgba(15,23,42,0.03)]
              backdrop-blur-md
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:border-purple-300
              hover:bg-purple-50/70
              hover:text-purple-700
              active:translate-y-0
              dark:border-purple-400/[0.14]
              dark:bg-white/[0.035]
              dark:text-purple-300
              dark:hover:border-purple-400/25
              dark:hover:bg-purple-400/[0.07]
              dark:hover:text-purple-200
            "
          >
            <ArrowLeft
              className="h-4 w-4"
              strokeWidth={1.9}
            />

            Go Back
          </button>
        </div>

        {/* Brand */}
        <div
          className="
            mt-8
            flex
            items-center
            justify-center
            gap-2
            text-[11px]
            font-medium
            tracking-wide
            text-slate-400
            dark:text-slate-600
          "
        >
          <span
            className="
              h-px
              w-8
              bg-slate-200
              dark:bg-white/[0.06]
            "
          />

          WebDrop

          <span
            className="
              h-px
              w-8
              bg-slate-200
              dark:bg-white/[0.06]
            "
          />
        </div>
      </main>

      {/* ======================================================
         BOTTOM DECORATIVE LINE
      ====================================================== */}

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
          via-purple-200
          to-transparent
          dark:via-purple-400/[0.08]
        "
      />
    </div>
  );
}