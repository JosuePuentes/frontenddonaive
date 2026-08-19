/**
 * Cliente HTTP para sync TV multi-dispositivo (móvil ↔ televisor).
 */
import { API_BASE_URL } from "@/config/api";
import type { AdTvRepositoryState } from "@/services/ad-licoreria/tv/repository";
import { inferTvMediaKind, inferTvMimeType } from "@/services/ad-licoreria/tv/media";

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

function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

async function readUploadError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text) as { error?: { message?: string } };
    if (json.error?.message) return json.error.message;
  } catch {
    /* no JSON */
  }
  if (res.status === 413) {
    return "El servidor rechazó el archivo por tamaño (máx. 512 MB)";
  }
  if (res.status === 413 || /payload|too large/i.test(text)) {
    return "El servidor rechazó el archivo por tamaño (máx. 512 MB)";
  }
  return text.trim()
    ? `Error al subir (${res.status}): ${text.slice(0, 160)}`
    : `Error al subir (${res.status})`;
}

function networkUploadError(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    const name = String((err as { name?: string }).name);
    if (name === "AbortError") {
      return "La subida tardó demasiado. Use WiFi o un video más corto (720p).";
    }
  }
  return "Sin conexión al subir el archivo. Revise WiFi e intente de nuevo.";
}

async function uploadTvFileChunked(
  root: string,
  file: File,
  mime: string,
  onProgress?: (pct: number) => void,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const q = `tenant=${encodeURIComponent(TENANT)}&mimeType=${encodeURIComponent(mime)}&filename=${encodeURIComponent(file.name)}`;
  try {
    const initRes = await fetchWithTimeout(
      `${root}/api/v1/ad/tv/assets/binary/init?${q}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Mime-Type": mime,
        },
        body: JSON.stringify({
          tenant: TENANT,
          mimeType: mime,
          filename: file.name,
        }),
      },
      30_000,
    );
    if (!initRes.ok) {
      return { ok: false, error: await readUploadError(initRes) };
    }
    const initJson = (await initRes.json()) as { data?: { id?: string } };
    const id = initJson.data?.id;
    if (!id) return { ok: false, error: "No se pudo iniciar la subida" };

    const CHUNK = 1.5 * 1024 * 1024;
    let sent = 0;
    while (sent < file.size) {
      const slice = file.slice(sent, sent + CHUNK);
      const chunkRes = await fetchWithTimeout(
        `${root}/api/v1/ad/tv/assets/binary/chunk?${q}&id=${encodeURIComponent(id)}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/octet-stream",
            "X-Mime-Type": mime,
          },
          body: slice,
        },
        120_000,
      );
      if (!chunkRes.ok) {
        return { ok: false, error: await readUploadError(chunkRes) };
      }
      sent += slice.size;
      onProgress?.(Math.min(99, Math.round((sent / file.size) * 100)));
    }

    const doneRes = await fetchWithTimeout(
      `${root}/api/v1/ad/tv/assets/binary/complete?${q}&id=${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Mime-Type": mime,
        },
        body: JSON.stringify({
          tenant: TENANT,
          id,
          mimeType: mime,
          filename: file.name,
        }),
      },
      60_000,
    );
    if (!doneRes.ok) {
      return { ok: false, error: await readUploadError(doneRes) };
    }
    const json = (await doneRes.json()) as { data: { path: string } };
    const path = json.data?.path;
    if (!path) return { ok: false, error: "Respuesta inválida del servidor" };
    onProgress?.(100);
    return {
      ok: true,
      url: `${root}${path.startsWith("/") ? path : `/${path}`}`,
    };
  } catch (err) {
    return { ok: false, error: networkUploadError(err) };
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
  opts?: { onProgress?: (pct: number) => void },
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const root = baseUrl();
  const mime = inferTvMimeType(file);
  if (!root) {
    if (inferTvMediaKind(file) === "image") {
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

  const CHUNK = 1.5 * 1024 * 1024;
  if (file.size > CHUNK || inferTvMediaKind(file) === "video") {
    return uploadTvFileChunked(root, file, mime, opts?.onProgress);
  }

  try {
    const res = await fetchWithTimeout(
      `${root}/api/v1/ad/tv/assets/binary?tenant=${encodeURIComponent(TENANT)}&mimeType=${encodeURIComponent(mime)}&filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/octet-stream",
          "X-Mime-Type": mime,
        },
        body: file,
      },
      180_000,
    );
    if (!res.ok) {
      return { ok: false, error: await readUploadError(res) };
    }
    const json = (await res.json()) as { data: { path: string } };
    const path = json.data?.path;
    if (!path) return { ok: false, error: "Respuesta inválida del servidor" };
    opts?.onProgress?.(100);
    return {
      ok: true,
      url: `${root}${path.startsWith("/") ? path : `/${path}`}`,
    };
  } catch (err) {
    return { ok: false, error: networkUploadError(err) };
  }
}

/** Comprime imagen a JPEG data URL (máx. lado ~1600) para subidas estables. */
export async function compressImageToDataUrl(
  file: File,
  maxSide = 1600,
  quality = 0.82,
): Promise<string> {
  if (inferTvMediaKind(file) !== "image") {
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
