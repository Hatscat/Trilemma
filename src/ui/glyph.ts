/**
 * Renders the symbolic face of a rule card as SVG markup (view box 0 0 120 80).
 * Visual vocabulary: docs/rule-cards.md ("Visual vocabulary").
 */

import { COL_LABELS, isDark, ROW_LABELS } from "../core/board.ts";
import type { Glyph, Token } from "../core/cards.ts";
import { characterSymbolId, COLORS, DARK_FILL, SILHOUETTE_ID } from "./sprite.ts";

const STRIP = "#9fb6cf";

function use(id: string, x: number, y: number, size: number): string {
  return `<use href="#${id}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
}

const round = (n: number) => Number(n.toFixed(2));

/**
 * Row or column badge: a bar with rounded ends, lying for a row (like a row of the board) and standing for a column,
 * so the two read differently at a glance. The label is centered on it.
 */
function bar(label: string, x: number, y: number, size: number, vertical: boolean): string {
  const thickness = size * 0.78;
  const end = thickness * 0.19; // Depth of the rounded ends.
  const width = vertical ? thickness : size;
  const height = vertical ? size : thickness;
  const left = x + (size - width) / 2;
  const top = y + (size - height) / 2;
  return `<rect x="${round(left)}" y="${round(top)}" width="${round(width)}" height="${round(height)}" ` +
    `rx="${round(vertical ? thickness / 2 : end)}" ry="${round(vertical ? end : thickness / 2)}" ` +
    `fill="${COLORS.badge}"/>` +
    `<text x="${round(x + size / 2)}" y="${round(y + size / 2)}" dy="0.36em" text-anchor="middle" ` +
    `font-family="system-ui, sans-serif" font-weight="800" font-size="${round(thickness * 0.66)}" fill="#fff">` +
    `${label}</text>`;
}

function tile(dark: boolean, x: number, y: number, size: number): string {
  return `<rect x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}" rx="${size * 0.14}" ` +
    `fill="${dark ? DARK_FILL : COLORS.cellLight}" stroke="${COLORS.cellStroke}" stroke-width="2"/>`;
}

function token(t: Token, x: number, y: number, size: number): string {
  switch (t.kind) {
    case "character":
      return use(characterSymbolId(t.character), x, y, size);
    case "row":
      return bar(ROW_LABELS[t.row], x, y, size, false);
    case "column":
      return bar(COL_LABELS[t.col], x, y, size, true);
    case "shade":
      return tile(t.dark, x, y, size);
  }
}

function equalsSign(cx: number, cy: number): string {
  return `<rect x="${cx - 7}" y="${cy - 6}" width="14" height="4" rx="2" fill="${COLORS.ink}"/>` +
    `<rect x="${cx - 7}" y="${cy + 2}" width="14" height="4" rx="2" fill="${COLORS.ink}"/>`;
}

function strip(x: number, y: number, vertical: boolean): string {
  const cells = [0, 1, 2].map((i) =>
    vertical
      ? `<rect x="${x}" y="${y + i * 7}" width="11" height="6" rx="1.5" fill="${STRIP}"/>`
      : `<rect x="${x + i * 9}" y="${y}" width="8" height="11" rx="1.5" fill="${STRIP}"/>`
  );
  return cells.join("");
}

function miniGrid(x: number, y: number, cell: number, rows: number, cols: number, highlight?: [number, number]) {
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dark = isDark(r, c);
      out += `<rect x="${x + c * cell}" y="${y + r * cell}" width="${cell}" height="${cell}" ` +
        `fill="${dark ? DARK_FILL : COLORS.cellLight}" stroke="${COLORS.cellStroke}" stroke-width="1"/>`;
    }
  }
  if (highlight) {
    const [r, c] = highlight;
    out += `<rect x="${x + c * cell + 1.5}" y="${y + r * cell + 1.5}" width="${cell - 3}" height="${cell - 3}" ` +
      `fill="none" stroke="${COLORS.badge}" stroke-width="3" rx="2"/>` +
      use(SILHOUETTE_ID, x + c * cell + 3, y + r * cell + 3, cell - 6);
  }
  return out;
}

export function glyphMarkup(glyph: Glyph): string {
  switch (glyph.type) {
    case "equals":
      return token(glyph.left, 10, 21, 38) + equalsSign(60, 40) + token(glyph.right, 72, 21, 38);
    case "cell":
      return miniGrid(30, 4, 24, 3, 3, [glyph.row, glyph.col]);
    case "count":
      return `<text x="27" y="40" dy="0.36em" text-anchor="middle" font-family="system-ui, sans-serif" ` +
        `font-weight="800" font-size="34" fill="${COLORS.ink}">${glyph.count}</text>` +
        `<text x="50" y="40" dy="0.36em" text-anchor="middle" font-family="system-ui, sans-serif" ` +
        `font-weight="700" font-size="22" fill="${COLORS.ink}">×</text>` +
        tile(glyph.dark, 66, 19, 42) + use(SILHOUETTE_ID, 73, 26, 28);
    case "above":
      return token(glyph.top, 46, 1, 28) + strip(54.5, 31, true) + token(glyph.bottom, 46, 51, 28);
    case "left":
      return token(glyph.left, 4, 24, 32) + strip(47, 34.5, false) + token(glyph.right, 84, 24, 32);
    case "touch":
      return miniGrid(28, 6, 34, 2, 2) + use(characterSymbolId(glyph.a), 31, 9, 28) +
        use(characterSymbolId(glyph.b), 65, 43, 28);
    case "gap":
      if (glyph.axis === "row") {
        return `<rect x="8" y="6" width="104" height="33" rx="5" fill="${COLORS.cellLight}" ` +
          `stroke="${COLORS.cellStroke}" stroke-width="1.5"/>` +
          `<rect x="8" y="41" width="104" height="33" rx="5" fill="${COLORS.cellLight}" ` +
          `stroke="${COLORS.cellStroke}" stroke-width="1.5"/>` +
          use(characterSymbolId(glyph.a), 24, 9, 27) + use(characterSymbolId(glyph.b), 69, 44, 27);
      }
      return `<rect x="26" y="2" width="33" height="76" rx="5" fill="${COLORS.cellLight}" ` +
        `stroke="${COLORS.cellStroke}" stroke-width="1.5"/>` +
        `<rect x="61" y="2" width="33" height="76" rx="5" fill="${COLORS.cellLight}" ` +
        `stroke="${COLORS.cellStroke}" stroke-width="1.5"/>` +
        use(characterSymbolId(glyph.a), 29, 8, 27) + use(characterSymbolId(glyph.b), 64, 45, 27);
  }
}

export function glyphSvg(glyph: Glyph, className = "glyph"): string {
  return `<svg class="${className}" viewBox="0 0 120 80" aria-hidden="true">${glyphMarkup(glyph)}</svg>`;
}
