/**
 * Sync compartido A&D TV (MOCK multi-dispositivo).
 * Permite que el móvil y el televisor compartan pairing + playback
 * vía el mismo API (túnel), sin WebSocket aún.
 */
import { Router } from "express";

export const adTvSyncRouter = Router();

type TvSyncBlob = {
  version: number;
  state: unknown;
  updatedAt: string;
};

const stores = new Map<string, TvSyncBlob>();

function tenantKey(req: { query: Record<string, unknown>; body?: unknown }) {
  const q = req.query.tenant;
  const b =
    req.body && typeof req.body === "object"
      ? (req.body as { tenant?: string }).tenant
      : undefined;
  return String(q || b || "ad-licoreria").trim() || "ad-licoreria";
}

adTvSyncRouter.get("/tv/state", (req, res) => {
  const key = tenantKey(req);
  const cur = stores.get(key);
  res.json({
    data: cur ?? {
      version: 0,
      state: null,
      updatedAt: null,
      tenant: key,
    },
  });
});

adTvSyncRouter.put("/tv/state", (req, res) => {
  const key = tenantKey(req);
  const body = (req.body ?? {}) as {
    version?: number;
    state?: unknown;
  };
  if (!body.state || typeof body.state !== "object") {
    res.status(400).json({
      error: { message: "state requerido" },
    });
    return;
  }
  const version = Number(body.version) || Date.now();
  const cur = stores.get(key);
  if (cur && version < cur.version) {
    res.json({ data: { ...cur, tenant: key }, conflict: true });
    return;
  }
  const next: TvSyncBlob = {
    version,
    state: body.state,
    updatedAt: new Date().toISOString(),
  };
  stores.set(key, next);
  res.json({ data: { ...next, tenant: key } });
});
