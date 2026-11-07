/**
 * Probability analysis of the rule card game.
 *
 * Usage:
 *   deno run analysis/analyze.ts          # full analysis (markdown on stdout)
 *   deno run analysis/analyze.ts cards    # card catalog (markdown on stdout)
 *
 * Results are deterministic (seeded PRNG).
 */

import { ARRANGEMENTS, darkCount, describeArrangement } from "../src/core/board.ts";
import { buildCatalog, type Card, truthKey } from "../src/core/cards.ts";

const SEED = 20261107;
const DRAW_SAMPLES = 50_000;
const GAME_SAMPLES = 5_000;
const N_RANGE = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16];
const GAME_N = [6, 8, 9, 12];
const ARR_COUNT = ARRANGEMENTS.length;

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

interface Deck {
  readonly name: string;
  readonly cards: readonly Card[];
  /** truth[card][arrangement] = 1 when the card is true for that arrangement. */
  readonly truth: readonly Uint8Array[];
}

function makeDeck(name: string, cards: readonly Card[]): Deck {
  return {
    name,
    cards,
    truth: cards.map((card) => Uint8Array.from(ARRANGEMENTS, (a) => (card.test(a) ? 1 : 0))),
  };
}

interface DrawResult {
  /** Maximum number of mutually compatible cards. */
  readonly max: number;
  /** Arrangements reaching the maximum. */
  readonly optimal: number[];
  /** Number of arrangements reaching max - 1. */
  readonly nearOptimal: number;
  /** Number of distinct card subsets of size `max` that are compatible. */
  readonly distinctSets: number;
}

function analyzeDraw(deck: Deck, drawn: readonly number[]): DrawResult {
  const scores = new Int32Array(ARR_COUNT);
  for (const c of drawn) {
    const row = deck.truth[c];
    for (let a = 0; a < ARR_COUNT; a++) scores[a] += row[a];
  }
  let max = 0;
  for (let a = 0; a < ARR_COUNT; a++) if (scores[a] > max) max = scores[a];
  const optimal: number[] = [];
  let nearOptimal = 0;
  for (let a = 0; a < ARR_COUNT; a++) {
    if (scores[a] === max) optimal.push(a);
    else if (scores[a] === max - 1) nearOptimal++;
  }
  const sets = new Set<string>();
  for (const a of optimal) sets.add(drawn.filter((c) => deck.truth[c][a] === 1).join(","));
  return { max, optimal, nearOptimal, distinctSets: sets.size };
}

