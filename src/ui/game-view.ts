/**
 * Game screen: board, character tray, face-up cards and the action bar.
 * The view keeps references to its DOM nodes and updates them on every state change.
 */

import {
  ARRANGEMENTS,
  arrangementToPlacement,
  CELL_COUNT,
  cellCol,
  cellLabel,
  cellRow,
  characterAt,
  CHARACTERS,
  isDark,
  type Placement,
} from "../core/board.ts";
import { getCard } from "../core/cards.ts";
import {
  check,
  clearBoard,
  clearSelection,
  demonstrate,
  expireTimer,
  GameError,
  type GameState,
  giveUp,
  lockIn,
  type Mode,
  nextRound,
  place,
  remainingMs,
  type RoundResult,
  shiftTime,
  summarize,
  TABLE_SIZE,
  tableCards,
  toggleCard,
} from "../core/game.ts";
import { bidDialog, cardZoomDialog, closeAllDialogs, confirmDialog, openDialog } from "./dialogs.ts";
import { formatClock, formatDuration, h, ICONS, prefersReducedMotion } from "./dom.ts";
import { glyphSvg } from "./glyph.ts";
import { characterSvg } from "./sprite.ts";
import { addFinishedGame } from "./storage.ts";

export interface GameViewCallbacks {
  /** Back to the menu. */
  readonly onExit: () => void;
  /** Called after every state change (persistence). */
  readonly onChange: (state: GameState) => void;
  /** Starts a new game with the same settings. */
  readonly onPlayAgain: (mode: Mode) => void;
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
  #roundLabel = h("span", { class: "round" });
  #stats = h("span", { class: "stats" });
  #clock = h("span", { class: "clock", role: "timer", "aria-live": "off" });
  #board = h("div", { class: "board-cells", role: "group", "aria-label": "Board" });
  #tray = h("div", { class: "tray", "data-tray": "", role: "group", "aria-label": "Characters off the board" });
  #cards = h("div", { class: "cards", role: "group", "aria-label": "Rule cards" });
  #actions = h("footer", { class: "action-bar" });
  #cells: HTMLButtonElement[] = [];
  #traySlots: HTMLButtonElement[] = [];
  #slots: HTMLElement[] = [];

