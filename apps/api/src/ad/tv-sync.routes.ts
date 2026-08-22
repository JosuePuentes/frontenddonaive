/**
 * Sync compartido A&D TV (MOCK multi-dispositivo).
 * Estado + assets de imagen/video para que el móvil mande contenido al TV.
 */
import { Router } from "express";
import fs from "node:fs";
import path from "node:path";

export const adTvSyncRouter = Router();

type TvSyncBlob = {
  version: number;
  state: unknown;
  updatedAt: string;
};

type TvAssetMeta = {
  id: string;
  mimeType: string;
  createdAt: string;
  bytes: number;
};

const DATA_ROOT = path.join(process.cwd(), ".data", "ad-tv");
const STATE_DIR = path.join(DATA_ROOT, "state");
const ASSET_DIR = path.join(DATA_ROOT, "assets");
const PART_DIR = path.join(DATA_ROOT, "parts");
/** Tope del archivo ensamblado (chunks). Cada chunk es pequeño. */
const MAX_ASSET_BYTES = 512 * 1024 * 1024;
const MAX_SINGLE_POST_BYTES = 12 * 1024 * 1024;

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  fs.mkdirSync(PART_DIR, { recursive: true });
}

ensureDirs();

const stores = new Map<string, TvSyncBlob>();

function stateFile(tenant: string) {
  return path.join(STATE_DIR, `${tenant}.json`);
}

