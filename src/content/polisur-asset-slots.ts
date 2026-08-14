/**
 * Destinos canónicos del registro documental POLISUR.
 * El operador elige un destino; no se inventan asignaciones.
 */
export const POLISUR_ASSET_SLOTS = [
  {
    id: "logo-escudo",
    path: "public/polisur/logo/escudo.png",
    publicUrl: "/polisur/logo/escudo.png",
    label: "Escudo institucional",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    id: "logo-parche",
    path: "public/polisur/logo/parche.png",
    publicUrl: "/polisur/logo/parche.png",
    label: "Parche Venezuela renace",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    id: "logo-k9",
    path: "public/polisur/logo/k9-emblema.png",
    publicUrl: "/polisur/logo/k9-emblema.png",
    label: "Emblema Unidad Canina K-9",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    id: "logo-visipol",
    path: "public/polisur/logo/visipol.png",
    publicUrl: "/polisur/logo/visipol.png",
    label: "Logo VISIPOL",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    id: "logo-cuadrantes",
    path: "public/polisur/logo/cuadrantes-paz.png",
    publicUrl: "/polisur/logo/cuadrantes-paz.png",
    label: "Gran Misión Cuadrantes de Paz",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    id: "logo-justicia-paz",
    path: "public/polisur/logo/justicia-paz.png",
    publicUrl: "/polisur/logo/justicia-paz.png",
    label: "Justicia y Paz",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    id: "home-hero",
    path: "public/polisur/home/hero.jpg",
    publicUrl: "/polisur/home/hero.jpg",
    label: "Home — Hero",
    accept: "image/jpeg,image/png,image/webp",
  },
  {
    id: "home-about",
    path: "public/polisur/home/about.jpg",
    publicUrl: "/polisur/home/about.jpg",
    label: "Home — Nuestra institución",
    accept: "image/jpeg,image/png,image/webp",
  },
  {
    id: "home-canina",
    path: "public/polisur/home/canina.jpg",
    publicUrl: "/polisur/home/canina.jpg",
    label: "Home — Unidad Canina",
    accept: "image/jpeg,image/png,image/webp",
  },
  {
    id: "home-ciudadania",
    path: "public/polisur/home/ciudadania.jpg",
    publicUrl: "/polisur/home/ciudadania.jpg",
    label: "Home — Ciudadanía",
    accept: "image/jpeg,image/png,image/webp",
  },
  {
    id: "uc-hero",
    path: "public/polisur/unidad-canina/hero.jpg",
    publicUrl: "/polisur/unidad-canina/hero.jpg",
    label: "Unidad Canina — Hero",
    accept: "image/jpeg,image/png,image/webp",
  },
  {
    id: "uc-entrenamiento",
    path: "public/polisur/unidad-canina/entrenamiento.jpg",
    publicUrl: "/polisur/unidad-canina/entrenamiento.jpg",
    label: "Unidad Canina — Entrenamiento",
    accept: "image/jpeg,image/png,image/webp",
  },
  {
    id: "uc-binomio",
    path: "public/polisur/unidad-canina/binomio.png",
    publicUrl: "/polisur/unidad-canina/binomio.png",
    label: "Unidad Canina — Binomio (PNG)",
    accept: "image/png,image/jpeg,image/webp",
  },
] as const;

export type PolisurAssetSlotId = (typeof POLISUR_ASSET_SLOTS)[number]["id"];
