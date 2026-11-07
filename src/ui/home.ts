/** Home screen: mode choice, tutorial, settings (language, deck, timer), resume and records. */

import type { DeckChoice } from "../core/cards.ts";
import type { GameState, Mode } from "../core/game.ts";
import { type Lang, LANGS, MESSAGES, t } from "../i18n/index.ts";
import { formatDuration, h, ICONS } from "./dom.ts";
import { install, installOption } from "./install.ts";
import { characterSvg } from "./sprite.ts";
import { loadRecords, recordKey, type Settings, TIMER_CHOICES } from "./storage.ts";

export interface HomeCallbacks {
  readonly onStart: (mode: Mode) => void;
  readonly onResume: () => void;
  readonly onTutorial: () => void;
  readonly onSettingsChange: (settings: Settings) => void;
}

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
            value: String(option.value),
            checked: option.value === current,
            onchange: () => onChange(option.value),
          }),
          h("label", { for: id }, option.label),
        );
      }),
    ),
  );
}

export function renderHome(
  settings: Settings,
  lang: Lang,
  saved: GameState | null,
  callbacks: HomeCallbacks,
): HTMLElement {
  const m = t();
  let current = settings;
  const update = (patch: Partial<Settings>) => {
    current = { ...current, ...patch };
    callbacks.onSettingsChange(current);
    renderRecords();
  };

  const records = h("section", { class: "records", "aria-label": m.home.records(current.deck === "full") });
  const renderRecords = () => {
    const all = loadRecords();
    const lines = (["classic", "practice"] as const).flatMap((mode) => {
      const r = all[recordKey(mode, current.deck)];
      if (!r || r.played === 0) return [];
      const best = [
        r.bestRounds !== null ? m.home.rounds(r.bestRounds) : null,
        r.bestTimeMs !== null ? formatDuration(r.bestTimeMs) : null,
      ].filter(Boolean).join(" · ");
      return [h("li", {}, h("strong", {}, m.game.modeName(mode)), m.home.recordLine(best || "—", r.played))];
    });
    records.replaceChildren(
      ...(lines.length > 0 ? [h("h2", {}, m.home.records(current.deck === "full")), h("ul", {}, ...lines)] : []),
    );
  };
  renderRecords();

  const resume = saved && saved.phase.name !== "over"
    ? h(
      "button",
      { type: "button", class: "resume", "data-action": "resume", onclick: callbacks.onResume },
      h("strong", {}, m.home.resume),
      h("span", {}, m.home.resumeDetail(saved.config.mode, saved.round, saved.won.length)),
    )
    : null;

  const modeCard = (mode: Mode, text: string) =>
    h(
      "button",
      { type: "button", class: "mode-card", "data-mode": mode, onclick: () => callbacks.onStart(mode) },
      h("strong", {}, m.game.modeName(mode)),
      h("span", {}, text),
    );
  const tutorialCard = h(
    "button",
    { type: "button", class: "mode-card tutorial-card", "data-mode": "tutorial", onclick: callbacks.onTutorial },
    h("strong", {}, m.home.tutorialTitle),
    h("span", {}, m.home.tutorialText),
  );

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
      h("p", { class: "tagline" }, m.home.tagline),
    ),
    resume,
    h(
      "nav",
      { class: "modes", "aria-label": m.home.newGameConfirm },
      current.tutorialDone ? null : tutorialCard,
      modeCard("classic", m.home.classicText),
      modeCard("practice", m.home.practiceText),
    ),
    // Shown only when the app can be installed from this browser (see install.ts).
    h(
      "button",
      {
        type: "button",
        class: "install-card",
        "data-install": "",
        hidden: installOption() === null,
        onclick: () => void install(),
      },
      h("span", { class: "install-icon", html: ICONS.install }),
      h("span", { class: "install-texts" }, h("strong", {}, m.install.title), h("span", {}, m.install.text)),
    ),
    h(
      "section",
      { class: "settings", "aria-label": m.home.language },
      segmented<Lang>(
        "lang",
        m.home.language,
        LANGS.map((value) => ({ value, label: MESSAGES[value].languageName })),
        lang,
        (value) => update({ lang: value }),
      ),
      segmented<DeckChoice>(
        "deck",
        m.home.deck,
        [{ value: "base", label: m.home.deckBase }, { value: "full", label: m.home.deckFull }],
        current.deck,
        (deck) => update({ deck }),
      ),
      segmented<number | null>(
        "timer",
        m.home.timer,
        TIMER_CHOICES.map((value) => ({
          value,
          label: value === null ? m.home.timerOff : m.home.timerMinutes(value / 60),
        })),
        current.timerSeconds,
        (timerSeconds) => update({ timerSeconds }),
      ),
    ),
    h(
      "div",
      { class: "home-links" },
      h("a", { class: "btn btn-ghost", href: "#/rules" }, m.home.howToPlay),
      current.tutorialDone
        ? h("button", { type: "button", class: "btn btn-ghost", onclick: callbacks.onTutorial }, m.home.tutorialTitle)
        : null,
    ),
    records,
  );
}
