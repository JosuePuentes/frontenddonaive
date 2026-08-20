import { ForbiddenError, ValidationError } from "../errors/app-error.js";
import {
  AD_DEFAULT_ROLE_PERMISSIONS,
  type AdOperatorRoleName,
  type AdPermission,
} from "./permissions.js";

export type AdOperatorAuth = {
  id: string;
  tenantId: string;
  userId: string | null;
  username: string;
  name: string;
  role: AdOperatorRoleName;
  active: boolean;
  warehouseId: string | null;
  /** Permisos explícitos del operador (si vacíos → defaults del rol). */
  permissions: AdPermission[];
};

export type AdRequestContext = {
  tenantId: string;
  projectId: string;
  operator: AdOperatorAuth;
  /** Depósito efectivo resuelto en backend (no confiar en body). */
  warehouseId: string | null;
  permissions: Set<AdPermission>;
};

export function resolveRolePermissions(
  role: AdOperatorRoleName,
  operatorPermissions: AdPermission[],
  roleOverrides?: Partial<Record<AdOperatorRoleName, AdPermission[]>>,
): Set<AdPermission> {
  if (operatorPermissions.length > 0) {
    return new Set(operatorPermissions);
  }
  const fromOverride = roleOverrides?.[role];
  if (fromOverride) {
    return new Set(fromOverride);
  }
  return new Set(AD_DEFAULT_ROLE_PERMISSIONS[role] ?? []);
}

export function hasAdPermission(
  ctx: AdRequestContext,
  permission: AdPermission,
): boolean {
  if (ctx.operator.role === "admin") return true;
  return ctx.permissions.has(permission);
}

export function requireAdPermission(
  ctx: AdRequestContext,
  permission: AdPermission,
): void {
  if (!hasAdPermission(ctx, permission)) {
    throw new ForbiddenError(`Permiso A&D requerido: ${permission}`);
  }
}

/** Al menos uno de los permisos listados (p. ej. POS o inventario para escaneo). */
export function requireAdAnyPermission(
  ctx: AdRequestContext,
  permissions: AdPermission[],
): void {
  if (ctx.operator.role === "admin") return;
  if (permissions.some((p) => ctx.permissions.has(p))) return;
  throw new ForbiddenError(
    `Permiso A&D requerido: ${permissions.join(" o ")}`,
  );
}

/**
 * POS/mesonera: el depósito efectivo es siempre el del operador.
 * Ignora cualquier warehouseId enviado en el body/query.
 */
export function resolveEffectiveWarehouseId(
  operator: AdOperatorAuth,
  requestedWarehouseId: string | null | undefined,
): string | null {
  const lockedRoles: AdOperatorRoleName[] = ["cajero", "mesonera"];
  if (lockedRoles.includes(operator.role)) {
    if (!operator.warehouseId) {
      throw new ValidationError(
        "Operador POS/mesonera debe tener depósito asignado",
      );
    }
    if (
      requestedWarehouseId &&
      requestedWarehouseId !== operator.warehouseId
    ) {
      throw new ForbiddenError(
        "No se permite cruzar depósitos: el depósito del operador es obligatorio",
      );
    }
    return operator.warehouseId;
  }

  if (operator.role === "tv") {
    return null;
  }

  // admin / supervisor / inventario pueden operar sobre un depósito indicado
  if (requestedWarehouseId) {
    return requestedWarehouseId;
  }
  return operator.warehouseId;
}

export function requireWarehouseAccess(
  ctx: AdRequestContext,
  warehouseId: string,
): void {
  const lockedRoles: AdOperatorRoleName[] = ["cajero", "mesonera"];
  if (lockedRoles.includes(ctx.operator.role)) {
    if (ctx.operator.warehouseId !== warehouseId) {
      throw new ForbiddenError(
        "Aislamiento por depósito: acceso denegado al depósito solicitado",
      );
    }
  }
}

export function assertSameWarehouseSale(
  operator: AdOperatorAuth,
  saleWarehouseId: string,
): void {
  const effective = resolveEffectiveWarehouseId(operator, saleWarehouseId);
  if (!effective) {
    throw new ValidationError("Depósito requerido para la venta");
  }
  if (effective !== saleWarehouseId) {
    throw new ForbiddenError(
      "La venta no puede realizarse en un depósito distinto al del operador",
    );
  }
}
