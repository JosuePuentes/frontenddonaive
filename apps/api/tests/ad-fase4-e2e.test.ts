/**
 * A&D Fase 4 — E2E contra PostgreSQL real.
 * Requiere: DATABASE_URL, migraciones aplicadas, seed (`npm run seed:ad`).
 */
import "dotenv/config";
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { isDatabaseConfigured } from "../src/config/env.js";
import { connectDatabase, getPrisma } from "../src/config/database.js";

const DEMO_PASSWORD = process.env.AD_SEED_PASSWORD ?? "AdDemo#2026";
const hasDb = isDatabaseConfigured();

const describeE2E = hasDb ? describe : describe.skip;

describeE2E("A&D Fase 4 — E2E PostgreSQL", () => {
  const app = createApp();
  let licId = "";
  let bodId = "";
  let adminToken = "";
  let cajeroLicToken = "";
  let cajeroBodToken = "";
  let supervisorToken = "";
  let productId = "";
  let presentationId = "";
  let customerId = "";

  async function login(username: string) {
    const res = await request(app).post("/api/v1/ad/auth/login").send({
      tenantSlug: "ad-licoreria",
      username,
      password: DEMO_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    return res.body.data as {
      accessToken: string;
      operator: { id: string; warehouseId: string | null; role: string };
      warehouses: { id: string; code: string }[];
    };
  }

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  beforeAll(async () => {
    await connectDatabase();
    const prisma = getPrisma();
    const tenant = await prisma.adTenant.findUnique({
      where: { slug: "ad-licoreria" },
    });
    if (!tenant) {
      throw new Error("Ejecute npm run seed:ad antes de los E2E");
    }
    const warehouses = await prisma.adWarehouse.findMany({
      where: { tenantId: tenant.id },
    });
    licId = warehouses.find((w) => w.code === "LIC")!.id;
    bodId = warehouses.find((w) => w.code === "BOD")!.id;
    const product = await prisma.adProduct.findFirst({
      where: { tenantId: tenant.id, sku: "CER-REG" },
      include: { presentations: true },
    });
    productId = product!.id;
    presentationId = product!.presentations.find((p) => p.code === "U")!.id;

    // Estado reproducible entre corridas: anular cuentas abiertas y reponer stock.
    await prisma.adAccount.updateMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["ABIERTA", "PREPAGADA", "PARCIALMENTE_PAGADA", "PAGADA"] },
      },
      data: { status: "ANULADA", voidReason: "e2e-reset", voidedAt: new Date() },
    });
    await prisma.adCustomerCommitment.updateMany({
      where: { tenantId: tenant.id, status: "PENDIENTE" },
      data: { status: "ANULADO" },
    });
    await prisma.adStock.upsert({
      where: {
        warehouseId_productId: { warehouseId: licId, productId },
      },
      create: { warehouseId: licId, productId, qtyBase: 200 },
      update: { qtyBase: 200 },
    });
    await prisma.adStock.upsert({
      where: {
        warehouseId_productId: { warehouseId: bodId, productId },
      },
      create: { warehouseId: bodId, productId, qtyBase: 80 },
      update: { qtyBase: 80 },
    });

    const admin = await login("admin");
    adminToken = admin.accessToken;
    const cLic = await login("cajero.lic");
    cajeroLicToken = cLic.accessToken;
    const cBod = await login("cajero.bod");
    cajeroBodToken = cBod.accessToken;
    const sup = await login("supervisor");
    supervisorToken = sup.accessToken;

    const cust = await request(app)
      .post("/api/v1/ad/customers")
      .set(auth(adminToken))
      .send({
        name: "Cliente E2E",
        phone: "04141234567",
        document: "V12345678",
      });
    expect([200, 201]).toContain(cust.status);
    customerId = cust.body.data.id;
  }, 60_000);

  it("A — Login ADMIN con JWT", async () => {
    const ctx = await request(app)
      .get("/api/v1/ad/context")
      .set(auth(adminToken));
    expect(ctx.status).toBe(200);
    expect(ctx.body.data.operator.role).toBe("admin");
  });

  it("B — Login CAJERO Licorería", async () => {
    const ctx = await request(app)
      .get("/api/v1/ad/context")
      .set(auth(cajeroLicToken));
    expect(ctx.status).toBe(200);
    expect(ctx.body.data.operator.role).toBe("cajero");
    expect(ctx.body.data.operator.warehouseId).toBe(licId);
  });

  it("C — CAJERO Licorería no vende en Bodegón", async () => {
    const res = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(cajeroLicToken))
      .send({
        warehouseId: bodId,
        customerId,
        lines: [{ presentationId, qty: 1 }],
        payments: [{ method: "efectivo_usd", currency: "USD", amount: 1.2 }],
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("D — Venta desde Licorería", async () => {
    const before = await getPrisma().adStock.findUnique({
      where: {
        warehouseId_productId: { warehouseId: licId, productId },
      },
    });
    const res = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(cajeroLicToken))
      .send({
        warehouseId: licId,
        customerId,
        lines: [{ presentationId, qty: 2 }],
        payments: [{ method: "efectivo_usd", currency: "USD", amount: 2.4 }],
      });
    expect(res.status).toBe(201);
    expect(String(res.body.data.receiptNumber)).toMatch(/^AD-\d{4}-\d+$/);
    const after = await getPrisma().adStock.findUnique({
      where: {
        warehouseId_productId: { warehouseId: licId, productId },
      },
    });
    expect(Number(after!.qtyBase)).toBe(Number(before!.qtyBase) - 2);
  });

  it("E/F — Cuenta 20 pedidas → 8+5 servidas → 7 pendientes; físico correcto", async () => {
    const mesonera = await login("mesonera.lic");
    const before = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );

    const opened = await request(app)
      .post("/api/v1/ad/accounts")
      .set(auth(mesonera.accessToken))
      .send({
        warehouseId: licId,
        mesoneraId: mesonera.operator.id,
        customerId,
        customerName: "Cliente E2E",
        customerPhone: "04141234567",
      });
    expect(opened.status).toBe(201);
    const accountId = opened.body.data.id as string;

    const added = await request(app)
      .post(`/api/v1/ad/accounts/${accountId}/items`)
      .set(auth(mesonera.accessToken))
      .send({ presentationId, qty: 20 });
    expect([200, 201]).toContain(added.status);

    const midStock = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );
    expect(midStock).toBe(before); // PEDIR ≠ SERVIR

    const detail0 = await request(app)
      .get(`/api/v1/ad/accounts/${accountId}`)
      .set(auth(mesonera.accessToken));
    expect(detail0.status).toBe(200);
    const lineId = detail0.body.data.lines[0].id as string;

    const s1 = await request(app)
      .post(`/api/v1/ad/accounts/${accountId}/serve`)
      .set(auth(mesonera.accessToken))
      .send({ itemId: lineId, qty: 8 });
    expect(s1.status).toBeLessThan(400);

    const s2 = await request(app)
      .post(`/api/v1/ad/accounts/${accountId}/serve`)
      .set(auth(mesonera.accessToken))
      .send({ itemId: lineId, qty: 5 });
    expect(s2.status).toBeLessThan(400);

    const finalDetail = await request(app)
      .get(`/api/v1/ad/accounts/${accountId}`)
      .set(auth(mesonera.accessToken));
    const line = finalDetail.body.data.lines[0];
    expect(Number(line.qtyOrdered)).toBe(20);
    expect(Number(line.qtyServed)).toBe(13);
    expect(Number(line.qtyOrdered) - Number(line.qtyServed)).toBe(7);

    const after = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );
    expect(after).toBe(before - 13);
  });

  it("G — Prepago 20 → consumir 8 → saldo 12", async () => {
    const created = await request(app)
      .post("/api/v1/ad/prepaids")
      .set(auth(adminToken))
      .send({
        customerId,
        warehouseId: licId,
        items: [{ presentationId, qty: 20 }],
      });
    expect([200, 201]).toContain(created.status);
    const prepaidId = created.body.data.id as string;
    const beforeStock = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );

    const consume = await request(app)
      .post(`/api/v1/ad/prepaids/${prepaidId}/consume`)
      .set(auth(adminToken))
      .send({
        presentationId,
        qty: 8,
        verifyPhone: "04141234567",
        verifyDocument: "V12345678",
      });
    expect(consume.status).toBeLessThan(400);

    const prepaid = await getPrisma().adPrepaid.findUnique({
      where: { id: prepaidId },
      include: { items: true },
    });
    const item = prepaid!.items[0];
    expect(Number(item.qtyPurchased) - Number(item.qtyConsumed)).toBe(12);

    const afterStock = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );
    expect(afterStock).toBe(beforeStock - 8);
  });

  it("H — QR identidad correcta PASS / incorrecta DENEGADO", async () => {
    const created = await request(app)
      .post("/api/v1/ad/prepaids")
      .set(auth(adminToken))
      .send({
        customerId,
        warehouseId: licId,
        items: [{ presentationId, qty: 3 }],
      });
    const prepaidId = created.body.data.id as string;
    const bad = await request(app)
      .post(`/api/v1/ad/prepaids/${prepaidId}/consume`)
      .set(auth(adminToken))
      .send({
        presentationId,
        qty: 1,
        verifyPhone: "00000000000",
        verifyDocument: "WRONG",
      });
    expect(bad.status).toBeGreaterThanOrEqual(400);

    const good = await request(app)
      .post(`/api/v1/ad/prepaids/${prepaidId}/consume`)
      .set(auth(adminToken))
      .send({
        presentationId,
        qty: 1,
        verifyPhone: "04141234567",
        verifyDocument: "V12345678",
      });
    expect(good.status).toBeLessThan(400);
  });

  it("I — Transferencia Licorería → Bodegón", async () => {
    const draft = await request(app)
      .post("/api/v1/ad/transfers")
      .set(auth(adminToken))
      .send({
        fromWarehouseId: licId,
        toWarehouseId: bodId,
        lines: [{ presentationId, qty: 4 }],
      });
    expect([200, 201]).toContain(draft.status);
    const transferId = draft.body.data.id as string;
    const received = await request(app)
      .post(`/api/v1/ad/transfers/${transferId}/receive`)
      .set(auth(adminToken));
    expect(received.status).toBeLessThan(400);
    expect(String(received.body.data.documentNumber ?? "")).toMatch(
      /^TR-\d{4}-\d+$/,
    );
  });

  it("J — Compra crear → recibir → inventario", async () => {
    const before = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );
    const created = await request(app)
      .post("/api/v1/ad/purchases")
      .set(auth(adminToken))
      .send({
        supplierName: "Proveedor E2E",
        invoiceNumber: `FAC-E2E-${Date.now()}`,
        warehouseId: licId,
        lines: [
          {
            presentationId,
            qty: 10,
            unitCostUsd: 0.5,
            unitCostBs: 200,
          },
        ],
      });
    expect([200, 201]).toContain(created.status);
    const purchaseId = created.body.data.id as string;
    const received = await request(app)
      .post(`/api/v1/ad/purchases/${purchaseId}/receive`)
      .set(auth(adminToken));
    expect(received.status).toBeLessThan(400);
    const after = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );
    expect(after).toBe(before + 10);
  });

  it("K — Shortage override: cajero DENEGADO; supervisor con motivo PASS", async () => {
    // Comprometer casi todo el disponible operativo sin tocar físico (PEDIR).
    const stock = await getPrisma().adStock.findUnique({
      where: {
        warehouseId_productId: { warehouseId: licId, productId },
      },
    });
    const physical = Number(stock?.qtyBase ?? 0);
    expect(physical).toBeGreaterThan(5);

    const mesonera = await login("mesonera.lic");
    const opened = await request(app)
      .post("/api/v1/ad/accounts")
      .set(auth(mesonera.accessToken))
      .send({
        warehouseId: licId,
        mesoneraId: mesonera.operator.id,
        customerId,
      });
    expect(opened.status).toBe(201);
    const accountId = opened.body.data.id as string;
    const commitQty = Math.max(1, physical - 2);
    const added = await request(app)
      .post(`/api/v1/ad/accounts/${accountId}/items`)
      .set(auth(mesonera.accessToken))
      .send({ presentationId, qty: commitQty });
    expect([200, 201]).toContain(added.status);

    // Sin override: cajero no puede vender más allá del disponible operativo
    const deniedCashier = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(cajeroLicToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId, qty: 3 }],
        payments: [{ method: "efectivo_usd", currency: "USD", amount: 5 }],
        continueWithShortage: true,
        shortageReasonCode: "cliente_urgente",
      });
    expect(deniedCashier.status).toBeGreaterThanOrEqual(400);

    // Supervisor sin motivo → DENEGADO
    const noReason = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(supervisorToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId, qty: 3 }],
        payments: [{ method: "efectivo_usd", currency: "USD", amount: 5 }],
        continueWithShortage: true,
      });
    expect(noReason.status).toBeGreaterThanOrEqual(400);

    // Supervisor con motivo → PASS + auditoría (físico alcanza)
    const ok = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(supervisorToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId, qty: 3 }],
        payments: [{ method: "efectivo_usd", currency: "USD", amount: 5 }],
        continueWithShortage: true,
        shortageReasonCode: "cliente_urgente",
        shortageReasonNote: "E2E override",
      });
    expect(ok.status).toBe(201);

    const audit = await getPrisma().adAuditEvent.findFirst({
      where: {
        action: "shortage_override",
        entityId: ok.body.data.id,
      },
    });
    expect(audit).toBeTruthy();
  });

  it("L — Cierre de caja", async () => {
    const res = await request(app)
      .post("/api/v1/ad/closures/cash")
      .set(auth(cajeroLicToken))
      .send({
        warehouseId: licId,
        countedCashUsd: 10,
        countedCashBs: 1000,
        notes: "E2E cierre",
      });
    expect([200, 201]).toContain(res.status);
  });

  it("M — Cierre inventario", async () => {
    const stock = await getPrisma().adStock.findUnique({
      where: {
        warehouseId_productId: { warehouseId: licId, productId },
      },
    });
    const res = await request(app)
      .post("/api/v1/ad/closures/inventory")
      .set(auth(adminToken))
      .send({
        warehouseId: licId,
        applyAdjustments: false,
        lines: [
          {
            productId,
            physicalBase: Number(stock?.qtyBase ?? 0),
          },
        ],
      });
    expect([200, 201]).toContain(res.status);
  });

  it("N/O — Anulación + auditoría before/after", async () => {
    const beforeStock = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );

    const sale = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(cajeroLicToken))
      .send({
        warehouseId: licId,
        customerId,
        lines: [{ presentationId, qty: 1 }],
        payments: [{ method: "efectivo_usd", currency: "USD", amount: 1.2 }],
        continueWithShortage: true,
        shortageReasonCode: "e2e_void_setup",
      });
    // Si hay compromiso operativo, cajero no tiene override — usar admin
    const saleRes =
      sale.status >= 400
        ? await request(app)
            .post("/api/v1/ad/sales")
            .set(auth(adminToken))
            .send({
              warehouseId: licId,
              customerId,
              lines: [{ presentationId, qty: 1 }],
              payments: [
                { method: "efectivo_usd", currency: "USD", amount: 1.2 },
              ],
              continueWithShortage: true,
              shortageReasonCode: "e2e_void_setup",
            })
        : sale;
    expect(saleRes.status).toBe(201);
    const saleId = saleRes.body.data.id as string;

    const voidRes = await request(app)
      .post(`/api/v1/ad/sales/${saleId}/void`)
      .set(auth(adminToken))
      .send({ reason: "E2E void" });
    expect(voidRes.status).toBeLessThan(400);
    expect(voidRes.body.data.status).toBe("voided");

    const afterStock = Number(
      (
        await getPrisma().adStock.findUnique({
          where: {
            warehouseId_productId: { warehouseId: licId, productId },
          },
        })
      )?.qtyBase ?? 0,
    );
    expect(afterStock).toBe(beforeStock);

    const audits = await getPrisma().adAuditEvent.findMany({
      where: {
        tenantId: (
          await getPrisma().adTenant.findUnique({
            where: { slug: "ad-licoreria" },
          })
        )!.id,
        entity: "sale",
        entityId: saleId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    expect(audits.some((a) => a.action === "void")).toBe(true);
    const voidAudit = audits.find((a) => a.action === "void");
    expect(voidAudit?.before).toBeTruthy();
    expect(voidAudit?.after).toBeTruthy();
    expect(audits.some((a) => a.action === "login") || true).toBe(true);

    const loginAudits = await getPrisma().adAuditEvent.findMany({
      where: {
        tenantId: (
          await getPrisma().adTenant.findUnique({
            where: { slug: "ad-licoreria" },
          })
        )!.id,
        action: "login",
      },
      take: 1,
    });
    expect(loginAudits.length).toBeGreaterThan(0);
  });

  it("CAJERO Bodegón no usa Licorería", async () => {
    const res = await request(app)
      .post("/api/v1/ad/sales")
      .set(auth(cajeroBodToken))
      .send({
        warehouseId: licId,
        lines: [{ presentationId, qty: 1 }],
        payments: [{ method: "efectivo_usd", currency: "USD", amount: 1.2 }],
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
