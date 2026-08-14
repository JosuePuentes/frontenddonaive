/**
 * Repositorio mock A&D.
 * Capa única de lógica de negocio; la UI no debe duplicar estas reglas.
 * Sustituible por API real sin rehacer pantallas.
 */
import {
  AD_DEMO_ACCOUNTS,
  AD_DEMO_AUDIT,
  AD_DEMO_CATEGORIES,
  AD_DEMO_CUSTOMERS,
  AD_DEMO_DAILY_CLOSURES,
  AD_DEMO_INVENTORY,
  AD_DEMO_INVENTORY_CLOSURES,
  AD_DEMO_MOVEMENTS,
  AD_DEMO_OPERATORS,
  AD_DEMO_PREPAID_CONSUMPTIONS,
  AD_DEMO_PREPAIDS,
  AD_DEMO_PRESENTATIONS,
  AD_DEMO_PRODUCTS,
  AD_DEMO_SALES,
  AD_DEMO_SERVICE_LOGS,
  AD_DEMO_SETTINGS,
  AD_DEMO_TABLES,
  AD_DEMO_WAREHOUSES,
} from "@/content/ad-licoreria/demo-data";
import {
  addPrices,
  multiplyPrice,
  nextAccountNumber,
  nextPrepaidCode,
  prepaidAvailable,
  toBaseUnits,
  uid,
} from "@/lib/ad-licoreria/conversions";
import type {
  AdAccount,
  AdAccountItem,
  AdAppSettings,
  AdAuditEvent,
  AdCategory,
  AdCustomer,
  AdDailyClosure,
  AdInventoryClosure,
  AdInventoryClosureLine,
  AdInventoryItem,
  AdInventoryMovement,
  AdInventoryMovementType,
  AdOperator,
  AdPayment,
  AdPaymentMethod,
  AdPrepaidAccount,
  AdPrepaidConsumption,
  AdPresentation,
  AdProduct,
  AdSale,
  AdSaleItem,
  AdServiceLog,
  AdTable,
  AdWarehouse,
} from "@/types/ad-licoreria";

export type AdRepositoryState = {
  settings: AdAppSettings;
  operators: AdOperator[];
  categories: AdCategory[];
  products: AdProduct[];
  presentations: AdPresentation[];
  warehouses: AdWarehouse[];
  inventory: AdInventoryItem[];
  movements: AdInventoryMovement[];
  tables: AdTable[];
  accounts: AdAccount[];
  prepaids: AdPrepaidAccount[];
  prepaidConsumptions: AdPrepaidConsumption[];
  customers: AdCustomer[];
  sales: AdSale[];
  serviceLogs: AdServiceLog[];
  dailyClosures: AdDailyClosure[];
  inventoryClosures: AdInventoryClosure[];
  audit: AdAuditEvent[];
  accountSeq: number;
  prepaidSeq: number;
};

export type AdResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function cloneState(): AdRepositoryState {
  return {
    settings: { ...AD_DEMO_SETTINGS },
    operators: structuredClone(AD_DEMO_OPERATORS),
    categories: structuredClone(AD_DEMO_CATEGORIES),
    products: structuredClone(AD_DEMO_PRODUCTS),
    presentations: structuredClone(AD_DEMO_PRESENTATIONS),
    warehouses: structuredClone(AD_DEMO_WAREHOUSES),
    inventory: structuredClone(AD_DEMO_INVENTORY),
    movements: structuredClone(AD_DEMO_MOVEMENTS),
    tables: structuredClone(AD_DEMO_TABLES),
    accounts: structuredClone(AD_DEMO_ACCOUNTS),
    prepaids: structuredClone(AD_DEMO_PREPAIDS),
    prepaidConsumptions: structuredClone(AD_DEMO_PREPAID_CONSUMPTIONS),
    customers: structuredClone(AD_DEMO_CUSTOMERS),
    sales: structuredClone(AD_DEMO_SALES),
    serviceLogs: structuredClone(AD_DEMO_SERVICE_LOGS),
    dailyClosures: structuredClone(AD_DEMO_DAILY_CLOSURES),
    inventoryClosures: structuredClone(AD_DEMO_INVENTORY_CLOSURES),
    audit: structuredClone(AD_DEMO_AUDIT),
    accountSeq: 186,
    prepaidSeq: 126,
  };
}