const mean = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const sd = (xs: readonly number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const share = (xs: readonly number[], pred: (x: number) => boolean) => xs.filter(pred).length / xs.length;
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const f2 = (x: number) => x.toFixed(2);

function histogram(xs: readonly number[]): Map<number, number> {
  const h = new Map<number, number>();
  for (const x of xs) h.set(x, (h.get(x) ?? 0) + 1);
  return new Map([...h.entries()].sort((a, b) => a[0] - b[0]));
}

function sampleIndices(size: number, n: number, rng: () => number): number[] {
  const idx = Array.from({ length: size }, (_, i) => i);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (size - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n);
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function printStateSpace(): void {
  console.log("## State space\n");
  console.log(`- Legal arrangements: ${ARR_COUNT} (3! row orders × 3! column orders)`);
  const byDark = histogram(ARRANGEMENTS.map(darkCount));
  for (const [dark, count] of byDark) {
    console.log(`- ${count} arrangements with ${dark} character(s) on dark cells and ${3 - dark} on light cells`);
  }
  console.log("");
}

function printDeckSummary(deck: Deck): void {
  console.log(`## Deck "${deck.name}" (${deck.cards.length} cards)\n`);
  const byFamily = new Map<string, Card[]>();
  for (const c of deck.cards) byFamily.set(c.family.title, [...(byFamily.get(c.family.title) ?? []), c]);
  console.log("| Family | Cards | True in (out of 36) |");
  console.log("|---|---:|---|");
  for (const [title, cards] of byFamily) {
    const counts = [...new Set(cards.map((c) => truthKey(c).split("1").length - 1))].sort((a, b) => a - b);
    console.log(`| ${title} | ${cards.length} | ${counts.join(" / ")} |`);
  }
  const allP = deck.truth.map((row) => row.reduce((s, x) => s + x, 0) / ARR_COUNT);
  console.log(`\nMean probability that a random card is true: ${pct(mean(allP))}\n`);

  // All cards in play at once.
  const perArrangement = ARRANGEMENTS.map((_, a) => deck.truth.reduce((s, row) => s + row[a], 0));
  const best = Math.max(...perArrangement);
  const worst = Math.min(...perArrangement);
  console.log("### All cards in play at once\n");
  console.log(`- Maximum compatible cards: **${best}** / ${deck.cards.length}`);
  console.log(`- Minimum (worst arrangement): ${worst}`);
  const h = histogram(perArrangement);
  console.log(
    `- Distribution over the 36 arrangements: ${[...h].map(([k, v]) => `${k} cards → ${v} arr.`).join(", ")}`,
  );
  const bestArr = ARRANGEMENTS.filter((_, a) => perArrangement[a] === best);
  console.log(
    `- Best arrangements (${bestArr.length}): ${bestArr.slice(0, 6).map(describeArrangement).join(" | ")}${
      bestArr.length > 6 ? " | …" : ""
    }`,
  );

  // Pairwise compatibility.
  let pairs = 0;
  let contradictions = 0;
  for (let i = 0; i < deck.cards.length; i++) {
    for (let j = i + 1; j < deck.cards.length; j++) {
      pairs++;
      let ok = false;
      for (let a = 0; a < ARR_COUNT && !ok; a++) ok = deck.truth[i][a] === 1 && deck.truth[j][a] === 1;
      if (!ok) contradictions++;
    }
  }
  console.log(
    `- Card pairs that contradict each other: ${contradictions} / ${pairs} (${pct(contradictions / pairs)})\n`,
  );
}

function printDrawTable(deck: Deck, rng: () => number): Map<number, number[]> {
  console.log(`### Random draws of n cards ("${deck.name}", ${DRAW_SAMPLES.toLocaleString("en-US")} draws per n)\n`);
  console.log(
    "| n | Mean max | SD | Max = n (all compatible) | Most frequent max (share) | Mean optimal arrangements | Unique optimal arrangement | Mean distinct optimal card sets | Unique optimal card set | Mean arrangements at max − 1 |",
  );
  console.log("|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|");
  const maxes = new Map<number, number[]>();
  for (const n of N_RANGE) {
    if (n > deck.cards.length) continue;
    const results: DrawResult[] = [];
    for (let s = 0; s < DRAW_SAMPLES; s++) results.push(analyzeDraw(deck, sampleIndices(deck.cards.length, n, rng)));
    const m = results.map((r) => r.max);
    maxes.set(n, m);
    const h = histogram(m);
    const [modeValue, modeCount] = [...h].reduce((best, cur) => (cur[1] > best[1] ? cur : best));
    const opt = results.map((r) => r.optimal.length);
    const sets = results.map((r) => r.distinctSets);
    console.log(
      `| ${n} | ${f2(mean(m))} | ${f2(sd(m))} | ${pct(share(m, (x) => x === n))} | ${modeValue} (${
        pct(modeCount / m.length)
      }) | ${f2(mean(opt))} | ${pct(share(opt, (x) => x === 1))} | ${f2(mean(sets))} | ${
        pct(share(sets, (x) => x === 1))
      } | ${f2(mean(results.map((r) => r.nearOptimal)))} |`,
    );
  }
  console.log("");
  return maxes;
}

function printMaxDistributions(deck: Deck, maxes: Map<number, number[]>): void {
  console.log(`### Distribution of the maximum ("${deck.name}")\n`);
  const ns = GAME_N.filter((n) => maxes.has(n));
  const values = [...new Set(ns.flatMap((n) => maxes.get(n)!))].sort((a, b) => a - b);
  console.log(`| max | ${ns.map((n) => `n = ${n}`).join(" | ")} |`);
  console.log(`|---:|${ns.map(() => "---:").join("|")}|`);
  for (const v of values) {
    console.log(`| ${v} | ${ns.map((n) => pct(share(maxes.get(n)!, (x) => x === v))).join(" | ")} |`);
  }
  console.log("");
}

function printGameSimulation(deck: Deck, rng: () => number): void {
  console.log(`### Full game simulation ("${deck.name}", ${GAME_SAMPLES.toLocaleString("en-US")} games per n)\n`);
  console.log(
    "Each round, the winner takes all the cards that are true for one optimal arrangement (picked at random among the optimal ones); missing cards are refilled from the deck.\n",
  );
  console.log(
    "| n | Mean rounds per game | Min–max rounds | Mean cards won per round (table full) | All table compatible (table full) | Rounds with a full table | Endgame rounds (deck empty) |",
  );
  console.log("|---:|---:|---|---:|---:|---:|---:|");
  for (const n of GAME_N) {
    if (n > deck.cards.length) continue;
    const roundsPerGame: number[] = [];
    const fullTableWins: number[] = [];
    let fullTableAllCompatible = 0;
    let fullRounds = 0;
    let endRounds = 0;
    for (let g = 0; g < GAME_SAMPLES; g++) {
      const pile = shuffle(Array.from({ length: deck.cards.length }, (_, i) => i), rng);
      const table = pile.splice(0, n);
      let rounds = 0;
      while (table.length > 0) {
        rounds++;
        const full = table.length === n;
        const r = analyzeDraw(deck, table);
        const a = r.optimal[Math.floor(rng() * r.optimal.length)];
        const won = table.filter((c) => deck.truth[c][a] === 1);
        if (full) {
          fullRounds++;
          fullTableWins.push(won.length);
          if (won.length === n) fullTableAllCompatible++;
        } else endRounds++;
        const remaining = table.filter((c) => deck.truth[c][a] === 0);
        table.length = 0;
        table.push(...remaining, ...pile.splice(0, n - remaining.length));
      }
      roundsPerGame.push(rounds);
    }
    console.log(
      `| ${n} | ${f2(mean(roundsPerGame))} | ${Math.min(...roundsPerGame)}–${Math.max(...roundsPerGame)} | ${
        f2(mean(fullTableWins))
      } | ${pct(fullTableAllCompatible / fullRounds)} | ${f2(fullRounds / GAME_SAMPLES)} | ${
        f2(endRounds / GAME_SAMPLES)
      } |`,
    );
  }
  console.log("");
}

function printCatalog(): void {
  const catalog = buildCatalog();
  let number = 0;
  for (const [title, cards] of [["Base deck", catalog.base], ["Expert deck", catalog.expert]] as const) {
    console.log(`### ${title} (${cards.length} cards)`);
    let family = "";
    for (const card of cards) {
      if (card.family.title !== family) {
        family = card.family.title;
        console.log(`\n#### ${family}\n`);
        console.log("| # | ID | Front | Back | True in |");
        console.log("|---:|---|---|---|---:|");
      }
      number++;
      const trueIn = truthKey(card).split("1").length - 1;
      console.log(`| ${number} | \`${card.id}\` | \`${card.front}\` | ${card.text} | ${trueIn}/36 |`);
    }
    console.log("");
  }
  console.log(`### Rejected candidates (${catalog.rejected.length})\n`);
  console.log("| Candidate | Wording | Reason |");
  console.log("|---|---|---|");
  for (const r of catalog.rejected) {
    const reason = r.reason === "duplicate"
      ? `same truth as \`${r.duplicateOf!.id}\` (“${r.duplicateOf!.text}”)`
      : r.reason === "excluded"
      ? `excluded: ${r.card.family.excluded}`
      : r.reason;
    console.log(`| \`${r.card.id}\` | ${r.card.text} | ${reason} |`);
  }
}

function main(): void {
  if (Deno.args[0] === "cards") {
    printCatalog();
    return;
  }
  const catalog = buildCatalog();
  const decks = [makeDeck("base", catalog.base), makeDeck("base + expert", [...catalog.base, ...catalog.expert])];
  console.log(`# Analysis results (seed ${SEED})\n`);
  printStateSpace();
  for (const deck of decks) {
    const rng = mulberry32(SEED);
    printDeckSummary(deck);
    const maxes = printDrawTable(deck, rng);
    printMaxDistributions(deck, maxes);
    printGameSimulation(deck, rng);
  }
}

main();
