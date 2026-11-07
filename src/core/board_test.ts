import { assertEquals, assertNotEquals, assertThrows } from "@std/assert";
import {
  arrangementIndex,
  ARRANGEMENTS,
  arrangementToPlacement,
  blockerOf,
  cellIndex,
  cellLabel,
  characterAt,
  darkCount,
  EMPTY_PLACEMENT,
  isDark,
  placeCharacter,
  placementToArrangement,
} from "./board.ts";

Deno.test("there are 36 distinct legal arrangements", () => {
  assertEquals(ARRANGEMENTS.length, 36);
  const keys = new Set(ARRANGEMENTS.map((a) => `${a.rows}|${a.cols}`));
  assertEquals(keys.size, 36);
  for (const a of ARRANGEMENTS) {
    assertEquals(new Set(a.rows).size, 3);
    assertEquals(new Set(a.cols).size, 3);
  }
});

Deno.test("corners and center are dark, A1 is dark", () => {
  const dark = [0, 1, 2].flatMap((r) => [0, 1, 2].filter((c) => isDark(r, c)).map((c) => cellLabel(r, c)));
  assertEquals(dark.sort(), ["A1", "A3", "B2", "C1", "C3"]);
});

Deno.test("parity: the number of characters on light cells is always 0 or 2", () => {
  const counts = ARRANGEMENTS.map((a) => 3 - darkCount(a));
  assertEquals(counts.filter((n) => n === 0).length, 12);
  assertEquals(counts.filter((n) => n === 2).length, 24);
});

Deno.test("a placed character reserves its row and its column", () => {
  let p = placeCharacter(EMPTY_PLACEMENT, 0, cellIndex(0, 0)); // Star on A1
  p = placeCharacter(p, 1, cellIndex(1, 1)); // Circle on B2
  assertEquals(p, [0, 4, null]);
  assertEquals(blockerOf(p, 2, cellIndex(0, 2)), 0, "C1 is in the Star's row");
  assertEquals(blockerOf(p, 2, cellIndex(2, 1)), 1, "B3 is in the Circle's column");
  assertEquals(blockerOf(p, 2, cellIndex(2, 2)), null, "C3 is free for the Square");
  assertEquals(blockerOf(p, 0, cellIndex(0, 2)), null, "a character never blocks itself");
  assertThrows(() => placeCharacter(p, 2, cellIndex(0, 1)));
  assertEquals(p, [0, 4, null], "other characters are never moved");
  p = placeCharacter(p, 2, cellIndex(2, 2));
  p = placeCharacter(p, 2, null);
  assertEquals(p, [0, 4, null]);
});

Deno.test("moving a character keeps the others when there is no conflict", () => {
  let p = placeCharacter(EMPTY_PLACEMENT, 0, cellIndex(0, 0));
  p = placeCharacter(p, 1, cellIndex(1, 1));
  p = placeCharacter(p, 0, cellIndex(2, 2));
  assertEquals(p, [8, 4, null]);
});

Deno.test("placement and arrangement conversions round-trip", () => {
  for (const [i, a] of ARRANGEMENTS.entries()) {
    const p = arrangementToPlacement(a);
    const back = placementToArrangement(p);
    assertNotEquals(back, null);
    assertEquals(arrangementIndex(back!), i);
  }
  assertEquals(placementToArrangement([0, 4, null]), null);
  assertEquals(characterAt([0, 4, 8], 4), 1);
  assertEquals(characterAt([0, 4, 8], 5), null);
});
