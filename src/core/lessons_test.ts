import { assertEquals } from "@std/assert";
import { newScriptedGame, TABLE_SIZE, tableCards } from "./game.ts";
import { LESSONS } from "./lessons.ts";
import { analyzeTable } from "./solver.ts";

Deno.test("each tutorial lesson has the maximum its texts announce", () => {
  assertEquals(LESSONS.map((l) => l.max), [3, 3, 4]);
  for (const lesson of LESSONS) assertEquals(analyzeTable(lesson.cards).max, lesson.max, lesson.id);
});

Deno.test("a scripted game deals its cards in order and leaves the other slots empty", () => {
  const lesson = LESSONS[0];
  const state = newScriptedGame(
    { mode: lesson.mode, deck: "base", timerSeconds: null, seed: 0, pro: false },
    lesson.cards,
    0,
  );
  assertEquals(tableCards(state), lesson.cards);
  assertEquals(state.table.length, TABLE_SIZE);
  assertEquals(state.table.filter((id) => id === null).length, TABLE_SIZE - lesson.cards.length);
  assertEquals(state.pile, []);
  assertEquals(state.target, lesson.max);
});
