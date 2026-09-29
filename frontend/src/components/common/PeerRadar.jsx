import {
  Wifi,
  Signal,
  Zap,
  Loader2,
  ShieldCheck,
  UserX,
  Search,
} from 'lucide-react';

/**
 * PeerRadar
 * - Peer nahi mila  -> radar sweep + scanning ripples + "Searching for devices…"
 * - Peer mila       -> radar slow ho jata hai, device node + full details card
 * - Data channel open -> "Connected", packets animation
 */
export default function PeerRadar({
  role,
  peer,
  peerVisible,
  peerReveal, // 'idle' | 'listening' | 'fetching' | 'ready'
  connected,
  connectionState, // 'waiting' | 'establishing' | 'connected'
  deviceName,
  deviceInfo,
  YouIcon,
  PeerIcon,
  onKickPeer,
}) {
  const searching = !peerVisible;
  const fetching = peerReveal === 'fetching' && !peerVisible;

  const peerTone = connected
    ? {
        border: 'border-emerald-200 dark:border-emerald-500/20',
        text: 'text-emerald-500',
        dot: 'bg-emerald-500',
      }
    : {
        border: 'border-amber-200 dark:border-amber-500/20',
        text: 'text-amber-500',
        dot: 'bg-amber-500',
      };

  const peerRole = role === 'host' ? 'Guest' : role === 'guest' ? 'Host' : 'Peer';

  const detailRows = peerVisible
    ? [
        { label: 'Device', value: peer?.deviceName || 'Peer' },
        { label: 'OS', value: peer?.deviceInfo?.os || '—' },
        { label: 'Browser', value: peer?.deviceInfo?.browser || '—' },
        { label: 'Role', value: peerRole },
      ]
    : [];

  return (
    <div>
      {/* ======================= RADAR ======================= */}
      <div className="relative mt-5 h-[275px] overflow-hidden rounded-2xl border border-slate-100 bg-[#FAF9FF] dark:border-white/[0.06] dark:bg-[#101018]">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-50 dark:opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Circles + sweep */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute -left-[105px] -top-[105px] h-[210px] w-[210px] rounded-full border border-purple-200/50 dark:border-purple-400/10" />
          <div className="absolute -left-[78px] -top-[78px] h-[156px] w-[156px] rounded-full border border-purple-200/60 dark:border-purple-400/15" />
          <div className="absolute -left-[48px] -top-[48px] h-[96px] w-[96px] rounded-full border border-purple-200/70 dark:border-purple-400/20" />

          {/* Sweep: search ke time tez, connect hone ke baad slow */}
          <div
            className="absolute -left-[105px] -top-[105px] h-[210px] w-[210px] rounded-full"
            style={{
              background: connected
                ? 'conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.14) 25deg, transparent 55deg)'
                : 'conic-gradient(from 0deg, transparent 0deg, rgba(124,58,237,0.22) 30deg, transparent 65deg)',
              animation: `prRadarSpin ${searching ? '2.6s' : '7s'} linear infinite`,
            }}
          />
        </div>

        {/* Search ripples (sirf jab tak device nahi mila) */}
        {searching && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {[0, 0.9, 1.8].map((delay) => (
              <span
                key={delay}
                className="absolute -left-[105px] -top-[105px] h-[210px] w-[210px] rounded-full border-2 border-purple-400/40"
                style={{ animation: `prSearchRipple 2.7s ease-out ${delay}s infinite` }}
              />
            ))}
          </div>
        )}

        {/* Connection paths */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 500 275"
          preserveAspectRatio="none"
        >
          {/* You -> center */}
          <path
            d="M 95 88 Q 185 100 250 137"
            fill="none"
            stroke="rgba(124,58,237,0.28)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          {/* center -> peer (sirf peer milne par) */}
          {peerVisible && (
            <path
              d="M 405 174 Q 330 155 250 137"
              fill="none"
              stroke={connected ? 'rgba(16,185,129,0.55)' : 'rgba(245,158,11,0.5)'}
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          )}
        </svg>

        {/* Central node */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute -inset-8 rounded-full border border-purple-400/10" />
          <div
            className="absolute -inset-12 rounded-full border border-purple-400/10"
            style={{ animation: 'prNetworkPulse 2.5s ease-out infinite' }}
          />
          <div className="relative flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_10px_30px_rgba(124,58,237,0.35)]">
            {searching ? (
              <Search className="h-7 w-7 text-white" strokeWidth={2} />
            ) : (
              <Wifi className="h-7 w-7 text-white" strokeWidth={2} />
            )}
            <span
              className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-[#101018] ${
                searching ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>
          <div className="absolute left-1/2 top-[68px] -translate-x-1/2 whitespace-nowrap rounded-full border border-purple-200/70 bg-white/90 px-2.5 py-1 backdrop-blur dark:border-purple-400/10 dark:bg-slate-900/80">
            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-400">
              {searching ? 'Scanning…' : 'WebRTC Node'}
            </span>
          </div>
        </div>

        {/* YOU node */}
        <div className="absolute left-[12%] top-[24%] flex flex-col items-center">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-purple-200 bg-white shadow-sm dark:border-purple-400/20 dark:bg-slate-900">
            <YouIcon className="h-[18px] w-[18px] text-purple-600" strokeWidth={2} />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          </div>
          <span className="mt-1.5 max-w-[90px] truncate text-[8px] font-bold uppercase tracking-wider text-slate-400">
            You{role === 'host' ? ' · Host' : ''}
          </span>
        </div>

        {/* PEER placeholder while searching (ghost node) */}
        {searching && (
          <div className="absolute right-[11%] top-[53%] flex flex-col items-center opacity-70">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/60 dark:border-slate-600 dark:bg-slate-900/50"
              style={{ animation: 'prGhostPulse 1.6s ease-in-out infinite' }}
            >
              {fetching ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin text-amber-500" strokeWidth={2} />
              ) : (
                <span className="text-[16px] font-bold text-slate-300 dark:text-slate-600">?</span>
              )}
            </div>
            <span className="mt-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              {fetching ? 'Fetching device…' : 'Searching…'}
            </span>
          </div>
        )}

        {/* PEER node (connected/establishing) */}
        {peerVisible && (
          <div className="absolute right-[11%] top-[53%] flex flex-col items-center">
            <div
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${peerTone.border}`}
              style={{ animation: 'prPeerPop 0.4s ease-out' }}
            >
              <PeerIcon className={`h-[18px] w-[18px] ${peerTone.text}`} strokeWidth={2} />
              <span
                className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${peerTone.dot}`}
              />
            </div>
            <span className="mt-1.5 max-w-[100px] truncate text-[8px] font-bold uppercase tracking-wider text-slate-400">
              {peer?.deviceName || 'Peer'}
            </span>
          </div>
        )}

        {/* Packets (sirf connected) */}
        {connected && (
          <>
            <div className="absolute left-[28%] top-[36%] h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(124,58,237,0.8)]">
              <span
                className="absolute inset-0 rounded-full bg-purple-400"
                style={{ animation: 'prPacketMove 2s linear infinite' }}
              />
            </div>
            <div className="absolute left-[28%] top-[36%] h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]">
              <span
                className="absolute inset-0 rounded-full bg-emerald-400"
                style={{ animation: 'prPacketMove 2s linear 1s infinite' }}
              />
            </div>
          </>
        )}

        {/* Bottom status */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2 backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/80">
            <Signal
              className={`h-3.5 w-3.5 ${
                connected ? 'text-emerald-500' : searching ? 'text-slate-400' : 'text-amber-500'
              }`}
              strokeWidth={2}
            />
            <div>
              <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                Connection
              </p>
              <p
                className={`text-[9px] font-bold ${
                  connected ? 'text-emerald-500' : searching ? 'text-slate-400' : 'text-amber-500'
                }`}
              >
                {connected ? 'Connected' : connectionState === 'establishing' ? 'Establishing' : 'Searching'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2 backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/80">
            <Zap className="h-3.5 w-3.5 text-purple-500" strokeWidth={2.2} />
            <div>
              <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Route</p>
              <p className="text-[9px] font-bold text-purple-500">
                {connected ? 'Direct P2P' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= DEVICE DETAILS ======================= */}
      {searching ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 dark:border-surface-border dark:bg-white/[0.02]">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-purple-500" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              {fetching ? 'Device mil gaya, details fetch ho rahi hain…' : 'Nearby device search ho raha hai…'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              Dusre device par room code ya QR se join karwaiye.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`mt-4 rounded-xl border p-3 sm:p-4 ${
            connected
              ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
              : 'border-amber-100 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
          }`}
          style={{ animation: 'prPeerPop 0.4s ease-out' }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white dark:bg-slate-900 ${peerTone.border}`}
            >
              <PeerIcon className={`h-5 w-5 ${peerTone.text}`} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                {peer?.deviceName || 'Peer'}
              </p>
              <p
                className={`flex items-center gap-1 text-[11px] font-semibold ${
                  connected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {connected ? (
                  <ShieldCheck className="h-3 w-3" strokeWidth={2.4} />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
                )}
                {connected ? 'Connected · DTLS encrypted' : 'Establishing secure channel…'}
              </p>
            </div>
            {role === 'host' && (
              <button
                type="button"
                onClick={() => onKickPeer?.(peer.socketId)}
                title="Remove this device from the room"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20"
              >
                <UserX className="h-4 w-4" strokeWidth={2.4} />
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-slate-200/70 pt-3 dark:border-white/[0.06]">
            {detailRows.map((r) => (
              <div key={r.label} className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {r.label}
                </p>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                  {r.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= ANIMATIONS ======================= */}
      <style>{`
        @keyframes prRadarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes prNetworkPulse {
          0% { transform: scale(0.7); opacity: 0.7; }
          70% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes prSearchRipple {
          0% { transform: scale(0.15); opacity: 0.7; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes prGhostPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes prPeerPop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes prPacketMove {
          0% { transform: translate(0, 0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(190px, 35px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}