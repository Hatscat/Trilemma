# Game math

All figures come from [`analysis/analyze.ts`](../analysis/analyze.ts) (`deno task analyze`, seed `20261107`). The
counting results are exact. The draw and game figures are Monte Carlo estimates: 50,000 draws per value of n and 5,000
full games per value of n. The 95% margin of error is under ±0.5 percentage points for proportions and under ±0.01 for
means.

## 1. The board: 36 arrangements

A legal arrangement puts exactly one character in each row and each column.

- The occupied cells form one of **3! = 6 position patterns** (like placing 3 non-attacking rooks).
- The 3 characters can be assigned to those 3 cells in **3! = 6 ways**.
- Total: **6 × 6 = 36 arrangements**. Equivalently, every character has a row (3! row orders) and a column (3! column
  orders).

### Parity

**The number of characters on light cells is always even: 0 or 2.**

Number rows and columns 1 to 3. A cell is dark when row + column is even (A1 = 1 + 1 is dark). Over the 3 occupied
cells, the sum of all row and column numbers is always (1 + 2 + 3) + (1 + 2 + 3) = 12, which is even. A sum is even only
if it contains an even number of odd terms, so an even number of occupied cells are light.

| Position patterns                | Arrangements | On dark | On light | Center B2 |
| -------------------------------- | -----------: | ------: | -------: | --------- |
| 2 diagonals (A1-B2-C3, C1-B2-A3) |           12 |       3 |        0 | occupied  |
| 4 other patterns                 |           24 |       1 |        2 | empty     |

