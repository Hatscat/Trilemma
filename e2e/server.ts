/** Starts `vite preview` on the production build (dist/) for the end-to-end tests. */

export interface PreviewServer {
  readonly url: string;
  close(): Promise<void>;
}

export async function startPreview(port = 4174): Promise<PreviewServer> {
  const child = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "npm:vite@8.3.6", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    stdout: "null",
    stderr: "null",
  }).spawn();
  const url = `http://127.0.0.1:${port}/`;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      const response = await fetch(url);
      await response.body?.cancel();
      if (response.ok) {
        return {
          url,
          close: async () => {
            child.kill("SIGTERM");
            await child.status;
          },
        };
      }
    } catch {
      // Not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  child.kill("SIGTERM");
  await child.status;
  throw new Error(`vite preview did not start on ${url} (did you run "deno task build"?)`);
}
