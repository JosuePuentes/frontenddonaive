/**
 * Repository respaldado por API (Fase 3).
 * Mantiene caché local compatible con AdRepositoryState.
 * Mutaciones: API → rehydrate. Diseño web / TV siguen en capas MOCK locales.
 */
import { API_BASE_URL } from "@/config/api";
import { AD_DEFAULT_SITE_DESIGN } from "@/lib/ad-licoreria/site-design";
import { adDesignRepository } from "@/services/ad-licoreria/design/repository";
import { fulfillmentMessage } from "@/lib/ad-licoreria/operational-availability";
import { getOperationalAvailability } from "@/lib/ad-licoreria/operational-availability";
import {
  AD_DEFAULT_ROLE_PERMISSIONS,
  canAccessWarehouse,
  hasPermission,
} from "@/lib/ad-licoreria/access";
import type {
  AdAccount,
  AdCustomer,
  AdInventoryItem,
  AdOperator,
  AdPermission,
  AdPresentation,
  AdProduct,
  AdRole,
  AdWarehouse,
} from "@/types/ad-licoreria";
import {
  adLicoreriaRepository,
  type AdRepositoryState,
  type AdResult,
} from "./repository";
import { getAdSessionHeaders, loadAdSession } from "./session";

type Listener = () => void;

function emptyState(): AdRepositoryState {
  const published = adDesignRepository.getPublished();
  return {
    settings: {
      exchangeRateUsdToBs: 0,
      suggestBsFromRate: false,
      brandName: "A&D",
      brandTagline: "LICORERÍA & BODEGÓN",
      whatsappEnabled: false,
    },
    siteDesign: structuredClone(published ?? AD_DEFAULT_SITE_DESIGN),
    operators: [],
    categories: [],
    products: [],
    presentations: [],
    warehouses: [],
    inventory: [],
    movements: [],
    tables: [],
    accounts: [],
    prepaids: [],
    prepaidConsumptions: [],
    customers: [],
    sales: [],
    receipts: [],
    purchases: [],
    paymentMethods: adLicoreriaRepository.getPaymentMethods(),
    serviceLogs: [],
    dailyClosures: [],
    inventoryClosures: [],
    audit: [],
    whatsappLogs: [],
    stockTransfers: [],
    purchaseRequests: [],
    customerCommitments: [],
    invoiceDrafts: [],
    currentOperatorId: loadAdSession()?.operatorId ?? null,
    rolePermissionOverrides: {},
    accountSeq: 1,
    prepaidSeq: 1,
    receiptSeq: 1,
    purchaseSeq: 1,
    transferSeq: 1,
    purchaseRequestSeq: 1,
    invoiceDraftSeq: 1,
    warehouseSeq: 1,
  };
}

let state: AdRepositoryState = emptyState();
const listeners = new Set<Listener>();
let hydrating = false;

function emit() {
  for (const l of listeners) l();
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (v && typeof v === "object" && "toNumber" in v) {
    return Number((v as { toString: () => string }).toString());
  }
  return Number(v ?? 0);
}

async function apiJson<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<AdResult<T>> {
  if (!API_BASE_URL) {
    return { ok: false, error: "VITE_API_BASE_URL no configurada" };
  }
  const session = loadAdSession();
  if (!session) {
    return { ok: false, error: "Sesión A&D requerida (inicie sesión API)" };
  }
  try {
    const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getAdSessionHeaders(),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          (payload as { error?: { message?: string } })?.error?.message ??
          `HTTP ${res.status}`,
      };
    }
    return { ok: true, data: (payload as { data: T }).data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red",
    };
  }
}

