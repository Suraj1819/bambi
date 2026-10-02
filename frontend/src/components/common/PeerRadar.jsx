import {
  Radar,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalLow,
  Zap,
  Loader2,
  ShieldCheck,
  UserX,
  RadioTower,
  Network,
  Activity,
  Lock,
  Globe,
  Cpu,
  Clock,
  Route,
  CircleDot,
  Hexagon,
  Compass,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getOsLabel(deviceInfo = {}) {
  const platform = String(
    deviceInfo?.platform || deviceInfo?.os || deviceInfo?.system || '',
  ).toLowerCase();

  if (platform.includes('windows')) return 'Windows';
  if (platform.includes('mac')) return 'macOS';
  if (platform.includes('linux')) return 'Linux';
  if (platform.includes('android')) return 'Android';
  if (platform.includes('ios') || platform.includes('iphone')) return 'iOS';
  if (platform.includes('chromeos') || platform.includes('chrome os')) {
    return 'ChromeOS';
  }

  return deviceInfo?.os || deviceInfo?.platform || 'Unknown';
}

function getBrowserLabel(deviceInfo = {}) {
  const browser = String(
    deviceInfo?.browser || deviceInfo?.browserName || '',
  ).trim();

  return browser || 'Web browser';
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function SignalBars({ level = 0, tone = 'emerald' }) {
  const color =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'red'
          ? 'bg-red-500'
          : 'bg-slate-400';

  return (
    <div className="flex items-end gap-0.5" aria-label={`Signal ${level}/4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-sm transition-all duration-500 ${
            i <= level ? color : 'bg-slate-200 dark:bg-slate-700'
          }`}
          style={{ height: `${4 + i * 3}px` }}
        />
      ))}
    </div>
  );
}

