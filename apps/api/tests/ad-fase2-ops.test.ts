import { describe, it, expect, beforeEach } from "vitest";
import { ForbiddenError, ValidationError } from "../src/errors/app-error.js";
import { AdOpsEngine } from "../src/ad/ops-engine.js";
import { weightedAverageCost } from "../src/ad/availability.js";

describe("A&D Fase 2 — escenarios operativos", () => {
  let eng: AdOpsEngine;
  let ids: ReturnType<AdOpsEngine["seed"]>;
  let productId: string;
  let presentationId: string;

  beforeEach(() => {
    eng = new AdOpsEngine();
    ids = eng.seed();
    productId = eng.createProduct(ids.adminId, "Cerveza Regional");
    presentationId = eng.createPresentation(ids.adminId, productId, {
      name: "Individual",
      unitsPerPresentation: 1,
      priceUsd: 1,
      priceBs: 40,
    });
    eng.setStockQty(ids.adminId, ids.whA, productId, 100);
    eng.setStockQty(ids.adminId, ids.whB, productId, 50);
  });

  it("1. Cuenta 20 → servir 8 → servir 5 → pendientes 7", () => {
    const account = eng.createAccount({
      operatorId: ids.mesoneraId,
      warehouseId: ids.whA,
    });
    const line = eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 20,
    });
    expect(eng.getStock(ids.whA, productId)).toBe(100); // pedir no descuenta
    const s1 = eng.serveAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      itemId: line.id,
      qty: 8,
    });
    expect(s1).toEqual({ requested: 20, served: 8, pending: 12 });
    expect(eng.getStock(ids.whA, productId)).toBe(92);
    const s2 = eng.serveAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      itemId: line.id,
      qty: 5,
    });
    expect(s2.pending).toBe(7);
    expect(eng.getStock(ids.whA, productId)).toBe(87);
  });

  it("2. Inventario físico/comprometido/disponible", () => {
    const account = eng.createAccount({ operatorId: ids.mesoneraId });
    eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 20,
    });
    const av = eng.availability(productId, ids.whA);
    const whA = av.byWarehouse.find((w) => w.warehouseId === ids.whA)!;
    expect(whA.physical).toBe(100);
    expect(whA.committedActive).toBe(20);
    expect(whA.availableOperational).toBe(80);
  });

  it("3. Vender producto comprometido pero físicamente disponible", () => {
    const account = eng.createAccount({ operatorId: ids.mesoneraId });
    eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 20,
    });
    // Venta física de 90: compromiso 20 deja disponible op. 80, pero físico 100 → venta OK
    const sale = eng.sellPhysical({
      operatorId: ids.cajeroId,
      warehouseId: ids.whA,
      presentationId,
      qty: 90,
    });
    expect(sale.qtyBase).toBe(90);
    expect(eng.getStock(ids.whA, productId)).toBe(10);
  });

  it("4. Detectar déficit de compromisos cliente", () => {
    const customerId = eng.createCustomer(ids.adminId, {
      name: "Cliente",
      phone: "04141234567",
      document: "V123",
    });
    const account = eng.createAccount({
      operatorId: ids.mesoneraId,
      customerId,
    });
    const line = eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 20,
    });
    eng.serveAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      itemId: line.id,
      qty: 5,
    });
    eng.closeAccount({
      operatorId: ids.cajeroId,
      accountId: account.id,
      settlePendingAs: "commitment",
    });
    eng.setStockQty(ids.adminId, ids.whA, productId, 5);
    eng.setStockQty(ids.adminId, ids.whB, productId, 0);
    const av = eng.availability(productId, ids.whA);
    expect(av.customerPendingBase).toBe(15);
    expect(av.customerCommitmentDeficit).toBe(10);
    expect(av.status).toBe("COMMITMENT_DEFICIT");
  });

  it("5. Servir descuenta stock", () => {
    const account = eng.createAccount({ operatorId: ids.mesoneraId });
    const line = eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 3,
    });
    eng.serveAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      itemId: line.id,
      qty: 3,
    });
    expect(eng.getStock(ids.whA, productId)).toBe(97);
  });

  it("6. Anular solo devuelve lo servido", () => {
    const account = eng.createAccount({ operatorId: ids.mesoneraId });
    const line = eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 10,
    });
    eng.serveAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      itemId: line.id,
      qty: 4,
    });
    expect(eng.getStock(ids.whA, productId)).toBe(96);
    eng.voidAccount({
      operatorId: ids.adminId,
      accountId: account.id,
      reason: "cliente canceló",
    });
    expect(eng.getStock(ids.whA, productId)).toBe(100);
  });

  it("7. Dos depósitos aislados", () => {
    eng.setStockQty(ids.adminId, ids.whA, productId, 10);
    eng.setStockQty(ids.adminId, ids.whB, productId, 99);
    expect(eng.getStock(ids.whA, productId)).toBe(10);
    expect(eng.getStock(ids.whB, productId)).toBe(99);
  });

  it("8. Transferencia 1 producto", () => {
    const tr = eng.createTransfer({
      operatorId: ids.adminId,
      fromWarehouseId: ids.whB,
      toWarehouseId: ids.whA,
      lines: [{ presentationId, qty: 5 }],
    });
    eng.confirmTransferAtomic({
      operatorId: ids.adminId,
      transferId: tr.id,
    });
    expect(eng.getStock(ids.whB, productId)).toBe(45);
    expect(eng.getStock(ids.whA, productId)).toBe(105);
  });

  it("9. Transferencia múltiples productos", () => {
    const p2 = eng.createProduct(ids.adminId, "Ron");
    const pres2 = eng.createPresentation(ids.adminId, p2, {
      name: "Botella",
      unitsPerPresentation: 1,
      priceUsd: 10,
      priceBs: 400,
    });
    eng.setStockQty(ids.adminId, ids.whB, p2, 20);
    const tr = eng.createTransfer({
      operatorId: ids.adminId,
      fromWarehouseId: ids.whB,
      toWarehouseId: ids.whA,
      lines: [
        { presentationId, qty: 2 },
        { presentationId: pres2, qty: 3 },
      ],
    });
    eng.confirmTransferAtomic({ operatorId: ids.adminId, transferId: tr.id });
    expect(eng.getStock(ids.whA, productId)).toBe(102);
    expect(eng.getStock(ids.whA, p2)).toBe(3);
  });

  it("10. Compra → recepción → stock + CPP", () => {
    const purchase = eng.createPurchase({
      operatorId: ids.adminId,
      warehouseId: ids.whA,
      supplierName: "Proveedor",
      invoiceNumber: "FAC-1",
      lines: [
        {
          presentationId,
          qty: 10,
          unitCostUsd: 0.5,
          unitCostBs: 20,
        },
      ],
    });
    expect(eng.getStock(ids.whA, productId)).toBe(100);
    eng.receivePurchase({ operatorId: ids.adminId, purchaseId: purchase.id });
    expect(eng.getStock(ids.whA, productId)).toBe(110);
    const product = eng.products.find((p) => p.id === productId)!;
    expect(product.avgCostUsd).toBeCloseTo(
      weightedAverageCost(100, 0, 10, 0.5),
    );
  });

  it("11. Prepago 20 → consumir 8 → saldo 12 (stock baja al consumir)", () => {
    const customerId = eng.createCustomer(ids.adminId, {
      name: "PP",
      phone: "04140001111",
      document: "V999",
    });
    const prepaid = eng.createPrepaid({
      operatorId: ids.cajeroId,
      customerId,
      warehouseId: ids.whA,
      items: [{ presentationId, qty: 20 }],
    });
    expect(eng.getStock(ids.whA, productId)).toBe(100);
    const r = eng.consumePrepaid({
      operatorId: ids.mesoneraId,
      prepaidId: prepaid.id,
      presentationId,
      qty: 8,
      verifyPhone: "04140001111",
      verifyDocument: "V999",
    });
    expect(r.remaining).toBe(12);
    expect(eng.getStock(ids.whA, productId)).toBe(92);
  });

  it("12. QR no consumible con identidad incorrecta", () => {
    const customerId = eng.createCustomer(ids.adminId, {
      name: "PP",
      phone: "04140001111",
      document: "V999",
    });
    const prepaid = eng.createPrepaid({
      operatorId: ids.cajeroId,
      customerId,
      warehouseId: ids.whA,
      items: [{ presentationId, qty: 5 }],
    });
    expect(() =>
      eng.consumePrepaid({
        operatorId: ids.mesoneraId,
        prepaidId: prepaid.id,
        presentationId,
        qty: 1,
        verifyPhone: "0000000000",
        verifyDocument: "V999",
      }),
    ).toThrow(ForbiddenError);
    expect(() =>
      eng.consumePrepaid({
        operatorId: ids.mesoneraId,
        prepaidId: prepaid.id,
        presentationId,
        qty: 1,
        verifyPhone: "04140001111",
        verifyDocument: "X000",
      }),
    ).toThrow(ForbiddenError);
  });

  it("13. Doble consumo simultáneo del mismo QR", async () => {
    const customerId = eng.createCustomer(ids.adminId, {
      name: "PP",
      phone: "04140001111",
      document: "V999",
    });
    const prepaid = eng.createPrepaid({
      operatorId: ids.cajeroId,
      customerId,
      warehouseId: ids.whA,
      items: [{ presentationId, qty: 10 }],
    });
    // Serializar con lock: el segundo debe fallar si el primero aún tiene lock
    prepaid.locked = true;
    expect(() =>
      eng.consumePrepaid({
        operatorId: ids.mesoneraId,
        prepaidId: prepaid.id,
        presentationId,
        qty: 5,
        verifyPhone: "04140001111",
        verifyDocument: "V999",
      }),
    ).toThrow(ValidationError);
    prepaid.locked = false;

    eng.consumePrepaid({
      operatorId: ids.mesoneraId,
      prepaidId: prepaid.id,
      presentationId,
      qty: 8,
      verifyPhone: "04140001111",
      verifyDocument: "V999",
    });
    expect(() =>
      eng.consumePrepaid({
        operatorId: ids.mesoneraId,
        prepaidId: prepaid.id,
        presentationId,
        qty: 5,
        verifyPhone: "04140001111",
        verifyDocument: "V999",
      }),
    ).toThrow(ValidationError);
  });

  it("14. Cierre de cuenta con pendiente → commitment", () => {
    const customerId = eng.createCustomer(ids.adminId, {
      name: "C",
      phone: "04141112222",
      document: "V1",
    });
    const account = eng.createAccount({
      operatorId: ids.mesoneraId,
      customerId,
    });
    const line = eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 10,
    });
    eng.serveAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      itemId: line.id,
      qty: 3,
    });
    eng.closeAccount({
      operatorId: ids.cajeroId,
      accountId: account.id,
      settlePendingAs: "commitment",
    });
    expect(account.status).toBe("CERRADA");
    expect(eng.commitments.some((c) => c.qtyRemaining === 7)).toBe(true);
    expect(eng.commitments[0].blocksSales).toBe(false);
  });

  it("15. Cierre de caja (período HOY backend)", () => {
    eng.sellPhysical({
      operatorId: ids.cajeroId,
      warehouseId: ids.whA,
      presentationId,
      qty: 1,
    });
    const closure = eng.createCashClosure({
      operatorId: ids.cajeroId,
      warehouseId: ids.whA,
      countedCashUsd: 1,
      countedCashBs: 0,
    });
    expect(closure.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(closure.status).toBe("CLOSED");
  });

  it("16. Cierre de inventario", () => {
    const closure = eng.createInventoryClosure({
      operatorId: ids.adminId,
      warehouseId: ids.whA,
      lines: [{ productId, physicalBase: 95 }],
      applyAdjustments: true,
    });
    expect(closure.lines[0].differenceBase).toBe(-5);
    expect(eng.getStock(ids.whA, productId)).toBe(95);
  });

  it("17. Auditoría before/after", () => {
    const account = eng.createAccount({ operatorId: ids.mesoneraId });
    const line = eng.addAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      presentationId,
      qty: 2,
    });
    eng.serveAccountItem({
      operatorId: ids.mesoneraId,
      accountId: account.id,
      itemId: line.id,
      qty: 1,
    });
    const serveAudit = eng.audits.find((a) => a.action === "serve");
    expect(serveAudit?.before).toBeTruthy();
    expect(serveAudit?.after).toBeTruthy();
  });

  it("18. Usuario depósito A no manipula depósito B", () => {
    expect(() =>
      eng.createAccount({
        operatorId: ids.mesoneraId,
        warehouseId: ids.whB,
      }),
    ).toThrow(ForbiddenError);
  });

  it("19. Intento de doble recepción", () => {
    const purchase = eng.createPurchase({
      operatorId: ids.adminId,
      warehouseId: ids.whA,
      supplierName: "P",
      invoiceNumber: "FAC-2",
      lines: [
        { presentationId, qty: 1, unitCostUsd: 1, unitCostBs: 40 },
      ],
    });
    eng.receivePurchase({ operatorId: ids.adminId, purchaseId: purchase.id });
    expect(() =>
      eng.receivePurchase({ operatorId: ids.adminId, purchaseId: purchase.id }),
    ).toThrow(ValidationError);
  });

  it("20. Intento de doble transferencia", () => {
    const tr = eng.createTransfer({
      operatorId: ids.adminId,
      fromWarehouseId: ids.whB,
      toWarehouseId: ids.whA,
      lines: [{ presentationId, qty: 1 }],
    });
    eng.confirmTransferAtomic({ operatorId: ids.adminId, transferId: tr.id });
    expect(() =>
      eng.confirmTransferAtomic({ operatorId: ids.adminId, transferId: tr.id }),
    ).toThrow(ValidationError);
  });
});
