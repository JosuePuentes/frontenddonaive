/**
 * Repositorio MOCK Diseño Web A&D.
 * Persistencia: localStorage · preparado para API.
 * UI → este repository · Home consume published.
 */
import type {
  AdDesignStore,
  AdSiteBanner,
  AdSiteDesign,
  AdGalleryItem,
} from "@/types/ad-licoreria-design";
import {
  AD_DEFAULT_SITE_DESIGN,
  createDefaultSiteDesign,
  syncDesignMirrors,
} from "@/services/ad-licoreria/design/defaults";

export const AD_SITE_DESIGN_STORAGE_KEY = "ad-licoreria-site-design-v2";
export const AD_SITE_DESIGN_PREVIEW_KEY = "ad-licoreria-site-design-preview";
/** Legado v1 (migración). */
export const AD_SITE_DESIGN_LEGACY_KEY = "ad-licoreria-site-design-v1";

export type AdDesignResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Listener = () => void;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

/** Migra documento v1 plano → v2. */
export function migrateLegacyDesign(raw: unknown): AdSiteDesign | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const base = createDefaultSiteDesign();
  const colors = {
    ...base.colors,
    ...((p.colors as object) ?? {}),
  } as AdSiteDesign["colors"];
  colors.primary = colors.primary || colors.gold;
  colors.secondary = colors.secondary || colors.burgundy;
  colors.bgAlt = colors.bgAlt || colors.bg;
  colors.card = colors.card || colors.panel;
  colors.border = colors.border || "#2a2f3d";
  colors.warning = colors.warning || "#c9a227";
  colors.button = colors.button || colors.gold;
  colors.buttonHover = colors.buttonHover || colors.gold;

  const brandName = String(p.brandName ?? base.brand.commercialName);
  const next: AdSiteDesign = {
    ...base,
    colors,
    brand: {
      ...base.brand,
      commercialName: brandName,
      tagline: String(p.brandTagline ?? base.brand.tagline),
      description: String(p.brandDescription ?? base.brand.description),
      logoUrl: String(p.logoUrl ?? base.brand.logoUrl),
      faviconUrl: String(p.faviconUrl ?? base.brand.faviconUrl),
    },
    hero: {
      ...base.hero,
      backgroundUrl: String(p.homeBackgroundUrl ?? ""),
      overlay: String(p.homeBackgroundOverlay ?? base.hero.overlay),
      title: brandName,
      subtitle: String(p.brandTagline ?? base.hero.subtitle),
      description: String(p.brandDescription ?? base.hero.description),
      primaryLabel: String(p.homePrimaryCta ?? base.hero.primaryLabel),
      secondaryLabel: String(p.homeSecondaryCta ?? base.hero.secondaryLabel),
    },
    banners: Array.isArray(p.banners)
      ? (p.banners as AdSiteBanner[]).map((b, i) => ({
          ...b,
          imageUrlMobile: b.imageUrlMobile ?? "",
          order: b.order ?? i + 1,
          active: b.active !== false,
        }))
      : base.banners,
    homeTertiaryCta: String(p.homeTertiaryCta ?? base.homeTertiaryCta),
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
    updatedBy: typeof p.updatedBy === "string" ? p.updatedBy : undefined,
  };
  return syncDesignMirrors(next);
}

