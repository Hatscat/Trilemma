/**
 * Generates the app icons (favicon.svg and PNG icons) from the character artwork.
 * Usage: deno task icons   (uses Playwright and the browser set up for the e2e tests)
 */

import { chromium } from "playwright";
import { isDark } from "../src/core/board.ts";
import { CHARACTER_MARKUP, COLORS } from "../src/ui/sprite.ts";
import { launchOptions } from "../e2e/browser.ts";

const BACKGROUND = "#15304d";

/** The board with the three characters on the main diagonal, in a 512 x 512 view box. */
function iconSvg(options: { rounded: boolean; boardSize: number }): string {
  const cell = options.boardSize / 3;
  const x0 = (512 - options.boardSize) / 2;
  let board = `<rect x="${x0 - 10}" y="${x0 - 10}" width="${options.boardSize + 20}" ` +
    `height="${options.boardSize + 20}" rx="26" fill="#0b1c2e"/>`;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      board += `<rect x="${x0 + c * cell}" y="${x0 + r * cell}" width="${cell}" height="${cell}" ` +
        `fill="${isDark(r, c) ? COLORS.cellDark : COLORS.cellLight}"/>`;
    }
  }
  const pad = cell * 0.08;
  const characters = [0, 1, 2].map((i) =>
    `<svg x="${x0 + i * cell + pad}" y="${x0 + i * cell + pad}" width="${cell - 2 * pad}" ` +
    `height="${cell - 2 * pad}" viewBox="0 0 100 100">${CHARACTER_MARKUP[i]}</svg>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
    `<rect width="512" height="512" rx="${options.rounded ? 112 : 0}" fill="${BACKGROUND}"/>` +
    `${board}${characters}</svg>`;
}

const ICONS = [
  { file: "public/icons/icon-192.png", size: 192, svg: iconSvg({ rounded: true, boardSize: 330 }) },
  { file: "public/icons/icon-512.png", size: 512, svg: iconSvg({ rounded: true, boardSize: 330 }) },
  // Maskable icons are cropped by the OS: keep the board inside the central safe zone.
  { file: "public/icons/maskable-512.png", size: 512, svg: iconSvg({ rounded: false, boardSize: 264 }) },
  { file: "public/icons/apple-touch-icon.png", size: 180, svg: iconSvg({ rounded: false, boardSize: 330 }) },
];

await Deno.mkdir("public/icons", { recursive: true });
await Deno.writeTextFile("public/favicon.svg", iconSvg({ rounded: true, boardSize: 360 }) + "\n");

const browser = await chromium.launch(launchOptions());
try {
  for (const icon of ICONS) {
    // Always lay out at 512 px and scale the output: tiny viewports are unreliable in Chrome.
    const context = await browser.newContext({
      viewport: { width: 512, height: 512 },
      deviceScaleFactor: icon.size / 512,
    });
    const page = await context.newPage();
    const svg = icon.svg.replace("<svg ", '<svg width="512" height="512" ');
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.screenshot({ path: icon.file, omitBackground: true });
    await context.close();
    console.log(`Wrote ${icon.file}`);
  }
} finally {
  await browser.close();
}
console.log("Wrote public/favicon.svg");
