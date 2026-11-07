/**
 * SVG artwork of the characters, as static markup.
 * Each character is drawn in a 100 x 100 view box and exposed as a <symbol> in a hidden sprite,
 * so the board, the tray and the cards can reuse it with <use href="#tri-char-N">.
 */

export const COLORS = {
  ink: "#1d2433",
  cellLight: "#f7eedb",
  cellDark: "#cdb894",
  cellStroke: "#a8916a",
  /** Stripes drawn on dark cells, so they are not told apart by color alone. */
  hatch: "#7d6440",
  badge: "#29497a",
  /** Lighter end of the row / column cylinders. */
  badgeCap: "#5a80bb",
  silhouette: "#e3e6ec",
  silhouetteStroke: "#8a93a6",
  characters: [
    { fill: "#8e5bd8", stroke: "#5a2f9e" }, // Star: purple
    { fill: "#2fa866", stroke: "#1b6e41" }, // Circle: green
    { fill: "#e2463d", stroke: "#a1241d" }, // Square: red
  ],
} as const;

function eye(cx: number, cy: number, r: number): string {
  const p = r * 0.52;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${COLORS.ink}" stroke-width="2.5"/>` +
    `<circle cx="${cx + r * 0.18}" cy="${cy + r * 0.15}" r="${p}" fill="${COLORS.ink}"/>` +
    `<circle cx="${cx + r * 0.38}" cy="${cy - r * 0.12}" r="${p * 0.35}" fill="#fff"/>`;
}

function smile(x1: number, x2: number, y: number, depth: number): string {
  const mid = (x1 + x2) / 2;
  return `<path d="M ${x1} ${y} Q ${mid} ${y + depth} ${x2} ${y}" fill="none" stroke="${COLORS.ink}" ` +
    `stroke-width="3.5" stroke-linecap="round"/>`;
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let k = 0; k < 10; k++) {
    const angle = ((-90 + k * 36) * Math.PI) / 180;
    const r = k % 2 === 0 ? outer : inner;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(" ");
}

/** Inner markup (view box 0 0 100 100) of each character, in canonical order. */
export const CHARACTER_MARKUP: readonly string[] = [
  // Star: five-pointed, one eye (a cyclops).
  `<polygon points="${starPoints(50, 55, 48, 22)}" fill="${COLORS.characters[0].fill}" ` +
  `stroke="${COLORS.characters[0].stroke}" stroke-width="3" stroke-linejoin="round"/>` +
  eye(50, 50, 10.5) + smile(44, 56, 64, 6),
  // Circle: two eyes.
  `<circle cx="50" cy="50" r="45" fill="${COLORS.characters[1].fill}" stroke="${COLORS.characters[1].stroke}" ` +
  `stroke-width="3"/>` + eye(35, 43, 10) + eye(65, 43, 10) + smile(37, 63, 64, 11),
  // Square: three eyes.
  `<rect x="6" y="6" width="88" height="88" rx="16" fill="${COLORS.characters[2].fill}" ` +
  `stroke="${COLORS.characters[2].stroke}" stroke-width="3"/>` +
  eye(27, 42, 9) + eye(50, 42, 9) + eye(73, 42, 9) + smile(37, 63, 66, 10),
];

/** A generic "any character" silhouette. */
export const SILHOUETTE_MARKUP = `<circle cx="50" cy="50" r="40" fill="${COLORS.silhouette}" ` +
  `stroke="${COLORS.silhouetteStroke}" stroke-width="4" stroke-dasharray="9 6"/>` +
  `<text x="50" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" ` +
  `font-size="46" fill="${COLORS.silhouetteStroke}">?</text>`;

export function characterSymbolId(character: number): string {
  return `tri-char-${character}`;
}

export const SILHOUETTE_ID = "tri-silhouette";

/** Pattern filling dark cells: the dark color with diagonal stripes (color-blind and grayscale friendly). */
export const DARK_FILL = "url(#tri-dark)";

const DARK_PATTERN = `<pattern id="tri-dark" patternUnits="userSpaceOnUse" width="6" height="6" ` +
  `patternTransform="rotate(-45)"><rect width="6" height="6" fill="${COLORS.cellDark}"/>` +
  `<rect width="1.7" height="6" fill="${COLORS.hatch}" fill-opacity="0.38"/></pattern>`;

/** Markup of the hidden sprite holding every symbol. */
export function spriteMarkup(): string {
  const symbols = CHARACTER_MARKUP.map((markup, c) =>
    `<symbol id="${characterSymbolId(c)}" viewBox="0 0 100 100">${markup}</symbol>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">` +
    `<defs>${DARK_PATTERN}</defs>${symbols}` +
    `<symbol id="${SILHOUETTE_ID}" viewBox="0 0 100 100">${SILHOUETTE_MARKUP}</symbol></svg>`;
}

/** A standalone SVG of one character (e.g. for buttons). */
export function characterSvg(character: number, className = ""): string {
  return `<svg class="${className}" viewBox="0 0 100 100" aria-hidden="true">` +
    `<use href="#${characterSymbolId(character)}"/></svg>`;
}
