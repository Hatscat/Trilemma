# Rule cards

> **Source of truth:** [`src/core/cards.ts`](../src/core/cards.ts). The [full card list](#full-card-list) at the end of
> this file is generated with `deno task cards`. Regenerate it after any change to the catalog.

## Summary

| Deck      | Families |  Cards | Cards true for any given arrangement |
| --------- | -------: | -----: | -----------------------------------: |
| Base      |       10 |     55 |                          24 (always) |
| Expert    |        2 |     36 |                          12 (always) |
| **Total** |   **12** | **91** |                      **36 (always)** |

| #  | Family                                   | Tier   | Cards | Example                                             |
| -- | ---------------------------------------- | ------ | ----: | --------------------------------------------------- |
| 1  | Character in a row                       | base   |     9 | The Star is in row 2.                               |
| 2  | Character in a column                    | base   |     9 | The Star is in column B.                            |
| 3  | Occupied cell                            | base   |     9 | A character stands on cell C1.                      |
| 4  | Character on a cell shade                | base   |     6 | The Star is on a dark cell.                         |
| 5  | Number of characters on a shade          | base   |     1 | Exactly two characters are on light cells.          |
| 6  | Above                                    | base   |     6 | The Star is above the Circle.                       |
| 7  | Left of                                  | base   |     6 | The Star is to the left of the Circle.              |
| 8  | Touching at a corner                     | base   |     3 | The Star and the Circle touch at a corner.          |
| 9  | Row distance                             | base   |     3 | The Star and the Circle are in neighboring rows.    |
| 10 | Column distance                          | base   |     3 | The Star and the Circle are in neighboring columns. |
| 11 | Row character left/right of a character  | expert |    18 | The character in row 1 is to the left of the Star.  |
| 12 | Column character above/below a character | expert |    18 | The character in column A is above the Star.        |

## Board conventions

- Rows are numbered **1 to 3 from top to bottom**, columns are lettered **A to C from left to right**. A cell is named
  column + row: `C1` is the top-right cell.
- Shading is a checkerboard with **A1 dark**: the 4 corners and the center are dark (5 cells), the 4 edge-middle cells
  are light.

  ```
      A   B   C
  1   ▓   ░   ▓
  2   ░   ▓   ░
  3   ▓   ░   ▓
  ```

- Characters: **★ Star** (purple, five-pointed, one eye), **● Circle** (green, two eyes), **■ Square** (red, three
  eyes). Shape and eye count tell them apart even without color (color-blind friendly). In card texts, the grid squares
  are always called **cells** to avoid any confusion with the Square character.
- A legal arrangement always has **exactly one character per row and per column**. There are 36 of them.

## Writing principles

1. **One card, one short positive sentence.** No "not", "never", "except", "unless".
2. **No duplicates.** Two cards are duplicates when they are true for exactly the same arrangements, whatever their
   wording. This is checked by computer over the 36 arrangements, so hidden duplicates (e.g. "the Star and the Circle
   are two rows apart" = "the Square is in row 2") are caught too.
3. **No card is always true or never true.**
4. **"Above" and "to the left of" mean any distance** (1 or 2 rows/columns). Two characters never share a row or a
   column, so "directly above" never makes sense.
5. **Fairness.** In each deck, every arrangement satisfies exactly the same number of cards (24 out of 55 for the base
   deck). No arrangement is a better bet than another before the cards are drawn.

## Card anatomy

All the information is on **one face**:

- the **symbolic drawing**, the main element, inspired by the clue tiles of _Einstein Riddle Island Puzzle_;
- a **caption** below it: the rule in one short sentence, to check or learn the meaning.

The **back is plain and identical for all cards**, base and expert alike, so the face-down draw pile reveals nothing and
both decks can be shuffled together. A small mark on the face identifies expert cards.

In the PWA, a click or a tap on a card zooms in on it so the caption is easy to read.

Suggested frame colors by family group (to make the 3 × 3 layout easy to scan): **position** (row, column, cell),
**shade** (shade, count), **relation** (above, left of, touching, distances), **expert** (cross references).

### Visual vocabulary

| Notation           | Meaning on the card                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `★` `●` `■`        | The character (its colored shape with its face).                                                                                            |
| `(1)` `(A)`        | Row / column badge (like the green row and column badges of the board). Left of `=`: "the character in row 1". Right of `=`: "is in row 1". |
| `▓` `░`            | Dark / light cell tile.                                                                                                                     |
| `=`                | "is" / "stands on" (links two attributes of the same character, Einstein-style).                                                            |
| `[C1]`             | Mini-map of the board with cell C1 highlighted and a generic character silhouette on it.                                                    |
| `X ┆ Y`            | Vertical strip, X on top and Y at the bottom: X is above Y.                                                                                 |
| `X ┄ Y`            | Horizontal strip: X is to the left of Y.                                                                                                    |
| `X ⤡ Y`            | 2 × 2 mini-grid with X and Y in opposite corners: they touch at a corner.                                                                   |
| `X ↕1 Y`, `X ↔1 Y` | X and Y are in neighboring rows / neighboring columns.                                                                                      |
| `2 × ░`            | Two characters stand on light cells.                                                                                                        |

## Families

### 1–2. Character in a row / in a column (9 + 9)

`★ = (2)` — "The Star is in row 2." / `★ = (B)` — "The Star is in column B."

3 characters × 3 rows, and 3 characters × 3 columns. Each card is true for 12 of the 36 arrangements (1 in 3).

### 3. Occupied cell (9)

`[C1]` — "A character stands on cell C1."

```
┌───┬───┬───┐
│   │   │ ? │
├───┼───┼───┤
│   │   │   │
├───┼───┼───┤
│   │   │   │
└───┴───┴───┘
```

"The character in row 1 is in column C" and "the character in column C is in row 1" say exactly the same thing: cell C1
is occupied. The two families originally imagined (9 + 9) are therefore merged into one card per cell (9). The
Einstein-style front `(1) = (C)` is a valid alternative to the mini-map.

### 4. Character on a cell shade (6)

`★ = ▓` — "The Star is on a dark cell." / `★ = ░` — "The Star is on a light cell."

Dark: true for 20 of 36 arrangements. Light: 16 of 36. Both are kept: they are natural statements, not negations of
another card.

### 5. Number of characters on a shade (1)

`2 × ░` — "Exactly two characters are on light cells."

The number of characters on light cells is **always 0 or 2** (parity argument in [math.md](math.md#parity)). So, of the
cards originally imagined:

- "0 characters on light cells" = "3 characters on dark cells" = "a character stands on B2" (already a card);
- "2 characters on light cells" = "1 character on a dark cell" → **the single card kept**;
- "1" or "3 characters on light cells" can never happen.

### 6–7. Above / Left of (6 + 6)

`★ ┆ ●` — "The Star is above the Circle." / `★ ┄ ●` — "The Star is to the left of the Circle."

```
★
┆        ★ ┄┄┄ ●
●
```

For each of the 3 pairs, both directions exist ("Star above Circle" and "Circle above Star"). "Below" and "to the right
of" are the same cards read the other way round, so they are not separate cards. True for 18 of 36 (1 in 2).

### 8. Touching at a corner (3)

`★ ⤡ ●` — "The Star and the Circle touch at a corner."

```
┌───┬───┐
│ ★ │   │
├───┼───┤
│   │ ● │
└───┴───┘
```

This is the "diagonal" rule. Two characters are never side by side (never in the same row or column), so "neighbors"
always means "diagonal neighbors". True for 16 of 36.

### 9–10. Neighboring rows / neighboring columns (3 + 3)

`★ ↕1 ●` — "The Star and the Circle are in neighboring rows." / `★ ↔1 ●` — "…in neighboring columns."

"Two rows apart" is **not** a separate card: the Star and the Circle are two rows apart exactly when they occupy rows 1
and 3, i.e. when the Square is in row 2 (an existing card). Same for columns. True for 24 of 36 (2 in 3).

### 11. Expert — Row character left/right of a character (18)

`(1) ┄ ★` — "The character in row 1 is to the left of the Star." / `★ ┄ (1)` — "The character in row 1 is to the right
of the Star."

3 rows × 3 characters × 2 directions. True for 12 of 36. If the Star is itself in row 1, the card is false (a character
is never to the left of itself).

Only the cross axis is used. "The character in row 1 is above the Star" just means "the Star is not in row 1" (a
disguised negation), "the character in row 2 is above the Star" means "the Star is in row 3" (a duplicate), and "the
character in row 3 is above the Star" is impossible.

### 12. Expert — Column character above/below a character (18)

`(A) ┆ ★` — "The character in column A is above the Star." / `★ ┆ (A)` — "The character in column A is below the Star."

Same structure as family 11, with the axes swapped.

## Families considered and left out

**Row/column character on a dark/light cell (12 candidates, 0 kept).** Row 1 has only one light cell (B1), so "the
character in row 1 is on a light cell" = "a character stands on B1". 8 of the 12 candidates are exact duplicates of
existing cards. The 4 survivors ("the character in row 1 / row 3 / column A / column C is on a dark cell") are disguised
negations ("B1 / B3 / A2 / C2 is empty"). They are also the only cards that favor some arrangements: with them, diagonal
arrangements satisfy 28 cards against 26 for the others. They are flagged `excluded` in the code and can be re-enabled.

**Parked ideas** (not in the deck, possible future expansions). Each one must pass the duplicate check
(`deno task cards`) and should keep the deck balanced:

- "The Star is in a corner" (16/36). "The Star is in the center" (4/36) is probably too rare to be useful.
- "The Star and the Circle are on the same diagonal line" (20/36) and "…are a knight's move apart" (16/36). These two
  are exact complements of each other, and they overlap with "touch at a corner".
- Eye-count rules that use the 1/2/3 eyes as an ordering, e.g. "The character in column A has more eyes than the
  character in column B".
- Row-vs-row ordering, e.g. "The character in row 1 is to the left of the character in row 2" (needs two lookups, hard
  to read).

## Full card list

<!-- Generated by `deno task cards` — do not edit by hand below this line. -->

### Base deck (55 cards)

#### Character in a row

|  # | ID             | Front     | Back                    | True in |
| -: | -------------- | --------- | ----------------------- | ------: |
|  1 | `ROW-STAR-1`   | `★ = (1)` | The Star is in row 1.   |   12/36 |
|  2 | `ROW-STAR-2`   | `★ = (2)` | The Star is in row 2.   |   12/36 |
|  3 | `ROW-STAR-3`   | `★ = (3)` | The Star is in row 3.   |   12/36 |
|  4 | `ROW-CIRCLE-1` | `● = (1)` | The Circle is in row 1. |   12/36 |
|  5 | `ROW-CIRCLE-2` | `● = (2)` | The Circle is in row 2. |   12/36 |
|  6 | `ROW-CIRCLE-3` | `● = (3)` | The Circle is in row 3. |   12/36 |
|  7 | `ROW-SQUARE-1` | `■ = (1)` | The Square is in row 1. |   12/36 |
|  8 | `ROW-SQUARE-2` | `■ = (2)` | The Square is in row 2. |   12/36 |
|  9 | `ROW-SQUARE-3` | `■ = (3)` | The Square is in row 3. |   12/36 |

#### Character in a column

|  # | ID             | Front     | Back                       | True in |
| -: | -------------- | --------- | -------------------------- | ------: |
| 10 | `COL-STAR-A`   | `★ = (A)` | The Star is in column A.   |   12/36 |
| 11 | `COL-STAR-B`   | `★ = (B)` | The Star is in column B.   |   12/36 |
| 12 | `COL-STAR-C`   | `★ = (C)` | The Star is in column C.   |   12/36 |
| 13 | `COL-CIRCLE-A` | `● = (A)` | The Circle is in column A. |   12/36 |
| 14 | `COL-CIRCLE-B` | `● = (B)` | The Circle is in column B. |   12/36 |
| 15 | `COL-CIRCLE-C` | `● = (C)` | The Circle is in column C. |   12/36 |
| 16 | `COL-SQUARE-A` | `■ = (A)` | The Square is in column A. |   12/36 |
| 17 | `COL-SQUARE-B` | `■ = (B)` | The Square is in column B. |   12/36 |
| 18 | `COL-SQUARE-C` | `■ = (C)` | The Square is in column C. |   12/36 |

#### Occupied cell (row ↔ column link)

|  # | ID        | Front  | Back                           | True in |
| -: | --------- | ------ | ------------------------------ | ------: |
| 19 | `CELL-A1` | `[A1]` | A character stands on cell A1. |   12/36 |
| 20 | `CELL-B1` | `[B1]` | A character stands on cell B1. |   12/36 |
| 21 | `CELL-C1` | `[C1]` | A character stands on cell C1. |   12/36 |
| 22 | `CELL-A2` | `[A2]` | A character stands on cell A2. |   12/36 |
| 23 | `CELL-B2` | `[B2]` | A character stands on cell B2. |   12/36 |
| 24 | `CELL-C2` | `[C2]` | A character stands on cell C2. |   12/36 |
| 25 | `CELL-A3` | `[A3]` | A character stands on cell A3. |   12/36 |
| 26 | `CELL-B3` | `[B3]` | A character stands on cell B3. |   12/36 |
| 27 | `CELL-C3` | `[C3]` | A character stands on cell C3. |   12/36 |

#### Character on a cell shade

|  # | ID                   | Front   | Back                           | True in |
| -: | -------------------- | ------- | ------------------------------ | ------: |
| 28 | `SHADE-STAR-DARK`    | `★ = ▓` | The Star is on a dark cell.    |   20/36 |
| 29 | `SHADE-STAR-LIGHT`   | `★ = ░` | The Star is on a light cell.   |   16/36 |
| 30 | `SHADE-CIRCLE-DARK`  | `● = ▓` | The Circle is on a dark cell.  |   20/36 |
| 31 | `SHADE-CIRCLE-LIGHT` | `● = ░` | The Circle is on a light cell. |   16/36 |
| 32 | `SHADE-SQUARE-DARK`  | `■ = ▓` | The Square is on a dark cell.  |   20/36 |
| 33 | `SHADE-SQUARE-LIGHT` | `■ = ░` | The Square is on a light cell. |   16/36 |

#### Number of characters on a shade

|  # | ID              | Front   | Back                                       | True in |
| -: | --------------- | ------- | ------------------------------------------ | ------: |
| 34 | `COUNT-LIGHT-2` | `2 × ░` | Exactly two characters are on light cells. |   24/36 |

#### Above

|  # | ID                    | Front   | Back                            | True in |
| -: | --------------------- | ------- | ------------------------------- | ------: |
| 35 | `ABOVE-STAR-CIRCLE`   | `★ ┆ ●` | The Star is above the Circle.   |   18/36 |
| 36 | `ABOVE-CIRCLE-STAR`   | `● ┆ ★` | The Circle is above the Star.   |   18/36 |
| 37 | `ABOVE-STAR-SQUARE`   | `★ ┆ ■` | The Star is above the Square.   |   18/36 |
| 38 | `ABOVE-SQUARE-STAR`   | `■ ┆ ★` | The Square is above the Star.   |   18/36 |
| 39 | `ABOVE-CIRCLE-SQUARE` | `● ┆ ■` | The Circle is above the Square. |   18/36 |
| 40 | `ABOVE-SQUARE-CIRCLE` | `■ ┆ ●` | The Square is above the Circle. |   18/36 |

#### Left of

|  # | ID                   | Front   | Back                                     | True in |
| -: | -------------------- | ------- | ---------------------------------------- | ------: |
| 41 | `LEFT-STAR-CIRCLE`   | `★ ┄ ●` | The Star is to the left of the Circle.   |   18/36 |
| 42 | `LEFT-CIRCLE-STAR`   | `● ┄ ★` | The Circle is to the left of the Star.   |   18/36 |
| 43 | `LEFT-STAR-SQUARE`   | `★ ┄ ■` | The Star is to the left of the Square.   |   18/36 |
| 44 | `LEFT-SQUARE-STAR`   | `■ ┄ ★` | The Square is to the left of the Star.   |   18/36 |
| 45 | `LEFT-CIRCLE-SQUARE` | `● ┄ ■` | The Circle is to the left of the Square. |   18/36 |
| 46 | `LEFT-SQUARE-CIRCLE` | `■ ┄ ●` | The Square is to the left of the Circle. |   18/36 |

#### Touching at a corner

|  # | ID                    | Front   | Back                                         | True in |
| -: | --------------------- | ------- | -------------------------------------------- | ------: |
| 47 | `TOUCH-STAR-CIRCLE`   | `★ ⤡ ●` | The Star and the Circle touch at a corner.   |   16/36 |
| 48 | `TOUCH-STAR-SQUARE`   | `★ ⤡ ■` | The Star and the Square touch at a corner.   |   16/36 |
| 49 | `TOUCH-CIRCLE-SQUARE` | `● ⤡ ■` | The Circle and the Square touch at a corner. |   16/36 |

#### Row distance

|  # | ID                      | Front    | Back                                               | True in |
| -: | ----------------------- | -------- | -------------------------------------------------- | ------: |
| 50 | `ROWGAP1-STAR-CIRCLE`   | `★ ↕1 ●` | The Star and the Circle are in neighboring rows.   |   24/36 |
| 51 | `ROWGAP1-STAR-SQUARE`   | `★ ↕1 ■` | The Star and the Square are in neighboring rows.   |   24/36 |
| 52 | `ROWGAP1-CIRCLE-SQUARE` | `● ↕1 ■` | The Circle and the Square are in neighboring rows. |   24/36 |

#### Column distance

|  # | ID                      | Front    | Back                                                  | True in |
| -: | ----------------------- | -------- | ----------------------------------------------------- | ------: |
| 53 | `COLGAP1-STAR-CIRCLE`   | `★ ↔1 ●` | The Star and the Circle are in neighboring columns.   |   24/36 |
| 54 | `COLGAP1-STAR-SQUARE`   | `★ ↔1 ■` | The Star and the Square are in neighboring columns.   |   24/36 |
| 55 | `COLGAP1-CIRCLE-SQUARE` | `● ↔1 ■` | The Circle and the Square are in neighboring columns. |   24/36 |

### Expert deck (36 cards)

#### Row character left/right of a character

|  # | ID                   | Front     | Back                                                  | True in |
| -: | -------------------- | --------- | ----------------------------------------------------- | ------: |
| 56 | `XROW1-LEFT-STAR`    | `(1) ┄ ★` | The character in row 1 is to the left of the Star.    |   12/36 |
| 57 | `XROW1-RIGHT-STAR`   | `★ ┄ (1)` | The character in row 1 is to the right of the Star.   |   12/36 |
| 58 | `XROW1-LEFT-CIRCLE`  | `(1) ┄ ●` | The character in row 1 is to the left of the Circle.  |   12/36 |
| 59 | `XROW1-RIGHT-CIRCLE` | `● ┄ (1)` | The character in row 1 is to the right of the Circle. |   12/36 |
| 60 | `XROW1-LEFT-SQUARE`  | `(1) ┄ ■` | The character in row 1 is to the left of the Square.  |   12/36 |
| 61 | `XROW1-RIGHT-SQUARE` | `■ ┄ (1)` | The character in row 1 is to the right of the Square. |   12/36 |
| 62 | `XROW2-LEFT-STAR`    | `(2) ┄ ★` | The character in row 2 is to the left of the Star.    |   12/36 |
| 63 | `XROW2-RIGHT-STAR`   | `★ ┄ (2)` | The character in row 2 is to the right of the Star.   |   12/36 |
| 64 | `XROW2-LEFT-CIRCLE`  | `(2) ┄ ●` | The character in row 2 is to the left of the Circle.  |   12/36 |
| 65 | `XROW2-RIGHT-CIRCLE` | `● ┄ (2)` | The character in row 2 is to the right of the Circle. |   12/36 |
| 66 | `XROW2-LEFT-SQUARE`  | `(2) ┄ ■` | The character in row 2 is to the left of the Square.  |   12/36 |
| 67 | `XROW2-RIGHT-SQUARE` | `■ ┄ (2)` | The character in row 2 is to the right of the Square. |   12/36 |
| 68 | `XROW3-LEFT-STAR`    | `(3) ┄ ★` | The character in row 3 is to the left of the Star.    |   12/36 |
| 69 | `XROW3-RIGHT-STAR`   | `★ ┄ (3)` | The character in row 3 is to the right of the Star.   |   12/36 |
| 70 | `XROW3-LEFT-CIRCLE`  | `(3) ┄ ●` | The character in row 3 is to the left of the Circle.  |   12/36 |
| 71 | `XROW3-RIGHT-CIRCLE` | `● ┄ (3)` | The character in row 3 is to the right of the Circle. |   12/36 |
| 72 | `XROW3-LEFT-SQUARE`  | `(3) ┄ ■` | The character in row 3 is to the left of the Square.  |   12/36 |
| 73 | `XROW3-RIGHT-SQUARE` | `■ ┄ (3)` | The character in row 3 is to the right of the Square. |   12/36 |

#### Column character above/below a character

|  # | ID                   | Front     | Back                                           | True in |
| -: | -------------------- | --------- | ---------------------------------------------- | ------: |
| 74 | `XCOLA-ABOVE-STAR`   | `(A) ┆ ★` | The character in column A is above the Star.   |   12/36 |
| 75 | `XCOLA-BELOW-STAR`   | `★ ┆ (A)` | The character in column A is below the Star.   |   12/36 |
| 76 | `XCOLA-ABOVE-CIRCLE` | `(A) ┆ ●` | The character in column A is above the Circle. |   12/36 |
| 77 | `XCOLA-BELOW-CIRCLE` | `● ┆ (A)` | The character in column A is below the Circle. |   12/36 |
| 78 | `XCOLA-ABOVE-SQUARE` | `(A) ┆ ■` | The character in column A is above the Square. |   12/36 |
| 79 | `XCOLA-BELOW-SQUARE` | `■ ┆ (A)` | The character in column A is below the Square. |   12/36 |
| 80 | `XCOLB-ABOVE-STAR`   | `(B) ┆ ★` | The character in column B is above the Star.   |   12/36 |
| 81 | `XCOLB-BELOW-STAR`   | `★ ┆ (B)` | The character in column B is below the Star.   |   12/36 |
| 82 | `XCOLB-ABOVE-CIRCLE` | `(B) ┆ ●` | The character in column B is above the Circle. |   12/36 |
| 83 | `XCOLB-BELOW-CIRCLE` | `● ┆ (B)` | The character in column B is below the Circle. |   12/36 |
| 84 | `XCOLB-ABOVE-SQUARE` | `(B) ┆ ■` | The character in column B is above the Square. |   12/36 |
| 85 | `XCOLB-BELOW-SQUARE` | `■ ┆ (B)` | The character in column B is below the Square. |   12/36 |
| 86 | `XCOLC-ABOVE-STAR`   | `(C) ┆ ★` | The character in column C is above the Star.   |   12/36 |
| 87 | `XCOLC-BELOW-STAR`   | `★ ┆ (C)` | The character in column C is below the Star.   |   12/36 |
| 88 | `XCOLC-ABOVE-CIRCLE` | `(C) ┆ ●` | The character in column C is above the Circle. |   12/36 |
| 89 | `XCOLC-BELOW-CIRCLE` | `● ┆ (C)` | The character in column C is below the Circle. |   12/36 |
| 90 | `XCOLC-ABOVE-SQUARE` | `(C) ┆ ■` | The character in column C is above the Square. |   12/36 |
| 91 | `XCOLC-BELOW-SQUARE` | `■ ┆ (C)` | The character in column C is below the Square. |   12/36 |

### Rejected candidates (53)

| Candidate               | Wording                                          | Reason                                                                                                                            |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `ROWCOL-1-A`            | The character in row 1 is in column A.           | same truth as `CELL-A1` (“A character stands on cell A1.”)                                                                        |
| `COLROW-A-1`            | The character in column A is in row 1.           | same truth as `CELL-A1` (“A character stands on cell A1.”)                                                                        |
| `ROWCOL-1-B`            | The character in row 1 is in column B.           | same truth as `CELL-B1` (“A character stands on cell B1.”)                                                                        |
| `COLROW-B-1`            | The character in column B is in row 1.           | same truth as `CELL-B1` (“A character stands on cell B1.”)                                                                        |
| `ROWCOL-1-C`            | The character in row 1 is in column C.           | same truth as `CELL-C1` (“A character stands on cell C1.”)                                                                        |
| `COLROW-C-1`            | The character in column C is in row 1.           | same truth as `CELL-C1` (“A character stands on cell C1.”)                                                                        |
| `ROWCOL-2-A`            | The character in row 2 is in column A.           | same truth as `CELL-A2` (“A character stands on cell A2.”)                                                                        |
| `COLROW-A-2`            | The character in column A is in row 2.           | same truth as `CELL-A2` (“A character stands on cell A2.”)                                                                        |
| `ROWCOL-2-B`            | The character in row 2 is in column B.           | same truth as `CELL-B2` (“A character stands on cell B2.”)                                                                        |
| `COLROW-B-2`            | The character in column B is in row 2.           | same truth as `CELL-B2` (“A character stands on cell B2.”)                                                                        |
| `ROWCOL-2-C`            | The character in row 2 is in column C.           | same truth as `CELL-C2` (“A character stands on cell C2.”)                                                                        |
| `COLROW-C-2`            | The character in column C is in row 2.           | same truth as `CELL-C2` (“A character stands on cell C2.”)                                                                        |
| `ROWCOL-3-A`            | The character in row 3 is in column A.           | same truth as `CELL-A3` (“A character stands on cell A3.”)                                                                        |
| `COLROW-A-3`            | The character in column A is in row 3.           | same truth as `CELL-A3` (“A character stands on cell A3.”)                                                                        |
| `ROWCOL-3-B`            | The character in row 3 is in column B.           | same truth as `CELL-B3` (“A character stands on cell B3.”)                                                                        |
| `COLROW-B-3`            | The character in column B is in row 3.           | same truth as `CELL-B3` (“A character stands on cell B3.”)                                                                        |
| `ROWCOL-3-C`            | The character in row 3 is in column C.           | same truth as `CELL-C3` (“A character stands on cell C3.”)                                                                        |
| `COLROW-C-3`            | The character in column C is in row 3.           | same truth as `CELL-C3` (“A character stands on cell C3.”)                                                                        |
| `COUNT-DARK-3`          | All three characters are on dark cells.          | same truth as `CELL-B2` (“A character stands on cell B2.”)                                                                        |
| `COUNT-LIGHT-0`         | No character is on a light cell.                 | same truth as `CELL-B2` (“A character stands on cell B2.”)                                                                        |
| `COUNT-DARK-1`          | Exactly one character is on a dark cell.         | same truth as `COUNT-LIGHT-2` (“Exactly two characters are on light cells.”)                                                      |
| `COUNT-LIGHT-1`         | Exactly one character is on a light cell.        | never true                                                                                                                        |
| `COUNT-LIGHT-3`         | All three characters are on light cells.         | never true                                                                                                                        |
| `LINE-ROW1-DARK`        | The character in row 1 is on a dark cell.        | excluded: disguised negation ("cell X is empty"), and the only family that makes some arrangements satisfy more cards than others |
| `LINE-ROW2-DARK`        | The character in row 2 is on a dark cell.        | same truth as `CELL-B2` (“A character stands on cell B2.”)                                                                        |
| `LINE-ROW3-DARK`        | The character in row 3 is on a dark cell.        | excluded: disguised negation ("cell X is empty"), and the only family that makes some arrangements satisfy more cards than others |
| `LINE-COLA-DARK`        | The character in column A is on a dark cell.     | excluded: disguised negation ("cell X is empty"), and the only family that makes some arrangements satisfy more cards than others |
| `LINE-COLB-DARK`        | The character in column B is on a dark cell.     | same truth as `CELL-B2` (“A character stands on cell B2.”)                                                                        |
| `LINE-COLC-DARK`        | The character in column C is on a dark cell.     | excluded: disguised negation ("cell X is empty"), and the only family that makes some arrangements satisfy more cards than others |
| `LINE-ROW1-LIGHT`       | The character in row 1 is on a light cell.       | same truth as `CELL-B1` (“A character stands on cell B1.”)                                                                        |
| `LINE-ROW2-LIGHT`       | The character in row 2 is on a light cell.       | same truth as `COUNT-LIGHT-2` (“Exactly two characters are on light cells.”)                                                      |
| `LINE-ROW3-LIGHT`       | The character in row 3 is on a light cell.       | same truth as `CELL-B3` (“A character stands on cell B3.”)                                                                        |
| `LINE-COLA-LIGHT`       | The character in column A is on a light cell.    | same truth as `CELL-A2` (“A character stands on cell A2.”)                                                                        |
| `LINE-COLB-LIGHT`       | The character in column B is on a light cell.    | same truth as `COUNT-LIGHT-2` (“Exactly two characters are on light cells.”)                                                      |
| `LINE-COLC-LIGHT`       | The character in column C is on a light cell.    | same truth as `CELL-C2` (“A character stands on cell C2.”)                                                                        |
| `BELOW-STAR-CIRCLE`     | The Star is below the Circle.                    | same truth as `ABOVE-CIRCLE-STAR` (“The Circle is above the Star.”)                                                               |
| `RIGHT-STAR-CIRCLE`     | The Star is to the right of the Circle.          | same truth as `LEFT-CIRCLE-STAR` (“The Circle is to the left of the Star.”)                                                       |
| `BELOW-CIRCLE-STAR`     | The Circle is below the Star.                    | same truth as `ABOVE-STAR-CIRCLE` (“The Star is above the Circle.”)                                                               |
| `RIGHT-CIRCLE-STAR`     | The Circle is to the right of the Star.          | same truth as `LEFT-STAR-CIRCLE` (“The Star is to the left of the Circle.”)                                                       |
| `BELOW-STAR-SQUARE`     | The Star is below the Square.                    | same truth as `ABOVE-SQUARE-STAR` (“The Square is above the Star.”)                                                               |
| `RIGHT-STAR-SQUARE`     | The Star is to the right of the Square.          | same truth as `LEFT-SQUARE-STAR` (“The Square is to the left of the Star.”)                                                       |
| `BELOW-SQUARE-STAR`     | The Square is below the Star.                    | same truth as `ABOVE-STAR-SQUARE` (“The Star is above the Square.”)                                                               |
| `RIGHT-SQUARE-STAR`     | The Square is to the right of the Star.          | same truth as `LEFT-STAR-SQUARE` (“The Star is to the left of the Square.”)                                                       |
| `BELOW-CIRCLE-SQUARE`   | The Circle is below the Square.                  | same truth as `ABOVE-SQUARE-CIRCLE` (“The Square is above the Circle.”)                                                           |
| `RIGHT-CIRCLE-SQUARE`   | The Circle is to the right of the Square.        | same truth as `LEFT-SQUARE-CIRCLE` (“The Square is to the left of the Circle.”)                                                   |
| `BELOW-SQUARE-CIRCLE`   | The Square is below the Circle.                  | same truth as `ABOVE-CIRCLE-SQUARE` (“The Circle is above the Square.”)                                                           |
| `RIGHT-SQUARE-CIRCLE`   | The Square is to the right of the Circle.        | same truth as `LEFT-CIRCLE-SQUARE` (“The Circle is to the left of the Square.”)                                                   |
| `ROWGAP2-STAR-CIRCLE`   | The Star and the Circle are two rows apart.      | same truth as `ROW-SQUARE-2` (“The Square is in row 2.”)                                                                          |
| `ROWGAP2-STAR-SQUARE`   | The Star and the Square are two rows apart.      | same truth as `ROW-CIRCLE-2` (“The Circle is in row 2.”)                                                                          |
| `ROWGAP2-CIRCLE-SQUARE` | The Circle and the Square are two rows apart.    | same truth as `ROW-STAR-2` (“The Star is in row 2.”)                                                                              |
| `COLGAP2-STAR-CIRCLE`   | The Star and the Circle are two columns apart.   | same truth as `COL-SQUARE-B` (“The Square is in column B.”)                                                                       |
| `COLGAP2-STAR-SQUARE`   | The Star and the Square are two columns apart.   | same truth as `COL-CIRCLE-B` (“The Circle is in column B.”)                                                                       |
| `COLGAP2-CIRCLE-SQUARE` | The Circle and the Square are two columns apart. | same truth as `COL-STAR-B` (“The Star is in column B.”)                                                                           |
