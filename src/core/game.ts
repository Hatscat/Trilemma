/**
 * Game state machine (solo play), pure and JSON-serializable.
 *
 * Classic mode:   search → (lock in a bid) → demonstrate → result → next round …
 *                 With a timer, an expired search goes to "bidding": the player must bid at once.
 * Challenge mode: search (the target is announced) → check → result → next round …
 *
 * Every transition is a pure function `(state, …) => state`. Illegal transitions throw a `GameError`.
 * Times are passed in explicitly (`now`, in milliseconds) to keep the logic deterministic and testable.
 */

import { arrangementIndex, EMPTY_PLACEMENT, placeCharacter, type Placement, placementToArrangement } from "./board.ts";
import { deckCards, type DeckChoice } from "./cards.ts";
import { mulberry32, shuffled } from "./rng.ts";
import { analyzeTable, isCardTrue, trueCards } from "./solver.ts";

export const TABLE_SIZE = 9;
export const STATE_VERSION = 1;

export type Mode = "classic" | "challenge";

export interface GameConfig {
  readonly mode: Mode;
  readonly deck: DeckChoice;
  /** Classic mode search time limit, in seconds. `null` means no timer. */
  readonly timerSeconds: number | null;
  readonly seed: number;
}

export interface CardCheck {
  readonly id: string;
  readonly ok: boolean;
}

export type RoundOutcome = "won" | "failed" | "revealed";

export interface RoundResult {
  readonly round: number;
  readonly outcome: RoundOutcome;
  /** Classic mode bid, `null` in challenge mode. */
  readonly bid: number | null;
  /** Largest compatible group on the table this round. */
  readonly max: number;
  /** Arrangement index used by the player, `null` when they gave up. */
  readonly arrangement: number | null;
  /** Cards checked in table order, up to the first false one. */
  readonly checks: readonly CardCheck[];
  /** Cards leaving the table at the end of the round (won, or discarded when revealed). */
  readonly removed: readonly string[];
  /** An optimal arrangement (the player's one when it is optimal) and its true cards. */
  readonly solution: number;
  readonly solutionCards: readonly string[];
  /** Challenge mode: wrong checks during the round. */
  readonly mistakes: number;
  readonly durationMs: number;
}

export interface Feedback {
  /** Challenge mode: first selected card that is false for the checked arrangement. */
  readonly falseCard: string;
}

export type Phase =
  | { readonly name: "search"; readonly deadline: number | null; readonly feedback: Feedback | null }
  | { readonly name: "bidding" }
  | { readonly name: "demonstrate"; readonly bid: number }
  | { readonly name: "result"; readonly result: RoundResult }
  | { readonly name: "over" };

export interface GameState {
  readonly version: number;
  readonly config: GameConfig;
  readonly pile: readonly string[];
  /** `TABLE_SIZE` slots; `null` is an empty slot. */
  readonly table: readonly (string | null)[];
  readonly won: readonly string[];
  readonly discarded: readonly string[];
  readonly round: number;
  /** Largest compatible group on the current table (announced in challenge mode). */
  readonly target: number;
  readonly placement: Placement;
  /** Selected card ids, in table order. */
  readonly selection: readonly string[];
  readonly phase: Phase;
  readonly history: readonly RoundResult[];
  readonly startedAt: number;
  readonly roundStartedAt: number;
  readonly roundMistakes: number;
  readonly finishedAt: number | null;
}

export class GameError extends Error {
  override name = "GameError";
}

function fail(message: string): never {
  throw new GameError(message);
}

export function tableCards(state: GameState): string[] {
  return state.table.filter((id): id is string => id !== null);
}

function startRound(
  state: Omit<GameState, "target" | "phase" | "roundStartedAt" | "roundMistakes">,
  now: number,
): GameState {
  const cards = state.table.filter((id): id is string => id !== null);
  const { config } = state;
  const deadline = config.mode === "classic" && config.timerSeconds ? now + config.timerSeconds * 1000 : null;
  return {
    ...state,
    target: analyzeTable(cards).max,
    placement: EMPTY_PLACEMENT,
    selection: [],
    phase: { name: "search", deadline, feedback: null },
    roundStartedAt: now,
    roundMistakes: 0,
  };
}

export function newGame(config: GameConfig, now: number): GameState {
  const ids = deckCards(config.deck).map((c) => c.id);
  const pile = shuffled(ids, mulberry32(config.seed));
  return startRound({
    version: STATE_VERSION,
    config,
    table: pile.slice(0, TABLE_SIZE),
    pile: pile.slice(TABLE_SIZE),
    won: [],
    discarded: [],
    round: 1,
    placement: EMPTY_PLACEMENT,
    selection: [],
    history: [],
    startedAt: now,
    finishedAt: null,
  }, now);
}

