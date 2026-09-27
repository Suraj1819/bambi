import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';
import { normalizeRoomCode } from '../utils/generateRoomCode';
import FeatureCards from '../components/common/FeatureCards';

export default function Home() {
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    setCreating(true);
    navigate('/create');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (code.length === 5) navigate(`/join?room=${code}`);
  };

  return (
    <div className="min-h-screen bg-[#FBFAFF] transition-colors dark:bg-surface">
      <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-purple-100 via-purple-50 to-transparent opacity-70 blur-2xl dark:from-purple-500/20 dark:via-purple-500/5 dark:opacity-100" />

            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
                <p
                  className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400"
                  style={{ letterSpacing: '0.22em' }}
                >
                  Secure browser relay online
                </p>
              </div>

              <h1 className="mt-8 font-heading text-[40px] font-extrabold leading-[0.95] tracking-tight text-slate-900 dark:text-white sm:text-[56px] lg:text-[72px] xl:text-[84px]">
                Drop.
                <br />
                <span className="text-purple-600 dark:text-purple-400">Connect.</span>
                <br />
                Transfer.
              </h1>

              <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[17px]">
                Direct device-to-device file sharing through your browser. Your
                files travel over an encrypted WebRTC DataChannel — never
                through our servers.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleCreateRoom}
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-glow transition-all hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Radio className="h-5 w-5" strokeWidth={2.2} />
                  {creating ? 'Creating…' : 'Create secure room'}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>

                <button
                  onClick={() => navigate('/join')}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Join with a code
                </button>
              </div>

              <div
                className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
                style={{ letterSpacing: '0.22em' }}
              >
                <span>WebRTC</span>
                <span>DTLS Encrypted</span>
                <span>0 MB Stored</span>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card sm:p-7">
              <p
                className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
                style={{ letterSpacing: '0.22em' }}
              >
                Live Topology
              </p>
              <h3 className="mt-2 font-heading text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
                Peer radar
              </h3>

              <div className="relative mt-5 h-[210px] overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/70 to-purple-50/40 dark:border-surface-border dark:from-white/[0.02] dark:to-purple-500/5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute h-[60px] w-[60px] rounded-full border border-purple-200/60 dark:border-purple-400/20" />
                  <div className="absolute h-[110px] w-[110px] rounded-full border border-purple-200/50 dark:border-purple-400/15" />
                  <div className="absolute h-[160px] w-[160px] rounded-full border border-purple-200/40 dark:border-purple-400/10" />
                  <div
                    className="absolute h-[160px] w-[160px] rounded-full bg-gradient-to-t from-purple-400/0 via-purple-400/0 to-purple-400/20 dark:to-purple-400/25"
                    style={{
                      clipPath: 'polygon(50% 50%, 50% 0%, 68% 4%)',
                      animation: 'radar 4s linear infinite',
                    }}
                  />
                </div>
                <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-600/30">
                  <Radio className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute left-[22%] top-[38%] h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]" />
                <div className="absolute right-[20%] top-[55%] h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.2)]" />
              </div>

              <p className="mt-5 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
                Room signaling discovers your second device. Once connected,
                the server steps out of the data path.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card sm:p-7">
              <p
                className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500"
                style={{ letterSpacing: '0.22em' }}
              >
                Have a room code?
              </p>
              <h3 className="mt-2 font-heading text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
                Jump back in
              </h3>

              <form onSubmit={handleJoin} className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
                  placeholder="X7K92"
                  maxLength={5}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-semibold tracking-[0.15em] text-slate-900 placeholder:font-normal placeholder:tracking-[0.15em] placeholder:text-slate-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/15 dark:border-surface-border dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-purple-400 dark:focus:ring-purple-400/15"
                />
                <button
                  type="submit"
                  disabled={code.length !== 5}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition-all hover:bg-purple-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </form>

              <p className="mt-3 text-[13px] text-slate-400 dark:text-slate-500">
                Five characters · no account required
              </p>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-6 sm:mt-8">
          <FeatureCards />
        </div>
      </main>
    </div>
  );
}
