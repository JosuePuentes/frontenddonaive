/**
 * Motor operativo A&D Fase 2 (in-memory) — reglas de negocio + concurrencia simulada.
 * Usado por tests y como referencia de comportamiento para el servicio Prisma.
 */
import { randomBytes, randomUUID } from "node:crypto";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/app-error.js";
import {
  assertSameWarehouseSale,
  resolveRolePermissions,
  type AdOperatorAuth,
} from "./authorization.js";
import {
  computeOperationalAvailability,
  normalizePhone,
  todayPeriodBounds,
  weightedAverageCost,
} from "./availability.js";
import { hashPassword } from "./password.js";
import type { AdPermission } from "./permissions.js";

function opaqueToken(): string {
  return `ad_qr_${randomBytes(18).toString("hex")}`;
}

type Line = {
  id: string;
  productId: string;
  presentationId: string;
  qtyOrdered: number;
  qtyServed: number;
  unitPriceUsd: number;
  unitPriceBs: number;
};

type Account = {
  id: string;
  tenantId: string;
  warehouseId: string;
  tableId: string | null;
  mesoneraId: string | null;
  openedById: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  accountNumber: number;
  status: string;
  lines: Line[];
  payments: {
    id: string;
    method: string;
    currency: "USD" | "BS";
    amount: number;
  }[];
  closedAt?: string;
};

type PrepaidItem = {
  id: string;
  productId: string;
  presentationId: string;
  qtyPurchased: number;
  qtyConsumed: number;
  unitPriceUsd: number;
  unitPriceBs: number;
  qtyBasePerUnit: number;
};

type Prepaid = {
  id: string;
  tenantId: string;
  customerId: string;
  warehouseId: string;
  qrToken: string;
  code: string;
  status: "ACTIVE" | "PARTIAL" | "DEPLETED" | "VOIDED";
  customerPhone: string;
  customerDocument: string;
  sourceAccountId: string | null;
  version: number;
  items: PrepaidItem[];
  locked?: boolean;
};

export class AdOpsEngine {
  tenantId = "";
  timezone = "America/Caracas";
  warehouses: { id: string; code: string; name: string }[] = [];
  operators: (AdOperatorAuth & { passwordHash: string | null })[] = [];
  products: {
    id: string;
    name: string;
    avgCostUsd: number;
    avgCostBs: number;
  }[] = [];
  presentations: {
    id: string;
    productId: string;
    name: string;
    unitsPerPresentation: number;
    priceUsd: number;
    priceBs: number;
    active: boolean;
  }[] = [];
  stocks = new Map<string, number>(); // `${wh}:${product}`
  stockLocks = new Set<string>();
  accounts: Account[] = [];
  accountSeq = 1;
  customers: {
    id: string;
    name: string;
    phone: string;
    document: string;
  }[] = [];
  prepaids: Prepaid[] = [];
  prepaidSeq = 1;
  commitments: {
    id: string;
    customerId: string | null;
    accountId: string;
    productId: string;
    presentationId: string;
    qtyRemaining: number;
    qtyBaseRemaining: number;
    status: string;
    blocksSales: boolean;
  }[] = [];
  transfers: {
    id: string;
    documentNumber: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    status: string;
    stockMoved: boolean;
    createdById: string;
    receivedById?: string;
    lines: {
      productId: string;
      presentationId: string;
      qty: number;
      qtyBase: number;
    }[];
  }[] = [];
  transferSeq = 1;
  purchases: {
    id: string;
    warehouseId: string;
    supplierName: string;
    invoiceNumber: string;
    status: string;
    lines: {
      productId: string;
      presentationId: string;
      qty: number;
      qtyBase: number;
      unitCostUsd: number;
      unitCostBs: number;
    }[];
  }[] = [];
  purchaseRequests: {
    id: string;
    productId: string;
    warehouseId: string | null;
    qtyBaseNeeded: number;
    status: string;
  }[] = [];
  cashClosures: unknown[] = [];
  invClosures: unknown[] = [];
  audits: {
    action: string;
    entity: string;
    entityId: string | null;
    before?: unknown;
    after?: unknown;
    operatorId: string | null;
  }[] = [];
  sales: {
    id: string;
    warehouseId: string;
    productId: string;
    qtyBase: number;
    unitPriceUsd: number;
    unitPriceBs: number;
  }[] = [];

