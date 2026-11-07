import { capitalize, captionFrom } from "./captions.ts";
import { frenchSpaces, mapStrings } from "./typography.ts";
import type { Messages } from "./types.ts";

const NAMES = ["l’Étoile", "le Rond", "le Carré"];
const OF = ["de l’Étoile", "du Rond", "du Carré"];
const name = (c: number) => NAMES[c];
const Name = (c: number) => capitalize(NAMES[c]);
const of = (c: number) => OF[c];
const NUMBERS = ["aucun", "un", "deux", "trois"];
const s = (n: number) => (n > 1 ? "s" : "");
const modeName = (mode: "classic" | "practice") => (mode === "classic" ? "Classique" : "Entraînement");

const FAMILIES: Record<string, string> = {
  ROW: "Personnage sur une ligne",
  COL: "Personnage dans une colonne",
  CELL: "Case occupée",
  SHADE: "Personnage sur une couleur de case",
  COUNT: "Nombre de personnages sur une couleur",
  ABOVE: "Au-dessus",
  LEFT: "À gauche",
  TOUCH: "Contact par un coin",
  ROW_GAP: "Lignes voisines",
  COL_GAP: "Colonnes voisines",
  CROSS_ROW: "Personnage d’une ligne, à gauche ou à droite",
  CROSS_COL: "Personnage d’une colonne, au-dessus ou en dessous",
};

