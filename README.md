# Trilemma

A simultaneous logic game for the web and mobile (PWA), designed so it can also be published as a tabletop game. 1 to 8
players.

Three little characters must be placed on a 3 × 3 board. A set of **rule cards** is face up, but the rules contradict
each other. Every player races to find **the largest group of rules that can all be true at the same time**, bids that
number, and must then prove it on the board.

> **Status: v0.2.0.** Solo PWA with the Classic and Challenge modes and an interactive tutorial, in English, French and
> Spanish, installable and playable offline. Published on GitHub Pages (see [Deployment](#deployment)). Next steps:
> [docs/roadmap.md](docs/roadmap.md).

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
  cells are **light**. Dark cells also carry diagonal stripes, so they can be told apart without color (color-blind
  players, grayscale printing).

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
- **Tutorial.** Three short lessons played on the real game screen: the board, contradictions, and Classic mode (bid,
  then all-or-nothing demonstration). A coach banner explains each step and highlights what to tap. It is offered first
  on the home screen until it has been completed once.

In both modes:

- **Placing characters**: tap a character then a cell, or drag it. Tapping an empty cell places the next character
  waiting. A character placed in the row or column of another one sends it back to the tray.
- **Cards**: tap a card to select it. Tap its magnifier (or press and hold the card) to zoom in on it and read its
  caption.
- **Settings**: language (English, Français, Español; the browser language by default), base deck (55 cards) or full
  deck (91 cards), and the Classic timer (off, 1, 2, 3 or 5 minutes).
- The game in progress is saved on the device, and its clock is paused while the app is in the background.
- Personal records per mode and deck: fewest rounds and fastest game.

Planned: hints, a daily puzzle, local and online multiplayer, and a printable edition. See
[docs/roadmap.md](docs/roadmap.md).

### Tech stack

- **TypeScript**, strict.
- **Deno 2** for tests, formatting, linting and the analysis scripts.
- **Vite 8**, run through Deno, for the dev server and the build.
- **Playwright** (driven from `deno test`) for the end-to-end tests.
- **No web framework and no game engine.** Only native browser Web APIs: DOM, SVG, CSS, `<dialog>`, Pointer Events,
  Service Worker, Web App Manifest, localStorage.

## Development

```sh
deno install        # npm and JSR dependencies (Vite, Playwright, @std/assert)
deno task dev       # dev server with hot reload
deno task build     # production build in dist/ (static files, deployable anywhere, works under a sub-path)
deno task preview   # serve dist/ locally
deno task test      # unit tests of the game logic
deno task e2e       # build, then end-to-end tests with Playwright
deno task check     # formatting, lint and type-check
deno task analyze   # probability analysis (markdown on stdout)
deno task cards     # rule-card catalog (markdown on stdout)
deno task icons     # regenerate the app icons from the character artwork
deno task print     # regenerate the printable edition (PDFs in print/pdf/<lang>/)
```

- The end-to-end tests and the icon script use the locally installed **Google Chrome** by default. To use Playwright's
  own Chromium instead, install it once with `deno run -A npm:playwright@1.65.0 install chromium` and set
  `E2E_BROWSER=bundled`. Screenshots of the main screens are written to `e2e/artifacts/`.
- Add `?seed=<number>` to the URL to make new games deterministic (used by the end-to-end tests).
- The service worker (`src/sw.ts`) only runs in the production build. It precaches every file and serves the app
  cache-first. Each build gets a new cache version, computed from the file contents.

## Printable edition

Home-print PDFs of the tabletop game, in English, French and Spanish, are in [print/](print/): rule cards with crop
marks and card backs, the board, the characters (flat tokens and standees), order tokens, bid tiles and the tabletop
rules. See [print/README.md](print/README.md) for printing and cutting tips.

## Deployment

Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml): format, lint and type checks,
unit tests, build, end-to-end tests, then publication of `dist/` to GitHub Pages. It can also be started by hand from
the Actions tab. The e2e screenshots are attached to each run.

One-time setup:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Custom domain `trilemma.lonebee.games`:
   - at the DNS provider of `lonebee.games`, add a `CNAME` record from `trilemma` to `hatscat.github.io`;
   - in **Settings → Pages → Custom domain**, enter `trilemma.lonebee.games`, wait for the DNS check, then tick
     **Enforce HTTPS**;
   - recommended: verify `lonebee.games` in the GitHub account settings (**Pages → Verified domains**) to protect it
     against domain takeover.

   No `CNAME` file is needed in the repository: with a GitHub Actions deployment, the custom domain is set in the
   repository settings.

The build uses relative URLs, so the same files work at `https://hatscat.github.io/Trilemma/` and at the root of the
custom domain.

## Repository layout

```
src/core/     game logic, pure and DOM-free: board, rule cards, solver, game state machine, tutorial lessons (+ tests)
src/i18n/     translations (en, fr, es): interface texts, card captions derived from the card faces, rules, tutorial
src/ui/       DOM views: home, game screen, tutorial, rules, dialogs, SVG artwork, local storage
src/main.ts   entry point: router, persistence, service worker registration
src/sw.ts     service worker (offline-first)
public/       web app manifest and icons
e2e/          Playwright end-to-end tests
analysis/     probability analysis script (uses src/core)
scripts/      icon generator
print/        printable edition: generator (texts, layouts, CSS in mm) and the generated PDFs
docs/         rule-cards.md (card list and design), math.md (probabilities, choice of n), roadmap.md
.github/      GitHub Pages deployment workflow
```
