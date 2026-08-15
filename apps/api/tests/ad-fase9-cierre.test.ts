/**
 * A&D Fase 9 — cierre comercial/financiero E2E (PostgreSQL).
 * Cubre A–O del checklist de entrega.
 */
import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import {
  fxConversionDifference,
  resolvePurchaseLineCosts,
} from "../src/ad/commerce-domain.js";
import { resolveDashboardPeriod } from "../src/ad/dashboard-period.js";
import { createApp } from "../src/app.js";
import { isDatabaseConfigured } from "../src/config/env.js";
import { connectDatabase, getPrisma } from "../src/config/database.js";

describe("F9 dominio puro", () => {
  it("A — costo por unidad", () => {
    const r = resolvePurchaseLineCosts({
      qtyInvoiced: 10,
      unitsPerPresentation: 1,
      costMode: "UNIT",
      unitCost: 2.5,
    });
    expect(r.unitCostInvoiced).toBeCloseTo(2.5, 5);
    expect(r.invoicedTotal).toBeCloseTo(25, 5);
  });

  it("B — costo por caja", () => {
    const r = resolvePurchaseLineCosts({
      qtyInvoiced: 2,
      unitsPerPresentation: 36,
      costMode: "PRESENTATION",
      presentationCost: 22.9,
    });
    expect(r.presentationCostInvoiced).toBeCloseTo(22.9, 5);
    expect(r.unitCostInvoiced).toBeCloseTo(22.9 / 36, 5);
  });

  it("C — total/cantidad determina unitario", () => {
    const r = resolvePurchaseLineCosts({
      qtyInvoiced: 20,
      unitsPerPresentation: 1,
      costMode: "TOTAL",
      lineTotal: 200,
    });
    expect(r.unitCostInvoiced).toBeCloseTo(10, 5);
  });

  it("D — bonificación 100+10", () => {
    const r = resolvePurchaseLineCosts({
      qtyInvoiced: 100,
      qtyBonus: 10,
      unitsPerPresentation: 1,
      costMode: "PRESENTATION",
      presentationCost: 22.9,
    });
    expect(r.qtyReceived).toBe(110);
    expect(r.invoicedTotal).toBeCloseTo(2290, 5);
    expect(r.effectivePresentationCost).toBeCloseTo(2290 / 110, 5);
  });

  it("M — diferencia cambiaria analítica", () => {
    const d = fxConversionDifference({
      originalAmount: 100,
      convertedAmount: 87_000,
      rateUsed: 870,
    });
    expect(d.difference).toBeCloseTo(0, 5);
  });

  it("N — preset últimos 7 días", () => {
    const p = resolveDashboardPeriod({
      timezone: "America/Caracas",
      preset: "ultimos_7_dias",
      now: new Date("2026-08-15T15:00:00.000Z"),
    });
    expect(p.fromDate).toBe("2026-08-09");
    expect(p.toDate).toBe("2026-08-15");
  });
});

const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";
const hasDb = isDatabaseConfigured();
const describeE2E = hasDb ? describe : describe.skip;

