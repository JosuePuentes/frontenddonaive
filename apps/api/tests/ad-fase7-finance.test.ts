/**
 * A&D Fase 7 — Finanzas E2E (cuentas, ventas→saldo, CxP, transferencias, FX, tasas, CPP).
 */
import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import {
  convertBetweenCurrencies,
  replacementCostFromRates,
} from "../src/ad/finance-domain.js";
import { createApp } from "../src/app.js";
import { isDatabaseConfigured } from "../src/config/env.js";
import { connectDatabase, getPrisma } from "../src/config/database.js";

describe("F7 domain finance", () => {
  it("conversión explícita Bs→USD y USD→Bs", () => {
    const a = convertBetweenCurrencies({
      amount: 772_540,
      from: "BS",
      to: "USD",
      rateBsPerUsd: 870,
    });
    expect(a.amountOut).toBeCloseTo(772_540 / 870, 5);
    const b = convertBetweenCurrencies({
      amount: 100,
      from: "USD",
      to: "BS",
      rateBsPerUsd: 870,
    });
    expect(b.amountOut).toBeCloseTo(87_000, 5);
  });

  it("P — reposición cambia con tasas; histórico fijo", () => {
    const hist = 10;
    const r1 = replacementCostFromRates({
      historicalCostUsd: hist,
      useParallelRef: true,
      currentProtectedRate: 870,
      currentBcvRate: 772.54,
    });
    expect(r1).toBeCloseTo((10 * 870) / 772.54, 4);
    const r2 = replacementCostFromRates({
      historicalCostUsd: hist,
      useParallelRef: true,
      currentProtectedRate: 900,
      currentBcvRate: 800,
    });
    expect(r2).toBeCloseTo((10 * 900) / 800, 4);
    expect(hist).toBe(10);
  });
});

const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";
const hasDb = isDatabaseConfigured();
const describeE2E = hasDb ? describe : describe.skip;

