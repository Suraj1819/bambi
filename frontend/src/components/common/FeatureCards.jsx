import { Lock, Zap, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: Lock,
    title: 'Private by design',
    desc: 'Files never touch our servers. Direct browser-to-browser transfer means zero cloud storage and zero retention.',
  },
  {
    icon: Zap,
    title: 'Built for speed',
    desc: 'WebRTC DataChannel delivers native-speed transfers — no upload bottlenecks, no bandwidth caps.',
  },
  {
    icon: ShieldCheck,
    title: 'Encrypted in transit',
    desc: 'Every byte is protected by DTLS encryption. Peer-to-peer means the encryption is end-to-end.',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {FEATURES.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-sm dark:border-surface-border dark:bg-surface-card dark:hover:shadow-none sm:p-7"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
            <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" strokeWidth={2.2} />
          </div>
          <h3 className="mt-5 font-heading text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
            {desc}
          </p>
        </div>
      ))}
    </div>
  );
}
