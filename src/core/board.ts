/**
 * Board model: characters, cells, shading and the 36 legal arrangements.
 *
 * Coordinates are 0-based: row 0 is the top row ("1"), column 0 is the left column ("A").
 * Cell A1 (top-left) is dark, so dark cells are the 4 corners and the center.
 * A cell index is `row * 3 + col` (0 = A1, 8 = C3).
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

export const SIZE = 3;
export const CELL_COUNT = SIZE * SIZE;
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

export function cellIndex(row: number, col: number): number {
  return row * SIZE + col;
}

export function cellRow(cell: number): number {
  return Math.floor(cell / SIZE);
}

export function cellCol(cell: number): number {
  return cell % SIZE;
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

/** Index of an arrangement in `ARRANGEMENTS`. */
export function arrangementIndex(a: Arrangement): number {
  return ARRANGEMENTS.findIndex((b) => INDICES.every((c) => a.rows[c] === b.rows[c] && a.cols[c] === b.cols[c]));
}

/** Unordered pairs of distinct characters. */
export const PAIRS: readonly (readonly [number, number])[] = [[0, 1], [0, 2], [1, 2]];

/** Ordered pairs of distinct characters. */
export const ORDERED_PAIRS: readonly (readonly [number, number])[] = PAIRS.flatMap((
  [x, y],
) => [[x, y] as const, [y, x] as const]);

// ---------------------------------------------------------------------------
// Placement: the (possibly incomplete) position of the characters on the board.
// ---------------------------------------------------------------------------

/** `placement[c]` is the cell index of character `c`, or `null` when it is off the board. */
export type Placement = readonly (number | null)[];

export const EMPTY_PLACEMENT: Placement = [null, null, null];

/**
 * Puts a character on a cell (or back off the board with `null`).
 * Any other character on the same row or column is sent back off the board,
 * so a placement never breaks the "one character per row and per column" rule.
 */
export function placeCharacter(placement: Placement, character: number, cell: number | null): Placement {
  return placement.map((current, c) => {
    if (c === character) return cell;
    if (cell === null || current === null) return current;
    const conflict = cellRow(current) === cellRow(cell) || cellCol(current) === cellCol(cell);
    return conflict ? null : current;
  });
}

/** The arrangement described by a complete placement, or `null` if a character is missing. */
export function placementToArrangement(placement: Placement): Arrangement | null {
  if (placement.some((cell) => cell === null)) return null;
  const cells = placement as readonly number[];
  const rows = cells.map(cellRow);
  const cols = cells.map(cellCol);
  if (new Set(rows).size !== SIZE || new Set(cols).size !== SIZE) return null;
  return { rows, cols };
}

export function arrangementToPlacement(a: Arrangement): Placement {
  return INDICES.map((c) => cellIndex(a.rows[c], a.cols[c]));
}

export function characterAt(placement: Placement, cell: number): number | null {
  const c = placement.indexOf(cell);
  return c === -1 ? null : c;
}
