/** Texts of the printable edition (tabletop rules, printing guide, labels), in every language of the app. */

import type { Lang } from "../src/i18n/types.ts";
import { frenchSpaces, mapStrings } from "../src/i18n/typography.ts";

export type Block =
  | { readonly h2: string }
  | { readonly p: string }
  | { readonly ol: readonly string[] }
  | { readonly ul: readonly string[] }
  /** An example card, printed at actual size. */
  | { readonly card: string };

export interface PrintTexts {
  readonly characterNames: readonly string[];
  readonly expert: string;
  readonly boardHint: string;
  readonly charactersTitle: string;
  readonly charactersHelp: string;
  readonly flatTokens: string;
  readonly standees: string;
  readonly orderTokensTitle: string;
  readonly orderTokensHelp: string;
  readonly bidTilesTitle: string;
  readonly bidTilesHelp: string;
  readonly bidTilesMorePlayers: string;
  readonly rulesTitle: string;
  readonly rulesSubtitle: string;
  readonly rules: readonly Block[];
}

const en: PrintTexts = {
  characterNames: ["Star", "Circle", "Square"],
  expert: "EXPERT",
  boardHint: "Exactly one character per row and one per column.",
  charactersTitle: "Characters",
  charactersHelp:
    "Cut along the dashed lines. Use the flat tokens, or the standees: fold them along the dotted line so that everyone around the table can see the characters.",
  flatTokens: "Flat tokens (two sets)",
  standees: "Standees",
  orderTokensTitle: "Order tokens",
  orderTokensHelp: "When you lock in your bid, take the lowest token still available. It breaks ties.",
  bidTilesTitle: "Bid tiles — one row per player",
  bidTilesHelp: "To bid, put the tile with your number face down in front of you.",
  bidTilesMorePlayers: "Bid tiles for players 5 to 8 (print this page only for more than 4 players).",
  rulesTitle: "Trilemma",
  rulesSubtitle: "Three characters. Nine cells. Too many rules. · 1 to 8 players · about 30 minutes",
  rules: [
    { h2: "Goal" },
    {
      p: "Nine rule cards are face up, and they contradict each other. Be the fastest to find the largest group of cards that can all be true at the same time, bid that number, then prove it on the board. The player who has won the most cards at the end wins.",
    },
    { h2: "Components" },
    {
      ul: [
        "55 rule cards (base deck) and 36 expert cards (marked EXPERT), all with the same back.",
        "1 board: a 3 × 3 grid. Rows are numbered 1 to 3 from top to bottom, columns are lettered A to C from left to right. Corners and center are dark cells, the others are light.",
        "3 characters: the Star (one eye), the Circle (two eyes) and the Square (three eyes).",
        "8 order tokens, numbered 1 to 8.",
        "Bid tiles numbered 1 to 9, one row per player.",
        "Optional: a timer (sand timer or phone).",
      ],
    },
    { h2: "The golden rule" },
    {
      p: "A valid arrangement puts the 3 characters on the board with exactly one character per row and one per column. A group of cards is compatible when one arrangement makes all of them true at the same time.",
    },
    { h2: "Setup" },
    {
      ol: [
        "Put the board in the middle of the table, with the 3 characters next to it.",
        "Shuffle the rule cards (base deck only for the first games) into a face-down draw pile.",
        "Deal 9 cards face up in a 3 × 3 grid.",
        "Put one order token per player in the middle, from 1 up to the number of players.",
        "Each player takes a row of bid tiles.",
        "Decide together whether you play with a timer, and for how long. Without a timer, the search ends when everyone is ready.",
      ],
    },
    { h2: "A round" },
    {
      ol: [
        "Search. Everyone searches at the same time for the largest compatible group. Nobody touches the characters.",
        "Lock in. When you are done, put the bid tile of your number face down in front of you and take the lowest order token still available. Your bid can no longer change. When the timer runs out, the players who are not ready bid at once and receive the remaining tokens at random.",
        "Reveal. Everyone turns their bid tile over at the same time.",
        "Order. The highest bid demonstrates first. Ties go to the player who locked in first (lowest order token).",
        "Demonstration. The player places the 3 characters on the board, then shows exactly as many cards as they bid, one by one. The other players check each card. All or nothing: one false card, or one card missing, and the whole demonstration is void. The next player in the order then demonstrates from scratch, with their own bid. If every announced card is true, the player wins those cards.",
        "Refill. Return the order tokens to the middle. The other cards stay where they are; deal new cards into the empty slots, back to 9. If every demonstration failed, nobody scores and the same cards stay for a new search.",
      ],
    },
    { h2: "End of the game" },
    {
      p: "The game ends when the draw pile is empty and no card is left face up. Each player scores 1 point per card won. The highest score wins; tied players share the victory.",
    },
    { h2: "Solo" },
    {
      p: "Play the same rounds and try to empty the deck in as few rounds as possible. Perfect play takes about 9 rounds with the base deck.",
    },
    { h2: "Reading the cards" },
    { card: "TOUCH-STAR-CIRCLE" },
    {
      ul: [
        "“Above”, “below”, “to the left of” and “to the right of” mean any distance: 1 or 2 rows or columns.",
        "Two characters are never in the same row or column, so “touching” always means touching at a corner.",
        "“Neighboring rows” means exactly one row apart.",
        "Expert cards talk about “the character in row 1” or “in column A”: whoever stands there.",
        "The number in the corner of each card is only there to sort the cards.",
      ],
    },
    { h2: "Printing and assembly" },
    {
      ul: [
        "Print in color on A4 paper, at actual size (100%, never “fit to page”).",
        "Cards (files 1 and 2): use thick paper (160 to 250\u00a0g/m²) if you can. Then put the printed sheets back in the printer and print file 3 (backs) on the other side of each sheet. The grids are centered, so the backs line up whichever way the sheet is flipped. Without thick paper: print on plain paper and slide each card into a standard card sleeve (63.5 × 88\u00a0mm) in front of an old playing card.",
        "Cut the cards along the crop marks, ideally with a paper trimmer, or with a ruler and a craft knife (adults only).",
        "Board (file 4): thick paper, or glue it on cardboard.",
        "Characters (file 5): cut out the flat tokens or the standees. Fold the standees along the dotted line.",
        "Tokens (file 6): order tokens and bid tiles. Print page 2 only for more than 4 players.",
      ],
    },
  ],
};