describeE2E("A&D Fase 7 — finanzas E2E", () => {
  const app = createApp();
  let adminToken = "";
  let cajeroToken = "";
  let mesoneraToken = "";
  let licId = "";
  let presentationId = "";
  let taxablePresId = "";
  let productId = "";
  let supplierId = "";
  let zelleMethodId = "";
  let pmBsMethodId = "";
  let accountUsdId = "";
  let accountBsId = "";
  let accountBinanceId = "";

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

    adminToken = await login("admin");
    cajeroToken = await login("cajero.lic");
    mesoneraToken = await login("mesonera.lic");

    await request(app)
      .post("/api/v1/ad/rates/bcv")
      .set(auth(adminToken))
      .send({ rate: 772.54 });
    await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(adminToken))
      .send({ rate: 870 });

    const stamp = Date.now();

    const usdAcc = await request(app)
      .post("/api/v1/ad/finance/accounts")
      .set(auth(adminToken))
      .send({
        name: `Zelle F7 ${stamp}`,
        type: "DIGITAL",
        currency: "USD",
        openingBalance: 5000,
      });
    expect(usdAcc.status).toBe(201);
    accountUsdId = usdAcc.body.data.id;

    const bsAcc = await request(app)
      .post("/api/v1/ad/finance/accounts")
      .set(auth(adminToken))
      .send({
        name: `PagoMovil F7 ${stamp}`,
        type: "BANK",
        currency: "BS",
        openingBalance: 1_000_000,
      });
    expect(bsAcc.status).toBe(201);
    accountBsId = bsAcc.body.data.id;

    const bin = await request(app)
      .post("/api/v1/ad/finance/accounts")
      .set(auth(adminToken))
      .send({
        name: `Binance F7 ${stamp}`,
        type: "DIGITAL",
        currency: "USD",
        openingBalance: 100,
      });
    expect(bin.status).toBe(201);
    accountBinanceId = bin.body.data.id;

    const zelle = await request(app)
      .post("/api/v1/ad/payment-methods")
      .set(auth(adminToken))
      .send({
        code: `zelle_f7_${stamp}`,
        name: `Zelle F7 ${stamp}`,
        currency: "USD",
        usesSpecialRateRef: true,
        financialAccountId: accountUsdId,
      });
    expect(zelle.status).toBe(201);
    zelleMethodId = zelle.body.data.id;

    const pmBs = await request(app)
      .post("/api/v1/ad/payment-methods")
      .set(auth(adminToken))
      .send({
        code: `pm_f7_${stamp}`,
        name: `PagoMovil F7 ${stamp}`,
        currency: "BS",
        financialAccountId: accountBsId,
      });
    expect(pmBs.status).toBe(201);
    pmBsMethodId = pmBs.body.data.id;

    const prod = await request(app)
      .post("/api/v1/ad/commerce/products")
      .set(auth(adminToken))
      .send({
        sku: `F7-${stamp}`,
        name: "Prod F7 IVA",
        taxable: true,
        presentationName: "Unidad",
        unitsPerPresentation: 1,
        priceUsd: 5,
        priceBs: 4000,
      });
    expect(prod.status).toBe(201);
    taxablePresId = prod.body.data.presentations[0].id;

    const stock = await prisma.adStock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId: licId,
          productId: prod.body.data.id,
        },
      },
      create: {
        warehouseId: licId,
        productId: prod.body.data.id,
        qtyBase: 1000,
      },
      update: { qtyBase: 1000 },
    });
    void stock;

    // stock for CER-REG presentation
    await prisma.adStock.upsert({
      where: {
        warehouseId_productId: { warehouseId: licId, productId },
      },
      create: { warehouseId: licId, productId, qtyBase: 5000 },
      update: { qtyBase: { increment: 500 } },
    });

    const sup = await request(app)
      .post("/api/v1/ad/suppliers")
      .set(auth(adminToken))
      .send({ name: `Prov F7 ${stamp}`, creditDays: 15, defaultCurrency: "USD" });
    expect(sup.status).toBe(201);
    supplierId = sup.body.data.id;
  }, 120_000);

  it("A — crear cuenta financiera", async () => {
    const res = await request(app)
      .get("/api/v1/ad/finance/accounts")
      .set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.accounts.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.summaryByCurrency.USD).toBeDefined();
    expect(res.body.data.summaryByCurrency.BS).toBeDefined();
  });

  it("B — venta USD → saldo cuenta USD", async () => {
    const before = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    const methods = await request(app)
      .get("/api/v1/ad/payment-methods")
      .set(auth(adminToken));
    const zelle = methods.body.data.find(
      (m: { id: string }) => m.id === zelleMethodId,
    );
    const sale2 = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId: taxablePresId, qty: 2 }],
        payments: [
          { method: zelle.name, currency: "USD", amount: 10 },
        ],
      });
    expect(sale2.status).toBe(201);
    const after = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    expect(Number(after.balance)).toBeCloseTo(Number(before.balance) + 10, 2);
  });

  it("C — venta Bs → saldo cuenta Bs", async () => {
    const before = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountBsId },
    });
    const methods = await request(app)
      .get("/api/v1/ad/payment-methods")
      .set(auth(adminToken));
    const pm = methods.body.data.find(
      (m: { id: string }) => m.id === pmBsMethodId,
    );
    const sale = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId: taxablePresId, qty: 1 }],
        payments: [
          { method: pm.name, currency: "BS", amount: 77_254 },
        ],
      });
    expect(sale.status).toBe(201);
    const after = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountBsId },
    });
    expect(Number(after.balance)).toBeCloseTo(
      Number(before.balance) + 77_254,
      2,
    );
  });

  it("D/E/F — compra contado egreso; crédito CxP; pago posterior", async () => {
    const beforeUsd = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });

    const credit = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F7-CR-${Date.now()}`,
        currency: "USD",
        paymentMethodId: zelleMethodId,
        paymentCondition: "CREDITO",
        creditDays: 10,
        lines: [
          {
            presentationId,
            qty: 5,
            costMode: "UNIT",
            unitCostUsd: 1,
            taxable: false,
          },
        ],
      });
    expect(credit.status).toBe(201);
    const creditId = credit.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${creditId}/totalize`)
      .set(auth(adminToken));
    const confCredit = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${creditId}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(confCredit.status).toBe(200);

    const midUsd = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    // crédito: sin egreso
    expect(Number(midUsd.balance)).toBeCloseTo(Number(beforeUsd.balance), 2);

    const payables = await request(app)
      .get("/api/v1/ad/payables")
      .set(auth(adminToken));
    const ap = payables.body.data.find(
      (p: { purchaseId: string }) => p.purchaseId === creditId,
    );
    expect(ap).toBeTruthy();
    expect(Number(ap.balance)).toBeCloseTo(5, 2);

    const pay = await request(app)
      .post(`/api/v1/ad/payables/${ap.id}/payments`)
      .set(auth(adminToken))
      .send({
        amount: 5,
        currency: "USD",
        paymentMethodId: zelleMethodId,
        financialAccountId: accountUsdId,
      });
    expect([200, 201]).toContain(pay.status);

    const afterPay = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    expect(Number(afterPay.balance)).toBeCloseTo(Number(midUsd.balance) - 5, 2);

    // contado con egreso
    const contado = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F7-CO-${Date.now()}`,
        currency: "USD",
        paymentMethodId: zelleMethodId,
        paymentCondition: "CONTADO",
        lines: [
          {
            presentationId,
            qty: 3,
            costMode: "UNIT",
            unitCostUsd: 2,
            taxable: false,
          },
        ],
      });
    const contadoId = contado.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${contadoId}/totalize`)
      .set(auth(adminToken));
    const confContado = await request(app)
      .post(`/api/v1/ad/commerce/purchases/${contadoId}/confirm`)
      .set(auth(adminToken))
      .send({});
    expect(confContado.status).toBe(200);
    const afterContado = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    expect(Number(afterContado.balance)).toBeCloseTo(
      Number(afterPay.balance) - 6,
      2,
    );
  });

  it("G — transferencia misma moneda", async () => {
    const draft = await request(app)
      .post("/api/v1/ad/finance/transfers")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountUsdId,
        toAccountId: accountBinanceId,
        amount: 50,
        concept: "Zelle→Binance",
      });
    expect(draft.status).toBe(201);
    const id = draft.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/finance/movements/${id}/totalize`)
      .set(auth(adminToken));
    const beforeFrom = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    const beforeTo = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountBinanceId },
    });
    const conf = await request(app)
      .post(`/api/v1/ad/finance/movements/${id}/confirm`)
      .set(auth(adminToken));
    expect(conf.status).toBe(200);
    const afterFrom = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountUsdId },
    });
    const afterTo = await getPrisma().adFinancialAccount.findUniqueOrThrow({
      where: { id: accountBinanceId },
    });
    expect(Number(afterFrom.balance)).toBeCloseTo(Number(beforeFrom.balance) - 50, 2);
    expect(Number(afterTo.balance)).toBeCloseTo(Number(beforeTo.balance) + 50, 2);
  });

  it("H/I/J — cambio Bs→USD y USD→Bs con tasa explícita", async () => {
    const preview = await request(app)
      .post("/api/v1/ad/finance/exchange/preview")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountBsId,
        toAccountId: accountBinanceId,
        amount: 87_000,
        rateBsPerUsd: 870,
      });
    expect(preview.status).toBe(200);
    expect(preview.body.data.operation.amountOut).toBeCloseTo(100, 4);

    const draft = await request(app)
      .post("/api/v1/ad/finance/exchange")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountBsId,
        toAccountId: accountBinanceId,
        amount: 87_000,
        rateBsPerUsd: 870,
        concept: "Bs→USD",
        originalSaleAmount: 100,
        originalSaleCurrency: "USD",
      });
    expect(draft.status).toBe(201);
    const id = draft.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/finance/movements/${id}/totalize`)
      .set(auth(adminToken));
    const conf = await request(app)
      .post(`/api/v1/ad/finance/movements/${id}/confirm`)
      .set(auth(adminToken));
    expect(conf.status).toBe(200);
    expect(conf.body.data.type).toBe("CAMBIO_MONEDA");

    // USD → Bs
    const d2 = await request(app)
      .post("/api/v1/ad/finance/exchange")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountBinanceId,
        toAccountId: accountBsId,
        amount: 10,
        rateBsPerUsd: 870,
        concept: "USD→Bs",
      });
    const id2 = d2.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/finance/movements/${id2}/totalize`)
      .set(auth(adminToken));
    const c2 = await request(app)
      .post(`/api/v1/ad/finance/movements/${id2}/confirm`)
      .set(auth(adminToken));
    expect(c2.status).toBe(200);
    expect(Number(c2.body.data.counterAmount)).toBeCloseTo(8700, 2);
  });

  it("K/L — tasa paralela privada + auditoría", async () => {
    const before = await request(app)
      .get("/api/v1/ad/rates/protected")
      .set(auth(adminToken));
    expect(before.status).toBe(200);

    const setRes = await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(adminToken))
      .send({ rate: 875, reason: "F7 test" });
    expect(setRes.status).toBe(201);

    const audits = await getPrisma().adAuditEvent.findMany({
      where: { entity: "rate_protected", action: "update" },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    expect(audits.length).toBeGreaterThan(0);
    expect(audits[0].after).toBeTruthy();
    expect(audits[0].before).toBeTruthy();

    // mesonera no puede
    const denied = await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(mesoneraToken))
      .send({ rate: 900 });
    expect(denied.status).toBeGreaterThanOrEqual(400);
  });

  it("M/N/O — compra dólar real + CPP regalías + histórico no cambia", async () => {
    const beforeCpp = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    const buy = await request(app)
      .post("/api/v1/ad/commerce/purchases")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        supplierId,
        invoiceNumber: `F7-PAR-${Date.now()}`,
        currency: "USD",
        paymentMethodId: zelleMethodId,
        paymentCondition: "CREDITO",
        creditDays: 5,
        useProtectedRateRef: true,
        lines: [
          {
            presentationId,
            qty: 100,
            qtyBonus: 10,
            costMode: "PRESENTATION",
            presentationCostUsd: 22.9,
            taxable: true,
          },
        ],
      });
    expect(buy.status).toBe(201);
    const line = buy.body.data.lines[0];
    expect(Number(line.effectivePresentationCostUsd)).toBeCloseTo(2290 / 110, 3);
    expect(Number(line.equivalentCostUsd)).toBeGreaterThan(0);

    const id = buy.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/totalize`)
      .set(auth(adminToken));
    await request(app)
      .post(`/api/v1/ad/commerce/purchases/${id}/confirm`)
      .set(auth(adminToken))
      .send({});

    const afterCpp = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    const cppAfterConfirm = Number(afterCpp.avgCostUsd);
    expect(cppAfterConfirm).not.toBe(Number(beforeCpp.avgCostUsd));

    await request(app)
      .post("/api/v1/ad/rates/protected")
      .set(auth(adminToken))
      .send({ rate: 920 });
    await request(app)
      .post("/api/v1/ad/rates/bcv")
      .set(auth(adminToken))
      .send({ rate: 800 });

    const still = await getPrisma().adProduct.findUniqueOrThrow({
      where: { id: productId },
    });
    expect(Number(still.avgCostUsd)).toBeCloseTo(cppAfterConfirm, 5);

    const repl = await request(app)
      .get(`/api/v1/ad/finance/products/${productId}/replacement-cost`)
      .set(auth(adminToken));
    expect(repl.status).toBe(200);
    expect(Number(repl.body.data.replacementCostUsd)).not.toBe(
      Number(repl.body.data.historicalCppUsd),
    );
  });

  it("Q/R — venta intacta tras casa de cambio + diferencia FX", async () => {
    const methods = await request(app)
      .get("/api/v1/ad/payment-methods")
      .set(auth(adminToken));
    const zelle = methods.body.data.find(
      (m: { id: string }) => m.id === zelleMethodId,
    );
    const sale = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId: taxablePresId, qty: 1 }],
        payments: [{ method: zelle.name, currency: "USD", amount: 100 }],
      });
    expect(sale.status).toBe(201);
    const saleId = sale.body.data.id as string;
    const totalUsd = Number(sale.body.data.totalUsd);

    const fx = await request(app)
      .post("/api/v1/ad/finance/exchange")
      .set(auth(adminToken))
      .send({
        fromAccountId: accountUsdId,
        toAccountId: accountBsId,
        amount: 100,
        rateBsPerUsd: 900,
        concept: "Conversión post-venta",
        originalSaleAmount: 100,
        originalSaleCurrency: "USD",
      });
    const fxId = fx.body.data.id as string;
    await request(app)
      .post(`/api/v1/ad/finance/movements/${fxId}/totalize`)
      .set(auth(adminToken));
    const conf = await request(app)
      .post(`/api/v1/ad/finance/movements/${fxId}/confirm`)
      .set(auth(adminToken));
    expect(conf.status).toBe(200);

    const saleAfter = await getPrisma().adSale.findUniqueOrThrow({
      where: { id: saleId },
    });
    expect(Number(saleAfter.totalUsd)).toBeCloseTo(totalUsd, 4);
    expect(conf.body.data.type).toBe("CAMBIO_MONEDA");
    expect(Number(conf.body.data.counterAmount)).toBeCloseTo(90_000, 2);
  });

  it("S/T — aislamiento permisos financieros", async () => {
    const mesonera = await request(app)
      .get("/api/v1/ad/finance/accounts")
      .set(auth(mesoneraToken));
    expect(mesonera.status).toBeGreaterThanOrEqual(400);

    const cajeroView = await request(app)
      .get("/api/v1/ad/finance/accounts")
      .set(auth(cajeroToken));
    expect(cajeroView.status).toBeGreaterThanOrEqual(400);

    const cajeroManage = await request(app)
      .post("/api/v1/ad/finance/accounts")
      .set(auth(cajeroToken))
      .send({
        name: `Hack ${Date.now()}`,
        type: "CASH",
        currency: "USD",
        openingBalance: 1,
      });
    expect(cajeroManage.status).toBeGreaterThanOrEqual(400);
  });
});
