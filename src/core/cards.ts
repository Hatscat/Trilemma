/**
 * Rule card catalog.
 *
 * Every candidate rule is generated family by family, in priority order.
 * A candidate is then dropped when it is:
 * - a tautology (true for all 36 arrangements) or a contradiction (true for none);
 * - a duplicate: true for exactly the same set of arrangements as an earlier card,
 *   even if the wording is different (e.g. "the Star is above the Circle" and
 *   "the Circle is below the Star");
 * - part of an excluded family (see `Family.excluded`).
 *
 * Front notation used in the docs (see docs/rule-cards.md for the visual design):
 *   ★ ● ■     the Star, the Circle, the Square
 *   (1) (A)   badge "row 1" / "column A"
 *   ▓ ░       dark cell / light cell
 *   =         "is the same character as" / "is on"
 *   [C1]      mini-map of the grid with cell C1 marked
 *   X ┆ Y     vertical strip: X is above Y (1 or 2 rows higher)
 *   X ┄ Y     horizontal strip: X is to the left of Y (1 or 2 columns)
 *   X ⤡ Y     2x2 mini-grid: X and Y touch at a corner
 *   X ↕1 Y    X and Y are exactly 1 row apart (↔ for columns)
 */

import {
  type Arrangement,
  ARRANGEMENTS,
  cellLabel,
  characterInColumn,
  characterInRow,
  CHARACTERS,
  COL_LABELS,
  darkCount,
  INDICES,
  isDark,
  isOccupied,
  isOnDark,
  ORDERED_PAIRS,
  PAIRS,
  ROW_LABELS,
} from "./board.ts";

export type Tier = "base" | "expert";

/** Visual group of a family, used for the card frame color. */
export type CardGroup = "position" | "shade" | "relation" | "expert";

export interface Family {
  readonly key: string;
  readonly title: string;
  readonly tier: Tier;
  readonly group: CardGroup;
  /** When set, the cards of this family that survive deduplication are still left out of the deck. */
  readonly excluded?: string;
}

export const FAMILIES = {
  ROW: { key: "ROW", title: "Character in a row", tier: "base", group: "position" },
  COL: { key: "COL", title: "Character in a column", tier: "base", group: "position" },
  CELL: { key: "CELL", title: "Occupied cell (row ↔ column link)", tier: "base", group: "position" },
  SHADE: { key: "SHADE", title: "Character on a cell shade", tier: "base", group: "shade" },
  COUNT: { key: "COUNT", title: "Number of characters on a shade", tier: "base", group: "shade" },
  LINE_SHADE: {
    key: "LINE_SHADE",
    title: "Row/column character on a shade",
    tier: "base",
    group: "shade",
    excluded:
      'disguised negation ("cell X is empty"), and the only family that makes some arrangements satisfy more cards than others',
  },
  ABOVE: { key: "ABOVE", title: "Above", tier: "base", group: "relation" },
  LEFT: { key: "LEFT", title: "Left of", tier: "base", group: "relation" },
  TOUCH: { key: "TOUCH", title: "Touching at a corner", tier: "base", group: "relation" },
  ROW_GAP: { key: "ROW_GAP", title: "Row distance", tier: "base", group: "relation" },
  COL_GAP: { key: "COL_GAP", title: "Column distance", tier: "base", group: "relation" },
  CROSS_ROW: {
    key: "CROSS_ROW",
    title: "Row character left/right of a character",
    tier: "expert",
    group: "expert",
  },
  CROSS_COL: {
    key: "CROSS_COL",
    title: "Column character above/below a character",
    tier: "expert",
    group: "expert",
  },
} as const satisfies Record<string, Family>;

/** An element drawn on a card. */
export type Token =
  | { readonly kind: "character"; readonly character: number }
  | { readonly kind: "row"; readonly row: number }
  | { readonly kind: "column"; readonly col: number }
  | { readonly kind: "shade"; readonly dark: boolean };

/** Structured description of the symbolic face of a card, used by the renderer. */
export type Glyph =
  | { readonly type: "equals"; readonly left: Token; readonly right: Token }
  | { readonly type: "cell"; readonly row: number; readonly col: number }
  | { readonly type: "count"; readonly count: number; readonly dark: boolean }
  | { readonly type: "above"; readonly top: Token; readonly bottom: Token }
  | { readonly type: "left"; readonly left: Token; readonly right: Token }
  | { readonly type: "touch"; readonly a: number; readonly b: number }
  | {
    readonly type: "gap";
    readonly axis: "row" | "column";
    readonly gap: number;
    readonly a: number;
    readonly b: number;
  };

export interface CardDefinition {
  readonly id: string;
  readonly family: Family;
  /** Compact symbolic notation (docs). */
  readonly front: string;
  /** Caption: one simple sentence. */
  readonly text: string;
  readonly glyph: Glyph;
  readonly test: (a: Arrangement) => boolean;
}

