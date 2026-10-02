import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CopyButton({
  label = 'Copy',
  value,
  icon: Icon = Copy,
  fullWidth = false,
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!value) return;

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea =
          document.createElement('textarea');

        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand('copy');

        document.body.removeChild(textarea);
      }

      setCopied(true);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={copied}
      aria-label={copied ? 'Copied' : label}
      className={`
        group
        relative
        inline-flex
        h-10
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        border
        px-3.5
        text-[13px]
        font-medium
        tracking-[-0.01em]
        outline-none
        transition-all
        duration-200
        ease-out
        active:scale-[0.97]
        focus-visible:ring-2
        focus-visible:ring-slate-400/25

        ${
          copied
            ? `
              cursor-default
              border-emerald-500/20
              bg-emerald-500/[0.07]
              text-emerald-600
              dark:border-emerald-400/20
              dark:bg-emerald-400/[0.07]
              dark:text-emerald-400
            `
            : `
              border-slate-200/90
              bg-white/80
              text-slate-600
              shadow-[0_1px_2px_rgba(15,23,42,0.04)]
              backdrop-blur-md
              hover:border-slate-300
              hover:bg-white
              hover:text-slate-900
              hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)]
              dark:border-white/[0.10]
              dark:bg-white/[0.045]
              dark:text-slate-300
              dark:hover:border-white/[0.16]
              dark:hover:bg-white/[0.07]
              dark:hover:text-white
              dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)]
            `
        }

        ${
          fullWidth
            ? 'w-full sm:w-auto'
            : ''
        }
      `}
    >
      {/* Subtle hover surface */}

      {!copied && (
        <span
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-b
            from-white/30
            to-transparent
            opacity-0
            transition-opacity
            duration-200
            group-hover:opacity-100
            dark:from-white/[0.04]
          "
        />
      )}

      {/* Content */}

      <span
        className="
          relative
          flex
          items-center
          gap-2
        "
      >
        {copied ? (
          <Check
            className="h-[15px] w-[15px]"
            strokeWidth={2.5}
          />
        ) : (
          <Icon
            className="
              h-[15px]
              w-[15px]
              text-slate-500
              transition-colors
              duration-200
              group-hover:text-slate-700
              dark:text-slate-400
              dark:group-hover:text-slate-200
            "
            strokeWidth={2}
          />
        )}

        <span>
          {copied ? 'Copied' : label}
        </span>
      </span>
    </button>
  );
}