let state = cloneState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function audit(
  action: string,
  entity: string,
  userName: string,
  detail: string,
  entityId?: string,
) {
  state.audit = [
    {
      id: uid("aud"),
      action,
      entity,
      entityId,
      userName,
      detail,
      createdAt: new Date().toISOString(),
    },
    ...state.audit,
  ];
}

function getStock(productId: string, warehouseId: string): number {
  return (
    state.inventory.find(
      (i) => i.productId === productId && i.warehouseId === warehouseId,
    )?.qtyBase ?? 0
  );
}

function adjustStock(productId: string, warehouseId: string, delta: number) {
  const idx = state.inventory.findIndex(
    (i) => i.productId === productId && i.warehouseId === warehouseId,
  );
  if (idx === -1) {
    state.inventory = [
      ...state.inventory,
      { productId, warehouseId, qtyBase: Math.max(0, delta) },
    ];
    return;
  }
  const next = [...state.inventory];
  next[idx] = {
    ...next[idx],
    qtyBase: Math.max(0, next[idx].qtyBase + delta),
  };
  state.inventory = next;
}

function pushMovement(mov: AdInventoryMovement) {
  state.movements = [mov, ...state.movements];
}

export const adLicoreriaRepository = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState(): AdRepositoryState {
    return state;
  },

  reset() {
    state = cloneState();
    emit();
  },

  getStock,

  getPresentationsFor(productId: string) {
    return state.presentations.filter(
      (p) => p.productId === productId && p.active,
    );
  },

  updateSettings(patch: Partial<AdAppSettings>): AdResult {
    state.settings = { ...state.settings, ...patch };
    audit("config", "settings", "Admin A&D", "Actualizó configuración");
    emit();
    return { ok: true, data: undefined };
  },

  upsertProduct(product: AdProduct): AdResult<AdProduct> {
    const idx = state.products.findIndex((p) => p.id === product.id);
    if (idx === -1) state.products = [product, ...state.products];
    else {
      const next = [...state.products];
      next[idx] = product;
      state.products = next;
    }
    audit("upsert", "product", "Admin A&D", product.name, product.id);
    emit();
    return { ok: true, data: product };
  },

  upsertPresentation(pres: AdPresentation): AdResult<AdPresentation> {
    if (pres.unitsPerPresentation <= 0) {
      return { ok: false, error: "La conversión debe ser mayor a 0" };
    }
    const idx = state.presentations.findIndex((p) => p.id === pres.id);
    if (idx === -1) state.presentations = [pres, ...state.presentations];
    else {
      const next = [...state.presentations];
      next[idx] = pres;
      state.presentations = next;
    }
    audit(
      "upsert",
      "presentation",
      "Admin A&D",
      `${pres.name} ×${pres.unitsPerPresentation}`,
      pres.id,
    );
    emit();
    return { ok: true, data: pres };
  },

  registerMovement(input: {
    type: AdInventoryMovementType;
    productId: string;
    presentationId?: string;
    qtyPresentation: number;
    warehouseId: string;
    warehouseFromId?: string;
    warehouseToId?: string;
    userName: string;
    reason?: string;
    reference?: string;
  }): AdResult<AdInventoryMovement> {
    const presentation = input.presentationId
      ? state.presentations.find((p) => p.id === input.presentationId)
      : undefined;
    const qtyBase = presentation
      ? toBaseUnits(presentation, input.qtyPresentation)
      : input.qtyPresentation;

    if (
      input.type === "VENTA" ||
      input.type === "TRASLADO_SALIDA" ||
      input.type === "AJUSTE_SALIDA" ||
      input.type === "CONSUMO_CUENTA"
    ) {
      if (qtyBase > getStock(input.productId, input.warehouseId)) {
        return { ok: false, error: "Stock insuficiente" };
      }
      adjustStock(input.productId, input.warehouseId, -qtyBase);
    } else if (
      input.type === "COMPRA" ||
      input.type === "TRASLADO_ENTRADA" ||
      input.type === "AJUSTE_ENTRADA" ||
      input.type === "INVENTARIO_INICIAL" ||
      input.type === "DEVOLUCION"
    ) {
      adjustStock(input.productId, input.warehouseId, qtyBase);
    }

    const mov: AdInventoryMovement = {
      id: uid("mov"),
      type: input.type,
      productId: input.productId,
      presentationId: input.presentationId,
      qtyPresentation: input.qtyPresentation,
      qtyBase,
      warehouseId: input.warehouseId,
      warehouseFromId: input.warehouseFromId,
      warehouseToId: input.warehouseToId,
      userName: input.userName,
      reason: input.reason,
      reference: input.reference,
      createdAt: new Date().toISOString(),
    };
    pushMovement(mov);
    audit(input.type, "inventario", input.userName, input.reason ?? input.type, mov.id);
    emit();
    return { ok: true, data: mov };
  },

  transfer(input: {
    productId: string;
    presentationId: string;
    qtyPresentation: number;
    fromId: string;
    toId: string;
    userName: string;
    reason?: string;
  }): AdResult {
    const out = this.registerMovement({
      type: "TRASLADO_SALIDA",
      productId: input.productId,
      presentationId: input.presentationId,
      qtyPresentation: input.qtyPresentation,
      warehouseId: input.fromId,
      warehouseFromId: input.fromId,
      warehouseToId: input.toId,
      userName: input.userName,
      reason: input.reason,
    });
    if (!out.ok) return out;
    const inbound = this.registerMovement({
      type: "TRASLADO_ENTRADA",
      productId: input.productId,
      presentationId: input.presentationId,
      qtyPresentation: input.qtyPresentation,
      warehouseId: input.toId,
      warehouseFromId: input.fromId,
      warehouseToId: input.toId,
      userName: input.userName,
      reason: input.reason,
    });
    if (!inbound.ok) return inbound;
    return { ok: true, data: undefined };
  },

  openAccount(input: {
    tableId?: string;
    mesoneraId?: string;
    mesoneraName: string;
    customerId?: string;
    customerName?: string;
    prepaid?: boolean;
  }): AdResult<AdAccount> {
    const number = nextAccountNumber(state.accountSeq++);
    const account: AdAccount = {
      id: uid("acc"),
      number,
      tableId: input.tableId,
      mesoneraId: input.mesoneraId,
      mesoneraName: input.mesoneraName,
      customerId: input.customerId,
      customerName: input.customerName,
      status: input.prepaid ? "PREPAGADA" : "ABIERTA",
      prepaid: Boolean(input.prepaid),
      items: [],
      payments: [],
      openedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.accounts = [account, ...state.accounts];
    if (input.tableId) {
      state.tables = state.tables.map((t) =>
        t.id === input.tableId
          ? {
              ...t,
              status: input.prepaid ? "cuenta_prepagada" : "cuenta_abierta",
            }
          : t,
      );
    }
    audit("open", "account", input.mesoneraName, `Cuenta #${number}`, account.id);
    emit();
    return { ok: true, data: account };
  },

  addAccountItem(input: {
    accountId: string;
    productId: string;
    presentationId: string;
    qty: number;
    userName: string;
    deductStock?: boolean;
    warehouseId?: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    if (account.status === "CERRADA" || account.status === "CANCELADA") {
      return { ok: false, error: "Cuenta cerrada" };
    }
    const pres = state.presentations.find((p) => p.id === input.presentationId);
    if (!pres) return { ok: false, error: "Presentación no encontrada" };
    const qtyBase = toBaseUnits(pres, input.qty);
    const warehouseId = input.warehouseId ?? "wh-2";

    if (input.deductStock !== false) {
      const mov = this.registerMovement({
        type: "VENTA",
        productId: input.productId,
        presentationId: input.presentationId,
        qtyPresentation: input.qty,
        warehouseId,
        userName: input.userName,
        reason: `Cuenta #${account.number}`,
        reference: account.id,
      });
      if (!mov.ok) return mov;
    }

    const item: AdAccountItem = {
      id: uid("acci"),
      productId: input.productId,
      presentationId: input.presentationId,
      qty: input.qty,
      qtyServed: input.deductStock === false ? 0 : input.qty,
      unitPrice: { ...pres.price },
      qtyBase,
    };

    state.accounts = state.accounts.map((a) =>
      a.id !== account.id
        ? a
        : {
            ...a,
            items: [...a.items, item],
            updatedAt: new Date().toISOString(),
          },
    );
    const updated = state.accounts.find((a) => a.id === account.id)!;
    emit();
    return { ok: true, data: updated };
  },

  serveAccountItem(input: {
    accountId: string;
    itemId: string;
    qty: number;
    mesoneraName: string;
  }): AdResult {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    const item = account.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false, error: "Ítem no encontrado" };
    const available = item.qty - item.qtyServed;
    if (input.qty <= 0 || input.qty > available) {
      return { ok: false, error: `Solo hay ${available} pendientes de servir` };
    }
    const pres = state.presentations.find((p) => p.id === item.presentationId);
    if (!pres) return { ok: false, error: "Presentación no encontrada" };
    const qtyBase = toBaseUnits(pres, input.qty);

    const mov = this.registerMovement({
      type: "CONSUMO_CUENTA",
      productId: item.productId,
      presentationId: item.presentationId,
      qtyPresentation: input.qty,
      warehouseId: "wh-2",
      userName: input.mesoneraName,
      reason: `Servicio cuenta #${account.number}`,
      reference: account.id,
    });
    if (!mov.ok) return mov;

    state.accounts = state.accounts.map((a) =>
      a.id !== account.id
        ? a
        : {
            ...a,
            updatedAt: new Date().toISOString(),
            items: a.items.map((i) =>
              i.id === item.id
                ? { ...i, qtyServed: i.qtyServed + input.qty }
                : i,
            ),
          },
    );
    state.serviceLogs = [
      {
        id: uid("svc"),
        accountId: account.id,
        tableId: account.tableId,
        productId: item.productId,
        presentationId: item.presentationId,
        qtyServed: input.qty,
        qtyBase,
        mesoneraName: input.mesoneraName,
        createdAt: new Date().toISOString(),
      },
      ...state.serviceLogs,
    ];
    emit();
    return { ok: true, data: undefined };
  },

  addAccountPayment(input: {
    accountId: string;
    method: AdPaymentMethod;
    currency: "USD" | "BS";
    amount: number;
    userName: string;
  }): AdResult {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    const payment: AdPayment = {
      id: uid("pay"),
      method: input.method,
      currency: input.currency,
      amount: input.amount,
      createdAt: new Date().toISOString(),
    };
    state.accounts = state.accounts.map((a) =>
      a.id !== account.id
        ? a
        : {
            ...a,
            payments: [...a.payments, payment],
            status: "PARCIALMENTE_PAGADA",
            updatedAt: new Date().toISOString(),
          },
    );
    audit("payment", "account", input.userName, `${input.method} ${input.amount}`, account.id);
    emit();
    return { ok: true, data: undefined };
  },

  closeAccount(input: {
    accountId: string;
    userName: string;
    notes?: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    const closed: AdAccount = {
      ...account,
      status: "CERRADA",
      closedAt: new Date().toISOString(),
      closedBy: input.userName,
      notes: input.notes,
      updatedAt: new Date().toISOString(),
    };
    state.accounts = state.accounts.map((a) =>
      a.id === account.id ? closed : a,
    );
    if (account.tableId) {
      state.tables = state.tables.map((t) =>
        t.id === account.tableId ? { ...t, status: "disponible" } : t,
      );
    }
    audit("close", "account", input.userName, `Cerró #${account.number}`, account.id);
    emit();
    return { ok: true, data: closed };
  },

  createPrepaid(input: {
    customerId?: string;
    customerName?: string;
    items: {
      productId: string;
      presentationId: string;
      qty: number;
    }[];
    userName: string;
  }): AdResult<AdPrepaidAccount> {
    if (!input.items.length) return { ok: false, error: "Agregue productos" };
    const code = nextPrepaidCode(state.prepaidSeq++);
    const token = `ad_qr_${code.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${uid("t").slice(-4)}`;
    const items = input.items.map((it) => {
      const pres = state.presentations.find((p) => p.id === it.presentationId)!;
      return {
        id: uid("ppi"),
        productId: it.productId,
        presentationId: it.presentationId,
        qtyPurchased: it.qty,
        qtyConsumed: 0,
        unitPrice: { ...pres.price },
        qtyBasePerUnit: pres.unitsPerPresentation,
      };
    });

    for (const it of items) {
      const mov = this.registerMovement({
        type: "VENTA",
        productId: it.productId,
        presentationId: it.presentationId,
        qtyPresentation: it.qtyPurchased,
        warehouseId: "wh-2",
        userName: input.userName,
        reason: `Prepago ${code}`,
      });
      if (!mov.ok) return mov;
    }

    const prepaid: AdPrepaidAccount = {
      id: uid("pp"),
      code,
      qrToken: token,
      customerId: input.customerId,
      customerName: input.customerName,
      status: "ACTIVO",
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.prepaids = [prepaid, ...state.prepaids];
    audit("create", "prepaid", input.userName, code, prepaid.id);
    emit();
    return { ok: true, data: prepaid };
  },

  consumePrepaid(input: {
    prepaidId: string;
    productId: string;
    presentationId: string;
    qty: number;
    mesoneraName: string;
  }): AdResult {
    const prepaid = state.prepaids.find((p) => p.id === input.prepaidId);
    if (!prepaid) return { ok: false, error: "Prepago no encontrado" };
    if (prepaid.status !== "ACTIVO") {
      return { ok: false, error: "Prepago no activo" };
    }
    const item = prepaid.items.find(
      (i) =>
        i.productId === input.productId &&
        i.presentationId === input.presentationId,
    );
    if (!item) return { ok: false, error: "Producto no está en el prepago" };
    const available = prepaidAvailable(item.qtyPurchased, item.qtyConsumed);
    if (input.qty <= 0 || input.qty > available) {
      return { ok: false, error: `Disponibles: ${available}` };
    }

    const qtyBase = item.qtyBasePerUnit * input.qty;
    // Stock ya se descontó al crear el prepago; el consumo es operativo.
    state.prepaids = state.prepaids.map((p) => {
      if (p.id !== prepaid.id) return p;
      const items = p.items.map((i) =>
        i.id === item.id
          ? { ...i, qtyConsumed: i.qtyConsumed + input.qty }
          : i,
      );
      const allGone = items.every(
        (i) => prepaidAvailable(i.qtyPurchased, i.qtyConsumed) === 0,
      );
      return {
        ...p,
        items,
        status: allGone ? "AGOTADO" : "ACTIVO",
        updatedAt: new Date().toISOString(),
      };
    });

    const consumption: AdPrepaidConsumption = {
      id: uid("ppc"),
      prepaidId: prepaid.id,
      productId: input.productId,
      presentationId: input.presentationId,
      qty: input.qty,
      qtyBase,
      mesoneraName: input.mesoneraName,
      createdAt: new Date().toISOString(),
    };
    state.prepaidConsumptions = [consumption, ...state.prepaidConsumptions];
    state.serviceLogs = [
      {
        id: uid("svc"),
        prepaidId: prepaid.id,
        productId: input.productId,
        presentationId: input.presentationId,
        qtyServed: input.qty,
        qtyBase,
        mesoneraName: input.mesoneraName,
        createdAt: consumption.createdAt,
      },
      ...state.serviceLogs,
    ];
    audit(
      "consume",
      "prepaid",
      input.mesoneraName,
      `${prepaid.code} −${input.qty}`,
      prepaid.id,
    );
    emit();
    return { ok: true, data: undefined };
  },

  findPrepaidByQr(tokenOrCode: string): AdPrepaidAccount | undefined {
    const q = tokenOrCode.trim().toLowerCase();
    return state.prepaids.find(
      (p) =>
        p.qrToken.toLowerCase() === q || p.code.toLowerCase() === q,
    );
  },

  completeSale(input: {
    items: AdSaleItem[];
    payments: Omit<AdPayment, "id" | "createdAt">[];
    warehouseId: string;
    userName: string;
    tableId?: string;
    mesoneraName?: string;
    customerName?: string;
    accountId?: string;
  }): AdResult<AdSale> {
    if (!input.items.length) return { ok: false, error: "Agregue productos" };
    if (!input.payments.length) return { ok: false, error: "Registre pagos" };

    for (const line of input.items) {
      if (line.qtyBase > getStock(line.productId, input.warehouseId)) {
        return { ok: false, error: "Stock insuficiente" };
      }
    }

    for (const line of input.items) {
      const mov = this.registerMovement({
        type: "VENTA",
        productId: line.productId,
        presentationId: line.presentationId,
        qtyPresentation: line.qty,
        warehouseId: input.warehouseId,
        userName: input.userName,
        reason: "Venta POS",
      });
      if (!mov.ok) return mov;
    }

    const subtotal = input.items.reduce(
      (acc, l) => addPrices(acc, multiplyPrice(l.unitPrice, l.qty)),
      { usd: 0, bs: 0 },
    );
    const payments: AdPayment[] = input.payments.map((p) => ({
      ...p,
      id: uid("pay"),
      createdAt: new Date().toISOString(),
    }));
    const sale: AdSale = {
      id: uid("sale"),
      accountId: input.accountId,
      tableId: input.tableId,
      mesoneraName: input.mesoneraName,
      customerName: input.customerName,
      items: input.items,
      payments,
      subtotal,
      total: subtotal,
      warehouseId: input.warehouseId,
      userName: input.userName,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    state.sales = [sale, ...state.sales];
    audit("venta", "pos", input.userName, `$${sale.total.usd}`, sale.id);
    emit();
    return { ok: true, data: sale };
  },

  upsertCustomer(customer: AdCustomer): AdResult<AdCustomer> {
    const idx = state.customers.findIndex((c) => c.id === customer.id);
    if (idx === -1) state.customers = [customer, ...state.customers];
    else {
      const next = [...state.customers];
      next[idx] = customer;
      state.customers = next;
    }
    emit();
    return { ok: true, data: customer };
  },

  createDailyClosure(userName: string): AdResult<AdDailyClosure> {
    const byMethod: AdDailyClosure["byMethod"] = {};
    for (const sale of state.sales) {
      for (const pay of sale.payments) {
        const cur = byMethod[pay.method] ?? { usd: 0, bs: 0 };
        if (pay.currency === "USD") cur.usd += pay.amount;
        else cur.bs += pay.amount;
        byMethod[pay.method] = cur;
      }
    }
    const byMesoneraMap = new Map<
      string,
      { name: string; salesCount: number; totalUsd: number }
    >();
    for (const sale of state.sales) {
      const name = sale.mesoneraName ?? sale.userName;
      const prev = byMesoneraMap.get(name) ?? {
        name,
        salesCount: 0,
        totalUsd: 0,
      };
      prev.salesCount += 1;
      prev.totalUsd += sale.total.usd;
      byMesoneraMap.set(name, prev);
    }
    const closure: AdDailyClosure = {
      id: uid("dclose"),
      date: new Date().toISOString().slice(0, 10),
      salesCount: state.sales.length,
      totalUsd: state.sales.reduce((a, s) => a + s.total.usd, 0),
      totalBs: state.sales.reduce((a, s) => a + s.total.bs, 0),
      openAccounts: state.accounts.filter(
        (a) => a.status === "ABIERTA" || a.status === "PREPAGADA",
      ).length,
      closedAccounts: state.accounts.filter((a) => a.status === "CERRADA")
        .length,
      prepaidsActive: state.prepaids.filter((p) => p.status === "ACTIVO")
        .length,
      byMethod,
      byMesonera: [...byMesoneraMap.values()],
      createdAt: new Date().toISOString(),
      createdBy: userName,
    };
    state.dailyClosures = [closure, ...state.dailyClosures];
    audit("daily_close", "closure", userName, closure.date, closure.id);
    emit();
    return { ok: true, data: closure };
  },

  createInventoryClosure(input: {
    lines: AdInventoryClosureLine[];
    createdBy: string;
    warehouseId?: string;
    notes?: string;
    applyAdjustments?: boolean;
  }): AdResult<AdInventoryClosure> {
    if (input.applyAdjustments) {
      for (const line of input.lines) {
        const diff = line.physicalBase - line.theoreticalBase;
        if (diff === 0) continue;
        const type =
          diff > 0 ? ("AJUSTE_ENTRADA" as const) : ("AJUSTE_SALIDA" as const);
        const res = this.registerMovement({
          type,
          productId: line.productId,
          qtyPresentation: Math.abs(diff),
          warehouseId: line.warehouseId,
          userName: input.createdBy,
          reason: "Cierre inventario físico",
        });
        if (!res.ok) return res;
      }
    }
    const closure: AdInventoryClosure = {
      id: uid("iclose"),
      warehouseId: input.warehouseId,
      lines: input.lines,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      notes: input.notes,
    };
    state.inventoryClosures = [closure, ...state.inventoryClosures];
    audit("inv_close", "closure", input.createdBy, "Conteo físico", closure.id);
    emit();
    return { ok: true, data: closure };
  },
};