function loadState(tenant: string): TvSyncBlob | null {
  if (stores.has(tenant)) return stores.get(tenant) ?? null;
  try {
    const raw = fs.readFileSync(stateFile(tenant), "utf8");
    const parsed = JSON.parse(raw) as TvSyncBlob;
    stores.set(tenant, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function saveState(tenant: string, blob: TvSyncBlob) {
  stores.set(tenant, blob);
  try {
    fs.writeFileSync(stateFile(tenant), JSON.stringify(blob));
  } catch (err) {
    console.warn("[ad-tv] no se pudo persistir state", err);
  }
}

function assetPaths(tenant: string, id: string) {
  const safeTenant = tenant.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const base = path.join(ASSET_DIR, safeTenant, safeId);
  return {
    bin: `${base}.bin`,
    meta: `${base}.json`,
  };
}

function writeAsset(
  tenant: string,
  id: string,
  mimeType: string,
  buf: Buffer,
): TvAssetMeta {
  const paths = assetPaths(tenant, id);
  fs.mkdirSync(path.dirname(paths.bin), { recursive: true });
  fs.writeFileSync(paths.bin, buf);
  const meta: TvAssetMeta = {
    id,
    mimeType,
    createdAt: new Date().toISOString(),
    bytes: buf.length,
  };
  fs.writeFileSync(paths.meta, JSON.stringify(meta));
  return meta;
}

function finalizeAssetFromPart(
  tenant: string,
  id: string,
  mimeType: string,
  partFile: string,
): TvAssetMeta | null {
  const bytes = fs.statSync(partFile).size;
  if (!bytes) return null;
  const paths = assetPaths(tenant, id);
  fs.mkdirSync(path.dirname(paths.bin), { recursive: true });
  try {
    fs.unlinkSync(paths.bin);
  } catch {
    /* no existía */
  }
  fs.renameSync(partFile, paths.bin);
  const meta: TvAssetMeta = {
    id,
    mimeType,
    createdAt: new Date().toISOString(),
    bytes,
  };
  fs.writeFileSync(paths.meta, JSON.stringify(meta));
  return meta;
}

function decodeDataUrl(dataUrl: string): { mimeType: string; buf: Buffer } | null {
  if (!dataUrl.startsWith("data:")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  const mimeMatch = /^data:([^;,]+)/.exec(meta);
  const mimeType = mimeMatch?.[1] || "application/octet-stream";
  const isBase64 = /;base64/i.test(meta);
  const buf = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mimeType, buf };
}

function inferMimeFromFilename(name: string): string | null {
  const n = String(name || "").toLowerCase();
  if (n.endsWith(".mp4") || n.endsWith(".m4v")) return "video/mp4";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".mov")) return "video/quicktime";
  if (n.endsWith(".mkv")) return "video/x-matroska";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

function readBodyBuffer(body: unknown): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (body instanceof Uint8Array) return Buffer.from(body);
  return Buffer.alloc(0);
}

function partPath(tenant: string, id: string) {
  const safeTenant = tenant.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(PART_DIR, safeTenant, `${safeId}.part`);
}

function newAssetId() {
  return `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveUploadMime(
  req: {
    query: Record<string, unknown>;
    headers: Record<string, unknown>;
    body?: unknown;
  },
): string {
  const q = String(req.query.mimeType || "").trim();
  if (q && q !== "application/octet-stream") return q;
  const h = String(req.headers["x-mime-type"] || "").trim();
  if (h && h !== "application/octet-stream") return h;
  const fromName = inferMimeFromFilename(String(req.query.filename || ""));
  if (fromName) return fromName;
  return q || h || "application/octet-stream";
}

function tenantKey(req: { query: Record<string, unknown>; body?: unknown }) {
  const q = req.query.tenant;
  const body = req.body;
  const b =
    body &&
    typeof body === "object" &&
    !Buffer.isBuffer(body) &&
    !ArrayBuffer.isView(body)
      ? (body as { tenant?: string }).tenant
      : undefined;
  return String(q || b || "ad-licoreria").trim() || "ad-licoreria";
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

function mergeDeletedContentIdsServer(
  ...lists: Array<string[] | undefined>
): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const id of list ?? []) {
      if (id) set.add(String(id));
    }
  }
  return [...set].slice(-400);
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
  const deletedIds = new Set(
    mergeDeletedContentIdsServer(
      incoming.deletedContentIds as string[] | undefined,
      previous?.deletedContentIds as string[] | undefined,
    ),
  );
  if (!prevList.length && !deletedIds.size) return incoming;
  const map = new Map<string, { id?: string; updatedAt?: string }>();
  for (const c of nextList) {
    if (!c?.id || deletedIds.has(String(c.id))) continue;
    map.set(String(c.id), c);
  }
  for (const c of prevList) {
    if (!c?.id) continue;
    const id = String(c.id);
    if (deletedIds.has(id)) continue;
    const cur = map.get(id);
    if (!cur) map.set(id, c);
    else if ((c.updatedAt || "") > (cur.updatedAt || "")) map.set(id, c);
  }
  return {
    ...incoming,
    contents: [...map.values()],
    deletedContentIds: [...deletedIds],
  };
}

adTvSyncRouter.get("/tv/state", (req, res) => {
  const key = tenantKey(req);
  const cur = loadState(key);
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
  const cur = loadState(key);
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
  saveState(key, next);
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
  const cur = loadState(key);
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
  saveState(key, next);
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
 * Sube imagen/video (data URL) y lo guarda en disco (sobrevive reinicios).
 */
adTvSyncRouter.post("/tv/assets", (req, res) => {
  const key = tenantKey(req);
  const body = (req.body ?? {}) as {
    id?: string;
    dataUrl?: string;
    mimeType?: string;
  };
  const decoded = decodeDataUrl(String(body.dataUrl ?? ""));
  if (!decoded || !decoded.buf.length) {
    res.status(400).json({ error: { message: "dataUrl inválido" } });
    return;
  }
  const mimeType = String(body.mimeType || decoded.mimeType).trim();
  const id =
    String(body.id || "").trim() ||
    `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const meta = writeAsset(key, id, mimeType, decoded.buf);
  res.json({
    data: {
      id: meta.id,
      tenant: key,
      mimeType: meta.mimeType,
      bytes: meta.bytes,
      /** El cliente antepone VITE_API_BASE_URL. */
      path: `/api/v1/ad/tv/assets/${encodeURIComponent(id)}?tenant=${encodeURIComponent(key)}`,
    },
  });
});

function assetPublicPath(id: string, tenant: string) {
  return `/api/v1/ad/tv/assets/${encodeURIComponent(id)}?tenant=${encodeURIComponent(tenant)}`;
}

/**
 * Subida binaria de un solo request (videos pequeños).
 * Query: tenant, mimeType, filename
 */
adTvSyncRouter.post("/tv/assets/binary", (req, res) => {
  req.setTimeout(180_000);
  res.setTimeout(180_000);
  const key = tenantKey(req);
  const mimeType = resolveUploadMime(req);
  const buf = readBodyBuffer(req.body);
  if (!buf.length) {
    res.status(400).json({
      error: {
        message:
          "El servidor no recibió el archivo. Intente de nuevo o use WiFi.",
      },
    });
    return;
  }
  if (buf.length > MAX_SINGLE_POST_BYTES) {
    res.status(413).json({
      error: {
        message:
          "Use la subida por partes. El archivo supera el envío directo.",
      },
    });
    return;
  }
  const id = newAssetId();
  const meta = writeAsset(key, id, mimeType, buf);
  res.json({
    data: {
      id: meta.id,
      tenant: key,
      mimeType: meta.mimeType,
      bytes: meta.bytes,
      path: assetPublicPath(id, key),
    },
  });
});

