/**
 * Persistencia local del contenido editable del portal POLISUR.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const STORE_REL = "data/polisur-site.json";

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
      "Tres décadas al servicio del pueblo sanfranciscano: educar, proteger y servir con disciplina, prevención y presencia en las siete parroquias del municipio.",
    ctaPrimary: "Conoce la institución",
    ctaSecondary: "Preinscripción",
    imageUrl: "/polisur/home/hero.jpg",
  },
  news: [],
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

export function normalizeSite(raw) {
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

export function defaultSite() {
  return normalizeSite(DEFAULTS);
}

function storePath(root) {
  return resolve(root, STORE_REL);
}

export function readStore(root) {
  const file = storePath(root);
  if (!existsSync(file)) return defaultSite();
  try {
    return normalizeSite(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return defaultSite();
  }
}

export function writeStore(root, site) {
  const normalized = normalizeSite({
    ...site,
    updatedAt: new Date().toISOString(),
  });
  const file = storePath(root);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}
