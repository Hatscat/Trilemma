import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const { version } = JSON.parse(readFileSync(resolve(root, "deno.json"), "utf8")) as { version: string };

function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(dir, entry.name), `${prefix}${entry.name}/`)
      : entry.name.startsWith(".")
      ? []
      : [`${prefix}${entry.name}`]
  );
}

/**
 * Injects the precache list and a content-based cache version into the service worker (sw.js),
 * so a new build always installs a fresh cache and the app works offline from the first visit.
 */
function serviceWorker(): Plugin {
  let publicDir = "";
  return {
    name: "trilemma-service-worker",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const sw = bundle["sw.js"];
      if (!sw || sw.type !== "chunk") this.error("Service worker chunk sw.js not found");
      const hash = createHash("sha256");
      const urls: string[] = [];
      for (const [fileName, output] of Object.entries(bundle)) {
        if (fileName === "sw.js" || fileName.endsWith(".map")) continue;
        urls.push(fileName);
        hash.update(fileName).update(output.type === "chunk" ? output.code : output.source);
      }
      // Install dialog screenshots and the link preview image are never needed offline.
      const precached = (file: string) => !file.startsWith("screenshots/") && file !== "og-image.jpg";
      for (const file of publicDir ? listFiles(publicDir).filter(precached) : []) {
        urls.push(file);
        hash.update(file).update(readFileSync(join(publicDir, file)));
      }
      urls.sort();
      sw.code = sw.code
        .replaceAll("__PRECACHE_URLS__", JSON.stringify(["./", ...urls]))
        .replaceAll("__CACHE_VERSION__", JSON.stringify(hash.digest("hex").slice(0, 12)));
    },
  };
}

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    target: "es2022",
    rolldownOptions: {
      input: {
        main: resolve(root, "index.html"),
        sw: resolve(root, "src/sw.ts"),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js"),
      },
    },
  },
  plugins: [serviceWorker()],
});