const fr: PrintTexts = {
  characterNames: ["Étoile", "Rond", "Carré"],
  expert: "EXPERT",
  boardHint: "Exactement un personnage par ligne et un par colonne.",
  charactersTitle: "Personnages",
  charactersHelp:
    "Découpe en suivant les pointillés. Utilise les pions plats, ou les figurines : plie-les le long de la ligne en points pour que tout le monde autour de la table voie les personnages.",
  flatTokens: "Pions plats (deux jeux)",
  standees: "Figurines à plier",
  orderTokensTitle: "Jetons d’ordre",
  orderTokensHelp:
    "Quand tu fais ton annonce, prends le plus petit jeton encore disponible. Il départage les égalités.",
  bidTilesTitle: "Tuiles d’annonce — une rangée par joueur",
  bidTilesHelp: "Pour annoncer, pose face cachée devant toi la tuile de ton nombre.",
  bidTilesMorePlayers: "Tuiles d’annonce des joueurs 5 à 8 (n’imprime cette page que pour plus de 4 joueurs).",
  rulesTitle: "Trilemma",
  rulesSubtitle: "Trois personnages. Neuf cases. Trop de règles. · 1 à 8 joueurs · environ 30 minutes",
  rules: [
    { h2: "But du jeu" },
    {
      p: "Neuf cartes règles sont posées face visible, et elles se contredisent. Sois le plus rapide à trouver le plus grand groupe de cartes qui peuvent être vraies en même temps, annonce ce nombre, puis prouve-le sur le plateau. À la fin, le joueur qui a gagné le plus de cartes l’emporte.",
    },
    { h2: "Matériel" },
    {
      ul: [
        "55 cartes règles (paquet de base) et 36 cartes expert (marquées EXPERT), toutes avec le même dos.",
        "1 plateau : une grille de 3 × 3 cases. Les lignes sont numérotées de 1 à 3 de haut en bas, les colonnes vont de A à C de gauche à droite. Les coins et le centre sont des cases sombres, les autres sont claires.",
        "3 personnages : l’Étoile (un œil), le Rond (deux yeux) et le Carré (trois yeux).",
        "8 jetons d’ordre, numérotés de 1 à 8.",
        "Des tuiles d’annonce numérotées de 1 à 9, une rangée par joueur.",
        "En option : un minuteur (sablier ou téléphone).",
      ],
    },
    { h2: "La règle d’or" },
    {
      p: "Une disposition valide place les 3 personnages sur le plateau avec exactement un personnage par ligne et un par colonne. Un groupe de cartes est compatible quand une même disposition les rend toutes vraies en même temps.",
    },
    { h2: "Mise en place" },
    {
      ol: [
        "Pose le plateau au milieu de la table, avec les 3 personnages à côté.",
        "Mélange les cartes règles (seulement le paquet de base pour les premières parties) et forme une pioche face cachée.",
        "Pose 9 cartes face visible en 3 × 3.",
        "Mets au milieu un jeton d’ordre par joueur, de 1 jusqu’au nombre de joueurs.",
        "Chaque joueur prend une rangée de tuiles d’annonce.",
        "Décidez ensemble si vous jouez avec un minuteur, et sa durée. Sans minuteur, la recherche s’arrête quand tout le monde est prêt.",
      ],
    },
    { h2: "Une manche" },
    {
      ol: [
        "Recherche. Tout le monde cherche en même temps le plus grand groupe compatible. Personne ne touche aux personnages.",
        "Annonce. Quand tu as fini, pose face cachée devant toi la tuile de ton nombre et prends le plus petit jeton d’ordre encore disponible. Ton annonce ne peut plus changer. Quand le minuteur sonne, les joueurs qui ne sont pas prêts annoncent tout de suite et reçoivent les jetons restants au hasard.",
        "Révélation. Tout le monde retourne sa tuile d’annonce en même temps.",
        "Ordre. La plus grosse annonce démontre en premier. En cas d’égalité, c’est le joueur qui a annoncé le premier (le plus petit jeton d’ordre).",
        "Démonstration. Le joueur place les 3 personnages sur le plateau, puis montre exactement autant de cartes que son annonce, une par une. Les autres joueurs vérifient chaque carte. Tout ou rien : une seule carte fausse, ou une carte manquante, et toute la démonstration est ratée. Le joueur suivant dans l’ordre démontre alors depuis le début, avec sa propre annonce. Si toutes les cartes annoncées sont vraies, le joueur gagne ces cartes.",
        "Réassort. Remets les jetons d’ordre au milieu. Les autres cartes restent en place ; complète les emplacements vides avec la pioche pour revenir à 9 cartes. Si toutes les démonstrations ont raté, personne ne marque et les mêmes cartes restent pour une nouvelle recherche.",
      ],
    },
    { h2: "Fin de la partie" },
    {
      p: "La partie s’arrête quand la pioche est vide et qu’il ne reste plus de carte face visible. Chaque joueur marque 1 point par carte gagnée. Le plus haut score gagne ; en cas d’égalité, la victoire est partagée.",
    },
    { h2: "En solo" },
    {
      p: "Joue les mêmes manches et essaie de vider le paquet en un minimum de manches. Un joueur parfait y arrive en 9 manches environ avec le paquet de base.",
    },
    { h2: "Lire les cartes" },
    { card: "TOUCH-STAR-CIRCLE" },
    {
      ul: [
        "« Au-dessus », « en dessous », « à gauche » et « à droite » veulent dire à n’importe quelle distance : 1 ou 2 lignes ou colonnes.",
        "Deux personnages ne sont jamais sur la même ligne ni sur la même colonne : « se toucher » veut donc toujours dire se toucher par un coin.",
        "« Lignes voisines » veut dire exactement une ligne d’écart.",
        "Les cartes expert parlent du « personnage de la ligne 1 » ou « de la colonne A » : celui qui s’y trouve, quel qu’il soit.",
        "Le numéro dans le coin de chaque carte sert seulement à ranger les cartes.",
      ],
    },
    { h2: "Impression et montage" },
    {
      ul: [
        "Imprime en couleur sur du papier A4, à taille réelle (100\u00a0%, jamais « ajuster à la page »).",
        "Cartes (fichiers 1 et 2) : utilise du papier épais (160 à 250\u00a0g/m²) si possible. Remets ensuite les feuilles imprimées dans l’imprimante et imprime le fichier 3 (dos) au verso de chaque feuille. Les grilles sont centrées : les dos tombent en face quel que soit le sens où la feuille est retournée. Sans papier épais : imprime sur du papier normal et glisse chaque carte dans une pochette de protection standard (63,5 × 88\u00a0mm) devant une vieille carte à jouer.",
        "Découpe les cartes en suivant les traits de coupe, idéalement avec un massicot, ou avec une règle et un cutter (réservé aux adultes).",
        "Plateau (fichier 4) : papier épais, ou collé sur du carton.",
        "Personnages (fichier 5) : découpe les pions plats ou les figurines. Plie les figurines le long de la ligne en points.",
        "Jetons (fichier 6) : jetons d’ordre et tuiles d’annonce. N’imprime la page 2 que pour plus de 4 joueurs.",
      ],
    },
  ],
};

