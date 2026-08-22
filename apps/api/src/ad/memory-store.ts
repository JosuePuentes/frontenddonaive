/**
 * Store en memoria para pruebas de dominio A&D (sin PostgreSQL).
 * Replica las reglas mínimas de Fase 1 que luego usará Prisma.
 */

import { randomUUID } from "node:crypto";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors/app-error.js";
import {
  assertSameWarehouseSale,
  resolveRolePermissions,
  type AdOperatorAuth,
} from "./authorization.js";
import { hashPassword, verifyPassword } from "./password.js";
import type { AdOperatorRoleName, AdPermission } from "./permissions.js";
import {
  buildSaleLineSnapshots,
  sumSaleTotals,
  type SaleLineInput,
} from "./sales-domain.js";

export type MemTenant = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
};

export type MemWarehouse = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  active: boolean;
};

export type MemOperator = AdOperatorAuth & {
  passwordHash: string | null;
};

export type MemProduct = {
  id: string;
  tenantId: string;
  name: string;
  baseUnitLabel: string;
  active: boolean;
};

export type MemPresentation = {
  id: string;
  productId: string;
  name: string;
  unitsPerPresentation: number;
  priceUsd: number;
  priceBs: number;
  active: boolean;
};

export type MemStock = {
  warehouseId: string;
  productId: string;
  qtyBase: number;
};

export type MemCustomer = {
  id: string;
  tenantId: string;
  name: string;
  document: string | null;
  phone: string;
  active: boolean;
};

export type MemSale = {
  id: string;
  tenantId: string;
  warehouseId: string;
  operatorId: string;
  customerId: string | null;
  receiptNumber: string;
  status: "completed";
  totalUsd: number;
  totalBs: number;
  lines: ReturnType<typeof buildSaleLineSnapshots>;
};

export type MemAudit = {
  id: string;
  tenantId: string;
  operatorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  detail?: string;
  before?: unknown;
  after?: unknown;
  createdAt: Date;
};

export class AdMemoryStore {
  tenants: MemTenant[] = [];
  warehouses: MemWarehouse[] = [];
  operators: MemOperator[] = [];
  products: MemProduct[] = [];
  presentations: MemPresentation[] = [];
  stocks: MemStock[] = [];
  customers: MemCustomer[] = [];
  sales: MemSale[] = [];
  audits: MemAudit[] = [];
  receiptSeq = 1;

  seedDemo() {
    const tenantId = randomUUID();
    const projectId = randomUUID();
    this.tenants.push({
      id: tenantId,
      projectId,
      name: "A&D Demo",
      slug: "ad-demo",
    });

    const whA = randomUUID();
    const whB = randomUUID();
    this.warehouses.push(
      {
        id: whA,
        tenantId,
        name: "Licorería",
        code: "LIC",
        active: true,
      },
      {
        id: whB,
        tenantId,
        name: "Bodegón",
        code: "BOD",
        active: true,
      },
    );

    const adminId = randomUUID();
    const cajeroId = randomUUID();
    this.operators.push(
      {
        id: adminId,
        tenantId,
        userId: "user-admin",
        username: "admin",
        name: "Admin A&D",
        role: "admin",
        active: true,
        warehouseId: null,
        permissions: [],
        passwordHash: hashPassword("admin123"),
      },
      {
        id: cajeroId,
        tenantId,
        userId: "user-cajero",
        username: "cajero1",
        name: "Cajero 1",
        role: "cajero",
        active: true,
        warehouseId: whA,
        permissions: [],
        passwordHash: hashPassword("cajero123"),
      },
    );

    return { tenantId, projectId, whA, whB, adminId, cajeroId };
  }

  private audit(
    tenantId: string,
    operatorId: string | null,
    action: string,
    entity: string,
    entityId: string | null,
    detail?: string,
    before?: unknown,
    after?: unknown,
  ) {
    this.audits.push({
      id: randomUUID(),
      tenantId,
      operatorId,
      action,
      entity,
      entityId,
      detail,
      before,
      after,
      createdAt: new Date(),
    });
  }

  authenticateOperator(
    tenantId: string,
    username: string,
    password: string,
  ): MemOperator {
    const op = this.operators.find(
      (o) => o.tenantId === tenantId && o.username === username && o.active,
    );
    if (!op || !op.passwordHash || !verifyPassword(password, op.passwordHash)) {
      throw new ForbiddenError("Credenciales A&D inválidas");
    }
    return op;
  }

  getContext(operatorId: string) {
    const operator = this.operators.find((o) => o.id === operatorId);
    if (!operator || !operator.active) {
      throw new ForbiddenError("Operador A&D no encontrado o inactivo");
    }
    const permissions = resolveRolePermissions(
      operator.role,
      operator.permissions,
    );
    return {
      tenantId: operator.tenantId,
      operator,
      warehouseId: operator.warehouseId,
      permissions,
    };
  }

  createWarehouse(
    tenantId: string,
    actor: MemOperator,
    input: { name: string; code: string },
  ) {
    const perms = resolveRolePermissions(actor.role, actor.permissions);
    if (actor.role !== "admin" && !perms.has("deposits.manage")) {
      throw new ForbiddenError("Permiso deposits.manage requerido");
    }
    const warehouse: MemWarehouse = {
      id: randomUUID(),
      tenantId,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      active: true,
    };
    this.warehouses.push(warehouse);
    this.audit(tenantId, actor.id, "create", "warehouse", warehouse.id);
    return warehouse;
  }

