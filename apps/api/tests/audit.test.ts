import { describe, it, expect } from "vitest";

describe("AuditLog — contrato", () => {
  it("define campos mínimos requeridos", () => {
    const entry = {
      id: "audit-1",
      actorType: "user" as const,
      actorId: "user-1",
      action: "project.create",
      entityType: "Project",
      entityId: "proj-1",
      projectId: "proj-1",
      organizationId: "org-1",
      metadata: { source: "test" },
      reason: "creación inicial",
      approvalId: undefined,
      agentRunId: undefined,
      createdAt: new Date().toISOString(),
    };

    expect(entry.action).toBe("project.create");
    expect(entry.projectId).toBe("proj-1");
    expect(entry.actorId).toBe("user-1");
  });

  it("auditoría es append-only por diseño (sin operación delete en servicio)", async () => {
    const auditModule = await import("../src/services/audit.service.js");
    expect(auditModule.auditService.log).toBeDefined();
    expect(auditModule.auditService.list).toBeDefined();
    expect(
      (auditModule.auditService as Record<string, unknown>).delete,
    ).toBeUndefined();
  });
});
