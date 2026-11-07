/** "How to play" screen, with a legend of the card families. */

import { type Card, getCard } from "../core/cards.ts";
import { cardCaption, t } from "../i18n/index.ts";
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

const ICON_PLACEHOLDERS: Record<string, number> = { "{star}": 0, "{circle}": 1, "{square}": 2 };

/** Text with `{star}`-style placeholders replaced by inline character icons. */
function richText(text: string): (string | HTMLElement)[] {
  return text.split(/(\{star\}|\{circle\}|\{square\})/).map((part) =>
    part in ICON_PLACEHOLDERS
      ? h("span", { class: "inline-character", html: characterSvg(ICON_PLACEHOLDERS[part]) })
      : part
  );
}

function exampleCard(card: Card): HTMLElement {
  return h(
    "figure",
    { class: "legend-card", "data-group": card.family.group },
    h("span", { class: "card-glyph", html: glyphSvg(card.glyph) }),
    h(
      "figcaption",
      {},
      cardCaption(card),
      card.family.tier === "expert" ? h("em", {}, ` ${t().rules.expertDeck}`) : null,
    ),
  );
}

export function renderRules(onBack: () => void): HTMLElement {
  const m = t();
  const blocks = m.rules.blocks.map((block) => {
    if ("h2" in block) return h("h2", {}, block.h2);
    if ("p" in block) return h("p", {}, ...richText(block.p));
    return h("ol", {}, ...block.ol.map((item) => h("li", {}, ...richText(item))));
  });
  return h(
    "main",
    { class: "screen rules" },
    h(
      "header",
      { class: "page-header" },
      h("button", { type: "button", class: "icon-btn", "aria-label": m.game.back, html: ICONS.back, onclick: onBack }),
      h("h1", {}, m.rules.title),
    ),
    h("article", { class: "rules-text" }, ...blocks),
    h("section", { class: "legend", "aria-label": m.rules.examplesLabel }, ...EXAMPLES.map(getCard).map(exampleCard)),
  );
}
