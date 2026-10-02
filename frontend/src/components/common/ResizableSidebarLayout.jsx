/**
 * ResizableSidebar
 * ------------------------------------------------------------------
 * Professional resizable + collapsible sidebar primitives for React.
 *
 * Inspired by the UX of VS Code, Linear, Figma, ChatGPT.
 *
 * Highlights
 *  - Pointer Events (mouse / touch / pen) with pointer capture
 *  - RAF-throttled width updates
 *  - Snap-to-default on release, double-click reset
 *  - Keyboard: ← → Home End Enter Space
 *  - Persists width + collapsed state (localStorage, SSR-safe)
 *  - Respects prefers-reduced-motion
 *  - Publishes `webdrop:sidebar-change` custom event
 *  - Fully accessible (role="separator" + ARIA + inert hidden content)
 *  - Zero external deps except `lucide-react`
 *
 * Usage
 * ------------------------------------------------------------------
 *   const sidebar = useSidebarController();
 *
 *   <SidebarProvider controller={sidebar}>
 *     <ResizableSidebarLayout sidebar={<MySidebar />}>
 *       <MyMain />
 *     </ResizableSidebarLayout>
 *   </SidebarProvider>
 *
 * Or, drop-in:
 *
 *   <ResizableSidebarLayout sidebar={<MySidebar />}>
 *     <MyMain />
 *   </ResizableSidebarLayout>
 */

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ========================================================================== */
/* Public constants                                                           */
/* ========================================================================== */

export const MIN_WIDTH = 240;
export const MAX_WIDTH = 640;
export const DEFAULT_WIDTH = 360;
export const KEYBOARD_STEP = 20;
export const SNAP_TOLERANCE = 6;

export const STORAGE_KEY_WIDTH = 'webdrop:sidebar-width';
export const STORAGE_KEY_COLLAPSED = 'webdrop:sidebar-collapsed';

export const DESKTOP_QUERY = '(min-width: 1280px)';
export const SIDEBAR_CHANGE_EVENT = 'webdrop:sidebar-change';

/* ========================================================================== */
/* Tiny internal utils                                                        */
/* ========================================================================== */

const isBrowser = typeof window !== 'undefined';

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};

const safeLocalStorage = {
  get(key) {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage blocked - silently ignore */
    }
  },
};

function readStoredWidth(min, max, fallback) {
  const raw = safeLocalStorage.get(STORAGE_KEY_WIDTH);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function readStoredCollapsed() {
  return safeLocalStorage.get(STORAGE_KEY_COLLAPSED) === 'true';
}

/* Match a media query, SSR-safe */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (!isBrowser || !window.matchMedia) return false;
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isBrowser || !window.matchMedia) return () => {};
    let mq;
    try {
      mq = window.matchMedia(query);
    } catch {
      return () => {};
    }
    const onChange = (event) => setMatches(event.matches);
    setMatches(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query]);

  return matches;
}

/* RAF-throttled scheduler */
function useRafThrottle() {
  const frameRef = useRef(0);
  const lastRef = useRef(null);

  const cancel = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  const schedule = useCallback((fn, arg) => {
    lastRef.current = arg;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      fn(lastRef.current);
    });
  }, []);

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}

/* Safe matchMedia-free global resize observer fallback for viewport clamp */
function useViewportWidth() {
  const [vw, setVw] = useState(() =>
    isBrowser ? window.innerWidth : 1440,
  );

  useEffect(() => {
    if (!isBrowser) return () => {};

    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVw(window.innerWidth);
      });
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return vw;
}

/* Fire a typed custom event with fallback */
function dispatchSidebarEvent(detail) {
  if (!isBrowser) return;
  try {
    window.dispatchEvent(new CustomEvent(SIDEBAR_CHANGE_EVENT, { detail }));
  } catch {
    /* CustomEvent not supported: ignore */
  }
}

/* ========================================================================== */
/* Hook: useSidebarController                                                 */
/* ========================================================================== */

