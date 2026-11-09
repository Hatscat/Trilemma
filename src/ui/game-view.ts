/**
 * Game screen: board, character tray, face-up cards and the action bar.
 * The view keeps references to its DOM nodes and updates them on every state change.
 * All texts come from the current translation (`t()`).
 */

import {
  ARRANGEMENTS,
  arrangementToPlacement,
  blockerOf,
  CELL_COUNT,
  cellCol,
  cellLabel,
  cellRow,
  characterAt,
  CHARACTERS,
  COL_LABELS,
  isDark,
  type Placement,
  ROW_LABELS,
} from "../core/board.ts";
import { getCard } from "../core/cards.ts";
import {
  canEditBoard,
  check,
  clearBoard,
  clearSelection,
  demonstrate,
  expireTimer,
  GameError,
  type GameState,
  giveUp,
  isBoardHidden,
  lockIn,
  type Mode,
  nextRound,
  place,
  remainingMs,
  revealBoard,
  type RoundResult,
  shiftTime,
  summarize,
  TABLE_SIZE,
  tableCards,
  toggleCard,
} from "../core/game.ts";
import { cardCaption, familyTitle, t } from "../i18n/index.ts";
import { bidDialog, cardZoomDialog, closeAllDialogs, confirmDialog, openDialog } from "./dialogs.ts";
import { formatClock, formatDuration, h, ICONS, prefersReducedMotion } from "./dom.ts";
import { glyphSvg } from "./glyph.ts";
import { characterSvg } from "./sprite.ts";
import { addFinishedGame } from "./storage.ts";

/** UI events that do not change the game state (used by the tutorial). */
export type ViewEvent = "revealed";

export interface GameViewCallbacks {
  /** Back to the menu. */
  readonly onExit: () => void;
  /** Called after every state change (persistence, tutorial progress). */
  readonly onChange: (state: GameState) => void;
  /** Starts a new game with the same settings. */
  readonly onPlayAgain?: (mode: Mode) => void;
  readonly onEvent?: (event: ViewEvent) => void;
}

export interface GameViewOptions {
  /** Header title (defaults to the mode name). */
  readonly title?: string;
  /** Header subtitle (defaults to the round number). */
  readonly subtitle?: (state: GameState) => string;
  /** Element shown between the header and the play area (tutorial coach). */
  readonly banner?: HTMLElement;
  /** Replaces the buttons shown after a won round (tutorial). */
  readonly continueButton?: { readonly label: () => string; readonly onClick: () => void };
  /** Actions removed from the action bar. */
  readonly hiddenActions?: readonly string[];
  readonly className?: string;
}

interface ButtonSpec {
  readonly label: string;
  readonly action: string;
  readonly primary?: boolean;
  readonly disabled?: boolean;
}

interface ActionView {
  readonly status: string;
  readonly detail?: string;
  readonly tone?: "info" | "ok" | "bad";
  readonly buttons: readonly ButtonSpec[];
}

interface DragState {
  readonly character: number;
  readonly fromBoard: boolean;
  readonly startX: number;
  readonly startY: number;
  readonly pointerId: number;
  ghost: HTMLElement | null;
}

const CHECK_REVEAL_MS = 380;
const LONG_PRESS_MS = 480;

export class GameView {
  readonly root: HTMLElement;
  #state: GameState;
  #callbacks: GameViewCallbacks;
  #options: GameViewOptions;
  #active: number | null = null;
  #showSolution = false;
  #revealed = Number.POSITIVE_INFINITY;
  #animationTimer: ReturnType<typeof setInterval> | undefined;
  #clockTimer: ReturnType<typeof setInterval> | undefined;
  #flashTimer: ReturnType<typeof setTimeout> | undefined;
  #flash: string | null = null;
  #actionKey = "";
  /** Swallows the click that the browser fires after a drop or a long press. */
  #suppressClick = false;
  #drag: DragState | null = null;
  #longPress: ReturnType<typeof setTimeout> | undefined;
  #hiddenAt: number | null = null;
  #firstRender = true;
  #bidPending = false;
  #destroyed = false;

  #header = h("header", { class: "game-header" });
  #title = h("strong", {});
  #subtitle = h("span", { class: "round" });
  #stats = h("span", { class: "stats" });
  #clock = h("span", { class: "clock", role: "timer", "aria-live": "off" });
  #targetBar = h("section", { class: "target-bar", role: "status" });
  /** Pro mode: replaces the board while it is hidden. */
  #hiddenNote = h("p", { class: "board-hidden-note", hidden: true });
  #targetKey = "";
  #board = h("div", { class: "board-cells", role: "group" });
  #tray = h("div", { class: "tray", "data-tray": "", role: "group" });
  #cards = h("div", { class: "cards", role: "group" });
  #actions = h("footer", { class: "action-bar" });
  #cells: HTMLButtonElement[] = [];
  #traySlots: HTMLButtonElement[] = [];
  #slots: HTMLElement[] = [];