function canEditBoard(state: GameState): boolean {
  return state.phase.name === "search" || state.phase.name === "demonstrate";
}

function clearFeedback(phase: Phase): Phase {
  return phase.name === "search" && phase.feedback ? { ...phase, feedback: null } : phase;
}

/** Places a character on a cell (`null` = back off the board). Conflicting characters leave the board. */
export function place(state: GameState, character: number, cell: number | null): GameState {
  if (!canEditBoard(state)) fail(`Cannot move characters during "${state.phase.name}"`);
  return { ...state, placement: placeCharacter(state.placement, character, cell), phase: clearFeedback(state.phase) };
}

export function clearBoard(state: GameState): GameState {
  if (!canEditBoard(state)) fail(`Cannot clear the board during "${state.phase.name}"`);
  return { ...state, placement: EMPTY_PLACEMENT, phase: clearFeedback(state.phase) };
}

export function toggleCard(state: GameState, cardId: string): GameState {
  if (!canEditBoard(state)) fail(`Cannot select cards during "${state.phase.name}"`);
  if (!state.table.includes(cardId)) fail(`Card ${cardId} is not on the table`);
  const selected = new Set(state.selection);
  if (selected.has(cardId)) selected.delete(cardId);
  else selected.add(cardId);
  const selection = tableCards(state).filter((id) => selected.has(id));
  return { ...state, selection, phase: clearFeedback(state.phase) };
}

export function clearSelection(state: GameState): GameState {
  if (!canEditBoard(state)) fail(`Cannot clear the selection during "${state.phase.name}"`);
  return { ...state, selection: [], phase: clearFeedback(state.phase) };
}

// ---------------------------------------------------------------------------
// Classic mode
// ---------------------------------------------------------------------------

/** Remaining search time in milliseconds, or `null` without a timer. */
export function remainingMs(state: GameState, now: number): number | null {
  if (state.phase.name !== "search" || state.phase.deadline === null) return null;
  return Math.max(0, state.phase.deadline - now);
}

/** Classic mode: when the search time is over, the player must bid at once. */
export function expireTimer(state: GameState, now: number): GameState {
  const { phase } = state;
  if (phase.name !== "search" || phase.deadline === null || now < phase.deadline) return state;
  return { ...state, phase: { name: "bidding" } };
}

/** Classic mode: locks in the bid. It can never change afterwards. */
export function lockIn(state: GameState, bid: number): GameState {
  if (state.config.mode !== "classic") fail("Bids only exist in classic mode");
  if (state.phase.name !== "search" && state.phase.name !== "bidding") fail("The bid is already locked in");
  const count = tableCards(state).length;
  if (!Number.isInteger(bid) || bid < 1 || bid > count) fail(`The bid must be between 1 and ${count}`);
  return { ...state, phase: { name: "demonstrate", bid } };
}

function playerArrangement(state: GameState): number {
  const arrangement = placementToArrangement(state.placement);
  if (!arrangement) fail("All three characters must be on the board");
  return arrangementIndex(arrangement);
}

function solutionFor(state: GameState, arrangement: number | null): { solution: number; solutionCards: string[] } {
  const cards = tableCards(state);
  const { optimal } = analyzeTable(cards);
  const solution = arrangement !== null && optimal.includes(arrangement) ? arrangement : optimal[0];
  return { solution, solutionCards: trueCards(cards, solution) };
}

function checkSelection(selection: readonly string[], arrangement: number): CardCheck[] {
  const checks: CardCheck[] = [];
  for (const id of selection) {
    const ok = isCardTrue(id, arrangement);
    checks.push({ id, ok });
    if (!ok) break;
  }
  return checks;
}

function finishRound(state: GameState, result: Omit<RoundResult, "round" | "max" | "durationMs">, now: number) {
  const full: RoundResult = {
    ...result,
    round: state.round,
    max: state.target,
    durationMs: now - state.roundStartedAt,
  };
  return { ...state, phase: { name: "result", result: full } as const, history: [...state.history, full] };
}

/** Classic mode: validates the demonstration. All or nothing: one false card voids it. */
export function demonstrate(state: GameState, now: number): GameState {
  const { phase } = state;
  if (phase.name !== "demonstrate") fail("Lock in a bid before demonstrating");
  if (state.selection.length !== phase.bid) fail(`Select exactly ${phase.bid} cards`);
  const arrangement = playerArrangement(state);
  const checks = checkSelection(state.selection, arrangement);
  const success = checks.length === phase.bid && checks.every((c) => c.ok);
  return finishRound(state, {
    outcome: success ? "won" : "failed",
    bid: phase.bid,
    arrangement,
    checks,
    removed: success ? state.selection : [],
    mistakes: 0,
    ...solutionFor(state, arrangement),
  }, now);
}