  seed() {
    this.tenantId = randomUUID();
    const whA = randomUUID();
    const whB = randomUUID();
    this.warehouses = [
      { id: whA, code: "LIC", name: "Licorería" },
      { id: whB, code: "BOD", name: "Bodegón" },
    ];
    const adminId = randomUUID();
    const mesoneraId = randomUUID();
    const cajeroId = randomUUID();
    this.operators = [
      {
        id: adminId,
        tenantId: this.tenantId,
        userId: "u-admin",
        username: "admin",
        name: "Admin",
        role: "admin",
        active: true,
        warehouseId: null,
        permissions: [],
        passwordHash: hashPassword("admin123"),
      },
      {
        id: mesoneraId,
        tenantId: this.tenantId,
        userId: "u-mes",
        username: "mes1",
        name: "Mesonera 1",
        role: "mesonera",
        active: true,
        warehouseId: whA,
        permissions: [],
        passwordHash: hashPassword("mes12345"),
      },
      {
        id: cajeroId,
        tenantId: this.tenantId,
        userId: "u-caj",
        username: "caj1",
        name: "Cajero 1",
        role: "cajero",
        active: true,
        warehouseId: whA,
        permissions: [],
        passwordHash: hashPassword("caj12345"),
      },
    ];
    return { tenantId: this.tenantId, whA, whB, adminId, mesoneraId, cajeroId };
  }

  private stockKey(wh: string, productId: string) {
    return `${wh}:${productId}`;
  }

  getStock(wh: string, productId: string) {
    return this.stocks.get(this.stockKey(wh, productId)) ?? 0;
  }

  getTotalStock(productId: string) {
    let total = 0;
    for (const [key, qty] of this.stocks) {
      if (key.endsWith(`:${productId}`)) total += qty;
    }
    return total;
  }

  private setStock(wh: string, productId: string, qty: number) {
    this.stocks.set(this.stockKey(wh, productId), qty);
  }

  private audit(
    operatorId: string | null,
    action: string,
    entity: string,
    entityId: string | null,
    before?: unknown,
    after?: unknown,
  ) {
    this.audits.push({ action, entity, entityId, before, after, operatorId });
  }

  private requirePerm(op: AdOperatorAuth, perm: AdPermission) {
    if (op.role === "admin") return;
    const set = resolveRolePermissions(op.role, op.permissions);
    if (!set.has(perm)) throw new ForbiddenError(`Permiso requerido: ${perm}`);
  }

  private op(id: string) {
    const o = this.operators.find((x) => x.id === id);
    if (!o?.active) throw new ForbiddenError("Operador inválido");
    return o;
  }

  createProduct(adminId: string, name: string) {
    const admin = this.op(adminId);
    this.requirePerm(admin, "settings.manage");
    const id = randomUUID();
    this.products.push({ id, name, avgCostUsd: 0, avgCostBs: 0 });
    this.audit(adminId, "create", "product", id, undefined, { name });
    return id;
  }

  createPresentation(
    adminId: string,
    productId: string,
    input: {
      name: string;
      unitsPerPresentation: number;
      priceUsd: number;
      priceBs: number;
    },
  ) {
    const id = randomUUID();
    this.presentations.push({
      id,
      productId,
      name: input.name,
      unitsPerPresentation: input.unitsPerPresentation,
      priceUsd: input.priceUsd,
      priceBs: input.priceBs,
      active: true,
    });
    this.audit(adminId, "create", "presentation", id);
    return id;
  }

  setStockQty(adminId: string, wh: string, productId: string, qty: number) {
    const before = this.getStock(wh, productId);
    this.setStock(wh, productId, qty);
    this.audit(adminId, "set", "stock", productId, { before }, { qty, wh });
  }

  createCustomer(
    opId: string,
    input: { name: string; phone: string; document: string },
  ) {
    const id = randomUUID();
    this.customers.push({ id, ...input });
    this.audit(opId, "create", "customer", id);
    return id;
  }

