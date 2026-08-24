/**
 * Acceso Donaive Software — permisos, roles y matriz editable.
 */

import type { DsPermission, DsRole, DsUser } from "@/types/donaive-software";

export const DS_ALL_PERMISSIONS: DsPermission[] = [
  "pos.sell",
  "pos.refund",
  "pos.discount",
  "pos.closures",
  "inventory.read",
  "inventory.adjust",
  "inventory.products",
  "purchases.create",
  "purchases.manage",
  "purchases.approve",
  "clients.read",
  "clients.manage",
  "suppliers.manage",
  "finance.rates",
  "finance.cpp",
  "finance.accounts",
  "finance.manage",
  "reports.read",
  "analysis.view",
  "users.manage",
  "settings.manage",
  "license.manage",
];

export const DS_PERMISSION_LABELS: Record<DsPermission, string> = {
  "pos.sell": "POS · vender",
  "pos.refund": "POS · anular",
  "pos.discount": "POS · descuento",
  "pos.closures": "POS · cierres",
  "inventory.read": "Inventario · consultar",
  "inventory.adjust": "Inventario · ajustar",
  "inventory.products": "Inventario · productos",
  "purchases.create": "Compras · crear",
  "purchases.manage": "Compras · gestionar",
  "purchases.approve": "Compras · aprobar",
  "clients.read": "Clientes · consultar",
  "clients.manage": "Clientes · gestionar",
  "suppliers.manage": "Proveedores",
  "finance.rates": "Finanzas · tasas",
  "finance.cpp": "Finanzas · costo promedio",
  "finance.accounts": "Finanzas · cuentas",
  "finance.manage": "Finanzas · gestionar",
  "reports.read": "Informes",
  "analysis.view": "Análisis de compras",
  "users.manage": "Usuarios y permisos",
  "settings.manage": "Configuración",
  "license.manage": "Licencia / negocio",
};

export const DS_ROLE_LABELS: Record<DsRole, string> = {
  admin: "ADMIN",
  supervisor: "SUPERVISOR",
  cajero: "CAJERO",
  inventario: "INVENTARIO",
  finanzas: "FINANZAS",
};

export const DS_DEFAULT_ROLE_PERMISSIONS: Record<DsRole, DsPermission[]> = {
  admin: [...DS_ALL_PERMISSIONS],
  supervisor: [
    "pos.sell",
    "pos.refund",
    "pos.discount",
    "pos.closures",
    "inventory.read",
    "inventory.adjust",
    "inventory.products",
    "purchases.create",
    "purchases.manage",
    "purchases.approve",
    "clients.read",
    "clients.manage",
    "suppliers.manage",
    "finance.rates",
    "finance.cpp",
    "finance.accounts",
    "finance.manage",
    "reports.read",
    "analysis.view",
    "settings.manage",
    "license.manage",
  ],
  cajero: ["pos.sell", "pos.discount", "pos.closures"],
  inventario: [
    "inventory.read",
    "inventory.adjust",
    "inventory.products",
    "purchases.create",
    "purchases.manage",
    "suppliers.manage",
    "analysis.view",
    "reports.read",
  ],
  finanzas: [
    "finance.rates",
    "finance.cpp",
    "finance.accounts",
    "finance.manage",
    "reports.read",
    "clients.read",
  ],
};

export function resolvePermissions(
  user: Pick<DsUser, "role" | "customPermissions" | "deniedPermissions">,
  roleOverrides?: Partial<Record<DsRole, DsPermission[]>>,
): Set<DsPermission> {
  const set = new Set<DsPermission>();

  if (user.customPermissions?.length) {
    for (const p of user.customPermissions) set.add(p);
  } else {
    const base =
      roleOverrides?.[user.role] ?? DS_DEFAULT_ROLE_PERMISSIONS[user.role];
    for (const p of base) set.add(p);
  }

  for (const p of user.deniedPermissions ?? []) set.delete(p);

  return set;
}

export function hasPermission(
  user: Pick<DsUser, "active" | "role" | "customPermissions" | "deniedPermissions"> | null | undefined,
  permission: DsPermission,
  roleOverrides?: Partial<Record<DsRole, DsPermission[]>>,
): boolean {
  if (!user || !user.active) return false;
  if (user.role === "admin") return true;
  return resolvePermissions(user, roleOverrides).has(permission);
}

export function can(
  user: Pick<DsUser, "active" | "role" | "customPermissions" | "deniedPermissions"> | null | undefined,
  permission: DsPermission,
  roleOverrides?: Partial<Record<DsRole, DsPermission[]>>,
): boolean {
  return hasPermission(user, permission, roleOverrides);
}

export function hasAnyPermission(
  user: Pick<DsUser, "active" | "role" | "customPermissions" | "deniedPermissions"> | null | undefined,
  permissions: DsPermission[],
  roleOverrides?: Partial<Record<DsRole, DsPermission[]>>,
): boolean {
  if (!user || !user.active) return false;
  if (user.role === "admin") return true;
  const set = resolvePermissions(user, roleOverrides);
  return permissions.some((p) => set.has(p));
}
