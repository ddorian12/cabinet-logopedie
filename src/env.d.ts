/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RESEND_API_KEY: string;
  readonly EMAIL_FROM: string;
  readonly EMAIL_TO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
