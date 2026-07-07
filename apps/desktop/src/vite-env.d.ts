/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Apryse/Foxit license key. Absent in the open-source build. */
  readonly VITE_APRYSE_LICENSE_KEY?: string;
  /** Base URL of the Rust converter/OCR backend service. */
  readonly VITE_CONVERTER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
