import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

/** Contenido editable del portal POLISUR (contactos, redes, banner, noticias). */

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
  imageUrl: string;
  publishedAt: string;
  published: boolean;
};

export type PolisurSiteContent = {
  updatedAt: string;
  contact: PolisurContactInfo;
  social: PolisurSocialLinks;
  banner: PolisurBannerContent;
  news: PolisurNewsItem[];
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
  },
  news: [],
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

export function normalizePolisurNewsItem(
  raw: Partial<PolisurNewsItem> | null | undefined,
  index = 0,
): PolisurNewsItem {
  const id =
    cleanStr(raw?.id, 64) ||
    `noticia-${Date.now().toString(36)}-${index}`;
  return {
    id,
    title: cleanStr(raw?.title, 160),
    summary: cleanStr(raw?.summary, 400),
    body: cleanStr(raw?.body, 4000),
    imageUrl: cleanUrl(raw?.imageUrl),
    publishedAt: cleanStr(raw?.publishedAt, 40) || new Date().toISOString(),
    published: Boolean(raw?.published),
  };
}

export function mergePolisurSiteContent(
  raw: Partial<PolisurSiteContent> | null | undefined,
): PolisurSiteContent {
  const contact: Partial<PolisurContactInfo> = raw?.contact ?? {};
  const social: Partial<PolisurSocialLinks> = raw?.social ?? {};
  const banner: Partial<PolisurBannerContent> = raw?.banner ?? {};
  const newsIn = Array.isArray(raw?.news) ? raw.news : [];

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
  };
}

export function publishedPolisurNews(
  site: PolisurSiteContent,
): PolisurNewsItem[] {
  return site.news
    .filter((n) => n.published && n.title)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
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