// ---------------------------------------------------------------------------
// Challenge mode
// ---------------------------------------------------------------------------

/** Challenge mode: checks a group of exactly `target` cards. A wrong check counts as a mistake. */
export function check(state: GameState, now: number): GameState {
  if (state.config.mode !== "challenge") fail("Checks only exist in challenge mode");
  if (state.phase.name !== "search") fail(`Cannot check during "${state.phase.name}"`);
  if (state.selection.length !== state.target) fail(`Select exactly ${state.target} cards`);
  const arrangement = playerArrangement(state);
  const checks = checkSelection(state.selection, arrangement);
  const falseCheck = checks.find((c) => !c.ok);
  if (falseCheck) {
    return {
      ...state,
      roundMistakes: state.roundMistakes + 1,
      phase: { ...state.phase, feedback: { falseCard: falseCheck.id } },
    };
  }
  return finishRound(state, {
    outcome: "won",
    bid: null,
    arrangement,
    checks,
    removed: state.selection,
    mistakes: state.roundMistakes,
    ...solutionFor(state, arrangement),
  }, now);
}

/** Challenge mode: reveals a solution. Its cards are discarded, not won. */
export function giveUp(state: GameState, now: number): GameState {
  if (state.config.mode !== "challenge") fail("Giving up only exists in challenge mode");
  if (state.phase.name !== "search") fail(`Cannot give up during "${state.phase.name}"`);
  const { solution, solutionCards } = solutionFor(state, null);
  return finishRound(state, {
    outcome: "revealed",
    bid: null,
    arrangement: null,
    checks: [],
    removed: solutionCards,
    mistakes: state.roundMistakes,
    solution,
    solutionCards,
  }, now);
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

/** Applies the round result, refills the table and starts the next round (or ends the game). */
export function nextRound(state: GameState, now: number): GameState {
  const { phase } = state;
  if (phase.name !== "result") fail("The round is not over");
  const { result } = phase;
  const removed = new Set(result.removed);
  const pile = state.pile.slice();
  const table = state.table.map((id) => (id === null || removed.has(id) ? pile.shift() ?? null : id));
  const won = result.outcome === "won" ? [...state.won, ...result.removed] : state.won;
  const discarded = result.outcome === "revealed" ? [...state.discarded, ...result.removed] : state.discarded;

  if (table.every((id) => id === null)) {
    return {
      ...state,
      table,
      pile,
      won,
      discarded,
      placement: EMPTY_PLACEMENT,
      selection: [],
      phase: { name: "over" },
      finishedAt: now,
    };
  }
  return startRound({ ...state, table, pile, won, discarded, round: state.round + 1 }, now);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Moves every stored timestamp forward, e.g. to pause the clock while the app was closed. */
export function shiftTime(state: GameState, deltaMs: number): GameState {
  if (deltaMs <= 0 || state.phase.name === "over") return state;
  const phase = state.phase.name === "search" && state.phase.deadline !== null
    ? { ...state.phase, deadline: state.phase.deadline + deltaMs }
    : state.phase;
  return {
    ...state,
    phase,
    startedAt: state.startedAt + deltaMs,
    roundStartedAt: state.roundStartedAt + deltaMs,
  };
}

export interface GameSummary {
  readonly rounds: number;
  readonly cardsWon: number;
  readonly cardsRevealed: number;
  /** Classic: winning bid equal to the max. Challenge: found without mistakes. */
  readonly perfectRounds: number;
  readonly failedRounds: number;
  readonly revealedRounds: number;
  readonly mistakes: number;
  readonly durationMs: number;
}

export function summarize(state: GameState, now: number): GameSummary {
  const h = state.history;
  return {
    rounds: h.length,
    cardsWon: state.won.length,
    cardsRevealed: state.discarded.length,
    perfectRounds:
      h.filter((r) => r.outcome === "won" && (state.config.mode === "classic" ? r.bid === r.max : r.mistakes === 0))
        .length,
    failedRounds: h.filter((r) => r.outcome === "failed").length,
    revealedRounds: h.filter((r) => r.outcome === "revealed").length,
    mistakes: h.reduce((sum, r) => sum + r.mistakes, 0),
    durationMs: (state.finishedAt ?? now) - state.startedAt,
  };
}

/** Minimal shape check for a state loaded from storage. */
export function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Partial<GameState>;
  return s.version === STATE_VERSION && typeof s.config === "object" && Array.isArray(s.table) &&
    s.table.length === TABLE_SIZE && Array.isArray(s.pile) && typeof s.phase === "object";
}
