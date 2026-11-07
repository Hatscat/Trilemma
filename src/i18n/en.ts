import { capitalize, captionFrom } from "./captions.ts";
import type { Messages } from "./types.ts";

const NAMES = ["the Star", "the Circle", "the Square"];
const name = (c: number) => NAMES[c];
const Name = (c: number) => capitalize(NAMES[c]);
const NUMBERS = ["no", "one", "two", "three"];
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const FAMILIES: Record<string, string> = {
  ROW: "Character in a row",
  COL: "Character in a column",
  CELL: "Occupied cell",
  SHADE: "Character on a cell shade",
  COUNT: "Number of characters on a shade",
  ABOVE: "Above",
  LEFT: "Left of",
  TOUCH: "Touching at a corner",
  ROW_GAP: "Neighboring rows",
  COL_GAP: "Neighboring columns",
  CROSS_ROW: "Row character, left or right",
  CROSS_COL: "Column character, above or below",
};

export const en: Messages = {
  lang: "en",
  languageName: "English",

  characterName: name,
  cardCaption: captionFrom({
    row: (c, row) => `${Name(c)} is in row ${row}.`,
    column: (c, col) => `${Name(c)} is in column ${col}.`,
    shade: (c, dark) => `${Name(c)} is on a ${dark ? "dark" : "light"} cell.`,
    cell: (cell) => `A character stands on cell ${cell}.`,
    count: (n, dark) => `Exactly ${NUMBERS[n]} characters are on ${dark ? "dark" : "light"} cells.`,
    above: (top, bottom) => `${Name(top)} is above ${name(bottom)}.`,
    columnVertical: (col, c, above) => `The character in column ${col} is ${above ? "above" : "below"} ${name(c)}.`,
    left: (left, right) => `${Name(left)} is to the left of ${name(right)}.`,
    rowHorizontal: (row, c, left) => `The character in row ${row} is to the ${left ? "left" : "right"} of ${name(c)}.`,
    touch: (a, b) => `${Name(a)} and ${name(b)} touch at a corner.`,
    neighbors: (axis, a, b) => `${Name(a)} and ${name(b)} are in neighboring ${axis === "row" ? "rows" : "columns"}.`,
  }),
  familyTitle: (key) => FAMILIES[key] ?? key,

  home: {
    tagline: "Three characters. Nine cells. Too many rules.",
    resume: "Resume",
    resumeDetail: (mode, round, won) =>
      `${mode === "classic" ? "Classic" : "Practice"} · round ${round} · ${won} ${plural(won, "card", "cards")} won`,
    classicText: "Bid the size of the largest compatible group, then prove it. All or nothing!",
    practiceText:
      "Practice at your own pace: the number of cards to find is given, and you can use the board while you search.",
    tutorialTitle: "Tutorial",
    tutorialText: "Learn to play in three short lessons.",
    deck: "Deck",
    deckBase: "Base · 55",
    deckFull: "Full · 91",
    timer: "Classic timer",
    timerOff: "Off",
    timerMinutes: (minutes) => `${minutes} min`,
    language: "Language",
    howToPlay: "How to play",
    records: (fullDeck) => `Records · ${fullDeck ? "full deck" : "base deck"}`,
    recordLine: (best, played) => ` best: ${best} (${played} played)`,
    rounds: (n) => `${n} ${plural(n, "round", "rounds")}`,
    newGameTitle: "Start a new game?",
    newGameMessage: "The game in progress will be lost.",
    newGameConfirm: "New game",
    cancel: "Cancel",
  },

  game: {
    modeName: (mode) => ({ classic: "Classic", practice: "Practice", tutorial: "Tutorial" })[mode],
    round: (n) => `Round ${n}`,
    gameOver: "Game over",
    pile: (n) => `Pile ${n}`,
    won: (n) => `Won ${n}`,
    mistakes: (n) => `Mistakes ${n}`,
    back: "Back to the menu",
    boardLabel: "Board",
    trayLabel: "Characters off the board",
    cardsLabel: "Rule cards",
    cellLabel: (cell, dark, occupant) =>
      `Cell ${cell}, ${dark ? "dark" : "light"}, ${occupant === null ? "empty" : name(occupant)}`,
    traySlotLabel: (c, offBoard) => offBoard ? `${Name(c)}, off the board` : `Send ${name(c)} back here`,
    cardLabel: (number, caption) => `Card ${number}: ${caption}`,
    zoomLabel: (number) => `Zoom on card ${number}`,
    clear: "Clear",
    lockIn: "Lock in",
    giveUp: "Give up",
    check: "Check",
    demonstrate: "Demonstrate",
    nextRound: "Next round",
    seeResults: "See results",
    bestGroup: "Best group",
    myArrangement: "My arrangement",
    searchClassic: "Find the largest group of cards that can all be true at once.",
    searchClassicHint: "Picture the characters in your head: you will place them after your bid.",
    searchPractice: (target) => `Find ${target} cards that can all be true at once.`,
    falseCardRetry: (number) => `Card ${number} is false for this arrangement. Try again!`,
    selectedOf: (selected, target) => `${selected}/${target} selected`,
    cardsToFind: (n) => `${plural(n, "card", "cards")} to find`,
    yourBid: "your bid",
    missingPlace: (n) => `place ${n} more ${plural(n, "character", "characters")}`,
    missingSelect: (n) => `select ${n} more`,
    missingUnselect: (n) => `unselect ${n}`,
    timesUp: "Time's up! Lock in your bid.",
    demonstrateStatus: (bid) => `Bid: ${bid}. Place the characters and select exactly ${bid} cards.`,
    checking: "Checking the cards…",
    wellDone: (cards) => `Well done! +${cards} ${plural(cards, "card", "cards")}.`,
    noMistakes: "No mistakes!",
    mistakeCount: (n) => `${n} ${plural(n, "mistake", "mistakes")}.`,
    foundIn: (duration) => `Found in ${duration}.`,
    validDemonstration: (cards) => `Valid demonstration! +${cards} ${plural(cards, "card", "cards")}.`,
    perfect: "Perfect: that was the largest group.",
    bestPossible: (max) => `Best possible: ${max} ${plural(max, "card", "cards")}.`,
    cardFalse: (number) => `Card ${number} is false.`,
    incomplete: "Incomplete demonstration.",
    nobodyScores: "Nobody scores.",
    sameCardsStay: "The same cards stay.",
    revealed: (max) => `Here is a group of ${max} compatible cards.`,
    discarded: "These cards are discarded.",
    deckCleared: "Deck cleared!",
    notPossible: "That move is not possible right now.",
  },

  dialogs: {
    bidTitle: "Lock in your bid",
    timesUpTitle: "Time's up!",
    bidText:
      "How many compatible cards can you demonstrate? Your bid cannot change afterwards: you will have to show exactly that many cards.",
    bidLabel: "Bid",
    keepSearching: "Keep searching",
    lockIn: "Lock in",
    giveUpTitle: "Give up this round?",
    giveUpMessage: "A solution will be shown and its cards will be discarded.",
    giveUpConfirm: "Show a solution",
    cardMeta: (number, family) => `Card ${number} · ${family}`,
    close: "Close",
    select: "Select",
    unselect: "Unselect",
  },

  over: {
    title: "Deck cleared!",
    subtitle: (mode, fullDeck) => `${mode === "classic" ? "Classic" : "Practice"} · ${fullDeck ? "Full" : "Base"} deck`,
    newBestRounds: "New record: fewest rounds!",
    newBestTime: "New record: fastest game!",
    rounds: "Rounds",
    cardsWon: "Cards won",
    perfectBids: "Perfect bids",
    roundsWithoutMistakes: "Rounds without mistakes",
    voidDemonstrations: "Void demonstrations",
    mistakes: "Mistakes",
    solutionsRevealed: "Solutions revealed",
    time: "Time",
    menu: "Menu",
    playAgain: "Play again",
  },

  rules: {
    title: "How to play",
    blocks: [
      { h2: "The goal" },
      {
        p: "Nine rule cards are face up, and they contradict each other. Find the largest group of cards that can all be true at the same time.",
      },
      { h2: "The board" },
      {
        p: "Three characters, the Star {star}, the Circle {circle} and the Square {square}, stand on a 3 × 3 board: exactly one character per row and one per column. Rows are numbered 1 to 3 from top to bottom, columns are lettered A to C from left to right. Corners and center are dark cells, with stripes; the others are light.",
      },
      {
        p: "Tap a character, then a cell (or drag it). Tapping an empty cell places the next character waiting. A character placed in the row or column of another one sends it back.",
      },
      { h2: "Classic mode" },
      {
        ol: [
          "Search the largest compatible group in your head: the board and the cards stay locked until you bid.",
          "Lock in your bid: the size of your group. It can never change afterwards.",
          "Demonstrate: place the characters and select exactly as many cards as your bid.",
          "All or nothing: if one card is false, the demonstration is void and nobody scores. The same cards stay for the next round.",
          "Won cards are replaced from the pile. Empty the deck in as few rounds as possible!",
        ],
      },
      { h2: "Practice mode" },
      {
        p: "The size of the largest group is announced, and you can use the board while you search. Find a group of that size, place the characters and check. Wrong checks count as mistakes. Any valid group is accepted.",
      },
      { h2: "Reading the cards" },
      {
        p: "Tap the magnifier of a card (or press and hold the card) to zoom in on it. “Above” and “to the left of” mean any distance. Characters never share a row or a column, so “touching” always means touching at a corner.",
      },
    ],
    expertDeck: "Expert deck.",
    examplesLabel: "Card examples",
  },

  install: {
    title: "Install the app",
    text: "Play full screen and offline, from your home screen.",
    iosSteps: [
      "Tap the Share button {share} of the browser.",
      "Choose “Add to Home Screen”.",
      "Tap “Add”: Trilemma appears with your other apps and works offline.",
    ],
    close: "OK",
  },
  update: {
    ready: "A new version of Trilemma is ready.",
    reload: "Update",
  },

  tutorial: {
    lesson: (n, total, id) =>
      `Lesson ${n}/${total} · ${{ board: "The board", contradictions: "Contradictions", classic: "Classic mode" }[id]}`,
    next: "Next",
    continue: "Continue",
    finish: "Finish",
    quit: "Quit the tutorial",
    steps: {
      meet: "Meet the Star, the Circle and the Square! You will place them on the board.",
      board:
        "The board has 3 rows (1 to 3) and 3 columns (A to C). The golden rule: exactly one character per row and one per column.",
      place: "Place the three characters: tap a character, then a cell. You can also drag them.",
      zoom: "These are rule cards. Tap a magnifier to read a card in big.",
      starRow1: "Make the first card true: move the Star to row 1.",
      allThree: "Now make the three cards true at the same time. Select them, then press Check.",
      boardDone: "Well done! These three cards are compatible: they can all be true at once.",
      contradiction: "Some rules contradict each other: the Star cannot be in row 1 and in row 3 at the same time.",
      largest:
        "Find the largest group of compatible cards. Here, it has 3 cards: place the characters, select 3 cards and press Check.",
      contradictionsDone: "Exactly! In Practice mode, the game always tells you the size of the largest group.",
      classicIntro:
        "In Classic mode, nobody tells you the size of the largest group, and the board stays locked while you search: everything happens in your head!",
      lockIn:
        "Imagine where the characters could go and find your best group, then press Lock in and choose your bid. Hint: 4 cards fit together.",
      prove:
        "Now the board is unlocked. Prove it: place the characters, select exactly as many cards as your bid, then press Demonstrate.",
      retry: "One false card and the whole demonstration is void! Press Next round to try again with the same cards.",
      classicDone: "Bravo, you are ready to play! Bid as high as you can… but only what you can prove.",
    },
  },
};