/** Inicia subida por partes (videos grandes / red lenta). */
adTvSyncRouter.post("/tv/assets/binary/init", (req, res) => {
  const key = tenantKey(req);
  const body = (req.body ?? {}) as { mimeType?: string; filename?: string };
  const mimeType =
    resolveUploadMime({
      query: {
        ...req.query,
        mimeType: req.query.mimeType || body.mimeType,
        filename: req.query.filename || body.filename,
      },
      headers: req.headers as Record<string, unknown>,
    }) || "application/octet-stream";
  const id = newAssetId();
  const part = partPath(key, id);
  fs.mkdirSync(path.dirname(part), { recursive: true });
  fs.writeFileSync(part, Buffer.alloc(0));
  res.json({
    data: {
      id,
      tenant: key,
      mimeType,
      maxBytes: MAX_ASSET_BYTES,
    },
  });
});

/** Añade un chunk binario a la subida iniciada. Query: tenant, id */
adTvSyncRouter.post("/tv/assets/binary/chunk", (req, res) => {
  req.setTimeout(120_000);
  res.setTimeout(120_000);
  const key = tenantKey(req);
  const id = String(req.query.id || "").trim();
  if (!id) {
    res.status(400).json({ error: { message: "id de subida requerido" } });
    return;
  }
  const part = partPath(key, id);
  if (!fs.existsSync(part)) {
    res.status(404).json({
      error: { message: "Sesión de subida no encontrada. Intente de nuevo." },
    });
    return;
  }
  const buf = readBodyBuffer(req.body);
  const current = fs.statSync(part).size;
  if (current + buf.length > MAX_ASSET_BYTES) {
    try {
      fs.unlinkSync(part);
    } catch {
      /* ignore */
    }
    res.status(413).json({
      error: { message: "Archivo muy grande (máx. 512 MB)" },
    });
    return;
  }
  fs.appendFileSync(part, buf);
  res.json({
    data: { id, received: current + buf.length },
  });
});

/** Cierra la subida por partes y publica el asset. */
adTvSyncRouter.post("/tv/assets/binary/complete", (req, res) => {
  const key = tenantKey(req);
  const body = (req.body ?? {}) as {
    id?: string;
    mimeType?: string;
    filename?: string;
  };
  const id = String(req.query.id || body.id || "").trim();
  if (!id) {
    res.status(400).json({ error: { message: "id de subida requerido" } });
    return;
  }
  const part = partPath(key, id);
  if (!fs.existsSync(part)) {
    res.status(404).json({
      error: { message: "Sesión de subida no encontrada. Intente de nuevo." },
    });
    return;
  }
  const mimeType = resolveUploadMime({
    query: {
      ...req.query,
      mimeType: req.query.mimeType || body.mimeType,
      filename: req.query.filename || body.filename,
    },
    headers: req.headers as Record<string, unknown>,
  });
  const meta = finalizeAssetFromPart(key, id, mimeType, part);
  if (!meta) {
    try {
      fs.unlinkSync(part);
    } catch {
      /* ignore */
    }
    res.status(400).json({ error: { message: "archivo vacío" } });
    return;
  }
  res.json({
    data: {
      id: meta.id,
      tenant: key,
      mimeType: meta.mimeType,
      bytes: meta.bytes,
      path: assetPublicPath(id, key),
    },
  });
});

adTvSyncRouter.get("/tv/assets/:id", (req, res) => {
  const key = tenantKey(req);
  const id = String(req.params.id ?? "");
  const paths = assetPaths(key, id);
  let meta: TvAssetMeta;
  let size = 0;
  try {
    meta = JSON.parse(fs.readFileSync(paths.meta, "utf8")) as TvAssetMeta;
    size = fs.statSync(paths.bin).size;
  } catch {
    res.status(404).json({ error: { message: "Asset no encontrado" } });
    return;
  }
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", meta.mimeType);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Accept-Ranges", "bytes");

  const range = String(req.headers.range || "");
  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (match) {
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : size - 1;
    if (start >= size || start > end) {
      res.status(416);
      res.setHeader("Content-Range", `bytes */${size}`);
      res.end();
      return;
    }
    const safeEnd = Math.min(end, size - 1);
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${safeEnd}/${size}`);
    res.setHeader("Content-Length", String(safeEnd - start + 1));
    fs.createReadStream(paths.bin, { start, end: safeEnd }).pipe(res);
    return;
  }

  res.setHeader("Content-Length", String(size));
  fs.createReadStream(paths.bin).pipe(res);
});
