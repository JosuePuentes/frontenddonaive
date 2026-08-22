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

export type PolisurBannerContent = {
  title: string;
  subtitle: string;
  message: string;
  ctaPrimary: string;
  ctaSecondary: string;
  imageUrl: string;
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

export type PolisurSiteContent = {
  updatedAt: string;
  contact: PolisurContactInfo;
  social: PolisurSocialLinks;
  banner: PolisurBannerContent;
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
  },
  news: [],
  units: POLISUR_DEFAULT_UNITS,
};

function cleanStr(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
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
    summary: cleanStr(raw?.summary, 500),
    body: cleanStr(raw?.body, 12000),
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
    },
    news: newsIn
      .slice(0, 50)
      .map((item, i) => normalizePolisurNewsItem(item, i))
      .filter((n) => n.title),
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
