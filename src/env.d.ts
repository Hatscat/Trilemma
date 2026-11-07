// Globals provided by Vite at build time.

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** App version, from deno.json. */
declare const __APP_VERSION__: string;
