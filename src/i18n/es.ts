import { capitalize, captionFrom } from "./captions.ts";
import type { Messages } from "./types.ts";

const NAMES = ["la Estrella", "el Círculo", "el Cuadrado"];
const OF = ["de la Estrella", "del Círculo", "del Cuadrado"];
const name = (c: number) => NAMES[c];
const Name = (c: number) => capitalize(NAMES[c]);
const of = (c: number) => OF[c];
const NUMBERS = ["ningún", "un", "dos", "tres"];
const s = (n: number) => (n === 1 ? "" : "s");
const modeName = (mode: "classic" | "challenge") => (mode === "classic" ? "Clásico" : "Desafío");

const FAMILIES: Record<string, string> = {
  ROW: "Personaje en una fila",
  COL: "Personaje en una columna",
  CELL: "Casilla ocupada",
  SHADE: "Personaje en un color de casilla",
  COUNT: "Número de personajes en un color",
  ABOVE: "Encima",
  LEFT: "A la izquierda",
  TOUCH: "Contacto por una esquina",
  ROW_GAP: "Filas contiguas",
  COL_GAP: "Columnas contiguas",
  CROSS_ROW: "Personaje de una fila, a la izquierda o a la derecha",
  CROSS_COL: "Personaje de una columna, encima o debajo",
};

