/**
 * Contenido editable del portal POLISUR (contactos, redes, banner, noticias).
 * GET  action=get   — público
 * POST action=save  — clave institucional
 *
 * Secrets: POLISUR_MEDIOS_CLAVE, GITHUB_TOKEN
 * opcionales: POLISUR_MEDIOS_BRANCH, POLISUR_MEDIOS_REPO, POLISUR_SITE_BRANCH
 */

const STORE_PATH = "data/polisur-site.json";

const DEFAULTS = {
  updatedAt: "",
  contact: {
    address:
      "Municipio San Francisco, estado Zulia — República Bolivariana de Venezuela",
    phone: "",
    phoneAlt: "",
    email: "",
    hours:
      "Consulte en la institución los horarios y puntos de atención vigentes.",
    note: "POLISUR mantiene canales de atención y patrullaje preventivo en el municipio San Francisco. Consulte en la institución los horarios y puntos de atención vigentes.",
  },
  social: {
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    whatsapp: "",
  },
  banner: {
    title: "POLISUR",
    subtitle: "Instituto Autónomo Policía del Municipio San Francisco",
    message:
      "Tres décadas al servicio del pueblo sanfranciscano: educar, proteger y servir con disciplina.\n\nNuestro lema es Defender y Proteger a Nuestro Pueblo",
    ctaPrimary: "Conoce la institución",
    ctaSecondary: "Preinscripción",
    imageUrl: "/polisur/home/hero.jpg",
  },
  news: [],
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
    branch:
      process.env.POLISUR_SITE_BRANCH ||
      process.env.POLISUR_PREINSCRIPCIONES_BRANCH ||
      "main",
    token: process.env.GITHUB_TOKEN || "",
  };
}

function clean(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanUrl(value, max = 400) {
  const raw = clean(value, max);
  if (!raw) return "";
  if (
    raw.startsWith("/") ||
    raw.startsWith("https://") ||
    raw.startsWith("http://")
  ) {
    return raw;
  }
  return "";
}

function normalizeNews(raw, index) {
  return {
    id: clean(raw?.id, 64) || `noticia-${Date.now().toString(36)}-${index}`,
    title: clean(raw?.title, 160),
    summary: clean(raw?.summary, 400),
    body: clean(raw?.body, 4000),
    imageUrl: cleanUrl(raw?.imageUrl),
    publishedAt: clean(raw?.publishedAt, 40) || new Date().toISOString(),
    published: Boolean(raw?.published),
  };
}

function normalizeSite(raw) {
  const contact = raw?.contact || {};
  const social = raw?.social || {};
  const banner = raw?.banner || {};
  const newsIn = Array.isArray(raw?.news) ? raw.news : [];

  return {
    updatedAt: clean(raw?.updatedAt, 40),
    contact: {
      address: clean(contact.address, 240) || DEFAULTS.contact.address,
      phone: clean(contact.phone, 40),
      phoneAlt: clean(contact.phoneAlt, 40),
      email: clean(contact.email, 120).toLowerCase(),
      hours: clean(contact.hours, 240) || DEFAULTS.contact.hours,
      note: clean(contact.note, 600) || DEFAULTS.contact.note,
    },
    social: {
      facebook: cleanUrl(social.facebook),
      instagram: cleanUrl(social.instagram),
      twitter: cleanUrl(social.twitter),
      youtube: cleanUrl(social.youtube),
      tiktok: cleanUrl(social.tiktok),
      whatsapp: cleanUrl(social.whatsapp),
    },
    banner: {
      title: clean(banner.title, 80) || DEFAULTS.banner.title,
      subtitle: clean(banner.subtitle, 160) || DEFAULTS.banner.subtitle,
      message: clean(banner.message, 600) || DEFAULTS.banner.message,
      ctaPrimary: clean(banner.ctaPrimary, 60) || DEFAULTS.banner.ctaPrimary,
      ctaSecondary:
        clean(banner.ctaSecondary, 60) || DEFAULTS.banner.ctaSecondary,
      imageUrl: cleanUrl(banner.imageUrl) || DEFAULTS.banner.imageUrl,
    },
    news: newsIn
      .slice(0, 50)
      .map((item, i) => normalizeNews(item, i))
      .filter((n) => n.title),
  };
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
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_PATH}?ref=${encodeURIComponent(branch)}`;
  const headers = {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(api, { headers });
  if (res.status === 404) {
    return { sha: null, site: normalizeSite(DEFAULTS), fromGithub: Boolean(token) };
  }
  if (!res.ok) {
    // Sin token o error: servir defaults (el portal sigue visible).
    if (!token) {
      return { sha: null, site: normalizeSite(DEFAULTS), fromGithub: false };
    }
    const text = await res.text();
    const err = new Error(`GitHub no leyó el sitio (${res.status}): ${text}`);
    err.statusCode = 502;
    throw err;
  }
  const data = await res.json();
  let site = normalizeSite(DEFAULTS);
  try {
    const decoded = Buffer.from(data.content || "", "base64").toString("utf8");
    site = normalizeSite(JSON.parse(decoded));
  } catch {
    site = normalizeSite(DEFAULTS);
  }
  return { sha: data.sha || null, site, fromGithub: true };
}

async function putGitHubFile({ site, sha, message }) {
  const { repo, branch, token } = githubConfig();
  if (!token) {
    const err = new Error(
      "Falta GITHUB_TOKEN para guardar el contenido del sitio.",
    );
    err.statusCode = 503;
    throw err;
  }
  const api = `https://api.github.com/repos/${repo}/contents/${STORE_PATH}`;
  const content = Buffer.from(`${JSON.stringify(site, null, 2)}\n`).toString(
    "base64",
  );
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
      `GitHub no guardó el sitio (${res.status}): ${text}`,
    );
    err.statusCode = res.status === 409 ? 409 : 502;
    throw err;
  }
}

async function saveWithRetry(incoming) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const current = await getGitHubFile();
      const site = normalizeSite({
        ...incoming,
        updatedAt: new Date().toISOString(),
      });
      await putGitHubFile({
        site,
        sha: current.sha,
        message: "chore(polisur): actualizar contenido del portal",
      });
      return site;
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
  const action = url.searchParams.get("action") || "get";

  try {
    if (req.method === "GET" && action === "get") {
      const current = await getGitHubFile();
      return json(res, 200, { ok: true, site: current.site });
    }

    if (req.method === "POST" && action === "save") {
      const body = await readBody(req);
      assertClave(body.clave || "");
      const site = await saveWithRetry(body.site || DEFAULTS);
      return json(res, 200, { ok: true, site });
    }

    return json(res, 404, { ok: false, error: "Acción no encontrada." });
  } catch (err) {
    return json(res, err.statusCode || 500, {
      ok: false,
      error: err.message || "Error en contenido del sitio.",
    });
  }
}
