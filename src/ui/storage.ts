/**
 * Local persistence: settings, the game in progress and personal records.
 * Storage can be unavailable (private mode, blocked site data), so every access is guarded.
 */

import type { DeckChoice } from "../core/cards.ts";
import { type GameState, type GameSummary, isGameState, type Mode } from "../core/game.ts";
import { isLang, type Lang } from "../i18n/index.ts";

const KEYS = {
  settings: "trilemma.settings.v1",
  save: "trilemma.save.v1",
  records: "trilemma.records.v1",
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the game still works, it just is not remembered.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

// --- Settings ---------------------------------------------------------------

export interface Settings {
  readonly deck: DeckChoice;
  /** Classic mode timer in seconds, `null` = no timer. */
  readonly timerSeconds: number | null;
  /** Chosen language, `null` = follow the browser. */
  readonly lang: Lang | null;
  readonly tutorialDone: boolean;
}

export const TIMER_CHOICES: readonly (number | null)[] = [null, 60, 120, 180, 300];

export function loadSettings(): Settings {
  const s = read<Partial<Settings>>(KEYS.settings);
  return {
    deck: s?.deck === "full" ? "full" : "base",
    timerSeconds: TIMER_CHOICES.includes(s?.timerSeconds ?? null) ? s?.timerSeconds ?? null : null,
    lang: isLang(s?.lang) ? s.lang : null,
    tutorialDone: s?.tutorialDone === true,
  };
}

export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings);
}

// --- Game in progress -------------------------------------------------------

interface SavedGame {
  readonly savedAt: number;
  readonly state: GameState;
}

export function loadGame(): SavedGame | null {
  const saved = read<SavedGame>(KEYS.save);
  return saved && typeof saved.savedAt === "number" && isGameState(saved.state) ? saved : null;
}

export function saveGame(state: GameState, now: number): void {
  if (state.phase.name === "over") remove(KEYS.save);
  else write(KEYS.save, { savedAt: now, state } satisfies SavedGame);
}

export function clearGame(): void {
  remove(KEYS.save);
}

// --- Records ----------------------------------------------------------------

export interface GameRecord {
  readonly played: number;
  /** Fewest rounds to empty the deck. */
  readonly bestRounds: number | null;
  /** Fastest game, in milliseconds. */
  readonly bestTimeMs: number | null;
}

type Records = Record<string, GameRecord>;

export function recordKey(mode: Mode, deck: DeckChoice): string {
  return `${mode}-${deck}`;
}

export function loadRecords(): Records {
  return read<Records>(KEYS.records) ?? {};
}

/** Stores a finished game and tells which records it beat. */
export function addFinishedGame(
  mode: Mode,
  deck: DeckChoice,
  summary: GameSummary,
): { record: GameRecord; newBestRounds: boolean; newBestTime: boolean } {
  const records = loadRecords();
  const key = recordKey(mode, deck);
  const old = records[key] ?? { played: 0, bestRounds: null, bestTimeMs: null };
  // In challenge mode, revealed solutions do not count as a clean finish for records.
  const eligible = mode === "classic" || summary.revealedRounds === 0;
  const newBestRounds = eligible && (old.bestRounds === null || summary.rounds < old.bestRounds);
  const newBestTime = eligible && (old.bestTimeMs === null || summary.durationMs < old.bestTimeMs);
  const record: GameRecord = {
    played: old.played + 1,
    bestRounds: newBestRounds ? summary.rounds : old.bestRounds,
    bestTimeMs: newBestTime ? summary.durationMs : old.bestTimeMs,
  };
  write(KEYS.records, { ...records, [key]: record });
  return { record, newBestRounds, newBestTime };
}
