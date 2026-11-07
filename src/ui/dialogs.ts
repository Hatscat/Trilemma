/** Modal dialogs built on the native <dialog> element. */

import type { Card } from "../core/cards.ts";
import { cardCaption, familyTitle, t } from "../i18n/index.ts";
import { h } from "./dom.ts";
import { glyphSvg } from "./glyph.ts";

interface DialogOptions {
  /** When false, Escape and backdrop clicks do not close the dialog. */
  readonly dismissable: boolean;
  readonly className?: string;
  readonly label: string;
}

/** Opens a modal dialog; it is removed from the DOM when closed. */
export function openDialog(content: HTMLElement, options: DialogOptions): HTMLDialogElement {
  const dialog = h("dialog", { class: `sheet ${options.className ?? ""}`, "aria-label": options.label }, content);
  dialog.addEventListener("cancel", (event) => {
    if (!options.dismissable) event.preventDefault();
  });
  dialog.addEventListener("click", (event) => {
    if (options.dismissable && event.target === dialog) dialog.close("dismiss");
  });
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

export function closeAllDialogs(): void {
  for (const dialog of document.querySelectorAll("dialog")) dialog.close("dismiss");
}

/** Asks for a bid between 1 and `max`. Resolves to `null` when the player keeps searching. */
export function bidDialog(options: { max: number; preset: number | null; forced: boolean }): Promise<number | null> {
  const d = t().dialogs;
  return new Promise((resolve) => {
    let chosen = options.preset !== null && options.preset >= 1 && options.preset <= options.max
      ? options.preset
      : null;
    const confirm = h("button", { type: "button", class: "btn btn-primary", "data-action": "confirm-bid" }, d.lockIn);
    const numbers = Array.from({ length: options.max }, (_, i) => i + 1).map((n) =>
      h("button", {
        type: "button",
        class: "bid-option",
        "data-bid": n,
        "aria-pressed": String(n === chosen),
        onclick: () => select(n),
      }, n)
    );
    const select = (n: number) => {
      chosen = n;
      for (const b of numbers) b.setAttribute("aria-pressed", String(Number(b.dataset.bid) === n));
      confirm.disabled = false;
    };
    confirm.disabled = chosen === null;
    const content = h(
      "div",
      { class: "dialog-body" },
      h("h2", {}, options.forced ? d.timesUpTitle : d.bidTitle),
      h("p", {}, d.bidText),
      h("div", { class: "bid-grid", role: "group", "aria-label": d.bidLabel }, ...numbers),
      h(
        "div",
        { class: "dialog-actions" },
        options.forced ? null : h("button", {
          type: "button",
          class: "btn btn-ghost",
          onclick: () => dialog.close("cancel"),
        }, d.keepSearching),
        confirm,
      ),
    );
    const dialog = openDialog(content, { dismissable: !options.forced, className: "bid-dialog", label: d.bidTitle });
    confirm.addEventListener("click", () => dialog.close("ok"));
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok" ? chosen : null));
  });
}

export function confirmDialog(options: { title: string; message: string; confirm: string; cancel: string }) {
  return new Promise<boolean>((resolve) => {
    const content = h(
      "div",
      { class: "dialog-body" },
      h("h2", {}, options.title),
      h("p", {}, options.message),
      h(
        "div",
        { class: "dialog-actions" },
        h("button", { type: "button", class: "btn btn-ghost", onclick: () => dialog.close("cancel") }, options.cancel),
        h("button", { type: "button", class: "btn btn-primary", onclick: () => dialog.close("ok") }, options.confirm),
      ),
    );
    const dialog = openDialog(content, { dismissable: true, label: options.title });
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"));
  });
}

/** Large view of a card, so the caption is easy to read. */
export function cardZoomDialog(
  card: Card,
  options: { selected: boolean; canSelect: boolean; onToggle: () => void },
): void {
  const d = t().dialogs;
  const toggle = options.canSelect
    ? h("button", {
      type: "button",
      class: "btn btn-primary",
      onclick: () => {
        options.onToggle();
        dialog.close();
      },
    }, options.selected ? d.unselect : d.select)
    : null;
  const meta = d.cardMeta(card.number, familyTitle(card));
  const content = h(
    "div",
    { class: "dialog-body zoom" },
    h(
      "div",
      { class: "zoom-card", "data-group": card.family.group },
      h("div", { class: "zoom-meta" }, meta),
      h("div", { class: "zoom-glyph", html: glyphSvg(card.glyph) }),
      h("p", { class: "zoom-text" }, cardCaption(card)),
    ),
    h(
      "div",
      { class: "dialog-actions" },
      h("button", { type: "button", class: "btn btn-ghost", onclick: () => dialog.close() }, d.close),
      toggle,
    ),
  );
  const dialog = openDialog(content, { dismissable: true, className: "zoom-dialog", label: meta });
}
