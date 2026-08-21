/**
 * Persistencia local del contador de clics POLISUR.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const STORE_REL = "data/polisur-clicks.json";

const SOCIAL_KEYS = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "tiktok",
  "whatsapp",
];

export const EMPTY_STATS = {
  updatedAt: "",
  news: {},
  social: {
    facebook: 0,
    instagram: 0,
    twitter: 0,
    youtube: 0,
    tiktok: 0,
    whatsapp: 0,
  },
  phone: {
    primary: 0,
    alt: 0,
  },
};

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Polisur-Clave",
  );
  res.end(JSON.stringify(body));
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }
  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString("utf8");
    return text ? JSON.parse(text) : {};
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function clean(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function asCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 1_000_000_000);
}

export function normalizeStats(raw) {
  const newsIn =
    raw?.news && typeof raw.news === "object" && !Array.isArray(raw.news)
      ? raw.news
      : {};
  const news = {};
  for (const [key, value] of Object.entries(newsIn)) {
    const id = clean(key, 64);
    if (!id) continue;
    news[id] = asCount(value);
  }

  const socialIn = raw?.social && typeof raw.social === "object" ? raw.social : {};
  const social = {};
  for (const key of SOCIAL_KEYS) {
    social[key] = asCount(socialIn[key]);
  }

  const phoneIn = raw?.phone && typeof raw.phone === "object" ? raw.phone : {};
  return {
    updatedAt: clean(raw?.updatedAt, 40),
    news,
    social,
    phone: {
      primary: asCount(phoneIn.primary),
      alt: asCount(phoneIn.alt),
    },
  };
}

export function normalizeTrack(body) {
  const kind = clean(body?.kind, 20);
  const id = clean(body?.id, 64);
  if (kind === "news") {
    if (!id) {
      const err = new Error("Indique la noticia.");
      err.statusCode = 400;
      throw err;
    }
    return { kind: "news", id };
  }
  if (kind === "social") {
    if (!SOCIAL_KEYS.includes(id)) {
      const err = new Error("Red social no válida.");
      err.statusCode = 400;
      throw err;
    }
    return { kind: "social", id };
  }
  if (kind === "phone") {
    if (id !== "primary" && id !== "alt") {
      const err = new Error("Teléfono no válido.");
      err.statusCode = 400;
      throw err;
    }
    return { kind: "phone", id };
  }
  const err = new Error("Tipo de clic no válido.");
  err.statusCode = 400;
  throw err;
}

export function applyTrack(stats, track) {
  const next = normalizeStats(stats);
  if (track.kind === "news") {
    next.news[track.id] = asCount(next.news[track.id]) + 1;
  } else if (track.kind === "social") {
    next.social[track.id] = asCount(next.social[track.id]) + 1;
  } else if (track.kind === "phone") {
    next.phone[track.id] = asCount(next.phone[track.id]) + 1;
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

function storePath(root) {
  return resolve(root, STORE_REL);
}

export function readStats(root) {
  const file = storePath(root);
  if (!existsSync(file)) return normalizeStats(EMPTY_STATS);
  try {
    return normalizeStats(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return normalizeStats(EMPTY_STATS);
  }
}

export function writeStats(root, stats) {
  const file = storePath(root);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(normalizeStats(stats), null, 2)}\n`, "utf8");
}
