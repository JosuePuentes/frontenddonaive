/**
 * Cliente HTTP para sync TV multi-dispositivo (móvil ↔ televisor).
 */
import { API_BASE_URL } from "@/config/api";
import type { AdTvRepositoryState } from "@/services/ad-licoreria/tv/repository";

const TENANT = "ad-licoreria";

function baseUrl() {
  return (API_BASE_URL ?? "").replace(/\/+$/, "");
}

/** true si hay API remota para sync/subidas TV. */
export function isTvApiConfigured(): boolean {
  return Boolean(baseUrl());
}

export type TvSyncPayload = {
  version: number;
  state: AdTvRepositoryState | null;
  updatedAt: string | null;
  tenant?: string;
};

export async function fetchTvSyncState(): Promise<TvSyncPayload | null> {
  const root = baseUrl();
  if (!root) return null;
  try {
    const res = await fetch(
      `${root}/api/v1/ad/tv/state?tenant=${encodeURIComponent(TENANT)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data: TvSyncPayload };
    return json.data;
  } catch {
    return null;
  }
}

export async function publishTvSyncState(
  version: number,
  state: AdTvRepositoryState,
  opts?: { allowUnpair?: boolean },
): Promise<(TvSyncPayload & { conflict?: boolean }) | null> {
  const root = baseUrl();
  if (!root) return null;
  try {
    const res = await fetch(
      `${root}/api/v1/ad/tv/state?tenant=${encodeURIComponent(TENANT)}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant: TENANT,
          version,
          state,
          allowUnpair: Boolean(opts?.allowUnpair),
        }),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data: TvSyncPayload;
      conflict?: boolean;
    };
    return { ...json.data, conflict: json.conflict };
  } catch {
    return null;
  }
}

/**
 * Sube data URL al API y devuelve URL pública corta para el TV.
 * Sin API: conserva la data URL (solo este dispositivo).
 */
export async function uploadTvAsset(dataUrl: string): Promise<string | null> {
  const root = baseUrl();
  if (!dataUrl.startsWith("data:")) return dataUrl;
  if (!root) return dataUrl;
  try {
    const res = await fetch(`${root}/api/v1/ad/tv/assets`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tenant: TENANT, dataUrl }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data: { path: string };
    };
    const path = json.data?.path;
    if (!path) return null;
    return `${root}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return null;
  }
}

/** Sube File (imagen/video) en binario — preferido para videos. */
export async function uploadTvFile(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const root = baseUrl();
  const mime = file.type || "application/octet-stream";
  if (!root) {
    if (mime.startsWith("image/")) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(new Error("read"));
          reader.readAsDataURL(file);
        });
        return { ok: true, url: dataUrl };
      } catch {
        return { ok: false, error: "No se pudo leer la imagen" };
      }
    }
    return {
      ok: false,
      error:
        "Falta la API del servidor (VITE_API_BASE_URL). Los videos necesitan API para el TV",
    };
  }
  try {
    const res = await fetch(
      `${root}/api/v1/ad/tv/assets/binary?tenant=${encodeURIComponent(TENANT)}&mimeType=${encodeURIComponent(mime)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/octet-stream",
        },
        body: file,
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Error al subir (${res.status})${text ? `: ${text.slice(0, 120)}` : ""}`,
      };
    }
    const json = (await res.json()) as { data: { path: string } };
    const path = json.data?.path;
    if (!path) return { ok: false, error: "Respuesta inválida del servidor" };
    return {
      ok: true,
      url: `${root}${path.startsWith("/") ? path : `/${path}`}`,
    };
  } catch {
    return { ok: false, error: "Sin conexión al subir el archivo" };
  }
}

/** Comprime imagen a JPEG data URL (máx. lado ~1600) para subidas estables. */
export async function compressImageToDataUrl(
  file: File,
  maxSide = 1600,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("No es imagen");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export type TvPairResult = {
  ok: true;
  version: number;
  state: AdTvRepositoryState;
  screen: AdTvRepositoryState["screens"][number];
} | {
  ok: false;
  error: string;
};

/** Vincula por código en el servidor (atómico). */
export async function pairTvOnServer(input: {
  pairingCode: string;
  userName?: string;
}): Promise<TvPairResult> {
  const root = baseUrl();
  if (!root) {
    return { ok: false, error: "API no configurada" };
  }
  try {
    const res = await fetch(`${root}/api/v1/ad/tv/pair`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenant: TENANT,
        pairingCode: input.pairingCode,
        userName: input.userName,
      }),
    });
    const json = (await res.json()) as {
      data?: TvSyncPayload & {
        screen?: AdTvRepositoryState["screens"][number];
      };
      error?: { message?: string };
    };
    if (!res.ok || !json.data?.state || !json.data.screen) {
      return {
        ok: false,
        error:
          json.error?.message ||
          "No se pudo vincular. Revise el código e intente de nuevo.",
      };
    }
    return {
      ok: true,
      version: json.data.version,
      state: json.data.state as AdTvRepositoryState,
      screen: json.data.screen,
    };
  } catch {
    return { ok: false, error: "Sin conexión con el servidor TV" };
  }
}
