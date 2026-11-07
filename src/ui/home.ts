/** Home screen: mode choice, settings, resume and records. */

import type { DeckChoice } from "../core/cards.ts";
import type { GameState, Mode } from "../core/game.ts";
import { formatDuration, h } from "./dom.ts";
import { characterSvg } from "./sprite.ts";
import { loadRecords, recordKey, type Settings, TIMER_CHOICES } from "./storage.ts";

export interface HomeCallbacks {
  readonly onStart: (mode: Mode) => void;
  readonly onResume: () => void;
  readonly onSettingsChange: (settings: Settings) => void;
}

const MODES: readonly { mode: Mode; title: string; text: string }[] = [
  {
    mode: "classic",
    title: "Classic",
    text: "Bid the size of the largest compatible group, then prove it. All or nothing!",
  },
  {
    mode: "challenge",
    title: "Challenge",
    text: "The target is announced each round: find a group of cards that reaches it.",
  },
];

function segmented<T>(
  name: string,
  legend: string,
  options: readonly { value: T; label: string }[],
  current: T,
  onChange: (value: T) => void,
): HTMLElement {
  return h(
    "fieldset",
    { class: "segmented" },
    h("legend", {}, legend),
    h(
      "div",
      { class: "segmented-options" },
      ...options.map((option, i) => {
        const id = `${name}-${i}`;
        return h(
          "span",
          { class: "segmented-option" },
          h("input", {
            type: "radio",
            id,
            name,
            checked: option.value === current,
            onchange: () => onChange(option.value),
          }),
          h("label", { for: id }, option.label),
        );
      }),
    ),
  );
}

export function renderHome(settings: Settings, saved: GameState | null, callbacks: HomeCallbacks): HTMLElement {
  let current = settings;
  const update = (patch: Partial<Settings>) => {
    current = { ...current, ...patch };
    callbacks.onSettingsChange(current);
    renderRecords();
  };

  const records = h("section", { class: "records", "aria-label": "Your records" });
  const renderRecords = () => {
    const all = loadRecords();
    const lines = MODES.flatMap(({ mode, title }) => {
      const r = all[recordKey(mode, current.deck)];
      if (!r || r.played === 0) return [];
      const best = [
        r.bestRounds !== null ? `${r.bestRounds} rounds` : null,
        r.bestTimeMs !== null ? formatDuration(r.bestTimeMs) : null,
      ].filter(Boolean).join(" · ");
      return [h("li", {}, h("strong", {}, title), ` best: ${best || "—"} (${r.played} played)`)];
    });
    records.replaceChildren(
      ...(lines.length > 0
        ? [h("h2", {}, `Records · ${current.deck === "base" ? "base deck" : "full deck"}`), h("ul", {}, ...lines)]
        : []),
    );
  };
  renderRecords();

  const resume = saved && saved.phase.name !== "over"
    ? h(
      "button",
      { type: "button", class: "resume", "data-action": "resume", onclick: callbacks.onResume },
      h("strong", {}, "Resume"),
      h(
        "span",
        {},
        `${
          saved.config.mode === "classic" ? "Classic" : "Challenge"
        } · round ${saved.round} · ${saved.won.length} cards won`,
      ),
    )
    : null;

  return h(
    "main",
    { class: "screen home" },
    h(
      "header",
      { class: "logo" },
      h(
        "div",
        { class: "logo-characters", "aria-hidden": "true" },
        ...[0, 1, 2].map((c) => h("span", { class: `logo-character c${c}`, html: characterSvg(c) })),
      ),
      h("h1", {}, "Trilemma"),
      h("p", { class: "tagline" }, "Three characters. Nine cells. Too many rules."),
    ),
    resume,
    h(
      "nav",
      { class: "modes", "aria-label": "New game" },
      ...MODES.map(({ mode, title, text }) =>
        h(
          "button",
          { type: "button", class: "mode-card", "data-mode": mode, onclick: () => callbacks.onStart(mode) },
          h("strong", {}, title),
          h("span", {}, text),
        )
      ),
    ),
    h(
      "section",
      { class: "settings", "aria-label": "Settings" },
      segmented<DeckChoice>(
        "deck",
        "Deck",
        [{ value: "base", label: "Base · 55" }, { value: "full", label: "Full · 91" }],
        current.deck,
        (deck) => update({ deck }),
      ),
      segmented<number | null>(
        "timer",
        "Classic timer",
        TIMER_CHOICES.map((value) => ({ value, label: value === null ? "Off" : `${value / 60} min` })),
        current.timerSeconds,
        (timerSeconds) => update({ timerSeconds }),
      ),
    ),
    h("a", { class: "btn btn-ghost rules-link", href: "#/rules" }, "How to play"),
    records,
  );
}
