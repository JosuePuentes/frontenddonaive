/**
 * Diseño visual del portal A&D (mock admin).
 * Persiste en localStorage; no toca API/Prisma.
 */
import { AD_LICORERIA_MEDIA, adLicoreriaBrand } from "@/content/ad-licoreria/brand";

export type AdSiteBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  active: boolean;
  order: number;
};

export type AdSiteColors = {
  bg: string;
  panel: string;
  gold: string;
  burgundy: string;
  text: string;
  muted: string;
  success: string;
  danger: string;
};

export type AdSiteDesign = {
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
  colors: AdSiteColors;
  banners: AdSiteBanner[];
  updatedAt?: string;
  updatedBy?: string;
};

export const AD_SITE_DESIGN_STORAGE_KEY = "ad-licoreria-site-design-v1";

export const AD_DEFAULT_SITE_DESIGN: AdSiteDesign = {
  brandName: adLicoreriaBrand.name,
  brandTagline: adLicoreriaBrand.tagline,
  brandDescription: adLicoreriaBrand.description,
  logoUrl: AD_LICORERIA_MEDIA.logo,
  faviconUrl: AD_LICORERIA_MEDIA.logo,
  homeBackgroundUrl: "",
  homeBackgroundOverlay: "rgba(10, 11, 15, 0.72)",
  homeHeroEyebrow: "Portal operativo",
  homePrimaryCta: "Entrar al inicio",
  homeSecondaryCta: "Abrir ventas",
  homeTertiaryCta: "Vista mesonera",
  colors: {
    bg: "#0a0b0f",
    panel: "#171a24",
    gold: "#d4af6a",
    burgundy: "#6b1e2a",
    text: "#f4efe6",
    muted: "#9a9388",
    success: "#3d9b6e",
    danger: "#c44b5a",
  },
  banners: [
    {
      id: "bn-1",
      title: "Bienvenido a A&D",
      subtitle: "Licorería & Bodegón · operación unificada",
      imageUrl: "",
      ctaLabel: "Ver operaciones",
      ctaHref: "/licoreria/inicio",
      active: true,
      order: 1,
    },
  ],
};

export function loadSiteDesignFromStorage(): AdSiteDesign | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(AD_SITE_DESIGN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdSiteDesign;
    return {
      ...AD_DEFAULT_SITE_DESIGN,
      ...parsed,
      colors: { ...AD_DEFAULT_SITE_DESIGN.colors, ...parsed.colors },
      banners: Array.isArray(parsed.banners)
        ? parsed.banners
        : AD_DEFAULT_SITE_DESIGN.banners,
    };
  } catch {
    return null;
  }
}

export function saveSiteDesignToStorage(design: AdSiteDesign) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(AD_SITE_DESIGN_STORAGE_KEY, JSON.stringify(design));
  } catch {
    /* quota / private mode */
  }
}

/** Aplica tokens CSS al shell A&D. */
export function applySiteDesignToDom(design: AdSiteDesign) {
  if (typeof document === "undefined") return;
  const root =
    (document.querySelector(".ad-shell") as HTMLElement | null) ??
    document.documentElement;
  const c = design.colors;
  root.style.setProperty("--ad-bg", c.bg);
  root.style.setProperty("--ad-bg-elevated", c.bg);
  root.style.setProperty("--ad-bg-panel", c.panel);
  root.style.setProperty("--ad-gold", c.gold);
  root.style.setProperty("--ad-gold-soft", c.gold);
  root.style.setProperty("--ad-burgundy", c.burgundy);
  root.style.setProperty("--ad-burgundy-soft", c.burgundy);
  root.style.setProperty("--ad-text", c.text);
  root.style.setProperty("--ad-muted", c.muted);
  root.style.setProperty("--ad-success", c.success);
  root.style.setProperty("--ad-danger", c.danger);

  let fav = document.querySelector<HTMLLinkElement>("link[data-ad-favicon]");
  if (!fav) {
    fav = document.createElement("link");
    fav.rel = "icon";
    fav.setAttribute("data-ad-favicon", "1");
    document.head.appendChild(fav);
  }
  if (design.faviconUrl?.trim()) {
    fav.href = design.faviconUrl.trim();
  }

  document.title = `${design.brandName} · ${design.brandTagline}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}
