/**
 * Cliente HTTP para sync TV multi-dispositivo (móvil ↔ televisor).
 */
import { API_BASE_URL } from "@/config/api";
import type { AdTvRepositoryState } from "@/services/ad-licoreria/tv/repository";

const TENANT = "ad-licoreria";

function baseUrl() {
  return (API_BASE_URL ?? "").replace(/\/+$/, "");
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

/** Sube data URL al API y devuelve URL pública corta para el TV. */
export async function uploadTvAsset(dataUrl: string): Promise<string | null> {
  const root = baseUrl();
  if (!root) return null;
  if (!dataUrl.startsWith("data:")) return dataUrl;
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