  createAccount(input: {
    operatorId: string;
    warehouseId?: string;
    tableId?: string;
    mesoneraId?: string;
    customerId?: string;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "accounts.open");
    let warehouseId = input.warehouseId ?? op.warehouseId;
    if (op.role === "mesonera" || op.role === "cajero") {
      if (!op.warehouseId) throw new ValidationError("Depósito requerido");
      if (input.warehouseId && input.warehouseId !== op.warehouseId) {
        throw new ForbiddenError("No se permite cruzar depósitos");
      }
      warehouseId = op.warehouseId;
    }
    if (!warehouseId) throw new ValidationError("Depósito requerido");

    const customer = input.customerId
      ? this.customers.find((c) => c.id === input.customerId)
      : undefined;
    const account: Account = {
      id: randomUUID(),
      tenantId: this.tenantId,
      warehouseId,
      tableId: input.tableId ?? null,
      mesoneraId: input.mesoneraId ?? (op.role === "mesonera" ? op.id : null),
      openedById: op.id,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
      customerPhone: customer?.phone ?? null,
      accountNumber: this.accountSeq++,
      status: "ABIERTA",
      lines: [],
      payments: [],
    };
    this.accounts.push(account);
    this.audit(op.id, "create", "account", account.id, undefined, {
      warehouseId,
      accountNumber: account.accountNumber,
    });
    return account;
  }

  addAccountItem(input: {
    operatorId: string;
    accountId: string;
    presentationId: string;
    qty: number;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "accounts.open");
    const account = this.accounts.find((a) => a.id === input.accountId);
    if (!account) throw new NotFoundError("Cuenta no encontrada");
    if (account.status === "CERRADA" || account.status === "ANULADA") {
      throw new ValidationError("Cuenta cerrada/anulada");
    }
    if (op.role === "mesonera") {
      if (account.warehouseId !== op.warehouseId) {
        throw new ForbiddenError("Depósito ajeno");
      }
      if (account.mesoneraId && account.mesoneraId !== op.id) {
        throw new ForbiddenError("Cuenta de otra mesonera");
      }
    }
    const pres = this.presentations.find((p) => p.id === input.presentationId);
    if (!pres?.active) throw new ValidationError("Presentación inválida");
    if (!(input.qty > 0)) throw new ValidationError("Cantidad inválida");

    const line: Line = {
      id: randomUUID(),
      productId: pres.productId,
      presentationId: pres.id,
      qtyOrdered: input.qty,
      qtyServed: 0,
      unitPriceUsd: pres.priceUsd,
      unitPriceBs: pres.priceBs,
    };
    account.lines.push(line);
    // PEDIR no descuenta inventario
    this.audit(op.id, "add_item", "account", account.id, undefined, line);
    return line;
  }

  serveAccountItem(input: {
    operatorId: string;
    accountId: string;
    itemId: string;
    qty: number;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "accounts.serve");
    const account = this.accounts.find((a) => a.id === input.accountId);
    if (!account) throw new NotFoundError("Cuenta no encontrada");
    if (account.status === "CERRADA" || account.status === "ANULADA") {
      throw new ValidationError("Cuenta cerrada");
    }
    if (op.role === "mesonera" && account.warehouseId !== op.warehouseId) {
      throw new ForbiddenError("Depósito ajeno");
    }
    const line = account.lines.find((l) => l.id === input.itemId);
    if (!line) throw new NotFoundError("Ítem no encontrado");
    const pending = line.qtyOrdered - line.qtyServed;
    if (!(input.qty > 0) || input.qty > pending) {
      throw new ValidationError(`Solo hay ${pending} pendientes de servir`);
    }
    const pres = this.presentations.find((p) => p.id === line.presentationId)!;
    const qtyBase = input.qty * pres.unitsPerPresentation;
    const lockKey = this.stockKey(account.warehouseId, line.productId);
    if (this.stockLocks.has(lockKey)) {
      throw new ValidationError("Operación concurrente en stock; reintente");
    }
    this.stockLocks.add(lockKey);
    try {
      const physical = this.getStock(account.warehouseId, line.productId);
      if (physical < qtyBase) {
        throw new ValidationError("Stock físico insuficiente para servir");
      }
      this.setStock(account.warehouseId, line.productId, physical - qtyBase);
      line.qtyServed += input.qty;
      this.audit(
        op.id,
        "serve",
        "account",
        account.id,
        { qtyServed: line.qtyServed - input.qty },
        { qtyServed: line.qtyServed, qtyBase },
      );
    } finally {
      this.stockLocks.delete(lockKey);
    }
    return {
      requested: line.qtyOrdered,
      served: line.qtyServed,
      pending: line.qtyOrdered - line.qtyServed,
    };
  }

