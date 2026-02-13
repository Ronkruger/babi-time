/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_R2_UPLOAD_API_URL?: string;
  readonly VITE_R2_UPLOAD_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
