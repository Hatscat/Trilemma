/**
 * Browser selection for Playwright.
 * By default the locally installed Google Chrome is used (no download needed).
 * Set E2E_BROWSER=bundled to use Playwright's own Chromium instead
 * (install it once with: deno run -A npm:playwright@1.65.0 install chromium).
 */

import type { LaunchOptions } from "playwright";

export function launchOptions(): LaunchOptions {
  const choice = Deno.env.get("E2E_BROWSER") ?? "chrome";
  return choice === "bundled" ? {} : { channel: choice };
}
