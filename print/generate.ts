/**
 * Generates the printable edition (A4 PDFs) in every language into print/pdf/<lang>/.
 * Usage: deno task print [--preview=<dir>]   (--preview also writes a PNG of each document)
 */

import { chromium } from "playwright";
import { launchOptions } from "../e2e/browser.ts";
import { LANGS } from "../src/i18n/index.ts";
import { buildDocuments } from "./templates.ts";

const OUT = new URL("./pdf/", import.meta.url);
const preview = Deno.args.find((arg) => arg.startsWith("--preview="))?.slice("--preview=".length);
const css = await Deno.readTextFile(new URL("./print.css", import.meta.url));

const browser = await chromium.launch(launchOptions());
try {
  const page = await browser.newPage();
  if (preview) await Deno.mkdir(preview, { recursive: true });
  for (const lang of LANGS) {
    const dir = new URL(`${lang}/`, OUT);
    await Deno.remove(dir, { recursive: true }).catch(() => {});
    await Deno.mkdir(dir, { recursive: true });
    for (const doc of buildDocuments(lang, css)) {
      await page.setContent(doc.html, { waitUntil: "load" });
      await page.pdf({ path: new URL(doc.file, dir).pathname, preferCSSPageSize: true, printBackground: true });
      if (preview) {
        await page.emulateMedia({ media: "print" });
        await page.setViewportSize({ width: 794, height: 1123 });
        await page.screenshot({ path: `${preview}/${lang}-${doc.file.replace(".pdf", ".png")}`, fullPage: true });
        await page.emulateMedia({ media: "screen" });
      }
      console.log(`Wrote print/pdf/${lang}/${doc.file}`);
    }
  }
} finally {
  await browser.close();
}
