import {
  AD_LICORERIA_MEDIA,
  adLicoreriaBrand,
} from "@/content/ad-licoreria/brand";
import {
  AD_HOME_SECTION_LABELS,
  AD_TYPOGRAPHY_PRESETS,
  type AdHomeSection,
  type AdHomeSectionId,
  type AdSiteDesign,
} from "@/types/ad-licoreria-design";

function defaultSections(): AdHomeSection[] {
  const ids: AdHomeSectionId[] = [
    "hero",
    "about",
    "featured",
    "categories",
    "promotions",
    "banners",
    "gallery",
    "services",
    "location",
    "hours",
    "contact",
    "social",
    "footer",
  ];
  return ids.map((id, i) => ({
    id,
    label: AD_HOME_SECTION_LABELS[id],
    visible: [
      "hero",
      "about",
      "featured",
      "banners",
      "gallery",
      "hours",
      "contact",
      "social",
      "footer",
    ].includes(id),
    order: i + 1,
  }));
}

/** Defaults visuales A&D (restaurar diseño). */
export function createDefaultSiteDesign(): AdSiteDesign {
  const brand = {
    commercialName: adLicoreriaBrand.name,
    shortName: adLicoreriaBrand.short,
    tagline: adLicoreriaBrand.tagline,
    description: adLicoreriaBrand.description,
    logoUrl: AD_LICORERIA_MEDIA.logo,
    logoAltUrl: AD_LICORERIA_MEDIA.logo,
    faviconUrl: AD_LICORERIA_MEDIA.logo,
    socialImageUrl: AD_LICORERIA_MEDIA.logo,
    phone: "+58 412-0000000",
    whatsapp: "+584120000000",
    address: "Venezuela",
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/",
    schedule: "Lun–Dom · 11:00 – 23:00",
    legalText: "Consumo responsable. Prohibida la venta a menores de edad.",
    showPhone: true,
    showWhatsapp: true,
    showAddress: true,
    showInstagram: true,
    showFacebook: true,
    showTiktok: false,
    showSchedule: true,
  };

  const colors = {
    gold: "#d4af6a",
    burgundy: "#6b1e2a",
    primary: "#d4af6a",
    secondary: "#6b1e2a",
    bg: "#0a0b0f",
    bgAlt: "#12151c",
    panel: "#171a24",
    card: "#1c2030",
    text: "#f4efe6",
    muted: "#9a9388",
    border: "#2a2f3d",
    success: "#3d9b6e",
    danger: "#c44b5a",
    warning: "#c9a227",
    button: "#d4af6a",
    buttonHover: "#e0c280",
  };

  const typoPreset = AD_TYPOGRAPHY_PRESETS.classic;

  const design: AdSiteDesign = {
    version: 2,
    brand,
    colors,
    typography: {
      preset: "classic",
      headingFont: typoPreset.headingFont,
      bodyFont: typoPreset.bodyFont,
      headingWeight: 600,
      scale: 1,
    },
    hero: {
      backgroundUrl: "",
      videoUrl: "",
      overlay: "rgba(10, 11, 15, 0.72)",
      title: adLicoreriaBrand.name,
      subtitle: adLicoreriaBrand.tagline,
      description: adLicoreriaBrand.description,
      primaryLabel: "Entrar al inicio",
      primaryHref: "/licoreria/inicio",
      primaryVisible: true,
      secondaryLabel: "Abrir ventas",
      secondaryHref: "/licoreria/ventas",
      secondaryVisible: true,
      align: "center",
    },
    sections: defaultSections(),
    featuredProducts: {
      enabled: true,
      count: 4,
      title: "Productos destacados",
      subtitle: "Selección del catálogo A&D",
      showImage: true,
      showPrice: true,
      showButton: true,
      buttonLabel: "Ver más",
      linkHref: "/licoreria/productos",
      productIds: [],
    },
    banners: [
      {
        id: "bn-1",
        title: "Bienvenido a A&D",
        subtitle: "Licorería & Bodegón · operación unificada",
        imageUrl: "",
        imageUrlMobile: "",
        ctaLabel: "Ver operaciones",
        ctaHref: "/licoreria/inicio",
        active: true,
        order: 1,
        position: "home",
      },
    ],
    popup: {
      enabled: false,
      imageUrl: "",
      title: "Promoción",
      text: "",
      buttonLabel: "Ver",
      buttonHref: "/licoreria",
      oncePerSession: true,
      startsAt: "",
      endsAt: "",
    },
    gallery: [
      {
        id: "gal-1",
        title: "Ambiente",
        description: "Salón A&D",
        imageUrl:
          "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800",
        order: 1,
        active: true,
      },
      {
        id: "gal-2",
        title: "Selección",
        description: "Licores",
        imageUrl:
          "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800",
        order: 2,
        active: true,
      },
    ],
    footer: {
      logoUrl: AD_LICORERIA_MEDIA.logo,
      description: adLicoreriaBrand.description,
      phone: brand.phone,
      whatsapp: brand.whatsapp,
      address: brand.address,
      schedule: brand.schedule,
      showSocial: true,
      links: [
        { id: "fl-1", label: "Inicio", href: "/licoreria/inicio" },
        { id: "fl-2", label: "Productos", href: "/licoreria/productos" },
      ],
      copyright: `© ${new Date().getFullYear()} A&D Licorería & Bodegón`,
      legalText: brand.legalText,
    },
    seo: {
      title: `${adLicoreriaBrand.name} · ${adLicoreriaBrand.tagline}`,
      description: adLicoreriaBrand.description,
      keywords: "licorería, bodegón, A&D, bebidas",
      socialImageUrl: AD_LICORERIA_MEDIA.logo,
      faviconUrl: AD_LICORERIA_MEDIA.logo,
    },
    brandName: brand.commercialName,
    brandTagline: brand.tagline,
    brandDescription: brand.description,
    logoUrl: brand.logoUrl,
    faviconUrl: brand.faviconUrl,
    homeBackgroundUrl: "",
    homeBackgroundOverlay: "rgba(10, 11, 15, 0.72)",
    homeHeroEyebrow: "Portal operativo",
    homePrimaryCta: "Entrar al inicio",
    homeSecondaryCta: "Abrir ventas",
    homeTertiaryCta: "Vista mesonera",
  };

  return design;
}

export const AD_DEFAULT_SITE_DESIGN = createDefaultSiteDesign();

/** Sincroniza mirrors planos desde estructuras anidadas. */
export function syncDesignMirrors(design: AdSiteDesign): AdSiteDesign {
  return {
    ...design,
    version: 2,
    brandName: design.brand.commercialName,
    brandTagline: design.brand.tagline,
    brandDescription: design.brand.description,
    logoUrl: design.brand.logoUrl,
    faviconUrl: design.seo.faviconUrl || design.brand.faviconUrl,
    homeBackgroundUrl: design.hero.backgroundUrl,
    homeBackgroundOverlay: design.hero.overlay,
    homeHeroEyebrow: design.hero.subtitle,
    homePrimaryCta: design.hero.primaryLabel,
    homeSecondaryCta: design.hero.secondaryLabel,
    homeTertiaryCta: design.homeTertiaryCta || "Vista mesonera",
    colors: {
      ...design.colors,
      gold: design.colors.primary || design.colors.gold,
      burgundy: design.colors.secondary || design.colors.burgundy,
      primary: design.colors.primary || design.colors.gold,
      secondary: design.colors.secondary || design.colors.burgundy,
    },
  };
}
