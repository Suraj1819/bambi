import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

/* ============================================================
   GLOBAL TOAST STORE
============================================================ */
let listeners = [];
let toasts = [];
let nextId = 1;

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function pushToast({ type = 'info', title, message, duration = 4000 }) {
  const id = nextId++;
  const t = { id, type, title, message, duration };
  toasts.push(t);
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
    Icon: CheckCircle,
  },
  error: {
    border: 'border-red-200 dark:border-red-500/20',
    bg: 'bg-red-50 dark:bg-red-500/10',
    iconBg: 'bg-red-500',
    titleColor: 'text-red-900 dark:text-red-300',
    msgColor: 'text-red-700 dark:text-red-400',
    Icon: AlertCircle,
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-500/20',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    iconBg: 'bg-amber-500',
    titleColor: 'text-amber-900 dark:text-amber-300',
    msgColor: 'text-amber-700 dark:text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-purple-200 dark:border-purple-500/20',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    iconBg: 'bg-purple-500',
    titleColor: 'text-purple-900 dark:text-purple-300',
    msgColor: 'text-purple-700 dark:text-purple-400',
    Icon: Info,
  },
};

/* ============================================================
   TOAST ITEM
============================================================ */
function ToastItem({ toast: t, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const styles = TYPE_STYLES[t.type] || TYPE_STYLES.info;
  const { Icon } = styles;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onDismiss(t.id), 250);
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}
      >
        <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>

      <div className="min-w-0 flex-1">
        {t.title && (
          <p className={`text-[14px] font-semibold ${styles.titleColor}`}>
            {t.title}
          </p>
        )}
        {t.message && (
          <p className={`mt-0.5 break-words text-[13px] ${styles.msgColor}`}>
            {t.message}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
        aria-label="Dismiss notification"
        className={`${styles.msgColor} transition-opacity hover:opacity-70`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ============================================================
   CONTAINER
============================================================ */
export default function ToastContainer() {
  const items = useToasts();

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:top-20">
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