  constructor(state: GameState, callbacks: GameViewCallbacks, options: GameViewOptions = {}) {
    this.#state = state;
    this.#callbacks = callbacks;
    this.#options = options;
    this.root = this.#build();
    this.#render();
    this.#firstRender = false;
    this.#clockTimer = setInterval(this.#tick, 250);
    this.#tick();
    document.addEventListener("visibilitychange", this.#onVisibility);
    globalThis.addEventListener("blur", this.#onPointerCancel);
    if (state.phase.name === "bidding") queueMicrotask(() => this.#askBid(true));
    if (state.phase.name === "over") queueMicrotask(() => this.#showGameOver(false));
  }

  get state(): GameState {
    return this.#state;
  }

  /** True while the cards of a demonstration are being revealed one by one. */
  get busy(): boolean {
    return this.#animating;
  }

  destroy(): void {
    this.#destroyed = true;
    clearInterval(this.#clockTimer);
    clearInterval(this.#animationTimer);
    clearTimeout(this.#flashTimer);
    clearTimeout(this.#longPress);
    this.#endDrag();
    document.removeEventListener("visibilitychange", this.#onVisibility);
    globalThis.removeEventListener("blur", this.#onPointerCancel);
    closeAllDialogs();
  }

  /** Re-renders after an external change (e.g. the tutorial coach). */
  refresh(): void {
    this.#actionKey = "";
    this.#render();
  }

  // -------------------------------------------------------------------------
  // Building
  // -------------------------------------------------------------------------

  #build(): HTMLElement {
    const m = t().game;
    const mode = this.#state.config.mode;
    this.#title.textContent = this.#options.title ?? m.modeName(mode);
    if (this.#state.config.pro) this.#title.append(" ", h("span", { class: "pro-badge" }, m.proBadge));
    this.#board.setAttribute("aria-label", m.boardLabel);
    this.#tray.setAttribute("aria-label", m.trayLabel);
    this.#cards.setAttribute("aria-label", m.cardsLabel);
    this.#header.append(
      h("button", { type: "button", class: "icon-btn", "data-action": "exit", "aria-label": m.back, html: ICONS.back }),
      h("div", { class: "game-title" }, this.#title, this.#subtitle),
      this.#stats,
      this.#clock,
    );

    const colLabels = COL_LABELS.map((label) => h("span", { class: "label col-label" }, label));
    const rowLabels = ROW_LABELS.map((label) => h("span", { class: "label row-label" }, label));
    for (let cell = 0; cell < CELL_COUNT; cell++) {
      const button = h("button", {
        type: "button",
        class: `cell ${isDark(cellRow(cell), cellCol(cell)) ? "dark" : "light"}`,
        "data-cell": cell,
      });
      this.#cells.push(button);
      this.#board.append(button);
    }
    const board = h(
      "div",
      { class: "board" },
      h("span", { class: "corner" }),
      h("div", { class: "col-labels" }, ...colLabels),
      h("div", { class: "row-labels" }, ...rowLabels),
      this.#board,
    );
    for (let c = 0; c < CHARACTERS.length; c++) {
      const slot = h("button", { type: "button", class: "tray-slot", "data-tray-slot": c });
      this.#traySlots.push(slot);
      this.#tray.append(slot);
    }
    for (let i = 0; i < TABLE_SIZE; i++) {
      const slot = h("div", { class: "card-slot", "data-slot": i });
      this.#slots.push(slot);
      this.#cards.append(slot);
    }

    const root = h(
      "main",
      { class: `screen game mode-${mode} ${this.#options.className ?? ""}` },
      this.#header,
      this.#targetBar,
      this.#options.banner ?? null,
      h(
        "section",
        { class: "play-area" },
        this.#hiddenNote,
        h("div", { class: "board-zone" }, board, this.#tray),
        this.#cards,
      ),
      this.#actions,
    );
    root.addEventListener("click", this.#onClick);
    root.addEventListener("pointerdown", this.#onPointerDown);
    root.addEventListener("contextmenu", (event) => {
      if ((event.target as Element).closest(".card-slot")) event.preventDefault();
    });
    return root;
  }

  // -------------------------------------------------------------------------
  // State changes
  // -------------------------------------------------------------------------

  #apply(transition: (state: GameState) => GameState): boolean {
    let next: GameState;
    try {
      next = transition(this.#state);
    } catch (error) {
      if (error instanceof GameError) {
        this.#showFlash(t().game.notPossible);
        return false;
      }
      throw error;
    }
    const previous = this.#state;
    this.#state = next;
    this.#onTransition(previous, next);
    this.#callbacks.onChange(next);
    this.#render();
    return true;
  }

  #onTransition(previous: GameState, next: GameState): void {
    const enteredResult = previous.phase.name !== "result" && next.phase.name === "result";
    if (enteredResult && next.phase.name === "result") {
      this.#active = null;
      const { result } = next.phase;
      this.#showSolution = result.outcome === "revealed";
      if (result.checks.length > 0 && !prefersReducedMotion()) this.#startReveal(result);
      else this.#revealed = Number.POSITIVE_INFINITY;
    }
    if (next.round !== previous.round || next.phase.name === "over") {
      this.#active = null;
      this.#showSolution = false;
      this.#revealed = Number.POSITIVE_INFINITY;
    }
    if (previous.phase.name !== "bidding" && next.phase.name === "bidding") {
      // A pending (optional) bid dialog is closed and comes back as a forced one.
      closeAllDialogs();
      if (!this.#bidPending) queueMicrotask(() => this.#askBid(true));
    }
    if (previous.phase.name !== "over" && next.phase.name === "over") {
      queueMicrotask(() => this.#showGameOver(true));
    }
  }

  #startReveal(result: RoundResult): void {
    clearInterval(this.#animationTimer);
    this.#revealed = 0;
    this.#animationTimer = setInterval(() => {
      this.#revealed++;
      const done = this.#revealed >= result.checks.length;
      if (done) {
        clearInterval(this.#animationTimer);
        this.#revealed = Number.POSITIVE_INFINITY;
      }
      this.#render();
      if (done) this.#callbacks.onEvent?.("revealed");
    }, CHECK_REVEAL_MS);
  }

  get #animating(): boolean {
    return Number.isFinite(this.#revealed);
  }

  get #editable(): boolean {
    return canEditBoard(this.#state) && !this.#animating;
  }

  #showFlash(message: string): void {
    this.#flash = message;
    clearTimeout(this.#flashTimer);
    this.#flashTimer = setTimeout(() => {
      this.#flash = null;
      this.#render();
    }, 2600);
    this.#render();
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  #render(): void {
    this.#renderHeader();
    this.#renderTarget();
    this.#renderBoard();
    this.#renderTray();
    this.#renderCards();
    this.#renderActions();
  }

  #renderHeader(): void {
    const s = this.#state;
    const m = t().game;
    this.#subtitle.textContent = this.#options.subtitle?.(s) ??
      (s.phase.name === "over" ? m.gameOver : m.round(s.round));
    const parts = [m.pile(s.pile.length), m.won(s.won.length)];
    if (s.config.mode === "practice") {
      const ongoing = s.phase.name === "search" ? s.roundMistakes : 0;
      parts.push(m.mistakes(s.history.reduce((n, r) => n + r.mistakes, 0) + ongoing));
    }
    // Each part stays on one line; the header wraps between parts on narrow screens.
    this.#stats.replaceChildren(
      ...parts.flatMap((part, i) => [i > 0 ? " · " : "", h("span", { class: "nowrap" }, part)]),
    );
  }

  /** The number of cards to show: the target in practice mode, the bid once locked in classic mode. */
  #renderTarget(): void {
    const m = t().game;
    const s = this.#state;
    const { phase } = s;
    let number: number | null = null;
    let label = "";
    if (s.config.mode === "practice" && phase.name !== "over") {
      number = s.target;
      label = m.cardsToFind(s.target);
    } else if (phase.name === "demonstrate" || (phase.name === "result" && phase.result.bid !== null)) {
      number = phase.name === "demonstrate" ? phase.bid : phase.result.bid;
      label = m.yourBid;
    }
    const selected = phase.name === "result" ? (phase.result.outcome === "won" ? number ?? 0 : 0) : s.selection.length;
    const key = `${number}|${label}|${selected}`;
    if (key === this.#targetKey) return;
    this.#targetKey = key;
    this.#targetBar.hidden = number === null;
    if (number === null) return;
    const pips = Array.from({ length: number }, (_, i) => h("span", { class: `pip ${i < selected ? "is-on" : ""}` }));
    this.#targetBar.setAttribute("aria-label", `${number} ${label} · ${m.selectedOf(selected, number)}`);
    this.#targetBar.replaceChildren(
      h("span", { class: "target-number", "aria-hidden": "true" }, number),
      h("span", { class: "target-text", "aria-hidden": "true" }, label),
      h("span", { class: `target-pips ${selected > number ? "is-over" : ""}`, "aria-hidden": "true" }, ...pips),
    );
  }

  #shownPlacement(): Placement {
    const { phase } = this.#state;
    if (this.#showSolution && phase.name === "result") {
      return arrangementToPlacement(ARRANGEMENTS[phase.result.solution]);
    }
    return this.#state.placement;
  }

  #renderBoard(): void {
    const m = t().game;
    const placement = this.#shownPlacement();
    const editable = this.#editable;
    const active = editable ? this.#active : null;
    const activeCell = active === null ? null : placement[active];
    this.#board.classList.toggle("is-solution", this.#showSolution);
    this.#board.classList.toggle("is-locked", !editable);
    // Classic search: the arrangement is only imagined, the characters wait in the tray.
    this.root.classList.toggle("is-imagining", this.#state.phase.name === "search" && !canEditBoard(this.#state));
    // Pro mode: no board and no characters while the player thinks.
    const hidden = isBoardHidden(this.#state);
    this.root.classList.toggle("is-board-hidden", hidden);
    this.#hiddenNote.hidden = !hidden;
    if (hidden) this.#hiddenNote.textContent = m.boardHidden(this.#state.config.mode);
    this.#board.style.setProperty("--active-color", active === null ? "transparent" : `var(--character-${active})`);
    for (const [cell, button] of this.#cells.entries()) {
      const occupant = characterAt(placement, cell);
      if (button.dataset.occupant !== String(occupant)) {
        button.dataset.occupant = String(occupant);
        button.innerHTML = occupant === null ? "" : characterSvg(occupant, "piece");
        if (occupant !== null) button.querySelector("svg")!.dataset.piece = String(occupant);
      }
      const row = cellRow(cell);
      const col = cellCol(cell);
      // Lanes: each placed character reserves its row and its column, drawn as bands of its color.
      const rowOwner = placement.findIndex((p) => p !== null && cellRow(p) === row);
      const colOwner = placement.findIndex((p) => p !== null && cellCol(p) === col);
      button.style.setProperty("--row-lane", rowOwner === -1 ? "transparent" : `var(--lane-${rowOwner})`);
      button.style.setProperty("--col-lane", colOwner === -1 ? "transparent" : `var(--lane-${colOwner})`);
      // While a character is selected: where it can go, and where the golden rule forbids it.
      const free = active !== null && occupant === null && blockerOf(placement, active, cell) === null;
      const blocked = active !== null && occupant === null && !free;
      button.classList.toggle("is-free", free);
      button.classList.toggle("is-blocked", blocked);
      button.classList.toggle("is-active", occupant !== null && occupant === active && activeCell === cell);
      button.classList.toggle("has-piece", occupant !== null);
      button.setAttribute("aria-disabled", String(!editable));
      button.setAttribute("aria-label", m.cellLabel(cellLabel(row, col), isDark(row, col), occupant));
    }
  }

  #renderTray(): void {
    const placement = this.#shownPlacement();
    const active = this.#editable ? this.#active : null;
    for (const [c, slot] of this.#traySlots.entries()) {
      const offBoard = placement[c] === null;
      if (slot.dataset.filled !== String(offBoard)) {
        slot.dataset.filled = String(offBoard);
        slot.innerHTML = offBoard ? characterSvg(c, "piece") : "";
        if (offBoard) slot.querySelector("svg")!.dataset.piece = String(c);
      }
      slot.classList.toggle("is-active", offBoard && active === c);
      slot.classList.toggle("is-return", !offBoard && active === c);
      slot.setAttribute("aria-disabled", String(!this.#editable));
      slot.setAttribute("aria-label", t().game.traySlotLabel(c, offBoard));
    }
  }

  #renderCards(): void {
    const s = this.#state;
    const { phase } = s;
    const result = phase.name === "result" ? phase.result : null;
    const feedback = phase.name === "search" ? phase.feedback : null;
    const revealedChecks = result ? result.checks.slice(0, this.#revealed) : [];
    for (const [i, slot] of this.#slots.entries()) {
      const id = s.table[i];
      if (slot.dataset.card !== String(id)) {
        slot.dataset.card = String(id);
        slot.replaceChildren(
          ...(id === null ? [h("div", { class: "card-empty", "aria-hidden": "true" })] : cardNodes(id)),
        );
        if (!this.#firstRender && id !== null) {
          slot.classList.remove("is-new");
          void slot.offsetWidth; // Restart the deal animation.
          slot.classList.add("is-new");
        }
      }
      slot.classList.toggle("is-empty", id === null);
      if (id === null) continue;
      const selected = s.selection.includes(id);
      const checked = revealedChecks.find((c) => c.id === id) ?? null;
      let badge: "" | "selected" | "true" | "false" = "";
      const classes: Record<string, boolean> = {};
      if (result && this.#showSolution) {
        classes["is-solution"] = result.solutionCards.includes(id);
        classes["is-dim"] = !result.solutionCards.includes(id);
        if (classes["is-solution"]) badge = "true";
      } else if (result) {
        classes["is-picked"] = selected;
        classes["is-dim"] = !selected;
        if (checked) badge = checked.ok ? "true" : "false";
        classes["is-true"] = checked?.ok === true;
        classes["is-false"] = checked?.ok === false;
      } else {
        classes["is-selected"] = selected;
        classes["is-false"] = feedback?.falseCard === id;
        badge = feedback?.falseCard === id ? "false" : selected ? "selected" : "";
      }
      for (const name of ["is-selected", "is-picked", "is-dim", "is-true", "is-false", "is-solution"]) {
        slot.classList.toggle(name, classes[name] === true);
      }
      const card = slot.querySelector<HTMLButtonElement>(".card")!;
      card.setAttribute("aria-pressed", String(selected));
      card.setAttribute("aria-disabled", String(!this.#editable));
      const badgeEl = slot.querySelector<HTMLElement>(".card-badge")!;
      if (badgeEl.dataset.kind !== badge) {
        badgeEl.dataset.kind = badge;
        badgeEl.innerHTML = badge === "false" ? ICONS.cross : badge === "" ? "" : ICONS.check;
      }
    }
  }

  #renderActions(): void {
    const view = this.#actionView();
    const hidden = this.#options.hiddenActions ?? [];
    const buttons = view.buttons.filter((b) => !hidden.includes(b.action));
    const key = JSON.stringify({ ...view, buttons });
    if (key === this.#actionKey) return;
    this.#actionKey = key;
    this.#actions.dataset.tone = view.tone ?? "info";
    this.#actions.replaceChildren(
      h(
        "div",
        { class: "status", role: "status", "aria-live": "polite" },
        h("p", { class: "status-main" }, view.status),
        view.detail ? h("p", { class: "status-detail" }, view.detail) : null,
      ),
      h(
        "div",
        { class: "actions" },
        ...buttons.map((b) =>
          h("button", {
            type: "button",
            class: `btn ${b.primary ? "btn-primary" : "btn-ghost"}`,
            "data-action": b.action,
            disabled: b.disabled === true,
          }, b.label)
        ),
      ),
    );
  }

  #actionView(): ActionView {
    const m = t().game;
    const s = this.#state;
    const { phase } = s;
    const count = s.selection.length;
    const placed = s.placement.filter((p) => p !== null).length;
    const clear: ButtonSpec = { label: m.clear, action: "clear", disabled: placed === 0 && count === 0 };
    const flash = this.#flash;

    if (this.#animating) return { status: m.checking, buttons: [] };

    switch (phase.name) {
      case "search": {
        if (s.config.mode === "classic") {
          return {
            status: flash ?? m.searchClassic,
            tone: flash ? "bad" : "info",
            buttons: [{ label: m.lockIn, action: "lock-in", primary: true }],
          };
        }
        if (isBoardHidden(s)) {
          return {
            status: flash ?? m.searchPractice(s.target),
            tone: flash ? "bad" : "info",
            buttons: [
              { label: m.giveUp, action: "give-up" },
              { label: m.showBoard, action: "reveal-board", primary: true },
            ],
          };
        }
        const missing = missingFor(s.target, count, placed);
        const falseCard = phase.feedback ? getCard(phase.feedback.falseCard) : null;
        return {
          status: flash ?? (falseCard ? m.falseCardRetry(falseCard.number) : m.searchPractice(s.target)),
          detail: [m.selectedOf(count, s.target), missing].filter(Boolean).join(" · "),
          tone: flash || falseCard ? "bad" : "info",
          buttons: [
            { label: m.giveUp, action: "give-up" },
            { label: m.check, action: "check", primary: true, disabled: missing !== null },
          ],
        };
      }
      case "bidding":
        return { status: m.timesUp, tone: "bad", buttons: [{ label: m.lockIn, action: "forced-bid", primary: true }] };
      case "demonstrate": {
        const missing = missingFor(phase.bid, count, placed);
        return {
          status: flash ?? m.demonstrateStatus(phase.bid),
          detail: [m.selectedOf(count, phase.bid), missing].filter(Boolean).join(" · "),
          tone: flash ? "bad" : "info",
          buttons: [clear, { label: m.demonstrate, action: "demonstrate", primary: true, disabled: missing !== null }],
        };
      }
      case "result":
        return this.#resultView(phase.result);
      case "over":
        return {
          status: m.deckCleared,
          tone: "ok",
          buttons: [{ label: m.seeResults, action: "results", primary: true }],
        };
    }
  }

  #resultView(result: RoundResult): ActionView {
    const m = t().game;
    const s = this.#state;
    const lastRound = s.pile.length === 0 && tableCards(s).length === result.removed.length;
    const continueButton = this.#options.continueButton;
    const next: ButtonSpec = continueButton && result.outcome === "won"
      ? { label: continueButton.label(), action: "continue", primary: true }
      : { label: lastRound ? m.seeResults : m.nextRound, action: "next-round", primary: true };
    const toggle: ButtonSpec = { label: this.#showSolution ? m.myArrangement : m.bestGroup, action: "toggle-solution" };
    switch (result.outcome) {
      case "won": {
        if (result.bid === null) {
          const mistakes = result.mistakes === 0 ? m.noMistakes : m.mistakeCount(result.mistakes);
          return {
            status: m.wellDone(result.removed.length),
            detail: `${mistakes} ${m.foundIn(formatDuration(result.durationMs))}`,
            tone: "ok",
            buttons: [next],
          };
        }
        const perfect = result.bid === result.max;
        return {
          status: m.validDemonstration(result.bid),
          detail: perfect ? m.perfect : m.bestPossible(result.max),
          tone: "ok",
          buttons: perfect ? [next] : [toggle, next],
        };
      }
      case "failed": {
        const falseCheck = result.checks.find((c) => !c.ok);
        const reason = falseCheck ? m.cardFalse(getCard(falseCheck.id).number) : m.incomplete;
        return {
          status: `${reason} ${m.nobodyScores}`,
          detail: `${m.bestPossible(result.max)} ${m.sameCardsStay}`,
          tone: "bad",
          buttons: [toggle, next],
        };
      }
      case "revealed":
        return { status: m.revealed(result.max), detail: m.discarded, tone: "info", buttons: [next] };
    }
  }

  // -------------------------------------------------------------------------
  // Clock
  // -------------------------------------------------------------------------

  #tick = (): void => {
    const s = this.#state;
    const now = Date.now();
    const left = remainingMs(s, now);
    if (left !== null) {
      this.#clock.hidden = false;
      this.#clock.textContent = formatClock(left);
      this.#clock.classList.toggle("is-urgent", left <= 10_000);
      if (left <= 0) this.#apply((state) => expireTimer(state, Date.now()));
    } else if (s.config.mode === "practice" && s.phase.name === "search") {
      this.#clock.hidden = false;
      this.#clock.classList.remove("is-urgent");
      this.#clock.textContent = formatClock(Math.floor((now - s.roundStartedAt) / 1000) * 1000);
    } else {
      this.#clock.hidden = true;
    }
  };

  #onVisibility = (): void => {
    if (document.visibilityState === "hidden") {
      this.#hiddenAt = Date.now();
      this.#callbacks.onChange(this.#state);
    } else if (this.#hiddenAt !== null) {
      // The clock is paused while the app is in the background.
      this.#state = shiftTime(this.#state, Date.now() - this.#hiddenAt);
      this.#hiddenAt = null;
      this.#callbacks.onChange(this.#state);
      this.#tick();
    }
  };

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------

  #onClick = (event: MouseEvent): void => {
    if (this.#suppressClick) {
      this.#suppressClick = false;
      return;
    }
    const target = event.target as Element;
    const action = target.closest<HTMLElement>("[data-action]");
    if (action) {
      this.#runAction(action.dataset.action!);
      return;
    }
    const zoom = target.closest<HTMLElement>("[data-zoom]");
    if (zoom) {
      this.#zoom(zoom.dataset.zoom!);
      return;
    }
    const card = target.closest<HTMLElement>("[data-card-id]");
    if (card) {
      if (this.#editable) this.#apply((s) => toggleCard(s, card.dataset.cardId!));
      return;
    }
    const cell = target.closest<HTMLElement>("[data-cell]");
    if (cell) {
      this.#tapCell(Number(cell.dataset.cell));
      return;
    }
    const traySlot = target.closest<HTMLElement>("[data-tray-slot]");
    if (traySlot) this.#tapTray(Number(traySlot.dataset.traySlot));
  };

  #tapCell(cell: number): void {
    if (!this.#editable) return;
    const placement = this.#state.placement;
    const occupant = characterAt(placement, cell);
    if (occupant !== null) {
      // Tapping a character selects it (or unselects it), so it can be moved.
      this.#active = this.#active === occupant ? null : occupant;
      this.#render();
      return;
    }
    // An empty cell receives the selected character, or else the first one still off the board.
    const mover = this.#active ?? placement.findIndex((p) => p === null);
    if (mover === -1) {
      this.#showFlash(t().game.tapCharacterFirst);
      return;
    }
    this.#moveTo(mover, cell);
  }

  /** Moves a character to a cell, or explains why the golden rule forbids it. */
  #moveTo(character: number, cell: number): void {
    const blocker = blockerOf(this.#state.placement, character, cell);
    if (blocker !== null) {
      this.#showBlocked(cell, blocker);
      return;
    }
    this.#active = null;
    this.#apply((s) => place(s, character, cell));
  }

  /** The tapped cell shakes, the character that reserves its row or column hops, and the reason is shown. */
  #showBlocked(cell: number, blocker: number): void {
    const target = this.#cells[cell];
    const blockerCell = this.#state.placement[blocker];
    const hop = blockerCell === null ? null : this.#cells[blockerCell];
    for (const [element, name] of [[target, "is-denied"], [hop, "is-blocker"]] as const) {
      if (!element) continue;
      element.classList.remove(name);
      void element.offsetWidth; // Restart the animation.
      element.classList.add(name);
      setTimeout(() => element.classList.remove(name), 700);
    }
    this.#showFlash(t().game.cellLocked(blocker));
  }

  #tapTray(character: number): void {
    if (!this.#editable) return;
    if (this.#state.placement[character] !== null) {
      this.#active = null;
      this.#apply((s) => place(s, character, null));
      return;
    }
    this.#active = this.#active === character ? null : character;
    this.#render();
  }

  #onPointerDown = (event: PointerEvent): void => {
    this.#suppressClick = false;
    const target = event.target as Element;
    const card = target.closest<HTMLElement>("[data-card-id]");
    if (card && !target.closest("[data-zoom]")) {
      this.#startLongPress(event, card.dataset.cardId!);
      return;
    }
    const piece = target.closest<SVGElement>("[data-piece]");
    // One drag at a time: extra fingers are ignored (they used to leave a ghost image behind).
    if (!piece || !this.#editable || event.button !== 0 || !event.isPrimary || this.#drag) return;
    const character = Number(piece.dataset.piece);
    this.#drag = {
      character,
      fromBoard: this.#state.placement[character] !== null,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      ghost: null,
    };
    globalThis.addEventListener("pointermove", this.#onPointerMove);
    globalThis.addEventListener("pointerup", this.#onPointerUp);
    globalThis.addEventListener("pointercancel", this.#onPointerCancel);
  };

  #onPointerMove = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.ghost) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
      drag.ghost = h("div", { class: "drag-ghost", html: characterSvg(drag.character) });
      document.body.append(drag.ghost);
      this.root.classList.add("is-dragging");
      this.#active = drag.character;
      this.#render();
    }
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
    const over = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-cell]");
    for (const cell of this.#cells) cell.classList.toggle("is-hover", cell === over);
  };

  #onPointerUp = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.ghost) {
      const under = document.elementFromPoint(event.clientX, event.clientY);
      const cell = under?.closest<HTMLElement>("[data-cell]");
      // The click following this pointerup (if any) is dispatched before the timeout runs.
      this.#suppressClick = true;
      setTimeout(() => (this.#suppressClick = false), 0);
      this.#active = null;
      const target = cell ? Number(cell.dataset.cell) : null;
      const occupant = target === null ? null : characterAt(this.#state.placement, target);
      if (target === null) {
        if (drag.fromBoard) this.#apply((s) => place(s, drag.character, null));
        else this.#render();
      } else if (occupant === drag.character) {
        this.#render();
      } else if (occupant !== null) {
        this.#render();
        this.#showBlocked(target, occupant);
      } else {
        this.#moveTo(drag.character, target);
        this.#render();
      }
    }
    this.#endDrag();
  };

  #onPointerCancel = (): void => {
    this.#active = null;
    this.#endDrag();
    this.#render();
  };

  #endDrag(): void {
    this.#drag?.ghost?.remove();
    // Defensive: no ghost image may ever outlive a drag.
    for (const ghost of document.querySelectorAll(".drag-ghost")) ghost.remove();
    this.#drag = null;
    this.root?.classList.remove("is-dragging");
    for (const cell of this.#cells) cell.classList.remove("is-hover");
    globalThis.removeEventListener("pointermove", this.#onPointerMove);
    globalThis.removeEventListener("pointerup", this.#onPointerUp);
    globalThis.removeEventListener("pointercancel", this.#onPointerCancel);
  }

  #startLongPress(event: PointerEvent, cardId: string): void {
    clearTimeout(this.#longPress);
    const startX = event.clientX;
    const startY = event.clientY;
    const cancel = () => {
      clearTimeout(this.#longPress);
      globalThis.removeEventListener("pointerup", cancel);
      globalThis.removeEventListener("pointercancel", cancel);
      globalThis.removeEventListener("pointermove", onMove);
    };
    const onMove = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) cancel();
    };
    this.#longPress = setTimeout(() => {
      cancel();
      this.#suppressClick = true;
      this.#zoom(cardId);
    }, LONG_PRESS_MS);
    globalThis.addEventListener("pointerup", cancel);
    globalThis.addEventListener("pointercancel", cancel);
    globalThis.addEventListener("pointermove", onMove);
  }

  #zoom(cardId: string): void {
    cardZoomDialog(getCard(cardId), {
      selected: this.#state.selection.includes(cardId),
      canSelect: this.#editable,
      onToggle: () => this.#apply((s) => toggleCard(s, cardId)),
    });
  }

  async #askBid(forced: boolean): Promise<void> {
    if (this.#bidPending || this.#destroyed) return;
    this.#bidPending = true;
    const s = this.#state;
    const bid = await bidDialog({
      max: tableCards(s).length,
      preset: s.selection.length > 0 ? s.selection.length : null,
      forced,
    });
    this.#bidPending = false;
    if (this.#destroyed) return;
    if (bid !== null) this.#apply((state) => lockIn(state, bid));
    else if (this.#state.phase.name === "bidding") queueMicrotask(() => this.#askBid(true));
  }

  #runAction(action: string): void {
    const now = () => Date.now();
    const d = t().dialogs;
    switch (action) {
      case "exit":
        this.#callbacks.onExit();
        break;
      case "clear":
        this.#active = null;
        this.#apply((s) => clearSelection(clearBoard(s)));
        break;
      case "lock-in":
        void this.#askBid(false);
        break;
      case "forced-bid":
        void this.#askBid(true);
        break;
      case "demonstrate":
        this.#apply((s) => demonstrate(s, now()));
        break;
      case "check":
        this.#apply((s) => check(s, now()));
        break;
      case "give-up":
        void confirmDialog({
          title: d.giveUpTitle,
          message: d.giveUpMessage,
          confirm: d.giveUpConfirm,
          cancel: d.keepSearching,
        }).then((ok) => ok && this.#apply((s) => giveUp(s, now())));
        break;
      case "toggle-solution":
        this.#showSolution = !this.#showSolution;
        this.#render();
        break;
      case "reveal-board":
        this.#apply((s) => revealBoard(s));
        break;
      case "next-round":
        this.#apply((s) => nextRound(s, now()));
        break;
      case "continue":
        this.#options.continueButton?.onClick();
        break;
      case "results":
        this.#showGameOver(false);
        break;
    }
  }

  // -------------------------------------------------------------------------
  // End of game
  // -------------------------------------------------------------------------

  #showGameOver(justFinished: boolean): void {
    const o = t().over;
    const s = this.#state;
    const summary = summarize(s, Date.now());
    const { mode, deck } = s.config;
    const pro = s.config.pro === true;
    const records = justFinished ? addFinishedGame(mode, deck, pro, summary) : null;
    const rows: [string, string][] = [
      [o.rounds, String(summary.rounds)],
      [o.cardsWon, String(summary.cardsWon)],
      [mode === "classic" ? o.perfectBids : o.roundsWithoutMistakes, String(summary.perfectRounds)],
      mode === "classic"
        ? [o.voidDemonstrations, String(summary.failedRounds)]
        : [o.mistakes, String(summary.mistakes)],
      ...(mode === "practice" ? [[o.solutionsRevealed, String(summary.revealedRounds)] as [string, string]] : []),
      [o.time, formatDuration(summary.durationMs)],
    ];
    const badges = [
      records?.newBestRounds ? o.newBestRounds : null,
      records?.newBestTime ? o.newBestTime : null,
    ].filter((b): b is string => b !== null);
    const content = h(
      "div",
      { class: "dialog-body game-over" },
      h("h2", {}, o.title),
      h("p", {}, o.subtitle(mode, deck === "full", pro)),
      ...badges.map((b) => h("p", { class: "record-badge" }, b)),
      h("dl", { class: "summary" }, ...rows.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)])),
      h(
        "div",
        { class: "dialog-actions" },
        h("button", {
          type: "button",
          class: "btn btn-ghost",
          onclick: () => {
            dialog.close();
            this.#callbacks.onExit();
          },
        }, o.menu),
        this.#callbacks.onPlayAgain
          ? h("button", {
            type: "button",
            class: "btn btn-primary",
            onclick: () => {
              dialog.close();
              this.#callbacks.onPlayAgain?.(mode);
            },
          }, o.playAgain)
          : null,
      ),
    );
    const dialog = openDialog(content, { dismissable: true, label: o.title });
  }
}

function missingFor(target: number, count: number, placed: number): string | null {
  const m = t().game;
  if (placed < 3) return m.missingPlace(3 - placed);
  if (count < target) return m.missingSelect(target - count);
  if (count > target) return m.missingUnselect(count - target);
  return null;
}

function cardNodes(id: string): HTMLElement[] {
  const card = getCard(id);
  const caption = cardCaption(card);
  return [
    h(
      "button",
      {
        type: "button",
        class: "card",
        "data-card-id": card.id,
        "data-group": card.family.group,
        "aria-pressed": "false",
        "aria-label": t().game.cardLabel(card.number, caption),
        title: familyTitle(card),
      },
      h("span", { class: "card-number", "aria-hidden": "true" }, card.number),
      h("span", { class: "card-glyph", html: glyphSvg(card.glyph) }),
      h("span", { class: "card-text" }, caption),
      h("span", { class: "card-badge", "aria-hidden": "true" }),
    ),
    h("button", {
      type: "button",
      class: "card-zoom",
      "data-zoom": card.id,
      "aria-label": t().game.zoomLabel(card.number),
      html: ICONS.zoom,
    }),
  ];
}
