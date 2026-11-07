/**
 * Card captions are derived from the symbolic face of the card (its glyph), so the drawing and the
 * sentence can never disagree. Each language only provides the sentence patterns.
 */

import { cellLabel, COL_LABELS, ROW_LABELS } from "../core/board.ts";
import type { Glyph, Token } from "../core/cards.ts";

/** Sentence patterns of one language. Characters are passed as indices; labels are "1"–"3" / "A"–"C". */
export interface CaptionGrammar {
  readonly row: (character: number, row: string) => string;
  readonly column: (character: number, column: string) => string;
  readonly shade: (character: number, dark: boolean) => string;
  readonly cell: (cell: string) => string;
  readonly count: (count: number, dark: boolean) => string;
  readonly above: (top: number, bottom: number) => string;
  /** "The character in column A is above/below X". */
  readonly columnVertical: (column: string, character: number, above: boolean) => string;
  readonly left: (left: number, right: number) => string;
  /** "The character in row 1 is to the left/right of X". */
  readonly rowHorizontal: (row: string, character: number, left: boolean) => string;
  readonly touch: (a: number, b: number) => string;
  readonly neighbors: (axis: "row" | "column", a: number, b: number) => string;
}

function unsupported(glyph: Glyph): never {
  throw new Error(`No caption for glyph ${JSON.stringify(glyph)}`);
}

function char(token: Token): number | null {
  return token.kind === "character" ? token.character : null;
}

export function captionFrom(grammar: CaptionGrammar): (glyph: Glyph) => string {
  return (glyph) => {
    switch (glyph.type) {
      case "equals": {
        const c = char(glyph.left);
        if (c === null) return unsupported(glyph);
        const right = glyph.right;
        if (right.kind === "row") return grammar.row(c, ROW_LABELS[right.row]);
        if (right.kind === "column") return grammar.column(c, COL_LABELS[right.col]);
        if (right.kind === "shade") return grammar.shade(c, right.dark);
        return unsupported(glyph);
      }
      case "cell":
        return grammar.cell(cellLabel(glyph.row, glyph.col));
      case "count":
        return grammar.count(glyph.count, glyph.dark);
      case "above": {
        const top = char(glyph.top);
        const bottom = char(glyph.bottom);
        if (top !== null && bottom !== null) return grammar.above(top, bottom);
        if (glyph.top.kind === "column" && bottom !== null) {
          return grammar.columnVertical(COL_LABELS[glyph.top.col], bottom, true);
        }
        if (glyph.bottom.kind === "column" && top !== null) {
          return grammar.columnVertical(COL_LABELS[glyph.bottom.col], top, false);
        }
        return unsupported(glyph);
      }
      case "left": {
        const left = char(glyph.left);
        const right = char(glyph.right);
        if (left !== null && right !== null) return grammar.left(left, right);
        if (glyph.left.kind === "row" && right !== null) {
          return grammar.rowHorizontal(ROW_LABELS[glyph.left.row], right, true);
        }
        if (glyph.right.kind === "row" && left !== null) {
          return grammar.rowHorizontal(ROW_LABELS[glyph.right.row], left, false);
        }
        return unsupported(glyph);
      }
      case "touch":
        return grammar.touch(glyph.a, glyph.b);
      case "gap":
        return glyph.gap === 1 ? grammar.neighbors(glyph.axis, glyph.a, glyph.b) : unsupported(glyph);
    }
  };
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
