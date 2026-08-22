import type { NextFunction, Request, Response } from "express";
import type { AdOperatorRole } from "@prisma/client";
import { getPrisma } from "../config/database.js";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../errors/app-error.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  resolveRolePermissions,
  type AdOperatorAuth,
  type AdRequestContext,
} from "./authorization.js";
import type { AdOperatorRoleName, AdPermission } from "./permissions.js";
import { isAdPermission } from "./permissions.js";
import {
  allowAdDevHeaders,
  extractBearerToken,
  verifyAdAccessToken,
} from "./jwt.js";

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

/**
 * Resuelve contexto A&D:
 * 1. Authorization: Bearer <JWT> (autoridad Fase 4)
 * 2. Solo si AD_ALLOW_DEV_HEADERS=1: X-Ad-Operator-Id (dev)
 *
 * El depósito efectivo NO se toma ciegamente del body.
 */
export async function adContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bearer = extractBearerToken(req.header("authorization") ?? undefined);
    let operator: AdOperatorAuth | null = null;

    if (bearer) {
      const claims = verifyAdAccessToken(bearer);
      const prisma = getPrisma();
      const session = await prisma.adAuthSession.findUnique({
        where: { jti: claims.jti },
      });
      if (!session || session.revokedAt) {
        throw new UnauthorizedError("Sesión A&D revocada o inexistente");
      }
      if (session.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedError("Sesión A&D expirada");
      }
      operator = await loadOperatorById(claims.sub);
      if (operator.tenantId !== claims.tid) {
        throw new ForbiddenError("Token A&D no coincide con el tenant");
      }
    } else if (allowAdDevHeaders()) {
      const operatorId = req.header("X-Ad-Operator-Id");
      if (operatorId) {
        operator = await loadOperatorById(operatorId);
        const coreAuth = (req as AuthenticatedRequest).auth;
        if (coreAuth && operator.userId && operator.userId !== coreAuth.userId) {
          const isPlatformAdmin = coreAuth.roles.includes("donaive_admin");
          if (!isPlatformAdmin) {
            throw new ForbiddenError(
              "El operador A&D no pertenece al usuario autenticado",
            );
          }
        }
      }
    }

    if (!operator) {
      throw new UnauthorizedError(
        "Bearer JWT A&D requerido (Authorization: Bearer …)",
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
