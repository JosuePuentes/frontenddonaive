/**
 * Modelo de Diseño Web A&D (Fase 10.3).
 * Preparado para sustituir localStorage por API sin rehacer la UI.
 */

export type AdHeroAlign = "left" | "center" | "right";

export type AdHomeSectionId =
  | "hero"
  | "about"
  | "featured"
  | "categories"
  | "promotions"
  | "banners"
  | "gallery"
  | "services"
  | "location"
  | "hours"
  | "contact"
  | "social"
  | "footer";

export type AdHomeSection = {
  id: AdHomeSectionId;
  label: string;
  visible: boolean;
  order: number;
};

export type AdSiteBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** Imagen alternativa para móvil. */
  imageUrlMobile?: string;
  ctaLabel?: string;
  ctaHref?: string;
  active: boolean;
  order: number;
  position?: string;
  startsAt?: string;
  endsAt?: string;
};

export type AdGalleryItem = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  order: number;
  active: boolean;
};

export type AdFooterLink = {
  id: string;
  label: string;
  href: string;
};

export type AdSiteColors = {
  /** Alias legado / acento principal (oro). */
  gold: string;
  /** Alias legado / secundario (borgoña). */
  burgundy: string;
  primary: string;
  secondary: string;
  bg: string;
  bgAlt: string;
  panel: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
  button: string;
  buttonHover: string;
};

export type AdTypographyPreset = "classic" | "modern" | "elegant";

export type AdSiteTypography = {
  /** Preset seguro (sin CDN externo obligatorio). */
  preset: AdTypographyPreset;
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  /** Escala relativa: 0.9 | 1 | 1.1 */
  scale: number;
};

export type AdSiteBrand = {
  commercialName: string;
  shortName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  logoAltUrl: string;
  faviconUrl: string;
  socialImageUrl: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  schedule: string;
  legalText: string;
  showPhone: boolean;
  showWhatsapp: boolean;
  showAddress: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showTiktok: boolean;
  showSchedule: boolean;
};

export type AdSiteHero = {
  backgroundUrl: string;
  videoUrl: string;
  overlay: string;
  title: string;
  subtitle: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  primaryVisible: boolean;
  secondaryLabel: string;
  secondaryHref: string;
  secondaryVisible: boolean;
  align: AdHeroAlign;
};

export type AdFeaturedProductsConfig = {
  enabled: boolean;
  count: number;
  title: string;
  subtitle: string;
  showImage: boolean;
  showPrice: boolean;
  showButton: boolean;
  buttonLabel: string;
  linkHref: string;
  /** IDs opcionales; vacío = primeros N del catálogo demo. */
  productIds: string[];
};

export type AdSitePopup = {
  enabled: boolean;
  imageUrl: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
  oncePerSession: boolean;
  startsAt: string;
  endsAt: string;
};

export type AdSiteFooter = {
  logoUrl: string;
  description: string;
  phone: string;
  whatsapp: string;
  address: string;
  schedule: string;
  showSocial: boolean;
  links: AdFooterLink[];
  copyright: string;
  legalText: string;
};

export type AdSiteSeo = {
  title: string;
  description: string;
  keywords: string;
  socialImageUrl: string;
  faviconUrl: string;
};

/**
 * Documento de diseño completo.
 * Campos planos brandName/… se mantienen como mirrors para BrandMark / CSS legado.
 */
export type AdSiteDesign = {
  version: 2;
  brand: AdSiteBrand;
  colors: AdSiteColors;
  typography: AdSiteTypography;
  hero: AdSiteHero;
  sections: AdHomeSection[];
  featuredProducts: AdFeaturedProductsConfig;
  banners: AdSiteBanner[];
  popup: AdSitePopup;
  gallery: AdGalleryItem[];
  footer: AdSiteFooter;
  seo: AdSiteSeo;
  /** Mirrors planos (compat BrandMark / Home legado). */
  brandName: string;
  brandTagline: string;
  brandDescription: string;
  logoUrl: string;
  faviconUrl: string;
  homeBackgroundUrl: string;
  homeBackgroundOverlay: string;
  homeHeroEyebrow: string;
  homePrimaryCta: string;
  homeSecondaryCta: string;
  homeTertiaryCta: string;
  updatedAt?: string;
  updatedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
};

export type AdDesignStore = {
  draft: AdSiteDesign;
  published: AdSiteDesign;
};

export const AD_TYPOGRAPHY_PRESETS: Record<
  AdTypographyPreset,
  Pick<AdSiteTypography, "headingFont" | "bodyFont">
> = {
  classic: {
    headingFont: '"Cormorant Garamond", Georgia, serif',
    bodyFont: '"DM Sans", system-ui, sans-serif',
  },
  modern: {
    headingFont: '"DM Sans", system-ui, sans-serif',
    bodyFont: '"DM Sans", system-ui, sans-serif',
  },
  elegant: {
    headingFont: '"Cormorant Garamond", Georgia, serif',
    bodyFont: '"Cormorant Garamond", Georgia, serif',
  },
};

export const AD_HOME_SECTION_LABELS: Record<AdHomeSectionId, string> = {
  hero: "Hero",
  about: "Nosotros",
  featured: "Productos destacados",
  categories: "Categorías",
  promotions: "Promociones",
  banners: "Banners",
  gallery: "Galería",
  services: "Servicios",
  location: "Ubicación",
  hours: "Horarios",
  contact: "Contacto",
  social: "Redes sociales",
  footer: "Footer",
};
