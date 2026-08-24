/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_DONAIVE_SOFTWARE_HOST?: string;
  readonly VITE_POLISUR_HOST?: string;
  readonly VITE_AD_LICORERIA_HOST?: string;
  readonly VITE_AD_DATA_SOURCE?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