const es: PrintTexts = {
  characterNames: ["Estrella", "Círculo", "Cuadrado"],
  expert: "EXPERTO",
  boardHint: "Exactamente un personaje por fila y uno por columna.",
  charactersTitle: "Personajes",
  charactersHelp:
    "Recorta por las líneas discontinuas. Usa las fichas planas o las figuras: dóblalas por la línea de puntos para que todos alrededor de la mesa vean a los personajes.",
  flatTokens: "Fichas planas (dos juegos)",
  standees: "Figuras para doblar",
  orderTokensTitle: "Fichas de orden",
  orderTokensHelp: "Cuando haces tu anuncio, toma la ficha más baja que quede disponible. Sirve para desempatar.",
  bidTilesTitle: "Fichas de anuncio — una fila por jugador",
  bidTilesHelp: "Para anunciar, pon boca abajo delante de ti la ficha de tu número.",
  bidTilesMorePlayers: "Fichas de anuncio de los jugadores 5 a 8 (imprime esta página solo para más de 4 jugadores).",
  rulesTitle: "Trilemma",
  rulesSubtitle: "Tres personajes. Nueve casillas. Demasiadas reglas. · De 1 a 8 jugadores · unos 30 minutos",
  rules: [
    { h2: "Objetivo" },
    {
      p: "Nueve cartas de reglas están boca arriba, y se contradicen. Sé el más rápido en encontrar el grupo más grande de cartas que pueden ser verdaderas a la vez, anuncia ese número y demuéstralo en el tablero. Al final, gana quien haya ganado más cartas.",
    },
    { h2: "Componentes" },
    {
      ul: [
        "55 cartas de reglas (mazo básico) y 36 cartas de experto (marcadas EXPERTO), todas con el mismo dorso.",
        "1 tablero: una cuadrícula de 3 × 3. Las filas se numeran del 1 al 3 de arriba abajo y las columnas van de la A a la C de izquierda a derecha. Las esquinas y el centro son casillas oscuras; las demás son claras.",
        "3 personajes: la Estrella (un ojo), el Círculo (dos ojos) y el Cuadrado (tres ojos).",
        "8 fichas de orden, numeradas del 1 al 8.",
        "Fichas de anuncio numeradas del 1 al 9, una fila por jugador.",
        "Opcional: un temporizador (reloj de arena o teléfono).",
      ],
    },
    { h2: "La regla de oro" },
    {
      p: "Una colocación válida pone los 3 personajes en el tablero con exactamente un personaje por fila y uno por columna. Un grupo de cartas es compatible cuando una misma colocación las hace todas verdaderas a la vez.",
    },
    { h2: "Preparación" },
    {
      ol: [
        "Pon el tablero en el centro de la mesa, con los 3 personajes al lado.",
        "Baraja las cartas de reglas (solo el mazo básico en las primeras partidas) y forma un mazo boca abajo.",
        "Pon 9 cartas boca arriba en 3 × 3.",
        "Pon en el centro una ficha de orden por jugador, del 1 hasta el número de jugadores.",
        "Cada jugador toma una fila de fichas de anuncio.",
        "Decidid juntos si jugáis con temporizador y cuánto dura. Sin temporizador, la búsqueda termina cuando todos están listos.",
      ],
    },
    { h2: "Una ronda" },
    {
      ol: [
        "Búsqueda. Todos buscan a la vez el grupo compatible más grande. Nadie toca a los personajes.",
        "Anuncio. Cuando termines, pon boca abajo delante de ti la ficha de tu número y toma la ficha de orden más baja que quede disponible. Tu anuncio ya no puede cambiar. Cuando se acaba el tiempo, los jugadores que no están listos anuncian enseguida y reciben las fichas restantes al azar.",
        "Revelación. Todos dan la vuelta a su ficha de anuncio a la vez.",
        "Orden. El anuncio más alto demuestra primero. En caso de empate, empieza quien anunció primero (la ficha de orden más baja).",
        "Demostración. El jugador coloca los 3 personajes en el tablero y luego muestra exactamente tantas cartas como su anuncio, una por una. Los demás comprueban cada carta. Todo o nada: una sola carta falsa, o una carta que falte, y toda la demostración falla. El siguiente jugador en el orden demuestra entonces desde el principio, con su propio anuncio. Si todas las cartas anunciadas son verdaderas, el jugador gana esas cartas.",
        "Reposición. Devuelve las fichas de orden al centro. Las demás cartas se quedan en su sitio; rellena los huecos con el mazo hasta volver a 9 cartas. Si todas las demostraciones fallaron, nadie puntúa y las mismas cartas se quedan para una nueva búsqueda.",
      ],
    },
    { h2: "Fin de la partida" },
    {
      p: "La partida termina cuando el mazo está vacío y no queda ninguna carta boca arriba. Cada jugador gana 1 punto por carta ganada. Gana la puntuación más alta; en caso de empate, la victoria se comparte.",
    },
    { h2: "En solitario" },
    {
      p: "Juega las mismas rondas e intenta vaciar el mazo en el menor número de rondas posible. Un jugador perfecto lo consigue en unas 9 rondas con el mazo básico.",
    },
    { h2: "Leer las cartas" },
    { card: "TOUCH-STAR-CIRCLE" },
    {
      ul: [
        "«Encima», «debajo», «a la izquierda» y «a la derecha» significan a cualquier distancia: 1 o 2 filas o columnas.",
        "Dos personajes nunca están en la misma fila ni en la misma columna, así que «tocarse» siempre significa tocarse por una esquina.",
        "«Filas contiguas» significa exactamente una fila de distancia.",
        "Las cartas de experto hablan del «personaje de la fila 1» o «de la columna A»: el que esté allí, sea cual sea.",
        "El número en la esquina de cada carta solo sirve para ordenar las cartas.",
      ],
    },
    { h2: "Impresión y montaje" },
    {
      ul: [
        "Imprime en color en papel A4, a tamaño real (100\u00a0%, nunca «ajustar a la página»).",
        "Cartas (archivos 1 y 2): usa papel grueso (de 160 a 250\u00a0g/m²) si puedes. Después vuelve a poner las hojas impresas en la impresora e imprime el archivo 3 (dorsos) por detrás de cada hoja. Las cuadrículas están centradas, así que los dorsos coinciden sea cual sea el sentido en que se gira la hoja. Sin papel grueso: imprime en papel normal y mete cada carta en una funda estándar (63,5 × 88\u00a0mm) delante de una carta de baraja vieja.",
        "Recorta las cartas por las marcas de corte, mejor con una guillotina, o con una regla y un cúter (solo adultos).",
        "Tablero (archivo 4): papel grueso, o pegado sobre cartón.",
        "Personajes (archivo 5): recorta las fichas planas o las figuras. Dobla las figuras por la línea de puntos.",
        "Fichas (archivo 6): fichas de orden y fichas de anuncio. Imprime la página 2 solo para más de 4 jugadores.",
      ],
    },
  ],
};

export const PRINT_TEXTS: Readonly<Record<Lang, PrintTexts>> = { en, fr: mapStrings(fr, frenchSpaces), es };
