import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function CopyButton({
  label = 'Copy',
  value,
  icon: Icon = Copy,
  fullWidth = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-surface-border dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 ${
        fullWidth ? 'w-full sm:w-auto' : ''
      }`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" strokeWidth={2.5} />
      ) : (
        <Icon className="h-4 w-4" strokeWidth={2} />
      )}
      {copied ? 'Copied!' : label}
    </button>
  );
}
