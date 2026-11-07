/**
 * Compatibility solver: which cards are true for which arrangements.
 * With only 36 arrangements, exhaustive evaluation is instant.
 */

import { type Arrangement, ARRANGEMENTS } from "./board.ts";
import { type CardDefinition, getCard } from "./cards.ts";

const truthCache = new Map<string, Uint8Array>();

/** `truthTable(card)[a]` is 1 when the card is true for `ARRANGEMENTS[a]`. */
export function truthTable(card: CardDefinition): Uint8Array {
  let table = truthCache.get(card.id);
  if (!table) {
    table = Uint8Array.from(ARRANGEMENTS, (a) => (card.test(a) ? 1 : 0));
    truthCache.set(card.id, table);
  }
  return table;
}

export function isCardTrue(cardId: string, arrangement: number): boolean {
  return truthTable(getCard(cardId))[arrangement] === 1;
}

/** Number of cards true for each of the 36 arrangements. */
export function scoreArrangements(cardIds: readonly string[]): number[] {
  const scores = new Array<number>(ARRANGEMENTS.length).fill(0);
  for (const id of cardIds) {
    const table = truthTable(getCard(id));
    for (let a = 0; a < scores.length; a++) scores[a] += table[a];
  }
  return scores;
}

export interface TableAnalysis {
  /** Largest number of mutually compatible cards. */
  readonly max: number;
  /** Indices of the arrangements reaching the maximum. */
  readonly optimal: readonly number[];
}

export function analyzeTable(cardIds: readonly string[]): TableAnalysis {
  const scores = scoreArrangements(cardIds);
  const max = Math.max(0, ...scores);
  const optimal = scores.flatMap((s, a) => (s === max ? [a] : []));
  return { max, optimal };
}

/** Cards of `cardIds` that are true for the given arrangement, in the same order. */
export function trueCards(cardIds: readonly string[], arrangement: number): string[] {
  return cardIds.filter((id) => isCardTrue(id, arrangement));
}

/** Whether some arrangement makes all the given cards true. */
export function isCompatible(cardIds: readonly string[]): boolean {
  return analyzeTable(cardIds).max === cardIds.length;
}

export function arrangementAt(index: number): Arrangement {
  return ARRANGEMENTS[index];
}
