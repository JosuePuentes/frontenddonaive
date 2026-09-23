import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";
import { POLISUR_UNITS } from "@/content/polisur-preinscripcion";

/** Contenido editable del portal POLISUR (contactos, redes, banner, noticias, divisiones). */

export type PolisurContactInfo = {
  address: string;
  phone: string;
  phoneAlt: string;
  email: string;
  hours: string;
  note: string;
};

export type PolisurSocialLinks = {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  whatsapp: string;
};

export type PolisurBannerTextSize = "sm" | "md" | "lg";
export type PolisurBannerPanelWidth = "compact" | "standard" | "wide";

export type PolisurBannerContent = {
  title: string;
  subtitle: string;
  message: string;
  ctaPrimary: string;
  ctaSecondary: string;
  imageUrl: string;
  /** Tamaño visual del título sobre la foto (default lg). */
  titleSize?: PolisurBannerTextSize;
  subtitleSize?: PolisurBannerTextSize;
  messageSize?: PolisurBannerTextSize;
  /** Ancho del bloque de texto sobre el hero. */
  panelWidth?: PolisurBannerPanelWidth;
};

export type PolisurNewsItem = {
  id: string;
  title: string;
  summary: string;
  body: string;
  /** Portada (primera imagen). */
  imageUrl: string;
  /** Galería de la noticia (incluye portada). */
  imageUrls: string[];
  publishedAt: string;
  published: boolean;
};

/** División / unidad selectable en preinscripción y opcionalmente en el home. */
export type PolisurUnitItem = {
  id: string;
  label: string;
  summary: string;
  /** Texto de funciones / labores de la división. */
  functions: string;
  imageUrl: string;
  /** Mostrar en el mosaico de divisiones del home. */
  showOnHome: boolean;
  /** Mostrar en la página pública /divisiones. */
  showInCatalog: boolean;
  featured: boolean;
  /** Disponible en el formulario de preinscripción. */
  active: boolean;
};

export type PolisurHomeLeadership = {
  eyebrow: string;
  rank: string;
  name: string;
  role: string;
  note: string;
};

export type PolisurHomeTextBlock = {
  title: string;
  body: string;
};

export type PolisurHomeSectionIntro = {
  eyebrow: string;
  title: string;
  body: string;
};

export type PolisurHomeAboutSection = PolisurHomeSectionIntro & {
  history: string;
  imageUrl: string;
  jurisdiction: string;
};

export type PolisurHomeDivisionsSection = PolisurHomeSectionIntro & {
  /** Alineación del encabezado sobre el mosaico de divisiones. */
  headerAlign: "left" | "center";
};

export type PolisurHomeCitizenSection = PolisurHomeSectionIntro & {
  pillars: string[];
  imageUrl: string;
};

export type PolisurHomePreinscripcionSection = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
};

export type PolisurHomeContent = {
  about: PolisurHomeAboutSection;
  leadership: PolisurHomeLeadership;
  mission: PolisurHomeTextBlock;
  vision: PolisurHomeTextBlock;
  values: PolisurHomeTextBlock & { items: string[] };
  functions: PolisurHomeTextBlock;
  divisions: PolisurHomeDivisionsSection;
  citizen: PolisurHomeCitizenSection;
  preinscripcion: PolisurHomePreinscripcionSection;
};

export type PolisurSiteContent = {
  updatedAt: string;
  contact: PolisurContactInfo;
  social: PolisurSocialLinks;
  banner: PolisurBannerContent;
  home: PolisurHomeContent;
  news: PolisurNewsItem[];
  units: PolisurUnitItem[];
};

const DEFAULT_UNIT_META: Record<
  string,
  Partial<
    Pick<
      PolisurUnitItem,
      "summary" | "functions" | "imageUrl" | "showOnHome" | "showInCatalog" | "featured"
    >
  >
