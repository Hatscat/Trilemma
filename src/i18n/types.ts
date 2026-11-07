/** Shape of a translation. Every language implements the whole interface (checked by the compiler). */

import type { Glyph } from "../core/cards.ts";
import type { Mode } from "../core/game.ts";
import type { LessonId } from "../core/lessons.ts";

export type Lang = "en" | "fr" | "es";

/** A block of the "How to play" page. `{star}`, `{circle}` and `{square}` are replaced by the character icons. */
export type RuleBlock =
  | { readonly h2: string }
  | { readonly p: string }
  | { readonly ol: readonly string[] };

export interface TutorialStepTexts {
  // Lesson "board"
  readonly meet: string;
  readonly board: string;
  readonly place: string;
  readonly zoom: string;
  readonly starRow1: string;
  readonly allThree: string;
  readonly boardDone: string;
  // Lesson "contradictions"
  readonly contradiction: string;
  readonly largest: string;
  readonly contradictionsDone: string;
  // Lesson "classic"
  readonly classicIntro: string;
  readonly lockIn: string;
  readonly prove: string;
  readonly retry: string;
  readonly classicDone: string;
}

export interface Messages {
  readonly lang: Lang;
  readonly languageName: string;

  // --- Cards ---------------------------------------------------------------
  /** "the Star", with its article, for the middle of a sentence. */
  readonly characterName: (character: number) => string;
  /** The caption of a card, derived from its symbolic face. */
  readonly cardCaption: (glyph: Glyph) => string;
  readonly familyTitle: (familyKey: string) => string;

  // --- Home ----------------------------------------------------------------
  readonly home: {
    readonly tagline: string;
    readonly resume: string;
    readonly resumeDetail: (mode: Mode, round: number, won: number) => string;
    readonly classicText: string;
    readonly challengeText: string;
    readonly tutorialTitle: string;
    readonly tutorialText: string;
    readonly deck: string;
    readonly deckBase: string;
    readonly deckFull: string;
    readonly timer: string;
    readonly timerOff: string;
    readonly timerMinutes: (minutes: number) => string;
    readonly language: string;
    readonly howToPlay: string;
    readonly records: (fullDeck: boolean) => string;
    readonly recordLine: (best: string, played: number) => string;
    readonly rounds: (n: number) => string;
    readonly newGameTitle: string;
    readonly newGameMessage: string;
    readonly newGameConfirm: string;
    readonly cancel: string;
  };

  // --- Game screen ---------------------------------------------------------
  readonly game: {
    readonly modeName: (mode: Mode | "tutorial") => string;
    readonly round: (n: number) => string;
    readonly gameOver: string;
    readonly pile: (n: number) => string;
    readonly won: (n: number) => string;
    readonly mistakes: (n: number) => string;
    readonly back: string;
    readonly boardLabel: string;
    readonly trayLabel: string;
    readonly cardsLabel: string;
    readonly cellLabel: (cell: string, dark: boolean, occupant: number | null) => string;
    readonly traySlotLabel: (character: number, offBoard: boolean) => string;
    readonly cardLabel: (number: number, caption: string) => string;
    readonly zoomLabel: (number: number) => string;
    readonly clear: string;
    readonly lockIn: string;
    readonly giveUp: string;
    readonly check: string;
    readonly demonstrate: string;
    readonly nextRound: string;
    readonly seeResults: string;
    readonly bestGroup: string;
    readonly myArrangement: string;
    readonly searchClassic: string;
    /** Classic search: the board is locked, the player imagines the arrangement. */
    readonly searchClassicHint: string;
    readonly searchChallenge: (target: number) => string;
    readonly falseCardRetry: (number: number) => string;
    readonly selectedOf: (selected: number, target: number) => string;
    /** Label next to the big target number (challenge mode). */
    readonly cardsToFind: (n: number) => string;
    /** Label next to the big bid number (classic mode, demonstration). */
    readonly yourBid: string;
    readonly missingPlace: (n: number) => string;
    readonly missingSelect: (n: number) => string;
    readonly missingUnselect: (n: number) => string;
    readonly timesUp: string;
    readonly demonstrateStatus: (bid: number) => string;
    readonly checking: string;
    readonly wellDone: (cards: number) => string;
    readonly noMistakes: string;
    readonly mistakeCount: (n: number) => string;
    readonly foundIn: (duration: string) => string;
    readonly validDemonstration: (cards: number) => string;
    readonly perfect: string;
    readonly bestPossible: (max: number) => string;
    readonly cardFalse: (number: number) => string;
    readonly incomplete: string;
    readonly nobodyScores: string;
    readonly sameCardsStay: string;
    readonly revealed: (max: number) => string;
    readonly discarded: string;
    readonly deckCleared: string;
    readonly notPossible: string;
  };

  // --- Dialogs -------------------------------------------------------------
  readonly dialogs: {
    readonly bidTitle: string;
    readonly timesUpTitle: string;
    readonly bidText: string;
    readonly bidLabel: string;
    readonly keepSearching: string;
    readonly lockIn: string;
    readonly giveUpTitle: string;
    readonly giveUpMessage: string;
    readonly giveUpConfirm: string;
    readonly cardMeta: (number: number, family: string) => string;
    readonly close: string;
    readonly select: string;
    readonly unselect: string;
  };

  // --- End of game ---------------------------------------------------------
  readonly over: {
    readonly title: string;
    readonly subtitle: (mode: Mode, fullDeck: boolean) => string;
    readonly newBestRounds: string;
    readonly newBestTime: string;
    readonly rounds: string;
    readonly cardsWon: string;
    readonly perfectBids: string;
    readonly roundsWithoutMistakes: string;
    readonly voidDemonstrations: string;
    readonly mistakes: string;
    readonly solutionsRevealed: string;
    readonly time: string;
    readonly menu: string;
    readonly playAgain: string;
  };

  // --- How to play ---------------------------------------------------------
  readonly rules: {
    readonly title: string;
    readonly blocks: readonly RuleBlock[];
    readonly expertDeck: string;
    readonly examplesLabel: string;
  };

  // --- Tutorial ------------------------------------------------------------
  readonly tutorial: {
    readonly lesson: (n: number, total: number, id: LessonId) => string;
    readonly next: string;
    readonly continue: string;
    readonly finish: string;
    readonly quit: string;
    readonly steps: TutorialStepTexts;
  };
}
