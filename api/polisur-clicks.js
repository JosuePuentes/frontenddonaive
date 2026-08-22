/**
 * Contador de clics POLISUR (noticias, redes, teléfonos).
 * POST action=track — público
 * GET  action=stats — clave institucional
 *
 * Secrets: POLISUR_MEDIOS_CLAVE, GITHUB_TOKEN
 */

const STORE_PATH = "data/polisur-clicks.json";

const SOCIAL_KEYS = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "tiktok",
  "whatsapp",
];

const EMPTY = {
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
  phone: { primary: 0, alt: 0 },
};

function json(res, status, body) {
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

function assertClave(clave) {
  const expected = process.env.POLISUR_MEDIOS_CLAVE || "";
  if (!expected) {
    const err = new Error(
      "Acceso institucional no configurado (falta POLISUR_MEDIOS_CLAVE).",
    );
    err.statusCode = 503;
    throw err;
  }
  if (!clave || String(clave).trim() !== String(expected).trim()) {
    const err = new Error("Clave institucional no válida.");
    err.statusCode = 401;
    throw err;
  }
}

function githubConfig() {
  return {
    repo: process.env.POLISUR_MEDIOS_REPO || "JosuePuentes/frontenddonaive",
    branch: process.env.POLISUR_CLICKS_BRANCH || "main",
    token: process.env.GITHUB_TOKEN || "",
  };
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

function normalizeStats(raw) {
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

function normalizeTrack(body) {
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

function applyTrack(stats, track) {
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

async function readBody(req) {
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

async function getGitHubFile() {
  const { repo, branch, token } = githubConfig();
  if (!token) {
    const err = new Error("Falta GITHUB_TOKEN para guardar contadores.");
    err.statusCode = 503;
    throw err;
  }
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_PATH}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(api, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (res.status === 404) {
    return { sha: null, stats: normalizeStats(EMPTY) };
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub no leyó contadores (${res.status}): ${text}`);
    err.statusCode = 502;
    throw err;
  }
  const data = await res.json();
  let stats = normalizeStats(EMPTY);
  try {
    const decoded = Buffer.from(data.content || "", "base64").toString("utf8");
    stats = normalizeStats(JSON.parse(decoded));
  } catch {
    stats = normalizeStats(EMPTY);
  }
  return { sha: data.sha || null, stats };
}

async function putGitHubFile({ stats, sha, message }) {
  const { repo, branch, token } = githubConfig();
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_PATH}`;
  const content = Buffer.from(
    `${JSON.stringify(normalizeStats(stats), null, 2)}\n`,
  ).toString("base64");
  const res = await fetch(api, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `GitHub no guardó contadores (${res.status}): ${text}`,
    );
    err.statusCode = res.status === 409 ? 409 : 502;
    throw err;
  }
}

async function trackWithRetry(track) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const current = await getGitHubFile();
      const stats = applyTrack(current.stats, track);
      await putGitHubFile({
        stats,
        sha: current.sha,
        message: `chore(polisur): clic ${track.kind}/${track.id}`,
      });
      return stats;
    } catch (err) {
      lastErr = err;
      if (err.statusCode !== 409) throw err;
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  const url = new URL(req.url || "/", "http://local");
  const action = url.searchParams.get("action") || "stats";

  try {
    if (req.method === "POST" && action === "track") {
      const body = await readBody(req);
      const track = normalizeTrack(body);
      const stats = await trackWithRetry(track);
      return json(res, 200, { ok: true, stats });
    }

    if (req.method === "GET" && action === "stats") {
      const clave = url.searchParams.get("clave") || "";
      assertClave(clave);
      const current = await getGitHubFile();
      return json(res, 200, { ok: true, stats: current.stats });
    }

    return json(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    return json(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en contadores.",
    });
  }
}
