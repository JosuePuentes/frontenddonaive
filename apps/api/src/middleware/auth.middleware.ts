import type { NextFunction, Request, Response } from "express";
import type { PlatformRole } from "@prisma/client";
import {
  buildAuthContext,
  type AuthContext,
} from "../auth/authorization.js";
import { UnauthorizedError } from "../errors/app-error.js";

export type AuthenticatedRequest = Request & {
  auth: AuthContext;
};

function parseRoles(headerValue: string | undefined): PlatformRole[] {
  if (!headerValue) return ["project_user"];
  return headerValue.split(",").map((r) => r.trim()) as PlatformRole[];
}

function parseProjectIds(headerValue: string | undefined): string[] {
  if (!headerValue) return [];
  return headerValue.split(",").map((id) => id.trim()).filter(Boolean);
}

/**
 * Autenticación base del Core.
 * En producción se reemplazará por JWT; por ahora headers de desarrollo:
 * - X-User-Id (requerido para rutas protegidas)
 * - X-User-Email
 * - X-User-Roles (comma-separated)
 * - X-Accessible-Project-Ids (comma-separated)
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const userId = req.header("X-User-Id");

  if (!userId) {
    next(new UnauthorizedError("Header X-User-Id requerido"));
    return;
  }

  const auth = buildAuthContext({
    userId,
    email: req.header("X-User-Email") ?? undefined,
    roles: parseRoles(req.header("X-User-Roles")),
    accessibleProjectIds: parseProjectIds(
      req.header("X-Accessible-Project-Ids"),
    ),
  });

  (req as AuthenticatedRequest).auth = auth;
  next();
}

export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const userId = req.header("X-User-Id");
  if (userId) {
    (req as AuthenticatedRequest).auth = buildAuthContext({
      userId,
      email: req.header("X-User-Email") ?? undefined,
      roles: parseRoles(req.header("X-User-Roles")),
      accessibleProjectIds: parseProjectIds(
        req.header("X-Accessible-Project-Ids"),
      ),
    });
  }
  next();
}

export function getAuth(req: Request): AuthContext {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) {
    throw new UnauthorizedError();
  }
  return auth;
}