/**
 * The core controller. Exposes state, bounds, and actions for the sidebar.
 *
 * @param {object} [options]
 * @param {number} [options.min]
 * @param {number} [options.max]
 * @param {number} [options.defaultWidth]
 * @param {number} [options.step]
 * @param {number} [options.snapTolerance]
 * @param {(width:number)=>void} [options.onResize]
 * @param {(collapsed:boolean)=>void} [options.onToggle]
 * @returns {SidebarController}
 */
export function useSidebarController({
  min = MIN_WIDTH,
  max = MAX_WIDTH,
  defaultWidth = DEFAULT_WIDTH,
  step = KEYBOARD_STEP,
  snapTolerance = SNAP_TOLERANCE,
  onResize,
  onToggle,
} = {}) {
  const [width, setWidth] = useState(() =>
    readStoredWidth(min, max, defaultWidth),
  );
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [isResizing, setIsResizing] = useState(false);

  /* Stable bounds ref — read inside listeners to avoid stale closures */
  const boundsRef = useRef({ min, max, defaultWidth, snapTolerance });
  useEffect(() => {
    boundsRef.current = { min, max, defaultWidth, snapTolerance };
  }, [min, max, defaultWidth, snapTolerance]);

  /* Fresh-value refs for the drag loop */
  const widthRef = useRef(width);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);
  const pointerIdRef = useRef(null);
  const isResizingRef = useRef(false);

  /* Stable callback refs (no dep churn) */
  const onResizeRef = useRef(onResize);
  const onToggleRef = useRef(onToggle);
  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);
  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  const { schedule, cancel } = useRafThrottle();

  /* ----- internal writer (single source of truth) ----- */
  const commitWidth = useCallback(
    (next, source = 'api') => {
      const { min: mn, max: mx } = boundsRef.current;
      const clamped = clamp(next, mn, mx);
      if (clamped === widthRef.current) return;
      widthRef.current = clamped;
      setWidth(clamped);
      onResizeRef.current?.(clamped);
      dispatchSidebarEvent({ width: clamped, collapsed: undefined, source });
    },
    [],
  );

  const commitCollapsed = useCallback(
    (next, source = 'api') => {
      setCollapsed((prev) => {
        if (prev === next) return prev;
        onToggleRef.current?.(next);
        dispatchSidebarEvent({
          width: widthRef.current,
          collapsed: next,
          source,
        });
        return next;
      });
    },
    [],
  );

  /* ----- public actions ----- */
  const setWidthSafe = useCallback(
    (value) => commitWidth(value, 'set'),
    [commitWidth],
  );

  const resetWidth = useCallback(() => {
    const { defaultWidth: def } = boundsRef.current;
    commitWidth(def, 'reset');
  }, [commitWidth]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      onToggleRef.current?.(next);
      dispatchSidebarEvent({
        width: widthRef.current,
        collapsed: next,
        source: 'toggle',
      });
      return next;
    });
  }, []);

  const expand = useCallback(() => commitCollapsed(false, 'expand'), [
    commitCollapsed,
  ]);
  const collapse = useCallback(() => commitCollapsed(true, 'collapse'), [
    commitCollapsed,
  ]);

  /* ----- persistence (width only when not dragging) ----- */
  useEffect(() => {
    if (isResizing) return;
    safeLocalStorage.set(STORAGE_KEY_WIDTH, String(width));
  }, [width, isResizing]);

  useEffect(() => {
    safeLocalStorage.set(STORAGE_KEY_COLLAPSED, String(collapsed));
  }, [collapsed]);

  /* ----- start resize (pointer events) ----- */
  const startResize = useCallback(
    (event) => {
      if (collapsed) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      /* Focus the handle so keyboard takes over seamlessly after drag */
      try {
        event.currentTarget.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }

      /* Capture the pointer so we get events even outside the window */
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        /* Safari < 13 - safe to ignore */
      }

      pointerIdRef.current = event.pointerId;
      startXRef.current = event.clientX;
      startWidthRef.current = widthRef.current;
      isResizingRef.current = true;
      setIsResizing(true);
    },
    [collapsed],
  );

  /* ----- global pointer listeners while dragging ----- */
  useEffect(() => {
    if (!isResizing) return () => {};

    /* Save current body styles so we can restore them */
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    const prevOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.documentElement.style.overscrollBehavior = 'contain';

    const handleMove = (event) => {
      if (
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }
      const delta = event.clientX - startXRef.current;
      const next = startWidthRef.current + delta;
      schedule(commitWidth, next);
    };

    const finish = (event) => {
      if (
        event &&
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      cancel();

      /* Snap to default if close enough */
      const { defaultWidth: def, snapTolerance: tol } = boundsRef.current;
      if (Math.abs(widthRef.current - def) <= tol) {
        commitWidth(def, 'snap');
      } else {
        /* Persist final width explicitly (RAF may have skipped) */
        safeLocalStorage.set(STORAGE_KEY_WIDTH, String(widthRef.current));
      }

      pointerIdRef.current = null;
      isResizingRef.current = false;
      setIsResizing(false);
    };

    const onPointerUp = (e) => finish(e);
    const onPointerCancel = (e) => finish(e);
    const onBlur = () => finish(null);

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('blur', onBlur);

      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      document.documentElement.style.overscrollBehavior = prevOverscroll;
    };
  }, [isResizing, commitWidth, schedule, cancel]);

  /* ----- keyboard support ----- */
  const handleKeyDown = useCallback(
    (event) => {
      const { min: mn, max: mx, defaultWidth: def } = boundsRef.current;

      switch (event.key) {
        case 'ArrowLeft':
          if (collapsed) return;
          event.preventDefault();
          commitWidth(widthRef.current - step, 'keyboard');
          break;
        case 'ArrowRight':
          if (collapsed) return;
          event.preventDefault();
          commitWidth(widthRef.current + step, 'keyboard');
          break;
        case 'Home':
          if (collapsed) return;
          event.preventDefault();
          commitWidth(def, 'keyboard');
          break;
        case 'End':
          if (collapsed) return;
          event.preventDefault();
          commitWidth(mx, 'keyboard');
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          toggle();
          break;
        case 'Escape':
          if (isResizingRef.current) {
            event.preventDefault();
            cancel();
            commitWidth(startWidthRef.current, 'cancel');
            pointerIdRef.current = null;
            isResizingRef.current = false;
            setIsResizing(false);
          }
          break;
        default:
          break;
      }
    },
    [commitWidth, toggle, cancel, step, collapsed],
  );

  /* ----- imperative API ----- */
  const api = useMemo(
    () => ({
      getWidth: () => widthRef.current,
      setWidth: setWidthSafe,
      resetWidth,
      toggle,
      expand,
      collapse,
      isCollapsed: () => collapsed,
      isResizing: () => isResizingRef.current,
    }),
    [setWidthSafe, resetWidth, toggle, expand, collapse, collapsed],
  );

  return {
    /* state */
    width,
    collapsed,
    isResizing,
    /* bounds */
    min,
    max,
    defaultWidth,
    step,
    /* actions */
    setWidth: setWidthSafe,
    resetWidth,
    toggle,
    expand,
    collapse,
    startResize,
    handleKeyDown,
    /* imperative */
    api,
  };
}