> = {
  institucion: {
    summary: "",
    functions: "",
    imageUrl: "",
    showOnHome: false,
    showInCatalog: false,
    featured: false,
  },
  "unidad-canina": {
    summary:
      "Patrullaje canino y apoyo especializado con binomios entrenados al servicio de la institución.",
    functions:
      "Apoyo operativo, prevención y labores especializadas con el binomio policía-canino.",
    imageUrl: POLISUR_MEDIA.home.canina,
    showOnHome: true,
    showInCatalog: true,
    featured: false,
  },
  "unidades-operativas": {
    summary:
      "Patrullaje preventivo, orden público y respuesta operativa en las siete parroquias del municipio.",
    functions:
      "Patrullaje preventivo, orden público y respuesta operativa en las parroquias del municipio.",
    imageUrl: POLISUR_MEDIA.home.about,
    showOnHome: true,
    showInCatalog: true,
    featured: false,
  },
  prevencion: {
    summary:
      "Vinculación comunitaria, Mesas y Cuadrantes de Paz, y prevención para la convivencia ciudadana.",
    functions:
      "Organización comunitaria, Mesas y Cuadrantes de Paz, y prevención de la convivencia ciudadana.",
    imageUrl: POLISUR_MEDIA.home.ciudadania,
    showOnHome: true,
    showInCatalog: true,
    featured: false,
  },
};

export const POLISUR_DEFAULT_UNITS: PolisurUnitItem[] = POLISUR_UNITS.map(
  (unit) => {
    const meta = DEFAULT_UNIT_META[unit.id] ?? {};
    return {
      id: unit.id,
      label: unit.label,
      summary: meta.summary ?? "",
      functions: meta.functions ?? "",
      imageUrl: meta.imageUrl ?? "",
      showOnHome: Boolean(meta.showOnHome),
      showInCatalog: meta.showInCatalog !== false && unit.id !== "institucion",
      featured: Boolean(meta.featured),
      active: true,
    };
  },
);

export const POLISUR_HOME_DEFAULTS: PolisurHomeContent = {
  about: {
    eyebrow: polisurCopy.about.eyebrow,
    title: polisurCopy.about.title,
    body: polisurCopy.about.body,
    history: polisurCopy.about.history,
    imageUrl: POLISUR_MEDIA.home.about,
    jurisdiction: polisurCopy.brand.jurisdiction,
  },
  leadership: {
    eyebrow: polisurCopy.leadership.eyebrow,
    rank: polisurCopy.leadership.rank,
    name: polisurCopy.leadership.name,
    role: polisurCopy.leadership.role,
    note: polisurCopy.leadership.note,
  },
  mission: {
    title: polisurCopy.mission.title,
    body: polisurCopy.mission.body,
  },
  vision: {
    title: polisurCopy.vision.title,
    body: polisurCopy.vision.body,
  },
  values: {
    title: polisurCopy.values.title,
    body: "",
    items: [...polisurCopy.values.items],
  },
  functions: {
    title: polisurCopy.functions.title,
    body: polisurCopy.functions.body,
  },
  divisions: {
    eyebrow: polisurCopy.divisions.eyebrow,
    title: polisurCopy.divisions.title,
    body: polisurCopy.divisions.body,
    headerAlign: "center",
  },
  citizen: {
    eyebrow: polisurCopy.citizen.eyebrow,
    title: polisurCopy.citizen.title,
    body: polisurCopy.citizen.body,
    pillars: [...polisurCopy.citizen.pillars],
    imageUrl: POLISUR_MEDIA.home.ciudadania,
  },
  preinscripcion: {
    eyebrow: "Aspirantes",
    title: polisurCopy.preinscripcion.title,
    body: polisurCopy.preinscripcion.body,
    cta: polisurCopy.preinscripcion.cta,
  },
};

