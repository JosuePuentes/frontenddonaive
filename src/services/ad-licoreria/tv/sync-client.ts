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
        body: JSON.stringify({ tenant: TENANT, version, state }),
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
