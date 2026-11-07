/**
 * End-to-end tests of the production build, driven by Playwright.
 * Run with: deno task e2e   (builds first, then serves dist/ with vite preview)
 * Screenshots of the main screens are written to e2e/artifacts/ for visual review.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { type Browser, type BrowserContext, type BrowserContextOptions, chromium, type Page } from "playwright";
import { ARRANGEMENTS, arrangementToPlacement } from "../src/core/board.ts";
import { getCard } from "../src/core/cards.ts";
import { LESSONS } from "../src/core/lessons.ts";
import { MESSAGES } from "../src/i18n/index.ts";
import { type GameConfig, type GameState, newGame, tableCards } from "../src/core/game.ts";
import { analyzeTable, isCardTrue, trueCards } from "../src/core/solver.ts";
import { launchOptions } from "./browser.ts";
import { startPreview } from "./server.ts";

const ARTIFACTS = new URL("./artifacts/", import.meta.url);
const SEED = 42;
const MOBILE = { width: 390, height: 844 };

/** The game the app deals for `?seed=42` with the default settings. */
function expectedGame(mode: GameConfig["mode"]): GameState {
  return newGame({ mode, deck: "base", timerSeconds: null, seed: SEED }, 0);
}

function solve(state: GameState) {
  const cards = tableCards(state);
  const arrangement = analyzeTable(cards).optimal[0];
  return {
    arrangement,
    cards: trueCards(cards, arrangement),
    falseCard: cards.find((id) => !isCardTrue(id, arrangement))!,
  };
}

interface Session {
  readonly context: BrowserContext;
  readonly page: Page;
  /** Closes the context and fails on any uncaught error or console error. */
  close(): Promise<void>;
}

async function newPage(
  browser: Browser,
  viewport = MOBILE,
  locale = "en-US",
  options: BrowserContextOptions = {},
): Promise<Session> {
  const context = await browser.newContext({
    viewport,
    locale,
    deviceScaleFactor: 2,
    hasTouch: viewport.width < 600,
    ...options,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return {
    context,
    page,
    close: async () => {
      await context.close();
      assertEquals(errors, [], `Browser errors:\n${errors.join("\n")}`);
    },
  };
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: new URL(`${name}.png`, ARTIFACTS).pathname, animations: "disabled" });
}

async function placeArrangement(page: Page, arrangement: number): Promise<void> {
  for (const [character, cell] of arrangementToPlacement(ARRANGEMENTS[arrangement]).entries()) {
    await page.click(`[data-tray-slot="${character}"]`);
    await page.click(`[data-cell="${cell}"]`);
  }
}

async function selectCards(page: Page, ids: readonly string[]): Promise<void> {
  for (const id of ids) await page.click(`.card[data-card-id="${id}"]`);
}

async function status(page: Page): Promise<string> {
  return (await page.textContent(".status-main")) ?? "";
}

async function lockInBid(page: Page, bid: number): Promise<void> {
  await page.click('[data-action="lock-in"]');
  await page.click(`.bid-option[data-bid="${bid}"]`);
  await page.click('[data-action="confirm-bid"]');
  await page.waitForSelector('[data-action="demonstrate"]');
}