  constructor(state: GameState, callbacks: GameViewCallbacks) {
    this.#state = state;
    this.#callbacks = callbacks;
    this.root = this.#build();
    this.#render();
    this.#firstRender = false;
    this.#clockTimer = setInterval(this.#tick, 250);
    this.#tick();
    document.addEventListener("visibilitychange", this.#onVisibility);
    if (state.phase.name === "bidding") queueMicrotask(() => this.#askBid(true));
    if (state.phase.name === "over") queueMicrotask(() => this.#showGameOver(false));
  }

  destroy(): void {
    this.#destroyed = true;
    clearInterval(this.#clockTimer);
    clearInterval(this.#animationTimer);
    clearTimeout(this.#flashTimer);
    clearTimeout(this.#longPress);
    this.#endDrag();
    document.removeEventListener("visibilitychange", this.#onVisibility);
    closeAllDialogs();
  }

  // -------------------------------------------------------------------------
  // Building
  // -------------------------------------------------------------------------

  #build(): HTMLElement {
    const mode = this.#state.config.mode;
    this.#header.append(
      h("button", {
        type: "button",
        class: "icon-btn",
        "data-action": "exit",
        "aria-label": "Back to the menu",
        html: ICONS.back,
      }),
      h(
        "div",
        { class: "game-title" },
        h("strong", {}, mode === "classic" ? "Classic" : "Challenge"),
        this.#roundLabel,
      ),
      this.#stats,
      this.#clock,
    );

    const colLabels = [0, 1, 2].map((c) => h("span", { class: "label col-label" }, "ABC"[c]));
    const rowLabels = [0, 1, 2].map((r) => h("span", { class: "label row-label" }, String(r + 1)));
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
      { class: `screen game mode-${mode}` },
      this.#header,
      h("section", { class: "play-area" }, h("div", { class: "board-zone" }, board, this.#tray), this.#cards),
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
        this.#showFlash(error.message);
        return false;
      }
      throw error;
    }
    const previous = this.#state;
    this.#state = next;
    this.#callbacks.onChange(next);
    this.#onTransition(previous, next);
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
      if (this.#revealed >= result.checks.length) {
        clearInterval(this.#animationTimer);
        this.#revealed = Number.POSITIVE_INFINITY;
      }
      this.#render();
    }, CHECK_REVEAL_MS);
  }

  get #animating(): boolean {
    return Number.isFinite(this.#revealed);
  }

  get #editable(): boolean {
    const phase = this.#state.phase.name;
    return (phase === "search" || phase === "demonstrate") && !this.#animating;
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
    this.#renderBoard();
    this.#renderTray();
    this.#renderCards();
    this.#renderActions();
  }

  #renderHeader(): void {
    const s = this.#state;
    this.#roundLabel.textContent = s.phase.name === "over" ? "Game over" : `Round ${s.round}`;
    const parts = [`Pile ${s.pile.length}`, `Won ${s.won.length}`];
    if (s.config.mode === "challenge") {
      const ongoing = s.phase.name === "search" ? s.roundMistakes : 0;
      parts.push(`Mistakes ${s.history.reduce((n, r) => n + r.mistakes, 0) + ongoing}`);
    }
    // Each part stays on one line; the header wraps between parts on narrow screens.
    this.#stats.replaceChildren(
      ...parts.flatMap((part, i) => [i > 0 ? " · " : "", h("span", { class: "nowrap" }, part)]),
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
    const placement = this.#shownPlacement();
    const editable = this.#editable;
    const active = editable ? this.#active : null;
    const activeCell = active === null ? null : placement[active];
    this.#board.classList.toggle("is-solution", this.#showSolution);
    this.#board.classList.toggle("is-locked", !editable);
    for (const [cell, button] of this.#cells.entries()) {
      const occupant = characterAt(placement, cell);
      if (button.dataset.occupant !== String(occupant)) {
        button.dataset.occupant = String(occupant);
        button.innerHTML = occupant === null ? "" : characterSvg(occupant, "piece");
        if (occupant !== null) button.querySelector("svg")!.dataset.piece = String(occupant);
      }
      const row = cellRow(cell);
      const col = cellCol(cell);
      let target = false;
      let conflict = false;
      if (active !== null && occupant !== active) {
        conflict = placement.some((other, c) =>
          c !== active && other !== null && (cellRow(other) === row || cellCol(other) === col)
        );
        target = !conflict;
      }
      button.classList.toggle("is-target", target);
      button.classList.toggle("is-conflict", conflict);
      button.classList.toggle("is-active", occupant !== null && occupant === active && activeCell === cell);
      button.classList.toggle("has-piece", occupant !== null);
      const shade = isDark(row, col) ? "dark" : "light";
      const who = occupant === null ? "empty" : `the ${CHARACTERS[occupant].name}`;
      button.setAttribute("aria-label", `Cell ${cellLabel(row, col)}, ${shade}, ${who}`);
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
      slot.setAttribute(
        "aria-label",
        offBoard ? `The ${CHARACTERS[c].name}, off the board` : `Send the ${CHARACTERS[c].name} back here`,
      );
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
      const checkIndex = revealedChecks.findIndex((c) => c.id === id);
      const checked = checkIndex === -1 ? null : revealedChecks[checkIndex];
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
    const key = JSON.stringify(view);
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
        ...view.buttons.map((b) =>
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
    const s = this.#state;
    const { phase } = s;
    const count = s.selection.length;
    const placed = s.placement.filter((p) => p !== null).length;
    const hasWork = placed > 0 || count > 0;
    const clear: ButtonSpec = { label: "Clear", action: "clear", disabled: !hasWork };
    const flash = this.#flash;

    if (this.#animating) return { status: "Checking the cards…", buttons: [] };

    switch (phase.name) {
      case "search": {
        if (s.config.mode === "classic") {
          return {
            status: flash ?? "Find the largest group of cards that can all be true at once.",
            detail: `${count} card${count === 1 ? "" : "s"} selected · ${placed}/3 characters placed`,
            tone: flash ? "bad" : "info",
            buttons: [clear, { label: "Lock in", action: "lock-in", primary: true }],
          };
        }
        const missing = missingFor(s.target, count, placed);
        const falseCard = phase.feedback ? getCard(phase.feedback.falseCard) : null;
        return {
          status: flash ??
            (falseCard
              ? `Card ${falseCard.number} is false for this arrangement. Try again!`
              : `Find ${s.target} cards that can all be true at once.`),
          detail: `${count}/${s.target} selected${missing ? ` · ${missing}` : ""}`,
          tone: flash || falseCard ? "bad" : "info",
          buttons: [
            { label: "Give up", action: "give-up" },
            { label: "Check", action: "check", primary: true, disabled: missing !== null },
          ],
        };
      }
      case "bidding":
        return {
          status: "Time's up! Lock in your bid.",
          tone: "bad",
          buttons: [{ label: "Lock in", action: "forced-bid", primary: true }],
        };
      case "demonstrate": {
        const missing = missingFor(phase.bid, count, placed);
        return {
          status: flash ?? `Bid: ${phase.bid}. Place the characters and select exactly ${phase.bid} cards.`,
          detail: `${count}/${phase.bid} selected${missing ? ` · ${missing}` : ""}`,
          tone: flash ? "bad" : "info",
          buttons: [clear, { label: "Demonstrate", action: "demonstrate", primary: true, disabled: missing !== null }],
        };
      }
      case "result":
        return this.#resultView(phase.result);
      case "over":
        return {
          status: "Deck cleared!",
          tone: "ok",
          buttons: [{ label: "See results", action: "results", primary: true }],
        };
    }
  }

  #resultView(result: RoundResult): ActionView {
    const s = this.#state;
    const lastRound = s.pile.length === 0 && tableCards(s).length === result.removed.length;
    const next: ButtonSpec = { label: lastRound ? "See results" : "Next round", action: "next-round", primary: true };
    const toggle: ButtonSpec = {
      label: this.#showSolution ? "My arrangement" : "Best group",
      action: "toggle-solution",
    };
    const best = `Best possible: ${result.max} card${result.max === 1 ? "" : "s"}.`;
    switch (result.outcome) {
      case "won": {
        if (result.bid === null) {
          const mistakes = result.mistakes === 0
            ? "No mistakes!"
            : `${result.mistakes} mistake${result.mistakes === 1 ? "" : "s"}.`;
          return {
            status: `Well done! +${result.removed.length} cards.`,
            detail: `${mistakes} Found in ${formatDuration(result.durationMs)}.`,
            tone: "ok",
            buttons: [next],
          };
        }
        const perfect = result.bid === result.max;
        return {
          status: `Valid demonstration! +${result.bid} card${result.bid === 1 ? "" : "s"}.`,
          detail: perfect ? "Perfect: that was the largest group." : best,
          tone: "ok",
          buttons: perfect ? [next] : [toggle, next],
        };
      }
      case "failed": {
        const falseCheck = result.checks.find((c) => !c.ok);
        const reason = falseCheck ? `Card ${getCard(falseCheck.id).number} is false.` : "Incomplete demonstration.";
        return {
          status: `${reason} Nobody scores.`,
          detail: `${best} The same cards stay.`,
          tone: "bad",
          buttons: [toggle, next],
        };
      }
      case "revealed":
        return {
          status: `Here is a group of ${result.max} compatible cards.`,
          detail: "These cards are discarded.",
          tone: "info",
          buttons: [next],
        };
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
    } else if (s.config.mode === "challenge" && s.phase.name === "search") {
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
    if (this.#active !== null) {
      const active = this.#active;
      this.#active = null;
      if (occupant === active) this.#render();
      else this.#apply((s) => place(s, active, cell));
    } else if (occupant !== null) {
      this.#active = occupant;
      this.#render();
    } else {
      // Shortcut: an empty cell receives the first character still off the board.
      const next = placement.findIndex((p) => p === null);
      if (next !== -1) this.#apply((s) => place(s, next, cell));
    }
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
    if (!piece || !this.#editable || event.button !== 0) return;
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
      if (cell) this.#apply((s) => place(s, drag.character, Number(cell.dataset.cell)));
      else if (drag.fromBoard) this.#apply((s) => place(s, drag.character, null));
      else this.#render();
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
          title: "Give up this round?",
          message: "A solution will be shown and its cards will be discarded.",
          confirm: "Show a solution",
          cancel: "Keep searching",
        }).then((ok) => ok && this.#apply((s) => giveUp(s, now())));
        break;
      case "toggle-solution":
        this.#showSolution = !this.#showSolution;
        this.#render();
        break;
      case "next-round":
        this.#apply((s) => nextRound(s, now()));
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
    const s = this.#state;
    const summary = summarize(s, Date.now());
    const { mode, deck } = s.config;
    const records = justFinished ? addFinishedGame(mode, deck, summary) : null;
    const rows: [string, string][] = [
      ["Rounds", String(summary.rounds)],
      ["Cards won", `${summary.cardsWon}`],
      [mode === "classic" ? "Perfect bids" : "Rounds without mistakes", String(summary.perfectRounds)],
      mode === "classic"
        ? ["Void demonstrations", String(summary.failedRounds)]
        : ["Mistakes", String(summary.mistakes)],
      ...(mode === "challenge" ? [["Solutions revealed", String(summary.revealedRounds)] as [string, string]] : []),
      ["Time", formatDuration(summary.durationMs)],
    ];
    const badges = [
      records?.newBestRounds ? "New record: fewest rounds!" : null,
      records?.newBestTime ? "New record: fastest game!" : null,
    ].filter((b): b is string => b !== null);
    const content = h(
      "div",
      { class: "dialog-body game-over" },
      h("h2", {}, "Deck cleared!"),
      h(
        "p",
        {},
        `${mode === "classic" ? "Classic" : "Challenge"} · ${deck === "base" ? "Base deck" : "Full deck"}`,
      ),
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
        }, "Menu"),
        h("button", {
          type: "button",
          class: "btn btn-primary",
          onclick: () => {
            dialog.close();
            this.#callbacks.onPlayAgain(mode);
          },
        }, "Play again"),
      ),
    );
    const dialog = openDialog(content, { dismissable: true, label: "Game over" });
  }
}

function missingFor(target: number, count: number, placed: number): string | null {
  if (placed < 3) return `place ${3 - placed} more character${placed === 2 ? "" : "s"}`;
  if (count < target) return `select ${target - count} more`;
  if (count > target) return `unselect ${count - target}`;
  return null;
}

function cardNodes(id: string): HTMLElement[] {
  const card = getCard(id);
  return [
    h(
      "button",
      {
        type: "button",
        class: "card",
        "data-card-id": card.id,
        "data-group": card.family.group,
        "aria-pressed": "false",
        "aria-label": `Card ${card.number}: ${card.text}`,
      },
      h("span", { class: "card-number", "aria-hidden": "true" }, card.number),
      h("span", { class: "card-glyph", html: glyphSvg(card.glyph) }),
      h("span", { class: "card-text" }, card.text),
      h("span", { class: "card-badge", "aria-hidden": "true" }),
    ),
    h("button", {
      type: "button",
      class: "card-zoom",
      "data-zoom": card.id,
      "aria-label": `Zoom on card ${card.number}`,
      html: ICONS.zoom,
    }),
  ];
}