function mapSnapshotToState(snap: Record<string, unknown>): AdRepositoryState {
  const next = emptyState();
  const session = loadAdSession();
  next.currentOperatorId = session?.operatorId ?? null;
  if (session) {
    next.settings = {
      ...next.settings,
      brandName: session.tenantName,
    };
  }

  const warehouses = (snap.warehouses as Record<string, unknown>[]) ?? [];
  next.warehouses = warehouses.map(
    (w): AdWarehouse => ({
      id: String(w.id),
      name: String(w.name),
      code: String(w.code),
      kind: String(w.code).includes("BOD") ? "principal" : "barra",
      active: Boolean(w.active),
    }),
  );

  const operators = (snap.operators as Record<string, unknown>[]) ?? [];
  next.operators = operators.map((o): AdOperator => {
    const perms = (
      (o.permissions as { permission: string }[] | undefined) ?? []
    ).map((p) => p.permission) as AdPermission[];
    return {
      id: String(o.id),
      username: String(o.username),
      name: String(o.name),
      role: o.role as AdRole,
      active: Boolean(o.active),
      warehouseId: (o.warehouseId as string | null) ?? null,
      customPermissions: perms.length ? perms : undefined,
      posEnabled: o.role === "cajero" || o.role === "admin",
      inventoryAccess: true,
      copAccess: true,
      purchaseAccess: true,
      closuresAccess: true,
    };
  });

  const products = (snap.products as Record<string, unknown>[]) ?? [];
  const presentations: AdPresentation[] = [];
  const categoriesMap = new Map<string, { id: string; name: string }>();
  next.products = products.map((p): AdProduct => {
    const cat = p.category as { id?: string; name?: string } | null;
    if (cat?.id) {
      categoriesMap.set(String(cat.id), {
        id: String(cat.id),
        name: String(cat.name ?? "Sin categoría"),
      });
    }
    const pres = (p.presentations as Record<string, unknown>[]) ?? [];
    for (const pr of pres) {
      presentations.push({
        id: String(pr.id),
        productId: String(p.id),
        name: String(pr.name),
        code: pr.code ? String(pr.code) : undefined,
        unitsPerPresentation: num(pr.unitsPerPresentation),
        price: { usd: num(pr.priceUsd), bs: num(pr.priceBs) },
        active: Boolean(pr.active),
      });
    }
    return {
      id: String(p.id),
      name: String(p.name),
      brand: String(p.brand ?? ""),
      categoryId: cat?.id ? String(cat.id) : "cat-default",
      sku: String(p.sku ?? ""),
      barcode: p.barcode ? String(p.barcode) : undefined,
      description: p.description ? String(p.description) : undefined,
      baseUnitLabel: String(p.baseUnitLabel ?? "u"),
      cost: { usd: num(p.avgCostUsd), bs: num(p.avgCostBs) },
      minStockBase: num(p.minStockBase),
      active: Boolean(p.active),
      createdAt: String(p.createdAt ?? new Date().toISOString()),
    };
  });
  next.presentations = presentations;
  next.categories = [...categoriesMap.values()].map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.id,
    active: true,
  }));
  if (!next.categories.length) {
    next.categories = [
      { id: "cat-default", name: "General", slug: "general", active: true },
    ];
  }

  const stocks = (snap.stocks as Record<string, unknown>[]) ?? [];
  next.inventory = stocks.map(
    (s): AdInventoryItem => ({
      productId: String(s.productId),
      warehouseId: String(s.warehouseId),
      qtyBase: num(s.qtyBase),
    }),
  );

  const customers = (snap.customers as Record<string, unknown>[]) ?? [];
  next.customers = customers.map((c): AdCustomer => {
    const name = String(c.name ?? "");
    const parts = name.split(" ");
    return {
      id: String(c.id),
      firstName: parts[0] ?? name,
      lastName: parts.slice(1).join(" "),
      name,
      phone: String(c.phone ?? ""),
      documentId: c.document ? String(c.document) : undefined,
      active: Boolean(c.active ?? true),
      createdAt: String(c.createdAt ?? new Date().toISOString()),
    };
  });

  const accounts = (snap.accounts as Record<string, unknown>[]) ?? [];
  next.accounts = accounts.map((a): AdAccount => {
    const lines = (a.lines as Record<string, unknown>[]) ?? [];
    const payments = (a.payments as Record<string, unknown>[]) ?? [];
    return {
      id: String(a.id),
      number: String(a.accountNumber ?? a.id),
      tableId: a.tableId ? String(a.tableId) : undefined,
      mesoneraId: a.mesoneraId ? String(a.mesoneraId) : undefined,
      customerId: a.customerId ? String(a.customerId) : undefined,
      customerName: a.customerName ? String(a.customerName) : undefined,
      customerPhone: a.customerPhone ? String(a.customerPhone) : undefined,
      warehouseId: a.warehouseId ? String(a.warehouseId) : null,
      status: String(a.status) as AdAccount["status"],
      prepaid: false,
      items: lines.map((l) => ({
        id: String(l.id),
        productId: String(l.productId),
        presentationId: String(l.presentationId),
        qty: num(l.qtyOrdered),
        qtyServed: num(l.qtyServed),
        unitPrice: { usd: num(l.unitPriceUsd), bs: num(l.unitPriceBs) },
        qtyBase: 0,
      })),
      payments: payments.map((p) => ({
        id: String(p.id),
        method: String(p.method) as AdAccount["payments"][0]["method"],
        currency: String(p.currency) as "USD" | "BS",
        amount: num(p.amount),
        bank: p.bank ? String(p.bank) : undefined,
        reference: p.reference ? String(p.reference) : undefined,
        createdAt: String(p.createdAt ?? new Date().toISOString()),
      })),
      discountUsd: num(a.discountUsd),
      discountBs: num(a.discountBs),
      openedAt: String(a.createdAt ?? new Date().toISOString()),
      updatedAt: String(a.updatedAt ?? a.createdAt ?? new Date().toISOString()),
      closedAt: a.closedAt ? String(a.closedAt) : undefined,
    };
  });

  // Prepaids / sales / purchases / transfers — mapeo resumido
  const prepaids = (snap.prepaids as Record<string, unknown>[]) ?? [];
  next.prepaids = prepaids.map((p) => {
    const items = (p.items as Record<string, unknown>[]) ?? [];
    return {
      id: String(p.id),
      code: String(p.code),
      qrToken: String(p.qrToken),
      receiptNumber: String(p.receiptRef ?? p.code),
      customerId: String(p.customerId),
      customerName: undefined,
      customerPhone: String(p.customerPhone ?? ""),
      customerDocumentId: p.customerDocument
        ? String(p.customerDocument)
        : undefined,
      warehouseId: String(p.warehouseId ?? ""),
      status:
        String(p.status) === "DEPLETED"
          ? ("AGOTADO" as const)
          : ("ACTIVO" as const),
      items: items.map((it) => ({
        id: String(it.id),
        productId: String(it.productId),
        presentationId: String(it.presentationId),
        qtyPurchased: num(it.qtyPurchased),
        qtyConsumed: num(it.qtyConsumed),
        unitPrice: {
          usd: num(it.unitPriceUsd),
          bs: num(it.unitPriceBs),
        },
        qtyBasePerUnit: num(it.qtyBasePerUnit),
      })),
      createdAt: String(p.createdAt ?? new Date().toISOString()),
      updatedAt: String(p.updatedAt ?? new Date().toISOString()),
    };
  });

  const audit = (snap.auditEvents as Record<string, unknown>[]) ?? [];
  next.audit = audit.map((e) => ({
    id: String(e.id),
    action: String(e.action),
    entity: String(e.entity),
    entityId: e.entityId ? String(e.entityId) : undefined,
    userName: "API",
    detail: e.detail ? String(e.detail) : String(e.action),
    beforeValue: e.before ? JSON.stringify(e.before) : undefined,
    afterValue: e.after ? JSON.stringify(e.after) : undefined,
    createdAt: String(e.createdAt ?? new Date().toISOString()),
  }));

  const commitments =
    (snap.commitments as Record<string, unknown>[]) ?? [];
  next.customerCommitments = commitments.map((c) => ({
    id: String(c.id),
    customerId: c.customerId ? String(c.customerId) : undefined,
    accountId: String(c.accountId),
    accountNumber: "",
    productId: String(c.productId),
    presentationId: String(c.presentationId),
    qtyRemaining: num(c.qtyRemaining),
    qtyBaseRemaining: num(c.qtyBaseRemaining),
    status: String(c.status) as "PENDIENTE" | "CUMPLIDO" | "CANCELADO",
    createdAt: String(c.createdAt ?? new Date().toISOString()),
    updatedAt: String(c.updatedAt ?? new Date().toISOString()),
  }));

  const transfers = (snap.transfers as Record<string, unknown>[]) ?? [];
  next.stockTransfers = transfers.map((t) => {
    const lines = (t.lines as Record<string, unknown>[]) ?? [];
    return {
      id: String(t.id),
      number: String(t.documentNumber),
      provisional: String(t.status) === "DRAFT",
      fromWarehouseId: String(t.fromWarehouseId),
      toWarehouseId: String(t.toWarehouseId),
      lines: lines.map((l) => ({
        id: String(l.id ?? `${t.id}-${l.productId}`),
        productId: String(l.productId),
        presentationId: String(l.presentationId ?? ""),
        qty: num(l.qty),
        qtyBase: num(l.qtyBase),
      })),
      status: mapTransferStatus(String(t.status)),
      createdBy: String(t.createdById ?? ""),
      createdAt: String(t.createdAt ?? new Date().toISOString()),
      updatedAt: String(t.updatedAt ?? new Date().toISOString()),
    };
  });

  return next;
}

