/** Current language and access to the translations. */

import type { Card } from "../core/cards.ts";
import { en } from "./en.ts";
import { es } from "./es.ts";
import { fr } from "./fr.ts";
import type { Lang, Messages } from "./types.ts";

export type { Lang, Messages } from "./types.ts";

export const MESSAGES: Readonly<Record<Lang, Messages>> = { en, fr, es };
export const LANGS: readonly Lang[] = ["en", "fr", "es"];

let current: Messages = en;

/** Messages of the current language. Call it at render time, not at module load. */
export function t(): Messages {
  return current;
}

export function setLanguage(lang: Lang): void {
  current = MESSAGES[lang];
  if (globalThis.document) document.documentElement.lang = lang;
}

/** First supported language in the user's preferences, English otherwise. */
export function detectLanguage(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if ((LANGS as readonly string[]).includes(base)) return base as Lang;
  }
  return "en";
}

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

export function cardCaption(card: Card): string {
  return current.cardCaption(card.glyph);
}

export function familyTitle(card: Card): string {
  return current.familyTitle(card.family.key);
}
