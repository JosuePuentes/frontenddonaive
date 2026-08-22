/**
 * A&D Fase 8 — Dashboard E2E.
 */
import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import {
  pctChange,
  resolveDashboardPeriod,
} from "../src/ad/dashboard-period.js";
import { createApp } from "../src/app.js";
import { isDatabaseConfigured } from "../src/config/env.js";
import { connectDatabase, getPrisma } from "../src/config/database.js";

describe("F8 dashboard period", () => {
  it("hoy / mes / personalizado", () => {
    const hoy = resolveDashboardPeriod({
      timezone: "America/Caracas",
      preset: "hoy",
      now: new Date("2026-08-15T15:00:00.000Z"),
    });
    expect(hoy.fromDate).toBe("2026-08-15");
    expect(hoy.toDate).toBe("2026-08-15");

    const mes = resolveDashboardPeriod({
      timezone: "America/Caracas",
      preset: "mes",
      now: new Date("2026-08-15T15:00:00.000Z"),
    });
    expect(mes.fromDate).toBe("2026-08-01");
    expect(mes.toDate).toBe("2026-08-15");

    const custom = resolveDashboardPeriod({
      timezone: "America/Caracas",
      preset: "personalizado",
      from: "2026-07-01",
      to: "2026-07-31",
    });
    expect(custom.fromDate).toBe("2026-07-01");
    expect(custom.previousToDate).toBe("2026-06-30");
    expect(pctChange(110, 100)).toBeCloseTo(10, 5);
  });
});

const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";
const hasDb = isDatabaseConfigured();
const describeE2E = hasDb ? describe : describe.skip;

describeE2E("A&D Fase 8 — dashboard E2E", () => {
  const app = createApp();
  let adminToken = "";
  let mesoneraToken = "";

  function auth(t: string) {
    return { Authorization: `Bearer ${t}` };
  }

  async function login(username: string) {
    const res = await request(app).post("/api/v1/ad/auth/login").send({
      tenantSlug: "ad-licoreria",
      username,
      password: DEMO_PASSWORD,
    });
    expect(res.status).toBe(200);
    return res.body.data.accessToken as string;
  }

  beforeAll(async () => {
    await connectDatabase();
    const tenant = await getPrisma().adTenant.findUnique({
      where: { slug: "ad-licoreria" },
    });
    if (!tenant) throw new Error("Ejecute npm run seed:ad");
    adminToken = await login("admin");
    mesoneraToken = await login("mesonera.lic");
  }, 60_000);

  it("dashboard hoy + mes + estructura", async () => {
    const hoy = await request(app)
      .get("/api/v1/ad/finance/dashboard?preset=hoy")
      .set(auth(adminToken));
    expect(hoy.status).toBe(200);
    expect(hoy.body.data.executive).toBeDefined();
    expect(hoy.body.data.sales).toBeDefined();
    expect(hoy.body.data.profitability).toBeDefined();
    expect(hoy.body.data.banks).toBeDefined();
    expect(hoy.body.data.exchange).toBeDefined();
    expect(hoy.body.data.purchases).toBeDefined();
    expect(hoy.body.data.expenses).toBeDefined();
    expect(hoy.body.data.inventory).toBeDefined();
    expect(hoy.body.data.warehouses).toBeDefined();
    expect(hoy.body.data.topProducts).toBeDefined();
    expect(hoy.body.data.suppliers).toBeDefined();
    expect(hoy.body.data.comparison).toBeDefined();
    expect(hoy.body.data.readOnly).toBe(true);
    expect(hoy.body.data.profitability.distinction.cppHistorico).toBeTruthy();
    expect(hoy.body.data).not.toHaveProperty("protectedRate");
    expect(hoy.body.data.period).not.toHaveProperty("protectedRate");
    expect(hoy.body.data.payments.note).toMatch(/no se expone/i);

    const mes = await request(app)
      .get("/api/v1/ad/finance/dashboard?preset=mes&displayCurrency=USD")
      .set(auth(adminToken));
    expect(mes.status).toBe(200);
    expect(mes.body.data.period.preset).toBe("mes");
  });

  it("drill-down ventas / bancos / compras", async () => {
    const sales = await request(app)
      .get(
        "/api/v1/ad/finance/dashboard/drill?section=sales&from=2026-01-01&to=2026-12-31",
      )
      .set(auth(adminToken));
    expect(sales.status).toBe(200);
    expect(Array.isArray(sales.body.data.items)).toBe(true);

    const banks = await request(app)
      .get(
        "/api/v1/ad/finance/dashboard/drill?section=banks&from=2026-01-01&to=2026-12-31",
      )
      .set(auth(adminToken));
    expect(banks.status).toBe(200);

    const purchases = await request(app)
      .get(
        "/api/v1/ad/finance/dashboard/drill?section=purchases&from=2026-01-01&to=2026-12-31",
      )
      .set(auth(adminToken));
    expect(purchases.status).toBe(200);

    const exchange = await request(app)
      .get(
        "/api/v1/ad/finance/dashboard/drill?section=exchange&from=2026-01-01&to=2026-12-31",
      )
      .set(auth(adminToken));
    expect(exchange.status).toBe(200);

    const expenses = await request(app)
      .get(
        "/api/v1/ad/finance/dashboard/drill?section=expenses&from=2026-01-01&to=2026-12-31",
      )
      .set(auth(adminToken));
    expect(expenses.status).toBe(200);

    const inv = await request(app)
      .get(
        "/api/v1/ad/finance/dashboard/drill?section=inventoryMovements&from=2026-01-01&to=2026-12-31",
      )
      .set(auth(adminToken));
    expect(inv.status).toBe(200);
  });

  it("permisos — mesonera sin dashboard", async () => {
    const denied = await request(app)
      .get("/api/v1/ad/finance/dashboard?preset=hoy")
      .set(auth(mesoneraToken));
    expect(denied.status).toBeGreaterThanOrEqual(400);
  });

  it("reposición endpoint sigue separado del dashboard", async () => {
    const product = await getPrisma().adProduct.findFirst({
      where: { tenant: { slug: "ad-licoreria" } },
    });
    expect(product).toBeTruthy();
    const repl = await request(app)
      .get(`/api/v1/ad/finance/products/${product!.id}/replacement-cost`)
      .set(auth(adminToken));
    expect(repl.status).toBe(200);
    expect(repl.body.data.historicalCppUsd).toBeDefined();
    expect(repl.body.data.replacementCostUsd).toBeDefined();
  });
});