function mapTransferStatus(
  status: string,
): AdRepositoryState["stockTransfers"][0]["status"] {
  switch (status) {
    case "DRAFT":
      return "BORRADOR";
    case "REQUESTED":
      return "SOLICITADA";
    case "AUTHORIZED":
      return "AUTORIZADA";
    case "SENT":
      return "ENVIADA";
    case "RECEIVED":
      return "RECIBIDA";
    case "CANCELLED":
      return "CANCELADA";
    default:
      return "BORRADOR";
  }
}

async function hydrate(): Promise<AdResult> {
  if (hydrating) return { ok: true, data: undefined };
  hydrating = true;
  try {
    const snap = await apiJson<Record<string, unknown>>(
      "GET",
      "/api/v1/ad/snapshot",
    );
    if (!snap.ok) return snap;
    state = mapSnapshotToState(snap.data);
    emit();
    return { ok: true, data: undefined };
  } finally {
    hydrating = false;
  }
}

function okVoid(): AdResult {
  return { ok: true, data: undefined };
}

function preferWarehouseId(): string {
  const session = loadAdSession();
  return (
    session?.warehouseId ??
    state.warehouses.find((w) => w.code === "LIC")?.id ??
    state.warehouses[0]?.id ??
    ""
  );
}

/**
 * Facade: misma forma superficial que mock; mutaciones son async.
 */
