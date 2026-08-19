import { getAdLicoreriaBasePath } from "@/lib/ad-licoreria-host";

/**
 * Rutas canónicas A&D Licorería & Bodegón.
 * Prefijo `/licoreria` en Donaive; vacío cuando exista dominio propio.
 */
const AD_SEGMENTS = {
  login: "/login",
  inicio: "/inicio",
  ventas: "/ventas",
  cuentas: "/cuentas",
  inventario: "/inventario",
  productos: "/productos",
  depositos: "/depositos",
  compras: "/compras",
  comprasAnalisis: "/compras/analisis",
  proveedores: "/proveedores",
  importacion: "/importacion",
  tasas: "/configuracion/tasas",
  /** Fase 7 — Finanzas */
  finanzas: "/finanzas",
  bancos: "/bancos",
  movimientos: "/finanzas/movimientos",
  casaCambio: "/casa-cambio",
  conciliacion: "/finanzas/conciliacion",
  configFinanciera: "/finanzas/configuracion",
  promociones: "/promociones",
  cierres: "/cierres",
  clientes: "/clientes",
  reportes: "/reportes",
  configuracion: "/configuracion",
  /** Sub-vistas operativas (accesibles, no necesariamente en nav principal). */
  mesonera: "/mesonera",
  presentaciones: "/presentaciones",
  prepagos: "/prepagos",
  qr: "/qr",
  mesas: "/mesas",
  /** Fase 7 — Centro de Operaciones */
  cop: "/cop",
  copTransferencias: "/cop/transferencias",
  copReportes: "/cop/reportes",
  /** Fase 8 — usuarios / permisos */
  configUsuarios: "/configuracion/usuarios",
  configPermisos: "/configuracion/permisos",
  configDiseno: "/configuracion/diseno",
  configDisenoPreview: "/configuracion/diseno/preview",
  /** Fase 10.2 — TV / Digital Signage */
  tv: "/tv",
  tvPantallas: "/tv/pantallas",
  tvContenido: "/tv/contenido",
  tvGrupos: "/tv/grupos",
  tvControl: "/tv/control",
  /** Alias canónico del reproductor (pairing / playback). */
  tvReproductor: "/tv/reproductor",
} as const;

export type AdLicoreriaRoutes = {
  home: string;
  login: string;
  inicio: string;
  ventas: string;
  cuentas: string;
  inventario: string;
  productos: string;
  depositos: string;
  compras: string;
  comprasAnalisis: string;
  proveedores: string;
  importacion: string;
  tasas: string;
  finanzas: string;
  bancos: string;
  movimientos: string;
  casaCambio: string;
  conciliacion: string;
  configFinanciera: string;
  promociones: string;
  cierres: string;
  clientes: string;
  reportes: string;
  configuracion: string;
  mesonera: string;
  presentaciones: string;
  prepagos: string;
  qr: string;
  mesas: string;
  cop: string;
  copTransferencias: string;
  copReportes: string;
  configUsuarios: string;
  configPermisos: string;
  configDiseno: string;
  configDisenoPreview: string;
  tv: string;
  tvPantallas: string;
  tvContenido: string;
  tvGrupos: string;
  tvControl: string;
  tvReproductor: string;
};

function joinPath(base: "" | "/licoreria", segment: string): string {
  if (!segment) return base || "/";
  return `${base}${segment}`;
}

