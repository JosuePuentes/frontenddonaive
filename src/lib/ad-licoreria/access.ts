/**
 * Acceso operativo A&D — permisos, roles y depósitos.
 * Única fuente de verdad para autorización en el mock (UI → Provider → Repository).
 */

import type { AdOperator, AdPermission, AdRole } from "@/types/ad-licoreria";

export const AD_ALL_PERMISSIONS: AdPermission[] = [
  "pos.sell",
  "pos.refund",
  "pos.discount",
  "pos.close_account",
  "pos.shortage_override",
  "inventory.read",
  "inventory.adjust",
  "inventory.transfer",
  "inventory.receive",
  "purchase.create",
  "purchase.approve",
  "cop.read",
  "cop.transfer",
  "cop.purchase_request",
  "reports.read",
  "users.manage",
  "deposits.manage",
  "settings.manage",
  "accounts.open",
  "accounts.serve",
  "tables.manage",
  "clients.read",
  "closures.create",
];

export const AD_PERMISSION_LABELS: Record<AdPermission, string> = {
  "pos.sell": "POS · vender",
  "pos.refund": "POS · anular / reembolso",
  "pos.discount": "POS · descuento",
  "pos.close_account": "POS · cerrar cuenta",
  "pos.shortage_override": "POS · continuar con faltante",
  "inventory.read": "Inventario · consultar",
  "inventory.adjust": "Inventario · ajustar",
  "inventory.transfer": "Inventario · transferir",
  "inventory.receive": "Inventario · recibir",
  "purchase.create": "Compras · crear",
  "purchase.approve": "Compras · aprobar",
  "cop.read": "COP · consultar",
  "cop.transfer": "COP · transferencias",
  "cop.purchase_request": "COP · solicitud compra",
  "reports.read": "Reportes",
  "users.manage": "Usuarios",
  "deposits.manage": "Depósitos",
  "settings.manage": "Configuración crítica",
  "accounts.open": "Cuentas · abrir",
  "accounts.serve": "Cuentas · servir",
  "tables.manage": "Espacios / mesas",
  "clients.read": "Clientes",
  "closures.create": "Cierres de caja",
};

/** Permisos por defecto de cada rol (personalizables en mock ADMIN). */
export const AD_DEFAULT_ROLE_PERMISSIONS: Record<AdRole, AdPermission[]> = {
  admin: [...AD_ALL_PERMISSIONS],
  supervisor: [
    "pos.sell",
    "pos.refund",
    "pos.discount",
    "pos.close_account",
    "pos.shortage_override",
    "inventory.read",
    "inventory.adjust",
    "inventory.transfer",
    "inventory.receive",
    "purchase.create",
    "purchase.approve",
    "cop.read",
    "cop.transfer",
    "cop.purchase_request",
    "reports.read",
    "accounts.open",
    "accounts.serve",
    "tables.manage",
    "clients.read",
    "closures.create",
  ],
  cajero: [
    "pos.sell",
    "pos.discount",
    "pos.close_account",
    "clients.read",
    "accounts.open",
    "closures.create",
    "reports.read",
  ],
  mesonera: [
    "accounts.open",
    "accounts.serve",
    "tables.manage",
    "clients.read",
  ],
  inventario: [
    "inventory.read",
    "inventory.adjust",
    "inventory.transfer",
    "inventory.receive",
    "purchase.create",
    "cop.read",
    "cop.transfer",
    "cop.purchase_request",
    "reports.read",
  ],
};

export const AD_ROLE_LABELS: Record<AdRole, string> = {
  admin: "ADMIN",
  supervisor: "SUPERVISOR",
  cajero: "CAJERO",
  mesonera: "MESONERA",
  inventario: "INVENTARIO",
};

/**
 * Resuelve permisos efectivos:
 * rol por defecto → overrides de matriz → flags de usuario → custom/deny.
 */
