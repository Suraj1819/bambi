import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FBFAFF] px-6 text-center transition-colors dark:bg-surface">
      <p className="font-heading text-[56px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[64px]">
        404
      </p>
      <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">This page doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-purple-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
