/**
 * Captures the screenshots listed in the web app manifest (shown by Android and desktop browsers in the install
 * dialog). They are not precached by the service worker.
 * Usage: deno task screenshots   (builds the app first)
 */

import { type Browser, chromium, type Page } from "playwright";
import { ARRANGEMENTS, arrangementToPlacement } from "../src/core/board.ts";
import { analyzeTable, trueCards } from "../src/core/solver.ts";
import { launchOptions } from "../e2e/browser.ts";
import { startPreview } from "../e2e/server.ts";

const OUT = "public/screenshots";
const NARROW = { viewport: { width: 360, height: 780 }, scale: 3 }; // 1080 x 2340
const WIDE = { viewport: { width: 1280, height: 800 }, scale: 1.5 }; // 1920 x 1200

/** Starts a Practice game and leaves it mid-search: characters placed, part of the best group selected. */
async function playRound(page: Page): Promise<void> {
  await page.click('[data-mode="practice"]');
  await page.waitForSelector(".card[data-card-id]");
  const ids = await page.$$eval(".card[data-card-id]", (els) => els.map((e) => e.getAttribute("data-card-id")!));
  const arrangement = analyzeTable(ids).optimal[0];
  for (const [character, cell] of arrangementToPlacement(ARRANGEMENTS[arrangement]).entries()) {
    await page.click(`[data-tray-slot="${character}"]`);
    await page.click(`[data-cell="${cell}"]`);
  }
  const best = trueCards(ids, arrangement);
  for (const id of best.slice(0, best.length - 2)) await page.click(`.card[data-card-id="${id}"]`);
}

async function capture(
  browser: Browser,
  url: string,
  file: string,
  size: { viewport: { width: number; height: number }; scale: number },
  setup?: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.scale, locale: "en-US" });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector("h1, .board-cells");
  await setup?.(page);
  await page.evaluate(() => globalThis.scrollTo(0, 0)); // Clicks may have scrolled the page.
  await page.screenshot({ path: `${OUT}/${file}`, type: "jpeg", quality: 85, animations: "disabled" });
  await context.close();
  console.log(`Wrote ${OUT}/${file}`);
}

await Deno.mkdir(OUT, { recursive: true });
const server = await startPreview(4177);
const browser = await chromium.launch(launchOptions());
try {
  const url = `${server.url}?seed=7`;
  await capture(browser, url, "home-narrow.jpg", NARROW);
  await capture(browser, url, "game-narrow.jpg", NARROW, playRound);
  await capture(browser, url, "game-wide.jpg", WIDE, playRound);
} finally {
  await browser.close();
  await server.close();
}