export function resolvePermissions(
  user: Pick<
    AdOperator,
    | "role"
    | "posEnabled"
    | "inventoryAccess"
    | "copAccess"
    | "purchaseAccess"
    | "closuresAccess"
    | "customPermissions"
    | "deniedPermissions"
  >,
  roleOverrides?: Partial<Record<AdRole, AdPermission[]>>,
): Set<AdPermission> {
  const base = roleOverrides?.[user.role] ?? AD_DEFAULT_ROLE_PERMISSIONS[user.role];
  const set = new Set<AdPermission>(base);

  if (user.posEnabled === true) {
    set.add("pos.sell");
    set.add("pos.close_account");
  }
  if (user.posEnabled === false) {
    set.delete("pos.sell");
    set.delete("pos.refund");
    set.delete("pos.discount");
    set.delete("pos.close_account");
  }
  if (user.inventoryAccess === true) {
    set.add("inventory.read");
  }
  if (user.inventoryAccess === false) {
    set.delete("inventory.read");
    set.delete("inventory.adjust");
    set.delete("inventory.transfer");
    set.delete("inventory.receive");
  }
  if (user.copAccess === true) set.add("cop.read");
  if (user.copAccess === false) {
    set.delete("cop.read");
    set.delete("cop.transfer");
    set.delete("cop.purchase_request");
  }
  if (user.purchaseAccess === true) set.add("purchase.create");
  if (user.purchaseAccess === false) {
    set.delete("purchase.create");
    set.delete("purchase.approve");
  }
  if (user.closuresAccess === true) set.add("closures.create");
  if (user.closuresAccess === false) set.delete("closures.create");

  for (const p of user.customPermissions ?? []) set.add(p);
  for (const p of user.deniedPermissions ?? []) set.delete(p);

  return set;
}

export function hasPermission(
  user: AdOperator | null | undefined,
  permission: AdPermission,
  roleOverrides?: Partial<Record<AdRole, AdPermission[]>>,
): boolean {
  if (!user || !user.active) return false;
  return resolvePermissions(user, roleOverrides).has(permission);
}

/**
 * API reutilizable de autorización (misma regla conceptual para futura API).
 * Preferir `can(user, "pos.shortage_override")` frente a `if (role === …)`.
 */
export function can(
  user: AdOperator | null | undefined,
  permission: AdPermission,
  roleOverrides?: Partial<Record<AdRole, AdPermission[]>>,
): boolean {
  return hasPermission(user, permission, roleOverrides);
}

export type ShortageOverrideGateInput = {
  user: AdOperator | null | undefined;
  continueWithShortage: boolean;
  reasonCode?: string | null;
  reasonNote?: string | null;
  roleOverrides?: Partial<Record<AdRole, AdPermission[]>>;
};

export type ShortageOverrideGateResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Gate central: el flag continueWithShortage no basta sin permiso + motivo.
 */
export function assertShortageOverride(
  input: ShortageOverrideGateInput,
): ShortageOverrideGateResult {
  if (!input.continueWithShortage) return { ok: true };
  if (!can(input.user, "pos.shortage_override", input.roleOverrides)) {
    return {
      ok: false,
      error:
        "Sin permiso pos.shortage_override. Solo ADMIN/SUPERVISOR (o permiso explícito) pueden continuar con faltante.",
    };
  }
  const code = (input.reasonCode ?? "").trim();
  if (!code) {
    return {
      ok: false,
      error: "Motivo obligatorio para continuar con faltante",
    };
  }
  if (code === "otro" && !(input.reasonNote ?? "").trim()) {
    return {
      ok: false,
      error: "Detalle obligatorio cuando el motivo es «otro»",
    };
  }
  return { ok: true };
}

/**
 * Restricción real de depósito.
 * - warehouseId null/undefined en usuario = transversal (admin/inventario).
 * - Si tiene depósito asignado, solo ese.
 */
export function canAccessWarehouse(
  user: Pick<AdOperator, "active" | "warehouseId" | "role"> | null | undefined,
  warehouseId: string,
): boolean {
  if (!user || !user.active) return false;
  if (!user.warehouseId) return true;
  return user.warehouseId === warehouseId;
}

/** Depósito operativo forzado para POS (null = no puede entrar a POS). */
export function posWarehouseIdFor(
  user: Pick<AdOperator, "active" | "warehouseId" | "posEnabled" | "role"> | null | undefined,
): string | null {
  if (!user || !user.active) return null;
  if (user.posEnabled === false) return null;
  if (!user.warehouseId) {
    // Admin/supervisor transversal no opera POS salvo depósito explícito
    return null;
  }
  return user.warehouseId;
}

export function canOperatePos(user: AdOperator | null | undefined): boolean {
  if (!user || !user.active) return false;
  if (user.posEnabled === false) return false;
  if (!user.warehouseId) return false;
  return hasPermission(user, "pos.sell");
}
