/**
 * A&D Fase 6 — IVA + flujo borrador → preliminar → confirmar.
 */
import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import {
  AD_DEFAULT_TAX_RATE,
  applyLineTax,
  resolvePurchaseLineCosts,
  roundMoney,
  sumPurchaseDocumentTotals,
} from "../src/ad/commerce-domain.js";
import { createApp } from "../src/app.js";
import { isDatabaseConfigured } from "../src/config/env.js";
import { connectDatabase, getPrisma } from "../src/config/database.js";

describe("F6 domain IVA", () => {
  it("T — recalculo subtotal/IVA/total", () => {
    const a = applyLineTax(100, true, AD_DEFAULT_TAX_RATE);
    const b = applyLineTax(50, false);
    const sum = sumPurchaseDocumentTotals([
      { subtotal: a.subtotal, tax: a.tax, totalWithTax: a.totalWithTax },
      { subtotal: b.subtotal, tax: b.tax, totalWithTax: b.totalWithTax },
    ]);
    expect(a.tax).toBeCloseTo(16, 5);
    expect(sum.subtotal).toBe(150);
    expect(sum.tax).toBeCloseTo(16, 5);
    expect(sum.grandTotal).toBeCloseTo(166, 5);
    expect(roundMoney(22.9 / 36, 4)).toBe(0.6361);
  });

  it("H — precio caja → unitario", () => {
    const r = resolvePurchaseLineCosts({
      qtyInvoiced: 20,
      unitsPerPresentation: 36,
      costMode: "PRESENTATION",
      presentationCost: 22.9,
    });
    expect(r.unitCostInvoiced).toBeCloseTo(22.9 / 36, 6);
  });
});

const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";
const hasDb = isDatabaseConfigured();
const describeE2E = hasDb ? describe : describe.skip;