export function getAdLicoreriaRoutes(
  base = getAdLicoreriaBasePath(),
): AdLicoreriaRoutes {
  return {
    home: joinPath(base, ""),
    login: joinPath(base, AD_SEGMENTS.login),
    inicio: joinPath(base, AD_SEGMENTS.inicio),
    ventas: joinPath(base, AD_SEGMENTS.ventas),
    cuentas: joinPath(base, AD_SEGMENTS.cuentas),
    inventario: joinPath(base, AD_SEGMENTS.inventario),
    productos: joinPath(base, AD_SEGMENTS.productos),
    depositos: joinPath(base, AD_SEGMENTS.depositos),
    compras: joinPath(base, AD_SEGMENTS.compras),
    comprasAnalisis: joinPath(base, AD_SEGMENTS.comprasAnalisis),
    proveedores: joinPath(base, AD_SEGMENTS.proveedores),
    importacion: joinPath(base, AD_SEGMENTS.importacion),
    tasas: joinPath(base, AD_SEGMENTS.tasas),
    finanzas: joinPath(base, AD_SEGMENTS.finanzas),
    bancos: joinPath(base, AD_SEGMENTS.bancos),
    movimientos: joinPath(base, AD_SEGMENTS.movimientos),
    casaCambio: joinPath(base, AD_SEGMENTS.casaCambio),
    conciliacion: joinPath(base, AD_SEGMENTS.conciliacion),
    configFinanciera: joinPath(base, AD_SEGMENTS.configFinanciera),
    promociones: joinPath(base, AD_SEGMENTS.promociones),
    cierres: joinPath(base, AD_SEGMENTS.cierres),
    clientes: joinPath(base, AD_SEGMENTS.clientes),
    reportes: joinPath(base, AD_SEGMENTS.reportes),
    configuracion: joinPath(base, AD_SEGMENTS.configuracion),
    mesonera: joinPath(base, AD_SEGMENTS.mesonera),
    presentaciones: joinPath(base, AD_SEGMENTS.presentaciones),
    prepagos: joinPath(base, AD_SEGMENTS.prepagos),
    qr: joinPath(base, AD_SEGMENTS.qr),
    mesas: joinPath(base, AD_SEGMENTS.mesas),
    cop: joinPath(base, AD_SEGMENTS.cop),
    copTransferencias: joinPath(base, AD_SEGMENTS.copTransferencias),
    copReportes: joinPath(base, AD_SEGMENTS.copReportes),
    configUsuarios: joinPath(base, AD_SEGMENTS.configUsuarios),
    configPermisos: joinPath(base, AD_SEGMENTS.configPermisos),
    configDiseno: joinPath(base, AD_SEGMENTS.configDiseno),
    configDisenoPreview: joinPath(base, AD_SEGMENTS.configDisenoPreview),
    tv: joinPath(base, AD_SEGMENTS.tv),
    tvPantallas: joinPath(base, AD_SEGMENTS.tvPantallas),
    tvContenido: joinPath(base, AD_SEGMENTS.tvContenido),
    tvGrupos: joinPath(base, AD_SEGMENTS.tvGrupos),
    tvControl: joinPath(base, AD_SEGMENTS.tvControl),
    tvReproductor: joinPath(base, AD_SEGMENTS.tvReproductor),
  };
}

export const AD_LICORERIA_ROUTES = getAdLicoreriaRoutes();

/** URL del reproductor de una pantalla (por código TV-001 o id). */
export function adTvPlayerPath(
  screenIdOrCode: string,
  base = getAdLicoreriaBasePath(),
): string {
  return `${joinPath(
    base,
    `/tv/reproductor/${encodeURIComponent(screenIdOrCode)}`,
  )}?tv=yt3`;
}

/** Alias histórico: /tv/pantalla/:id */
export function adTvPantallaPath(
  screenIdOrCode: string,
  base = getAdLicoreriaBasePath(),
): string {
  return joinPath(base, `/tv/pantalla/${encodeURIComponent(screenIdOrCode)}`);
}

export function getAdLicoreriaNavItems(base = getAdLicoreriaBasePath()) {
  const r = getAdLicoreriaRoutes(base);
  return [
    { key: "inicio", label: "Inicio", to: r.inicio },
    { key: "cop", label: "Centro de operaciones", to: r.cop },
    { key: "ventas", label: "Ventas", to: r.ventas },
    { key: "cuentas", label: "Cuentas", to: r.cuentas },
    { key: "inventario", label: "Inventario", to: r.inventario },
    { key: "productos", label: "Productos", to: r.productos },
    { key: "compras", label: "Compras", to: r.compras },
    { key: "finanzas", label: "Finanzas", to: r.finanzas },
    { key: "bancos", label: "Bancos", to: r.bancos },
    { key: "depositos", label: "Depósitos", to: r.depositos },
    { key: "cierres", label: "Cierres", to: r.cierres },
    { key: "clientes", label: "Clientes", to: r.clientes },
    { key: "reportes", label: "Reportes", to: r.reportes },
    { key: "tv", label: "TV / Pantallas", to: r.tv },
    { key: "configuracion", label: "Configuración", to: r.configuracion },
  ] as const;
}

export const adLicoreriaNavItems = getAdLicoreriaNavItems();

export function adLicoreriaRouterPath(
  prefix: "" | "/licoreria",
  segment: keyof typeof AD_SEGMENTS | "home",
): string {
  if (segment === "home") return prefix || "/";
  return joinPath(prefix, AD_SEGMENTS[segment]);
}
