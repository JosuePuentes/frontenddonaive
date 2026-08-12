import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("API v1 — guardia de base de datos", () => {
  it("GET /api/v1/projects responde 503 sin DATABASE_URL", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/projects")
      .set("X-User-Id", "test-user");

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("DATABASE_NOT_CONFIGURED");
  });
});

describe("API v1 — autenticación", () => {
  it("rechaza requests sin X-User-Id", async () => {
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";

    try {
      const app = createApp();
      const res = await request(app).get("/api/v1/projects");
      expect(res.status).toBe(401);
    } finally {
      if (originalUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalUrl;
      }
    }
  });
});

describe("ProjectService — aislamiento (unit)", () => {
  it("filterVisibleProjectIds respeta accesos del usuario", async () => {
    const { projectService } = await import("../src/services/project.service.js");
    const { buildAuthContext } = await import("../src/auth/authorization.js");
    const { PlatformRole } = await import("@prisma/client");

    const ctx = buildAuthContext({
      userId: "u1",
      roles: [PlatformRole.project_user],
      accessibleProjectIds: ["p1"],
    });

    expect(
      projectService.filterVisibleProjectIds(ctx, ["p1", "p2", "p3"]),
    ).toEqual(["p1"]);
  });
});