function readStorage(): AdDesignStore | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const v2 = localStorage.getItem(AD_SITE_DESIGN_STORAGE_KEY);
    if (v2) {
      const parsed = JSON.parse(v2) as Partial<AdDesignStore>;
      if (parsed.draft && parsed.published) {
        return {
          draft: syncDesignMirrors({
            ...createDefaultSiteDesign(),
            ...parsed.draft,
            brand: {
              ...createDefaultSiteDesign().brand,
              ...parsed.draft.brand,
            },
            colors: {
              ...createDefaultSiteDesign().colors,
              ...parsed.draft.colors,
            },
            hero: { ...createDefaultSiteDesign().hero, ...parsed.draft.hero },
            typography: {
              ...createDefaultSiteDesign().typography,
              ...parsed.draft.typography,
            },
            featuredProducts: {
              ...createDefaultSiteDesign().featuredProducts,
              ...parsed.draft.featuredProducts,
            },
            footer: {
              ...createDefaultSiteDesign().footer,
              ...parsed.draft.footer,
            },
            seo: { ...createDefaultSiteDesign().seo, ...parsed.draft.seo },
            popup: { ...createDefaultSiteDesign().popup, ...parsed.draft.popup },
            sections:
              parsed.draft.sections ?? createDefaultSiteDesign().sections,
            banners: parsed.draft.banners ?? createDefaultSiteDesign().banners,
            gallery: parsed.draft.gallery ?? createDefaultSiteDesign().gallery,
          }),
          published: syncDesignMirrors({
            ...createDefaultSiteDesign(),
            ...parsed.published,
            brand: {
              ...createDefaultSiteDesign().brand,
              ...parsed.published.brand,
            },
            colors: {
              ...createDefaultSiteDesign().colors,
              ...parsed.published.colors,
            },
            hero: {
              ...createDefaultSiteDesign().hero,
              ...parsed.published.hero,
            },
            typography: {
              ...createDefaultSiteDesign().typography,
              ...parsed.published.typography,
            },
            featuredProducts: {
              ...createDefaultSiteDesign().featuredProducts,
              ...parsed.published.featuredProducts,
            },
            footer: {
              ...createDefaultSiteDesign().footer,
              ...parsed.published.footer,
            },
            seo: {
              ...createDefaultSiteDesign().seo,
              ...parsed.published.seo,
            },
            popup: {
              ...createDefaultSiteDesign().popup,
              ...parsed.published.popup,
            },
            sections:
              parsed.published.sections ?? createDefaultSiteDesign().sections,
            banners:
              parsed.published.banners ?? createDefaultSiteDesign().banners,
            gallery:
              parsed.published.gallery ?? createDefaultSiteDesign().gallery,
          }),
        };
      }
    }
    const legacy = localStorage.getItem(AD_SITE_DESIGN_LEGACY_KEY);
    if (legacy) {
      const migrated = migrateLegacyDesign(JSON.parse(legacy));
      if (migrated) {
        return { draft: migrated, published: structuredClone(migrated) };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStorage(store: AdDesignStore) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(AD_SITE_DESIGN_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function initialStore(): AdDesignStore {
  const fromDisk = readStorage();
  if (fromDisk) return fromDisk;
  const d = createDefaultSiteDesign();
  return { draft: structuredClone(d), published: structuredClone(d) };
}

let store = initialStore();
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export const adDesignRepository = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getStore(): AdDesignStore {
    return {
      draft: structuredClone(store.draft),
      published: structuredClone(store.published),
    };
  },

  getDraft(): AdSiteDesign {
    return structuredClone(store.draft);
  },

  getPublished(): AdSiteDesign {
    return structuredClone(store.published);
  },

  /** Home y shell usan siempre publicado. */
  getPublishedForHome(): AdSiteDesign {
    return this.getPublished();
  },

  resetMemory() {
    const d = createDefaultSiteDesign();
    store = { draft: structuredClone(d), published: structuredClone(d) };
    emit();
  },

  /**
   * Reemplaza borrador en memoria (UI) sin persistir.
   * Usar saveDraft para persistir.
   */
  setDraftInMemory(design: AdSiteDesign) {
    store.draft = syncDesignMirrors(structuredClone(design));
    emit();
  },

  saveDraft(input: {
    design: AdSiteDesign;
    userName: string;
  }): AdDesignResult<AdSiteDesign> {
    if (!input.design.brand?.commercialName?.trim()) {
      return { ok: false, error: "Nombre comercial obligatorio" };
    }
    const next = syncDesignMirrors({
      ...structuredClone(input.design),
      updatedAt: nowIso(),
      updatedBy: input.userName,
    });
    store.draft = next;
    writeStorage(store);
    emit();
    return { ok: true, data: structuredClone(next) };
  },

  publish(input: { userName: string }): AdDesignResult<AdSiteDesign> {
    const next = syncDesignMirrors({
      ...structuredClone(store.draft),
      publishedAt: nowIso(),
      publishedBy: input.userName,
      updatedAt: nowIso(),
      updatedBy: input.userName,
    });
    store.published = next;
    store.draft = structuredClone(next);
    writeStorage(store);
    emit();
    return { ok: true, data: structuredClone(next) };
  },

  /** Descarta cambios en memoria → último borrador guardado en storage. */
  discardDraft(): AdDesignResult<AdSiteDesign> {
    const fromDisk = readStorage();
    if (fromDisk) {
      store.draft = structuredClone(fromDisk.draft);
      store.published = structuredClone(fromDisk.published);
    } else {
      store.draft = structuredClone(store.published);
    }
    emit();
    return { ok: true, data: structuredClone(store.draft) };
  },

  restoreDefaults(input: {
    userName: string;
  }): AdDesignResult<AdSiteDesign> {
    const next = syncDesignMirrors({
      ...createDefaultSiteDesign(),
      updatedAt: nowIso(),
      updatedBy: input.userName,
      publishedAt: nowIso(),
      publishedBy: input.userName,
    });
    store = {
      draft: structuredClone(next),
      published: structuredClone(next),
    };
    writeStorage(store);
    emit();
    return { ok: true, data: structuredClone(next) };
  },

  /** Helpers banners (operan sobre un design pasado). */
  createBanner(design: AdSiteDesign, partial?: Partial<AdSiteBanner>): AdSiteDesign {
    const banner: AdSiteBanner = {
      id: uid("bn"),
      title: partial?.title ?? "Nuevo banner",
      subtitle: partial?.subtitle ?? "",
      imageUrl: partial?.imageUrl ?? "",
      imageUrlMobile: partial?.imageUrlMobile ?? "",
      ctaLabel: partial?.ctaLabel ?? "Ver más",
      ctaHref: partial?.ctaHref ?? "/licoreria/inicio",
      active: partial?.active ?? true,
      order: partial?.order ?? design.banners.length + 1,
      position: partial?.position ?? "home",
      startsAt: partial?.startsAt ?? "",
      endsAt: partial?.endsAt ?? "",
    };
    return {
      ...design,
      banners: [...design.banners, banner],
    };
  },

  duplicateBanner(design: AdSiteDesign, bannerId: string): AdSiteDesign {
    const src = design.banners.find((b) => b.id === bannerId);
    if (!src) return design;
    const copy: AdSiteBanner = {
      ...structuredClone(src),
      id: uid("bn"),
      title: `${src.title} (copia)`,
      order: design.banners.length + 1,
    };
    return { ...design, banners: [...design.banners, copy] };
  },

  reorderBanner(
    design: AdSiteDesign,
    bannerId: string,
    direction: "up" | "down",
  ): AdSiteDesign {
    const sorted = [...design.banners].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === bannerId);
    if (idx < 0) return design;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) return design;
    const a = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[swap].order };
    sorted[swap] = { ...sorted[swap], order: a };
    return { ...design, banners: sorted };
  },

  setPreviewSession(design: AdSiteDesign) {
    if (typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.setItem(
        AD_SITE_DESIGN_PREVIEW_KEY,
        JSON.stringify(syncDesignMirrors(design)),
      );
    } catch {
      /* ignore */
    }
  },

  getPreviewSession(): AdSiteDesign | null {
    if (typeof sessionStorage === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(AD_SITE_DESIGN_PREVIEW_KEY);
      if (!raw) return null;
      return syncDesignMirrors({
        ...createDefaultSiteDesign(),
        ...JSON.parse(raw),
      });
    } catch {
      return null;
    }
  },

  clearPreviewSession() {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(AD_SITE_DESIGN_PREVIEW_KEY);
  },

  isBannerLive(banner: AdSiteBanner, now = new Date()): boolean {
    if (!banner.active) return false;
    if (banner.startsAt) {
      const s = new Date(banner.startsAt);
      if (!Number.isNaN(s.getTime()) && now < s) return false;
    }
    if (banner.endsAt) {
      const e = new Date(banner.endsAt);
      if (!Number.isNaN(e.getTime()) && now > e) return false;
    }
    return true;
  },

  liveBanners(design: AdSiteDesign, now = new Date()): AdSiteBanner[] {
    return [...design.banners]
      .filter((b) => this.isBannerLive(b, now))
      .sort((a, b) => a.order - b.order);
  },

  liveGallery(design: AdSiteDesign): AdGalleryItem[] {
    return [...design.gallery]
      .filter((g) => g.active)
      .sort((a, b) => a.order - b.order);
  },

  sortedSections(design: AdSiteDesign) {
    return [...design.sections].sort((a, b) => a.order - b.order);
  },
};

export { AD_DEFAULT_SITE_DESIGN };