  createProduct(
    tenantId: string,
    actor: MemOperator,
    input: { name: string; baseUnitLabel?: string },
  ) {
    const perms = resolveRolePermissions(actor.role, actor.permissions);
    if (actor.role !== "admin" && !perms.has("settings.manage")) {
      throw new ForbiddenError("Permiso settings.manage requerido");
    }
    const product: MemProduct = {
      id: randomUUID(),
      tenantId,
      name: input.name.trim(),
      baseUnitLabel: input.baseUnitLabel ?? "u",
      active: true,
    };
    this.products.push(product);
    this.audit(tenantId, actor.id, "create", "product", product.id, product.name);
    return product;
  }

  createPresentation(
    actor: MemOperator,
    productId: string,
    input: {
      name: string;
      unitsPerPresentation: number;
      priceUsd: number;
      priceBs: number;
    },
  ) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) throw new NotFoundError("Producto no encontrado");
    if (!(input.unitsPerPresentation > 0)) {
      throw new ValidationError("unitsPerPresentation debe ser > 0");
    }
    const presentation: MemPresentation = {
      id: randomUUID(),
      productId,
      name: input.name.trim(),
      unitsPerPresentation: input.unitsPerPresentation,
      priceUsd: input.priceUsd,
      priceBs: input.priceBs,
      active: true,
    };
    this.presentations.push(presentation);
    this.audit(
      product.tenantId,
      actor.id,
      "create",
      "presentation",
      presentation.id,
    );
    return presentation;
  }

  setStock(
    actor: MemOperator,
    warehouseId: string,
    productId: string,
    qtyBase: number,
  ) {
    const warehouse = this.warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) throw new NotFoundError("Depósito no encontrado");
    if (actor.role === "cajero" || actor.role === "mesonera") {
      if (actor.warehouseId !== warehouseId) {
        throw new ForbiddenError("Aislamiento por depósito");
      }
    }
    const existing = this.stocks.find(
      (s) => s.warehouseId === warehouseId && s.productId === productId,
    );
    if (existing) {
      existing.qtyBase = qtyBase;
    } else {
      this.stocks.push({ warehouseId, productId, qtyBase });
    }
    this.audit(warehouse.tenantId, actor.id, "set", "stock", productId, undefined, undefined, {
      warehouseId,
      qtyBase,
    });
    return this.stocks.find(
      (s) => s.warehouseId === warehouseId && s.productId === productId,
    )!;
  }

  getStock(warehouseId: string, productId: string): number {
    return (
      this.stocks.find(
        (s) => s.warehouseId === warehouseId && s.productId === productId,
      )?.qtyBase ?? 0
    );
  }

  createCustomer(
    tenantId: string,
    actor: MemOperator,
    input: { name: string; phone: string; document?: string },
  ) {
    const perms = resolveRolePermissions(actor.role, actor.permissions);
    if (actor.role !== "admin" && !perms.has("clients.read")) {
      throw new ForbiddenError("Permiso clients.read requerido");
    }
    const customer: MemCustomer = {
      id: randomUUID(),
      tenantId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      document: input.document?.trim() ?? null,
      active: true,
    };
    this.customers.push(customer);
    this.audit(tenantId, actor.id, "create", "customer", customer.id);
    return customer;
  }

  createSale(
    actor: MemOperator,
    input: {
      warehouseId: string;
      customerId?: string;
      lines: SaleLineInput[];
    },
  ) {
    const perms = resolveRolePermissions(actor.role, actor.permissions);
    if (actor.role !== "admin" && !perms.has("pos.sell")) {
      throw new ForbiddenError("Permiso pos.sell requerido");
    }

    assertSameWarehouseSale(actor, input.warehouseId);

    const presentationMap = new Map(
      this.presentations.map((p) => [
        p.id,
        {
          id: p.id,
          productId: p.productId,
          unitsPerPresentation: p.unitsPerPresentation,
          priceUsd: p.priceUsd,
          priceBs: p.priceBs,
          active: p.active,
        },
      ]),
    );

    const lines = buildSaleLineSnapshots(input.lines, presentationMap);
    const totals = sumSaleTotals(lines);

    for (const line of lines) {
      const stock = this.getStock(input.warehouseId, line.productId);
      if (stock < line.qtyBase) {
        throw new ValidationError(
          `Stock insuficiente para producto ${line.productId}`,
        );
      }
    }

    for (const line of lines) {
      const row = this.stocks.find(
        (s) =>
          s.warehouseId === input.warehouseId && s.productId === line.productId,
      );
      if (row) row.qtyBase -= line.qtyBase;
    }

    const sale: MemSale = {
      id: randomUUID(),
      tenantId: actor.tenantId,
      warehouseId: input.warehouseId,
      operatorId: actor.id,
      customerId: input.customerId ?? null,
      receiptNumber: `AD-${String(this.receiptSeq++).padStart(6, "0")}`,
      status: "completed",
      totalUsd: totals.totalUsd,
      totalBs: totals.totalBs,
      lines,
    };
    this.sales.push(sale);
    this.audit(actor.tenantId, actor.id, "create", "sale", sale.id, sale.receiptNumber, undefined, {
      totalUsd: sale.totalUsd,
      totalBs: sale.totalBs,
      lines: sale.lines,
    });
    return sale;
  }
}

export function roleNeedsWarehouse(role: AdOperatorRoleName): boolean {
  return role === "cajero" || role === "mesonera";
}

export function operatorHasPermission(
  operator: AdOperatorAuth,
  permission: AdPermission,
): boolean {
  if (operator.role === "admin") return true;
  return resolveRolePermissions(operator.role, operator.permissions).has(
    permission,
  );
}