  voidAccount(input: {
    operatorId: string;
    accountId: string;
    reason: string;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "pos.refund");
    const account = this.accounts.find((a) => a.id === input.accountId);
    if (!account) throw new NotFoundError("Cuenta no encontrada");
    if (account.status === "ANULADA") {
      throw new ValidationError("Ya anulada");
    }
    const before = structuredClone(account);
    for (const line of account.lines) {
      if (line.qtyServed <= 0) continue;
      const pres = this.presentations.find((p) => p.id === line.presentationId)!;
      const qtyBase = line.qtyServed * pres.unitsPerPresentation;
      this.setStock(
        account.warehouseId,
        line.productId,
        this.getStock(account.warehouseId, line.productId) + qtyBase,
      );
    }
    account.status = "ANULADA";
    this.audit(op.id, "void", "account", account.id, before, {
      status: "ANULADA",
      reason: input.reason,
    });
    return account;
  }

  closeAccount(input: {
    operatorId: string;
    accountId: string;
    settlePendingAs?: "commitment" | "prepaid";
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "pos.close_account");
    const account = this.accounts.find((a) => a.id === input.accountId);
    if (!account) throw new NotFoundError("Cuenta no encontrada");
    const settle = input.settlePendingAs ?? "commitment";
    const pending = account.lines
      .map((l) => ({
        line: l,
        remaining: Math.max(0, l.qtyOrdered - l.qtyServed),
      }))
      .filter((x) => x.remaining > 0);

    let prepaidId: string | undefined;
    if (settle === "prepaid" && pending.length) {
      if (!account.customerId) {
        throw new ValidationError("Cliente requerido para prepago");
      }
      const pp = this.createPrepaid({
        operatorId: op.id,
        customerId: account.customerId,
        warehouseId: account.warehouseId,
        items: pending.map((p) => ({
          presentationId: p.line.presentationId,
          qty: p.remaining,
        })),
        sourceAccountId: account.id,
      });
      prepaidId = pp.id;
    } else {
      for (const p of pending) {
        const pres = this.presentations.find(
          (x) => x.id === p.line.presentationId,
        )!;
        this.commitments.push({
          id: randomUUID(),
          customerId: account.customerId,
          accountId: account.id,
          productId: p.line.productId,
          presentationId: p.line.presentationId,
          qtyRemaining: p.remaining,
          qtyBaseRemaining: p.remaining * pres.unitsPerPresentation,
          status: "PENDIENTE",
          blocksSales: false,
        });
      }
    }
    account.status = "CERRADA";
    account.closedAt = new Date().toISOString();
    this.audit(op.id, "close", "account", account.id, undefined, {
      settle,
      prepaidId,
      pendingCount: pending.length,
    });
    return { account, prepaidId };
  }

  availability(productId: string, preferredWarehouseId: string, requestedBase = 0) {
    return computeOperationalAvailability({
      productId,
      stocks: [...this.stocks.entries()].map(([k, qtyBase]) => {
        const [warehouseId, pid] = k.split(":");
        return { warehouseId, productId: pid, qtyBase };
      }),
      accounts: this.accounts.map((a) => ({
        status: a.status,
        warehouseId: a.warehouseId,
        lines: a.lines,
      })),
      presentations: this.presentations,
      transfers: this.transfers,
      commitments: this.commitments,
      warehouseIds: this.warehouses.map((w) => w.id),
      preferredWarehouseId,
      requestedBase,
    });
  }

  /** Venta POS física: NO bloqueada por compromiso; solo por stock físico. */
  sellPhysical(input: {
    operatorId: string;
    warehouseId: string;
    presentationId: string;
    qty: number;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "pos.sell");
    assertSameWarehouseSale(op, input.warehouseId);
    const pres = this.presentations.find((p) => p.id === input.presentationId)!;
    const qtyBase = input.qty * pres.unitsPerPresentation;
    const physical = this.getStock(input.warehouseId, pres.productId);
    if (physical < qtyBase) throw new ValidationError("Stock físico insuficiente");
    this.setStock(input.warehouseId, pres.productId, physical - qtyBase);
    const sale = {
      id: randomUUID(),
      warehouseId: input.warehouseId,
      productId: pres.productId,
      qtyBase,
      unitPriceUsd: pres.priceUsd,
      unitPriceBs: pres.priceBs,
    };
    this.sales.push(sale);
    this.audit(op.id, "create", "sale", sale.id, undefined, sale);
    return sale;
  }

