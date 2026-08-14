import { getAdLicoreriaBasePath } from "@/lib/ad-licoreria-host";

const AD_SEGMENTS = {
  dashboard: "/dashboard",
  pos: "/pos",
  inventario: "/inventario",
  productos: "/productos",
  presentaciones: "/presentaciones",
  depositos: "/depositos",
  mesas: "/mesas",
  cuentas: "/cuentas",
  prepagos: "/prepagos",
  qr: "/qr",
  caja: "/caja",
  cierres: "/cierres",
  reportes: "/reportes",
  auditoria: "/auditoria",
  mesonera: "/mesonera",
} as const;

export type AdLicoreriaRoutes = {
  home: string;
  dashboard: string;
  pos: string;
  inventario: string;
  productos: string;
  presentaciones: string;
  depositos: string;
  mesas: string;
  cuentas: string;
  prepagos: string;
  qr: string;
  caja: string;
  cierres: string;
  reportes: string;
  auditoria: string;
  mesonera: string;
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
    dashboard: joinPath(base, AD_SEGMENTS.dashboard),
    pos: joinPath(base, AD_SEGMENTS.pos),
    inventario: joinPath(base, AD_SEGMENTS.inventario),
    productos: joinPath(base, AD_SEGMENTS.productos),
    presentaciones: joinPath(base, AD_SEGMENTS.presentaciones),
    depositos: joinPath(base, AD_SEGMENTS.depositos),
    mesas: joinPath(base, AD_SEGMENTS.mesas),
    cuentas: joinPath(base, AD_SEGMENTS.cuentas),
    prepagos: joinPath(base, AD_SEGMENTS.prepagos),
    qr: joinPath(base, AD_SEGMENTS.qr),
    caja: joinPath(base, AD_SEGMENTS.caja),
    cierres: joinPath(base, AD_SEGMENTS.cierres),
    reportes: joinPath(base, AD_SEGMENTS.reportes),
    auditoria: joinPath(base, AD_SEGMENTS.auditoria),
    mesonera: joinPath(base, AD_SEGMENTS.mesonera),
  };
}

export const AD_LICORERIA_ROUTES = getAdLicoreriaRoutes();

export function getAdLicoreriaNavItems(base = getAdLicoreriaBasePath()) {
  const r = getAdLicoreriaRoutes(base);
  return [
    { key: "dashboard", label: "Dashboard", to: r.dashboard },
    { key: "pos", label: "POS", to: r.pos },
    { key: "inventario", label: "Inventario", to: r.inventario },
    { key: "productos", label: "Productos", to: r.productos },
    { key: "presentaciones", label: "Presentaciones", to: r.presentaciones },
    { key: "depositos", label: "Depósitos", to: r.depositos },
    { key: "mesas", label: "Mesas", to: r.mesas },
    { key: "cuentas", label: "Cuentas", to: r.cuentas },
    { key: "prepagos", label: "Prepagos", to: r.prepagos },
    { key: "qr", label: "QR", to: r.qr },
    { key: "caja", label: "Caja", to: r.caja },
    { key: "cierres", label: "Cierres", to: r.cierres },
    { key: "reportes", label: "Reportes", to: r.reportes },
    { key: "auditoria", label: "Auditoría", to: r.auditoria },
    { key: "mesonera", label: "Mesonera", to: r.mesonera },
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
