/**
 * HTML templates of the printable edition. Each document is rendered to an A4 PDF by generate.ts.
 * The artwork is the app's own vector SVG (characters, card symbols), so prints are sharp at any size.
 */

import { cellCol, cellRow, COL_LABELS, isDark, ROW_LABELS } from "../src/core/board.ts";
import { type Card, CATALOG, getCard } from "../src/core/cards.ts";
import { type Lang, MESSAGES } from "../src/i18n/index.ts";
import { glyphSvg } from "../src/ui/glyph.ts";
import { characterSvg, spriteMarkup } from "../src/ui/sprite.ts";
import { type Block, PRINT_TEXTS } from "./texts.ts";

export interface PrintDocument {
  readonly file: string;
  readonly html: string;
}

// Card sheets: 9 poker-size cards (63 × 88 mm) per A4 page, centered so fronts and backs line up.
const PAGE_W = 210;
const PAGE_H = 297;
const CARD_W = 63;
const CARD_H = 88;
const GRID_X = (PAGE_W - 3 * CARD_W) / 2;
const GRID_Y = (PAGE_H - 3 * CARD_H) / 2;
const PER_PAGE = 9;

const PLAYER_COLORS = ["#4a86e8", "#e2463d", "#2fa866", "#8e5bd8", "#f28a2e", "#17a596", "#d6457a", "#6b7280"];

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
}

function documentHtml(lang: Lang, title: string, css: string, body: string, extraCss = ""): string {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
    `<style>${css}${extraCss}</style></head><body>${spriteMarkup()}${body}</body></html>`;
}

function page(content: string, className = ""): string {
  return `<section class="page ${className}">${content}</section>`;
}