  createPrepaid(input: {
    operatorId: string;
    customerId: string;
    warehouseId: string;
    items: { presentationId: string; qty: number }[];
    sourceAccountId?: string;
  }) {
    const op = this.op(input.operatorId);
    const customer = this.customers.find((c) => c.id === input.customerId);
    if (!customer) throw new NotFoundError("Cliente no encontrado");
    if (!customer.document?.trim()) {
      throw new ValidationError("Cédula del cliente obligatoria para QR");
    }
    const items: PrepaidItem[] = input.items.map((it) => {
      const pres = this.presentations.find((p) => p.id === it.presentationId)!;
      return {
        id: randomUUID(),
        productId: pres.productId,
        presentationId: pres.id,
        qtyPurchased: it.qty,
        qtyConsumed: 0,
        unitPriceUsd: pres.priceUsd,
        unitPriceBs: pres.priceBs,
        qtyBasePerUnit: pres.unitsPerPresentation,
      };
    });
    // F2: crear prepago NO descuenta stock físico (sí al consumir).
    const prepaid: Prepaid = {
      id: randomUUID(),
      tenantId: this.tenantId,
      customerId: customer.id,
      warehouseId: input.warehouseId,
      qrToken: opaqueToken(),
      code: `PRE-2026-${String(this.prepaidSeq++).padStart(6, "0")}`,
      status: "ACTIVE",
      customerPhone: customer.phone,
      customerDocument: customer.document,
      sourceAccountId: input.sourceAccountId ?? null,
      version: 0,
      items,
    };
    this.prepaids.push(prepaid);
    this.audit(op.id, "create", "prepaid", prepaid.id, undefined, {
      code: prepaid.code,
      qrOpaque: true,
      stockDeductedOnCreate: false,
    });
    return prepaid;
  }

  consumePrepaid(input: {
    operatorId: string;
    prepaidId: string;
    presentationId: string;
    qty: number;
    verifyPhone: string;
    verifyDocument: string;
  }) {
    const op = this.op(input.operatorId);
    const prepaid = this.prepaids.find((p) => p.id === input.prepaidId);
    if (!prepaid || prepaid.status === "VOIDED" || prepaid.status === "DEPLETED") {
      throw new ValidationError("Prepago no consumible");
    }
    if (prepaid.locked) {
      throw new ValidationError("Consumo en curso; evite doble uso");
    }
    prepaid.locked = true;
    try {
      if (
        normalizePhone(input.verifyPhone) !==
        normalizePhone(prepaid.customerPhone)
      ) {
        throw new ForbiddenError("Teléfono no coincide con el titular");
      }
      if (
        input.verifyDocument.trim().toLowerCase() !==
        prepaid.customerDocument.trim().toLowerCase()
      ) {
        throw new ForbiddenError("Cédula no coincide con el titular");
      }
      const item = prepaid.items.find(
        (i) => i.presentationId === input.presentationId,
      );
      if (!item) throw new ValidationError("Producto no está en el prepago");
      const available = item.qtyPurchased - item.qtyConsumed;
      if (!(input.qty > 0) || input.qty > available) {
        throw new ValidationError(`Disponibles: ${available}`);
      }
      const versionAtStart = prepaid.version;
      const qtyBase = input.qty * item.qtyBasePerUnit;
      const physical = this.getStock(prepaid.warehouseId, item.productId);
      if (physical < qtyBase) {
        throw new ValidationError("Stock físico insuficiente para consumo");
      }
      // Optimistic lock
      if (prepaid.version !== versionAtStart) {
        throw new ValidationError("Conflicto de concurrencia en prepago");
      }
      prepaid.version += 1;
      item.qtyConsumed += input.qty;
      this.setStock(prepaid.warehouseId, item.productId, physical - qtyBase);
      const remainingAll = prepaid.items.every(
        (i) => i.qtyPurchased - i.qtyConsumed <= 0,
      );
      prepaid.status = remainingAll
        ? "DEPLETED"
        : item.qtyConsumed > 0
          ? "PARTIAL"
          : "ACTIVE";
      this.audit(
        op.id,
        "consume",
        "prepaid",
        prepaid.id,
        { available },
        { consumed: input.qty, remaining: available - input.qty },
      );
      return {
        remaining: item.qtyPurchased - item.qtyConsumed,
        status: prepaid.status,
      };
    } finally {
      prepaid.locked = false;
    }
  }

