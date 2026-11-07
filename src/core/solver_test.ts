import { assert, assertEquals } from "@std/assert";
import { arrangementIndex, cellIndex, placementToArrangement } from "./board.ts";
import { analyzeTable, isCardTrue, isCompatible, trueCards } from "./solver.ts";

// ★ A1, ● B2, ■ C3 (main diagonal).
const diagonal = arrangementIndex(placementToArrangement([cellIndex(0, 0), cellIndex(1, 1), cellIndex(2, 2)])!);

Deno.test("cards are evaluated against an arrangement", () => {
  assert(isCardTrue("ROW-STAR-1", diagonal));
  assert(isCardTrue("COL-CIRCLE-B", diagonal));
  assert(isCardTrue("CELL-B2", diagonal));
  assert(isCardTrue("ABOVE-STAR-SQUARE", diagonal));
  assert(isCardTrue("TOUCH-STAR-CIRCLE", diagonal));
  assert(!isCardTrue("TOUCH-STAR-SQUARE", diagonal));
  assert(!isCardTrue("COUNT-LIGHT-2", diagonal));
  assert(isCardTrue("SHADE-SQUARE-DARK", diagonal));
});

Deno.test("contradictory cards are not compatible", () => {
  assert(!isCompatible(["ROW-STAR-1", "ROW-STAR-2"]));
  assert(!isCompatible(["CELL-A1", "CELL-B1"]));
  assert(isCompatible(["ROW-STAR-1", "COL-STAR-A", "CELL-B2"]));
});

Deno.test("the analysis finds the largest compatible group", () => {
  const cards = ["ROW-STAR-1", "ROW-STAR-2", "COL-STAR-A", "CELL-B2", "ABOVE-CIRCLE-STAR"];
  const { max, optimal } = analyzeTable(cards);
  assertEquals(max, 3);
  assert(optimal.includes(diagonal));
  for (const a of optimal) assertEquals(trueCards(cards, a).length, 3);
});

Deno.test("an empty table has a max of 0", () => {
  assertEquals(analyzeTable([]).max, 0);
});
