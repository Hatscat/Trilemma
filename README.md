# Trilemma

A simultaneous logic game for the web and mobile (PWA), designed so it can also be published as a tabletop game. 1 to 8
players.

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
  - **the Square**: an orange square with three eyes.
- **Rule cards**: 55 in the base deck, plus 36 in the expert deck. Each card shows one rule as a symbolic drawing with a
  short caption on the same face. All cards share the same plain back. See [docs/rule-cards.md](docs/rule-cards.md).
- **8 order tokens**, numbered 1 to 8.
- **An optional timer** (a sand timer or any clock).
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
4. Put one order token per player in the middle of the table, from 1 up to the number of players.
5. Decide together whether you play with a timer and, if so, agree on its duration (like the time control of a chess
   clock). Without a timer, the search simply ends when everyone is ready.

### A round

1. **Search.** Everyone searches at the same time for the largest group of face-up cards that are compatible.
2. **Lock in.** When a player is done, they secretly write down the size of their best group (their **bid**), turn their
   slate face down and take the **lowest order token** still available. A locked bid can no longer be changed.
   - The search ends when every player has locked in.
   - If the timer runs out first, the players who have not locked in write their bid immediately and receive the
     remaining order tokens at random.
3. **Reveal.** Everyone reveals their bid at the same time.
4. **Order.** The highest bid demonstrates first, then the next highest, and so on. **Ties go to the player who locked
   in first** (lowest order token).
5. **Demonstration.** The player places the 3 characters on the board. Then they show **exactly as many cards as they
   bid**, one by one, and the other players check each card against the board.
   - **All or nothing.** If a card is false, or if the player cannot show as many valid cards as announced, the whole
     demonstration is invalid, even with 6 valid cards out of 7 announced. The player wins nothing.
   - The characters are then removed and the next player in the order demonstrates from scratch, **with their own bid**.
     A bid never changes: a player who bid 5 shows exactly 5 cards, even if they now see a group of 6.
   - If every announced card is true, the player **wins those cards** and puts them in their score pile.
   - If every demonstration fails, nobody scores. The face-up cards stay and a new search starts. This is rare: a single
     card can always be made true, so a safe bid always exists.
6. **Refill.** Return the order tokens to the middle. The other face-up cards stay where they are. Draw new cards to
   fill the empty slots, back to 9 face-up cards (as long as the pile lasts).

### End of the game

The game ends when the draw pile is empty and no rule card is left face up. A single card can always be made true, so
the table always ends up empty.

**Score = cards won.** The highest score wins, and tied players share the victory.

**Solo:** play the same rounds and try to empty the deck in as few rounds as possible. With perfect play, the base deck
takes 9.3 rounds on average (between 8 and 11).

### Design notes

- **No luck in tie-breaks.** Ties go to the fastest player, in the spirit of Set. This creates a real dilemma: lock in a
  safe bid early, or keep searching for a higher one and risk losing ties.
- **Overbidding does not pay.** An all-or-nothing demonstration wins nothing, and it hands the round to the next player.
- **To validate in playtests:** the default of 9 face-up cards, suitable timer durations, and the game length (estimated
  at 25–30 minutes with the base deck).

## Digital version (PWA)

Mobile first, installable and playable offline.

### Modes

- **Classic.** The timer is optional and its duration is chosen before the game. The player locks in their bid, then
  builds the demonstration: they place the characters and select exactly as many cards as they bid. The game validates
  the cards, then reveals the true maximum and an optimal arrangement.
- **Challenge** (working name). The game announces the maximum for each round, and the player must find a compatible
  group of that size. Any valid group is accepted, since there are often several.

Cards: a click or a tap on a card zooms in on it so its caption is easy to read.

Later ideas: a tutorial, hints (like the light bulb of the inspiration app), a daily puzzle (same draw for everyone),
local pass-and-play multiplayer (ties broken by lock-in time), and a toggle for the expert deck.

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
