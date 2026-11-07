/// <reference types="./env.d.ts" />
/**
 * Entry point: hash router (#/, #/play, #/rules), persistence and service worker registration.
 * Add `?seed=<number>` to the URL to make new games deterministic (tests, shared puzzles).
 */

import { type GameState, type Mode, newGame, shiftTime } from "./core/game.ts";
import { randomSeed } from "./core/rng.ts";
import { confirmDialog } from "./ui/dialogs.ts";
import { h } from "./ui/dom.ts";
import { GameView } from "./ui/game-view.ts";
import { renderHome } from "./ui/home.ts";
import { renderRules } from "./ui/rules.ts";
import { spriteMarkup } from "./ui/sprite.ts";
import { loadGame, loadSettings, saveGame, saveSettings } from "./ui/storage.ts";

const app = document.getElementById("app")!;
document.body.insertAdjacentHTML("afterbegin", spriteMarkup());

let settings = loadSettings();
/** The game in memory (also saved to localStorage when available). */
let current: GameState | null = null;
let view: GameView | null = null;

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
    const replace = await confirmDialog({
      title: "Start a new game?",
      message: "The game in progress will be lost.",
      confirm: "New game",
      cancel: "Cancel",
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

function show(element: HTMLElement, title: string): void {
  app.replaceChildren(element);
  document.title = title;
  globalThis.scrollTo(0, 0);
}

function route(): void {
  view?.destroy();
  view = null;
  const hash = location.hash || "#/";
  if (hash === "#/play") {
    const state = loadCurrent();
    if (!state) {
      navigate("#/");
      return;
    }
    view = new GameView(state, {
      onExit: () => navigate("#/"),
      onChange: persist,
      onPlayAgain: (mode) => void startGame(mode),
    });
    show(view.root, "Trilemma · Playing");
  } else if (hash === "#/rules") {
    show(renderRules(() => navigate("#/")), "Trilemma · How to play");
  } else {
    const home = renderHome(settings, loadCurrent(), {
      onStart: (mode) => void startGame(mode),
      onResume: () => navigate("#/play"),
      onSettingsChange: (next) => {
        settings = next;
        saveSettings(next);
      },
    });
    home.append(h("footer", { class: "version" }, `Trilemma v${__APP_VERSION__}`));
    show(home, "Trilemma");
  }
}

globalThis.addEventListener("hashchange", route);
route();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  globalThis.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.error("Service worker:", error));
  });
}
