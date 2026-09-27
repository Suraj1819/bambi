import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, Hash } from 'lucide-react';
import { normalizeRoomCode, isValidRoomCode } from '../utils/generateRoomCode';
import { toast } from '../components/common/ToastContainer';
import { detectDevice } from '../utils/fileUtils';
import { addRecentRoom, getRecentRooms } from '../context/RoomContext';

export default function JoinRoomPage() {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [deviceName] = useState(() => detectDevice());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const urlCode = searchParams.get('room') || searchParams.get('code');
    if (urlCode) {
      const cleaned = normalizeRoomCode(urlCode);
      if (isValidRoomCode(cleaned)) {
        setCode(cleaned);
        toast.info('Room code detected', `Code ${cleaned} prefilled.`);
      } else {
        toast.warning('Invalid code', 'Please enter the code manually.');
      }
    }
  }, []); // eslint-disable-line

  const handleChange = (e) => {
    const cleaned = normalizeRoomCode(e.target.value);
    setCode(cleaned);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidRoomCode(code)) {
      setError('Please enter a valid 5-character code.');
      return;
    }
    setJoining(true);
    addRecentRoom(code, 'guest');
    navigate(`/room/${code}`);
  };

  const recentRooms = getRecentRooms();

  return (
    <div className="min-h-screen bg-[#FBFAFF] transition-colors dark:bg-surface">
      <div className="mx-auto w-full max-w-[680px] px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <p
          className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400"
          style={{ letterSpacing: '0.24em' }}
        >
          Inbound Transfer
        </p>

        <h1 className="mt-5 font-heading text-[34px] font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-[56px]">
          Join a private room
        </h1>

        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[16px]">
          Enter the five-character code from the sending device, or use the QR
          link you were given.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-surface-border dark:bg-surface-card dark:shadow-none sm:mt-12 sm:p-9"
        >
          <p
            className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400"
            style={{ letterSpacing: '0.24em' }}
          >
            Room Code
          </p>

          <div className="relative mt-5">
            <Hash className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
            <input
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="X7K92"
              maxLength={5}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Room code"
              className="h-[76px] w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-14 text-center text-[28px] font-bold tracking-[0.4em] text-slate-900 caret-purple-600 placeholder:text-slate-300 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 dark:border-surface-border dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-purple-400 dark:focus:ring-purple-400/10 sm:h-[86px] sm:text-[34px] sm:tracking-[0.45em] lg:text-[38px]"
            />
            {code.length > 0 && code.length < 5 && (
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {code.length}/5
              </span>
            )}
          </div>

          <p className="mt-4 text-[13px] text-slate-500 dark:text-slate-400 sm:text-[14px]">
            Characters are uppercase. O, 0, I and 1 are not used.
          </p>

          {error && (
            <p className="mt-3 text-[13px] font-medium text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={joining || code.length !== 5}
            className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 text-[16px] font-semibold text-white shadow-glow transition-all hover:bg-purple-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-purple-400 disabled:shadow-none"
          >
            {joining ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                Connect to peer
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        {recentRooms.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
            <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500" style={{ letterSpacing: '0.2em' }}>
              Recent rooms (this device only)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recentRooms.map((r) => (
                <button
                  key={r.roomCode + r.at}
                  type="button"
                  onClick={() => navigate(`/room/${r.roomCode}`)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <span className="font-mono tracking-widest">{r.roomCode}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">{r.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-[14px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← Back to overview
          </button>

          <div className="hidden items-center gap-1.5 text-[14px] text-slate-500 dark:text-slate-400 sm:flex">
            <span className="text-[16px] leading-none">⇌</span>
            <span>No account required</span>
          </div>
        </div>

        <p className="mt-10 text-center text-[14px] text-slate-500 dark:text-slate-400">
          Joining as{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{deviceName}</span>
        </p>
      </div>
    </div>
  );
}
