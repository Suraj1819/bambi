import { Cable } from 'lucide-react';

/** Text color that matches the number of bars */
export const signalTone = (bars) =>
  bars >= 3
    ? 'text-emerald-500 dark:text-emerald-400'
    : bars === 2
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-red-500 dark:text-red-400';

const DIM = 0.25;

/**
 * kind: 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none'
 * bars: 0-4
 *  - wifi     -> dot + 3 arcs
 *  - cellular -> 4 vertical bars (SIM style)
 *  - unknown  -> Wi-Fi icon (default)
 *  - none     -> Wi-Fi icon with a slash
 */
export default function NetworkSignalIcon({
  kind = 'unknown',
  bars = 0,
  className = 'h-4 w-4',
  strokeWidth = 2.2,
}) {
  if (kind === 'ethernet') {
    return (
      <Cable
        className={className}
        strokeWidth={strokeWidth}
        style={{ opacity: bars > 0 ? 1 : 0.45 }}
        aria-hidden="true"
      />
    );
  }

  const svgProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  };

  const fade = { transition: 'opacity 0.3s ease' };

  /* Wi-Fi (default when type is unknown, and used when there is no network) */
  if (kind === 'wifi' || kind === 'none' || kind === 'unknown') {
    return (
      <svg {...svgProps}>
        <path d="M12 20h.01" opacity={bars >= 1 ? 1 : DIM} style={fade} />
        <path d="M8.5 16.429a5 5 0 0 1 7 0" opacity={bars >= 2 ? 1 : DIM} style={fade} />
        <path d="M5 12.859a10 10 0 0 1 14 0" opacity={bars >= 3 ? 1 : DIM} style={fade} />
        <path d="M2 8.82a15 15 0 0 1 20 0" opacity={bars >= 4 ? 1 : DIM} style={fade} />
        {bars === 0 && <path d="m3 3 18 18" />}
      </svg>
    );
  }

  /* Cellular: SIM-style bars */
  const BAR_PATHS = ['M5 20v-4', 'M10 20v-8', 'M15 20V8', 'M20 20V4'];

  return (
    <svg {...svgProps}>
      {BAR_PATHS.map((d, i) => (
        <path key={d} d={d} opacity={bars >= i + 1 ? 1 : DIM} style={fade} />
      ))}
      {bars === 0 && <path d="m3 3 18 18" />}
    </svg>
  );
}