/**
 * Persistencia del sistema.
 * En escritorio Electron: archivos en la carpeta de datos del usuario.
 * En web/demo: localStorage del navegador.
 */

export type DonaiveDesktopApi = {
  isDesktop: true;
  platform: string;
  version: string;
  dataPath: string;
  storage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  openDataFolder: () => Promise<void>;
};

declare global {
  interface Window {
    donaiveDesktop?: DonaiveDesktopApi;
  }
}

function desktopStorage() {
  return typeof window !== "undefined"
    ? window.donaiveDesktop?.storage
    : undefined;
}

/** Lectura persistente (disco local en desktop, localStorage en web). */
export function dsGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  const desk = desktopStorage();
  if (desk) return desk.getItem(key);
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Escritura persistente. */
export function dsSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  const desk = desktopStorage();
  if (desk) {
    desk.setItem(key, value);
    return;
  }
  localStorage.setItem(key, value);
}

/** Borrado persistente. */
export function dsRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  const desk = desktopStorage();
  if (desk) {
    desk.removeItem(key);
    return;
  }
  localStorage.removeItem(key);
}

export function getDesktopDataPath(): string | null {
  if (typeof window === "undefined") return null;
  return window.donaiveDesktop?.dataPath ?? null;
}

export async function openDesktopDataFolder(): Promise<boolean> {
  if (typeof window === "undefined" || !window.donaiveDesktop?.openDataFolder) {
    return false;
  }
  await window.donaiveDesktop.openDataFolder();
  return true;
}
