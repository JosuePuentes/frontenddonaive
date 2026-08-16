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

function normalizePairCode(raw: string) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function pairCodeDigits(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : digits;
}

type TvScreenLike = {
  id?: string;
  code?: string;
  paired?: boolean;
  status?: string;
  pairingCode?: string | null;
  pairingToken?: string | null;
  name?: string;
  [key: string]: unknown;
};

type TvStateLike = {
  screens?: TvScreenLike[];
  contents?: unknown[];
  [key: string]: unknown;
};

/** No permitir que un push viejo de la TV desvincule una pantalla ya paired. */
function protectPairedScreens(
  incoming: TvStateLike,
  previous: TvStateLike | null,
  opts?: { allowUnpair?: boolean },
): TvStateLike {
  if (!previous?.screens?.length || !incoming.screens?.length) return incoming;
  if (opts?.allowUnpair) return incoming;
  const prevById = new Map(previous.screens.map((s) => [s.id, s]));
  return {
    ...incoming,
    screens: incoming.screens.map((s) => {
      const prev = prevById.get(s.id);
      if (prev?.paired && !s.paired) {
        return {
          ...s,
          paired: true,
          status: "ONLINE",
          pairingCode: null,
        };
      }
      return s;
    }),
  };
}

function mergeContentsServer(
  incoming: TvStateLike,
  previous: TvStateLike | null,
): TvStateLike {
  const prevList = (previous?.contents ?? []) as Array<{
    id?: string;
    updatedAt?: string;
  }>;
  const nextList = (incoming.contents ?? []) as Array<{
    id?: string;
    updatedAt?: string;
  }>;
  if (!prevList.length) return incoming;
  const map = new Map<string, { id?: string; updatedAt?: string }>();
  for (const c of nextList) {
    if (c?.id) map.set(String(c.id), c);
  }
  for (const c of prevList) {
    if (!c?.id) continue;
    const id = String(c.id);
    const cur = map.get(id);
    if (!cur) map.set(id, c);
    else if ((c.updatedAt || "") > (cur.updatedAt || "")) map.set(id, c);
  }
  return { ...incoming, contents: [...map.values()] };
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
    allowUnpair?: boolean;
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
  const prevState = (cur?.state ?? null) as TvStateLike | null;
  let nextState = body.state as TvStateLike;
  nextState = protectPairedScreens(nextState, prevState, {
    allowUnpair: Boolean(body.allowUnpair),
  });
  nextState = mergeContentsServer(nextState, prevState);
  const next: TvSyncBlob = {
    version,
    state: nextState,
    updatedAt: new Date().toISOString(),
  };
  stores.set(key, next);
  res.json({ data: { ...next, tenant: key } });
});

/**
 * Vincula una TV por código en el servidor (evita carreras móvil ↔ TV).
 * Acepta "A&D-3230", "AD-3230", "3230", etc.
 */
adTvSyncRouter.post("/tv/pair", (req, res) => {
  const key = tenantKey(req);
  const body = (req.body ?? {}) as {
    pairingCode?: string;
    userName?: string;
  };
  const raw = String(body.pairingCode ?? "");
  const want = normalizePairCode(raw);
  const wantDigits = pairCodeDigits(raw);
  if (!want && !wantDigits) {
    res.status(400).json({ error: { message: "Código requerido" } });
    return;
  }
  const cur = stores.get(key);
  if (!cur?.state || typeof cur.state !== "object") {
    res.status(404).json({
      error: {
        message:
          "Aún no hay estado TV. Abra el reproductor en el televisor y reintente.",
      },
    });
    return;
  }
  const state = structuredClone(cur.state) as TvStateLike;
  const screens = state.screens ?? [];
  const screen = screens.find((s) => {
    const pc = normalizePairCode(String(s.pairingCode ?? ""));
    const digits = pairCodeDigits(String(s.pairingCode ?? ""));
    if (!pc && !digits) return false;
    if (want && pc === want) return true;
    if (wantDigits && digits === wantDigits) return true;
    return false;
  });
  if (!screen) {
    const waiting = screens
      .filter((s) => s.pairingCode)
      .map((s) => `${s.code}:${s.pairingCode}`)
      .join(", ");
    res.status(404).json({
      error: {
        message: waiting
          ? `Código no coincide. En espera: ${waiting}`
          : "Código inválido. Abra el reproductor en la TV para generar uno.",
      },
    });
    return;
  }
  screen.paired = true;
  screen.status = "ONLINE";
  screen.pairingCode = null;
  screen.updatedAt = new Date().toISOString();
  screen.lastSeenAt = new Date().toISOString();
  const next: TvSyncBlob = {
    version: Math.max(Date.now(), cur.version + 1),
    state,
    updatedAt: new Date().toISOString(),
  };
  stores.set(key, next);
  res.json({
    data: {
      ...next,
      tenant: key,
      screen,
      userName: body.userName ?? null,
    },
  });
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
