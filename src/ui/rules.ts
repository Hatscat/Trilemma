/** "How to play" screen, with a legend of the card families. */

import { type Card, CATALOG } from "../core/cards.ts";
import { h, ICONS } from "./dom.ts";
import { glyphSvg } from "./glyph.ts";
import { characterSvg } from "./sprite.ts";

const EXAMPLES = [
  "ROW-STAR-2",
  "COL-CIRCLE-A",
  "CELL-C1",
  "SHADE-SQUARE-DARK",
  "COUNT-LIGHT-2",
  "ABOVE-STAR-CIRCLE",
  "LEFT-CIRCLE-SQUARE",
  "TOUCH-STAR-SQUARE",
  "ROWGAP1-STAR-CIRCLE",
  "COLGAP1-CIRCLE-SQUARE",
  "XROW1-LEFT-STAR",
  "XCOLA-ABOVE-SQUARE",
];

function exampleCard(card: Card): HTMLElement {
  return h(
    "figure",
    { class: "legend-card", "data-group": card.family.group },
    h("span", { class: "card-glyph", html: glyphSvg(card.glyph) }),
    h("figcaption", {}, card.text, card.family.tier === "expert" ? h("em", {}, " Expert deck.") : null),
  );
}

export function renderRules(onBack: () => void): HTMLElement {
  const all = new Map([...CATALOG.base, ...CATALOG.expert].map((c) => [c.id, c]));
  return h(
    "main",
    { class: "screen rules" },
    h(
      "header",
      { class: "page-header" },
      h("button", {
        type: "button",
        class: "icon-btn",
        "aria-label": "Back to the menu",
        html: ICONS.back,
        onclick: onBack,
      }),
      h("h1", {}, "How to play"),
    ),
    h(
      "article",
      { class: "rules-text" },
      h("h2", {}, "The goal"),
      h(
        "p",
        {},
        "Nine rule cards are face up, and they contradict each other. Find the largest group of cards that can all be true at the same time.",
      ),
      h("h2", {}, "The board"),
      h(
        "p",
        { class: "inline-characters" },
        "Three characters, the Star ",
        h("span", { class: "inline-character", html: characterSvg(0) }),
        ", the Circle ",
        h("span", { class: "inline-character", html: characterSvg(1) }),
        " and the Square ",
        h("span", { class: "inline-character", html: characterSvg(2) }),
        ", stand on a 3 × 3 board: exactly one character per row and one per column. Rows are numbered 1 to 3 from top to bottom, columns are lettered A to C from left to right. Corners and center are dark cells, the others are light.",
      ),
      h(
        "p",
        {},
        "Tap a character, then a cell (or drag it). Tapping an empty cell places the next character waiting. A character placed in the row or column of another one sends it back.",
      ),
      h("h2", {}, "Classic mode"),
      h(
        "ol",
        {},
        h("li", {}, "Search the largest compatible group. You can use the board and select cards while you think."),
        h("li", {}, "Lock in your bid: the size of your group. It can never change afterwards."),
        h("li", {}, "Demonstrate: place the characters and select exactly as many cards as your bid."),
        h(
          "li",
          {},
          "All or nothing: if one card is false, the demonstration is void and nobody scores. The same cards stay for the next round.",
        ),
        h("li", {}, "Won cards are replaced from the pile. Empty the deck in as few rounds as possible!"),
      ),
      h("h2", {}, "Challenge mode"),
      h(
        "p",
        {},
        "The size of the largest group is announced. Find a group of that size, place the characters and check. Wrong checks count as mistakes. Any valid group is accepted.",
      ),
      h("h2", {}, "Reading the cards"),
      h(
        "p",
        {},
        "Tap the magnifier of a card (or press and hold the card) to zoom in on it. “Above” and “to the left of” mean any distance. Characters never share a row or a column, so “touching” always means touching at a corner.",
      ),
    ),
    h(
      "section",
      { class: "legend", "aria-label": "Card examples" },
      ...EXAMPLES.map((id) => all.get(id)).filter((c): c is Card => c !== undefined).map(exampleCard),
    ),
  );
}
