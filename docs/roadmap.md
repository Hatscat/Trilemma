# Roadmap

## Done

- **v0.1** — Solo PWA: Classic and Challenge modes, offline play, saved game, personal records.
- **v0.2** — English, French and Spanish; interactive tutorial (3 lessons); deployment to GitHub Pages.

## Next (suggested order)

Effort: **S** = a few hours, **M** = a few days, **L** = a few weeks.

### 1. Hints (S)

Help stuck players (kids especially) without giving the answer away, like the light bulb of the inspiration app.

- A small number of hints per game (e.g. 3), each one more revealing:
  1. "Card N is not part of any largest group" (a card false for every optimal arrangement).
  2. "In a best solution, the Star is on cell B2" (one character of an optimal arrangement).
  3. A complete optimal arrangement, without the cards.
- Pure solver functions in `src/core/hints.ts`, unit-tested. Hints used appear in the end-of-game summary.
- Open questions: how many hints per game? Do games with hints count for records?

### 2. Daily puzzle (S–M)

The same puzzle for everyone each day, easy to share in the family.

- The seed comes from the date. A generator retries seeds until the table meets quality criteria (e.g. target ≥ 6, a
  unique optimal group) and plays it as a Challenge round, or a short series of rounds.
- Result shared as text with the Web Share API, e.g. `Trilemma #42 · 7/7 · 0 mistakes · 1:42`.
- Streaks stored locally. No server needed.
- Open question: should difficulty vary across the week?

### 3. Local multiplayer: "table mode" (M)

The real tabletop rules on one tablet or phone, for 2 to 8 players.

- Setup: player names and colors.
- Search: everyone looks at the same screen. When ready, a player taps their own button, which records the lock-in order
  used for ties.
- Bids: each player enters a secret bid in turn ("pass the device to Lou").
- Reveal, then demonstrations in bid order with the existing demonstration screen. Strict, all-or-nothing validation, as
  in the rules.
- A multiplayer state machine in `src/core/` built on top of the current game logic, unit-tested like `game.ts`.

### 4. Online multiplayer (L)

Real-time rooms with friends on their own devices. This needs a server (WebSocket rooms, server-side lock-in timestamps
for fair ties), for example Deno Deploy with Deno KV, or a hosted realtime database. To consider once table mode has
been playtested.

### 5. Printable edition (M)

The physical tabletop game, generated from the same sources as the app.

- **Contents:**
  - 91 rule cards (55 base + 36 expert), with the symbol and caption on the front and a common back;
  - the 3 × 3 board;
  - 3 character tokens or standees;
  - order tokens numbered 1 to 8;
  - bid cards numbered 1 to 9 (one set per player);
  - a rules leaflet;
  - all of it in English, French and Spanish.
- **Two outputs:**
  - _Home print_: A4 or US Letter sheets with 9 poker-size cards (63 × 88 mm) per page, cut marks and optional duplex
    backs.
  - _Professional print_: one card per page with a 3 mm bleed and a safe zone, matching the template of the chosen
    print-on-demand service.
- **Technique:** HTML/CSS print templates reusing the SVG artwork (vector, sharp at any size), rendered to PDF with
  Playwright (`page.pdf()`) in a `deno task print` script. An open-licensed font is embedded so the PDFs look the same
  everywhere.
- **Prerequisite:** rules and cards validated in playtests; print service chosen.

### Smaller ideas

- More languages: every text already goes through `src/i18n/`.
- Sound effects and haptics (Vibration API).
- Accessibility pass: screen reader flow, high-contrast theme.
- Character animations (blinking, hopping) and card art polish.
- A statistics page (games played, average rounds, best streaks).