export interface Card extends CardDefinition {
  /** Printed card number, 1-based, base deck first. */
  readonly number: number;
}

const name = (c: number) => `the ${CHARACTERS[c].name}`;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const sym = (c: number) => CHARACTERS[c].symbol;
const key = (c: number) => CHARACTERS[c].key;
const character = (c: number): Token => ({ kind: "character", character: c });
const rowToken = (row: number): Token => ({ kind: "row", row });
const colToken = (col: number): Token => ({ kind: "column", col });
const SHADES = [
  { key: "DARK", label: "dark", tile: "▓", dark: true },
  { key: "LIGHT", label: "light", tile: "░", dark: false },
] as const;

function* generateCandidates(): Generator<CardDefinition> {
  const F = FAMILIES;

  for (const c of INDICES) {
    for (const r of INDICES) {
      yield {
        id: `ROW-${key(c)}-${ROW_LABELS[r]}`,
        family: F.ROW,
        front: `${sym(c)} = (${ROW_LABELS[r]})`,
        text: `${cap(name(c))} is in row ${ROW_LABELS[r]}.`,
        glyph: { type: "equals", left: character(c), right: rowToken(r) },
        test: (a) => a.rows[c] === r,
      };
    }
  }

  for (const c of INDICES) {
    for (const col of INDICES) {
      yield {
        id: `COL-${key(c)}-${COL_LABELS[col]}`,
        family: F.COL,
        front: `${sym(c)} = (${COL_LABELS[col]})`,
        text: `${cap(name(c))} is in column ${COL_LABELS[col]}.`,
        glyph: { type: "equals", left: character(c), right: colToken(col) },
        test: (a) => a.cols[c] === col,
      };
    }
  }

  // Canonical wording first; the two "Einstein-style" wordings below are duplicates by design.
  for (const r of INDICES) {
    for (const col of INDICES) {
      yield {
        id: `CELL-${cellLabel(r, col)}`,
        family: F.CELL,
        front: `[${cellLabel(r, col)}]`,
        text: `A character stands on cell ${cellLabel(r, col)}.`,
        glyph: { type: "cell", row: r, col },
        test: (a) => isOccupied(a, r, col),
      };
    }
  }
  for (const r of INDICES) {
    for (const col of INDICES) {
      yield {
        id: `ROWCOL-${ROW_LABELS[r]}-${COL_LABELS[col]}`,
        family: F.CELL,
        front: `(${ROW_LABELS[r]}) = (${COL_LABELS[col]})`,
        text: `The character in row ${ROW_LABELS[r]} is in column ${COL_LABELS[col]}.`,
        glyph: { type: "equals", left: rowToken(r), right: colToken(col) },
        test: (a) => a.cols[characterInRow(a, r)] === col,
      };
      yield {
        id: `COLROW-${COL_LABELS[col]}-${ROW_LABELS[r]}`,
        family: F.CELL,
        front: `(${COL_LABELS[col]}) = (${ROW_LABELS[r]})`,
        text: `The character in column ${COL_LABELS[col]} is in row ${ROW_LABELS[r]}.`,
        glyph: { type: "equals", left: colToken(col), right: rowToken(r) },
        test: (a) => a.rows[characterInColumn(a, col)] === r,
      };
    }
  }

  for (const c of INDICES) {
    for (const s of SHADES) {
      yield {
        id: `SHADE-${key(c)}-${s.key}`,
        family: F.SHADE,
        front: `${sym(c)} = ${s.tile}`,
        text: `${cap(name(c))} is on a ${s.label} cell.`,
        glyph: { type: "equals", left: character(c), right: { kind: "shade", dark: s.dark } },
        test: (a) => isOnDark(a, c) === s.dark,
      };
    }
  }

  // Count rules come before row/column shade rules so the global wording is kept.
  const counts = [
    { id: "COUNT-LIGHT-2", count: 2, dark: false, text: "Exactly two characters are on light cells.", darkCells: 1 },
    { id: "COUNT-DARK-3", count: 3, dark: true, text: "All three characters are on dark cells.", darkCells: 3 },
    { id: "COUNT-LIGHT-0", count: 0, dark: false, text: "No character is on a light cell.", darkCells: 3 },
    { id: "COUNT-DARK-1", count: 1, dark: true, text: "Exactly one character is on a dark cell.", darkCells: 1 },
    { id: "COUNT-LIGHT-1", count: 1, dark: false, text: "Exactly one character is on a light cell.", darkCells: 2 },
    { id: "COUNT-LIGHT-3", count: 3, dark: false, text: "All three characters are on light cells.", darkCells: 0 },
  ];
  for (const k of counts) {
    yield {
      id: k.id,
      family: F.COUNT,
      front: `${k.count} × ${k.dark ? "▓" : "░"}`,
      text: k.text,
      glyph: { type: "count", count: k.count, dark: k.dark },
      test: (a) => darkCount(a) === k.darkCells,
    };
  }

  for (const s of SHADES) {
    for (const r of INDICES) {
      yield {
        id: `LINE-ROW${ROW_LABELS[r]}-${s.key}`,
        family: F.LINE_SHADE,
        front: `(${ROW_LABELS[r]}) = ${s.tile}`,
        text: `The character in row ${ROW_LABELS[r]} is on a ${s.label} cell.`,
        glyph: { type: "equals", left: rowToken(r), right: { kind: "shade", dark: s.dark } },
        test: (a) => isDark(r, a.cols[characterInRow(a, r)]) === s.dark,
      };
    }
    for (const col of INDICES) {
      yield {
        id: `LINE-COL${COL_LABELS[col]}-${s.key}`,
        family: F.LINE_SHADE,
        front: `(${COL_LABELS[col]}) = ${s.tile}`,
        text: `The character in column ${COL_LABELS[col]} is on a ${s.label} cell.`,
        glyph: { type: "equals", left: colToken(col), right: { kind: "shade", dark: s.dark } },
        test: (a) => isDark(a.rows[characterInColumn(a, col)], col) === s.dark,
      };
    }
  }

  for (const [x, y] of ORDERED_PAIRS) {
    yield {
      id: `ABOVE-${key(x)}-${key(y)}`,
      family: F.ABOVE,
      front: `${sym(x)} ┆ ${sym(y)}`,
      text: `${cap(name(x))} is above ${name(y)}.`,
      glyph: { type: "above", top: character(x), bottom: character(y) },
      test: (a) => a.rows[x] < a.rows[y],
    };
  }
  for (const [x, y] of ORDERED_PAIRS) {
    yield {
      id: `LEFT-${key(x)}-${key(y)}`,
      family: F.LEFT,
      front: `${sym(x)} ┄ ${sym(y)}`,
      text: `${cap(name(x))} is to the left of ${name(y)}.`,
      glyph: { type: "left", left: character(x), right: character(y) },
      test: (a) => a.cols[x] < a.cols[y],
    };
  }
  // Mirror wordings: always duplicates of ABOVE / LEFT.
  for (const [x, y] of ORDERED_PAIRS) {
    yield {
      id: `BELOW-${key(x)}-${key(y)}`,
      family: F.ABOVE,
      front: `${sym(y)} ┆ ${sym(x)}`,
      text: `${cap(name(x))} is below ${name(y)}.`,
      glyph: { type: "above", top: character(y), bottom: character(x) },
      test: (a) => a.rows[x] > a.rows[y],
    };
    yield {
      id: `RIGHT-${key(x)}-${key(y)}`,
      family: F.LEFT,
      front: `${sym(y)} ┄ ${sym(x)}`,
      text: `${cap(name(x))} is to the right of ${name(y)}.`,
      glyph: { type: "left", left: character(y), right: character(x) },
      test: (a) => a.cols[x] > a.cols[y],
    };
  }

  for (const [x, y] of PAIRS) {
    yield {
      id: `TOUCH-${key(x)}-${key(y)}`,
      family: F.TOUCH,
      front: `${sym(x)} ⤡ ${sym(y)}`,
      text: `${cap(name(x))} and ${name(y)} touch at a corner.`,
      glyph: { type: "touch", a: x, b: y },
      test: (a) => Math.abs(a.rows[x] - a.rows[y]) === 1 && Math.abs(a.cols[x] - a.cols[y]) === 1,
    };
  }

  for (const gap of [1, 2]) {
    for (const [x, y] of PAIRS) {
      yield {
        id: `ROWGAP${gap}-${key(x)}-${key(y)}`,
        family: F.ROW_GAP,
        front: `${sym(x)} ↕${gap} ${sym(y)}`,
        text: gap === 1
          ? `${cap(name(x))} and ${name(y)} are in neighboring rows.`
          : `${cap(name(x))} and ${name(y)} are two rows apart.`,
        glyph: { type: "gap", axis: "row", gap, a: x, b: y },
        test: (a) => Math.abs(a.rows[x] - a.rows[y]) === gap,
      };
    }
  }
  for (const gap of [1, 2]) {
    for (const [x, y] of PAIRS) {
      yield {
        id: `COLGAP${gap}-${key(x)}-${key(y)}`,
        family: F.COL_GAP,
        front: `${sym(x)} ↔${gap} ${sym(y)}`,
        text: gap === 1
          ? `${cap(name(x))} and ${name(y)} are in neighboring columns.`
          : `${cap(name(x))} and ${name(y)} are two columns apart.`,
        glyph: { type: "gap", axis: "column", gap, a: x, b: y },
        test: (a) => Math.abs(a.cols[x] - a.cols[y]) === gap,
      };
    }
  }

  // Expert: cross references. Only the cross axis is used: "the character in row 1 is above X"
  // only means "X is not in row 1" (a disguised negation), so it is not generated.
  for (const r of INDICES) {
    for (const x of INDICES) {
      yield {
        id: `XROW${ROW_LABELS[r]}-LEFT-${key(x)}`,
        family: F.CROSS_ROW,
        front: `(${ROW_LABELS[r]}) ┄ ${sym(x)}`,
        text: `The character in row ${ROW_LABELS[r]} is to the left of ${name(x)}.`,
        glyph: { type: "left", left: rowToken(r), right: character(x) },
        test: (a) => a.cols[characterInRow(a, r)] < a.cols[x],
      };
      yield {
        id: `XROW${ROW_LABELS[r]}-RIGHT-${key(x)}`,
        family: F.CROSS_ROW,
        front: `${sym(x)} ┄ (${ROW_LABELS[r]})`,
        text: `The character in row ${ROW_LABELS[r]} is to the right of ${name(x)}.`,
        glyph: { type: "left", left: character(x), right: rowToken(r) },
        test: (a) => a.cols[characterInRow(a, r)] > a.cols[x],
      };
    }
  }
  for (const col of INDICES) {
    for (const x of INDICES) {
      yield {
        id: `XCOL${COL_LABELS[col]}-ABOVE-${key(x)}`,
        family: F.CROSS_COL,
        front: `(${COL_LABELS[col]}) ┆ ${sym(x)}`,
        text: `The character in column ${COL_LABELS[col]} is above ${name(x)}.`,
        glyph: { type: "above", top: colToken(col), bottom: character(x) },
        test: (a) => a.rows[characterInColumn(a, col)] < a.rows[x],
      };
      yield {
        id: `XCOL${COL_LABELS[col]}-BELOW-${key(x)}`,
        family: F.CROSS_COL,
        front: `${sym(x)} ┆ (${COL_LABELS[col]})`,
        text: `The character in column ${COL_LABELS[col]} is below ${name(x)}.`,
        glyph: { type: "above", top: character(x), bottom: colToken(col) },
        test: (a) => a.rows[characterInColumn(a, col)] > a.rows[x],
      };
    }
  }
}