This collapses several imagined rules into the same truth. For example, "all three characters are on dark cells", "no
character is on a light cell", "the character in row 2 is on a dark cell", "the character in column B is on a dark cell"
and "a character stands on B2" are all the same statement. See [rule-cards.md](rule-cards.md#families) for the full
list.

Other equivalences found by the duplicate check:

- "The character in row r is in column c" = "the character in column c is in row r" = "cell c r is occupied".
- "X and Y are two rows apart" = "the third character is in row 2" (same for columns).
- "X is below Y" = "Y is above X", and "X is to the right of Y" = "Y is to the left of X".
- Two characters can never be side by side, so "touching" can only be diagonal.

## 2. Building the deck

Each card is modeled as its **truth set**: the subset of the 36 arrangements for which it is true. The generator
produces **144 candidate cards** from all the rule families (including every alternative wording), then:

- drops **47 duplicates** (same truth set as an earlier card, whatever the wording);
- drops **2 impossible cards** ("exactly one / all three characters on light cells");
- excludes **4 cards** of the "row/column character on a dark cell" family. They are disguised negations ("B1 is
  empty"), and they would break the balance described below.

Result: **91 cards = 55 base + 36 expert.**

| Family                                                              |   Cards | True for (out of 36) |
| ------------------------------------------------------------------- | ------: | -------------------: |
| Character in a row / column                                         |   9 + 9 |                   12 |
| Occupied cell                                                       |       9 |                   12 |
| Character on a dark / light cell                                    |   3 + 3 |              20 / 16 |
| Exactly two characters on light cells                               |       1 |                   24 |
| Above / left of                                                     |   6 + 6 |                   18 |
| Touching at a corner                                                |       3 |                   16 |
| Neighboring rows / columns                                          |   3 + 3 |                   24 |
| _Expert:_ row character left/right of, column character above/below | 18 + 18 |                   12 |

A random base card is true for 43.6% of arrangements on average (39.6% with the expert cards). Only 7.1% of base card
pairs contradict each other (e.g. "the Star is in row 1" and "the Star is in row 2"), so most contradictions only appear
in groups of 3 or more cards. That is where the puzzle lies.

## 3. All cards in play at once

**Every arrangement satisfies exactly 24 of the 55 base cards** (36 of the 91 cards with the expert deck). So:

- the largest possible group of compatible cards is **24** (base) or **36** (full deck);
- there are exactly 36 such maximal groups, one per arrangement;
- before the draw, no arrangement is a better bet than another.

Per arrangement, family by family:

| Family                                            | Diagonal arrangements | Other arrangements |
| ------------------------------------------------- | --------------------: | -----------------: |
| Row, column, cell, shade, above, left of (3 each) |                    18 |                 18 |
| Neighboring rows, neighboring columns (2 each)    |                     4 |                  4 |
| Touching at a corner                              |                     2 |                  1 |
| Exactly two characters on light cells             |                     0 |                  1 |
| **Total (base)**                                  |                **24** |             **24** |
| Expert cross references (6 + 6)                   |                    12 |                 12 |

With the 4 excluded cards, diagonal arrangements would satisfy 28 cards against 26 for the others. Players would learn
to try the diagonals first.

## 4. Choosing n (face-up cards per round)

For each draw of n cards:

- **max**: the largest number of mutually compatible cards (the number to bid);
- **optimal arrangements**: how many of the 36 arrangements reach the max;
- **optimal groups**: how many different card groups of size max are compatible (several arrangements can validate the
  same group);
- **arrangements at max − 1**: near misses, where an incomplete search typically ends.

### Base deck (55 cards)

|     n |   Mean max (SD) | All n compatible | Most frequent max | Optimal arrangements: mean / unique | A random arrangement is optimal | Optimal groups: mean / unique | Arrangements at max − 1 |
| ----: | --------------: | ---------------: | ----------------- | ----------------------------------: | ------------------------------: | ----------------------------: | ----------------------: |
|     4 |     3.50 (0.54) |            52.1% | 4 (52%)           |                          4.51 / 15% |                           12.5% |                    1.57 / 59% |                    10.6 |
|     5 |     4.19 (0.60) |            28.8% | 4 (61%)           |                          3.70 / 22% |                           10.3% |                    1.86 / 49% |                     8.8 |
|     6 |     4.83 (0.66) |            13.5% | 5 (57%)           |                          3.27 / 28% |                            9.1% |                    2.10 / 45% |                     7.7 |
|     7 |     5.44 (0.70) |             5.4% | 5 (48%)           |                          2.99 / 32% |                            8.3% |                    2.25 / 43% |                     6.8 |
|     8 |     6.03 (0.74) |             2.0% | 6 (53%)           |                          2.77 / 35% |                            7.7% |                    2.32 / 42% |                     6.2 |
| **9** | **6.60 (0.78)** |         **0.7%** | **7 (43%)**       |                      **2.62 / 38%** |                        **7.3%** |                **2.35 / 42%** |                 **5.7** |
|    10 |     7.16 (0.81) |             0.2% | 7 (49%)           |                          2.49 / 40% |                            6.9% |                    2.33 / 43% |                     5.3 |
|    11 |     7.71 (0.84) |             0.1% | 8 (43%)           |                          2.41 / 42% |                            6.7% |                    2.31 / 44% |                     4.9 |
|    12 |     8.24 (0.87) |             0.0% | 8 (46%)           |                          2.34 / 43% |                            6.5% |                    2.28 / 44% |                     4.7 |
|    14 |     9.29 (0.92) |             0.0% | 9 (43%)           |                          2.23 / 46% |                            6.2% |                    2.20 / 46% |                     4.2 |
|    16 |    10.30 (0.95) |             0.0% | 10 (42%)          |                          2.14 / 47% |                            5.9% |                    2.14 / 47% |                     3.9 |

Distribution of the max:

| max | n = 6 | n = 8 | **n = 9** | n = 12 |
| --: | ----: | ----: | --------: | -----: |
|   3 |  0.9% |       |           |        |
|   4 | 29.0% |  0.8% |      0.1% |        |
|   5 | 56.5% | 21.7% |      5.6% |        |
|   6 | 13.5% | 53.4% | **40.5%** |   0.9% |
|   7 |       | 22.1% | **42.6%** |  17.4% |
|   8 |       |  2.0% |     10.6% |  45.7% |
|   9 |       |       |      0.7% |  28.9% |
|  10 |       |       |           |   6.4% |
|  11 |       |       |           |   0.7% |

### Full deck (base + expert, 91 cards)

Expert cards are more restrictive (true for 1 in 3), so the max is slightly lower:

|     n |   Mean max (SD) | All n compatible | Distribution of the max           | Optimal arrangements: mean / unique |
| ----: | --------------: | ---------------: | --------------------------------- | ----------------------------------: |
|     6 |     4.67 (0.65) |             8.7% | 4: 39%, 5: 51%, 6: 9%             |                          2.96 / 34% |
|     8 |     5.82 (0.75) |             1.2% | 5: 33%, 6: 49%, 7: 15%            |                          2.53 / 41% |
| **9** | **6.37 (0.79)** |         **0.4%** | **5: 11%, 6: 48%, 7: 34%, 8: 7%** |                      **2.40 / 43%** |
|    12 |     7.93 (0.90) |             0.0% | 7: 29%, 8: 44%, 9: 20%, 10: 4%    |                          2.18 / 47% |

### Recommendation: n = 9, laid out in a 3 × 3 grid

1. **No trivial rounds.** All 9 cards are compatible in only 0.7% of rounds, a rare jackpot. At n = 6 it happens in
   13.5% of rounds, and at n = 4 in half of them.
2. **The target is never obvious.** The max is 6 or 7 in 83% of rounds and 5 or 8 in 16%. Players cannot just assume
   "it's always 6".
3. **Searching pays off.** Only 7.3% of arrangements are optimal and 15.8% are one card short. A quick search often ends
   at max − 1, so the best searchers win the bid.
4. **Manageable mental load.** Each candidate arrangement means checking n cards. Going from 9 to 12 adds a third more
   checks for little extra variety.
5. **Game length.** About 9 rounds with the base deck (see below).
6. **Theme.** A 3 × 3 card layout echoes the 3 × 3 board.

Variants: **n = 6** for a tutorial or young players (expect about 1 trivial round in 7), **n = 8** if 9 feels heavy, **n
= 12** for a long-thinking expert table. Bids range from 1 to n, so with n = 9 each player needs a way to secretly show
a number from 1 to 9.

### Several solutions per draw

At n = 9 there are on average 2.6 optimal arrangements (unique in 38% of draws) and 2.35 different optimal card groups
(unique in 42% of draws). Increasing n barely changes this (47% unique at n = 16). It is structural: a draw often
contains no card that tells two arrangements apart. For example, a table without any column-related card cannot
distinguish arrangements that only differ by their columns.

This is not what makes players tie. Player ties happen when several players find the max, which depends on skill and
time, not on how many solutions exist. Only playtests can measure it, and the priority tokens exist to resolve it. Two
consequences for the PWA:

- **Validation** must accept _any_ compatible group of the bid size, never a single expected answer.
- **Challenge mode** should accept any group reaching the max, and can show "other solutions exist" afterwards.

## 5. Game length

In this simulation, each round the winner takes all the cards that are true for one optimal arrangement. That is exactly
max cards, because those cards cannot contain anything incompatible. Missing cards are refilled from the pile.

| Deck          |     n | Rounds per game: mean (min–max) | Cards won per round (full table) | All table compatible | Endgame rounds (pile empty) |
| ------------- | ----: | ------------------------------- | -------------------------------: | -------------------: | --------------------------: |
| Base (55)     |     6 | 12.1 (10–14)                    |                             4.81 |                12.7% |                         1.3 |
| Base (55)     |     8 | 10.0 (8–12)                     |                             6.01 |                 2.1% |                         1.6 |
| **Base (55)** | **9** | **9.3 (8–11)**                  |                         **6.58** |             **0.7%** |                     **1.7** |
| Base (55)     |    12 | 7.8 (6–9)                       |                             8.24 |                 0.0% |                         1.9 |
| Full (91)     |     9 | 15.3 (13–17)                    |                             6.32 |                 0.4% |                         1.8 |
| Full (91)     |    12 | 12.6 (11–14)                    |                             7.92 |                 0.0% |                         2.1 |

- Cards left on the table after a round are all false for the winning arrangement. This does not bias later rounds: 6.58
  cards won per full-table round, against 6.60 for a fresh random draw.
- The table always ends up empty, because a single card can always be satisfied.
- Rough duration, assuming a 2-minute timer plus about 1 minute of demonstration: **about 25–30 minutes** for the base
  deck and about 45 minutes for the full deck. To be confirmed in playtests.
- The simulation assumes perfect players. Real players will often bid max − 1, so slightly fewer cards are won per round
  and games are slightly longer.

## 6. Replayability

There are C(55, 9) ≈ **6.4 billion** different starting tables with the base deck, and C(91, 9) ≈ **7.8 × 10¹¹** with
the full deck.
