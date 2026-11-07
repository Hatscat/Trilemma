/** Tiny DOM helpers (no framework). */

type Child = Node | string | number | null | undefined | false;
type PropValue = string | number | boolean | null | undefined | EventListener;

/**
 * Creates an element. Props starting with "on" are event listeners, `true` sets a boolean attribute,
 * `false`/`null`/`undefined` are skipped. `html` sets trusted, static markup (never user input).
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, PropValue> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "html") el.innerHTML = String(value);
    else if (value === true) el.setAttribute(key, "");
    else if (value !== false && value !== null && value !== undefined) el.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === "number" ? String(child) : child);
  }
  return el;
}

/** "m:ss" */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

/** "1 min 05 s" or "42 s" */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, "0")} s` : `${seconds} s`;
}

export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export const ICONS = {
  /** iOS-style Share icon (square with an arrow), used in the installation instructions. */
  share: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3.5M8 7l4-4 4 4M8.5 10H6.5a1.5 1.5 0 0 0-1.5 ` +
    `1.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5h-2" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  install: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11M7.5 9.5L12 14l4.5-4.5M5 17v2.5h14V17" ` +
    `fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" ` +
    `stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  zoom: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" ` +
    `stroke="currentColor" stroke-width="2.4"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5" stroke="currentColor" ` +
    `stroke-width="2.4" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" ` +
    `stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" ` +
    `stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`,
} as const;
