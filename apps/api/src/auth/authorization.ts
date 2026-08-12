import type { PlatformRole } from "@prisma/client";
import {
  API_CAPABILITIES,
  GLOBAL_ROLES,
  READ_ONLY_INTELLIGENCE_ROLES,
  ROLE_DEFAULT_CAPABILITIES,
  type ApiCapability,
} from "./capabilities.js";
import { ForbiddenError } from "../errors/app-error.js";

export type AuthContext = {
  userId: string;
  email?: string;
  roles: PlatformRole[];
  /** Projects a los que el usuario tiene acceso explícito. */
  accessibleProjectIds: string[];
  /** Capabilities resueltas (rol + DB futura). */
  capabilities: Set<ApiCapability>;
};

export type AuthorizationScope = {
  organizationId?: string;
  projectId?: string;
};

export function buildAuthContext(input: {
  userId: string;
  email?: string;
  roles: PlatformRole[];
  accessibleProjectIds?: string[];
  extraCapabilities?: ApiCapability[];
}): AuthContext {
  const capabilities = new Set<ApiCapability>();

  for (const role of input.roles) {
    const defaults = ROLE_DEFAULT_CAPABILITIES[role] ?? [];
    for (const cap of defaults) {
      capabilities.add(cap);
    }
  }

  for (const cap of input.extraCapabilities ?? []) {
    capabilities.add(cap);
  }

  return {
    userId: input.userId,
    email: input.email,
    roles: input.roles,
    accessibleProjectIds: input.accessibleProjectIds ?? [],
    capabilities,
  };
}

export function hasCapability(
  ctx: AuthContext,
  capability: ApiCapability,
): boolean {
  if (ctx.roles.includes("donaive_admin")) {
    return true;
  }
  return ctx.capabilities.has(capability);
}

export function requireCapability(
  ctx: AuthContext,
  capability: ApiCapability,
): void {
  if (!hasCapability(ctx, capability)) {
    throw new ForbiddenError(`Capability requerida: ${capability}`);
  }
}

export function canAccessProject(
  ctx: AuthContext,
  projectId: string,
): boolean {
  if (ctx.roles.some((r) => GLOBAL_ROLES.has(r))) {
    return true;
  }
  return ctx.accessibleProjectIds.includes(projectId);
}

export function requireProjectAccess(
  ctx: AuthContext,
  projectId: string,
): void {
  if (!canAccessProject(ctx, projectId)) {
    throw new ForbiddenError(
      "Acceso denegado: el usuario no tiene permiso sobre este Project",
    );
  }
}

export function assertReadOnlyIntelligence(ctx: AuthContext): void {
  const isIntelligence = ctx.roles.some((r) =>
    READ_ONLY_INTELLIGENCE_ROLES.has(r),
  );
  if (!isIntelligence) {
    return;
  }

  const writeCaps: ApiCapability[] = [
    API_CAPABILITIES.CORE_WRITE,
    API_CAPABILITIES.PROJECT_WRITE,
    API_CAPABILITIES.PROJECT_MANAGE,
    API_CAPABILITIES.PROJECT_UPDATES_APPLY,
    API_CAPABILITIES.LICENSE_MANAGE,
    API_CAPABILITIES.SUBSCRIPTION_MANAGE,
    API_CAPABILITIES.AGENT_PUBLISH,
    API_CAPABILITIES.AGENT_EXECUTE,
  ];

  for (const cap of writeCaps) {
    if (ctx.capabilities.has(cap)) {
      throw new ForbiddenError(
        "Donaive Intelligence es read-only; operación de escritura denegada",
      );
    }
  }
}

export function filterAccessibleProjectIds(
  ctx: AuthContext,
  projectIds: string[],
): string[] {
  if (ctx.roles.some((r) => GLOBAL_ROLES.has(r))) {
    return projectIds;
  }
  const allowed = new Set(ctx.accessibleProjectIds);
  return projectIds.filter((id) => allowed.has(id));
}
