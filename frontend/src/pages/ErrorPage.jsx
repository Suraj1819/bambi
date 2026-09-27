import { Link } from 'react-router-dom';

export default function ErrorPage({ error }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FBFAFF] px-6 text-center transition-colors dark:bg-surface">
      <p className="font-heading text-[56px] font-extrabold tracking-tight text-red-500 dark:text-red-400 sm:text-[64px]">
        Oops
      </p>
      <p className="mt-2 max-w-md text-[15px] text-slate-500 dark:text-slate-400">
        Something went wrong. Please try reloading the page.
      </p>
      {error?.message && (
        <pre className="mt-4 max-w-md overflow-auto rounded-lg bg-slate-100 p-3 text-[11px] text-slate-700 dark:bg-white/5 dark:text-slate-300">
          {error.message}
        </pre>
      )}
      <Link
        to="/"
        className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-purple-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
