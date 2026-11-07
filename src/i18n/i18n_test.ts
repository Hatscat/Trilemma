import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { CATALOG } from "../core/cards.ts";
import { detectLanguage, LANGS, MESSAGES } from "./index.ts";

const cards = [...CATALOG.base, ...CATALOG.expert];

Deno.test("English captions derived from the card faces match the catalog texts", () => {
  for (const card of cards) assertEquals(MESSAGES.en.cardCaption(card.glyph), card.text);
});

Deno.test("every language captions every card, with no duplicate meaning", () => {
  for (const lang of LANGS) {
    const captions = cards.map((card) => MESSAGES[lang].cardCaption(card.glyph));
    assertEquals(new Set(captions).size, cards.length, `${lang}: duplicate captions`);
    for (const caption of captions) {
      assert(/^\p{Lu}.*\.$/u.test(caption), `${lang}: "${caption}"`);
      assert(!caption.includes("undefined"), `${lang}: "${caption}"`);
    }
  }
});

Deno.test("every language names every card family", () => {
  for (const lang of LANGS) {
    for (const card of cards) assertNotEquals(MESSAGES[lang].familyTitle(card.family.key), card.family.key);
  }
});

Deno.test("French uses no-break spaces before double punctuation", () => {
  const fr = MESSAGES.fr;
  assertEquals(fr.game.timesUp, "Temps écoulé ! Fais ton annonce.");
  assertEquals(fr.game.bestPossible(3), "Meilleur possible : 3 cartes.");
  assert(!JSON.stringify(fr.rules.blocks).match(/ [!?:;]/));
});

Deno.test("the language is detected from the browser preferences", () => {
  assertEquals(detectLanguage(["fr-FR", "en"]), "fr");
  assertEquals(detectLanguage(["de-DE", "es-419"]), "es");
  assertEquals(detectLanguage(["de"]), "en");
  assertEquals(detectLanguage([]), "en");
});
