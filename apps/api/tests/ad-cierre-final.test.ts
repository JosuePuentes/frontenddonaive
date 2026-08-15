/**
 * A&D CIERRE — suite E2E punta a punta (escenarios A–J).
 * Persistencia real PostgreSQL.
 */
import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { isDatabaseConfigured } from "../src/config/env.js";
import { connectDatabase, getPrisma } from "../src/config/database.js";
import { resolvePurchaseLineCosts } from "../src/ad/commerce-domain.js";

const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";
const hasDb = isDatabaseConfigured();
const describeE2E = hasDb ? describe : describe.skip;

describe("Cierre dominio — bonificación CPP", () => {
  it("A — 100 cajas + 10 bonus → 2290/110", () => {
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
});

describeE2E("A&D CIERRE E2E A–J", () => {
  const app = createApp();
  let adminToken = "";
  let licId = "";
  let productId = "";
  let presentationId = "";
  let supplierId = "";
  let paymentMethodId = "";
  let accountUsdId = "";
  let accountBsId = "";
  let cppAfterBonus = 0;
  let saleBeforeId = "";
  let snapCostBefore = 0;

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
    adminToken = await login("admin");
    const wh = await request(app)
      .get("/api/v1/ad/warehouses")
      .set(auth(adminToken));
    licId = wh.body.data.find((w: { code: string }) => w.code === "LIC")?.id
      ?? wh.body.data[0].id;

    const stamp = Date.now();
    const prod = await request(app)
      .post("/api/v1/ad/commerce/products")
      .set(auth(adminToken))
      .send({
        name: `CIERRE Prod ${stamp}`,
        brand: "CIERRE",
        sku: `CIE-${stamp}`,
        presentationName: "Unidad",
        unitsPerPresentation: 1,
        priceUsd: 30,
        priceBs: 23000,
      });
    expect(prod.status).toBe(201);
    productId = prod.body.data.id;
    presentationId = prod.body.data.presentations[0].id;

    // stock seed for later sales: set via purchase
    const sup = await request(app)
      .post("/api/v1/ad/suppliers")
      .set(auth(adminToken))
      .send({
        name: `Prov Cierre ${stamp}`,
        creditDays: 15,
        defaultCurrency: "USD",
      });
    supplierId = sup.body.data.id;

    const pm = await request(app)
      .post("/api/v1/ad/payment-methods")
      .set(auth(adminToken))
      .send({
        code: `cierre_${stamp}`,
        name: "Zelle Cierre",
        currency: "USD",
        usesSpecialRateRef: true,
      });
    paymentMethodId = pm.body.data.id;

    await request(app)
      .post("/api/v1/ad/rates/bcv")
      .set(auth(adminToken))
      .send({ rate: 772.54, reason: "cierre BCV" });
    await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(adminToken))
      .send({ rate: 870, reason: "cierre paralela" });

    const accounts = await request(app)
      .get("/api/v1/ad/finance/accounts")
      .set(auth(adminToken));
    accountUsdId = accounts.body.data.accounts.find(
      (a: { currency: string }) => a.currency === "USD",
    ).id;
    accountBsId = accounts.body.data.accounts.find(
      (a: { currency: string }) => a.currency === "BS",
    ).id;
  }, 120_000);

  it("A — compra 100 + 10 bonus → CPP 2290/110", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `CIE-A-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CREDITO",
        creditDays: 15,
        paymentMethodId,
        useProtectedRateRef: true,
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

    const payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    const ap = payables.body.data.find(
      (p: { purchaseId: string }) => p.purchaseId === id,
    );
    expect(Number(ap.amount)).toBeCloseTo(2290, 1);

    const product = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    cppAfterBonus = Number(product.avgCostUsd);
    expect(cppAfterBonus).toBeCloseTo(2290 / 110, 3);
  });

  it("B — venta guarda snapshot CPP A", async () => {
    const sale = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId, qty: 2 }],
        payments: [{ method: "Efectivo", currency: "USD", amount: 60 }],
      });
    expect(sale.status).toBe(201);
    saleBeforeId = sale.body.data.id;
    const line = await getPrisma().adSaleLine.findFirstOrThrow({
      where: { saleId: saleBeforeId },
    });
    snapCostBefore = Number(line.unitCostUsdSnapshot);
    expect(snapCostBefore).toBeCloseTo(cppAfterBonus, 3);
    expect(Number(line.lineCostUsdSnapshot)).toBeCloseTo(
      snapCostBefore * Number(line.qtyBase),
      3,
    );
    expect(Number(line.cppUsdSnapshot)).toBeCloseTo(cppAfterBonus, 3);
  });

  it("C — nueva compra cambia CPP; venta anterior conserva snapshot A", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `CIE-C-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CONTADO",
        paymentMethodId,
        lines: [
          {
            presentationId,
            qty: 50,
            costMode: "UNIT",
            unitCostUsd: 40,
            taxable: false,
          },
        ],
      });
    const id = buy.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});

    const product = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    expect(Number(product.avgCostUsd)).not.toBeCloseTo(snapCostBefore, 2);

    const oldLine = await getPrisma().adSaleLine.findFirstOrThrow({
      where: { saleId: saleBeforeId },
    });
    expect(Number(oldLine.unitCostUsdSnapshot)).toBeCloseTo(snapCostBefore, 3);

    const sale2 = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId, qty: 1 }],
        payments: [{ method: "Efectivo", currency: "USD", amount: 30 }],
      });
    expect(sale2.status).toBe(201);
    const newLine = await getPrisma().adSaleLine.findFirstOrThrow({
      where: { saleId: sale2.body.data.id },
    });
    expect(Number(newLine.unitCostUsdSnapshot)).toBeCloseTo(
      Number(product.avgCostUsd),
      3,
    );
  });

  it("D/E — reposición con paralelo; histórico no cambia", async () => {
    const histBefore = await getPrisma().adPurchaseLine.findFirst({
      where: { productId },
      orderBy: { purchase: { receivedAt: "asc" } },
      include: { purchase: true },
    });
    const histUnit = Number(
      histBefore!.effectiveUnitCostUsd || histBefore!.unitCostUsd,
    );

    const r1 = await request(app)
      .get(`/api/v1/ad/finance/products/${productId}/replacement-cost`)
      .set(auth(adminToken));
    expect(r1.status).toBe(200);
    // 870/772.54 ≈ 1.126 → hist * factor si useParallel
    expect(r1.body.data.currentBcvRate).toBeCloseTo(772.54, 2);
    expect(r1.body.data.historicalCppUsd).toBeDefined();

    await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(adminToken))
      .send({ rate: 900, reason: "cierre E paralelo" });

    const r2 = await request(app)
      .get(`/api/v1/ad/finance/products/${productId}/replacement-cost`)
      .set(auth(adminToken));
    expect(r2.status).toBe(200);
    if (r1.body.data.useParallelRef) {
      expect(Number(r2.body.data.replacementCostUsd)).not.toBeCloseTo(
        Number(r1.body.data.replacementCostUsd),
        2,
      );
    }

    const histAfter = await getPrisma().adPurchaseLine.findFirst({
      where: { id: histBefore!.id },
    });
    expect(
      Number(histAfter!.effectiveUnitCostUsd || histAfter!.unitCostUsd),
    ).toBeCloseTo(histUnit, 4);
  });

  it("F — precio bajo costo exige permiso + motivo + auditoría", async () => {
    const blocked = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId,
        kind: "PROMOCION",
        currency: "USD",
        price: 0.01,
        costBasis: 10,
      });
    expect(blocked.status).toBeGreaterThanOrEqual(400);

    const ok = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId,
        kind: "PROMOCION",
        currency: "USD",
        price: 0.01,
        costBasis: 10,
        continueBelowCost: true,
        belowCostReason: "Cierre F promoción autorizada",
      });
    expect(ok.status).toBe(201);
    expect(ok.body.data.belowCost).toBe(true);

    const audit = await getPrisma().adAuditEvent.findFirst({
      where: { action: "price_below_cost", entityId: ok.body.data.id },
    });
    expect(audit).toBeTruthy();
  });

  it("G — OC → compra idempotente", async () => {
    const po = await request(app)
      .post("/api/v1/ad/commerce/purchase-orders")
      .set(auth(adminToken))
      .send({
        supplierId,
        warehouseId: licId,
        coverageDays: 15,
        preliminary: true,
        lines: [
          {
            productId,
            presentationId,
            suggestedQtyBase: 12,
            qtyBase: 12,
          },
        ],
      });
    expect(po.status).toBe(201);
    const poId = po.body.data.id as string;

    const conv1 = await request(app)
      .post(`/api/v1/ad/commerce/purchase-orders/${poId}/convert`)
      .set(auth(adminToken))
      .send({
        invoiceNumber: `CIE-OC-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CREDITO",
        creditDays: 10,
        paymentMethodId,
        confirm: true,
        lines: [
          {
            productId,
            presentationId,
            qty: 12,
            costMode: "UNIT",
            unitCostUsd: 5,
            taxable: false,
          },
        ],
      });
    expect(conv1.status).toBe(201);
    expect(conv1.body.data.purchaseOrder.status).toBe("CONVERTED");
    const purchaseId = conv1.body.data.purchase.id as string;

    const conv2 = await request(app)
      .post(`/api/v1/ad/commerce/purchase-orders/${poId}/convert`)
      .set(auth(adminToken))
      .send({
        invoiceNumber: `CIE-OC-DUP-${Date.now()}`,
        confirm: true,
      });
    expect(conv2.status).toBe(201);
    expect(conv2.body.data.idempotent).toBe(true);
    expect(conv2.body.data.purchase.id).toBe(purchaseId);

    const count = await getPrisma().adPurchase.count({
      where: { purchaseOrderId: poId },
    });
    expect(count).toBe(1);
  });

  it("H — Casa de Cambio saldos", async () => {
    const beforeUsd = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    const draft = await request(app)
      .post("/api/v1/ad/finance/exchange")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountUsdId,
        toAccountId: accountBsId,
        amount: 2,
        rateBsPerUsd: 870,
        concept: "Cierre H",
      });
    expect(draft.status).toBe(201);
    await request(app)
      .post(`/api/v1/ad/finance/movements/${draft.body.data.id}/totalize`)
      .set(auth(adminToken));
    const conf = await request(app)
      .post(`/api/v1/ad/finance/movements/${draft.body.data.id}/confirm`)
      .set(auth(adminToken));
    expect(conf.status).toBeLessThan(400);
    const afterUsd = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    expect(Number(afterUsd.balance)).toBeCloseTo(
      Number(beforeUsd.balance) - 2,
      2,
    );
  });

  it("I — Dashboard usa snapshot histórico", async () => {
    const dash = await request(app)
      .get("/api/v1/ad/finance/dashboard?preset=ultimos_7_dias&displayCurrency=USD")
      .set(auth(adminToken));
    expect(dash.status).toBe(200);
    expect(dash.body.data.profitability.distinction.cppHistorico).toMatch(
      /snapshot/i,
    );
    expect(dash.body.data.profitability.historicalCostUsd).toBeGreaterThan(0);
    const oldLine = await getPrisma().adSaleLine.findFirstOrThrow({
      where: { saleId: saleBeforeId },
    });
    expect(Number(oldLine.unitCostUsdSnapshot)).toBeCloseTo(snapCostBefore, 3);
  });

  it("J — compra IVA 16% → CxP = total general", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `CIE-IVA-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CREDITO",
        creditDays: 7,
        paymentMethodId,
        lines: [
          {
            presentationId,
            qty: 10,
            costMode: "UNIT",
            unitCostUsd: 10,
            taxable: true,
            taxRate: 0.16,
          },
        ],
      });
    expect(buy.status).toBe(201);
    const id = buy.body.data.id as string;
    const tot = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    expect(Number(tot.body.data.subtotalUsd ?? tot.body.data.totals?.subtotalUsd)).toBeCloseTo(
      100,
      1,
    );
    const conf = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(conf.status).toBeLessThan(400);
    const grand = Number(
      conf.body.data.grandTotalUsd ?? conf.body.data.totals?.grandTotalUsd,
    );
    expect(grand).toBeCloseTo(116, 1);

    const payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    const ap = payables.body.data.find(
      (p: { purchaseId: string }) => p.purchaseId === id,
    );
    expect(Number(ap.amount)).toBeCloseTo(116, 1);
  });

  it("PDF compra descargable", async () => {
    const purchase = await getPrisma().adPurchase.findFirst({
      where: { tenantId: (await getPrisma().adTenant.findUnique({ where: { slug: "ad-licoreria" } }))!.id },
      orderBy: { createdAt: "desc" },
    });
    const pdf = await request(app)
      .get(`/api/v1/ad/documents/purchases/${purchase!.id}/pdf`)
      .set(auth(adminToken));
    expect(pdf.status).toBe(200);
    expect(pdf.headers["content-type"]).toMatch(/pdf/);
    expect(pdf.body.length ?? Buffer.byteLength(pdf.text)).toBeGreaterThan(100);
  });

  it("PDF recibo / transferencia / cierre", async () => {
    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUnique({
      where: { slug: "ad-licoreria" },
    });
    expect(tenant).toBeTruthy();

    const salePdf = await request(app)
      .get(`/api/v1/ad/documents/receipts/${saleBeforeId}/pdf`)
      .set(auth(adminToken));
    expect(salePdf.status).toBe(200);
    expect(salePdf.headers["content-type"]).toMatch(/pdf/);

    const transfer = await request(app)
      .post("/api/v1/ad/transfers")
      .set(auth(adminToken))
      .send({
        fromWarehouseId: licId,
        toWarehouseId:
          (
            await request(app)
              .get("/api/v1/ad/warehouses")
              .set(auth(adminToken))
          ).body.data.find((w: { code: string }) => w.code === "BOD")?.id ??
          licId,
        reason: "PDF smoke",
        lines: [
          {
            productId,
            presentationId,
            qty: 1,
          },
        ],
      });
    expect(transfer.status).toBeLessThan(400);
    const transferId = transfer.body.data.id as string;
    const trPdf = await request(app)
      .get(`/api/v1/ad/documents/transfers/${transferId}/pdf`)
      .set(auth(adminToken));
    expect(trPdf.status).toBe(200);
    expect(trPdf.headers["content-type"]).toMatch(/pdf/);

    const closure = await request(app)
      .post("/api/v1/ad/closures/cash")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        countedCashUsd: 0,
        countedCashBs: 0,
        notes: "PDF smoke",
      });
    expect(closure.status).toBeLessThan(400);
    const closureId = closure.body.data.id as string;
    const clPdf = await request(app)
      .get(`/api/v1/ad/documents/closures/${closureId}/pdf`)
      .set(auth(adminToken));
    expect(clPdf.status).toBe(200);
    expect(clPdf.headers["content-type"]).toMatch(/pdf/);
  });

  it("umbral zona crítica configurable", async () => {
    const upd = await request(app)
      .put("/api/v1/ad/finance/settings")
      .set(auth(adminToken))
      .send({ pricingCriticalUtilityPercent: 8, inventoryCriticalCoverageDays: 2 });
    expect(upd.status).toBe(200);
    expect(Number(upd.body.data.pricingCriticalUtilityPercent)).toBe(8);

    const price = await request(app)
      .post("/api/v1/ad/pricing/presentation")
      .set(auth(adminToken))
      .send({
        presentationId,
        kind: "NORMAL",
        currency: "USD",
        price: 10.5,
        costBasis: 10,
      });
    expect(price.status).toBe(201);
    expect(price.body.data.criticalUtilityThresholdPct).toBe(8);
    expect(price.body.data.nearCost).toBe(true);
  });
});
