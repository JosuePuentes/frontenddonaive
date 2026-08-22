/**
 * A&D Fase 5 — dominio puro + E2E comercio (PostgreSQL).
 */
import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import {
  completeCrossCurrencyAmount,
  equivalentUsdFromProtected,
  priceFromUtility,
  resolvePurchaseLineCosts,
  suggestReplenishment,
  utilityFromPrice,
} from "../src/ad/commerce-domain.js";
import { createApp } from "../src/app.js";
import { isDatabaseConfigured } from "../src/config/env.js";
import { connectDatabase, getPrisma } from "../src/config/database.js";

describe("commerce-domain (puro)", () => {
  it("C/D — costo por caja 36 → unitario", () => {
    const r = resolvePurchaseLineCosts({
      qtyInvoiced: 1,
      unitsPerPresentation: 36,
      costMode: "PRESENTATION",
      presentationCost: 22.9,
    });
    expect(r.unitCostInvoiced).toBeCloseTo(22.9 / 36, 5);
    expect(r.presentationCostInvoiced).toBeCloseTo(22.9, 5);
  });

  it("E — costo por total 20 cajas", () => {
    const r = resolvePurchaseLineCosts({
      qtyInvoiced: 20,
      unitsPerPresentation: 36,
      costMode: "TOTAL",
      lineTotal: 458,
    });
    expect(r.presentationCostInvoiced).toBeCloseTo(22.9, 5);
    expect(r.unitCostInvoiced).toBeCloseTo(22.9 / 36, 5);
  });

  it("F — bonificación 100 + 10", () => {
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

  it("L — costo equivalente protegida→BCV", () => {
    expect(equivalentUsdFromProtected(10, 870, 772.54)).toBeCloseTo(
      (10 * 870) / 772.54,
      4,
    );
  });

  it("compra en Bs completa USD con BCV", () => {
    const r = completeCrossCurrencyAmount({
      amountUsd: 0,
      amountBs: 1545.08,
      bcv: 772.54,
    });
    expect(r.usd).toBeCloseTo(2, 4);
    expect(r.bs).toBeCloseTo(1545.08, 4);
  });

  it("N/O — utilidad contable y precio directo", () => {
    const fromU = priceFromUtility({ cost: 10, utilityPercent: 20 });
    expect(fromU.price).toBeCloseTo(12.5, 5);
    const fromP = utilityFromPrice(10, 12.5);
    expect(fromP.utilityPercent).toBeCloseTo(20, 5);
    expect(utilityFromPrice(10, 8).belowCost).toBe(true);
  });

  it("V — sugerencia reposición 7 días", () => {
    const s = suggestReplenishment({
      avgDailyConsumption: 10,
      stockAvailable: 20,
      coverageDays: 7,
    });
    expect(s.need).toBe(70);
    expect(s.suggested).toBe(50);
  });
});

const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";
const hasDb = isDatabaseConfigured();
const describeE2E = hasDb ? describe : describe.skip;

describeE2E("A&D Fase 5 — E2E comercio PostgreSQL", () => {
  const app = createApp();
  let adminToken = "";
  let cajeroToken = "";
  let licId = "";
  let bodId = "";
  let productId = "";
  let presentationId = "";
  let presentation36Id = "";
  let supplierId = "";
  let paymentZelleId = "";
  let paymentBinanceId = "";

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
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
    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUnique({
      where: { slug: "ad-licoreria" },
    });
    if (!tenant) throw new Error("Ejecute npm run seed:ad");
    const wh = await prisma.adWarehouse.findMany({
      where: { tenantId: tenant.id },
    });
    licId = wh.find((w) => w.code === "LIC")!.id;
    bodId = wh.find((w) => w.code === "BOD")!.id;
    const product = await prisma.adProduct.findFirst({
      where: { tenantId: tenant.id, sku: "CER-REG" },
      include: { presentations: true },
    });
    productId = product!.id;
    presentationId = product!.presentations.find((p) => p.code === "U")!.id;
    let p36 = product!.presentations.find(
      (p) => Number(p.unitsPerPresentation) === 36,
    );
    if (!p36) {
      p36 = await prisma.adPresentation.create({
        data: {
          productId,
          name: "Caja 36",
          code: "CJ36",
          unitsPerPresentation: 36,
          priceUsd: 24,
          priceBs: 0,
        },
      });
    }
    presentation36Id = p36.id;
    adminToken = await login("admin");
    cajeroToken = await login("cajero.lic");
  }, 60_000);

  it("A/B — producto + búsqueda por código/nombre", async () => {
    const bySku = await request(app)
      .get("/api/v1/ad/products/search")
      .query({ sku: "CER-REG" })
      .set(auth(adminToken));
    expect(bySku.status).toBe(200);
    expect(bySku.body.data.length).toBeGreaterThan(0);

    const byName = await request(app)
      .get("/api/v1/ad/products/search")
      .query({ q: "cerveza" })
      .set(auth(adminToken));
    expect(byName.status).toBe(200);

    const scan = await request(app)
      .get("/api/v1/ad/products/by-code")
      .query({ code: "CER-REG", source: "manual" })
      .set(auth(adminToken));
    expect(scan.status).toBe(200);
    expect(scan.body.data.source).toBe("manual");
  });

  it("G — proveedor", async () => {
    const res = await request(app)
      .post("/api/v1/ad/suppliers")
      .set(auth(adminToken))
      .send({
        name: `Proveedor F5 ${Date.now()}`,
        identification: "J-123",
        phone: "02121234567",
        defaultCurrency: "USD",
        creditDays: 15,
        creditLimit: 5000,
      });
    expect(res.status).toBe(201);
    supplierId = res.body.data.id;
  });

  it("J/K — tasa BCV y tasa protegida", async () => {
    const bcv = await request(app)
      .post("/api/v1/ad/rates/bcv")
      .set(auth(adminToken))
      .send({ rate: 772.54, reason: "E2E BCV" });
    expect(bcv.status).toBe(201);

    const denied = await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(cajeroToken))
      .send({ rate: 870 });
    expect(denied.status).toBeGreaterThanOrEqual(400);

    const prot = await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(adminToken))
      .send({ rate: 870, reason: "E2E protected" });
    expect(prot.status).toBe(201);

    const getProt = await request(app)
      .get("/api/v1/ad/rates/protected")
      .set(auth(adminToken));
    expect(getProt.status).toBe(200);
    expect(getProt.body.data.current).toBe(870);
  });

  it("métodos de pago Zelle/Binance", async () => {
    const z = await request(app)
      .post("/api/v1/ad/payment-methods")
      .set(auth(adminToken))
      .send({
        code: `zelle_${Date.now()}`,
        name: "Zelle",
        currency: "USD",
        usesSpecialRateRef: true,
      });
    expect(z.status).toBe(201);
    paymentZelleId = z.body.data.id;
    const b = await request(app)
      .post("/api/v1/ad/payment-methods")
      .set(auth(adminToken))
      .send({
        code: `binance_${Date.now()}`,
        name: "Binance",
        currency: "USD",
      });
    expect(b.status).toBe(201);
    paymentBinanceId = b.body.data.id;
  });

  it("D/E/F/H/I/L/M — compra caja, total, bonificación, CxP, CPP", async () => {
    const before = await getPrisma().adProduct.findUnique({
      where: { id: productId },
    });
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F5-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CREDITO",
        creditDays: 15,
        paymentMethodId: paymentZelleId,
        useProtectedRateRef: true,
        lines: [
          {
            presentationId: presentation36Id,
            qty: 100,
            qtyBonus: 10,
            costMode: "PRESENTATION",
            presentationCostUsd: 22.9,
            presentationCostBs: 0,
          },
        ],
      });
    expect(buy.status).toBe(201);
    const line = buy.body.data.lines[0];
    expect(Number(line.qtyBonus)).toBe(10);
    expect(Number(line.qtyReceivedBase)).toBe(110 * 36);
    expect(Number(line.effectivePresentationCostUsd)).toBeCloseTo(
      2290 / 110,
      3,
    );
    expect(buy.body.data.protectedRateSnapshot).toBeUndefined();
    expect(Number(line.equivalentCostUsd)).toBeGreaterThan(0);

    const purchaseId = buy.body.data.id as string;
    const tot = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${purchaseId}/totalize`)
      .set(auth(adminToken));
    expect(tot.status).toBeLessThan(400);
    const recv = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${purchaseId}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(recv.status).toBeLessThan(400);

    const after = await getPrisma().adProduct.findUnique({
      where: { id: productId },
    });
    expect(Number(after!.avgCostUsd)).not.toBe(Number(before!.avgCostUsd));

    const payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    expect(payables.status).toBe(200);
    const ap = payables.body.data.find(
      (p: { purchaseId: string }) => p.purchaseId === purchaseId,
    );
    expect(ap).toBeTruthy();
    expect(Number(ap.amount)).toBeCloseTo(2290, 2);
    expect(ap.daysRemaining).toBeDefined();
  });

  it("N/O/P/Q — precios utilidad/directo + below cost + auditoría", async () => {
    const util = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId: presentation36Id,
        kind: "NORMAL",
        currency: "USD",
        utilityPercent: 15,
        costBasis: 20,
      });
    expect(util.status).toBe(201);
    expect(Number(util.body.data.price)).toBeCloseTo(23, 5);

    const direct = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId: presentation36Id,
        kind: "ESPECIAL",
        currency: "USD",
        price: 25,
        costBasis: 20,
      });
    expect(direct.status).toBe(201);

    const denied = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId: presentation36Id,
        kind: "ESPECIAL",
        currency: "USD",
        price: 5,
        costBasis: 20,
      });
    expect(denied.status).toBeGreaterThanOrEqual(400);

    const override = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId: presentation36Id,
        kind: "ESPECIAL",
        currency: "USD",
        price: 5,
        costBasis: 20,
        continueBelowCost: true,
        belowCostReason: "E2E clearance",
      });
    expect(override.status).toBe(201);

    const audits = await getPrisma().adAuditEvent.findMany({
      where: { action: "price_below_cost", tenantId: (await getPrisma().adTenant.findUnique({ where: { slug: "ad-licoreria" } }))!.id },
      take: 1,
      orderBy: { createdAt: "desc" },
    });
    expect(audits[0]?.before).toBeTruthy();
    expect(audits[0]?.after).toBeTruthy();
  });

  it("R/S — promoción por método de pago", async () => {
    const promo = await request(app)
      .post("/api/v1/ad/promotions")
      .set(auth(adminToken))
      .send({
        name: "Caja Polar promo",
        currency: "USD",
        paymentMethodIds: [paymentZelleId, paymentBinanceId],
        items: [{ presentationId: presentation36Id, qty: 1, price: 21 }],
      });
    expect(promo.status).toBe(201);

    const price = await request(app)
      .get("/api/v1/ad/pricing/pos")
      .query({
        presentationId: presentation36Id,
        paymentMethodId: paymentZelleId,
      })
      .set(auth(adminToken));
    expect(price.status).toBe(200);
    expect(price.body.data.source).toBe("promotion");
    expect(Number(price.body.data.price)).toBe(21);
  });

  it("T — combo", async () => {
    const combo = await request(app)
      .post("/api/v1/ad/combos")
      .set(auth(adminToken))
      .send({
        name: "Combo Amigos",
        currency: "USD",
        price: 50,
        paymentMethodIds: [paymentZelleId],
        items: [
          { presentationId: presentation36Id, qty: 2 },
          { presentationId, qty: 3 },
        ],
      });
    expect(combo.status).toBe(201);
    expect(combo.body.data.items.length).toBe(2);
  });

  it("U/V/W — análisis, reposición, orden de compra", async () => {
    const analysis = await request(app)
      .get("/api/v1/ad/commerce/analysis")
      .query({ supplierId })
      .set(auth(adminToken));
    expect(analysis.status).toBe(200);

    const sug = await request(app)
      .get("/api/v1/ad/commerce/replenishment")
      .query({ warehouseId: licId, coverageDays: 7, windowDays: 30 })
      .set(auth(adminToken));
    expect(sug.status).toBe(200);

    const line =
      sug.body.data.find(
        (s: { productId: string; suggestedQtyBase: number }) =>
          s.productId === productId && Number(s.suggestedQtyBase) > 0,
      ) ??
      sug.body.data.find(
        (s: { suggestedQtyBase: number }) => Number(s.suggestedQtyBase) > 0,
      );

    const po = await request(app)
      .post("/api/v1/ad/commerce/purchase-orders")
      .set(auth(adminToken))
      .send({
        supplierId,
        warehouseId: licId,
        coverageDays: 7,
        preliminary: true,
        lines: [
          {
            productId: line?.productId ?? productId,
            presentationId: presentationId,
            suggestedQtyBase: Number(line?.suggestedQtyBase ?? 50),
            qtyBase: Math.max(1, Number(line?.suggestedQtyBase ?? 50)),
          },
        ],
      });
    expect(po.status).toBe(201);
    expect(String(po.body.data.documentNumber)).toMatch(/^OC-/);
  });

  it("import preview → confirm", async () => {
    const preview = await request(app)
      .post("/api/v1/ad/imports/preview")
      .set(auth(adminToken))
      .send({
        fileName: "demo.xlsx",
        rows: [
          {
            code: `IMP-${Date.now()}`,
            description: "Producto importado F5",
            brand: "Demo",
            presentation: "Unidad",
            unitsPerPresentation: 1,
            unitCost: 1.5,
            currency: "USD",
          },
        ],
      });
    expect(preview.status).toBe(201);
    const batchId = preview.body.data.batchId as string;
    const confirm = await request(app)
      .post("/api/v1/ad/imports/confirm")
      .set(auth(adminToken))
      .send({ batchId });
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.created).toBe(1);
  });

  it("X — aislamiento depósito: cajero Lic no compra en Bodegón", async () => {
    const res = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(cajeroToken))
      .send({
        warehouseId: bodId,
        supplierName: "X",
        invoiceNumber: `ISO-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CONTADO",
        lines: [
          {
            presentationId,
            qty: 1,
            costMode: "UNIT",
            unitCostUsd: 1,
          },
        ],
      });
    // cajero no tiene purchases.create → 403, o warehouse deny
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
