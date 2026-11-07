# CLAUDE.md

## Project

**Trilemma**: a simultaneous logic game for 1 to 8 players (PWA, later also a tabletop game). Players compose the
largest group of mutually compatible rule cards for 3 characters on a 3 × 3 board. Inspired by Set, Einstein's riddle
(Zebra puzzle) and _Einstein Riddle Island Puzzle_ (Black Puma Labs).

- Game rules, modes, commands and repository layout: [README.md](README.md)
- Rule cards (design, families, full list): [docs/rule-cards.md](docs/rule-cards.md)
- Probabilities, deck balance, choice of n: [docs/math.md](docs/math.md)
- Planned features (hints, daily puzzle, multiplayer, printable edition): [docs/roadmap.md](docs/roadmap.md)

**Status:** v0.2.0: solo PWA (Classic, Practice, tutorial) in English, French and Spanish, offline and installable,
deployed to GitHub Pages by `.github/workflows/deploy.yml` (custom domain `trilemma.lonebee.games`).

## Hard constraints

- TypeScript, strict mode.
- Deno 2 for tests, `deno fmt` and `deno lint`. Vite 8 (run through Deno) for the dev server and the build.
- **No web framework** (React, Vue, Svelte, Lit, …) and **no game engine** (Phaser, Pixi, …). Native Web APIs only.
- PWA: installable, offline-first, mobile-first, touch-friendly. No external fonts or CDN assets.
- Every git-tracked file (code, comments, docs, commit messages) is written in en-US, except the player-facing
  translations in `src/i18n/fr.ts` and `src/i18n/es.ts`.

## Architecture

- `src/core/`: pure game logic, no DOM, fully unit-tested. `game.ts` is a JSON-serializable state machine: every
  transition is `(state, …, now) => state` and throws `GameError` when illegal. Pass time in explicitly (`now`).
- `src/ui/`: plain DOM views. `GameView` builds its DOM once and updates it on each state change. SVG artwork is static
  markup (`sprite.ts`, `glyph.ts`). `innerHTML` is only used with trusted, static markup, never with user input.
- `src/main.ts`: hash router (`#/`, `#/play`, `#/tutorial`, `#/rules`). The state is saved to localStorage after every
  change, and every storage access is guarded. The tutorial is never saved.
- `src/ui/tutorial.ts`: scripted lessons on top of `GameView` (fixed tables from `src/core/lessons.ts`, coach banner,
  `[data-coach]` highlights). Steps complete on state changes or view events (`zoom`, `revealed`).
- `src/sw.ts`: service worker. It must not import anything. The precache list and the cache version are injected by the
  Vite plugin in `vite.config.ts` (`public/screenshots/` is excluded: those images are only for the install dialog).
- `src/ui/install.ts`: installation offer (`beforeinstallprompt` on Chromium, instructions on iPhone/iPad, hidden when
  running installed) and the "new version" banner shown on service worker `controllerchange`.
- `index.html`: Open Graph / Twitter meta tags for link previews, with absolute URLs on the production domain.
  `public/og-image.jpg` comes from `deno task og-image` (regenerate it after visual changes to the characters or cards).
  Keep it a small JPEG (< 150 KB, the script checks it): WhatsApp silently drops heavy preview images.
- `public/manifest.webmanifest`: `display: fullscreen`. After visible UI changes, refresh the install dialog screenshots
  with `deno task screenshots`.
- CSS is linked from `index.html`, not imported from TypeScript (Deno cannot type-check CSS imports).
- Use `ReturnType<typeof setTimeout>` for timer handles (the Node types are in scope through npm packages).

## Translations (`src/i18n/`)

- Every player-facing text goes through `t()` (current language), read at render time. Never hard-code UI copy.
- `types.ts` defines the `Messages` interface: adding a key forces all three languages to provide it.
- Card captions are **derived from the card glyph** (`captions.ts` decodes the glyph, each language provides sentence
  patterns). The English output must equal `card.text` in the catalog (`i18n_test.ts`).
