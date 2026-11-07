# Riddle Composition (working title)

A simultaneous logic game for the web and mobile (PWA), designed so it can also be published as a tabletop game.

Three little characters must be placed on a 3 × 3 board. A set of **rule cards** is face up, but the rules contradict
each other. Every player races to find **the largest group of rules that can all be true at the same time**, bids that
number, and must then prove it on the board.

> **Status: design phase.** The rules, the rule-card catalog and the math are written. No game code exists yet (`src/`
> is empty).

## Inspirations

- [**Set**](https://en.wikipedia.org/wiki/Set_(card_game)): all players search the same face-up cards at the same time.
- [**Einstein's riddle / Zebra puzzle**](https://en.wikipedia.org/wiki/Zebra_Puzzle): clues that cross-reference
  attributes ("the character in row 1 is in column C").
- [**Einstein Riddle Island Puzzle**](https://play.google.com/store/apps/details?id=com.blackpumalabs.treasureisland) by
  [Black Puma Labs](https://blackpumalabs.com/): a grid with one item per row and column, and clues drawn as compact
  symbolic tiles.

The twist: instead of solving one consistent riddle, players **compose** the largest consistent riddle from a pool of
conflicting clues.

## Components (tabletop version)

- **1 board**: a 3 × 3 grid. Rows are numbered 1 to 3 from top to bottom, columns are lettered A to C from left to
  right. The board is shaded like a checkerboard: the 4 corners and the center are **dark** (5 cells), the 4 edge-middle
  cells are **light**.

  ```
      A   B   C
  1   ▓   ░   ▓
  2   ░   ▓   ░
  3   ▓   ░   ▓
  ```

- **3 characters**, simple geometric shapes with a face, each with a unique color:
  - **the Star**: a purple five-pointed star with one eye (a cyclops);
  - **the Circle**: a green circle with two eyes;
  - **the Square**: a red square with three eyes.
- **Rule cards**: 55 in the base deck, plus 36 in the expert deck. Each card states one rule, with a symbolic drawing
  and a short sentence. See [docs/rule-cards.md](docs/rule-cards.md).
- **Priority tokens.**
- **A timer** (e.g. a 2-minute sand timer).
- For each player, a way to **secretly show a number** from 1 to 9 (a small dry-erase slate or a set of number cards).

## Core rule of placement

A valid placement (an **arrangement**) puts the 3 characters on the board with **exactly one character per row and
exactly one per column**. There are 36 possible arrangements.

A group of rule cards is **compatible** when at least one arrangement makes all of them true at the same time.

## How to play

### Setup

1. Place the board in the middle of the table, with the 3 characters **next to it**. They help players picture
   arrangements, but nobody moves them while searching.
2. Shuffle the rule cards (base deck only for the first games) into a face-down draw pile.
3. Draw **9 cards** and lay them face up in a 3 × 3 grid. The math behind this number is in
   [docs/math.md](docs/math.md#4-choosing-n-face-up-cards-per-round).

### A round

1. **Search.** Everyone searches at the same time for the largest group of face-up cards that are compatible.
2. **Bid.** Each player secretly writes down the size of the best group they found. When the timer runs out, everyone
   reveals their number at the same time.
3. **Order.** The highest bid demonstrates first, then the next highest, and so on.
   - **Ties** are broken at random. Each tied player who loses the draw receives a **priority token**.
   - In a later tie, a player can **spend a token** to skip the draw and demonstrate first.
4. **Demonstration.** The player places the 3 characters on the board. Then they reveal the cards of their group one by
   one, and the other players check each card against the board.
   - If a card is false, the demonstration **stops immediately**. The characters are removed and the next player in the
     order demonstrates from scratch.
   - If every announced card is true, the player **wins those cards** and puts them in their score pile.
5. **Refill.** The other face-up cards stay where they are. Draw new cards to fill the empty slots, back to 9 face-up
   cards (as long as the pile lasts).

### End of the game

The game ends when the draw pile is empty and no rule card is left face up. A single card can always be made true, so
the table always ends up empty.

**Score = cards won + priority tokens still held.** The highest score wins, and tied players share the victory.

### Open questions (to settle in playtests)

1. **Penalty for a failed demonstration.** Right now, overbidding costs nothing. A player who found 6 can bid 7 to
   demonstrate first and hope to find the 7th card while placing. Suggestions: a failed demonstration costs one won card
   or one priority token.
2. **What if every demonstration fails?** Suggestion: nobody scores, the cards stay and a new round starts.
3. **Exactly the bid?** Suggestion: a demonstration must show exactly the announced number of cards.
4. **Token details.** Is a token discarded when spent? (Since it is worth 1 point at the end, spending it is a real
   trade-off.) If several tied players spend a token, how are they ordered? Does a tied player who loses the draw keep
   their token if they end up winning the round anyway?
5. **Card sides.** Two sides with information (symbol and text) reveal the top of a face-down pile. See
   [docs/rule-cards.md](docs/rule-cards.md#card-anatomy).
6. **Timer.** How long should it be, and can it stop early when everyone is ready?
7. **Player count.** Probably 2–6 (the search is simultaneous). The PWA covers solo play.

## Digital version (PWA)

Mobile first, installable and playable offline.

### Modes

- **Classic.** The timer is optional. The player enters their bid, then builds the demonstration: they place the
  characters and select the cards. The game validates each card, then reveals the true maximum and an optimal
  arrangement.
- **Challenge** (working name). The game announces the maximum for each round, and the player must find a compatible
  group of that size. Any valid group is accepted, since there are often several.

Later ideas: a tutorial, hints (like the light bulb of the inspiration app), a daily puzzle (same draw for everyone),
local pass-and-play multiplayer, and a toggle for the expert deck.

### Tech stack

- **TypeScript**, strict.
- **Deno 2** for tests, formatting, linting and the analysis scripts.
- **Vite or Deno** for the build (to be decided).
- **No web framework and no game engine.** Only native browser Web APIs: DOM, SVG/Canvas, CSS, Custom Elements, Pointer
  Events, Service Worker, Web App Manifest, IndexedDB/localStorage.

## Repository layout

```
analysis/   Deno scripts: board model, rule-card catalog, probability analysis
docs/       rule-cards.md (full card list and design), math.md (probabilities, choice of n)
src/        future PWA source (empty for now)
deno.json   Deno tasks and formatter settings
```

```sh
deno task analyze   # probability analysis (markdown on stdout)
deno task cards     # rule-card catalog (markdown on stdout)
```
