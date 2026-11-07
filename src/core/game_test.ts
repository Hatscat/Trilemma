import { assert, assertEquals, assertNotEquals, assertThrows } from "@std/assert";
import { ARRANGEMENTS, arrangementToPlacement } from "./board.ts";
import {
  canEditBoard,
  check,
  demonstrate,
  expireTimer,
  type GameConfig,
  GameError,
  type GameState,
  giveUp,
  isGameState,
  lockIn,
  newGame,
  nextRound,
  place,
  remainingMs,
  shiftTime,
  summarize,
  TABLE_SIZE,
  tableCards,
  toggleCard,
} from "./game.ts";
import { analyzeTable, isCardTrue, trueCards } from "./solver.ts";

const T0 = 1_000_000;
const classic: GameConfig = { mode: "classic", deck: "base", timerSeconds: null, seed: 42 };
const practice: GameConfig = { ...classic, mode: "practice" };

/** Places the characters for `arrangement` and selects `cards`. */
function prepare(state: GameState, arrangement: number, cards: readonly string[]): GameState {
  let s = state;
  arrangementToPlacement(ARRANGEMENTS[arrangement]).forEach((cell, c) => (s = place(s, c, cell)));
  for (const id of cards) s = toggleCard(s, id);
  return s;
}

function optimalPlay(state: GameState): { arrangement: number; cards: string[] } {
  const cards = tableCards(state);
  const arrangement = analyzeTable(cards).optimal[0];
  return { arrangement, cards: trueCards(cards, arrangement) };
}

Deno.test("a new game deals 9 cards and is deterministic for a seed", () => {
  const a = newGame(classic, T0);
  const b = newGame(classic, T0);
  assertEquals(a.table, b.table);
  assertEquals(a.table.length, TABLE_SIZE);
  assertEquals(a.pile.length, 55 - TABLE_SIZE);
  assertEquals(a.target, analyzeTable(tableCards(a)).max);
  assertNotEquals(newGame({ ...classic, seed: 43 }, T0).table, a.table);
  assertEquals(a.phase, { name: "search", deadline: null, feedback: null });
});

Deno.test("classic: a valid demonstration wins exactly the bid cards and refills the table", () => {
  let s = newGame(classic, T0);
  const { arrangement, cards } = optimalPlay(s);
  s = lockIn(s, cards.length);
  s = prepare(s, arrangement, cards);
  s = demonstrate(s, T0 + 5000);
  assert(s.phase.name === "result");
  const { result } = s.phase;
  assertEquals(result.outcome, "won");
  assertEquals(result.max, cards.length);
  assertEquals(result.durationMs, 5000);
  assertEquals(result.solution, arrangement);
  s = nextRound(s, T0 + 6000);
  assertEquals(s.won.length, cards.length);
  assertEquals(s.round, 2);
  assertEquals(tableCards(s).length, TABLE_SIZE);
  assertEquals(s.pile.length, 55 - TABLE_SIZE - cards.length);
  for (const id of cards) assert(!s.table.includes(id));
  assertEquals(s.selection, []);
  assertEquals(s.placement, [null, null, null]);
});

Deno.test("classic: one false card voids the whole demonstration and nobody scores", () => {
  let s = newGame(classic, T0);
  const { arrangement, cards } = optimalPlay(s);
  const falseCard = tableCards(s).find((id) => !isCardTrue(id, arrangement))!;
  const shown = [...cards.slice(0, cards.length - 1), falseCard];
  s = lockIn(s, shown.length);
  s = prepare(s, arrangement, shown);
  s = demonstrate(s, T0);
  assert(s.phase.name === "result");
  assertEquals(s.phase.result.outcome, "failed");
  assertEquals(s.phase.result.removed, []);
  assertEquals(s.phase.result.checks.at(-1), { id: falseCard, ok: false });
  const table = s.table;
  s = nextRound(s, T0);
  assertEquals(s.won, []);
  assertEquals(s.table, table);
  assertEquals(s.round, 2);
});

