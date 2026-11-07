import { assert, assertEquals, assertThrows } from "@std/assert";
import { ARRANGEMENTS } from "./board.ts";
import { CATALOG, deckCards, getCard, truthKey } from "./cards.ts";

const all = [...CATALOG.base, ...CATALOG.expert];

Deno.test("the catalog has 55 base cards, 36 expert cards and 53 rejected candidates", () => {
  assertEquals(CATALOG.base.length, 55);
  assertEquals(CATALOG.expert.length, 36);
  assertEquals(CATALOG.rejected.length, 53);
  assertEquals(deckCards("base").length, 55);
  assertEquals(deckCards("full").length, 91);
});

Deno.test("cards are numbered 1 to 91, base deck first, with unique ids", () => {
  assertEquals(all.map((c) => c.number), Array.from({ length: 91 }, (_, i) => i + 1));
  assertEquals(new Set(all.map((c) => c.id)).size, 91);
  assertEquals(getCard("ROW-STAR-1").number, 1);
  assertThrows(() => getCard("NOPE"));
});

Deno.test("no two cards share a truth set, and none is always or never true", () => {
  const keys = all.map(truthKey);
  assertEquals(new Set(keys).size, keys.length);
  for (const k of keys) {
    assert(k.includes("0") && k.includes("1"));
  }
});

Deno.test("decks are balanced: every arrangement satisfies the same number of cards", () => {
  for (const [cards, expected] of [[CATALOG.base, 24], [CATALOG.expert, 12]] as const) {
    for (const a of ARRANGEMENTS) {
      assertEquals(cards.filter((c) => c.test(a)).length, expected);
    }
  }
});

Deno.test("captions are single sentences without negation", () => {
  for (const card of all) {
    assert(/^[A-Z].*\.$/.test(card.text), card.text);
    assert(!/\b(not|never|no)\b/i.test(card.text), card.text);
  }
});
