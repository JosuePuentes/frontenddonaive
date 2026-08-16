/**
 * Sync compartido A&D TV (MOCK multi-dispositivo).
 * Estado + assets de imagen/video para que el móvil mande contenido al TV.
 */
import { Router } from "express";

export const adTvSyncRouter = Router();

type TvSyncBlob = {
  version: number;
  state: unknown;
  updatedAt: string;
};

type TvAsset = {
  id: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
};

const stores = new Map<string, TvSyncBlob>();
const assets = new Map<string, TvAsset>();

function tenantKey(req: { query: Record<string, unknown>; body?: unknown }) {
  const q = req.query.tenant;
  const b =
    req.body && typeof req.body === "object"
      ? (req.body as { tenant?: string }).tenant
      : undefined;
  return String(q || b || "ad-licoreria").trim() || "ad-licoreria";
}

function assetKey(tenant: string, id: string) {
  return `${tenant}::${id}`;
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

/**
 * Sube imagen/video (data URL) para no meter MB en el blob de sync.
 * GET posterior sirve el asset al reproductor TV.
 */
adTvSyncRouter.post("/tv/assets", (req, res) => {
  const key = tenantKey(req);
  const body = (req.body ?? {}) as {
    id?: string;
    dataUrl?: string;
    mimeType?: string;
  };
  const dataUrl = String(body.dataUrl ?? "");
  if (!dataUrl.startsWith("data:")) {
    res.status(400).json({ error: { message: "dataUrl inválido" } });
    return;
  }
  const mimeMatch = /^data:([^;,]+)/.exec(dataUrl);
  const mimeType =
    String(body.mimeType || mimeMatch?.[1] || "application/octet-stream").trim();
  const id =
    String(body.id || "").trim() ||
    `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const asset: TvAsset = {
    id,
    mimeType,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
  assets.set(assetKey(key, id), asset);
  res.json({
    data: {
      id,
      tenant: key,
      mimeType,
      /** El cliente antepone VITE_API_BASE_URL. */
      path: `/api/v1/ad/tv/assets/${encodeURIComponent(id)}?tenant=${encodeURIComponent(key)}`,
    },
  });
});

adTvSyncRouter.get("/tv/assets/:id", (req, res) => {
  const key = tenantKey(req);
  const id = String(req.params.id ?? "");
  const asset = assets.get(assetKey(key, id));
  if (!asset) {
    res.status(404).json({ error: { message: "Asset no encontrado" } });
    return;
  }
  const comma = asset.dataUrl.indexOf(",");
  if (comma < 0) {
    res.status(500).json({ error: { message: "Asset corrupto" } });
    return;
  }
  const meta = asset.dataUrl.slice(0, comma);
  const payload = asset.dataUrl.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);
  const buf = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  res.setHeader("Content-Type", asset.mimeType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(buf);
});
