import { describe, it, expect } from "vitest";
import { PlatformRole } from "@prisma/client";
import {
  buildAuthContext,
  canAccessProject,
  filterAccessibleProjectIds,
  hasCapability,
  requireProjectAccess,
  assertReadOnlyIntelligence,
} from "../src/auth/authorization.js";
import { API_CAPABILITIES } from "../src/auth/capabilities.js";
import { ForbiddenError } from "../src/errors/app-error.js";

const PROJECT_A = "project-a-uuid";
const PROJECT_B = "project-b-uuid";

function ctxForProjectA() {
  return buildAuthContext({
    userId: "user-a",
    roles: [PlatformRole.project_user],
    accessibleProjectIds: [PROJECT_A],
  });
}

function ctxForProjectB() {
  return buildAuthContext({
    userId: "user-b",
    roles: [PlatformRole.project_user],
    accessibleProjectIds: [PROJECT_B],
  });
}

function adminCtx() {
  return buildAuthContext({
    userId: "admin-1",
    roles: [PlatformRole.donaive_admin],
    accessibleProjectIds: [],
  });
}

describe("authorization — aislamiento entre Projects", () => {
  it("Project A puede acceder a su propio project", () => {
    expect(canAccessProject(ctxForProjectA(), PROJECT_A)).toBe(true);
  });

  it("Project A NO puede acceder a Project B", () => {
    expect(canAccessProject(ctxForProjectA(), PROJECT_B)).toBe(false);
  });

  it("requireProjectAccess lanza ForbiddenError para Project ajeno", () => {
    expect(() => requireProjectAccess(ctxForProjectA(), PROJECT_B)).toThrow(
      ForbiddenError,
    );
  });

  it("filterAccessibleProjectIds excluye Projects no autorizados", () => {
    const visible = filterAccessibleProjectIds(ctxForProjectA(), [
      PROJECT_A,
      PROJECT_B,
    ]);
    expect(visible).toEqual([PROJECT_A]);
  });

  it("Donaive Admin accede a cualquier Project", () => {
    expect(canAccessProject(adminCtx(), PROJECT_B)).toBe(true);
  });
});

describe("authorization — capabilities", () => {
  it("project_user tiene project.read", () => {
    expect(hasCapability(ctxForProjectA(), API_CAPABILITIES.PROJECT_READ)).toBe(
      true,
    );
  });

  it("project_user NO tiene license.manage", () => {
    expect(
      hasCapability(ctxForProjectA(), API_CAPABILITIES.LICENSE_MANAGE),
    ).toBe(false);
  });

  it("donaive_admin tiene todas las capabilities", () => {
    expect(hasCapability(adminCtx(), API_CAPABILITIES.LICENSE_MANAGE)).toBe(
      true,
    );
    expect(hasCapability(adminCtx(), API_CAPABILITIES.AGENT_EXECUTE)).toBe(
      true,
    );
  });
});

describe("authorization — Donaive Intelligence read-only", () => {
  it("intelligence no puede tener capabilities de escritura sensibles", () => {
    const ctx = buildAuthContext({
      userId: "intel-1",
      roles: [PlatformRole.donaive_intelligence],
      accessibleProjectIds: [PROJECT_A],
      extraCapabilities: [API_CAPABILITIES.AGENT_PUBLISH],
    });

    expect(() => assertReadOnlyIntelligence(ctx)).toThrow(ForbiddenError);
  });

  it("intelligence con solo lectura pasa validación", () => {
    const ctx = buildAuthContext({
      userId: "intel-1",
      roles: [PlatformRole.donaive_intelligence],
      accessibleProjectIds: [PROJECT_A],
    });

    expect(() => assertReadOnlyIntelligence(ctx)).not.toThrow();
  });
});

describe("authorization — permisos sensibles", () => {
  it("project_user no puede apply updates", () => {
    expect(
      hasCapability(ctxForProjectA(), API_CAPABILITIES.PROJECT_UPDATES_APPLY),
    ).toBe(false);
  });

  it("project_admin puede apply updates", () => {
    const ctx = buildAuthContext({
      userId: "pa-1",
      roles: [PlatformRole.project_admin],
      accessibleProjectIds: [PROJECT_A],
    });
    expect(
      hasCapability(ctx, API_CAPABILITIES.PROJECT_UPDATES_APPLY),
    ).toBe(true);
  });
});
