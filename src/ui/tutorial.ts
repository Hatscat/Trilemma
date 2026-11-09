/**
 * Interactive tutorial: three short lessons played on the real game screen, with fixed tables
 * (src/core/lessons.ts) and a coach banner. Info steps wait for "Next"; action steps complete
 * as soon as the player has done what is asked. Nothing is saved.
 */

import { cellRow } from "../core/board.ts";
import { type GameState, newScriptedGame } from "../core/game.ts";
import { type LessonId, LESSONS } from "../core/lessons.ts";
import { t } from "../i18n/index.ts";
import type { TutorialStepTexts } from "../i18n/types.ts";
import { h } from "./dom.ts";
import { GameView, type ViewEvent } from "./game-view.ts";

/**
 * Parts of the game screen that can be highlighted (see `[data-coach]` in styles.css). One thing at a time: a steady
 * outline for what the coach talks about, a pulse only for the button to press.
 */
type Highlight = "tray" | "board" | "first-card" | "second-card" | "check" | "demonstrate";

interface Step {
  readonly text: keyof TutorialStepTexts;
  readonly highlight?: readonly Highlight[];
  /** Action steps complete when this returns true; steps without it wait for "Next". */
  readonly done?: (state: GameState, events: ReadonlySet<ViewEvent>) => boolean;
}

interface LessonScript {
  readonly steps: readonly Step[];
  readonly doneText: keyof TutorialStepTexts;
  /** Shown after a void demonstration; the lesson then resumes at step `retryFrom`. */
  readonly retryText?: keyof TutorialStepTexts;
  readonly retryFrom?: number;
}

const allPlaced = (s: GameState) => s.placement.every((cell) => cell !== null);
const won = (s: GameState) => s.phase.name === "result" && s.phase.result.outcome === "won";

const SCRIPTS: Record<LessonId, LessonScript> = {
  board: {
    steps: [
      { text: "meet", highlight: ["tray"] },
      { text: "board", highlight: ["board"] },
      { text: "place", highlight: ["tray"], done: allPlaced },
      {
        text: "starRow1",
        highlight: ["first-card"],
        done: (s) => s.placement[0] !== null && cellRow(s.placement[0]) === 0,
      },
      { text: "allThree", highlight: ["check"], done: won },
    ],
    doneText: "boardDone",
  },
  contradictions: {
    steps: [
      { text: "contradiction", highlight: ["first-card", "second-card"] },
      { text: "largest", highlight: ["check"], done: won },
    ],
    doneText: "contradictionsDone",
  },
  classic: {
    steps: [
      { text: "classicIntro" },
      // No highlight: "Lock in" already pulses during a classic search.
      { text: "lockIn", done: (s) => s.phase.name !== "search" },
      { text: "prove", highlight: ["demonstrate"], done: won },
    ],
    doneText: "classicDone",
    retryText: "retry",
    retryFrom: 1,
  },
};

export interface TutorialCallbacks {
  readonly onExit: () => void;
  readonly onFinish: () => void;
}

export class Tutorial {
  readonly root = h("div", { class: "tutorial" });
  #callbacks: TutorialCallbacks;
  #lesson = 0;
  #step = 0;
  #retrying = false;
  #events = new Set<ViewEvent>();
  #banner = h("section", { class: "coach", "aria-live": "polite" });
  #view: GameView | null = null;

  constructor(callbacks: TutorialCallbacks) {
    this.#callbacks = callbacks;
    this.#startLesson(0);
  }

  destroy(): void {
    this.#view?.destroy();
  }

  get #script(): LessonScript {
    return SCRIPTS[LESSONS[this.#lesson].id];
  }

  #startLesson(index: number): void {
    this.#view?.destroy();
    this.#lesson = index;
    this.#step = 0;
    this.#retrying = false;
    this.#events = new Set();
    const lesson = LESSONS[index];
    const last = index === LESSONS.length - 1;
    const state = newScriptedGame(
      { mode: lesson.mode, deck: "base", timerSeconds: null, seed: 0, pro: false },
      lesson.cards,
      Date.now(),
    );
    this.#view = new GameView(state, {
      onExit: this.#callbacks.onExit,
      onChange: (s) => this.#update(s),
      onEvent: (event) => {
        this.#events.add(event);
        this.#update(this.#view!.state);
      },
    }, {
      title: t().game.modeName("tutorial"),
      subtitle: () => t().tutorial.lesson(index + 1, LESSONS.length, lesson.id),
      banner: this.#banner,
      continueButton: {
        label: () => (last ? t().tutorial.finish : t().tutorial.continue),
        onClick: () => (last ? this.#callbacks.onFinish() : this.#startLesson(index + 1)),
      },
      hiddenActions: ["give-up"],
      className: "is-tutorial",
    });
    this.root.replaceChildren(this.#view.root);
    globalThis.scrollTo?.(0, 0);
    this.#update(state);
  }

  #update(state: GameState): void {
    // Wait until the demonstration cards are revealed ("revealed" event) before commenting the result.
    if (this.#view?.busy) return;
    const script = this.#script;
    const failed = state.phase.name === "result" && state.phase.result.outcome === "failed";
    if (failed) this.#retrying = true;
    else if (this.#retrying && state.phase.name === "search") {
      this.#retrying = false;
      this.#step = script.retryFrom ?? 0;
    }
    if (!this.#retrying) {
      while (this.#step < script.steps.length) {
        const step = script.steps[this.#step];
        if (!step.done?.(state, this.#events)) break;
        this.#step++;
      }
    }
    this.#renderBanner();
  }

  #renderBanner(): void {
    const m = t().tutorial;
    const script = this.#script;
    const step = this.#retrying ? null : script.steps[this.#step] ?? null;
    const textKey = this.#retrying ? script.retryText ?? script.doneText : step?.text ?? script.doneText;
    const waitsForNext = step !== null && step.done === undefined;
    this.#banner.dataset.step = textKey;
    const next = waitsForNext
      ? h("button", {
        type: "button",
        class: "btn btn-primary",
        "data-coach-next": "",
        onclick: () => {
          this.#step++;
          this.#update(this.#view!.state);
        },
      }, m.next)
      : null;
    this.#banner.replaceChildren(h("p", { class: "coach-text" }, m.steps[textKey]), ...(next ? [next] : []));
    this.#view!.root.dataset.coach = (step?.highlight ?? []).join(" ");
  }
}
