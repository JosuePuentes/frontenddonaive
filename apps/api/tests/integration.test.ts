import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const LOCAL_DB =
  process.env.DATABASE_URL ??
  "postgresql://donaive:donaive@localhost:5432/donaive_core_dev";

describe("API v1 — integración PostgreSQL (local)", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = LOCAL_DB;
  });

  afterAll(async () => {
    const { disconnectDatabase } = await import("../src/config/database.js");
    await disconnectDatabase();
  });

  it("GET /api/v1/projects responde con lista (puede estar vacía)", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/projects")
      .set("X-User-Id", "admin-test")
      .set("X-User-Roles", "donaive_admin");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/v1/projects crea y GET /:id respeta aislamiento", async () => {
    const app = createApp();
    const { getPrisma } = await import("../src/config/database.js");
    const prisma = getPrisma();

    const org = await prisma.organization.create({
      data: { name: "Test Org Integration" },
    });

    const createRes = await request(app)
      .post("/api/v1/projects")
      .set("X-User-Id", "admin-test")
      .set("X-User-Roles", "donaive_admin")
      .send({
        organizationId: org.id,
        commercialName: "Farmacia Central",
        technicalSlug: `farmacia-central-${Date.now()}`,
        category: "pharmacy",
      });

    expect(createRes.status).toBe(201);
    const projectId = createRes.body.data.id;

    const deniedRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("X-User-Id", "other-user")
      .set("X-User-Roles", "project_user")
      .set("X-Accessible-Project-Ids", "other-project-id");

    expect(deniedRes.status).toBe(403);

    const allowedRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set("X-User-Id", "scoped-user")
      .set("X-User-Roles", "project_user")
      .set("X-Accessible-Project-Ids", projectId);

    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.data.commercialName).toBe("Farmacia Central");

    await prisma.project.delete({ where: { id: projectId } });
    await prisma.organization.delete({ where: { id: org.id } });
  });
});