const messages: Messages = {
  lang: "fr",
  languageName: "Français",

  characterName: name,
  cardCaption: captionFrom({
    row: (c, row) => `${Name(c)} est sur la ligne ${row}.`,
    column: (c, col) => `${Name(c)} est dans la colonne ${col}.`,
    shade: (c, dark) => `${Name(c)} est sur une case ${dark ? "sombre" : "claire"}.`,
    cell: (cell) => `Un personnage est sur la case ${cell}.`,
    count: (n, dark) => `Exactement ${NUMBERS[n]} personnages sont sur des cases ${dark ? "sombres" : "claires"}.`,
    above: (top, bottom) => `${Name(top)} est au-dessus ${of(bottom)}.`,
    columnVertical: (col, c, above) =>
      `Le personnage de la colonne ${col} est ${above ? "au-dessus" : "en dessous"} ${of(c)}.`,
    left: (left, right) => `${Name(left)} est à gauche ${of(right)}.`,
    rowHorizontal: (row, c, left) => `Le personnage de la ligne ${row} est à ${left ? "gauche" : "droite"} ${of(c)}.`,
    touch: (a, b) => `${Name(a)} et ${name(b)} se touchent par un coin.`,
    neighbors: (axis, a, b) =>
      `${Name(a)} et ${name(b)} sont ${axis === "row" ? "sur des lignes voisines" : "dans des colonnes voisines"}.`,
  }),
  familyTitle: (key) => FAMILIES[key] ?? key,

  home: {
    tagline: "3 personnages. 9 cases. Tout plein de règles.",
    resume: "Reprendre",
    resumeDetail: (mode, round, won) => `${modeName(mode)} · manche ${round} · ${won} carte${s(won)} gagnée${s(won)}`,
    classicText: "Annonce la taille du plus grand groupe compatible, puis prouve-le. Tout ou rien !",
    practiceText:
      "Entraîne-toi à ton rythme : le nombre de cartes à trouver est donné, et tu peux utiliser le plateau pendant ta recherche.",
    tutorialTitle: "Tutoriel",
    tutorialText: "Apprends à jouer en trois petites leçons.",
    deck: "Paquet",
    deckBase: "Base · 55",
    deckFull: "Complet · 91",
    timer: "Minuteur du mode Classique",
    timerOff: "Aucun",
    timerMinutes: (minutes) => `${minutes} min`,
    language: "Langue",
    howToPlay: "Règles du jeu",
    records: (fullDeck) => `Records · paquet ${fullDeck ? "complet" : "de base"}`,
    recordLine: (best, played) => ` meilleur : ${best} (${played} partie${s(played)})`,
    rounds: (n) => `${n} manche${s(n)}`,
    newGameTitle: "Nouvelle partie ?",
    newGameMessage: "La partie en cours sera perdue.",
    newGameConfirm: "Nouvelle partie",
    cancel: "Annuler",
  },

  game: {
    modeName: (mode) => ({ classic: "Classique", practice: "Entraînement", tutorial: "Tutoriel" })[mode],
    round: (n) => `Manche ${n}`,
    gameOver: "Partie terminée",
    pile: (n) => `Pioche ${n}`,
    won: (n) => `Gagnées ${n}`,
    mistakes: (n) => `Erreurs ${n}`,
    back: "Retour au menu",
    boardLabel: "Plateau",
    trayLabel: "Personnages hors du plateau",
    cardsLabel: "Cartes règles",
    cellLabel: (cell, dark, occupant) =>
      `Case ${cell}, ${dark ? "sombre" : "claire"}, ${occupant === null ? "vide" : name(occupant)}`,
    traySlotLabel: (c, offBoard) => offBoard ? `${Name(c)}, hors du plateau` : `Renvoyer ${name(c)} ici`,
    cardLabel: (number, caption) => `Carte ${number} : ${caption}`,
    zoomLabel: (number) => `Agrandir la carte ${number}`,
    clear: "Effacer",
    lockIn: "Annoncer",
    giveUp: "Abandonner",
    check: "Vérifier",
    demonstrate: "Démontrer",
    nextRound: "Manche suivante",
    seeResults: "Voir le bilan",
    bestGroup: "Meilleur groupe",
    myArrangement: "Ma disposition",
    searchClassic: "Trouve le plus grand groupe de cartes qui peuvent être vraies en même temps.",
    searchClassicHint: "Imagine les personnages dans ta tête : tu les placeras après ton annonce.",
    searchPractice: (target) => `Trouve ${target} cartes qui peuvent être vraies en même temps.`,
    falseCardRetry: (number) => `La carte ${number} est fausse pour cette disposition. Réessaie !`,
    selectedOf: (selected, target) => `${selected}/${target} sélectionnée${s(selected)}`,
    cardsToFind: (n) => `carte${s(n)} à trouver`,
    yourBid: "ton annonce",
    missingPlace: (n) => `encore ${n} personnage${s(n)} à placer`,
    missingSelect: (n) => `encore ${n} à sélectionner`,
    missingUnselect: (n) => `${n} à désélectionner`,
    timesUp: "Temps écoulé ! Fais ton annonce.",
    demonstrateStatus: (bid) =>
      `Annonce : ${bid}. Place les personnages et sélectionne exactement ${bid} carte${s(bid)}.`,
    checking: "Vérification des cartes…",
    wellDone: (cards) => `Bravo ! +${cards} carte${s(cards)}.`,
    noMistakes: "Aucune erreur !",
    mistakeCount: (n) => `${n} erreur${s(n)}.`,
    foundIn: (duration) => `Trouvé en ${duration}.`,
    validDemonstration: (cards) => `Démonstration réussie ! +${cards} carte${s(cards)}.`,
    perfect: "Parfait : c’était le plus grand groupe.",
    bestPossible: (max) => `Meilleur possible : ${max} carte${s(max)}.`,
    cardFalse: (number) => `La carte ${number} est fausse.`,
    incomplete: "Démonstration incomplète.",
    nobodyScores: "Personne ne marque.",
    sameCardsStay: "Les mêmes cartes restent.",
    revealed: (max) => `Voici un groupe de ${max} cartes compatibles.`,
    discarded: "Ces cartes sont défaussées.",
    deckCleared: "Paquet terminé !",
    notPossible: "Ce coup n’est pas possible pour l’instant.",
    cellLocked: (c) =>
      `${Name(c)} occupe déjà cette ligne ou cette colonne : déplace-${c === 0 ? "la" : "le"} d’abord.`,
    tapCharacterFirst: "Touche un personnage pour le déplacer.",
  },

  dialogs: {
    bidTitle: "Fais ton annonce",
    timesUpTitle: "Temps écoulé !",
    bidText:
      "Combien de cartes compatibles peux-tu démontrer ? Ton annonce ne pourra plus changer : tu devras montrer exactement ce nombre de cartes.",
    bidLabel: "Annonce",
    keepSearching: "Chercher encore",
    lockIn: "Annoncer",
    giveUpTitle: "Abandonner cette manche ?",
    giveUpMessage: "Une solution sera montrée et ses cartes seront défaussées.",
    giveUpConfirm: "Voir une solution",
    cardMeta: (number, family) => `Carte ${number} · ${family}`,
    close: "Fermer",
    select: "Sélectionner",
    unselect: "Désélectionner",
  },

  over: {
    title: "Paquet terminé !",
    subtitle: (mode, fullDeck) => `${modeName(mode)} · paquet ${fullDeck ? "complet" : "de base"}`,
    newBestRounds: "Nouveau record : le moins de manches !",
    newBestTime: "Nouveau record : la partie la plus rapide !",
    rounds: "Manches",
    cardsWon: "Cartes gagnées",
    perfectBids: "Annonces parfaites",
    roundsWithoutMistakes: "Manches sans erreur",
    voidDemonstrations: "Démonstrations ratées",
    mistakes: "Erreurs",
    solutionsRevealed: "Solutions révélées",
    time: "Temps",
    menu: "Menu",
    playAgain: "Rejouer",
  },

  rules: {
    title: "Règles du jeu",
    blocks: [
      { h2: "Le but" },
      {
        p: "Neuf cartes règles sont posées face visible, et elles se contredisent. Trouve le plus grand groupe de cartes qui peuvent être vraies en même temps.",
      },
      { h2: "Le plateau" },
      {
        p: "Trois personnages, l’Étoile {star}, le Rond {circle} et le Carré {square}, se placent sur un plateau de 3 × 3 cases : exactement un personnage par ligne et un par colonne. Les lignes sont numérotées de 1 à 3 de haut en bas, les colonnes vont de A à C de gauche à droite. Les coins et le centre sont des cases sombres, rayées ; les autres sont claires.",
      },
      {
        p: "Touche un personnage puis une case (ou fais-le glisser). Toucher une case vide y place le prochain personnage en attente. Un personnage posé réserve sa ligne et sa colonne (lignes colorées) : pour les utiliser, déplace d’abord ce personnage, ou touche son emplacement vide à droite pour le renvoyer.",
      },
      { h2: "Mode Classique" },
      {
        ol: [
          "Cherche le plus grand groupe compatible dans ta tête : le plateau et les cartes restent bloqués jusqu’à ton annonce.",
          "Fais ton annonce : la taille de ton groupe. Elle ne pourra plus changer.",
          "Démontre : place les personnages et sélectionne exactement autant de cartes que ton annonce.",
          "Tout ou rien : si une seule carte est fausse, la démonstration est ratée et personne ne marque. Les mêmes cartes restent pour la manche suivante.",
          "Les cartes gagnées sont remplacées par la pioche. Vide le paquet en un minimum de manches !",
        ],
      },
      { h2: "Mode Entraînement" },
      {
        p: "La taille du plus grand groupe est annoncée, et tu peux utiliser le plateau pendant ta recherche. Trouve un groupe de cette taille, place les personnages et vérifie. Chaque vérification fausse compte comme une erreur. Tout groupe valide est accepté.",
      },
      { h2: "Lire les cartes" },
      {
        p: "Touche la loupe d’une carte (ou appuie longuement sur la carte) pour l’agrandir. « Au-dessus » et « à gauche » veulent dire à n’importe quelle distance. Deux personnages ne sont jamais sur la même ligne ni sur la même colonne : « se toucher » veut donc toujours dire se toucher par un coin.",
      },
    ],
    expertDeck: "Paquet expert.",
    examplesLabel: "Exemples de cartes",
  },

  install: {
    title: "Installer l’app",
    text: "Joue en plein écran et hors ligne, depuis ton écran d’accueil.",
    iosSteps: [
      "Touche le bouton Partager {share} du navigateur.",
      "Choisis « Sur l’écran d’accueil ».",
      "Touche « Ajouter » : Trilemma apparaît avec tes autres apps et fonctionne hors ligne.",
    ],
    close: "OK",
  },
  update: {
    ready: "Une nouvelle version de Trilemma est prête.",
    reload: "Mettre à jour",
  },

  tutorial: {
    lesson: (n, total, id) =>
      `Leçon ${n}/${total} · ${
        { board: "Le plateau", contradictions: "Les contradictions", classic: "Le mode Classique" }[id]
      }`,
    next: "Suivant",
    continue: "Continuer",
    finish: "Terminer",
    quit: "Quitter le tutoriel",
    steps: {
      meet: "Voici l’Étoile, le Rond et le Carré ! Tu vas les placer sur le plateau.",
      board:
        "Le plateau a 3 lignes (1 à 3) et 3 colonnes (A à C). La règle d’or : exactement un personnage par ligne et un par colonne. Un personnage posé réserve sa ligne et sa colonne.",
      place: "Place les trois personnages : touche un personnage, puis une case. Tu peux aussi les faire glisser.",
      zoom: "Voici des cartes règles. Touche une loupe pour lire une carte en grand.",
      starRow1: "Rends la première carte vraie : mets l’Étoile sur la ligne 1.",
      allThree: "Maintenant, rends les trois cartes vraies en même temps. Sélectionne-les, puis appuie sur Vérifier.",
      boardDone: "Bravo ! Ces trois cartes sont compatibles : elles peuvent toutes être vraies en même temps.",
      contradiction:
        "Certaines règles se contredisent : l’Étoile ne peut pas être sur la ligne 1 et sur la ligne 3 en même temps.",
      largest:
        "Trouve le plus grand groupe de cartes compatibles. Ici, il a 3 cartes : place les personnages, sélectionne 3 cartes et appuie sur Vérifier.",
      contradictionsDone: "Exactement ! En mode Entraînement, le jeu te dit toujours la taille du plus grand groupe.",
      classicIntro:
        "En mode Classique, personne ne te dit la taille du plus grand groupe, et le plateau reste bloqué pendant la recherche : tout se passe dans ta tête !",
      lockIn:
        "Imagine où les personnages pourraient aller et trouve ton meilleur groupe, puis appuie sur Annoncer et choisis ton nombre. Indice : ici, tu peux annoncer n’importe quel nombre de 1 à 4. Même une petite annonce fait gagner des cartes, si tu la prouves !",
      prove:
        "Le plateau est maintenant débloqué. Prouve-le : place les personnages, sélectionne exactement autant de cartes que ton annonce, puis appuie sur Démontrer.",
      retry:
        "Une seule carte fausse et toute la démonstration est ratée ! Appuie sur Manche suivante pour réessayer avec les mêmes cartes.",
      classicDone: "Bravo, tu sais tout ! Annonce le plus possible… mais seulement ce que tu peux prouver.",
    },
  },
};

export const fr: Messages = mapStrings(messages, frenchSpaces);