/** Truth table of a card over the 36 arrangements, as a "0"/"1" string. */
export function truthKey(card: CardDefinition): string {
  return ARRANGEMENTS.map((a) => (card.test(a) ? "1" : "0")).join("");
}

export interface Rejection {
  readonly card: CardDefinition;
  readonly reason: "always true" | "never true" | "duplicate" | "excluded";
  readonly duplicateOf?: CardDefinition;
}

export interface Catalog {
  readonly base: readonly Card[];
  readonly expert: readonly Card[];
  readonly rejected: readonly Rejection[];
}

export function buildCatalog(): Catalog {
  const seen = new Map<string, CardDefinition>();
  const kept: CardDefinition[] = [];
  const rejected: Rejection[] = [];
  const all = "1".repeat(ARRANGEMENTS.length);
  const none = "0".repeat(ARRANGEMENTS.length);

  for (const card of generateCandidates()) {
    const k = truthKey(card);
    if (k === all) rejected.push({ card, reason: "always true" });
    else if (k === none) rejected.push({ card, reason: "never true" });
    else if (seen.has(k)) rejected.push({ card, reason: "duplicate", duplicateOf: seen.get(k) });
    else {
      seen.set(k, card);
      if (card.family.excluded) rejected.push({ card, reason: "excluded" });
      else kept.push(card);
    }
  }

  const ordered = [
    ...kept.filter((c) => c.family.tier === "base"),
    ...kept.filter((c) => c.family.tier === "expert"),
  ];
  const numbered: Card[] = ordered.map((c, i) => ({ ...c, number: i + 1 }));
  return {
    base: numbered.filter((c) => c.family.tier === "base"),
    expert: numbered.filter((c) => c.family.tier === "expert"),
    rejected,
  };
}

/** The catalog, built once. */
export const CATALOG: Catalog = buildCatalog();

const BY_ID = new Map<string, Card>([...CATALOG.base, ...CATALOG.expert].map((c) => [c.id, c]));

export function getCard(id: string): Card {
  const card = BY_ID.get(id);
  if (!card) throw new Error(`Unknown card: ${id}`);
  return card;
}

export type DeckChoice = "base" | "full";

export function deckCards(deck: DeckChoice): readonly Card[] {
  return deck === "base" ? CATALOG.base : [...CATALOG.base, ...CATALOG.expert];
}