function footer(text: string): string {
  return `<p class="footer">${escapeHtml(text)}</p>`;
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export function cardFront(card: Card, lang: Lang, x: number, y: number): string {
  const m = MESSAGES[lang];
  const expert = card.family.tier === "expert" ? PRINT_TEXTS[lang].expert : "";
  return `<div class="card" data-group="${card.family.group}" style="left:${x}mm;top:${y}mm">` +
    `<div class="card-band"><span>${card.number}</span><span>${expert}</span></div>` +
    `<div class="card-glyph">${glyphSvg(card.glyph)}</div>` +
    `<p class="card-caption">${escapeHtml(m.cardCaption(card.glyph))}</p>` +
    `<p class="card-family">${escapeHtml(m.familyTitle(card.family.key))}</p></div>`;
}

function cardBack(x: number, y: number): string {
  const characters = [0, 1, 2].map((c) => characterSvg(c)).join("");
  return `<div class="card back" style="left:${x}mm;top:${y}mm">` +
    `<div class="back-characters">${characters}</div><div class="back-title">Trilemma</div></div>`;
}

function slot(index: number): { x: number; y: number } {
  return { x: GRID_X + (index % 3) * CARD_W, y: GRID_Y + Math.floor(index / 3) * CARD_H };
}

/** Crop marks in the margins, on every cutting line of the 3 × 3 grid. */
function cropMarks(): string {
  const marks: string[] = [];
  const line = (x: number, y: number, w: number, h: number) =>
    `<div class="crop" style="left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm"></div>`;
  for (let i = 0; i <= 3; i++) {
    const x = GRID_X + i * CARD_W;
    const y = GRID_Y + i * CARD_H;
    marks.push(line(x - 0.125, 3, 0.25, GRID_Y - 5), line(x - 0.125, GRID_Y + 3 * CARD_H + 2, 0.25, GRID_Y - 5));
    marks.push(line(2, y - 0.125, GRID_X - 4, 0.25), line(GRID_X + 3 * CARD_W + 2, y - 0.125, GRID_X - 4, 0.25));
  }
  return marks.join("");
}

function cardSheets(cards: readonly Card[], lang: Lang, label: string): string {
  const pages = chunk(cards, PER_PAGE);
  return pages.map((group, p) => {
    const fronts = group.map((card, i) => {
      const { x, y } = slot(i);
      return cardFront(card, lang, x, y);
    });
    return page(fronts.join("") + cropMarks() + footer(`Trilemma · ${label} · ${p + 1}/${pages.length}`));
  }).join("");
}

function backSheet(): string {
  return page(Array.from({ length: PER_PAGE }, (_, i) => cardBack(slot(i).x, slot(i).y)).join(""));
}

// ---------------------------------------------------------------------------
// Board, characters, tokens
// ---------------------------------------------------------------------------

function board(lang: Lang): string {
  const cells = Array.from(
    { length: 9 },
    (_, cell) => `<div class="board-cell ${isDark(cellRow(cell), cellCol(cell)) ? "dark" : "light"}"></div>`,
  ).join("");
  const colLabels = COL_LABELS.map((label, c) =>
    `<span class="board-label" style="grid-column:${c + 2};grid-row:1">${label}</span>`
  ).join("");
  const rowLabels = ROW_LABELS.map((label, r) =>
    `<span class="board-label" style="grid-column:1;grid-row:${r + 2}">${label}</span>`
  ).join("");
  return page(
    `<h1 class="sheet-title">Trilemma</h1>` +
      `<div class="board">${colLabels}${rowLabels}<div class="board-cells">${cells}</div></div>` +
      `<p class="board-hint">${escapeHtml(PRINT_TEXTS[lang].boardHint)}</p>`,
    "board-page",
  );
}

function characters(lang: Lang): string {
  const t = PRINT_TEXTS[lang];
  const tokens = () => [0, 1, 2].map((c) => `<div class="token cut">${characterSvg(c)}</div>`).join("");
  const face = (c: number, flipped: boolean) =>
    `<div class="standee-face${flipped ? " flipped" : ""}">${characterSvg(c)}` +
    `<span>${escapeHtml(t.characterNames[c])}</span></div>`;
  const standees = [0, 1, 2].map((c) =>
    `<div class="standee cut">${face(c, true)}<div class="fold"></div>${face(c, false)}</div>`
  ).join("");
  return page(
    `<h1 class="sheet-title">${escapeHtml(t.charactersTitle)}</h1>` +
      `<p class="sheet-help">${escapeHtml(t.charactersHelp)}</p>` +
      `<h2 class="sheet-section">${escapeHtml(t.flatTokens)}</h2>` +
      `<div class="row">${tokens()}</div><div class="row" style="margin-top:6mm">${tokens()}</div>` +
      `<h2 class="sheet-section">${escapeHtml(t.standees)}</h2>` +
      `<div class="row" style="gap:12mm">${standees}</div>`,
    "sheet-page",
  );
}

function bidRows(players: readonly number[]): string {
  return players.map((p) =>
    `<div class="bid-row" style="--player:${PLAYER_COLORS[p]}">` +
    Array.from({ length: 9 }, (_, n) => `<div class="bid-tile cut"><span>${n + 1}</span></div>`).join("") +
    `</div>`
  ).join("");
}

function tokens(lang: Lang): string {
  const t = PRINT_TEXTS[lang];
  const order = (from: number) =>
    Array.from({ length: 4 }, (_, i) => `<div class="order-token cut"><span>${from + i}</span></div>`).join("");
  const first = page(
    `<h1 class="sheet-title">${escapeHtml(t.orderTokensTitle)}</h1>` +
      `<p class="sheet-help">${escapeHtml(t.orderTokensHelp)}</p>` +
      `<div class="row" style="margin-top:6mm">${order(1)}</div>` +
      `<div class="row" style="margin-top:5mm">${order(5)}</div>` +
      `<h2 class="sheet-section" style="margin-top:12mm">${escapeHtml(t.bidTilesTitle)}</h2>` +
      `<p class="sheet-help">${escapeHtml(t.bidTilesHelp)}</p>` +
      bidRows([0, 1, 2, 3]),
    "sheet-page",
  );
  const second = page(
    `<h1 class="sheet-title">${escapeHtml(t.bidTilesMorePlayers)}</h1>` + bidRows([4, 5, 6, 7]),
    "sheet-page",
  );
  return first + second;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

function block(b: Block, lang: Lang): string {
  if ("h2" in b) return `<h2>${escapeHtml(b.h2)}</h2>`;
  if ("p" in b) return `<p>${escapeHtml(b.p)}</p>`;
  if ("card" in b) return `<div class="rules-card">${cardFront(getCard(b.card), lang, 0, 0)}</div>`;
  const tag = "ol" in b ? "ol" : "ul";
  const items = "ol" in b ? b.ol : b.ul;
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function rules(lang: Lang): string {
  const t = PRINT_TEXTS[lang];
  const icons = [0, 1, 2].map((c) => characterSvg(c)).join("");
  return `<article class="rules-doc"><header class="rules-header">${icons}<h1>${
    escapeHtml(t.rulesTitle)
  }</h1></header>` +
    `<p class="rules-subtitle">${escapeHtml(t.rulesSubtitle)}</p>${
      t.rules.map((b) => block(b, lang)).join("")
    }</article>`;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function buildDocuments(lang: Lang, css: string): PrintDocument[] {
  const m = MESSAGES[lang];
  const base = `${m.home.deck} · ${m.home.deckBase.split("·")[0].trim()}`;
  const expert = `${m.home.deck} · ${PRINT_TEXTS[lang].expert}`;
  const t = PRINT_TEXTS[lang];
  return [
    { file: "1-cards-base.pdf", html: documentHtml(lang, base, css, cardSheets(CATALOG.base, lang, base)) },
    { file: "2-cards-expert.pdf", html: documentHtml(lang, expert, css, cardSheets(CATALOG.expert, lang, expert)) },
    { file: "3-card-backs.pdf", html: documentHtml(lang, "Trilemma", css, backSheet()) },
    { file: "4-board.pdf", html: documentHtml(lang, "Trilemma", css, board(lang)) },
    { file: "5-characters.pdf", html: documentHtml(lang, t.charactersTitle, css, characters(lang)) },
    { file: "6-tokens.pdf", html: documentHtml(lang, t.orderTokensTitle, css, tokens(lang)) },
    {
      file: "7-rules.pdf",
      html: documentHtml(lang, t.rulesTitle, css, rules(lang), "@page { margin: 14mm 16mm; }"),
    },
  ];
}
