import type { NextFunction, Request, Response } from "express";
import type { AdOperatorRole } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../errors/app-error.js";
import { getAuth } from "../middleware/auth.middleware.js";
import {
  resolveRolePermissions,
  type AdOperatorAuth,
  type AdRequestContext,
} from "./authorization.js";
import type { AdOperatorRoleName, AdPermission } from "./permissions.js";
import { isAdPermission } from "./permissions.js";

export type AdAuthenticatedRequest = Request & {
  ad?: AdRequestContext;
};

function toRoleName(role: AdOperatorRole): AdOperatorRoleName {
  return role as AdOperatorRoleName;
}

async function loadOperatorById(operatorId: string): Promise<AdOperatorAuth> {
  const prisma = getPrisma();
  const op = await prisma.adOperator.findUnique({
    where: { id: operatorId },
    include: { permissions: true },
  });
  if (!op || !op.active) {
    throw new UnauthorizedError("Operador A&D inválido o inactivo");
  }
  const permissions = op.permissions
    .map((p) => p.permission)
    .filter(isAdPermission) as AdPermission[];

  return {
    id: op.id,
    tenantId: op.tenantId,
    userId: op.userId,
    username: op.username,
    name: op.name,
    role: toRoleName(op.role),
    active: op.active,
    warehouseId: op.warehouseId,
    permissions,
  };
}

async function loadOperatorByUserId(
  tenantId: string,
  userId: string,
): Promise<AdOperatorAuth | null> {
  const prisma = getPrisma();
  const op = await prisma.adOperator.findFirst({
    where: { tenantId, userId, active: true },
    include: { permissions: true },
  });
  if (!op) return null;
  const permissions = op.permissions
    .map((p) => p.permission)
    .filter(isAdPermission) as AdPermission[];
  return {
    id: op.id,
    tenantId: op.tenantId,
    userId: op.userId,
    username: op.username,
    name: op.name,
    role: toRoleName(op.role),
    active: op.active,
    warehouseId: op.warehouseId,
    permissions,
  };
}

/**
 * Resuelve contexto A&D:
 * - Header `X-Ad-Operator-Id` (preferido en F1)
 * - o User autenticado Core + `X-Ad-Tenant-Id` / query tenantId
 *
 * El depósito efectivo NO se toma ciegamente del body.
 */
export async function adContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = getAuth(req);
    const operatorId = req.header("X-Ad-Operator-Id");
    const tenantHeader = req.header("X-Ad-Tenant-Id");

    let operator: AdOperatorAuth | null = null;

    if (operatorId) {
      operator = await loadOperatorById(operatorId);
      if (operator.userId && operator.userId !== auth.userId) {
        // Permitir admin de plataforma; si hay vínculo userId debe coincidir
        const isPlatformAdmin = auth.roles.includes("donaive_admin");
        if (!isPlatformAdmin) {
          throw new ForbiddenError(
            "El operador A&D no pertenece al usuario autenticado",
          );
        }
      }
    } else if (tenantHeader) {
      operator = await loadOperatorByUserId(tenantHeader, auth.userId);
    }

    if (!operator) {
      throw new UnauthorizedError(
        "Contexto A&D requerido (X-Ad-Operator-Id o X-Ad-Tenant-Id + User)",
      );
    }

    const tenant = await getPrisma().adTenant.findUnique({
      where: { id: operator.tenantId },
    });
    if (!tenant || !tenant.active) {
      throw new ForbiddenError("Tenant A&D inactivo o inexistente");
    }

    const permissions = resolveRolePermissions(
      operator.role,
      operator.permissions,
    );

    (req as AdAuthenticatedRequest).ad = {
      tenantId: operator.tenantId,
      projectId: tenant.projectId,
      operator,
      warehouseId: operator.warehouseId,
      permissions,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function getAdContext(req: Request): AdRequestContext {
  const ad = (req as AdAuthenticatedRequest).ad;
  if (!ad) {
    throw new UnauthorizedError("Contexto A&D no resuelto");
  }
  return ad;
}

export function optionalRequestedWarehouse(
  req: Request,
): string | null | undefined {
  const fromQuery = req.query.warehouseId;
  if (typeof fromQuery === "string" && fromQuery.length > 0) {
    return fromQuery;
  }
  const body = req.body as { warehouseId?: string } | undefined;
  return body?.warehouseId;
}

export function requireTenantIdMatch(
  ctx: AdRequestContext,
  tenantId: string | undefined,
): void {
  if (tenantId && tenantId !== ctx.tenantId) {
    throw new ValidationError("tenantId no coincide con el contexto A&D");
  }
}
