/**
 * Core model of the 3x3 board, shared by the card catalog and the analysis.
 *
 * Coordinates are 0-based internally: row 0 is the top row ("1"),
 * column 0 is the left column ("A"). Cell A1 (top-left) is dark,
 * so dark cells are the 4 corners + the center (5 dark, 4 light).
 */

export interface CharacterInfo {
  readonly key: string;
  readonly name: string;
  readonly symbol: string;
  readonly color: string;
  readonly eyes: number;
}

/** Characters in canonical order. The array index is the character id. */
export const CHARACTERS: readonly CharacterInfo[] = [
  { key: "STAR", name: "Star", symbol: "★", color: "purple", eyes: 1 },
  { key: "CIRCLE", name: "Circle", symbol: "●", color: "green", eyes: 2 },
  { key: "SQUARE", name: "Square", symbol: "■", color: "orange", eyes: 3 },
];

export const ROW_LABELS = ["1", "2", "3"] as const;
export const COL_LABELS = ["A", "B", "C"] as const;
export const INDICES = [0, 1, 2] as const;

/** `rows[c]` and `cols[c]` are the row and column indices of character `c`. */
export interface Arrangement {
  readonly rows: readonly number[];
  readonly cols: readonly number[];
}

export function isDark(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

export function cellLabel(row: number, col: number): string {
  return `${COL_LABELS[col]}${ROW_LABELS[row]}`;
}

function permutationsOf(items: readonly number[]): number[][] {
  if (items.length <= 1) return [items.slice()];
  return items.flatMap((item, i) =>
    permutationsOf([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
  );
}

/** All 3! x 3! = 36 legal arrangements (one character per row and per column). */
export const ARRANGEMENTS: readonly Arrangement[] = permutationsOf(INDICES).flatMap((rows) =>
  permutationsOf(INDICES).map((cols) => ({ rows, cols }))
);

export function characterInRow(a: Arrangement, row: number): number {
  return a.rows.indexOf(row);
}

export function characterInColumn(a: Arrangement, col: number): number {
  return a.cols.indexOf(col);
}

export function isOnDark(a: Arrangement, character: number): boolean {
  return isDark(a.rows[character], a.cols[character]);
}

export function darkCount(a: Arrangement): number {
  return INDICES.filter((c) => isOnDark(a, c)).length;
}

export function isOccupied(a: Arrangement, row: number, col: number): boolean {
  return INDICES.some((c) => a.rows[c] === row && a.cols[c] === col);
}

/** Compact human-readable form, e.g. "★A1 ●C2 ■B3". */
export function describeArrangement(a: Arrangement): string {
  return INDICES.map((c) => `${CHARACTERS[c].symbol}${cellLabel(a.rows[c], a.cols[c])}`).join(" ");
}

/** Unordered pairs of distinct characters. */
export const PAIRS: readonly (readonly [number, number])[] = [[0, 1], [0, 2], [1, 2]];

/** Ordered pairs of distinct characters. */
export const ORDERED_PAIRS: readonly (readonly [number, number])[] = PAIRS.flatMap((
  [x, y],
) => [[x, y] as const, [y, x] as const]);
