/**
 * Navegación filtrada por rol/permisos (misma matriz access.ts).
 * No inventa permisos: solo oculta rutas no autorizadas.
 */
import type { AdOperator, AdPermission, AdRole } from "@/types/ad-licoreria";
import { can } from "@/lib/ad-licoreria/access";
import {
  getAdLicoreriaRoutes,
  type AdLicoreriaRoutes,
} from "@/constants/ad-licoreria-routes";

export type AdNavItem = {
  key: string;
  label: string;
  to: string;
  /** Si se define, requiere al menos uno. */
  anyOf?: AdPermission[];
  roles?: AdRole[];
  /** Agrupación para menú colapsable (móvil / escritorio). */
  group?: AdNavGroupId;
};

export type AdNavGroupId =
  | "principal"
  | "operacion"
  | "inventario"
  | "compras"
  | "finanzas"
  | "tv"
  | "admin";

export const AD_NAV_GROUP_LABELS: Record<AdNavGroupId, string> = {
  principal: "Principal",
  operacion: "Operación",
  inventario: "Inventario / COP",
  compras: "Compras",
  finanzas: "Finanzas",
  tv: "TV",
  admin: "Administración",
};

export const AD_NAV_GROUP_ORDER: AdNavGroupId[] = [
  "principal",
  "operacion",
  "inventario",
  "compras",
  "finanzas",
  "tv",
  "admin",
];


function routes(base?: "" | "/licoreria"): AdLicoreriaRoutes {
  return getAdLicoreriaRoutes(base);
}

/** Catálogo de ítems operativos + admin. */
export function getAdNavCatalog(base?: "" | "/licoreria"): AdNavItem[] {
  const r = routes(base);
  return [
    { key: "inicio", label: "Inicio", to: r.inicio, group: "principal" },
    {
      key: "mesonera",
      label: "Mis mesas",
      to: r.mesonera,
      anyOf: ["accounts.open", "accounts.serve", "tables.manage"],
      roles: ["mesonera", "admin", "supervisor", "cajero"],
      group: "operacion",
    },
    {
      key: "ventas",
      label: "POS",
      to: r.ventas,
      anyOf: ["pos.sell"],
      group: "operacion",
    },
    {
      key: "cuentas",
      label: "Cuentas",
      to: r.cuentas,
      anyOf: ["pos.sell", "pos.close_account", "accounts.open", "accounts.serve"],
      group: "operacion",
    },
    {
      key: "clientes",
      label: "Clientes",
      to: r.clientes,
      anyOf: ["clients.read"],
      group: "operacion",
    },
    {
      key: "cierres",
      label: "Cierres",
      to: r.cierres,
      anyOf: ["closures.create"],
      group: "operacion",
    },
    {
      key: "qr",
      label: "QR / Prepago",
      to: r.qr,
      anyOf: ["accounts.serve", "pos.sell", "clients.read"],
      group: "operacion",
    },
    {
      key: "cop",
      label: "COP",
      to: r.cop,
      anyOf: ["cop.read"],
      group: "inventario",
    },
    {
      key: "copTransferencias",
      label: "Transferencias",
      to: r.copTransferencias,
      anyOf: ["cop.transfer", "inventory.transfer"],
      group: "inventario",
    },
    {
      key: "inventario",
      label: "Inventario",
      to: r.inventario,
      anyOf: ["inventory.read"],
      group: "inventario",
    },
    {
      key: "depositos",
      label: "Depósitos",
      to: r.depositos,
      anyOf: ["deposits.manage", "inventory.read"],
      group: "inventario",
    },
    {
      key: "productos",
      label: "Productos",
      to: r.productos,
      anyOf: ["inventory.read", "settings.manage", "products.manage"],
      group: "inventario",
    },
    {
      key: "presentaciones",
      label: "Presentaciones",
      to: r.presentaciones,
      anyOf: ["pricing.manage", "inventory.read", "settings.manage"],
      group: "inventario",
    },
    {
      key: "compras",
      label: "Compras",
      to: r.compras,
      anyOf: ["purchases.create", "purchase.create", "purchases.manage"],
      group: "compras",
    },
    {
      key: "comprasAnalisis",
      label: "Análisis compras",
      to: r.comprasAnalisis,
      anyOf: ["purchase-analysis.view"],
      group: "compras",
    },
    {
      key: "proveedores",
      label: "Proveedores",
      to: r.proveedores,
      anyOf: ["suppliers.manage"],
      group: "compras",
    },
    {
      key: "finanzas",
      label: "Finanzas",
      to: r.finanzas,
      anyOf: ["finance.dashboard.view", "finance.view", "reports.read"],
      group: "finanzas",
    },
    {
      key: "bancos",
      label: "Bancos",
      to: r.bancos,
      anyOf: ["finance.view", "finance.manage"],
      group: "finanzas",
    },
    {
      key: "movimientos",
      label: "Movimientos",
      to: r.movimientos,
      anyOf: ["finance.view"],
      group: "finanzas",
    },
    {
      key: "casaCambio",
      label: "Casa de Cambio",
      to: r.casaCambio,
      anyOf: ["finance.exchange"],
      group: "finanzas",
    },
    {
      key: "conciliacion",
      label: "Conciliación",
      to: r.conciliacion,
      anyOf: ["finance.reconcile"],
      group: "finanzas",
    },
    {
      key: "tasas",
      label: "Tasas",
      to: r.tasas,
      anyOf: ["finance.rates", "rates.bcv.manage", "rates.protected.manage"],
      group: "finanzas",
    },
    {
      key: "promociones",
      label: "Promociones",
      to: r.promociones,
      anyOf: ["promotions.manage"],
      group: "finanzas",
    },
    {
      key: "configFinanciera",
      label: "Config. financiera",
      to: r.configFinanciera,
      anyOf: ["finance.manage"],
      group: "finanzas",
    },
    {
      key: "reportes",
      label: "Reportes",
      to: r.reportes,
      anyOf: ["reports.read"],
      group: "finanzas",
    },
    {
      key: "tv",
      label: "TV",
      to: r.tv,
      anyOf: ["tv.view"],
      group: "tv",
    },
    {
      key: "tvControl",
      label: "Control TV",
      to: r.tvControl,
      anyOf: ["tv.control"],
      group: "tv",
    },
    {
      key: "configuracion",
      label: "Configuración",
      to: r.configuracion,
      anyOf: ["settings.manage"],
      roles: ["admin"],
      group: "admin",
    },
    {
      key: "diseno",
      label: "Diseño web",
      to: r.configDiseno,
      anyOf: ["settings.manage"],
      group: "admin",
    },
    {
      key: "usuarios",
      label: "Usuarios",
      to: r.configUsuarios,
      anyOf: ["users.manage"],
      group: "admin",
    },
    {
      key: "permisos",
      label: "Permisos",
      to: r.configPermisos,
      anyOf: ["users.manage"],
      group: "admin",
    },
  ];
}

