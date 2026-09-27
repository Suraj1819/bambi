import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ============================================================
   GLOBAL TOAST STORE
============================================================ */
let listeners = [];
let toasts = [];
let nextId = 1;

// FIX: cap how many toasts can stack at once so a burst of actions
// (e.g. several quick copies, or rapid connect/disconnect events)
// can't pile up an endless column down the screen. Oldest gets
// dropped first — dismissToast is safe to call on an id that's
// already gone, so this can never double-fire or throw.
const MAX_VISIBLE_TOASTS = 4;

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function pushToast({ type = 'info', title, message, duration = 4000 }) {
  const id = nextId++;
  const t = { id, type, title, message, duration };
  toasts.push(t);

  if (toasts.length > MAX_VISIBLE_TOASTS) {
    toasts = toasts.slice(toasts.length - MAX_VISIBLE_TOASTS);
  }

  emit();

  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts() {
  const [state, setState] = useState(toasts);
  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);
  return state;
}

export const toast = {
  success: (title, message) => pushToast({ type: 'success', title, message }),
  error: (title, message) => pushToast({ type: 'error', title, message }),
  info: (title, message) => pushToast({ type: 'info', title, message }),
  warning: (title, message) => pushToast({ type: 'warning', title, message }),
};

/* ============================================================
   STYLES
============================================================ */
const TYPE_STYLES = {
  success: {
    border: 'border-emerald-200 dark:border-emerald-500/20',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconBg: 'bg-emerald-500',
    titleColor: 'text-emerald-900 dark:text-emerald-300',
    msgColor: 'text-emerald-700 dark:text-emerald-400',
    barColor: 'bg-emerald-500/70',
    Icon: CheckCircle,
  },
  error: {
    border: 'border-red-200 dark:border-red-500/20',
    bg: 'bg-red-50 dark:bg-red-500/10',
    iconBg: 'bg-red-500',
    titleColor: 'text-red-900 dark:text-red-300',
    msgColor: 'text-red-700 dark:text-red-400',
    barColor: 'bg-red-500/70',
    Icon: AlertCircle,
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-500/20',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    iconBg: 'bg-amber-500',
    titleColor: 'text-amber-900 dark:text-amber-300',
    msgColor: 'text-amber-700 dark:text-amber-400',
    barColor: 'bg-amber-500/70',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-purple-200 dark:border-purple-500/20',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    iconBg: 'bg-purple-500',
    titleColor: 'text-purple-900 dark:text-purple-300',
    msgColor: 'text-purple-700 dark:text-purple-400',
    barColor: 'bg-purple-500/70',
    Icon: Info,
  },
};

/* ============================================================
   TOAST ITEM
============================================================ */
function ToastItem({ toast: t, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const styles = TYPE_STYLES[t.type] || TYPE_STYLES.info;
  const { Icon } = styles;

  // FIX: hover-to-pause. Track how much time is actually left rather
  // than just re-arming a fresh full-length timer, so hovering
  // repeatedly can't extend a toast's life indefinitely or cut it
  // unexpectedly short.
  const remainingRef = useRef(t.duration);
  const segmentStartRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(enterTimer);
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setVisible(false);
    setTimeout(() => onDismiss(t.id), 220);
  };

  useEffect(() => {
    if (t.duration <= 0) return; // duration 0 = sticky, no auto-dismiss
    if (paused || leaving) return;

    segmentStartRef.current = Date.now();
    timerRef.current = setTimeout(handleClose, remainingRef.current);

    return () => {
      clearTimeout(timerRef.current);
      if (segmentStartRef.current != null) {
        const elapsed = Date.now() - segmentStartRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, leaving]);

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`toast-progress-host pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-lg shadow-black/5 backdrop-blur-sm transition-all duration-300 ease-out dark:shadow-black/20 ${
        visible && !leaving
          ? 'translate-y-0 scale-100 opacity-100'
          : 'translate-y-2 scale-95 opacity-0'
      }`}
    >
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}
      >
        <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        {t.title && (
          <p className={`text-[14px] font-semibold leading-snug ${styles.titleColor}`}>
            {t.title}
          </p>
        )}
        {t.message && (
          <p className={`mt-0.5 break-words text-[13px] leading-snug ${styles.msgColor}`}>
            {t.message}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
        aria-label="Dismiss notification"
        className={`${styles.msgColor} shrink-0 rounded-full p-0.5 transition-opacity hover:opacity-70`}
      >
        <X className="h-4 w-4" />
      </button>

      {/* Auto-dismiss progress bar — pauses on hover via CSS
          animation-play-state so it stays perfectly in sync with the
          actual JS timer above without a re-render every frame. */}
      {t.duration > 0 && (
        <div
          className={`toast-progress-bar absolute bottom-0 left-0 h-[3px] ${styles.barColor}`}
          style={{
            animationDuration: `${t.duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   CONTAINER
============================================================ */
export default function ToastContainer() {
  const items = useToasts();

  return (
    <>
      {/* Keyframes for the progress bar — defined once here since this
          project doesn't have a Tailwind config entry for it. */}
      <style>{`
        @keyframes webdrop-toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .toast-progress-bar {
          animation-name: webdrop-toast-shrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>

      {/*
        FIX: moved from top-right to bottom-right, per request.
        flex-col-reverse means the array's newest item (pushed last)
        renders visually closest to the screen corner, with older
        toasts stacking upward above it — the natural way bottom-
        anchored toasts behave (new ones appear at the anchor point,
        pushing earlier ones up rather than down off-screen).
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col-reverse items-stretch gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      >
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </>
  );
}