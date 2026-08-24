/**
 * Registro del service worker (vite-plugin-pwa).
 * Los datos de Donaive Software siguen en localStorage; el SW cachea el shell.
 */

import { registerSW } from "virtual:pwa-register";

export type PwaUpdateHandler = () => void;

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function initPwa(onNeedRefresh?: PwaUpdateHandler): void {
  if (typeof window === "undefined") return;
  if (import.meta.env.VITE_DONAIVE_DESKTOP === "true") return;
  if (!("serviceWorker" in navigator)) return;

  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      onNeedRefresh?.();
    },
    onOfflineReady() {
      // shell cacheado — el banner de red lo cubre en UI
    },
  });
}

export function applyPwaUpdate(): void {
  void updateSW?.(true);
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  // iOS Safari
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return mq.matches || Boolean(nav.standalone);
}
