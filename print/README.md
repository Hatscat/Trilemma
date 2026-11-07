# Printable edition (home print)

PDFs to print the tabletop version of Trilemma at home. They are generated from the app's own artwork, card catalog and
translations, so they always match the digital game.

## Files

One folder per language: [`pdf/en/`](pdf/en/), [`pdf/fr/`](pdf/fr/), [`pdf/es/`](pdf/es/).

| File                 | Pages | Contents                                                                           | Suggested paper              |
| -------------------- | ----: | ---------------------------------------------------------------------------------- | ---------------------------- |
| `1-cards-base.pdf`   |     7 | 55 base rule cards (63 × 88 mm, poker size), 9 per page, with crop marks           | thick, 160–250 g/m²          |
| `2-cards-expert.pdf` |     4 | 36 expert cards (optional, for experienced players)                                | thick                        |
| `3-card-backs.pdf`   |     1 | 9 card backs, to print on the reverse of every card sheet                          | (reverse of the card sheets) |
| `4-board.pdf`        |     1 | The 3 × 3 board (58 mm cells)                                                      | thick, or glued on cardboard |
| `5-characters.pdf`   |     1 | 2 sets of flat character tokens and 3 fold-over standees                           | thick                        |
| `6-tokens.pdf`       |     2 | Order tokens 1–8 and bid tiles 1–9: page 1 for players 1–4, page 2 for players 5–8 | thick                        |
| `7-rules.pdf`        |     2 | Tabletop rules, components and printing guide                                      | plain                        |

## Printing

- Print in color on A4 paper, at **actual size (100%)**, never "fit to page".
- **Card backs.** Print the card sheets, put them back in the printer and print `3-card-backs.pdf` on the reverse of
  each sheet (11 sheets for both decks). The card grid is centered on the page, so fronts and backs line up whichever
  way the sheet is flipped.
- **No thick paper?** Print the cards on plain paper and slide each one into a standard card sleeve (63.5 × 88 mm) in
  front of an old playing card. The backs are not needed then.
- **Cutting.** Cut the cards along the crop marks, ideally with a paper trimmer. Everything else is cut along the dashed
  lines. Fold the standees along the dotted line.

## Regenerating

```sh
deno task print                      # writes print/pdf/<lang>/*.pdf
deno task print --preview=/tmp/print # also writes a PNG preview of each document
```

The script uses Playwright with the local Google Chrome, like the end-to-end tests.

Sources:

- [`texts.ts`](texts.ts): tabletop rules, printing guide and labels, in every language;
- [`templates.ts`](templates.ts): page layouts;
- [`print.css`](print.css): all sizes in millimeters.

Card captions and family names come from `src/i18n/`, and the artwork from `src/ui/`. Regenerate the PDFs after any
change to the cards, the artwork or these texts.
