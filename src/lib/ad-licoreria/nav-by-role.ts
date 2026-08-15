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
};

function routes(base?: "" | "/licoreria"): AdLicoreriaRoutes {
  return getAdLicoreriaRoutes(base);
}

/** Catálogo de ítems operativos + admin. */
export function getAdNavCatalog(base?: "" | "/licoreria"): AdNavItem[] {
  const r = routes(base);
  return [
    { key: "inicio", label: "Inicio", to: r.inicio },
    {
      key: "mesonera",
      label: "Mis mesas",
      to: r.mesonera,
      anyOf: ["accounts.open", "accounts.serve", "tables.manage"],
      roles: ["mesonera", "admin", "supervisor", "cajero"],
    },
    {
      key: "ventas",
      label: "POS",
      to: r.ventas,
      anyOf: ["pos.sell"],
    },
    {
      key: "cuentas",
      label: "Cuentas",
      to: r.cuentas,
      anyOf: ["pos.sell", "pos.close_account", "accounts.open", "accounts.serve"],
    },
    {
      key: "clientes",
      label: "Clientes",
      to: r.clientes,
      anyOf: ["clients.read"],
    },
    {
      key: "cierres",
      label: "Cierres",
      to: r.cierres,
      anyOf: ["closures.create"],
    },
    {
      key: "cop",
      label: "COP",
      to: r.cop,
      anyOf: ["cop.read"],
    },
    {
      key: "copTransferencias",
      label: "Transferencias",
      to: r.copTransferencias,
      anyOf: ["cop.transfer", "inventory.transfer"],
    },
    {
      key: "inventario",
      label: "Inventario",
      to: r.inventario,
      anyOf: ["inventory.read"],
    },
    {
      key: "depositos",
      label: "Depósitos",
      to: r.depositos,
      anyOf: ["deposits.manage", "inventory.read"],
    },
    {
      key: "productos",
      label: "Productos",
      to: r.productos,
      anyOf: ["inventory.read", "settings.manage"],
    },
    {
      key: "reportes",
      label: "Reportes",
      to: r.reportes,
      anyOf: ["reports.read"],
    },
    {
      key: "qr",
      label: "QR / Prepago",
      to: r.qr,
      anyOf: ["accounts.serve", "pos.sell", "clients.read"],
    },
    {
      key: "configuracion",
      label: "Configuración",
      to: r.configuracion,
      anyOf: ["settings.manage"],
      roles: ["admin"],
    },
    {
      key: "usuarios",
      label: "Usuarios",
      to: r.configUsuarios,
      anyOf: ["users.manage"],
    },
    {
      key: "permisos",
      label: "Permisos",
      to: r.configPermisos,
      anyOf: ["users.manage"],
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
    case "admin":
    default:
      return r.inicio;
  }
}
