/**
 * App installation (PWA) and update notice.
 *
 * - Chromium browsers (Chrome, Edge, Samsung Internet…) fire `beforeinstallprompt`: the event is kept so the home
 *   screen can offer its own "Install the app" button.
 * - iPhone / iPad have no such event: the button opens step-by-step instructions instead.
 * - Nothing is offered when the app already runs installed (standalone or fullscreen display mode).
 */

import { t } from "../i18n/index.ts";
import { openDialog } from "./dialogs.ts";
import { h, ICONS } from "./dom.ts";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: "accepted" | "dismissed" }>;
}

export type InstallOption = "prompt" | "ios" | null;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

/** True when the page runs as an installed app. */
export function isInstalled(): boolean {
  const modes = ["fullscreen", "standalone", "minimal-ui"];
  return installed || modes.some((mode) => globalThis.matchMedia?.(`(display-mode: ${mode})`).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isAppleMobile(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac: tell it apart by its touch screen.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** How the app can be installed from this page, or `null` when it cannot (or is already installed). */
export function installOption(): InstallOption {
  if (isInstalled()) return null;
  if (deferredPrompt) return "prompt";
  return isAppleMobile() ? "ios" : null;
}

/** Shows or hides every element marked `data-install`, according to `installOption()`. */
export function refreshInstallButtons(): void {
  const hidden = installOption() === null;
  for (const element of document.querySelectorAll<HTMLElement>("[data-install]")) element.hidden = hidden;
}

export function initInstall(): void {
  globalThis.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // Our own button replaces the browser's mini info bar.
    deferredPrompt = event as BeforeInstallPromptEvent;
    refreshInstallButtons();
  });
  globalThis.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    refreshInstallButtons();
  });
}

/** Runs the installation offered by the browser, or shows the iPhone / iPad instructions. */
export async function install(): Promise<void> {
  const option = installOption();
  if (option === "ios") {
    showAppleInstructions();
    return;
  }
  const prompt = deferredPrompt;
  if (!prompt) return;
  deferredPrompt = null; // A prompt can only be used once.
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  if (outcome === "accepted") installed = true;
  refreshInstallButtons();
}

function showAppleInstructions(): void {
  const m = t().install;
  const steps = m.iosSteps.map((step) =>
    h(
      "li",
      {},
      ...step.split("{share}").flatMap((part, i) =>
        i === 0 ? [part] : [h("span", { class: "inline-icon", html: ICONS.share }), part]
      ),
    )
  );
  const content = h(
    "div",
    { class: "dialog-body install-help" },
    h("h2", {}, m.title),
    h("ol", {}, ...steps),
    h(
      "div",
      { class: "dialog-actions" },
      h("button", { type: "button", class: "btn btn-primary", onclick: () => dialog.close() }, m.close),
    ),
  );
  const dialog = openDialog(content, { dismissable: true, label: m.title });
}

/** A small banner offering to load the new version after a service worker update. */
export function showUpdateNotice(): void {
  if (document.querySelector(".update-toast")) return;
  const m = t().update;
  document.body.append(
    h(
      "div",
      { class: "update-toast", role: "status" },
      h("span", {}, m.ready),
      h("button", { type: "button", class: "btn btn-primary", onclick: () => location.reload() }, m.reload),
    ),
  );
}
