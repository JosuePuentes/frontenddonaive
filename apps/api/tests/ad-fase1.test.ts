import { describe, it, expect, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "../src/ad/password.js";
import {
  resolveEffectiveWarehouseId,
  resolveRolePermissions,
  requireWarehouseAccess,
  assertSameWarehouseSale,
  type AdOperatorAuth,
  type AdRequestContext,
} from "../src/ad/authorization.js";
import { ForbiddenError, ValidationError } from "../src/errors/app-error.js";
import {
  buildSaleLineSnapshots,
  sumSaleTotals,
} from "../src/ad/sales-domain.js";
import { AdMemoryStore } from "../src/ad/memory-store.js";

function op(
  partial: Partial<AdOperatorAuth> &
    Pick<AdOperatorAuth, "id" | "role" | "warehouseId">,
): AdOperatorAuth {
  return {
    tenantId: "tenant-1",
    userId: null,
    username: partial.username ?? "u",
    name: partial.name ?? "User",
    active: true,
    permissions: partial.permissions ?? [],
    ...partial,
  };
}

describe("A&D password hashing", () => {
  it("no guarda texto plano y verifica correctamente", () => {
    const hash = hashPassword("secreto123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash.includes("secreto123")).toBe(false);
    expect(verifyPassword("secreto123", hash)).toBe(true);
    expect(verifyPassword("otra", hash)).toBe(false);
  });
});

describe("A&D autorización y aislamiento por depósito", () => {
  it("cajero no puede usar depósito distinto al asignado", () => {
    const cajero = op({
      id: "op-1",
      role: "cajero",
      warehouseId: "wh-a",
    });
    expect(() => resolveEffectiveWarehouseId(cajero, "wh-b")).toThrow(
      ForbiddenError,
    );
    expect(resolveEffectiveWarehouseId(cajero, "wh-a")).toBe("wh-a");
    expect(resolveEffectiveWarehouseId(cajero, undefined)).toBe("wh-a");
  });

  it("admin puede indicar depósito explícito", () => {
    const admin = op({ id: "op-a", role: "admin", warehouseId: null });
    expect(resolveEffectiveWarehouseId(admin, "wh-b")).toBe("wh-b");
  });

  it("requireWarehouseAccess bloquea cruce para mesonera", () => {
    const ctx: AdRequestContext = {
      tenantId: "t1",
      projectId: "p1",
      operator: op({ id: "m1", role: "mesonera", warehouseId: "wh-a" }),
      warehouseId: "wh-a",
      permissions: resolveRolePermissions("mesonera", []),
    };
    expect(() => requireWarehouseAccess(ctx, "wh-b")).toThrow(ForbiddenError);
    expect(() => requireWarehouseAccess(ctx, "wh-a")).not.toThrow();
  });

  it("assertSameWarehouseSale valida venta en depósito del cajero", () => {
    const cajero = op({ id: "c1", role: "cajero", warehouseId: "wh-a" });
    expect(() => assertSameWarehouseSale(cajero, "wh-b")).toThrow(
      ForbiddenError,
    );
    expect(() => assertSameWarehouseSale(cajero, "wh-a")).not.toThrow();
  });

  it("matriz: cajero tiene pos.sell y no settings.manage", () => {
    const perms = resolveRolePermissions("cajero", []);
    expect(perms.has("pos.sell")).toBe(true);
    expect(perms.has("settings.manage")).toBe(false);
  });

  it("supervisor tiene pos.shortage_override", () => {
    const perms = resolveRolePermissions("supervisor", []);
    expect(perms.has("pos.shortage_override")).toBe(true);
  });
});

describe("A&D snapshot de precio en venta", () => {
  it("congela precios USD/Bs independientes sin conversión", () => {
    const presentations = new Map([
      [
        "pres-1",
        {
          id: "pres-1",
          productId: "prod-1",
          unitsPerPresentation: 12,
          priceUsd: 10,
          priceBs: 400,
          active: true,
        },
      ],
    ]);
    const lines = buildSaleLineSnapshots(
      [{ presentationId: "pres-1", qty: 2 }],
      presentations,
    );
    expect(lines[0].unitPriceUsd).toBe(10);
    expect(lines[0].unitPriceBs).toBe(400);
    expect(lines[0].qtyBase).toBe(24);
    expect(lines[0].lineTotalUsd).toBe(20);
    expect(lines[0].lineTotalBs).toBe(800);
    // No hay tasa: 20 USD ≠ f(800 Bs)
    const totals = sumSaleTotals(lines);
    expect(totals.totalUsd).toBe(20);
    expect(totals.totalBs).toBe(800);
  });

  it("rechaza presentación inactiva", () => {
    const presentations = new Map([
      [
        "pres-x",
        {
          id: "pres-x",
          productId: "p",
          unitsPerPresentation: 1,
          priceUsd: 1,
          priceBs: 1,
          active: false,
        },
      ],
    ]);
    expect(() =>
      buildSaleLineSnapshots([{ presentationId: "pres-x", qty: 1 }], presentations),
    ).toThrow(ValidationError);
  });
});

describe("A&D memory store — núcleo operativo", () => {
  let store: AdMemoryStore;
  let ids: ReturnType<AdMemoryStore["seedDemo"]>;

  beforeEach(() => {
    store = new AdMemoryStore();
    ids = store.seedDemo();
  });

  it("autentica operador con password hasheado", () => {
    const opOk = store.authenticateOperator(ids.tenantId, "cajero1", "cajero123");
    expect(opOk.role).toBe("cajero");
    expect(opOk.warehouseId).toBe(ids.whA);
    expect(() =>
      store.authenticateOperator(ids.tenantId, "cajero1", "wrong"),
    ).toThrow(ForbiddenError);
  });

  it("crea producto + presentación con conversión configurable", () => {
    const admin = store.operators.find((o) => o.id === ids.adminId)!;
    const product = store.createProduct(ids.tenantId, admin, {
      name: "Ron Demo",
      baseUnitLabel: "ml",
    });
    const presentation = store.createPresentation(admin, product.id, {
      name: "Botella 750",
      unitsPerPresentation: 750,
      priceUsd: 15,
      priceBs: 600,
    });
    expect(presentation.unitsPerPresentation).toBe(750);
    expect(presentation.priceUsd).toBe(15);
    expect(presentation.priceBs).toBe(600);
  });

  it("stock por depósito es independiente", () => {
    const admin = store.operators.find((o) => o.id === ids.adminId)!;
    const product = store.createProduct(ids.tenantId, admin, { name: "Whisky" });
    store.setStock(admin, ids.whA, product.id, 100);
    store.setStock(admin, ids.whB, product.id, 5);
    expect(store.getStock(ids.whA, product.id)).toBe(100);
    expect(store.getStock(ids.whB, product.id)).toBe(5);
  });

  it("cajero no puede ajustar stock de otro depósito", () => {
    const admin = store.operators.find((o) => o.id === ids.adminId)!;
    const cajero = store.operators.find((o) => o.id === ids.cajeroId)!;
    const product = store.createProduct(ids.tenantId, admin, { name: "Vodka" });
    expect(() => store.setStock(cajero, ids.whB, product.id, 10)).toThrow(
      ForbiddenError,
    );
  });

  it("crea cliente", () => {
    const cajero = store.operators.find((o) => o.id === ids.cajeroId)!;
    const customer = store.createCustomer(ids.tenantId, cajero, {
      name: "Cliente Demo",
      phone: "04141234567",
      document: "V123",
    });
    expect(customer.phone).toBe("04141234567");
  });

  it("crea venta con snapshot y descuenta stock del depósito del cajero", () => {
    const admin = store.operators.find((o) => o.id === ids.adminId)!;
    const cajero = store.operators.find((o) => o.id === ids.cajeroId)!;
    const product = store.createProduct(ids.tenantId, admin, { name: "Cerveza" });
    const presentation = store.createPresentation(admin, product.id, {
      name: "Caja x24",
      unitsPerPresentation: 24,
      priceUsd: 20,
      priceBs: 800,
    });
    store.setStock(admin, ids.whA, product.id, 100);

    const sale = store.createSale(cajero, {
      warehouseId: ids.whA,
      lines: [{ presentationId: presentation.id, qty: 1 }],
    });

    expect(sale.lines[0].unitPriceUsd).toBe(20);
    expect(sale.lines[0].unitPriceBs).toBe(800);
    expect(sale.lines[0].qtyBase).toBe(24);
    expect(store.getStock(ids.whA, product.id)).toBe(76);
    expect(store.getStock(ids.whB, product.id)).toBe(0);
  });

  it("rechaza venta cruzando depósitos", () => {
    const admin = store.operators.find((o) => o.id === ids.adminId)!;
    const cajero = store.operators.find((o) => o.id === ids.cajeroId)!;
    const product = store.createProduct(ids.tenantId, admin, { name: "Gin" });
    const presentation = store.createPresentation(admin, product.id, {
      name: "Unidad",
      unitsPerPresentation: 1,
      priceUsd: 5,
      priceBs: 200,
    });
    store.setStock(admin, ids.whB, product.id, 10);
    expect(() =>
      store.createSale(cajero, {
        warehouseId: ids.whB,
        lines: [{ presentationId: presentation.id, qty: 1 }],
      }),
    ).toThrow(ForbiddenError);
  });

  it("registra auditoría en operaciones sensibles", () => {
    const admin = store.operators.find((o) => o.id === ids.adminId)!;
    store.createProduct(ids.tenantId, admin, { name: "Audit Prod" });
    expect(store.audits.some((a) => a.entity === "product")).toBe(true);
  });
});
