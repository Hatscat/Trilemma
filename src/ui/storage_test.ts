import { assertEquals } from "@std/assert";
import { newGame } from "../core/game.ts";
import { migrateRecords, migrateSavedGame, type SavedGame } from "./storage.ts";

Deno.test("a saved game from v0.2 in challenge mode is migrated to practice mode", () => {
  const state = newGame({ mode: "practice", deck: "base", timerSeconds: null, seed: 1 }, 0);
  const legacy = {
    savedAt: 5,
    state: { ...state, config: { ...state.config, mode: "challenge" } },
  } as unknown as SavedGame;
  assertEquals(migrateSavedGame(legacy), { savedAt: 5, state });
  const current: SavedGame = { savedAt: 5, state };
  assertEquals(migrateSavedGame(current), current);
});

Deno.test("records from v0.2 keep their values under the new mode name", () => {
  const record = { played: 3, bestRounds: 9, bestTimeMs: 61_000 };
  assertEquals(
    migrateRecords({ "challenge-base": record, "classic-full": record }),
    { "practice-base": record, "classic-full": record },
  );
});