Deno.test("classic: the search happens in the head, the board unlocks with the bid", () => {
  let s = newGame(classic, T0);
  const { arrangement, cards } = optimalPlay(s);
  assertEquals(canEditBoard(s), false);
  assertThrows(() => place(s, 0, 0), GameError);
  assertThrows(() => toggleCard(s, cards[0]), GameError);
  s = lockIn(s, cards.length);
  assertEquals(canEditBoard(s), true);
  s = prepare(s, arrangement, cards);
  assertEquals(s.selection.length, cards.length);
  assertEquals(canEditBoard(newGame(practice, T0)), true, "practice mode can use the board while searching");
});

Deno.test("classic: the bid is strict", () => {
  let s = newGame(classic, T0);
  const { arrangement, cards } = optimalPlay(s);
  assertThrows(() => demonstrate(s, T0), GameError); // no bid yet
  assertThrows(() => lockIn(s, 0), GameError);
  assertThrows(() => lockIn(s, TABLE_SIZE + 1), GameError);
  s = lockIn(s, cards.length + 1);
  assertThrows(() => lockIn(s, cards.length), GameError); // cannot change a locked bid
  s = prepare(s, arrangement, cards);
  assertThrows(() => demonstrate(s, T0), GameError); // too few cards selected
});

Deno.test("classic: an expired timer forces the bid", () => {
  let s = newGame({ ...classic, timerSeconds: 60 }, T0);
  assertEquals(remainingMs(s, T0 + 15_000), 45_000);
  assertEquals(expireTimer(s, T0 + 59_999), s);
  s = expireTimer(s, T0 + 60_000);
  assertEquals(s.phase.name, "bidding");
  assertThrows(() => place(s, 0, 0), GameError);
  s = lockIn(s, 3);
  assertEquals(s.phase, { name: "demonstrate", bid: 3 });
});

Deno.test("practice: wrong checks count as mistakes, a right one wins the round", () => {
  let s = newGame(practice, T0);
  const { arrangement, cards } = optimalPlay(s);
  assertEquals(s.target, cards.length);
  const falseCard = tableCards(s).find((id) => !isCardTrue(id, arrangement))!;
  s = prepare(s, arrangement, [...cards.slice(1), falseCard]);
  s = check(s, T0);
  assert(s.phase.name === "search");
  assertEquals(s.phase.feedback, { falseCard });
  assertEquals(s.roundMistakes, 1);
  s = toggleCard(s, falseCard);
  assert(s.phase.name === "search" && s.phase.feedback === null);
  s = toggleCard(s, cards[0]);
  s = check(s, T0 + 1000);
  assert(s.phase.name === "result");
  assertEquals(s.phase.result.outcome, "won");
  assertEquals(s.phase.result.mistakes, 1);
});

Deno.test("practice: giving up discards a solution", () => {
  let s = newGame(practice, T0);
  s = giveUp(s, T0);
  assert(s.phase.name === "result");
  const { result } = s.phase;
  assertEquals(result.outcome, "revealed");
  assertEquals(result.removed.length, s.target);
  s = nextRound(s, T0);
  assertEquals(s.discarded.length, result.removed.length);
  assertEquals(s.won, []);
});

Deno.test("a full game with optimal play empties the deck", () => {
  for (const mode of ["classic", "practice"] as const) {
    let s = newGame({ ...classic, mode, seed: 7 }, T0);
    let guard = 0;
    while (s.phase.name !== "over" && guard++ < 100) {
      const { arrangement, cards } = optimalPlay(s);
      if (mode === "classic") s = lockIn(s, cards.length);
      s = prepare(s, arrangement, cards);
      s = mode === "classic" ? demonstrate(s, T0) : check(s, T0);
      s = nextRound(s, T0 + 1000);
    }
    assertEquals(s.phase.name, "over");
    assertEquals(s.won.length, 55);
    const summary = summarize(s, T0);
    assertEquals(summary.cardsWon, 55);
    assertEquals(summary.perfectRounds, summary.rounds);
    assertEquals(summary.durationMs, 1000);
  }
});

Deno.test("state survives a JSON round-trip and time can be shifted", () => {
  const s = newGame({ ...classic, timerSeconds: 120 }, T0);
  const loaded = JSON.parse(JSON.stringify(s));
  assert(isGameState(loaded));
  assertEquals(loaded, s);
  assert(!isGameState({ version: 0 }));
  const shifted = shiftTime(s, 10_000);
  assertEquals(remainingMs(shifted, T0 + 10_000), 120_000);
  assertEquals(shifted.roundStartedAt, T0 + 10_000);
});
