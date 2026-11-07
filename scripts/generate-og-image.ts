/**
 * Generates public/og-image.jpg (1200 x 630), the preview image shown when the game's link is shared
 * (Open Graph / Twitter card). Built from the game's own artwork and card captions.
 * Kept as a small JPEG on purpose: WhatsApp silently drops preview images that are too heavy (keep it < 150 KB).
 * Usage: deno task og-image
 */

import { chromium } from "playwright";
import { cellIndex, isDark } from "../src/core/board.ts";
import { getCard } from "../src/core/cards.ts";
import { MESSAGES } from "../src/i18n/index.ts";
import { glyphSvg } from "../src/ui/glyph.ts";
import { characterSvg, spriteMarkup } from "../src/ui/sprite.ts";
import { launchOptions } from "../e2e/browser.ts";

const OUT = "public/og-image.jpg";
const MAX_BYTES = 150_000;

// Star on A1, Circle on C2, Square on B3; both cards below are true for this arrangement.
const PLACEMENT: Record<number, number> = { [cellIndex(0, 0)]: 0, [cellIndex(1, 2)]: 1, [cellIndex(2, 1)]: 2 };
const CARDS = [
  { id: "ROW-STAR-1", group: "#4a86e8", style: "left: 548px; top: 330px; transform: rotate(-7deg);" },
  { id: "TOUCH-CIRCLE-SQUARE", group: "#17a596", style: "left: 972px; top: 352px; transform: rotate(6deg);" },
];

const cells = Array.from({ length: 9 }, (_, cell) => {
  const dark = isDark(Math.floor(cell / 3), cell % 3);
  const character = PLACEMENT[cell];
  return `<div class="cell ${dark ? "dark" : ""}">${character === undefined ? "" : characterSvg(character)}</div>`;
}).join("");

const cards = CARDS.map(({ id, group, style }) => {
  const card = getCard(id);
  return `<div class="card" style="${style} --group: ${group}"><div class="band"></div>${glyphSvg(card.glyph)}` +
    `<p>${MESSAGES.en.cardCaption(card.glyph)}</p></div>`;
}).join("");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; }
  .og {
    position: relative; width: 1200px; height: 630px; overflow: hidden;
    font-family: ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    color: #f3f6fb;
    background: radial-gradient(120% 90% at 20% 0%, #1e4166 0%, #15304d 50%, #0d2137 100%);
  }
  .text { position: absolute; left: 72px; top: 92px; width: 470px; }
  .characters { display: flex; gap: 14px; margin-bottom: 18px; }
  .characters svg { width: 58px; height: 58px; filter: drop-shadow(0 4px 4px rgba(0,0,0,.3)); }
  h1 { margin: 0; font-size: 104px; font-weight: 900; letter-spacing: 0.01em; line-height: 1; }
  .tagline { margin: 22px 0 0; font-size: 30px; font-weight: 700; color: #ffc94d; line-height: 1.25; }
  .pitch { margin: 18px 0 0; font-size: 25px; line-height: 1.35; color: #c9d5e3; }
  .url { position: absolute; left: 72px; bottom: 56px; font-size: 24px; font-weight: 700; color: #8fa6c2; }
  .board {
    position: absolute; left: 690px; top: 70px;
    display: grid; grid-template-columns: repeat(3, 120px); grid-template-rows: repeat(3, 120px);
    border: 8px solid #0b1c2e; border-radius: 18px; overflow: hidden;
    box-shadow: 0 18px 40px rgba(0,0,0,.45);
  }
  .cell { display: grid; place-items: center; background: #f7eedb; }
  .cell.dark {
    background: repeating-linear-gradient(45deg, rgba(125,100,64,.38) 0 4px, transparent 4px 13px), #cdb894;
  }
  .cell svg { width: 96px; height: 96px; filter: drop-shadow(0 5px 4px rgba(0,0,0,.3)); }
  .card {
    position: absolute; width: 190px; padding: 22px 10px 12px; border-radius: 16px; overflow: hidden;
    background: #fffaf0; color: #1d2433; box-shadow: 0 14px 30px rgba(0,0,0,.45);
  }
  .card .band { position: absolute; left: 0; right: 0; top: 0; height: 9px; background: var(--group); }
  .card svg { display: block; width: 100%; height: auto; }
  .card p { margin: 6px 0 0; font-size: 17px; font-weight: 700; line-height: 1.2; text-align: center; }
</style></head><body>${spriteMarkup()}<div class="og">
  <div class="text">
    <div class="characters">${[0, 1, 2].map((c) => characterSvg(c)).join("")}</div>
    <h1>Trilemma</h1>
    <p class="tagline">Three characters. Nine cells.<br>Too many rules.</p>
    <p class="pitch">A logic game: find the largest group of rules that can all be true at once.</p>
  </div>
  <div class="url">trilemma.lonebee.games</div>
  <div class="board">${cells}</div>
  ${cards}
</div></body></html>`;

const browser = await chromium.launch(launchOptions());
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: OUT, type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  const { size } = await Deno.stat(OUT);
  if (size > MAX_BYTES) throw new Error(`${OUT} is ${size} bytes: too heavy for WhatsApp previews`);
  console.log(`Wrote ${OUT} (${Math.round(size / 1024)} KB)`);
} finally {
  await browser.close();
}
