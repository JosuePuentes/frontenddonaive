import { getAdLicoreriaBasePath } from "@/lib/ad-licoreria-host";

/**
 * Rutas canónicas A&D Licorería & Bodegón.
 * Prefijo `/licoreria` en Donaive; vacío cuando exista dominio propio.
 */
const AD_SEGMENTS = {
  inicio: "/inicio",
  ventas: "/ventas",
  cuentas: "/cuentas",
  inventario: "/inventario",
  productos: "/productos",
  depositos: "/depositos",
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
} as const;

export type AdLicoreriaRoutes = {
  home: string;
  inicio: string;
  ventas: string;
  cuentas: string;
  inventario: string;
  productos: string;
  depositos: string;
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
    inicio: joinPath(base, AD_SEGMENTS.inicio),
    ventas: joinPath(base, AD_SEGMENTS.ventas),
    cuentas: joinPath(base, AD_SEGMENTS.cuentas),
    inventario: joinPath(base, AD_SEGMENTS.inventario),
    productos: joinPath(base, AD_SEGMENTS.productos),
    depositos: joinPath(base, AD_SEGMENTS.depositos),
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
  };
}

export const AD_LICORERIA_ROUTES = getAdLicoreriaRoutes();

export function getAdLicoreriaNavItems(base = getAdLicoreriaBasePath()) {
  const r = getAdLicoreriaRoutes(base);
  return [
    { key: "inicio", label: "Inicio", to: r.inicio },
    { key: "cop", label: "Centro de operaciones", to: r.cop },
    { key: "ventas", label: "Ventas", to: r.ventas },
    { key: "cuentas", label: "Cuentas", to: r.cuentas },
    { key: "inventario", label: "Inventario", to: r.inventario },
    { key: "productos", label: "Productos", to: r.productos },
    { key: "depositos", label: "Depósitos", to: r.depositos },
    { key: "cierres", label: "Cierres", to: r.cierres },
    { key: "clientes", label: "Clientes", to: r.clientes },
    { key: "reportes", label: "Reportes", to: r.reportes },
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