export const POLISUR_SITE_DEFAULTS: PolisurSiteContent = {
  updatedAt: "",
  contact: {
    address:
      "Municipio San Francisco, estado Zulia — República Bolivariana de Venezuela",
    phone: "",
    phoneAlt: "",
    email: "",
    hours:
      "Consulte en la institución los horarios y puntos de atención vigentes.",
    note: polisurCopy.footer.attentionNote,
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
    title: polisurCopy.hero.title,
    subtitle: polisurCopy.hero.subtitle,
    message: polisurCopy.hero.message,
    ctaPrimary: polisurCopy.hero.ctaPrimary,
    ctaSecondary: polisurCopy.hero.ctaSecondary,
    imageUrl: POLISUR_MEDIA.home.hero,
    titleSize: "md",
    subtitleSize: "md",
    messageSize: "md",
    panelWidth: "standard",
  },
  news: [],
  home: POLISUR_HOME_DEFAULTS,
  units: POLISUR_DEFAULT_UNITS,
};

function cleanStr(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeBannerTextSize(
  value: unknown,
  fallback: PolisurBannerTextSize,
): PolisurBannerTextSize {
  return value === "sm" || value === "md" || value === "lg" ? value : fallback;
}

function normalizeBannerPanelWidth(
  value: unknown,
  fallback: PolisurBannerPanelWidth,
): PolisurBannerPanelWidth {
  return value === "compact" || value === "standard" || value === "wide"
    ? value
    : fallback;
}

function cleanUrl(value: unknown, max = 400): string {
  const raw = cleanStr(value, max);
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

function cleanTextBlock(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "")
    .slice(0, max);
}

function cleanStringList(
  value: unknown,
  fallback: readonly string[],
  maxItems: number,
  maxLen: number,
): string[] {
  const fromArray = Array.isArray(value)
    ? value.map((item) => cleanStr(item, maxLen)).filter(Boolean)
    : [];
  const fromText =
    typeof value === "string"
      ? value
          .split("\n")
          .map((line) => cleanStr(line, maxLen))
          .filter(Boolean)
      : [];
  const merged = fromArray.length > 0 ? fromArray : fromText;
  const source = merged.length > 0 ? merged : [...fallback];
  const unique: string[] = [];
  for (const item of source) {
    if (!unique.includes(item)) unique.push(item);
  }
  return unique.slice(0, maxItems);
}

function normalizeHeaderAlign(
  value: unknown,
  fallback: PolisurHomeDivisionsSection["headerAlign"],
): PolisurHomeDivisionsSection["headerAlign"] {
  return value === "left" || value === "center" ? value : fallback;
}

function normalizePolisurHomeContent(
  raw: Partial<PolisurHomeContent> | null | undefined,
): PolisurHomeContent {
  const d = POLISUR_HOME_DEFAULTS;
  const about = raw?.about ?? d.about;
  const leadership = raw?.leadership ?? d.leadership;
  const mission = raw?.mission ?? d.mission;
  const vision = raw?.vision ?? d.vision;
  const values = raw?.values ?? d.values;
  const functions = raw?.functions ?? d.functions;
  const divisions = raw?.divisions ?? d.divisions;
  const citizen = raw?.citizen ?? d.citizen;
  const preinscripcion = raw?.preinscripcion ?? d.preinscripcion;

  return {
    about: {
      eyebrow: cleanStr(about.eyebrow, 80) || d.about.eyebrow,
      title: cleanStr(about.title, 160) || d.about.title,
      body: cleanTextBlock(about.body, 4000) || d.about.body,
      history: cleanTextBlock(about.history, 4000) || d.about.history,
      imageUrl: cleanUrl(about.imageUrl) || d.about.imageUrl,
      jurisdiction: cleanStr(about.jurisdiction, 160) || d.about.jurisdiction,
    },
    leadership: {
      eyebrow: cleanStr(leadership.eyebrow, 80) || d.leadership.eyebrow,
      rank: cleanStr(leadership.rank, 80) || d.leadership.rank,
      name: cleanStr(leadership.name, 120) || d.leadership.name,
      role: cleanStr(leadership.role, 80) || d.leadership.role,
      note: cleanTextBlock(leadership.note, 800) || d.leadership.note,
    },
    mission: {
      title: cleanStr(mission.title, 80) || d.mission.title,
      body: cleanTextBlock(mission.body, 2000) || d.mission.body,
    },
    vision: {
      title: cleanStr(vision.title, 80) || d.vision.title,
      body: cleanTextBlock(vision.body, 2000) || d.vision.body,
    },
    values: {
      title: cleanStr(values.title, 80) || d.values.title,
      body: cleanTextBlock(values.body, 500),
      items: cleanStringList(values.items, d.values.items, 12, 120),
    },
    functions: {
      title: cleanStr(functions.title, 80) || d.functions.title,
      body: cleanTextBlock(functions.body, 2000) || d.functions.body,
    },
    divisions: {
      eyebrow: cleanStr(divisions.eyebrow, 80) || d.divisions.eyebrow,
      title: cleanStr(divisions.title, 160) || d.divisions.title,
      body: cleanTextBlock(divisions.body, 1200) || d.divisions.body,
      headerAlign: normalizeHeaderAlign(divisions.headerAlign, d.divisions.headerAlign),
    },
    citizen: {
      eyebrow: cleanStr(citizen.eyebrow, 80) || d.citizen.eyebrow,
      title: cleanStr(citizen.title, 160) || d.citizen.title,
      body: cleanTextBlock(citizen.body, 2000) || d.citizen.body,
      pillars: cleanStringList(citizen.pillars, d.citizen.pillars, 8, 80),
      imageUrl: cleanUrl(citizen.imageUrl) || d.citizen.imageUrl,
    },
    preinscripcion: {
      eyebrow: cleanStr(preinscripcion.eyebrow, 80) || d.preinscripcion.eyebrow,
      title: cleanStr(preinscripcion.title, 160) || d.preinscripcion.title,
      body: cleanTextBlock(preinscripcion.body, 1200) || d.preinscripcion.body,
      cta: cleanStr(preinscripcion.cta, 60) || d.preinscripcion.cta,
    },
  };
}

export function slugifyPolisurUnitId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizePolisurNewsItem(
  raw: Partial<PolisurNewsItem> & { images?: string[] } | null | undefined,
  index = 0,
): PolisurNewsItem {
  const id =
    cleanStr(raw?.id, 64) ||
    `noticia-${Date.now().toString(36)}-${index}`;
  const fromList = Array.isArray(raw?.imageUrls)
    ? raw.imageUrls
    : Array.isArray(raw?.images)
      ? raw.images
      : [];
  const urls = [
    ...fromList.map((u) => cleanUrl(u)),
    cleanUrl(raw?.imageUrl),
  ].filter(Boolean);
  const unique: string[] = [];
  for (const url of urls) {
    if (!unique.includes(url)) unique.push(url);
  }
  const imageUrl = unique[0] || "";
  return {
    id,
    title: cleanStr(raw?.title, 160),
    summary: cleanTextBlock(raw?.summary, 800),
    body: cleanTextBlock(raw?.body, 12000),
    imageUrl,
    imageUrls: unique.slice(0, 12),
    publishedAt: cleanStr(raw?.publishedAt, 40) || new Date().toISOString(),
    published: Boolean(raw?.published),
  };
}

export function newsCoverUrl(item: PolisurNewsItem): string {
  return item.imageUrl || item.imageUrls[0] || "";
}

export function normalizePolisurUnitItem(
  raw: Partial<PolisurUnitItem> | null | undefined,
  index = 0,
): PolisurUnitItem {
  const label = cleanStr(raw?.label, 120);
  const id =
    slugifyPolisurUnitId(cleanStr(raw?.id, 40)) ||
    slugifyPolisurUnitId(label) ||
    `unidad-${index + 1}`;
  const isInstitucion = id === "institucion";
  return {
    id,
    label,
    summary: cleanStr(raw?.summary, 400),
    functions: cleanStr(raw?.functions, 2000),
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

export function mergePolisurSiteContent(
  raw: Partial<PolisurSiteContent> | null | undefined,
): PolisurSiteContent {
  const contact: Partial<PolisurContactInfo> = raw?.contact ?? {};
  const social: Partial<PolisurSocialLinks> = raw?.social ?? {};
  const banner: Partial<PolisurBannerContent> = raw?.banner ?? {};
  const newsIn = Array.isArray(raw?.news) ? raw.news : [];
  const unitsIn = Array.isArray(raw?.units) ? raw.units : null;

  const units = (unitsIn && unitsIn.length > 0 ? unitsIn : POLISUR_DEFAULT_UNITS)
    .slice(0, 40)
    .map((item, i) => normalizePolisurUnitItem(item, i))
    .filter((u) => u.label);

  // Ensure unique ids
  const seen = new Set<string>();
  const uniqueUnits = units.map((unit, i) => {
    let id = unit.id;
    if (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { ...unit, id };
  });

  return {
    updatedAt: cleanStr(raw?.updatedAt, 40),
    contact: {
      address:
        cleanStr(contact.address, 240) || POLISUR_SITE_DEFAULTS.contact.address,
      phone: cleanStr(contact.phone, 40),
      phoneAlt: cleanStr(contact.phoneAlt, 40),
      email: cleanStr(contact.email, 120).toLowerCase(),
      hours: cleanStr(contact.hours, 240) || POLISUR_SITE_DEFAULTS.contact.hours,
      note: cleanStr(contact.note, 600) || POLISUR_SITE_DEFAULTS.contact.note,
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
      title: cleanStr(banner.title, 80) || POLISUR_SITE_DEFAULTS.banner.title,
      subtitle:
        cleanStr(banner.subtitle, 160) || POLISUR_SITE_DEFAULTS.banner.subtitle,
      message:
        cleanStr(banner.message, 600) || POLISUR_SITE_DEFAULTS.banner.message,
      ctaPrimary:
        cleanStr(banner.ctaPrimary, 60) ||
        POLISUR_SITE_DEFAULTS.banner.ctaPrimary,
      ctaSecondary:
        cleanStr(banner.ctaSecondary, 60) ||
        POLISUR_SITE_DEFAULTS.banner.ctaSecondary,
      imageUrl:
        cleanUrl(banner.imageUrl) || POLISUR_SITE_DEFAULTS.banner.imageUrl,
      titleSize: normalizeBannerTextSize(banner.titleSize, "md"),
      subtitleSize: normalizeBannerTextSize(banner.subtitleSize, "md"),
      messageSize: normalizeBannerTextSize(banner.messageSize, "md"),
      panelWidth: normalizeBannerPanelWidth(banner.panelWidth, "standard"),
    },
    news: newsIn
      .slice(0, 50)
      .map((item, i) => normalizePolisurNewsItem(item, i))
      .filter((n) => n.title),
    home: normalizePolisurHomeContent(raw?.home),
    units: uniqueUnits,
  };
}

export function publishedPolisurNews(
  site: PolisurSiteContent,
): PolisurNewsItem[] {
  return site.news
    .filter((n) => n.published && n.title)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
}

export function activePolisurUnits(site: PolisurSiteContent): PolisurUnitItem[] {
  return site.units.filter((u) => u.active && u.label);
}

export function homePolisurUnits(site: PolisurSiteContent): PolisurUnitItem[] {
  return site.units.filter((u) => u.showOnHome && u.label);
}

/** Divisiones visibles en /divisiones (catálogo). */
export function catalogPolisurUnits(site: PolisurSiteContent): PolisurUnitItem[] {
  return site.units.filter((u) => u.showInCatalog && u.label);
}

export function hasPolisurSocial(social: PolisurSocialLinks): boolean {
  return Boolean(
    social.facebook ||
      social.instagram ||
      social.twitter ||
      social.youtube ||
      social.tiktok ||
      social.whatsapp,
  );
}