  /** Simula dos consumos concurrentes del mismo QR. */
  async consumePrepaidConcurrent(
    a: Parameters<AdOpsEngine["consumePrepaid"]>[0],
    b: Parameters<AdOpsEngine["consumePrepaid"]>[0],
  ) {
    const results = await Promise.allSettled([
      Promise.resolve().then(() => this.consumePrepaid(a)),
      Promise.resolve().then(() => this.consumePrepaid(b)),
    ]);
    return results;
  }

  createPurchase(input: {
    operatorId: string;
    warehouseId: string;
    supplierName: string;
    invoiceNumber: string;
    lines: {
      presentationId: string;
      qty: number;
      unitCostUsd: number;
      unitCostBs: number;
    }[];
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "purchase.create");
    if (!input.warehouseId) throw new ValidationError("Depósito destino obligatorio");
    const purchase = {
      id: randomUUID(),
      warehouseId: input.warehouseId,
      supplierName: input.supplierName,
      invoiceNumber: input.invoiceNumber,
      status: "ORDERED",
      lines: input.lines.map((l) => {
        const pres = this.presentations.find((p) => p.id === l.presentationId)!;
        return {
          productId: pres.productId,
          presentationId: pres.id,
          qty: l.qty,
          qtyBase: l.qty * pres.unitsPerPresentation,
          unitCostUsd: l.unitCostUsd,
          unitCostBs: l.unitCostBs,
        };
      }),
    };
    this.purchases.push(purchase);
    this.audit(op.id, "create", "purchase", purchase.id);
    return purchase;
  }