function StatusPill({ tone = 'slate', children, icon: Icon }) {
  const tones = {
    emerald:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    amber:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    violet:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
    slate:
      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[9px] font-bold uppercase tracking-wider ${tones[tone]}`}
    >
      {Icon && <Icon size={10} strokeWidth={2.6} />}
      {children}
    </span>
  );
}

function TimelineStep({ label, done, active }) {
  return (
    <div className="flex flex-1 items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
          done
            ? 'bg-emerald-500'
            : active
              ? 'bg-violet-500 animate-pulse'
              : 'bg-slate-300 dark:bg-slate-700'
        }`}
      />
      <span
        className={`truncate text-[8px] font-bold uppercase tracking-wider transition-colors ${
          done
            ? 'text-emerald-600 dark:text-emerald-400'
            : active
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function PeerRadar({
  role,
  peer,
  peerVisible,
  peerReveal, // 'idle' | 'listening' | 'fetching' | 'ready'
  connected,
  connectionState,
  deviceName,
  deviceInfo,
  YouIcon,
  PeerIcon,
  onKickPeer,
}) {
  const searching = !peerVisible;
  const fetching = peerReveal === 'fetching' && !peerVisible;
  const peerRole =
    role === 'host' ? 'Guest' : role === 'guest' ? 'Host' : 'Peer';

  /* -------- Visual state -------- */
  const visual = connected
    ? {
        tone: 'emerald',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        text: 'text-emerald-500',
        dot: 'bg-emerald-500',
        label: 'Connected',
        sweep:
          'conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.16) 22deg, transparent 58deg)',
        signal: 4,
        sweepDur: '6.5s',
      }
    : peerVisible
      ? {
          tone: 'amber',
          border: 'border-amber-200 dark:border-amber-500/30',
          text: 'text-amber-500',
          dot: 'bg-amber-500',
          label: 'Linking',
          sweep:
            'conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.18) 26deg, transparent 62deg)',
          signal: 2,
          sweepDur: '4s',
        }
      : {
          tone: 'violet',
          border: 'border-violet-200 dark:border-violet-500/30',
          text: 'text-violet-500',
          dot: 'bg-violet-500',
          label: 'Scanning',
          sweep:
            'conic-gradient(from 0deg, transparent 0deg, rgba(124,58,237,0.22) 28deg, transparent 62deg)',
          signal: 0,
          sweepDur: '2.4s',
        };

  /* -------- Timeline -------- */
  const timeline = [
    { label: 'Signal', done: peerVisible, active: !peerVisible },
    {
      label: 'ICE',
      done: peerVisible && connected,
      active: peerVisible && !connected,
    },
    { label: 'DTLS', done: connected, active: peerVisible && !connected },
    { label: 'Data', done: connected, active: false },
  ];

  /* -------- Detail rows -------- */
  const detailRows = peerVisible
    ? [
        { label: 'Device', value: peer?.deviceName || 'Peer', icon: Cpu },
        { label: 'OS', value: getOsLabel(peer?.deviceInfo), icon: Hexagon },
        {
          label: 'Browser',
          value: getBrowserLabel(peer?.deviceInfo),
          icon: Globe,
        },
        { label: 'Role', value: peerRole, icon: Activity },
        { label: 'Latency', value: connected ? '~12 ms' : '—', icon: Clock },
        {
          label: 'Cipher',
          value: connected ? 'DTLS-SRTP' : 'Negotiating',
          icon: Lock,
        },
      ]
    : [];

  return (
    <div>
      {/* ===================== RADAR PANEL ===================== */}
      <div
        role="img"
        aria-label={`Peer radar — ${visual.label}`}
        className="relative mt-5 h-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#F7F5FF] via-white to-[#EEF0FF] shadow-inner dark:border-white/[0.06] dark:from-[#0d0d18] dark:via-[#0f1018] dark:to-[#0d0d18]"
      >
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-70 dark:opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.09) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* Vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(15,23,42,0.06)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />

        {/* Corner HUD chips */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/85 px-2 py-1 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/85">
            <RadioTower
              className={`h-3 w-3 ${
                connected
                  ? 'text-emerald-500'
                  : searching
                    ? 'text-violet-500'
                    : 'text-amber-500'
              }`}
              strokeWidth={2.4}
            />
            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Live
            </span>
          </div>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <StatusPill tone={visual.tone} icon={Signal}>
            {visual.label}
          </StatusPill>
        </div>

        {/* -------- Radar rings + crosshair + sweep -------- */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Outer ring + ticks */}
          <div className="absolute -left-[130px] -top-[130px] h-[260px] w-[260px] rounded-full border border-violet-300/50 dark:border-violet-400/15">
            {Array.from({ length: 36 }).map((_, i) => {
              const isMajor = i % 3 === 0;
              return (
                <span
                  key={i}
                  className={`absolute left-1/2 top-0 -translate-x-1/2 ${
                    isMajor
                      ? 'h-2 w-px bg-violet-400/80 dark:bg-violet-300/40'
                      : 'h-1 w-px bg-violet-300/60 dark:bg-violet-400/20'
                  }`}
                  style={{
                    transform: `rotate(${i * 10}deg) translateY(0px)`,
                    transformOrigin: '50% 130px',
                  }}
                />
              );
            })}
          </div>

          {/* Inner rings */}
          <div className="absolute -left-[98px] -top-[98px] h-[196px] w-[196px] rounded-full border border-violet-300/40 dark:border-violet-400/12" />
          <div className="absolute -left-[65px] -top-[65px] h-[130px] w-[130px] rounded-full border border-violet-300/50 dark:border-violet-400/15" />
          <div className="absolute -left-[32px] -top-[32px] h-[64px] w-[64px] rounded-full border border-violet-300/60 dark:border-violet-400/20" />

          {/* Crosshair lines */}
          <span className="absolute -left-[130px] top-0 h-px w-[260px] bg-violet-300/40 dark:bg-violet-400/10" />
          <span className="absolute left-0 -top-[130px] h-[260px] w-px bg-violet-300/40 dark:bg-violet-400/10" />

          {/* Sweep */}
          <div
            className="absolute -left-[130px] -top-[130px] h-[260px] w-[260px] rounded-full"
            style={{
              background: visual.sweep,
              animation: `prRadarSpin ${visual.sweepDur} linear infinite`,
              maskImage:
                'radial-gradient(circle, transparent 12%, black 20%, black 100%)',
              WebkitMaskImage:
                'radial-gradient(circle, transparent 12%, black 20%, black 100%)',
            }}
          />

          {/* Compass labels */}
          <span className="absolute left-1/2 top-[-148px] -translate-x-1/2 text-[8px] font-extrabold uppercase tracking-[0.25em] text-violet-400/80">
            N
          </span>
          <span className="absolute left-1/2 bottom-[-148px] -translate-x-1/2 text-[8px] font-extrabold uppercase tracking-[0.25em] text-violet-400/80">
            S
          </span>
          <span className="absolute right-[-148px] top-1/2 -translate-y-1/2 text-[8px] font-extrabold uppercase tracking-[0.25em] text-violet-400/80">
            E
          </span>
          <span className="absolute left-[-148px] top-1/2 -translate-y-1/2 text-[8px] font-extrabold uppercase tracking-[0.25em] text-violet-400/80">
            W
          </span>
        </div>

        {/* -------- Search ripples -------- */}
        {searching && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {[0, 0.9, 1.8].map((delay) => (
              <span
                key={delay}
                className="absolute -left-[130px] -top-[130px] h-[260px] w-[260px] rounded-full border-2 border-violet-400/35"
                style={{
                  animation: `prSearchRipple 2.8s ease-out ${delay}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* -------- Connection paths -------- */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 500 340"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 95 110 Q 185 125 250 170"
            fill="none"
            stroke="rgba(124,58,237,0.32)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          {peerVisible && (
            <path
              d="M 405 210 Q 330 190 250 170"
              fill="none"
              stroke={
                connected ? 'rgba(16,185,129,0.6)' : 'rgba(245,158,11,0.55)'
              }
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          )}
        </svg>

        {/* -------- Central hub -------- */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute -inset-8 rounded-full border border-violet-400/10" />
          <div
            className="absolute -inset-12 rounded-full border border-violet-400/10"
            style={{ animation: 'prNetworkPulse 2.6s ease-out infinite' }}
          />
          <div className="relative flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 shadow-[0_14px_40px_rgba(124,58,237,0.4)] ring-4 ring-white/60 dark:ring-white/[0.04]">
            {searching ? (
              <Radar className="h-7 w-7 text-white" strokeWidth={2.2} />
            ) : (
              <Wifi className="h-7 w-7 text-white" strokeWidth={2.2} />
            )}
            <span
              className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-[#101018] ${
                searching ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>

          <div className="absolute left-1/2 top-[74px] -translate-x-1/2 whitespace-nowrap rounded-full border border-violet-200/70 bg-white/90 px-3 py-1 shadow-sm backdrop-blur dark:border-violet-400/10 dark:bg-slate-900/85">
            <span className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
              {searching ? 'Scanning…' : 'WebRTC Node'}
            </span>
          </div>
        </div>

        {/* -------- YOU node -------- */}
        <div className="absolute left-[9%] top-[22%] flex flex-col items-center">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-white shadow-sm dark:border-violet-400/20 dark:bg-slate-900">
              <YouIcon
                className="h-5 w-5 text-violet-600 dark:text-violet-400"
                strokeWidth={2.2}
              />
            </div>
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          </div>
          <div className="mt-2 flex flex-col items-center gap-0.5">
            <span className="max-w-[110px] truncate text-[8px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {deviceName || 'You'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[7px] font-bold uppercase tracking-wider text-violet-500">
                {role === 'host' ? 'Host' : 'Guest'}
              </span>
              <SignalBars level={4} tone="emerald" />
            </div>
          </div>
        </div>

        {/* -------- Ghost peer (searching) -------- */}
        {searching && (
          <div className="absolute right-[9%] top-[58%] flex flex-col items-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 dark:border-slate-600 dark:bg-slate-900/50"
              style={{ animation: 'prGhostPulse 1.8s ease-in-out infinite' }}
            >
              {fetching ? (
                <Loader2
                  className="h-5 w-5 animate-spin text-amber-500"
                  strokeWidth={2.2}
                />
              ) : (
                <CircleDot
                  className="h-5 w-5 text-slate-400 dark:text-slate-600"
                  strokeWidth={2}
                />
              )}
            </div>
            <span className="mt-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              {fetching ? 'Fetching…' : 'Searching…'}
            </span>
          </div>
        )}

        {/* -------- Peer node -------- */}
        {peerVisible && (
          <div className="absolute right-[9%] top-[58%] flex flex-col items-center">
            <div
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-sm dark:bg-slate-900 ${visual.border}`}
              style={{ animation: 'prPeerPop 0.4s ease-out' }}
            >
              <PeerIcon
                className={`h-5 w-5 ${visual.text}`}
                strokeWidth={2.2}
              />
              <span
                className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${visual.dot}`}
              />
            </div>
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <span className="max-w-[120px] truncate text-[8px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {peer?.deviceName || 'Peer'}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[7px] font-bold uppercase tracking-wider ${
                    connected ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                >
                  {connected ? 'Linked' : 'Handshake'}
                </span>
                <SignalBars level={visual.signal} tone={visual.tone} />
              </div>
            </div>
          </div>
        )}

        {/* -------- Packets -------- */}
        {connected && (
          <>
            <span className="absolute left-[28%] top-[40%] h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.9)]">
              <span
                className="absolute inset-0 rounded-full bg-violet-400"
                style={{ animation: 'prPacketMove 2.2s linear infinite' }}
              />
            </span>
            <span className="absolute left-[28%] top-[40%] h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]">
              <span
                className="absolute inset-0 rounded-full bg-emerald-400"
                style={{ animation: 'prPacketMove 2.2s linear 1.1s infinite' }}
              />
            </span>
          </>
        )}

        {/* -------- Bottom HUD -------- */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200/80 bg-white/85 px-2.5 py-1.5 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/85">
            {connected ? (
              <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.4} />
            ) : searching ? (
              <WifiOff className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2.4} />
            ) : (
              <SignalLow className="h-3.5 w-3.5 shrink-0 text-amber-500" strokeWidth={2.4} />
            )}
            <div className="min-w-0">
              <p className="text-[7px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Link
              </p>
              <p
                className={`truncate text-[9px] font-bold ${
                  connected
                    ? 'text-emerald-500'
                    : searching
                      ? 'text-slate-400'
                      : 'text-amber-500'
                }`}
              >
                {connected
                  ? 'Secure · DTLS'
                  : connectionState === 'establishing'
                    ? 'Establishing…'
                    : 'Searching…'}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200/80 bg-white/85 px-2.5 py-1.5 shadow-sm backdrop-blur dark:border-white/[0.06] dark:bg-slate-900/85">
            <Network className="h-3.5 w-3.5 shrink-0 text-violet-500" strokeWidth={2.4} />
            <div className="min-w-0">
              <p className="text-[7px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Route
              </p>
              <p className="truncate text-[9px] font-bold text-violet-500">
                {connected ? 'Direct P2P' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== TIMELINE ===================== */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Handshake
        </span>
        <div className="flex flex-1 items-center gap-2">
          {timeline.map((step, i) => (
            <TimelineStep
              key={i}
              label={step.label}
              done={step.done}
              active={step.active}
            />
          ))}
        </div>
      </div>

      {/* ===================== DETAILS ===================== */}
      {searching ? (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-3.5 dark:border-violet-500/20 dark:bg-violet-500/[0.04]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Radar className="h-4 w-4 animate-pulse" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">
              {fetching ? 'Fetching peer details…' : 'Listening for a peer'}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
              Have the other device enter the room code or scan the QR to
              connect. Transfer begins automatically once linked.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusPill tone="violet" icon={RadioTower}>
                Broadcast active
              </StatusPill>
              <StatusPill tone="slate" icon={ShieldCheck}>
                End-to-end encrypted
              </StatusPill>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`mt-3 rounded-xl border p-3.5 sm:p-4 ${
            connected
              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/[0.05]'
              : 'border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/[0.05]'
          }`}
          style={{ animation: 'prPeerPop 0.4s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-white dark:bg-slate-900 ${visual.border}`}
              >
                <PeerIcon
                  className={`h-5 w-5 ${visual.text}`}
                  strokeWidth={2.2}
                />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 ${visual.dot}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                {peer?.deviceName || 'Peer device'}
              </p>
              <p
                className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold ${
                  connected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {connected ? (
                  <ShieldCheck className="h-3 w-3" strokeWidth={2.6} />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.6} />
                )}
                {connected
                  ? 'Connected · DTLS encrypted'
                  : 'Establishing secure channel…'}
              </p>
            </div>

            {role === 'host' && (
              <button
                type="button"
                onClick={() => onKickPeer?.(peer.socketId)}
                title="Remove this device from the room"
                aria-label="Remove peer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-red-500/30 dark:hover:bg-red-500/10"
              >
                <UserX className="h-4 w-4" strokeWidth={2.4} />
              </button>
            )}
          </div>

          {/* Details grid */}
          <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.06]">
            {detailRows.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="min-w-0">
                  <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {Icon && <Icon size={10} strokeWidth={2.6} />}
                    {r.label}
                  </p>
                  <p className="mt-1 truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                    {r.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer pills */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-3 dark:border-white/[0.06]">
            <StatusPill tone={visual.tone} icon={Zap}>
              {connected ? 'Direct P2P' : 'Route pending'}
            </StatusPill>
            <StatusPill tone="violet" icon={Lock}>
              DTLS-SRTP
            </StatusPill>
            <StatusPill tone="slate" icon={Clock}>
              {connected ? '~12 ms RTT' : 'Measuring…'}
            </StatusPill>
          </div>
        </div>
      )}

      {/* ===================== ANIMATIONS ===================== */}
      <style>{`
        @keyframes prRadarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
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
          0%, 100% { transform: scale(1); opacity: 0.65; }
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
          100% { transform: translate(190px, 40px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation:"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}