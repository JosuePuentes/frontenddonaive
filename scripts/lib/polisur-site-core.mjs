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
      featured: false,
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
  home: {
    about: {
      eyebrow: "Nuestra institución",
      title: "Pilar de seguridad ciudadana en San Francisco",
      body:
        "POLISUR es el Instituto Autónomo Policía del Municipio San Francisco. Desde su fundación, el 18 de abril de 1996, la institución ha sostenido una labor continua de protección, orden público y convivencia ciudadana en la jurisdicción sanfranciscana, consolidándose como referencia de seguridad en la región zuliana.",
      history:
        "En 2026 la institución conmemoró su trigésimo aniversario, reafirmando el compromiso de hombres y mujeres que, con convicción y mística de servicio, trabajan por la tranquilidad del municipio. Con el apoyo de la Alcaldía y la comunidad, POLISUR ha fortalecido su despliegue mediante dotación de unidades patrulleras, equipos de comunicación y organización comunitaria a través de Cuadrantes de Paz.",
      imageUrl: "/polisur/home/about.jpg",
      jurisdiction: "Municipio San Francisco · Estado Zulia · Venezuela",
    },
    leadership: {
      eyebrow: "Dirección general",
      rank: "Primer Comisario",
      name: "Lisimaco Alberto Quintanillo López",
      role: "Director General",
      note:
        "Director General del Instituto Autónomo Policía Municipal de San Francisco (POLISUR).",
    },
    mission: {
      title: "Misión",
      body:
        "Prestar un servicio de seguridad fundamentado en educar, proteger y servir a las comunidades; garantizando credibilidad y bienestar social, para mejorar la calidad de vida de quienes residen en el municipio San Francisco, con criterios éticos, morales y sociales.",
    },
    vision: {
      title: "Visión",
      body:
        "Consolidarse como una institución modelo reconocida por su proactividad y calidad de servicio a las comunidades; con un alto nivel de profesionalismo, brindando respuestas eficaces en materia de defensa y apoyo social, ofreciendo valor agregado a la gestión pública municipal.",
    },
    values: {
      title: "Valores institucionales",
      body: "",
      items: [
        "Respeto, libertad y justicia",
        "Imparcialidad y rectitud",
        "Disciplina, lealtad y obediencia institucional",
        "Dedicación y servicio oportuno",
        "Trabajo en equipo con la comunidad",
      ],
    },
    functions: {
      title: "Funciones",
      body:
        "Velar por la seguridad de las personas y los bienes, el mantenimiento de la moralidad, la salubridad, el urbanismo, el turismo, la defensa del ambiente, el tránsito y el orden público en la jurisdicción municipal, con patrullaje preventivo y atención ciudadana responsable.",
    },
    divisions: {
      eyebrow: "Organización",
      title: "Nuestras divisiones",
      body:
        "POLISUR organiza su labor en unidades operativas, especialidades y programas de prevención y cercanía ciudadana, con despliegue en las parroquias del municipio San Francisco.",
      headerAlign: "center",
    },
    citizen: {
      eyebrow: "Ciudadanía",
      title: "Al servicio de nuestra ciudadanía",
      body:
        "La relación con la comunidad se sustenta en el respeto, la información transparente y la organización en Mesas y Cuadrantes de Paz, como vía para atender necesidades de seguridad y convivencia junto a los vecinos del municipio.",
      pillars: ["Servicio", "Prevención", "Seguridad", "Cuadrantes de Paz"],
      imageUrl: "/polisur/home/ciudadania.jpg",
    },
    preinscripcion: {
      eyebrow: "Aspirantes",
      title: "¿Quieres formar parte de POLISUR?",
      body:
        "Complete el formulario institucional con sus datos de contacto y la unidad a la que desea pertenecer.",
      cta: "Realizar preinscripción",
    },
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

function cleanTextBlock(value, max) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "")
    .slice(0, max);
}

function cleanStringList(value, fallback, maxItems, maxLen) {
  const fromArray = Array.isArray(value)
    ? value.map((item) => clean(item, maxLen)).filter(Boolean)
    : [];
  const merged =
    fromArray.length > 0
      ? fromArray
      : typeof value === "string"
        ? value
            .split("\n")
            .map((line) => clean(line, maxLen))
            .filter(Boolean)
        : [];
  const source = merged.length > 0 ? merged : fallback;
  const unique = [];
  for (const item of source) {
    if (!unique.includes(item)) unique.push(item);
  }
  return unique.slice(0, maxItems);
}