- French typography (no-break spaces before `! ? : ;` and inside « ») is applied automatically by `typography.ts`: write
  plain spaces in `fr.ts`.
- Players are addressed informally (French "tu", Spanish "tú"). The game is meant to be played by children too.

## Domain model

- Board: rows `1–3` (top to bottom), columns `A–C` (left to right), cell name = column + row (`C1` = top right).
  Internally 0-based indices, cell index = `row * 3 + col`. Dark cells: corners and center (`(row + col)` even).
- Characters, in canonical order: Star (purple, 1 eye), Circle (green, 2 eyes), Square (red, 3 eyes). In texts, grid
  squares are always called **cells**, never "squares".
- Arrangement: exactly one character per row and per column, so 36 arrangements in total.
- Placement follows the golden rule strictly: a placed character reserves its row and its column, and `blockerOf` (in
  `board.ts`) tells which character blocks a cell. Placing into a reserved cell is refused (`GameError`); other
  characters are never moved automatically. The game view shows the reserved "lanes" and free / blocked cells.
- Rule card = a predicate over arrangements. A group of cards is compatible if one arrangement satisfies them all.
- Key invariants (proofs in docs/math.md):
  - Parity: the number of characters on light cells is always 0 or 2.
  - Every arrangement satisfies exactly 24 of the 55 base cards (36 of the 91 cards with the expert deck).
  - A draw often has several optimal arrangements and groups. Validation must accept any compatible group, never one
    expected answer.
- Modes: `classic` (bid, then all-or-nothing demonstration) and `practice` (the target is announced, the board is free
  to use while searching). `practice` was called `challenge` until v0.2: `storage.ts` migrates old saves and records.
  "Challenge" is kept for the planned daily puzzle.
- Round rules (full rules in README):
  - Bids are strict: a demonstration shows exactly the bid number of cards. One false card, or too few cards, makes the
    whole demonstration invalid. The next player then demonstrates with their own unchanged bid.
  - Ties between equal bids go to the player who locked in first (lock-in timestamp in the PWA). No randomness, no
    priority tokens.
  - If every demonstration fails, nobody scores and the same face-up cards go back to a new search.
  - Classic mode: the search is mental, as in the tabletop game. Moving characters and selecting cards is only possible
    in the `demonstrate` phase (`canEditBoard` in `game.ts`). Practice mode allows them while searching.

## Card catalog rules

- Source of truth: `src/core/cards.ts`. Candidates are generated per family, then deduplicated by **truth set** over the
  36 arrangements. Duplicates, always-true and never-true cards are rejected automatically.
- Card wording: one short positive sentence, no negation, no duplicate meaning.
- After changing the catalog, regenerate the card list in `docs/rule-cards.md` (everything below the "Generated by"
  marker) with `deno task cards`, re-run `deno task analyze`, update the figures in `docs/math.md`, and update the
  counts asserted in `src/core/cards_test.ts`.
- Keep the deck balanced (same number of true cards for every arrangement). `cards_test.ts` asserts it.

## Printable edition (`print/`)

- `deno task print` renders A4 PDFs per language into `print/pdf/<lang>/` with Playwright, from `texts.ts` (tabletop
  rules, labels), `templates.ts` (layouts) and `print.css` (sizes in mm).
- It reuses the app's card catalog, captions (`src/i18n/`) and SVG artwork (`src/ui/`). Regenerate the PDFs after
  changing any of them, and keep the tabletop rules in `print/texts.ts` in sync with the README.
- Card sheets: 9 poker-size cards (63 × 88 mm) per page, grid centered so duplex backs line up either way.

## Commands

```sh
deno task dev       # dev server
deno task test      # unit tests (src/)
deno task e2e       # build + Playwright end-to-end tests (uses the local Google Chrome by default)
deno task check     # fmt --check, lint, type-check
deno task analyze   # probability analysis (deterministic seed)
deno task cards     # rule-card catalog (markdown)
deno task print     # printable edition PDFs
```

Before finishing a change, run `deno task check`, `deno task test` and `deno task e2e`.