Deno.test({
  name: "Trilemma PWA",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    await Deno.mkdir(ARTIFACTS, { recursive: true });
    const server = await startPreview();
    const browser = await chromium.launch(launchOptions());
    const home = `${server.url}?seed=${SEED}`;

    try {
      await t.step("home screen links the manifest and offers both modes", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        assertEquals(await page.textContent("h1"), "Trilemma");
        assertEquals(await page.getAttribute('link[rel="manifest"]', "href"), "./manifest.webmanifest");
        // Link previews: the image URL points to production, the same file is served by this build.
        const ogImage = (await page.getAttribute('meta[property="og:image"]', "content"))!;
        assertEquals(ogImage, "https://trilemma.lonebee.games/og-image.jpg");
        assertEquals(await page.getAttribute('meta[name="twitter:card"]', "content"), "summary_large_image");
        const preview = await page.evaluate(() => fetch("./og-image.jpg").then((r) => r.headers.get("content-type")));
        assertEquals(preview, "image/jpeg");
        assert(await page.isVisible('[data-mode="classic"]'));
        assert(await page.isVisible('[data-mode="practice"]'));
        await screenshot(page, "01-home");
        await session.close();
      });

      await t.step("classic: a valid demonstration wins the cards", async () => {
        const game = expectedGame("classic");
        const { arrangement, cards } = solve(game);
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="classic"]');
        await page.waitForSelector(".board-cells");
        const shown = await page.$$eval(".card[data-card-id]", (els) => els.map((e) => e.getAttribute("data-card-id")));
        assertEquals(shown, game.table);

        // The search happens in the head: the board and the cards are locked until the bid.
        assertEquals(await page.getAttribute('[data-cell="0"]', "aria-disabled"), "true");
        await page.click('[data-tray-slot="0"]', { force: true });
        await page.click('[data-cell="0"]', { force: true });
        await page.click(`.card[data-card-id="${cards[0]}"]`, { force: true });
        assertEquals(await page.getAttribute('[data-cell="0"]', "data-occupant"), "null");
        assertEquals(await page.getAttribute(`.card[data-card-id="${cards[0]}"]`, "aria-pressed"), "false");
        assertEquals(await page.locator('[data-action="clear"]').count(), 0);
        const pulse = await page.$eval('[data-action="lock-in"]', (el) => getComputedStyle(el).animationName);
        assertEquals(pulse, "cta-pulse", "Lock in pulses while the board is locked");
        await screenshot(page, "02-classic-search");

        await lockInBid(page, cards.length);
        assertStringIncludes(await status(page), `Bid: ${cards.length}`);
        assertEquals(await page.textContent(".target-number"), String(cards.length), "the bid is shown at the top");
        await placeArrangement(page, arrangement);
        await selectCards(page, cards);
        await screenshot(page, "02b-classic-demonstration");
        await page.click('[data-action="demonstrate"]');
        await page.waitForSelector('[data-action="next-round"]');
        assertStringIncludes(await status(page), `Valid demonstration! +${cards.length}`);
        assertEquals(await page.locator(".card-slot.is-true").count(), cards.length);
        await screenshot(page, "03-classic-result");

        await page.click('[data-action="next-round"]');
        assertEquals(await page.textContent(".round"), "Round 2");
        assertStringIncludes((await page.textContent(".stats")) ?? "", `Won ${cards.length}`);
        await session.close();
      });

      await t.step("classic: one false card voids the demonstration", async () => {
        const game = expectedGame("classic");
        const { arrangement, cards, falseCard } = solve(game);
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="classic"]');
        await lockInBid(page, cards.length);
        await placeArrangement(page, arrangement);
        await selectCards(page, [...cards.slice(1), falseCard]);
        await page.click('[data-action="demonstrate"]');
        await page.waitForSelector('[data-action="next-round"]');
        assertStringIncludes(await status(page), `Card ${getCard(falseCard).number} is false`);
        assertStringIncludes(await status(page), "Nobody scores");
        await page.click('[data-action="toggle-solution"]');
        assertEquals(await page.locator(".card-slot.is-solution").count(), cards.length);
        await screenshot(page, "04-classic-void-solution");
        await page.click('[data-action="next-round"]');
        assertStringIncludes((await page.textContent(".stats")) ?? "", "Won 0");
        const shown = await page.$$eval(".card[data-card-id]", (els) => els.map((e) => e.getAttribute("data-card-id")));
        assertEquals(shown, game.table, "the same cards stay after a void demonstration");
        await session.close();
      });

      await t.step("classic: the timer forces the bid when it runs out", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.clock.install();
        await page.goto(home);
        await page.click('label[for="timer-1"]'); // 1 min
        await page.click('[data-mode="classic"]');
        assertEquals(await page.textContent(".clock"), "1:00");
        await page.clock.runFor(61_000);
        await page.waitForSelector(".bid-dialog");
        assertEquals(await page.textContent(".bid-dialog h2"), "Time's up!");
        assertEquals(await page.locator(".bid-dialog .btn-ghost").count(), 0, "a forced bid cannot be cancelled");
        await page.keyboard.press("Escape");
        assert(await page.isVisible(".bid-dialog"));
        await page.click('.bid-option[data-bid="3"]');
        await page.click('[data-action="confirm-bid"]');
        await page.waitForSelector('[data-action="demonstrate"]');
        assertStringIncludes(await status(page), "Bid: 3");
        await session.close();
      });

      await t.step("practice: a wrong check is a mistake, the right group wins", async () => {
        const game = expectedGame("practice");
        const { arrangement, cards, falseCard } = solve(game);
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="practice"]');
        assertStringIncludes(await status(page), `Find ${game.target} cards`);
        assertEquals(await page.textContent(".target-number"), String(game.target), "the target is shown at the top");
        assertEquals(await page.textContent(".target-text"), "cards to find");
        await placeArrangement(page, arrangement);
        await selectCards(page, [...cards.slice(1), falseCard]);
        await page.click('[data-action="check"]');
        assertStringIncludes(await status(page), `Card ${getCard(falseCard).number} is false`);
        assertStringIncludes((await page.textContent(".stats")) ?? "", "Mistakes 1");
        assertEquals(await page.locator(".pip.is-on").count(), cards.length);
        await screenshot(page, "05-practice-mistake");
        await selectCards(page, [falseCard, cards[0]]);
        await page.click('[data-action="check"]');
        await page.waitForSelector('[data-action="next-round"]');
        assertStringIncludes(await status(page), `Well done! +${cards.length}`);
        assertStringIncludes((await page.textContent(".status-detail")) ?? "", "1 mistake");
        await session.close();
      });

      await t.step("a full practice game ends with a summary and a record", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="practice"]');
        let rounds = 0;
        for (let guard = 0; guard < 40; guard++) {
          await page.waitForSelector(".card[data-card-id]");
          const ids = await page.$$eval(
            ".card[data-card-id]",
            (els) => els.map((e) => e.getAttribute("data-card-id")!),
          );
          const arrangement = analyzeTable(ids).optimal[0];
          await placeArrangement(page, arrangement);
          await selectCards(page, trueCards(ids, arrangement));
          await page.click('[data-action="check"]');
          const next = page.locator('[data-action="next-round"]');
          await next.waitFor();
          const label = await next.textContent();
          await next.click();
          rounds++;
          if (label === "See results") break;
        }
        await page.waitForSelector("dialog .summary");
        assertEquals(await page.textContent("dialog h2"), "Deck cleared!");
        assertStringIncludes((await page.textContent("dialog .summary")) ?? "", `Rounds${rounds}`);
        assertStringIncludes((await page.textContent("dialog")) ?? "", "New record");
        await screenshot(page, "09-game-over");
        await page.click("dialog >> text=Menu");
        assertStringIncludes((await page.textContent(".records")) ?? "", `${rounds} rounds`);
        await session.close();
      });

      await t.step("the interface and the card captions can be played in French and Spanish", async () => {
        const game = expectedGame("classic");
        const first = getCard(game.table[0]!);
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('label[for="lang-1"]'); // Français
        assertEquals(await page.getAttribute("html", "lang"), "fr");
        assertEquals(await page.textContent(".tagline"), MESSAGES.fr.home.tagline);
        await screenshot(page, "10-home-fr");
        await page.click('[data-mode="classic"]');
        assertEquals(
          await page.textContent('.card-slot[data-slot="0"] .card-text'),
          MESSAGES.fr.cardCaption(first.glyph),
        );
        assertEquals(await page.textContent('[data-action="lock-in"]'), "Annoncer");
        await screenshot(page, "11-classic-fr");
        await page.click('[data-action="exit"]');
        await page.click('label[for="lang-2"]'); // Español
        assertEquals(await page.textContent(".resume strong"), "Continuar");
        await page.reload();
        assertEquals(await page.getAttribute("html", "lang"), "es", "the language choice is remembered");
        await session.close();
      });

      await t.step("the language follows the browser preferences by default", async () => {
        const session = await newPage(browser, MOBILE, "es-ES");
        const { page } = session;
        await page.goto(home);
        assertEquals(await page.getAttribute("html", "lang"), "es");
        assertEquals(await page.textContent(".tagline"), MESSAGES.es.home.tagline);
        await session.close();
      });

      await t.step("the tutorial teaches the game in three lessons", async () => {
        const session = await newPage(browser);
        const { page } = session;
        const step = (name: string) => page.waitForSelector(`.coach[data-step="${name}"]`);
        const next = () => page.click("[data-coach-next]");
        const solveLesson = async (index: number, withCheck: boolean) => {
          const { cards } = LESSONS[index];
          const arrangement = analyzeTable(cards).optimal[0];
          await placeArrangement(page, arrangement);
          await selectCards(page, trueCards(cards, arrangement));
          if (withCheck) await page.click('[data-action="check"]');
        };
        await page.goto(home);
        await page.click('[data-mode="tutorial"]');

        // Lesson 1: the board.
        await step("meet");
        await next();
        await step("board");
        await next();
        await step("place");
        await screenshot(page, "12-tutorial-place");
        const lesson1 = LESSONS[0].cards;
        await placeArrangement(page, analyzeTable(lesson1).optimal[0]);
        await step("allThree"); // The Star is already in row 1: that step is skipped.
        await selectCards(page, lesson1);
        await page.click('[data-action="check"]');
        await step("boardDone");
        await page.click('[data-action="continue"]');

        // Lesson 2: contradictions.
        await step("contradiction");
        await next();
        await step("largest");
        await solveLesson(1, true);
        await step("contradictionsDone");
        await page.click('[data-action="continue"]');

        // Lesson 3: classic mode, with a void demonstration first.
        await step("classicIntro");
        await next();
        await step("lockIn");
        const lesson3 = LESSONS[2].cards;
        const arrangement = analyzeTable(lesson3).optimal[0];
        const good = trueCards(lesson3, arrangement);
        const bad = lesson3.find((id) => !isCardTrue(id, arrangement))!;
        await page.click('[data-cell="0"]', { force: true }); // Locked while searching.
        assertEquals(await page.getAttribute('[data-cell="0"]', "data-occupant"), "null");
        await lockInBid(page, 4);
        await step("prove");
        await placeArrangement(page, arrangement);
        await selectCards(page, [...good.slice(1), bad]);
        await page.click('[data-action="demonstrate"]');
        await step("retry");
        await page.click('[data-action="next-round"]');
        await step("lockIn");
        await lockInBid(page, 4);
        await solveLesson(2, false);
        await page.click('[data-action="demonstrate"]');
        await step("classicDone");
        await screenshot(page, "13-tutorial-done");
        await page.click('[data-action="continue"]'); // Finish

        await page.waitForSelector(".home");
        assertEquals(await page.locator('[data-mode="tutorial"]').count(), 0, "the tutorial card is gone once done");
        await session.close();
      });

      await t.step("the golden rule: a placed character locks its row and its column", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="practice"]');
        await page.click('[data-cell="0"]'); // The Star goes to A1.
        await page.click('[data-tray-slot="1"]'); // Select the Circle.
        // A1's row (B1, C1) and column (A2, A3) are locked for the Circle; the 4 other empty cells are free.
        assertEquals(await page.locator(".cell.is-blocked").count(), 4);
        assertEquals(await page.locator(".cell.is-free").count(), 4);
        await screenshot(page, "16-golden-rule");
        await page.click('[data-cell="2"]'); // C1: refused, nothing moves.
        assertEquals(await page.getAttribute('[data-cell="2"]', "data-occupant"), "null");
        assertEquals(await page.getAttribute('[data-cell="0"]', "data-occupant"), "0", "the Star stays");
        assertStringIncludes(await status(page), "The Star already uses this row or column");
        await page.click('[data-cell="4"]'); // B2 is free.
        assertEquals(await page.getAttribute('[data-cell="4"]', "data-occupant"), "1");
        // The lanes: A2 lies in the Star's column and the Circle's row.
        const lanes = await page.$eval('[data-cell="3"]', (el) => [
          (el as HTMLElement).style.getPropertyValue("--row-lane"),
          (el as HTMLElement).style.getPropertyValue("--col-lane"),
        ]);
        assertEquals(lanes, ["var(--lane-1)", "var(--lane-0)"]);
        await session.close();
      });

      await t.step("a frantic multi-finger drag leaves no ghost image behind", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="practice"]');
        await page.waitForSelector('[data-tray-slot="1"] svg');
        await page.evaluate(() => {
          const fire = (target: Element, type: string, id: number, x: number, y: number, primary: boolean) =>
            target.dispatchEvent(
              new PointerEvent(type, {
                bubbles: true,
                pointerId: id,
                isPrimary: primary,
                clientX: x,
                clientY: y,
                button: 0,
                pointerType: "touch",
              }),
            );
          const star = document.querySelector('[data-tray-slot="0"] svg')!;
          const circle = document.querySelector('[data-tray-slot="1"] svg')!;
          fire(star, "pointerdown", 1, 10, 10, true);
          fire(star, "pointermove", 1, 60, 60, true);
          fire(circle, "pointerdown", 2, 20, 20, false); // A second finger, mid-drag.
          fire(circle, "pointermove", 2, 90, 90, false);
          fire(circle, "pointerup", 2, 90, 90, false);
          fire(star, "pointerup", 1, 5, 5, true);
        });
        assertEquals(await page.locator(".drag-ghost").count(), 0);
        await page.click('[data-action="exit"]');
        assertEquals(await page.locator(".drag-ghost").count(), 0);
        await session.close();
      });

      await t.step("characters can be dragged onto the board and sent back", async () => {
        const session = await newPage(browser, { width: 1280, height: 800 });
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="practice"]');
        const from = (await page.locator('[data-tray-slot="1"]').boundingBox())!;
        const to = (await page.locator('[data-cell="4"]').boundingBox())!;
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
        await page.mouse.up();
        assertEquals(await page.getAttribute('[data-cell="4"]', "data-occupant"), "1");
        await screenshot(page, "06-desktop-drag");
        await page.click('[data-tray-slot="1"]');
        assertEquals(await page.getAttribute('[data-cell="4"]', "data-occupant"), "null");
        await session.close();
      });

      await t.step("card zoom shows a readable caption", async () => {
        const id = expectedGame("practice").table[0]!;
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);

        // Classic search: the zoom only reads the card, selecting comes after the bid.
        await page.click('[data-mode="classic"]');
        await page.click(`[data-zoom="${id}"]`);
        assertEquals(await page.textContent(".zoom-text"), getCard(id).text);
        assertEquals(await page.locator(".zoom-dialog .btn-primary").count(), 0);
        await page.click(".zoom-dialog .btn-ghost"); // Close
        await page.click('[data-action="exit"]');

        // Practice: the zoom can select the card.
        await page.click('[data-mode="practice"]');
        await page.click(".dialog-actions .btn-primary"); // Confirm the new game
        await page.click(`[data-zoom="${id}"]`);
        await screenshot(page, "07-zoom");
        await page.click(".zoom-dialog .btn-primary"); // Select
        assertEquals(await page.getAttribute(`.card[data-card-id="${id}"]`, "aria-pressed"), "true");
        await session.close();
      });

      await t.step("the game in progress survives a reload", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.click('[data-mode="practice"]');
        await page.click('[data-cell="0"]');
        await page.reload();
        await page.waitForSelector(".board-cells");
        assertEquals(await page.getAttribute('[data-cell="0"]', "data-occupant"), "0");
        await page.click('[data-action="exit"]');
        assertStringIncludes((await page.textContent(".resume")) ?? "", "Practice · round 1");
        await session.close();
      });

      await t.step("rules screen shows the card legend", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(`${home}#/rules`);
        assertEquals(await page.textContent(".page-header h1"), "How to play");
        assertEquals(await page.locator(".legend-card").count(), 12);
        await screenshot(page, "08-rules");
        await session.close();
      });

      await t.step("Chrome considers the app installable, and it launches full screen", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
        const manifest = await page.evaluate(() => fetch("./manifest.webmanifest").then((r) => r.json()));
        assertEquals(manifest.display, "fullscreen");
        assertEquals(manifest.start_url, "./");
        for (const shot of manifest.screenshots as { src: string }[]) {
          assertEquals(await page.evaluate((src) => fetch(src).then((r) => r.status), shot.src), 200, shot.src);
        }
        const cdp = await session.context.newCDPSession(page);
        const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors") as {
          installabilityErrors: { errorId: string }[];
        };
        // Test contexts are incognito-like: that is the only acceptable reason.
        assertEquals(installabilityErrors.filter((e) => e.errorId !== "in-incognito"), []);
        await session.close();
      });

      await t.step("the install button appears when the browser offers installation", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        assert(await page.isHidden(".install-card"), "nothing to install before the browser offers it");
        await page.evaluate(() => {
          const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
            prompt: () => {
              (globalThis as unknown as { prompted: boolean }).prompted = true;
              return Promise.resolve();
            },
            userChoice: Promise.resolve({ outcome: "accepted" }),
          });
          globalThis.dispatchEvent(event);
        });
        await page.waitForSelector(".install-card", { state: "visible" });
        await screenshot(page, "14-install");
        await page.click(".install-card");
        await page.waitForSelector(".install-card", { state: "hidden" });
        assertEquals(await page.evaluate(() => (globalThis as unknown as { prompted: boolean }).prompted), true);
        await session.close();
      });

      const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 " +
        "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

      await t.step("iPhone users get installation instructions", async () => {
        const session = await newPage(browser, MOBILE, "fr-FR", { userAgent: IPHONE });
        const { page } = session;
        await page.goto(home);
        await page.click(".install-card");
        assertEquals(await page.locator(".install-help li").count(), 3);
        assertEquals(await page.locator(".install-help .inline-icon svg").count(), 1, "the Share icon is shown");
        assertStringIncludes((await page.textContent(".install-help")) ?? "", "Sur l’écran d’accueil");
        await screenshot(page, "15-install-iphone");
        await session.close();
      });

      await t.step("an installed app offers no installation", async () => {
        const session = await newPage(browser, MOBILE, "en-US", { userAgent: IPHONE });
        const { page } = session;
        await page.addInitScript(() => {
          const original = globalThis.matchMedia.bind(globalThis);
          globalThis.matchMedia = (query: string) =>
            query.includes("display-mode: fullscreen") ? { ...original(query), matches: true } : original(query);
        });
        await page.goto(home);
        await page.waitForSelector("h1");
        assert(await page.isHidden(".install-card"));
        // Full screen on phones with curved corners: content keeps away from the edges.
        const edge = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--edge"));
        assertEquals(edge.trim(), "16px");
        await session.close();
      });

      await t.step("the app works offline once loaded", async () => {
        const session = await newPage(browser);
        const { page } = session;
        await page.goto(home);
        await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
        await session.context.setOffline(true);
        await page.reload();
        assertEquals(await page.textContent("h1"), "Trilemma");
        await page.click('[data-mode="classic"]');
        await page.waitForSelector(".card[data-card-id]");
        assertEquals(await page.locator(".card[data-card-id]").count(), 9);
        await session.close();
      });
    } finally {
      await browser.close();
      await server.close();
    }
  },
});
