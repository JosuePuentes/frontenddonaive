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
      "Tres décadas al servicio del pueblo sanfranciscano: educar, proteger y servir con disciplina.\n\nNuestro lema es Defender y Proteger a Nuestro Pueblo",
    ctaPrimary: "Conoce la institución",
    ctaSecondary: "Preinscripción",
    imageUrl: "/polisur/home/hero.jpg",
  },
  news: [],
  units: [
    {
      id: "institucion",
      label: "POLISUR — Institución",
      summary: "",
      functions: "",
      imageUrl: "",
      showOnHome: false,
      showInCatalog: false,
      featured: false,
      active: true,
    },
    {
      id: "unidad-canina",
      label: "Unidad Canina",
      summary:
        "Patrullaje canino y apoyo especializado con binomios entrenados al servicio de la institución.",
      functions:
        "Apoyo operativo, prevención y labores especializadas con el binomio policía-canino.",
      imageUrl: "/polisur/home/canina.jpg",
      showOnHome: true,
      showInCatalog: true,
      featured: true,
      active: true,
    },
    {
      id: "unidades-operativas",
      label: "Unidades operativas",
      summary:
        "Patrullaje preventivo, orden público y respuesta operativa en las siete parroquias del municipio.",
      functions:
        "Patrullaje preventivo, orden público y respuesta operativa en las parroquias del municipio.",
      imageUrl: "/polisur/home/about.jpg",
      showOnHome: true,
      showInCatalog: true,
      featured: false,
      active: true,
    },
    {
      id: "prevencion",
      label: "Prevención y cercanía",
      summary:
        "Vinculación comunitaria, Mesas y Cuadrantes de Paz, y prevención para la convivencia ciudadana.",
      functions:
        "Organización comunitaria, Mesas y Cuadrantes de Paz, y prevención de la convivencia ciudadana.",
      imageUrl: "/polisur/home/ciudadania.jpg",
      showOnHome: true,
      showInCatalog: true,
      featured: false,
      active: true,
    },
  ],
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

function slugifyId(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function normalizeUnit(raw, index) {
  const label = clean(raw?.label, 120);
  const id =
    slugifyId(clean(raw?.id, 40)) ||
    slugifyId(label) ||
    `unidad-${index + 1}`;
  const isInstitucion = id === "institucion";
  return {
    id,
    label,
    summary: clean(raw?.summary, 400),
    functions: clean(raw?.functions, 2000),
    imageUrl: cleanUrl(raw?.imageUrl),
    showOnHome: Boolean(raw?.showOnHome),
    showInCatalog:
      raw?.showInCatalog !== undefined
        ? Boolean(raw.showInCatalog)
        : !isInstitucion,
    featured: Boolean(raw?.featured),
    active: raw?.active !== false,
  };
}

function normalizeNews(raw, index) {
  const fromList = Array.isArray(raw?.imageUrls)
    ? raw.imageUrls
    : Array.isArray(raw?.images)
      ? raw.images
      : [];
  const urls = [];
  for (const u of [...fromList, raw?.imageUrl]) {
    const cleaned = cleanUrl(u);
    if (cleaned && !urls.includes(cleaned)) urls.push(cleaned);
  }
  return {
    id: clean(raw?.id, 64) || `noticia-${Date.now().toString(36)}-${index}`,
    title: clean(raw?.title, 160),
    summary: clean(raw?.summary, 500),
    body: clean(raw?.body, 12000),
    imageUrl: urls[0] || "",
    imageUrls: urls.slice(0, 12),
    publishedAt: clean(raw?.publishedAt, 40) || new Date().toISOString(),
    published: Boolean(raw?.published),
  };
}

export function normalizeSite(raw) {
  const contact = raw?.contact || {};
  const social = raw?.social || {};
  const banner = raw?.banner || {};
  const newsIn = Array.isArray(raw?.news) ? raw.news : [];
  const unitsIn = Array.isArray(raw?.units) ? raw.units : null;
  const unitsSource =
    unitsIn && unitsIn.length > 0 ? unitsIn : DEFAULTS.units;

  const units = [];
  const seen = new Set();
  unitsSource.slice(0, 40).forEach((item, i) => {
    const unit = normalizeUnit(item, i);
    if (!unit.label) return;
    let id = unit.id;
    if (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    units.push({ ...unit, id });
  });

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
    units,
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
