/** Tutorial lessons: small fixed tables with a known answer (texts live in src/i18n). */

import type { Mode } from "./game.ts";

export type LessonId = "board" | "contradictions" | "classic";

export interface Lesson {
  readonly id: LessonId;
  readonly mode: Mode;
  /** Cards dealt, in table order. */
  readonly cards: readonly string[];
  /** Size of the largest compatible group (checked by the unit tests). */
  readonly max: number;
}

export const LESSONS: readonly Lesson[] = [
  { id: "board", mode: "challenge", cards: ["ROW-STAR-1", "COL-CIRCLE-B", "ABOVE-SQUARE-CIRCLE"], max: 3 },
  {
    id: "contradictions",
    mode: "challenge",
    cards: ["ROW-STAR-1", "ROW-STAR-3", "LEFT-CIRCLE-SQUARE", "SHADE-STAR-DARK"],
    max: 3,
  },
  {
    id: "classic",
    mode: "classic",
    cards: ["COL-STAR-A", "CELL-B2", "TOUCH-CIRCLE-SQUARE", "ROW-CIRCLE-3", "SHADE-SQUARE-LIGHT", "LEFT-SQUARE-STAR"],
    max: 4,
  },
];
