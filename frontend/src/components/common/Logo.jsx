import { Radio } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-[15px]' },
    md: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-[17px]' },
    lg: { box: 'h-12 w-12', icon: 'h-6 w-6', text: 'text-[20px]' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${s.box} items-center justify-center rounded-xl bg-purple-600 shadow-sm shadow-purple-600/20`}
      >
        <Radio className={`${s.icon} text-white`} strokeWidth={2.5} />
      </div>
      <span className={`${s.text} font-heading font-bold tracking-tight text-slate-900 dark:text-white`}>
        WebDrop<span className="text-purple-600 dark:text-purple-400">.</span>
      </span>
    </div>
  );
}