describeE2E("A&D Fase 6 — compras IVA E2E", () => {
  const app = createApp();
  let adminToken = "";
  let licId = "";
  let productId = "";
  let presentationId = "";
  let presentation36Id = "";
  let taxableProductId = "";
  let taxablePresId = "";
  let supplierId = "";
  let paymentId = "";

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
    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUnique({
      where: { slug: "ad-licoreria" },
    });
    if (!tenant) throw new Error("Ejecute npm run seed:ad");
    const wh = await prisma.adWarehouse.findMany({
      where: { tenantId: tenant.id },
    });
    licId = wh.find((w) => w.code === "LIC")!.id;
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

    await request(app)
      .post("/api/v1/ad/rates/bcv")
      .set(auth(adminToken))
      .send({ rate: 772.54 });
    await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(adminToken))
      .send({ rate: 870 });

    const sup = await request(app)
      .post("/api/v1/ad/suppliers")
      .set(auth(adminToken))
      .send({
        name: `Prov F6 ${Date.now()}`,
        creditDays: 30,
        defaultCurrency: "USD",
      });
    expect(sup.status).toBe(201);
    supplierId = sup.body.data.id;

    const pm = await request(app)
      .post("/api/v1/ad/payment-methods")
      .set(auth(adminToken))
      .send({
        code: `f6_zelle_${Date.now()}`,
        name: "Zelle F6",
        currency: "USD",
        usesSpecialRateRef: true,
      });
    expect(pm.status).toBe(201);
    paymentId = pm.body.data.id;
  }, 90_000);

  it("G — producto creado desde Compras", async () => {
    const res = await request(app)
      .post("/api/v1/ad/commerce/products")
      .set(auth(adminToken))
      .send({
        sku: `F6-${Date.now()}`,
        name: "Producto IVA F6",
        brand: "Demo",
        taxable: true,
        presentationName: "Unidad",
        unitsPerPresentation: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.taxable).toBe(true);
    taxableProductId = res.body.data.id;
    taxablePresId = res.body.data.presentations[0].id;
  });

  it("A/B/C/S — compra multi con IVA mixto + totales", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F6-MIX-${Date.now()}`,
        currency: "USD",
        paymentMethodId: paymentId,
        paymentCondition: "CREDITO",
        creditDays: 15,
        lines: [
          {
            presentationId,
            qty: 10,
            costMode: "UNIT",
            unitCostUsd: 1,
            taxable: false,
          },
          {
            presentationId: taxablePresId,
            qty: 10,
            costMode: "UNIT",
            unitCostUsd: 2,
            taxable: true,
          },
        ],
      });
    expect(buy.status).toBe(201);
    expect(buy.body.data.status).toBe("DRAFT");
    // subtotal 10*1 + 10*2 = 30; IVA 10*2*0.16 = 3.2; total 33.2
    expect(Number(buy.body.data.totals.subtotal)).toBeCloseTo(30, 4);
    expect(Number(buy.body.data.totals.tax)).toBeCloseTo(3.2, 4);
    expect(Number(buy.body.data.totals.grandTotal)).toBeCloseTo(33.2, 4);
  });

  it("D/E/F — editar cantidad/precio y eliminar línea", async () => {
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F6-EDIT-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CONTADO",
        lines: [
          {
            presentationId,
            qty: 5,
            costMode: "UNIT",
            unitCostUsd: 1,
            taxable: false,
          },
          {
            presentationId: taxablePresId,
            qty: 5,
            costMode: "UNIT",
            unitCostUsd: 1,
            taxable: true,
          },
        ],
      });
    expect(buy.status).toBe(201);
    const id = buy.body.data.id as string;
    const line0 = buy.body.data.lines[0].id as string;
    const line1 = buy.body.data.lines[1].id as string;

    const upd = await request(app)
      .patch(`/api/v1/ad/commerce/purchases/${id}/lines/${line0}`)
      .set(auth(adminToken))
      .send({ qty: 8, unitCostUsd: 1.5, costMode: "UNIT" });
    expect(upd.status).toBe(200);
    expect(Number(upd.body.data.totals.subtotal)).toBeGreaterThan(5);

    const del = await request(app)
      .delete(`/api/v1/ad/commerce/purchases/${id}/lines/${line1}`)
      .set(auth(adminToken));
    expect(del.status).toBe(200);
    expect(del.body.data.lines.length).toBe(1);
  });

  it("H/I/J/K/L/O/P/Q/R — caja, bonificación, CxP total, vencimiento, confirm", async () => {
    const beforeCpp = await getPrisma().adProduct.findUnique({
      where: { id: productId },
    });
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F6-BON-${Date.now()}`,
        currency: "USD",
        paymentMethodId: paymentId,
        paymentCondition: "CREDITO",
        creditDays: 20,
        lines: [
          {
            presentationId: presentation36Id,
            qty: 100,
            qtyBonus: 10,
            costMode: "PRESENTATION",
            presentationCostUsd: 22.9,
            taxable: true,
          },
        ],
      });
    expect(buy.status).toBe(201);
    const id = buy.body.data.id as string;
    const line = buy.body.data.lines[0];
    expect(Number(line.effectivePresentationCostUsd)).toBeCloseTo(
      2290 / 110,
      3,
    );
    // subtotal 2290, IVA 16% = 366.4, grand = 2656.4
    expect(Number(buy.body.data.totals.subtotal)).toBeCloseTo(2290, 2);
    expect(Number(buy.body.data.totals.tax)).toBeCloseTo(366.4, 2);
    expect(Number(buy.body.data.totals.grandTotal)).toBeCloseTo(2656.4, 2);
    expect(buy.body.data.dueDate).toBeTruthy();

    const prelim = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    expect(prelim.status).toBe(200);
    expect(prelim.body.data.status).toBe("PRELIMINARY");
    expect(prelim.body.data.document).toBeTruthy();
    expect(prelim.body.data.document.grandTotal).toBeCloseTo(2656.4, 2);

    // aún sin CxP
    let payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    expect(
      payables.body.data.some((p: { purchaseId: string }) => p.purchaseId === id),
    ).toBe(false);

    const conf = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(conf.status).toBe(200);
    expect(conf.body.data.status).toBe("RECEIVED");

    const afterCpp = await getPrisma().adProduct.findUnique({
      where: { id: productId },
    });
    expect(Number(afterCpp!.avgCostUsd)).not.toBe(Number(beforeCpp!.avgCostUsd));

    payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    const ap = payables.body.data.find(
      (p: { purchaseId: string }) => p.purchaseId === id,
    );
    expect(ap).toBeTruthy();
    expect(Number(ap.amount)).toBeCloseTo(2656.4, 2);
    expect(Number(ap.taxAmount)).toBeCloseTo(366.4, 2);
    expect(ap.daysRemaining).toBeDefined();

    const audits = await getPrisma().adAuditEvent.findMany({
      where: { entityId: id, action: { in: ["create", "totalize", "confirm"] } },
    });
    expect(audits.length).toBeGreaterThanOrEqual(2);
    const confirmAudit = audits.find((a) => a.action === "confirm");
    expect(confirmAudit?.before).toBeTruthy();
    expect(confirmAudit?.after).toBeTruthy();
  });

  it("M/N — compra USD y Bs", async () => {
    const usd = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F6-USD-${Date.now()}`,
        currency: "USD",
        paymentCondition: "CONTADO",
        lines: [
          {
            presentationId,
            qty: 2,
            costMode: "UNIT",
            unitCostUsd: 3,
            taxable: false,
          },
        ],
      });
    expect(usd.status).toBe(201);
    expect(usd.body.data.currency).toBe("USD");

    const bs = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F6-BS-${Date.now()}`,
        currency: "BS",
        paymentCondition: "CONTADO",
        lines: [
          {
            presentationId,
            qty: 2,
            costMode: "UNIT",
            unitCostBs: 1000,
            taxable: true,
          },
        ],
      });
    expect(bs.status).toBe(201);
    expect(bs.body.data.currency).toBe("BS");
    expect(Number(bs.body.data.totals.tax)).toBeCloseTo(320, 2);
    expect(Number(bs.body.data.totals.grandTotal)).toBeCloseTo(2320, 2);
  });

  it("re-totalizar — mismo purchaseId, sin duplicar CxP ni factura", async () => {
    const invoiceNumber = `F6-RETOT-${Date.now()}`;
    const createBody = {
      warehouseId: licId,
      supplierId,
      invoiceNumber,
      currency: "USD",
      paymentMethodId: paymentId,
      paymentCondition: "CREDITO",
      creditDays: 10,
      lines: [
        {
          presentationId: taxablePresId,
          qty: 10,
          costMode: "UNIT",
          unitCostUsd: 5,
          taxable: true,
        },
      ],
    };

    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send(createBody);
    expect(buy.status).toBe(201);
    const id = buy.body.data.id as string;
    expect(Number(buy.body.data.totals.subtotal)).toBeCloseTo(50, 4);
    expect(Number(buy.body.data.totals.tax)).toBeCloseTo(8, 4);
    expect(Number(buy.body.data.totals.grandTotal)).toBeCloseTo(58, 4);

    const t1 = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    expect(t1.status).toBe(200);
    expect(t1.body.data.id).toBe(id);
    expect(t1.body.data.status).toBe("PRELIMINARY");
    expect(t1.body.data.document?.lines?.[0]?.description).toBeTruthy();
    expect(t1.body.data.document?.taxLabel).toBe("IVA 16%");
    expect(JSON.stringify(t1.body.data.document)).not.toMatch(
      /utilidad|margen|precio de venta|protectedRate/i,
    );

    // sin CxP aún
    let payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    expect(
      payables.body.data.filter(
        (p: { purchaseId: string }) => p.purchaseId === id,
      ).length,
    ).toBe(0);

    // editar vía PUT (misma factura) → vuelve DRAFT
    const upd = await request(app)
      .put(`/api/v1/ad/commerce/purchases/${id}`)
      .set(auth(adminToken))
      .send({
        ...createBody,
        lines: [
          {
            presentationId: taxablePresId,
            qty: 20,
            costMode: "UNIT",
            unitCostUsd: 5,
            taxable: true,
          },
          {
            presentationId,
            qty: 4,
            costMode: "UNIT",
            unitCostUsd: 2.5,
            taxable: false,
          },
        ],
      });
    expect(upd.status).toBe(200);
    expect(upd.body.data.id).toBe(id);
    expect(upd.body.data.status).toBe("DRAFT");
    expect(upd.body.data.invoiceNumber).toBe(invoiceNumber);
    // subtotal 100 + 10 = 110; IVA 16; total 126
    expect(Number(upd.body.data.totals.subtotal)).toBeCloseTo(110, 4);
    expect(Number(upd.body.data.totals.tax)).toBeCloseTo(16, 4);
    expect(Number(upd.body.data.totals.grandTotal)).toBeCloseTo(126, 4);
    expect(upd.body.data.lines.length).toBe(2);

    const t2 = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    expect(t2.status).toBe(200);
    expect(t2.body.data.id).toBe(id);
    expect(t2.body.data.status).toBe("PRELIMINARY");
    expect(Number(t2.body.data.totals.grandTotal)).toBeCloseTo(126, 4);

    // aún una sola compra con ese invoice
    const sameInvoice = await getPrisma().adPurchase.count({
      where: { invoiceNumber, tenantId: buy.body.data.tenantId },
    });
    expect(sameInvoice).toBe(1);

    payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    expect(
      payables.body.data.filter(
        (p: { purchaseId: string }) => p.purchaseId === id,
      ).length,
    ).toBe(0);

    const conf = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(conf.status).toBe(200);
    expect(conf.body.data.id).toBe(id);
    expect(conf.body.data.status).toBe("RECEIVED");
    expect(conf.body.data.document?.title).toMatch(/CONFIRMADA/i);

    payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    const forPurchase = payables.body.data.filter(
      (p: { purchaseId: string }) => p.purchaseId === id,
    );
    expect(forPurchase.length).toBe(1);
    expect(Number(forPurchase[0].amount)).toBeCloseTo(126, 2);
    expect(Number(forPurchase[0].taxAmount)).toBeCloseTo(16, 2);
    expect(Number(forPurchase[0].subtotal)).toBeCloseTo(110, 2);

    // re-totalizar tras confirm debe fallar
    const bad = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    expect(bad.status).toBeGreaterThanOrEqual(400);

    const audits = await getPrisma().adAuditEvent.findMany({
      where: {
        entityId: id,
        action: { in: ["create", "update", "totalize", "confirm"] },
      },
    });
    expect(audits.some((a) => a.action === "update")).toBe(true);
    expect(audits.filter((a) => a.action === "totalize").length).toBeGreaterThanOrEqual(
      2,
    );
    const updAudit = audits.find((a) => a.action === "update");
    expect(updAudit?.before).toBeTruthy();
    expect(updAudit?.after).toBeTruthy();
  });
});