export function filterNavForUser(
  user: AdOperator | null | undefined,
  roleOverrides?: Partial<Record<AdRole, AdPermission[]>>,
  base?: "" | "/licoreria",
): AdNavItem[] {
  const catalog = getAdNavCatalog(base);
  if (!user || !user.active) {
    return catalog.filter((i) => i.key === "inicio");
  }
  /** Usuario TV: solo módulos TV (sin POS / COP / inventario / admin). */
  if (user.role === "tv") {
    return catalog.filter((item) => {
      if (!item.anyOf?.length) return item.key === "inicio" ? false : false;
      return item.anyOf.some(
        (p) => p.startsWith("tv.") && can(user, p, roleOverrides),
      );
    });
  }
  return catalog.filter((item) => {
    if (item.roles && !item.roles.includes(user.role) && user.role !== "admin") {
      /* roles hint: admin siempre pasa si tiene permiso */
    }
    if (user.role === "admin") {
      if (item.anyOf?.length) {
        return item.anyOf.some((p) => can(user, p, roleOverrides));
      }
      return true;
    }
    if (!item.anyOf?.length) return true;
    return item.anyOf.some((p) => can(user, p, roleOverrides));
  });
}

/** Atajos por rol para topbar / mesonera. */
export function roleHomePath(
  role: AdRole,
  base?: "" | "/licoreria",
): string {
  const r = routes(base);
  switch (role) {
    case "mesonera":
      return r.mesonera;
    case "cajero":
      return r.ventas;
    case "inventario":
      return r.cop;
    case "supervisor":
      return r.cop;
    case "tv":
      return r.tv;
    case "admin":
    default:
      return r.inicio;
  }
}

/** Agrupa ítems filtrados para menú colapsable. */
export function groupNavItems(
  items: AdNavItem[],
): { id: AdNavGroupId; label: string; items: AdNavItem[] }[] {
  const byGroup = new Map<AdNavGroupId, AdNavItem[]>();
  for (const item of items) {
    const id = item.group ?? "principal";
    const list = byGroup.get(id) ?? [];
    list.push(item);
    byGroup.set(id, list);
  }
  return AD_NAV_GROUP_ORDER.filter((id) => (byGroup.get(id)?.length ?? 0) > 0).map(
    (id) => ({
      id,
      label: AD_NAV_GROUP_LABELS[id],
      items: byGroup.get(id)!,
    }),
  );
}

/**
 * Atajos inferiores en móvil (máx. 4) — no lista todos los módulos.
 * El resto queda en el menú «Más».
 */
export function mobilePrimaryNavKeys(role: AdRole | null | undefined): string[] {
  switch (role) {
    case "cajero":
      return ["inicio", "ventas", "cuentas", "cierres"];
    case "mesonera":
      return ["inicio", "mesonera", "cuentas", "clientes"];
    case "inventario":
      return ["inicio", "cop", "inventario", "compras"];
    case "supervisor":
      return ["inicio", "cop", "ventas", "finanzas"];
    case "tv":
      return ["tv", "tvControl"];
    case "admin":
    default:
      return ["inicio", "ventas", "cop", "finanzas"];
  }
}