/* Alias for discoverability */
export const useResizableSidebar = useSidebarController;

/* ========================================================================== */
/* Context provider                                                           */
/* ========================================================================== */

const SidebarContext = createContext(null);

export function SidebarProvider({
  children,
  controller,
  ...options
}) {
  const internal = useSidebarController(options);
  const value = controller || internal;

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error(
      'useSidebar() must be called inside <SidebarProvider>. ' +
        'Wrap your layout or pass `controller` to <ResizableSidebarLayout>.',
    );
  }
  return ctx;
}

/* ========================================================================== */
/* Sub-component: ResizeHandle                                                */
/* ========================================================================== */

const ResizeHandle = forwardRef(function ResizeHandle(
  { collapsed, isResizing, onStart, onDoubleClick, onKeyDown, label, controls, min, max, width },
  ref,
) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-controls={controls}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={collapsed ? 0 : Math.round(width)}
      tabIndex={0}
      title={
        collapsed
          ? 'Click to expand'
          : 'Drag to resize · Double-click to reset · ← → to adjust'
      }
      onPointerDown={onStart}
      onDoubleClick={collapsed ? undefined : onDoubleClick}
      onKeyDown={onKeyDown}
      className={`group absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 touch-none rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
        collapsed ? 'cursor-default' : 'cursor-col-resize'
      } ${isResizing ? 'bg-violet-500/10' : 'hover:bg-violet-500/5'}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors duration-150 ${
          isResizing
            ? 'bg-violet-500'
            : 'bg-slate-200 group-hover:bg-violet-400 group-focus-visible:bg-violet-500 dark:bg-slate-800 dark:group-hover:bg-violet-500'
        }`}
      />
    </div>
  );
});
ResizeHandle.displayName = 'ResizeHandle';

