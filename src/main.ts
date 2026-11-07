/// <reference types="./env.d.ts" />
/**
 * Entry point: hash router (#/, #/play, #/rules, #/tutorial), language, persistence and
 * service worker registration.
 * Add `?seed=<number>` to the URL to make new games deterministic (tests, shared puzzles).
 */

import { type GameState, type Mode, newGame, shiftTime } from "./core/game.ts";
import { randomSeed } from "./core/rng.ts";
import { detectLanguage, type Lang, setLanguage, t } from "./i18n/index.ts";
import { confirmDialog } from "./ui/dialogs.ts";
import { h } from "./ui/dom.ts";
import { GameView } from "./ui/game-view.ts";
import { renderHome } from "./ui/home.ts";
import { renderRules } from "./ui/rules.ts";
import { spriteMarkup } from "./ui/sprite.ts";
import { loadGame, loadSettings, saveGame, saveSettings, type Settings } from "./ui/storage.ts";
import { Tutorial } from "./ui/tutorial.ts";

const app = document.getElementById("app")!;
document.body.insertAdjacentHTML("afterbegin", spriteMarkup());

let settings = loadSettings();
/** The game in memory (also saved to localStorage when available). */
let current: GameState | null = null;
let screen: { destroy(): void } | null = null;

function language(): Lang {
  return settings.lang ?? detectLanguage(navigator.languages ?? [navigator.language]);
}
setLanguage(language());

function updateSettings(next: Settings): void {
  const languageChanged = next.lang !== settings.lang;
  settings = next;
  saveSettings(next);
  if (languageChanged) {
    setLanguage(language());
    route();
  }
}

function loadCurrent(): GameState | null {
  if (current) return current;
  const saved = loadGame();
  if (!saved) return null;
  // The clock does not run while the app is closed.
  current = shiftTime(saved.state, Date.now() - saved.savedAt);
  return current;
}

function persist(state: GameState): void {
  current = state;
  saveGame(state, Date.now());
}

function seedFromUrl(): number | null {
  const raw = new URLSearchParams(location.search).get("seed");
  const seed = Number(raw);
  return raw !== null && Number.isInteger(seed) && seed >= 0 ? seed : null;
}

async function startGame(mode: Mode): Promise<void> {
  const existing = loadCurrent();
  if (existing && existing.phase.name !== "over") {
    const m = t().home;
    const replace = await confirmDialog({
      title: m.newGameTitle,
      message: m.newGameMessage,
      confirm: m.newGameConfirm,
      cancel: m.cancel,
    });
    if (!replace) return;
  }
  persist(newGame({
    mode,
    deck: settings.deck,
    timerSeconds: mode === "classic" ? settings.timerSeconds : null,
    seed: seedFromUrl() ?? randomSeed(),
  }, Date.now()));
  navigate("#/play");
}

function navigate(hash: string): void {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function show(element: HTMLElement, title?: string): void {
  app.replaceChildren(element);
  document.title = title ? `Trilemma · ${title}` : "Trilemma";
  globalThis.scrollTo(0, 0);
}

function route(): void {
  screen?.destroy();
  screen = null;
  const hash = location.hash || "#/";
  if (hash === "#/play") {
    const state = loadCurrent();
    if (!state) {
      navigate("#/");
      return;
    }
    const view = new GameView(state, {
      onExit: () => navigate("#/"),
      onChange: persist,
      onPlayAgain: (mode) => void startGame(mode),
    });
    screen = view;
    show(view.root, t().game.modeName(state.config.mode));
  } else if (hash === "#/tutorial") {
    const tutorial = new Tutorial({
      onExit: () => navigate("#/"),
      onFinish: () => {
        updateSettings({ ...settings, tutorialDone: true });
        navigate("#/");
      },
    });
    screen = tutorial;
    show(tutorial.root, t().game.modeName("tutorial"));
  } else if (hash === "#/rules") {
    show(renderRules(() => navigate("#/")), t().rules.title);
  } else {
    const home = renderHome(settings, language(), loadCurrent(), {
      onStart: (mode) => void startGame(mode),
      onResume: () => navigate("#/play"),
      onTutorial: () => navigate("#/tutorial"),
      onSettingsChange: updateSettings,
    });
    home.append(h("footer", { class: "version" }, `Trilemma v${__APP_VERSION__}`));
    show(home);
  }
}

globalThis.addEventListener("hashchange", route);
route();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  globalThis.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.error("Service worker:", error));
  });
}