function normalizeHome(raw) {
  const d = DEFAULTS.home;
  const about = raw?.about || {};
  const leadership = raw?.leadership || {};
  const mission = raw?.mission || {};
  const vision = raw?.vision || {};
  const values = raw?.values || {};
  const functions = raw?.functions || {};
  const divisions = raw?.divisions || {};
  const citizen = raw?.citizen || {};
  const preinscripcion = raw?.preinscripcion || {};
  return {
    about: {
      eyebrow: clean(about.eyebrow, 80) || d.about.eyebrow,
      title: clean(about.title, 160) || d.about.title,
      body: cleanTextBlock(about.body, 4000) || d.about.body,
      history: cleanTextBlock(about.history, 4000) || d.about.history,
      imageUrl: cleanUrl(about.imageUrl) || d.about.imageUrl,
      jurisdiction: clean(about.jurisdiction, 160) || d.about.jurisdiction,
    },
    leadership: {
      eyebrow: clean(leadership.eyebrow, 80) || d.leadership.eyebrow,
      rank: clean(leadership.rank, 80) || d.leadership.rank,
      name: clean(leadership.name, 120) || d.leadership.name,
      role: clean(leadership.role, 80) || d.leadership.role,
      note: cleanTextBlock(leadership.note, 800) || d.leadership.note,
    },
    mission: {
      title: clean(mission.title, 80) || d.mission.title,
      body: cleanTextBlock(mission.body, 2000) || d.mission.body,
    },
    vision: {
      title: clean(vision.title, 80) || d.vision.title,
      body: cleanTextBlock(vision.body, 2000) || d.vision.body,
    },
    values: {
      title: clean(values.title, 80) || d.values.title,
      body: cleanTextBlock(values.body, 500),
      items: cleanStringList(values.items, d.values.items, 12, 120),
    },
    functions: {
      title: clean(functions.title, 80) || d.functions.title,
      body: cleanTextBlock(functions.body, 2000) || d.functions.body,
    },
    divisions: {
      eyebrow: clean(divisions.eyebrow, 80) || d.divisions.eyebrow,
      title: clean(divisions.title, 160) || d.divisions.title,
      body: cleanTextBlock(divisions.body, 1200) || d.divisions.body,
      headerAlign:
        divisions.headerAlign === "left" || divisions.headerAlign === "center"
          ? divisions.headerAlign
          : d.divisions.headerAlign,
    },
    citizen: {
      eyebrow: clean(citizen.eyebrow, 80) || d.citizen.eyebrow,
      title: clean(citizen.title, 160) || d.citizen.title,
      body: cleanTextBlock(citizen.body, 2000) || d.citizen.body,
      pillars: cleanStringList(citizen.pillars, d.citizen.pillars, 8, 80),
      imageUrl: cleanUrl(citizen.imageUrl) || d.citizen.imageUrl,
    },
    preinscripcion: {
      eyebrow: clean(preinscripcion.eyebrow, 80) || d.preinscripcion.eyebrow,
      title: clean(preinscripcion.title, 160) || d.preinscripcion.title,
      body: cleanTextBlock(preinscripcion.body, 1200) || d.preinscripcion.body,
      cta: clean(preinscripcion.cta, 60) || d.preinscripcion.cta,
    },
  };
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

function normalizeBannerSize(value, fallback) {
  return value === "sm" || value === "md" || value === "lg" ? value : fallback;
}

function normalizePanelWidth(value, fallback) {
  return value === "compact" || value === "standard" || value === "wide"
    ? value
    : fallback;
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
    summary: cleanTextBlock(raw?.summary, 800),
    body: cleanTextBlock(raw?.body, 12000),
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
      titleSize: normalizeBannerSize(banner.titleSize, "md"),
      subtitleSize: normalizeBannerSize(banner.subtitleSize, "md"),
      messageSize: normalizeBannerSize(banner.messageSize, "md"),
      panelWidth: normalizePanelWidth(banner.panelWidth, "standard"),
    },
    news: newsIn
      .slice(0, 50)
      .map((item, i) => normalizeNews(item, i))
      .filter((n) => n.title),
    home: normalizeHome(raw?.home),
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