/* ========================================================================== */
/* Sub-component: CollapseRail (button that floats on the handle)             */
/* ========================================================================== */

const CollapseRail = forwardRef(function CollapseRail(
  { collapsed, onToggle, controls },
  ref,
) {
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="sticky top-[calc(50vh-1rem)] flex justify-center">
        <button
          ref={ref}
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onToggle}
          aria-label={label}
          aria-expanded={!collapsed}
          aria-controls={controls}
          title={label}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors duration-150 hover:border-violet-300 hover:text-violet-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/25 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-400 dark:hover:border-violet-500/50 dark:hover:text-violet-400"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
});
CollapseRail.displayName = 'CollapseRail';

/* ========================================================================== */
/* Sub-component: MobileToggle                                                */
/* ========================================================================== */

function MobileToggle({
  collapsed,
  onToggle,
  controls,
  labelExpanded = 'Hide sidebar',
  labelCollapsed = 'Show sidebar',
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-controls={controls}
      className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/25 dark:border-slate-700 dark:bg-[#0f1115] dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-400 xl:hidden ${className}`}
    >
      {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      {collapsed ? labelCollapsed : labelExpanded}
    </button>
  );
}

/* ========================================================================== */
/* Main layout                                                                */
/* ========================================================================== */

/**
 * ResizableSidebarLayout
 *
 * - xl and up: [ sidebar | handle | main ]
 * - below xl : block; sidebar stacked above main; mobile toggle shown
 */
const ResizableSidebarLayout = forwardRef(function ResizableSidebarLayout(
  {
    sidebar,
    children,
    controller,
    className = '',
    sidebarClassName = '',
    mainClassName = '',
    showMobileToggle = true,
    mobileToggleLabels,
    collapsedContent,
  },
  ref,
) {
  /* Use context if no controller prop was given */
  const ctx = useContext(SidebarContext);
  const own = useSidebarController();
  const state = controller || ctx || own;

  const {
    width,
    collapsed,
    isResizing,
    min,
    max,
    resetWidth,
    toggle,
    startResize,
    handleKeyDown,
  } = state;

  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  /* Stable unique IDs (SSR-safe, multi-instance-safe) */
  const reactId = useId();
  const sidebarId = `app-sidebar-${reactId}`;
  const handleId = `app-sidebar-handle-${reactId}`;

  const asideRef = useRef(null);
  const handleRef = useRef(null);

  const hidden = isDesktop && collapsed;

  /* Hide from assistive tech & tab order when collapsed on desktop */
  useLayoutEffect(() => {
    if (asideRef.current) asideRef.current.inert = hidden;
  }, [hidden]);

  /* Optional imperative handle for the parent */
  useImperativeHandle(
    ref,
    () => ({
      getNode: () => asideRef.current,
      getHandle: () => handleRef.current,
      ...state.api,
    }),
    [state.api],
  );

  /* Compute max allowed width based on viewport, so the sidebar can't
     accidentally take over the whole screen on narrow laptops. */
  const vw = useViewportWidth();
  const effectiveMax = useMemo(() => {
    const cap = Math.max(min, Math.floor(vw * 0.6));
    return Math.min(max, cap);
  }, [vw, min, max]);

  /* CSS variables (no re-render on width updates except in this component) */
  const cssVars = useMemo(
    () => ({
      '--sidebar-w': `${width}px`,
      '--sidebar-min': `${min}px`,
      '--sidebar-max': `${effectiveMax}px`,
    }),
    [width, min, effectiveMax],
  );

  const handleLabel = collapsed
    ? 'Expand sidebar'
    : `Resize sidebar (${Math.round(width)}px)`;

  return (
    <div
      className={`xl:flex xl:items-stretch ${className}`}
      style={cssVars}
      data-sidebar-state={collapsed ? 'collapsed' : 'expanded'}
      data-resizing={isResizing ? 'true' : 'false'}
      data-sidebar-width={Math.round(width)}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Mobile toggle                                                     */}
      {/* ------------------------------------------------------------------ */}
      {showMobileToggle && (
        <MobileToggle
          collapsed={collapsed}
          onToggle={toggle}
          controls={sidebarId}
          labelExpanded={mobileToggleLabels?.expanded}
          labelCollapsed={mobileToggleLabels?.collapsed}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <aside
        id={sidebarId}
        ref={asideRef}
        aria-hidden={hidden || undefined}
        className={`min-w-0 overflow-x-hidden xl:sticky xl:top-4 xl:mb-0 xl:max-h-[calc(100vh-2rem)] xl:shrink-0 xl:self-start xl:overflow-y-auto [scrollbar-width:thin] ${
          collapsed
            ? 'hidden xl:pointer-events-none xl:block xl:w-0 xl:opacity-0'
            : 'block xl:w-[var(--sidebar-w)] xl:opacity-100'
        } ${
          isResizing
            ? ''
            : 'xl:transition-[width,opacity] xl:duration-300 xl:ease-out motion-reduce:transition-none'
        } ${sidebarClassName}`}
      >
        {/* Fixed inner width so content does not squash while collapsing */}
        <div className="xl:w-[var(--sidebar-w)]">{sidebar}</div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Handle rail (xl and up only)                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative hidden w-5 shrink-0 xl:block">
        <ResizeHandle
          ref={handleRef}
          collapsed={collapsed}
          isResizing={isResizing}
          onStart={startResize}
          onDoubleClick={resetWidth}
          onKeyDown={handleKeyDown}
          label={handleLabel}
          controls={sidebarId}
          min={min}
          max={effectiveMax}
          width={width}
        />

        <CollapseRail
          collapsed={collapsed}
          onToggle={toggle}
          controls={sidebarId}
        />

        {/* Optional custom collapsed content (e.g. icon strip) */}
        {collapsed && collapsedContent ? (
          <div className="pointer-events-auto absolute inset-y-0 -left-[--sidebar-w] hidden xl:block">
            {collapsedContent}
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className={`min-w-0 flex-1 ${mainClassName}`}>{children}</div>
    </div>
  );
});
ResizableSidebarLayout.displayName = 'ResizableSidebarLayout';

export default ResizableSidebarLayout;

/* ========================================================================== */
/* Optional: helper to read the current sidebar state outside React           */
/* ========================================================================== */

export function subscribeToSidebarChanges(handler) {
  if (!isBrowser) return () => {};
  const onEvent = (event) => handler(event.detail);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onEvent);
  return () => window.removeEventListener(SIDEBAR_CHANGE_EVENT, onEvent);
}