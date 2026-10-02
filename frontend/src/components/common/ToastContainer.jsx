import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ============================================================
   GLOBAL TOAST STORE
============================================================ */

let listeners = [];
let toasts = [];
let nextId = 1;

const MAX_VISIBLE_TOASTS = 4;

function emit() {
  listeners.forEach((listener) => {
    listener([...toasts]);
  });
}

export function pushToast({
  type = 'info',
  title,
  message,
  duration = 4000,
}) {
  const id = nextId++;

  const newToast = {
    id,
    type,
    title,
    message,
    duration,
  };

  toasts = [...toasts, newToast];

  if (toasts.length > MAX_VISIBLE_TOASTS) {
    toasts = toasts.slice(-MAX_VISIBLE_TOASTS);
  }

  emit();

  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter(
    (item) => item.id !== id
  );

  emit();
}

export function useToasts() {
  const [state, setState] = useState(toasts);

  useEffect(() => {
    listeners.push(setState);

    return () => {
      listeners = listeners.filter(
        (listener) => listener !== setState
      );
    };
  }, []);

  return state;
}

/* ============================================================
   TOAST API
============================================================ */

export const toast = {
  success: (title, message) =>
    pushToast({
      type: 'success',
      title,
      message,
    }),

  error: (title, message) =>
    pushToast({
      type: 'error',
      title,
      message,
    }),

  info: (title, message) =>
    pushToast({
      type: 'info',
      title,
      message,
    }),

  warning: (title, message) =>
    pushToast({
      type: 'warning',
      title,
      message,
    }),
};

/* ============================================================
   TOAST CONFIG
============================================================ */

const TOAST_CONFIG = {
  success: {
    Icon: CheckCircle2,
    icon:
      'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
  },

  error: {
    Icon: AlertCircle,
    icon:
      'bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
  },

  warning: {
    Icon: AlertTriangle,
    icon:
      'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  },

  info: {
    Icon: Info,
    icon:
      'bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  },
};

/* ============================================================
   TOAST ITEM
============================================================ */

function ToastItem({
  toast: item,
  onDismiss,
}) {
  const [visible, setVisible] =
    useState(false);

  const [leaving, setLeaving] =
    useState(false);

  const timerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const config =
    TOAST_CONFIG[item.type] ||
    TOAST_CONFIG.info;

  const { Icon } = config;

  /* ----------------------------------------------------------
     ENTER
  ---------------------------------------------------------- */

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => {
      cancelAnimationFrame(timer);
    };
  }, []);

  /* ----------------------------------------------------------
     AUTO DISMISS
  ---------------------------------------------------------- */

  useEffect(() => {
    if (item.duration <= 0) {
      return;
    }

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, item.duration);

    return () => {
      clearTimeout(timerRef.current);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------------------------------------------------
     DISMISS
  ---------------------------------------------------------- */

  const handleDismiss = () => {
    if (leaving) {
      return;
    }

    setLeaving(true);
    setVisible(false);

    closeTimerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, 180);
  };

  /* ----------------------------------------------------------
     CLEANUP
  ---------------------------------------------------------- */

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <div
      role={
        item.type === 'error'
          ? 'alert'
          : 'status'
      }
      aria-live={
        item.type === 'error'
          ? 'assertive'
          : 'polite'
      }
      className={`
        pointer-events-auto
        w-full
        overflow-hidden
        rounded-[18px]
        border
        border-slate-200/80
        bg-white/90
        shadow-[0_10px_30px_rgba(15,23,42,0.10),0_2px_8px_rgba(15,23,42,0.04)]
        backdrop-blur-xl
        transition-all
        duration-[180ms]
        ease-out
        dark:border-white/[0.09]
        dark:bg-[#111318]/90
        dark:shadow-[0_12px_35px_rgba(0,0,0,0.32)]
        ${
          visible && !leaving
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-[0.98] opacity-0'
        }
      `}
    >
      <div className="flex min-h-[68px] items-center px-3.5 py-3">
        {/* ==================================================
           ICON
        ================================================== */}

        <div
          className={`
            mr-3
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-[11px]
            ${config.icon}
          `}
        >
          <Icon
            className="h-[18px] w-[18px]"
            strokeWidth={2.1}
          />
        </div>

        {/* ==================================================
           CONTENT
        ================================================== */}

        <div className="min-w-0 flex-1">
          {item.title && (
            <div
              className="
                truncate
                text-[13px]
                font-semibold
                leading-[18px]
                tracking-[-0.01em]
                text-slate-900
                dark:text-slate-100
              "
            >
              {item.title}
            </div>
          )}

          {item.message && (
            <div
              className={`
                break-words
                text-[12.5px]
                leading-[18px]
                text-slate-500
                dark:text-slate-400
                ${
                  item.title
                    ? 'mt-[2px]'
                    : ''
                }
              `}
            >
              {item.message}
            </div>
          )}
        </div>

        {/* ==================================================
           CLOSE
        ================================================== */}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="
            ml-3
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-slate-400
            transition-colors
            duration-150
            hover:bg-slate-100
            hover:text-slate-700
            focus:outline-none
            focus:ring-2
            focus:ring-slate-300/50
            dark:text-slate-500
            dark:hover:bg-white/[0.07]
            dark:hover:text-slate-200
            dark:focus:ring-white/10
          "
        >
          <X
            className="h-3.5 w-3.5"
            strokeWidth={2}
          />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CONTAINER
============================================================ */

export default function ToastContainer() {
  const items = useToasts();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="
        pointer-events-none
        fixed
        bottom-4
        left-3
        right-3
        z-[9999]
        flex
        flex-col-reverse
        gap-2
        sm:bottom-5
        sm:left-auto
        sm:right-5
        sm:w-[370px]
      "
    >
      {items.map((item) => (
        <ToastItem
          key={item.id}
          toast={item}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}