export const adApiBackedRepository = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): AdRepositoryState {
    return state;
  },
  async hydrateFromApi() {
    return hydrate();
  },

  getStock(productId: string, warehouseId: string) {
    return (
      state.inventory.find(
        (i) => i.productId === productId && i.warehouseId === warehouseId,
      )?.qtyBase ?? 0
    );
  },
  getPresentationsFor(productId: string) {
    return state.presentations.filter((p) => p.productId === productId);
  },
  getPaymentMethods(activeOnly = false) {
    return adLicoreriaRepository.getPaymentMethods(activeOnly);
  },
  getCurrentOperator() {
    return (
      state.operators.find((o) => o.id === state.currentOperatorId) ?? null
    );
  },
  setCurrentOperator(operatorId: string | null): AdResult<AdOperator | null> {
    if (!operatorId) {
      state = { ...state, currentOperatorId: null };
      emit();
      return { ok: true, data: null };
    }
    const op = state.operators.find((o) => o.id === operatorId);
    if (!op) return { ok: false, error: "Operador no encontrado" };
    state = { ...state, currentOperatorId: operatorId };
    emit();
    return { ok: true, data: op };
  },
  canAccessWarehouse(warehouseId: string, operatorId?: string) {
    const op = operatorId
      ? state.operators.find((o) => o.id === operatorId)
      : this.getCurrentOperator();
    if (!op) return false;
    return canAccessWarehouse(op, warehouseId);
  },
  hasPermission(permission: AdPermission, operatorId?: string) {
    const op = operatorId
      ? state.operators.find((o) => o.id === operatorId)
      : this.getCurrentOperator();
    if (!op) return false;
    return hasPermission(op, permission, state.rolePermissionOverrides);
  },
  getRolePermissionMatrix() {
    return { ...AD_DEFAULT_ROLE_PERMISSIONS, ...state.rolePermissionOverrides };
  },

  getOperationalAvailability(
    productId: string,
    requestedBase = 0,
    preferredWarehouseId?: string,
  ) {
    return getOperationalAvailability(
      {
        inventory: state.inventory,
        accounts: state.accounts,
        presentations: state.presentations,
        transfers: state.stockTransfers,
        purchaseRequests: state.purchaseRequests,
        customerCommitments: state.customerCommitments,
        warehouseIds: state.warehouses.map((w) => w.id),
      },
      productId,
      requestedBase,
      preferredWarehouseId ?? preferWarehouseId(),
    );
  },
  getAvailabilityMessage(
    productId: string,
    requestedBase = 0,
    preferredWarehouseId?: string,
  ) {
    return fulfillmentMessage(
      this.getOperationalAvailability(
        productId,
        requestedBase,
        preferredWarehouseId,
      ),
    );
  },

  async createWarehouse(input: {
    name: string;
    code?: string;
    userName: string;
  }): Promise<AdResult<AdWarehouse>> {
    const code =
      input.code?.trim().toUpperCase() ||
      `WH${String(state.warehouses.length + 1).padStart(2, "0")}`;
    const r = await apiJson<Record<string, unknown>>(
      "POST",
      "/api/v1/ad/warehouses",
      { name: input.name, code },
    );
    if (!r.ok) return r;
    await hydrate();
    const wh = state.warehouses.find((w) => w.code === code);
    return wh
      ? { ok: true, data: wh }
      : { ok: false, error: "Depósito creado pero no visible aún" };
  },

  async upsertWarehouse(
    warehouse: AdWarehouse,
  ): Promise<AdResult<AdWarehouse>> {
    const r = await apiJson<Record<string, unknown>>(
      "PATCH",
      `/api/v1/ad/warehouses/${warehouse.id}`,
      { name: warehouse.name, active: warehouse.active },
    );
    if (!r.ok) return r;
    await hydrate();
    const wh = state.warehouses.find((w) => w.id === warehouse.id);
    return wh ? { ok: true, data: wh } : { ok: false, error: "No encontrado" };
  },

  async setWarehouseActive(input: {
    warehouseId: string;
    active: boolean;
    userName: string;
  }): Promise<AdResult> {
    const r = await apiJson(
      "PATCH",
      `/api/v1/ad/warehouses/${input.warehouseId}`,
      { active: input.active },
    );
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async upsertOperator(operator: AdOperator): Promise<AdResult<AdOperator>> {
    const body = {
      id: operator.id.startsWith("op-") ? undefined : operator.id,
      username: operator.username,
      name: operator.name,
      role: operator.role,
      active: operator.active,
      warehouseId: operator.warehouseId ?? null,
      password: operator.mockCredential,
      permissions: operator.customPermissions,
    };
    const path = body.id
      ? `/api/v1/ad/operators/${body.id}`
      : "/api/v1/ad/operators";
    const method = body.id ? "PUT" : "POST";
    const r = await apiJson<Record<string, unknown>>(method, path, body);
    if (!r.ok) return r;
    await hydrate();
    const op = state.operators.find((o) => o.username === operator.username);
    return op
      ? { ok: true, data: op }
      : { ok: false, error: "Operador guardado; recargue" };
  },

  async upsertProduct(product: AdProduct): Promise<AdResult<AdProduct>> {
    const r = await apiJson<Record<string, unknown>>(
      "POST",
      "/api/v1/ad/products",
      {
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        barcode: product.barcode,
        description: product.description,
        baseUnitLabel: product.baseUnitLabel,
        minStockBase: product.minStockBase,
      },
    );
    if (!r.ok) return r;
    await hydrate();
    const p = state.products.find((x) => x.name === product.name);
    return p ? { ok: true, data: p } : { ok: false, error: "Producto no listo" };
  },

  async upsertPresentation(
    pres: AdPresentation,
  ): Promise<AdResult<AdPresentation>> {
    const r = await apiJson<Record<string, unknown>>(
      "POST",
      `/api/v1/ad/products/${pres.productId}/presentations`,
      {
        name: pres.name,
        code: pres.code,
        unitsPerPresentation: pres.unitsPerPresentation,
        priceUsd: pres.price.usd,
        priceBs: pres.price.bs,
      },
    );
    if (!r.ok) return r;
    await hydrate();
    const found = state.presentations.find(
      (p) => p.productId === pres.productId && p.name === pres.name,
    );
    return found
      ? { ok: true, data: found }
      : { ok: false, error: "Presentación no lista" };
  },

  async setInventoryQty(
    productId: string,
    warehouseId: string,
    qtyBase: number,
  ): Promise<AdResult> {
    const r = await apiJson("PUT", "/api/v1/ad/stock", {
      productId,
      warehouseId,
      qtyBase,
    });
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async upsertCustomer(customer: AdCustomer): Promise<AdResult<AdCustomer>> {
    const r = await apiJson<Record<string, unknown>>(
      "POST",
      "/api/v1/ad/customers",
      {
        name: customer.name,
        phone: customer.phone,
        document: customer.documentId,
      },
    );
    if (!r.ok) return r;
    await hydrate();
    const c = state.customers.find((x) => x.phone === customer.phone);
    return c ? { ok: true, data: c } : { ok: false, error: "Cliente no listo" };
  },

  async completeSale(input: {
    items: {
      presentationId: string;
      qty: number;
      productId: string;
      unitPrice: { usd: number; bs: number };
      qtyBase: number;
    }[];
    payments: {
      method: string;
      currency: "USD" | "BS";
      amount: number;
      reference?: string;
      bank?: string;
    }[];
    warehouseId: string;
    userName: string;
    customerId?: string;
    notes?: string;
    continueWithShortage?: boolean;
    shortageReasonCode?: string;
  }): Promise<AdResult<import("@/types/ad-licoreria").AdSale>> {
    if (input.continueWithShortage) {
      const actor = this.getCurrentOperator();
      if (!actor || !this.hasPermission("pos.shortage_override")) {
        return {
          ok: false,
          error: "Se requiere pos.shortage_override para continuar con faltante",
        };
      }
      if (!input.shortageReasonCode?.trim()) {
        return { ok: false, error: "Motivo de faltante obligatorio" };
      }
    }
    for (const line of input.items) {
      const av = this.getOperationalAvailability(
        line.productId,
        line.qtyBase,
        input.warehouseId,
      );
      const preferred = av.byWarehouse.find(
        (w) => w.warehouseId === input.warehouseId,
      );
      const physical = this.getStock(line.productId, input.warehouseId);
      if (line.qtyBase > physical && !input.continueWithShortage) {
        return {
          ok: false,
          error: `Stock físico insuficiente (${physical}). ${this.getAvailabilityMessage(line.productId, line.qtyBase, input.warehouseId)}`,
        };
      }
      if (
        preferred &&
        line.qtyBase > preferred.availableOperational &&
        !input.continueWithShortage
      ) {
        return {
          ok: false,
          error: this.getAvailabilityMessage(
            line.productId,
            line.qtyBase,
            input.warehouseId,
          ),
        };
      }
    }
    const r = await apiJson<{
      id: string;
      receiptNumber: string;
      totalUsd?: unknown;
      totalBs?: unknown;
      createdAt?: string;
    }>("POST", "/api/v1/ad/sales", {
      warehouseId: input.warehouseId,
      customerId: input.customerId,
      notes: input.notes,
      lines: input.items.map((i) => ({
        presentationId: i.presentationId,
        qty: i.qty,
      })),
      payments: input.payments,
    });
    if (!r.ok) return r;
    await hydrate();
    const total = {
      usd: num(r.data.totalUsd),
      bs: num(r.data.totalBs),
    };
    const payments = input.payments.map((p, i) => ({
      id: `pay-${i}`,
      method: p.method as import("@/types/ad-licoreria").AdPaymentMethodCode,
      currency: p.currency,
      amount: p.amount,
      bank: p.bank,
      reference: p.reference,
      createdAt: new Date().toISOString(),
    }));
    const sale: import("@/types/ad-licoreria").AdSale = {
      id: String(r.data.id),
      receiptNumber: String(r.data.receiptNumber),
      warehouseId: input.warehouseId,
      items: input.items,
      payments,
      subtotal: total,
      discountUsd: 0,
      discountBs: 0,
      total,
      customerId: input.customerId,
      userName: input.userName,
      status: "completed",
      notes: input.notes,
      createdAt: String(r.data.createdAt ?? new Date().toISOString()),
    };
    const receipt: import("@/types/ad-licoreria").AdReceipt = {
      id: `rcpt-${sale.id}`,
      number: sale.receiptNumber,
      kind: "sale",
      saleId: sale.id,
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      cashierName: input.userName,
      items: sale.items.map((it) => {
        const product = state.products.find((p) => p.id === it.productId);
        const pres = state.presentations.find((p) => p.id === it.presentationId);
        return {
          productName: product?.name ?? it.productId,
          presentationName: pres?.name ?? it.presentationId,
          qty: it.qty,
          unitPrice: it.unitPrice,
          lineTotal: {
            usd: it.unitPrice.usd * it.qty,
            bs: it.unitPrice.bs * it.qty,
          },
        };
      }),
      payments,
      subtotal: total,
      discountUsd: 0,
      discountBs: 0,
      total,
      paidUsd: payments
        .filter((p) => p.currency === "USD")
        .reduce((s, p) => s + p.amount, 0),
      paidBs: payments
        .filter((p) => p.currency === "BS")
        .reduce((s, p) => s + p.amount, 0),
      balanceUsd: 0,
      createdAt: sale.createdAt,
    };
    state = {
      ...state,
      sales: [sale, ...state.sales.filter((s) => s.id !== sale.id)],
      receipts: [receipt, ...state.receipts.filter((x) => x.id !== receipt.id)],
    };
    emit();
    return { ok: true, data: sale };
  },

  async openAccount(input: {
    tableId?: string;
    mesoneraId?: string;
    mesoneraName: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    warehouseId?: string;
  }): Promise<AdResult<AdAccount>> {
    const r = await apiJson<Record<string, unknown>>(
      "POST",
      "/api/v1/ad/accounts",
      {
        tableId: input.tableId,
        mesoneraId: input.mesoneraId,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        warehouseId: input.warehouseId,
      },
    );
    if (!r.ok) return r;
    await hydrate();
    const acc = state.accounts.find((a) => a.id === String(r.data.id));
    return acc
      ? { ok: true, data: acc }
      : { ok: false, error: "Cuenta creada; recargue" };
  },

  async addAccountItem(input: {
    accountId: string;
    productId: string;
    presentationId: string;
    qty: number;
    userName: string;
  }): Promise<AdResult<AdAccount>> {
    const r = await apiJson("POST", `/api/v1/ad/accounts/${input.accountId}/items`, {
      presentationId: input.presentationId,
      qty: input.qty,
    });
    if (!r.ok) return r;
    await hydrate();
    const acc = state.accounts.find((a) => a.id === input.accountId);
    return acc
      ? { ok: true, data: acc }
      : { ok: false, error: "Cuenta no encontrada tras agregar" };
  },

  async serveAccountItem(input: {
    accountId: string;
    itemId: string;
    qty: number;
    mesoneraName: string;
  }): Promise<AdResult> {
    const r = await apiJson(
      "POST",
      `/api/v1/ad/accounts/${input.accountId}/serve`,
      { itemId: input.itemId, qty: input.qty },
    );
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async addAccountPayment(input: {
    accountId: string;
    method: string;
    currency: "USD" | "BS";
    amount: number;
    userName: string;
    bank?: string;
    reference?: string;
  }): Promise<AdResult> {
    const r = await apiJson(
      "POST",
      `/api/v1/ad/accounts/${input.accountId}/payments`,
      {
        method: input.method,
        currency: input.currency,
        amount: input.amount,
        bank: input.bank,
        reference: input.reference,
      },
    );
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async closeAccount(input: {
    accountId: string;
    userName: string;
    settlePendingAs?: "commitment" | "prepaid";
    notes?: string;
  }): Promise<AdResult<AdAccount>> {
    const r = await apiJson(
      "POST",
      `/api/v1/ad/accounts/${input.accountId}/close`,
      {
        settlePendingAs: input.settlePendingAs,
        notes: input.notes,
      },
    );
    if (!r.ok) return r;
    await hydrate();
    const acc = state.accounts.find((a) => a.id === input.accountId);
    return acc
      ? { ok: true, data: acc }
      : { ok: false, error: "Cuenta cerrada" };
  },

  async voidAccount(input: {
    accountId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
  }): Promise<AdResult<AdAccount>> {
    const r = await apiJson(
      "POST",
      `/api/v1/ad/accounts/${input.accountId}/void`,
      { reason: input.reason },
    );
    if (!r.ok) return r;
    await hydrate();
    const acc = state.accounts.find((a) => a.id === input.accountId);
    return acc
      ? { ok: true, data: acc }
      : { ok: false, error: "Cuenta anulada" };
  },

  async createPrepaid(input: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerDocumentId?: string;
    warehouseId?: string;
    items: { productId: string; presentationId: string; qty: number }[];
    userName: string;
  }): Promise<AdResult> {
    if (!input.customerId) {
      return { ok: false, error: "customerId requerido en modo API" };
    }
    const r = await apiJson("POST", "/api/v1/ad/prepaids", {
      customerId: input.customerId,
      warehouseId: input.warehouseId,
      items: input.items.map((i) => ({
        presentationId: i.presentationId,
        qty: i.qty,
      })),
    });
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async consumePrepaid(input: {
    prepaidId: string;
    productId: string;
    presentationId: string;
    qty: number;
    mesoneraName: string;
    verifyPhone?: string;
    verifyDocumentId?: string;
  }): Promise<AdResult> {
    if (!input.verifyPhone || !input.verifyDocumentId) {
      return {
        ok: false,
        error: "Teléfono y cédula obligatorios para consumir QR",
      };
    }
    const r = await apiJson(
      "POST",
      `/api/v1/ad/prepaids/${input.prepaidId}/consume`,
      {
        presentationId: input.presentationId,
        qty: input.qty,
        verifyPhone: input.verifyPhone,
        verifyDocument: input.verifyDocumentId,
      },
    );
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  findPrepaidByQr(tokenOrCode: string) {
    const q = tokenOrCode.trim().toLowerCase();
    return state.prepaids.find(
      (p) =>
        p.qrToken.toLowerCase() === q || p.code.toLowerCase() === q,
    );
  },

  async createPurchase(input: {
    supplierName: string;
    invoiceNumber: string;
    date: string;
    warehouseId: string;
    items: {
      productId: string;
      presentationId: string;
      qty: number;
      unitCostUsd: number;
      unitCostBs: number;
    }[];
    userName: string;
  }): Promise<AdResult> {
    const created = await apiJson<{ id: string }>("POST", "/api/v1/ad/purchases", {
      supplierName: input.supplierName,
      invoiceNumber: input.invoiceNumber,
      warehouseId: input.warehouseId,
      lines: input.items.map((i) => ({
        presentationId: i.presentationId,
        qty: i.qty,
        unitCostUsd: i.unitCostUsd,
        unitCostBs: i.unitCostBs,
      })),
    });
    if (!created.ok) return created;
    const received = await apiJson(
      "POST",
      `/api/v1/ad/purchases/${created.data.id}/receive`,
    );
    if (!received.ok) return received;
    await hydrate();
    return okVoid();
  },

  async createTransferDraft(input: {
    fromWarehouseId: string;
    toWarehouseId: string;
    lines: { productId: string; presentationId: string; qty: number }[];
    createdBy: string;
    reason?: string;
  }): Promise<AdResult> {
    const r = await apiJson("POST", "/api/v1/ad/transfers", {
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      reason: input.reason,
      lines: input.lines.map((l) => ({
        presentationId: l.presentationId,
        qty: l.qty,
      })),
    });
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async confirmTransfer(input: {
    transferId: string;
    userName: string;
  }): Promise<AdResult> {
    const r = await apiJson(
      "POST",
      `/api/v1/ad/transfers/${input.transferId}/receive`,
    );
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async createPurchaseRequest(input: {
    productId: string;
    presentationId: string;
    qty: number;
    warehouseId: string;
    createdBy: string;
    reason: string;
    relatedAccountId?: string;
    relatedDraftId?: string;
    relatedTransferId?: string;
    notes?: string;
  }): Promise<AdResult> {
    const pres = state.presentations.find((p) => p.id === input.presentationId);
    const qtyBase = pres
      ? input.qty * Number(pres.unitsPerPresentation || 1)
      : input.qty;
    const r = await apiJson("POST", "/api/v1/ad/cop/purchase-requests", {
      productId: input.productId,
      presentationId: input.presentationId,
      qty: input.qty,
      qtyBaseNeeded: qtyBase,
      warehouseId: input.warehouseId,
      reason: input.reason,
      notes: input.notes,
    });
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async createDailyClosure(input: {
    userName: string;
    countedCashUsd: number;
    countedCashBs: number;
    warehouseId?: string;
    notes?: string;
  }): Promise<AdResult> {
    const r = await apiJson("POST", "/api/v1/ad/closures/cash", {
      warehouseId: input.warehouseId,
      countedCashUsd: input.countedCashUsd,
      countedCashBs: input.countedCashBs,
      notes: input.notes,
    });
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  async createInventoryClosure(input: {
    lines: {
      productId: string;
      warehouseId: string;
      theoreticalBase: number;
      physicalBase: number;
      differenceBase: number;
    }[];
    createdBy: string;
    warehouseId?: string;
    notes?: string;
    applyAdjustments?: boolean;
  }): Promise<AdResult> {
    const r = await apiJson("POST", "/api/v1/ad/closures/inventory", {
      warehouseId: input.warehouseId,
      applyAdjustments: input.applyAdjustments,
      notes: input.notes,
      lines: input.lines.map((l) => ({
        productId: l.productId,
        physicalBase: l.physicalBase,
      })),
    });
    if (!r.ok) return r;
    await hydrate();
    return okVoid();
  },

  getAccountsForMesonera(mesoneraId: string) {
    return state.accounts.filter(
      (a) =>
        a.mesoneraId === mesoneraId &&
        (a.status === "ABIERTA" ||
          a.status === "PREPAGADA" ||
          a.status === "PARCIALMENTE_PAGADA"),
    );
  },

  getPosOperatorsForWarehouse(warehouseId: string) {
    return state.operators.filter(
      (o) =>
        o.active &&
        o.posEnabled !== false &&
        (o.role === "cajero" || o.role === "admin") &&
        (o.warehouseId === warehouseId ||
          o.warehouseId == null ||
          o.role === "admin"),
    );
  },

  getFloorOperatorsForWarehouse(warehouseId: string) {
    return state.operators.filter(
      (o) =>
        o.active &&
        o.role === "mesonera" &&
        o.warehouseId === warehouseId,
    );
  },

  getCopDashboard() {
    const critical = state.products
      .filter((p) => p.active)
      .map((p) => {
        const av = this.getOperationalAvailability(p.id, 0);
        return { product: p, availability: av };
      })
      .filter(
        (row) =>
          row.availability.customerCommitmentDeficit > 0 ||
          row.availability.status !== "OK",
      );
    return {
      warehouses: state.warehouses,
      openAccounts: state.accounts.filter(
        (a) =>
          a.status === "ABIERTA" ||
          a.status === "PARCIALMENTE_PAGADA" ||
          a.status === "PREPAGADA",
      ).length,
      pendingCommitments: state.customerCommitments.filter(
        (c) => c.status === "PENDIENTE",
      ).length,
      pendingTransfers: state.stockTransfers.filter(
        (t) => t.status !== "RECIBIDA" && t.status !== "CANCELADA",
      ).length,
      purchaseRequests: state.purchaseRequests,
      critical,
    };
  },

  getCustomerSummary(customerId: string) {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return undefined;
    const sales = state.sales.filter((s) => s.customerId === customerId);
    const accounts = state.accounts.filter((a) => a.customerId === customerId);
    const prepaids = state.prepaids.filter((p) => p.customerId === customerId);
    const commitments = state.customerCommitments.filter(
      (c) => c.customerId === customerId && c.status === "PENDIENTE",
    );
    return {
      customer,
      sales,
      accounts,
      receipts: state.receipts.filter((r) => r.customerId === customerId),
      payments: [],
      prepaids,
      pendingMerchandise: [],
      commitments,
      whatsappLogs: [],
      totals: {
        totalPurchasedUsd: sales.reduce((a, s) => a + (s.total?.usd ?? 0), 0),
        pendingBalanceUsd: 0,
        lastPurchaseAt: sales[0]?.createdAt,
        lastPurchaseReceipt: sales[0]?.receiptNumber,
        openAccounts: accounts.filter((a) => a.status !== "CERRADA").length,
        activePrepaids: prepaids.filter((p) => p.status === "ACTIVO").length,
        customerCommitments: commitments.length,
      },
    };
  },

  // ─── Delegados MOCK (diseño / TV no migrados) ───
  updateSettings: adLicoreriaRepository.updateSettings.bind(
    adLicoreriaRepository,
  ),
  updateSiteDesign: adLicoreriaRepository.updateSiteDesign.bind(
    adLicoreriaRepository,
  ),
  saveSiteDesignDraft: adLicoreriaRepository.saveSiteDesignDraft.bind(
    adLicoreriaRepository,
  ),
  publishSiteDesign: adLicoreriaRepository.publishSiteDesign.bind(
    adLicoreriaRepository,
  ),
  discardSiteDesignDraft: adLicoreriaRepository.discardSiteDesignDraft.bind(
    adLicoreriaRepository,
  ),
  getSiteDesignDraft: adLicoreriaRepository.getSiteDesignDraft.bind(
    adLicoreriaRepository,
  ),
  resetSiteDesign: adLicoreriaRepository.resetSiteDesign.bind(
    adLicoreriaRepository,
  ),
  upsertPaymentMethod: adLicoreriaRepository.upsertPaymentMethod.bind(
    adLicoreriaRepository,
  ),
  setRolePermissions: adLicoreriaRepository.setRolePermissions.bind(
    adLicoreriaRepository,
  ),

  // Stubs que delegan a mock para no romper UI restante
  registerMovement: adLicoreriaRepository.registerMovement.bind(
    adLicoreriaRepository,
  ),
  transfer: adLicoreriaRepository.transfer.bind(adLicoreriaRepository),
  updateAccountItemQty: adLicoreriaRepository.updateAccountItemQty.bind(
    adLicoreriaRepository,
  ),
  removeAccountItem: adLicoreriaRepository.removeAccountItem.bind(
    adLicoreriaRepository,
  ),
  applyDiscount: adLicoreriaRepository.applyDiscount.bind(
    adLicoreriaRepository,
  ),
  reopenAccount: adLicoreriaRepository.reopenAccount.bind(
    adLicoreriaRepository,
  ),
  voidSale: adLicoreriaRepository.voidSale.bind(adLicoreriaRepository),
  findReceipt(numberOrId: string) {
    const q = numberOrId.trim().toLowerCase();
    return state.receipts.find(
      (r) => r.number.toLowerCase() === q || r.id.toLowerCase() === q,
    );
  },

  createInvoiceDraft(input: {
    kind?: "pos_sale" | "account_close";
    items: {
      productId: string;
      presentationId: string;
      qty: number;
      unitPrice: { usd: number; bs: number };
      qtyBase: number;
    }[];
    payments: {
      method: string;
      currency: "USD" | "BS";
      amount: number;
      bank?: string;
      reference?: string;
    }[];
    warehouseId: string;
    cashierName: string;
    operatorId?: string;
    tableId?: string;
    mesoneraName?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerDocumentId?: string;
    discountUsd?: number;
    discountBs?: number;
    discountReason?: string;
    notes?: string;
    continueWithShortage?: boolean;
    shortageDecision?: string;
  }): AdResult<import("@/types/ad-licoreria").AdInvoiceDraft> {
    if (!input.items.length) return { ok: false, error: "Agregue productos" };
    const supplyAlerts = input.items.map((line) => {
      const av = adApiBackedRepository.getOperationalAvailability(
        line.productId,
        line.qtyBase,
        input.warehouseId,
      );
      const preferred = av.byWarehouse.find(
        (w) => w.warehouseId === input.warehouseId,
      );
      const availableOperational =
        preferred?.availableOperational ?? av.availableOperationalTotal;
      const product = state.products.find((p) => p.id === line.productId);
      return {
        productId: line.productId,
        productName: product?.name ?? line.productId,
        requestedBase: line.qtyBase,
        availableOperational,
        shortfall: Math.max(0, line.qtyBase - availableOperational),
        availability: av,
      };
    });
    const seq = state.invoiceDraftSeq++;
    const draft: import("@/types/ad-licoreria").AdInvoiceDraft = {
      id: `invd-api-${seq}`,
      provisionalNumber: `PRE-${String(seq).padStart(6, "0")}`,
      status: "PRELIMINAR",
      kind: input.kind ?? "pos_sale",
      operatorId: input.operatorId,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerDocumentId: input.customerDocumentId,
      tableId: input.tableId,
      mesoneraName: input.mesoneraName,
      cashierName: input.cashierName,
      warehouseId: input.warehouseId,
      items: input.items as import("@/types/ad-licoreria").AdSaleItem[],
      payments: input.payments as import("@/types/ad-licoreria").AdPayment[],
      discountUsd: input.discountUsd ?? 0,
      discountBs: input.discountBs ?? 0,
      discountReason: input.discountReason,
      notes: input.notes,
      supplyAlerts,
      continueWithShortage: Boolean(input.continueWithShortage),
      shortageDecision: input.shortageDecision,
      createdAt: new Date().toISOString(),
    };
    state = {
      ...state,
      invoiceDrafts: [draft, ...state.invoiceDrafts],
      invoiceDraftSeq: state.invoiceDraftSeq,
    };
    emit();
    return { ok: true, data: draft };
  },

  async confirmInvoiceDraft(input: {
    draftId: string;
    userName: string;
    continueWithShortage?: boolean;
    shortageDecision?: string;
    shortageReasonCode?: string;
    shortageReasonNote?: string;
  }): Promise<AdResult<import("@/types/ad-licoreria").AdSale>> {
    const draft = state.invoiceDrafts.find((d) => d.id === input.draftId);
    if (!draft) return { ok: false, error: "Preliminar no encontrado" };
    if (draft.status !== "PRELIMINAR") {
      return { ok: false, error: "Este preliminar ya fue confirmado o cancelado" };
    }
    const hasShortage = draft.supplyAlerts.some((a) => a.shortfall > 0);
    const continueShortage =
      input.continueWithShortage ?? draft.continueWithShortage;
    if (hasShortage && !continueShortage) {
      return {
        ok: false,
        error:
          "La operación supera la disponibilidad operativa. Decida: transferir, crear compra, reducir cantidad o CONTINUAR CON FALTANTE.",
      };
    }
    const saleResult = await adApiBackedRepository.completeSale({
      items: draft.items,
      payments: draft.payments,
      warehouseId: draft.warehouseId,
      userName: input.userName,
      customerId: draft.customerId,
      notes: draft.notes,
      continueWithShortage: continueShortage,
      shortageReasonCode:
        input.shortageReasonCode ??
        input.shortageDecision ??
        draft.shortageDecision,
    });
    if (!saleResult.ok) return saleResult;
    const sale = saleResult.data;
    state = {
      ...state,
      invoiceDrafts: state.invoiceDrafts.map((d) =>
        d.id === draft.id
          ? {
              ...d,
              status: "CONFIRMADA" as const,
              confirmedAt: new Date().toISOString(),
              receiptNumber: sale.receiptNumber,
              saleId: sale.id,
            }
          : d,
      ),
    };
    emit();
    return { ok: true, data: sale };
  },

  cancelInvoiceDraft(input: {
    draftId: string;
    userName: string;
  }): AdResult<import("@/types/ad-licoreria").AdInvoiceDraft> {
    const draft = state.invoiceDrafts.find((d) => d.id === input.draftId);
    if (!draft) return { ok: false, error: "Preliminar no encontrado" };
    if (draft.status !== "PRELIMINAR") {
      return { ok: false, error: "No se puede cancelar" };
    }
    const updated = {
      ...draft,
      status: "CANCELADA" as const,
      cancelledAt: new Date().toISOString(),
    };
    state = {
      ...state,
      invoiceDrafts: state.invoiceDrafts.map((d) =>
        d.id === input.draftId ? updated : d,
      ),
    };
    emit();
    return { ok: true, data: updated };
  },

  updateTransferDraft: adLicoreriaRepository.updateTransferDraft.bind(
    adLicoreriaRepository,
  ),
  advanceTransferStatus: adLicoreriaRepository.advanceTransferStatus.bind(
    adLicoreriaRepository,
  ),
  fulfillPurchaseRequest: adLicoreriaRepository.fulfillPurchaseRequest.bind(
    adLicoreriaRepository,
  ),
  getCopReports: adLicoreriaRepository.getCopReports.bind(
    adLicoreriaRepository,
  ),
  logDocumentAction: adLicoreriaRepository.logDocumentAction.bind(
    adLicoreriaRepository,
  ),
  reassignMesonera: adLicoreriaRepository.reassignMesonera.bind(
    adLicoreriaRepository,
  ),
  upsertTable: adLicoreriaRepository.upsertTable.bind(adLicoreriaRepository),
};

export type AdApiBackedRepository = typeof adApiBackedRepository;