export const es: Messages = {
  lang: "es",
  languageName: "Español",

  characterName: name,
  cardCaption: captionFrom({
    row: (c, row) => `${Name(c)} está en la fila ${row}.`,
    column: (c, col) => `${Name(c)} está en la columna ${col}.`,
    shade: (c, dark) => `${Name(c)} está en una casilla ${dark ? "oscura" : "clara"}.`,
    cell: (cell) => `Hay un personaje en la casilla ${cell}.`,
    count: (n, dark) => `Exactamente ${NUMBERS[n]} personajes están en casillas ${dark ? "oscuras" : "claras"}.`,
    above: (top, bottom) => `${Name(top)} está encima ${of(bottom)}.`,
    columnVertical: (col, c, above) =>
      `El personaje de la columna ${col} está ${above ? "encima" : "debajo"} ${of(c)}.`,
    left: (left, right) => `${Name(left)} está a la izquierda ${of(right)}.`,
    rowHorizontal: (row, c, left) =>
      `El personaje de la fila ${row} está a la ${left ? "izquierda" : "derecha"} ${of(c)}.`,
    touch: (a, b) => `${Name(a)} y ${name(b)} se tocan por una esquina.`,
    neighbors: (axis, a, b) =>
      `${Name(a)} y ${name(b)} están en ${axis === "row" ? "filas contiguas" : "columnas contiguas"}.`,
  }),
  familyTitle: (key) => FAMILIES[key] ?? key,

  home: {
    tagline: "Tres personajes. Nueve casillas. Demasiadas reglas.",
    resume: "Continuar",
    resumeDetail: (mode, round, won) => `${modeName(mode)} · ronda ${round} · ${won} carta${s(won)} ganada${s(won)}`,
    classicText: "Anuncia el tamaño del grupo compatible más grande y luego demuéstralo. ¡Todo o nada!",
    challengeText: "En cada ronda se anuncia el objetivo: encuentra un grupo de cartas que lo alcance.",
    tutorialTitle: "Tutorial",
    tutorialText: "Aprende a jugar en tres lecciones cortas.",
    deck: "Mazo",
    deckBase: "Básico · 55",
    deckFull: "Completo · 91",
    timer: "Temporizador del modo Clásico",
    timerOff: "No",
    timerMinutes: (minutes) => `${minutes} min`,
    language: "Idioma",
    howToPlay: "Cómo jugar",
    records: (fullDeck) => `Récords · mazo ${fullDeck ? "completo" : "básico"}`,
    recordLine: (best, played) => ` mejor: ${best} (${played} partida${s(played)})`,
    rounds: (n) => `${n} ronda${s(n)}`,
    newGameTitle: "¿Empezar una partida nueva?",
    newGameMessage: "Se perderá la partida en curso.",
    newGameConfirm: "Partida nueva",
    cancel: "Cancelar",
  },

  game: {
    modeName: (mode) => ({ classic: "Clásico", challenge: "Desafío", tutorial: "Tutorial" })[mode],
    round: (n) => `Ronda ${n}`,
    gameOver: "Fin de la partida",
    pile: (n) => `Mazo ${n}`,
    won: (n) => `Ganadas ${n}`,
    mistakes: (n) => `Errores ${n}`,
    back: "Volver al menú",
    boardLabel: "Tablero",
    trayLabel: "Personajes fuera del tablero",
    cardsLabel: "Cartas de reglas",
    cellLabel: (cell, dark, occupant) =>
      `Casilla ${cell}, ${dark ? "oscura" : "clara"}, ${occupant === null ? "vacía" : name(occupant)}`,
    traySlotLabel: (c, offBoard) => offBoard ? `${Name(c)}, fuera del tablero` : `Devolver ${name(c)} aquí`,
    cardLabel: (number, caption) => `Carta ${number}: ${caption}`,
    zoomLabel: (number) => `Ampliar la carta ${number}`,
    clear: "Borrar",
    lockIn: "Anunciar",
    giveUp: "Rendirse",
    check: "Comprobar",
    demonstrate: "Demostrar",
    nextRound: "Siguiente ronda",
    seeResults: "Ver resultados",
    bestGroup: "Mejor grupo",
    myArrangement: "Mi colocación",
    searchClassic: "Encuentra el grupo más grande de cartas que pueden ser verdaderas a la vez.",
    searchClassicDetail: (selected, placed) =>
      `${selected} carta${s(selected)} seleccionada${s(selected)} · ${placed}/3 personajes colocados`,
    searchChallenge: (target) => `Encuentra ${target} cartas que pueden ser verdaderas a la vez.`,
    falseCardRetry: (number) => `La carta ${number} es falsa con esta colocación. ¡Inténtalo de nuevo!`,
    selectedOf: (selected, target) => `${selected}/${target} seleccionada${s(selected)}`,
    missingPlace: (n) => `coloca ${n} personaje${s(n)} más`,
    missingSelect: (n) => `selecciona ${n} más`,
    missingUnselect: (n) => `quita ${n}`,
    timesUp: "¡Se acabó el tiempo! Haz tu anuncio.",
    demonstrateStatus: (bid) =>
      `Anuncio: ${bid}. Coloca los personajes y selecciona exactamente ${bid} carta${s(bid)}.`,
    checking: "Comprobando las cartas…",
    wellDone: (cards) => `¡Bien hecho! +${cards} carta${s(cards)}.`,
    noMistakes: "¡Sin errores!",
    mistakeCount: (n) => `${n} error${n === 1 ? "" : "es"}.`,
    foundIn: (duration) => `Encontrado en ${duration}.`,
    validDemonstration: (cards) => `¡Demostración válida! +${cards} carta${s(cards)}.`,
    perfect: "Perfecto: era el grupo más grande.",
    bestPossible: (max) => `Lo mejor posible: ${max} carta${s(max)}.`,
    cardFalse: (number) => `La carta ${number} es falsa.`,
    incomplete: "Demostración incompleta.",
    nobodyScores: "Nadie puntúa.",
    sameCardsStay: "Las mismas cartas se quedan.",
    revealed: (max) => `Aquí tienes un grupo de ${max} cartas compatibles.`,
    discarded: "Estas cartas se descartan.",
    deckCleared: "¡Mazo terminado!",
    notPossible: "Ese movimiento no es posible ahora.",
  },

  dialogs: {
    bidTitle: "Haz tu anuncio",
    timesUpTitle: "¡Se acabó el tiempo!",
    bidText:
      "¿Cuántas cartas compatibles puedes demostrar? Tu anuncio no podrá cambiar después: tendrás que mostrar exactamente ese número de cartas.",
    bidLabel: "Anuncio",
    keepSearching: "Seguir buscando",
    lockIn: "Anunciar",
    giveUpTitle: "¿Rendirse en esta ronda?",
    giveUpMessage: "Se mostrará una solución y sus cartas se descartarán.",
    giveUpConfirm: "Ver una solución",
    cardMeta: (number, family) => `Carta ${number} · ${family}`,
    close: "Cerrar",
    select: "Seleccionar",
    unselect: "Quitar",
  },

  over: {
    title: "¡Mazo terminado!",
    subtitle: (mode, fullDeck) => `${modeName(mode)} · mazo ${fullDeck ? "completo" : "básico"}`,
    newBestRounds: "¡Nuevo récord: menos rondas!",
    newBestTime: "¡Nuevo récord: partida más rápida!",
    rounds: "Rondas",
    cardsWon: "Cartas ganadas",
    perfectBids: "Anuncios perfectos",
    roundsWithoutMistakes: "Rondas sin errores",
    voidDemonstrations: "Demostraciones fallidas",
    mistakes: "Errores",
    solutionsRevealed: "Soluciones reveladas",
    time: "Tiempo",
    menu: "Menú",
    playAgain: "Jugar otra vez",
  },

  rules: {
    title: "Cómo jugar",
    blocks: [
      { h2: "El objetivo" },
      {
        p: "Nueve cartas de reglas están boca arriba, y se contradicen. Encuentra el grupo más grande de cartas que pueden ser verdaderas al mismo tiempo.",
      },
      { h2: "El tablero" },
      {
        p: "Tres personajes, la Estrella {star}, el Círculo {circle} y el Cuadrado {square}, se colocan en un tablero de 3 × 3: exactamente un personaje por fila y uno por columna. Las filas se numeran del 1 al 3 de arriba abajo y las columnas van de la A a la C de izquierda a derecha. Las esquinas y el centro son casillas oscuras; las demás son claras.",
      },
      {
        p: "Toca un personaje y luego una casilla (o arrástralo). Al tocar una casilla vacía se coloca allí el siguiente personaje en espera. Un personaje colocado en la fila o la columna de otro lo devuelve a la reserva.",
      },
      { h2: "Modo Clásico" },
      {
        ol: [
          "Busca el grupo compatible más grande. Puedes usar el tablero y seleccionar cartas mientras piensas.",
          "Haz tu anuncio: el tamaño de tu grupo. Ya no podrá cambiar.",
          "Demuestra: coloca los personajes y selecciona exactamente tantas cartas como tu anuncio.",
          "Todo o nada: si una sola carta es falsa, la demostración falla y nadie puntúa. Las mismas cartas se quedan para la siguiente ronda.",
          "Las cartas ganadas se reponen desde el mazo. ¡Vacía el mazo en el menor número de rondas posible!",
        ],
      },
      { h2: "Modo Desafío" },
      {
        p: "Se anuncia el tamaño del grupo más grande. Encuentra un grupo de ese tamaño, coloca los personajes y comprueba. Cada comprobación equivocada cuenta como un error. Se acepta cualquier grupo válido.",
      },
      { h2: "Leer las cartas" },
      {
        p: "Toca la lupa de una carta (o mantén pulsada la carta) para ampliarla. «Encima» y «a la izquierda» significan a cualquier distancia. Dos personajes nunca comparten fila ni columna, así que «tocarse» siempre significa tocarse por una esquina.",
      },
    ],
    expertDeck: "Mazo experto.",
    examplesLabel: "Ejemplos de cartas",
  },

  tutorial: {
    lesson: (n, total, id) =>
      `Lección ${n}/${total} · ${
        { board: "El tablero", contradictions: "Las contradicciones", classic: "El modo Clásico" }[id]
      }`,
    next: "Siguiente",
    continue: "Continuar",
    finish: "Terminar",
    quit: "Salir del tutorial",
    steps: {
      meet: "¡Te presento a la Estrella, el Círculo y el Cuadrado! Vas a colocarlos en el tablero.",
      board:
        "El tablero tiene 3 filas (1 a 3) y 3 columnas (A a C). La regla de oro: exactamente un personaje por fila y uno por columna.",
      place: "Coloca los tres personajes: toca un personaje y luego una casilla. También puedes arrastrarlos.",
      zoom: "Estas son cartas de reglas. Toca una lupa para ver una carta en grande.",
      starRow1: "Haz que la primera carta sea verdadera: lleva la Estrella a la fila 1.",
      allThree: "Ahora haz que las tres cartas sean verdaderas a la vez. Selecciónalas y pulsa Comprobar.",
      boardDone: "¡Bien hecho! Estas tres cartas son compatibles: pueden ser verdaderas a la vez.",
      contradiction: "Algunas reglas se contradicen: la Estrella no puede estar en la fila 1 y en la fila 3 a la vez.",
      largest:
        "Encuentra el grupo más grande de cartas compatibles. Aquí tiene 3 cartas: coloca los personajes, selecciona 3 cartas y pulsa Comprobar.",
      contradictionsDone: "¡Exacto! En el modo Desafío, el juego siempre te dice el tamaño del grupo más grande.",
      classicIntro:
        "En el modo Clásico, nadie te dice el tamaño del grupo más grande: tú lo anuncias y luego lo demuestras.",
      lockIn: "Encuentra tu mejor grupo, pulsa Anunciar y elige tu número. Pista: 4 cartas van juntas.",
      prove:
        "Demuéstralo: coloca los personajes, selecciona exactamente tantas cartas como tu anuncio y pulsa Demostrar.",
      retry:
        "¡Una sola carta falsa y toda la demostración falla! Pulsa Siguiente ronda para intentarlo de nuevo con las mismas cartas.",
      classicDone: "¡Bravo, ya sabes jugar! Anuncia lo más alto posible… pero solo lo que puedas demostrar.",
    },
  },
};
