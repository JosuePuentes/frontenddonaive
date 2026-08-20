/**
 * A&D Fase 3 — portal / auth público / contratos de conexión FE.
 */
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/ad/password.js";
import {
  resolveRolePermissions,
} from "../src/ad/authorization.js";
import {
  AD_DEFAULT_ROLE_PERMISSIONS,
  type AdOperatorRoleName,
} from "../src/ad/permissions.js";
import { createApp } from "../src/app.js";
import request from "supertest";

describe("A&D Fase 3 — auth público montado sin X-User-Id", () => {
  const app = createApp();

  it("POST /api/v1/ad/auth/login valida payload (sin DB: 503 o 400)", async () => {
    const res = await request(app)
      .post("/api/v1/ad/auth/login")
      .send({ username: "admin" });
    // Sin tenant → ValidationError 400; sin DB → 503
    expect([400, 503]).toContain(res.status);
  });

  it("POST /api/v1/ad/bootstrap valida password mínimo", async () => {
    const res = await request(app)
      .post("/api/v1/ad/bootstrap")
      .send({ adminPassword: "123" });
    expect([400, 503]).toContain(res.status);
  });

  it("rutas protegidas A&D siguen exigiendo auth Core", async () => {
    const res = await request(app).get("/api/v1/ad/snapshot");
    expect([401, 503]).toContain(res.status);
  });

  it("GET /api/v1/ad/spaces exige JWT", async () => {
    const res = await request(app).get("/api/v1/ad/spaces");
    expect([401, 503]).toContain(res.status);
  });
});

describe("A&D Fase 3 — matriz de roles para FE", () => {
  it("cajero tiene POS y no users.manage por defecto", () => {
    const perms = resolveRolePermissions("cajero", []);
    expect(perms.has("pos.sell")).toBe(true);
    expect(perms.has("users.manage")).toBe(false);
    expect(perms.has("finance.view")).toBe(false);
    expect(perms.has("clients.read")).toBe(false);
  });

  it("admin tiene users.manage y pos.shortage_override", () => {
    const perms = resolveRolePermissions("admin", []);
    expect(perms.has("users.manage")).toBe(true);
    expect(perms.has("pos.shortage_override")).toBe(true);
  });

  it("mesonera puede servir y no vender POS por defecto", () => {
    const perms = resolveRolePermissions("mesonera", []);
    expect(perms.has("accounts.serve")).toBe(true);
    expect(perms.has("pos.sell")).toBe(false);
  });

  it("matriz default cubre roles operativos", () => {
    const roles: AdOperatorRoleName[] = [
      "admin",
      "supervisor",
      "cajero",
      "mesonera",
      "inventario",
      "tv",
    ];
    for (const role of roles) {
      expect(AD_DEFAULT_ROLE_PERMISSIONS[role]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("A&D Fase 3 — password bootstrap-ready", () => {
  it("hash/verify listo para operadores creados vía portal", () => {
    const hash = hashPassword("Admin#2026");
    expect(verifyPassword("Admin#2026", hash)).toBe(true);
  });
});