describeE2E("A&D Fase 9 — cierre E2E", () => {
  const app = createApp();
  let adminToken = "";
  let mesoneraToken = "";
  let licId = "";
  let productId = "";
  let presentationId = "";
  let presentationBoxId = "";
  let supplierId = "";
  let paymentMethodId = "";
  let accountUsdId = "";
  let accountBsId = "";

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  beforeAll(async () => {
    await connectDatabase();
    async function login(username: string) {
      const res = await request(app).post("/api/v1/ad/auth/login").send({
        tenantSlug: "ad-licoreria",
        username,
        password: DEMO_PASSWORD,
      });
      expect(res.status).toBe(200);
      return res.body.data.accessToken as string;
    }
    adminToken = await login("admin");
    mesoneraToken = await login("mesonera.lic");

    const wh = await request(app)
      .get("/api/v1/ad/warehouses")
      .set(auth(adminToken));
    licId = wh.body.data[0].id;

    const stamp = Date.now();
    const prod = await request(app)
      .post("/api/v1/ad/commerce/products")
      .set(auth(adminToken))
      .send({
        name: `F9 Prod ${stamp}`,
        brand: "F9",
        sku: `F9-${stamp}`,
        presentationName: "Unidad",
        unitsPerPresentation: 1,
        priceUsd: 3,
        priceBs: 2300,
      });
    expect(prod.status).toBe(201);
    productId = prod.body.data.id;
    presentationId = prod.body.data.presentations[0].id;

    const box = await request(app)
      .post(`/api/v1/ad/products/${productId}/presentations`)
      .set(auth(adminToken))
      .send({
        name: "Caja 12",
        code: "C12",
        unitsPerPresentation: 12,
        priceUsd: 30,
        priceBs: 23000,
      });
    expect(box.status).toBeLessThan(400);
    presentationBoxId =
      box.body.data?.id ??
      box.body.data?.presentations?.find(
        (p: { code: string }) => p.code === "C12",
      )?.id;

    if (!presentationBoxId) {
      const created = await getPrisma().adPresentation.create({
        data: {
          productId,
          name: "Caja 12",
          code: "C12",
          unitsPerPresentation: 12,
          priceUsd: 30,
          priceBs: 23000,
        },
      });
      presentationBoxId = created.id;
    }

    const sup = await request(app)
      .post("/api/v1/ad/suppliers")
      .set(auth(adminToken))
      .send({
        name: `Prov F9 ${stamp}`,
        creditDays: 7,
        defaultCurrency: "USD",
      });
    supplierId = sup.body.data.id;

    const pm = await request(app)
      .post("/api/v1/ad/payment-methods")
      .set(auth(adminToken))
      .send({
        code: `f9_cash_${stamp}`,
        name: "Efectivo F9",
        currency: "USD",
      });
    paymentMethodId = pm.body.data.id;

    const accounts = await request(app)
      .get("/api/v1/ad/finance/accounts")
      .set(auth(adminToken));
    const usd = accounts.body.data.accounts.find(
      (a: { currency: string; type: string }) =>
        a.currency === "USD" && a.type !== "TILL",
    );
    const bs = accounts.body.data.accounts.find(
      (a: { currency: string }) => a.currency === "BS",
    );
    accountUsdId = usd.id;
    accountBsId = bs.id;
  }, 120_000);

  it("A — compra precio por unidad", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F9-U-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CONTADO",
        paymentMethodId,
        lines: [
          {
            presentationId,
            qty: 10,
            costMode: "UNIT",
            unitCostUsd: 1.5,
            taxable: false,
          },
        ],
      });
    expect(buy.status).toBe(201);
    expect(Number(buy.body.data.lines[0].unitCostUsd)).toBeCloseTo(1.5, 4);
    const id = buy.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    const conf = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(conf.status).toBeLessThan(400);
  });

  it("B — compra precio por caja", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F9-C-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CONTADO",
        paymentMethodId,
        lines: [
          {
            presentationId: presentationBoxId,
            qty: 2,
            costMode: "PRESENTATION",
            presentationCostUsd: 18,
            taxable: false,
          },
        ],
      });
    expect(buy.status).toBe(201);
    expect(Number(buy.body.data.lines[0].unitCostUsd)).toBeCloseTo(18 / 12, 4);
    const id = buy.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    const conf = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(conf.status).toBeLessThan(400);
  });

  it("C — compra total determina unitario", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F9-T-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CONTADO",
        paymentMethodId,
        lines: [
          {
            presentationId,
            qty: 5,
            costMode: "TOTAL",
            lineTotalUsd: 50,
            taxable: false,
          },
        ],
      });
    expect(buy.status).toBe(201);
    expect(Number(buy.body.data.lines[0].unitCostUsd)).toBeCloseTo(10, 4);
  });

  it("D/E — bonificación 100+10 + CPP efectivo", async () => {
    const before = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F9-BON-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CREDITO",
        creditDays: 7,
        paymentMethodId,
        lines: [
          {
            presentationId,
            qty: 100,
            qtyBonus: 10,
            costMode: "PRESENTATION",
            presentationCostUsd: 22.9,
            taxable: false,
          },
        ],
      });
    expect(buy.status).toBe(201);
    const line = buy.body.data.lines[0];
    expect(Number(line.qtyReceivedBase)).toBe(110);
    expect(Number(line.effectivePresentationCostUsd)).toBeCloseTo(2290 / 110, 3);
    const id = buy.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    const conf = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(conf.status).toBeLessThan(400);
    const after = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    expect(Number(after.avgCostUsd)).not.toBe(Number(before.avgCostUsd));

    const payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    const ap = payables.body.data.find(
      (p: { purchaseId: string }) => p.purchaseId === id,
    );
    expect(ap).toBeTruthy();
    expect(Number(ap.amount)).toBeCloseTo(2290, 1);
  });

  it("F — precio bajo costo CON permiso override", async () => {
    const res = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId,
        kind: "NORMAL",
        currency: "USD",
        price: 0.01,
        costBasis: 10,
        continueBelowCost: true,
        belowCostReason: "F9 clearance autorizado",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.belowCost).toBe(true);
  });

  it("G — precio bajo costo SIN permiso / sin override", async () => {
    const denied = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(mesoneraToken))
      .send({
        presentationId,
        kind: "NORMAL",
        currency: "USD",
        price: 0.01,
        costBasis: 10,
      });
    expect(denied.status).toBeGreaterThanOrEqual(400);

    const blocked = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId,
        kind: "NORMAL",
        currency: "USD",
        price: 0.01,
        costBasis: 10,
        continueBelowCost: false,
      });
    expect(blocked.status).toBeGreaterThanOrEqual(400);
  });

  it("H/I — promoción por método + múltiples presentaciones", async () => {
    const promo = await request(app)
      .post("/api/v1/ad/promotions")
      .set(auth(adminToken))
      .send({
        name: `Promo F9 ${Date.now()}`,
        description: "Caja promo",
        currency: "USD",
        paymentMethodIds: [paymentMethodId],
        items: [
          { presentationId: presentationBoxId, qty: 1, price: 21 },
          { presentationId, qty: 1, price: 2.5 },
        ],
      });
    expect(promo.status).toBe(201);
    expect(promo.body.data.items.length).toBe(2);

    const list = await request(app)
      .get("/api/v1/ad/promotions")
      .set(auth(adminToken));
    expect(list.status).toBe(200);
    expect(list.body.data.some((p: { id: string }) => p.id === promo.body.data.id)).toBe(
      true,
    );

    const patch = await request(app)
      .patch(`/api/v1/ad/promotions/${promo.body.data.id}`)
      .set(auth(adminToken))
      .send({ active: false });
    expect(patch.status).toBe(200);
    expect(patch.body.data.active).toBe(false);
  });

  it("J — OC sugerida por días + confirmar", async () => {
    const sug = await request(app)
      .get("/api/v1/ad/commerce/replenishment?coverageDays=14&windowDays=30")
      .set(auth(adminToken));
    expect(sug.status).toBe(200);
    expect(Array.isArray(sug.body.data)).toBe(true);

    const lines = (sug.body.data as { productId: string; presentationId?: string; suggestedQtyBase: number }[])
      .filter((s) => s.suggestedQtyBase > 0)
      .slice(0, 5)
      .map((s) => ({
        productId: s.productId,
        presentationId: s.presentationId ?? undefined,
        suggestedQtyBase: s.suggestedQtyBase,
        qtyBase: Math.max(1, Math.ceil(s.suggestedQtyBase)),
      }));

    const poBody = {
      coverageDays: 14,
      supplierId,
      warehouseId: licId,
      preliminary: true,
      lines:
        lines.length > 0
          ? lines
          : [
              {
                productId,
                presentationId,
                suggestedQtyBase: 20,
                qtyBase: 20,
              },
            ],
    };
    const po = await request(app)
      .post("/api/v1/ad/commerce/purchase-orders")
      .set(auth(adminToken))
      .send(poBody);
    expect(po.status).toBe(201);
    expect(po.body.data.status).toBe("PRELIMINARY");

    const conf = await request(app)
      .patch(`/api/v1/ad/commerce/purchase-orders/${po.body.data.id}`)
      .set(auth(adminToken))
      .send({ status: "CONFIRMED" });
    expect(conf.status).toBe(200);
    expect(conf.body.data.status).toBe("CONFIRMED");
  });

  it("K — conciliación financiera", async () => {
    const denied = await request(app)
      .get(`/api/v1/ad/finance/reconciliations/preview?accountId=${accountUsdId}`)
      .set(auth(mesoneraToken));
    expect(denied.status).toBeGreaterThanOrEqual(400);

    const today = new Date().toISOString().slice(0, 10);
    const preview = await request(app)
      .get(
        `/api/v1/ad/finance/reconciliations/preview?accountId=${accountUsdId}&from=${today}&to=${today}`,
      )
      .set(auth(adminToken));
    expect(preview.status).toBe(200);
    expect(preview.body.data.systemBalance).toBeDefined();
    expect(preview.body.data.calculatedBalance).toBeDefined();

    const declared = Number(preview.body.data.systemBalance) + 1.25;
    const create = await request(app)
      .post("/api/v1/ad/finance/reconciliations")
      .set(auth(adminToken))
      .send({
        accountId: accountUsdId,
        asOfDate: today,
        from: today,
        to: today,
        declaredBalance: declared,
        notes: "F9 conciliación test",
      });
    expect(create.status).toBe(201);
    expect(Number(create.body.data.difference)).toBeCloseTo(1.25, 2);

    const audit = await getPrisma().adAuditEvent.findFirst({
      where: {
        entity: "financial_reconciliation",
        entityId: create.body.data.id,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeTruthy();
  });

  it("L/M — casa de cambio tasa explícita + impacto", async () => {
    const preview = await request(app)
      .post("/api/v1/ad/finance/exchange/preview")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountUsdId,
        toAccountId: accountBsId,
        amount: 10,
        rateBsPerUsd: 870,
      });
    expect(preview.status).toBe(200);
    expect(Number(preview.body.data.operation.amountOut)).toBeCloseTo(8700, 2);
    expect(preview.body.data.operation.impactNote).toBeTruthy();

    const draft = await request(app)
      .post("/api/v1/ad/finance/exchange")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountUsdId,
        toAccountId: accountBsId,
        amount: 5,
        rateBsPerUsd: 870,
        concept: "F9 FX",
        originalSaleAmount: 5,
        originalSaleCurrency: "USD",
      });
    expect(draft.status).toBe(201);
    expect(draft.body.data.type).toBe("CAMBIO_MONEDA");
    expect(Number(draft.body.data.rateUsed)).toBeCloseTo(870, 4);

    const tot = await request(app)
      .post(`/api/v1/ad/finance/movements/${draft.body.data.id}/totalize`)
      .set(auth(adminToken));
    expect(tot.status).toBeLessThan(400);
    const conf = await request(app)
      .post(`/api/v1/ad/finance/movements/${draft.body.data.id}/confirm`)
      .set(auth(adminToken));
    expect(conf.status).toBeLessThan(400);
  });

  it("N — dashboard hoy / 7 días / mes", async () => {
    for (const preset of ["hoy", "ultimos_7_dias", "mes"] as const) {
      const res = await request(app)
        .get(`/api/v1/ad/finance/dashboard?preset=${preset}&displayCurrency=USD`)
        .set(auth(adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.period.preset).toBe(preset);
      expect(res.body.data.executive).toBeDefined();
    }
  });

  it("O — auditoría precio / promo / conciliación", async () => {
    const events = await getPrisma().adAuditEvent.findMany({
      where: {
        OR: [
          { action: "price_below_cost" },
          { entity: "promotion" },
          { entity: "financial_reconciliation" },
          { entity: "purchase_order" },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    expect(events.length).toBeGreaterThan(0);
    expect(
      events.some(
        (e) =>
          e.operatorId != null &&
          (e.before != null || e.after != null),
      ),
    ).toBe(true);
  });

  it("escáner / búsqueda por código", async () => {
    const prod = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    const code = prod.sku ?? productId;
    const search = await request(app)
      .get(`/api/v1/ad/products/search?q=${encodeURIComponent(code)}`)
      .set(auth(adminToken));
    expect(search.status).toBe(200);
    expect(search.body.data.length).toBeGreaterThan(0);

    const byCode = await request(app)
      .get(
        `/api/v1/ad/products/by-code?code=${encodeURIComponent(code)}&source=manual`,
      )
      .set(auth(adminToken));
    expect(byCode.status).toBe(200);
  });
});