  receivePurchase(input: { operatorId: string; purchaseId: string }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "inventory.receive");
    const purchase = this.purchases.find((p) => p.id === input.purchaseId);
    if (!purchase) throw new NotFoundError("Compra no encontrada");
    if (purchase.status === "RECEIVED") {
      throw new ValidationError("Compra ya recibida (no duplicar)");
    }
    if (purchase.status === "CANCELLED") {
      throw new ValidationError("Compra cancelada");
    }
    for (const line of purchase.lines) {
      const product = this.products.find((p) => p.id === line.productId)!;
      const warehouseQty = this.getStock(purchase.warehouseId, line.productId);
      const prevQty = this.getTotalStock(line.productId);
      product.avgCostUsd = weightedAverageCost(
        prevQty,
        product.avgCostUsd,
        line.qtyBase,
        line.unitCostUsd,
      );
      product.avgCostBs = weightedAverageCost(
        prevQty,
        product.avgCostBs,
        line.qtyBase,
        line.unitCostBs,
      );
      this.setStock(
        purchase.warehouseId,
        line.productId,
        warehouseQty + line.qtyBase,
      );
    }
    purchase.status = "RECEIVED";
    this.audit(op.id, "receive", "purchase", purchase.id);
    return purchase;
  }

  createTransfer(input: {
    operatorId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    lines: { presentationId: string; qty: number }[];
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "inventory.transfer");
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new ValidationError("Origen y destino deben ser distintos");
    }
    const transfer = {
      id: randomUUID(),
      documentNumber: `TR-DRAFT-${this.transferSeq++}`,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      status: "DRAFT",
      stockMoved: false,
      createdById: op.id,
      lines: input.lines.map((l) => {
        const pres = this.presentations.find((p) => p.id === l.presentationId)!;
        return {
          productId: pres.productId,
          presentationId: pres.id,
          qty: l.qty,
          qtyBase: l.qty * pres.unitsPerPresentation,
        };
      }),
    };
    this.transfers.push(transfer);
    this.audit(op.id, "create", "transfer", transfer.id);
    return transfer;
  }

  /** Flujo atómico v1: DRAFT → RECEIVED (salida+entrada). */
  confirmTransferAtomic(input: {
    operatorId: string;
    transferId: string;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "inventory.transfer");
    const tr = this.transfers.find((t) => t.id === input.transferId);
    if (!tr) throw new NotFoundError("Transferencia no encontrada");
    if (tr.stockMoved || tr.status === "RECEIVED") {
      throw new ValidationError("Transferencia ya confirmada (no duplicar)");
    }
    for (const line of tr.lines) {
      const stock = this.getStock(tr.fromWarehouseId, line.productId);
      if (stock < line.qtyBase) {
        throw new ValidationError("Stock insuficiente en origen");
      }
    }
    for (const line of tr.lines) {
      this.setStock(
        tr.fromWarehouseId,
        line.productId,
        this.getStock(tr.fromWarehouseId, line.productId) - line.qtyBase,
      );
      this.setStock(
        tr.toWarehouseId,
        line.productId,
        this.getStock(tr.toWarehouseId, line.productId) + line.qtyBase,
      );
    }
    tr.stockMoved = true;
    tr.status = "RECEIVED";
    tr.documentNumber = `TR-2026-${String(this.transferSeq++).padStart(4, "0")}`;
    tr.receivedById = op.id;
    this.audit(op.id, "confirm", "transfer", tr.id, { status: "DRAFT" }, {
      status: "RECEIVED",
      stockMoved: true,
    });
    return tr;
  }

  createPurchaseRequest(input: {
    operatorId: string;
    productId: string;
    qtyBaseNeeded: number;
    warehouseId?: string;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "cop.purchase_request");
    const req = {
      id: randomUUID(),
      productId: input.productId,
      warehouseId: input.warehouseId ?? null,
      qtyBaseNeeded: input.qtyBaseNeeded,
      status: "REQUESTED",
    };
    this.purchaseRequests.push(req);
    this.audit(op.id, "create", "purchase_request", req.id);
    return req;
  }

  createCashClosure(input: {
    operatorId: string;
    warehouseId: string;
    countedCashUsd: number;
    countedCashBs: number;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "closures.create");
    if (op.role === "cajero" && op.warehouseId !== input.warehouseId) {
      throw new ForbiddenError("Cajero no puede cerrar otro depósito");
    }
    const { periodStart, periodEnd, dateKey } = todayPeriodBounds(this.timezone);
    const expectedCashUsd = this.sales
      .filter((s) => s.warehouseId === input.warehouseId)
      .reduce((a, s) => a + s.unitPriceUsd, 0);
    const closure = {
      id: randomUUID(),
      warehouseId: input.warehouseId,
      operatorId: op.id,
      periodStart,
      periodEnd,
      dateKey,
      expectedCashUsd,
      expectedCashBs: 0,
      countedCashUsd: input.countedCashUsd,
      countedCashBs: input.countedCashBs,
      differenceUsd: input.countedCashUsd - expectedCashUsd,
      differenceBs: input.countedCashBs,
      status: "CLOSED",
    };
    this.cashClosures.push(closure);
    this.audit(op.id, "close", "cash_closure", closure.id, undefined, closure);
    return closure;
  }

  createInventoryClosure(input: {
    operatorId: string;
    warehouseId: string;
    lines: { productId: string; physicalBase: number }[];
    applyAdjustments?: boolean;
  }) {
    const op = this.op(input.operatorId);
    this.requirePerm(op, "closures.create");
    const lines = input.lines.map((l) => {
      const theoretical = this.getStock(input.warehouseId, l.productId);
      const difference = l.physicalBase - theoretical;
      if (input.applyAdjustments && difference !== 0) {
        this.setStock(input.warehouseId, l.productId, l.physicalBase);
      }
      return {
        productId: l.productId,
        theoreticalBase: theoretical,
        physicalBase: l.physicalBase,
        differenceBase: difference,
      };
    });
    const closure = {
      id: randomUUID(),
      warehouseId: input.warehouseId,
      operatorId: op.id,
      lines,
      status: "CLOSED",
    };
    this.invClosures.push(closure);
    this.audit(op.id, "close", "inventory_closure", closure.id, undefined, {
      lines: lines.length,
    });
    return closure;
  }
}
