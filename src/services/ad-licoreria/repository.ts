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
  AD_DEMO_PAYMENT_METHODS,
  AD_DEMO_PREPAID_CONSUMPTIONS,
  AD_DEMO_PREPAIDS,
  AD_DEMO_PRESENTATIONS,
  AD_DEMO_PRODUCTS,
  AD_DEMO_PURCHASES,
  AD_DEMO_RECEIPTS,
  AD_DEMO_SALES,
  AD_DEMO_SERVICE_LOGS,
  AD_DEMO_SETTINGS,
  AD_DEMO_TABLES,
  AD_DEMO_WAREHOUSES,
  AD_DEMO_WHATSAPP_LOGS,
} from "@/content/ad-licoreria/demo-data";
import {
  addPrices,
  customerDisplayName,
  multiplyPrice,
  nextAccountNumber,
  nextPrepaidCode,
  nextReceiptNumber,
  prepaidAvailable,
  toBaseUnits,
  uid,
} from "@/lib/ad-licoreria/conversions";
import { adWhatsAppService } from "@/services/ad-licoreria/whatsapp";
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
  AdPaymentMethodCode,
  AdPaymentMethodConfig,
  AdPrepaidAccount,
  AdPrepaidConsumption,
  AdPresentation,
  AdProduct,
  AdPurchase,
  AdPurchaseItem,
  AdReceipt,
  AdSale,
  AdSaleItem,
  AdServiceLog,
  AdTable,
  AdWarehouse,
  AdWhatsAppLog,
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
  receipts: AdReceipt[];
  purchases: AdPurchase[];
  paymentMethods: AdPaymentMethodConfig[];
  serviceLogs: AdServiceLog[];
  dailyClosures: AdDailyClosure[];
  inventoryClosures: AdInventoryClosure[];
  audit: AdAuditEvent[];
  whatsappLogs: AdWhatsAppLog[];
  accountSeq: number;
  prepaidSeq: number;
  receiptSeq: number;
  purchaseSeq: number;
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
    receipts: structuredClone(AD_DEMO_RECEIPTS),
    purchases: structuredClone(AD_DEMO_PURCHASES),
    paymentMethods: structuredClone(AD_DEMO_PAYMENT_METHODS),
    serviceLogs: structuredClone(AD_DEMO_SERVICE_LOGS),
    dailyClosures: structuredClone(AD_DEMO_DAILY_CLOSURES),
    inventoryClosures: structuredClone(AD_DEMO_INVENTORY_CLOSURES),
    audit: structuredClone(AD_DEMO_AUDIT),
    whatsappLogs: structuredClone(AD_DEMO_WHATSAPP_LOGS),
    accountSeq: 186,
    prepaidSeq: 126,
    receiptSeq: 1,
    purchaseSeq: 1,
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
  extra?: { beforeValue?: string; afterValue?: string; reason?: string },
) {
  state.audit = [
    {
      id: uid("aud"),
      action,
      entity,
      entityId,
      userName,
      detail,
      beforeValue: extra?.beforeValue,
      afterValue: extra?.afterValue,
      reason: extra?.reason,
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

function accountSubtotal(account: AdAccount) {
  return account.items.reduce(
    (acc, it) => addPrices(acc, multiplyPrice(it.unitPrice, it.qty)),
    { usd: 0, bs: 0 },
  );
}

function accountTotals(account: AdAccount) {
  const sub = accountSubtotal(account);
  return {
    subtotal: sub,
    total: {
      usd: Number((sub.usd - (account.discountUsd || 0)).toFixed(2)),
      bs: Number((sub.bs - (account.discountBs || 0)).toFixed(2)),
    },
  };
}

function paidByCurrency(payments: AdPayment[]) {
  return payments.reduce(
    (acc, p) => {
      if (p.currency === "USD") acc.usd += p.amount;
      else acc.bs += p.amount;
      return acc;
    },
    { usd: 0, bs: 0 },
  );
}

function productName(id: string) {
  return state.products.find((p) => p.id === id)?.name ?? id;
}

function presentationName(id: string) {
  return state.presentations.find((p) => p.id === id)?.name ?? id;
}

function tableNumber(id?: string) {
  if (!id) return undefined;
  return state.tables.find((t) => t.id === id)?.number;
}

function buildReceiptFromSale(sale: AdSale): AdReceipt {
  return {
    id: uid("rcpt"),
    number: sale.receiptNumber,
    kind: "sale",
    saleId: sale.id,
    accountId: sale.accountId,
    customerId: sale.customerId,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    mesoneraName: sale.mesoneraName,
    cashierName: sale.cashierName ?? sale.userName,
    tableNumber: tableNumber(sale.tableId),
    items: sale.items.map((it) => ({
      productName: productName(it.productId),
      presentationName: presentationName(it.presentationId),
      qty: it.qty,
      unitPrice: it.unitPrice,
      lineTotal: multiplyPrice(it.unitPrice, it.qty),
    })),
    payments: sale.payments,
    subtotal: sale.subtotal,
    discountUsd: sale.discountUsd,
    discountBs: sale.discountBs,
    total: sale.total,
    paidUsd: paidByCurrency(sale.payments).usd,
    paidBs: paidByCurrency(sale.payments).bs,
    balanceUsd: Number(
      (sale.total.usd - paidByCurrency(sale.payments).usd).toFixed(2),
    ),
    notes: sale.notes,
    createdAt: sale.createdAt,
  };
}

function buildReceiptFromAccount(account: AdAccount): AdReceipt {
  const { subtotal, total } = accountTotals(account);
  const paid = paidByCurrency(account.payments);
  return {
    id: uid("rcpt"),
    number: account.receiptNumber ?? nextReceiptNumber(state.receiptSeq++),
    kind: "account",
    accountId: account.id,
    customerId: account.customerId,
    customerName: account.customerName,
    customerPhone: account.customerPhone,
    mesoneraName: account.mesoneraName,
    cashierName: account.cashierName,
    tableNumber: tableNumber(account.tableId),
    items: account.items.map((it) => ({
      productName: productName(it.productId),
      presentationName: presentationName(it.presentationId),
      qty: it.qty,
      qtyServed: it.qtyServed,
      unitPrice: it.unitPrice,
      lineTotal: multiplyPrice(it.unitPrice, it.qty),
    })),
    payments: account.payments,
    subtotal,
    discountUsd: account.discountUsd,
    discountBs: account.discountBs,
    total,
    paidUsd: paid.usd,
    paidBs: paid.bs,
    balanceUsd: Number((total.usd - paid.usd).toFixed(2)),
    notes: account.notes,
    createdAt: new Date().toISOString(),
  };
}

async function notifyWhatsApp(
  fn: () => Promise<AdWhatsAppLog | void>,
): Promise<void> {
  if (!state.settings.whatsappEnabled) return;
  try {
    const msg = await fn();
    if (msg) {
      state.whatsappLogs = [msg, ...state.whatsappLogs];
    }
  } catch {
    /* mock: no romper flujo operativo */
  }
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

  getPaymentMethods(activeOnly = false) {
    const list = [...state.paymentMethods].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return activeOnly ? list.filter((m) => m.active) : list;
  },

  updateSettings(patch: Partial<AdAppSettings>): AdResult {
    const before = JSON.stringify(state.settings);
    state.settings = { ...state.settings, ...patch };
    audit("config", "settings", "Admin A&D", "Actualizó configuración", undefined, {
      beforeValue: before,
      afterValue: JSON.stringify(state.settings),
    });
    emit();
    return { ok: true, data: undefined };
  },

  upsertPaymentMethod(
    method: AdPaymentMethodConfig,
  ): AdResult<AdPaymentMethodConfig> {
    const idx = state.paymentMethods.findIndex((m) => m.id === method.id);
    const before = idx >= 0 ? JSON.stringify(state.paymentMethods[idx]) : undefined;
    if (idx === -1) state.paymentMethods = [...state.paymentMethods, method];
    else {
      const next = [...state.paymentMethods];
      next[idx] = method;
      state.paymentMethods = next;
    }
    audit("upsert", "payment_method", "Admin A&D", method.name, method.id, {
      beforeValue: before,
      afterValue: JSON.stringify(method),
    });
    emit();
    return { ok: true, data: method };
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
    const before = idx >= 0 ? JSON.stringify(state.presentations[idx].price) : undefined;
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
      {
        beforeValue: before,
        afterValue: JSON.stringify(pres.price),
        reason: "Cambio de precio/presentación",
      },
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

    const stockBefore = getStock(input.productId, input.warehouseId);
    const outbound =
      input.type === "VENTA" ||
      input.type === "TRASLADO_SALIDA" ||
      input.type === "AJUSTE_SALIDA" ||
      input.type === "CONSUMO_CUENTA" ||
      input.type === "PERDIDA" ||
      input.type === "ROTURA";

    if (outbound) {
      if (qtyBase > stockBefore) {
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
    audit(input.type, "inventario", input.userName, input.reason ?? input.type, mov.id, {
      beforeValue: String(stockBefore),
      afterValue: String(getStock(input.productId, input.warehouseId)),
      reason: input.reason,
    });
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
    if (input.fromId === input.toId) {
      return { ok: false, error: "Depósitos origen y destino deben ser distintos" };
    }
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
    customerPhone?: string;
    prepaid?: boolean;
    notes?: string;
  }): AdResult<AdAccount> {
    const number = nextAccountNumber(state.accountSeq++);
    const customer = input.customerId
      ? state.customers.find((c) => c.id === input.customerId)
      : undefined;
    const account: AdAccount = {
      id: uid("acc"),
      number,
      tableId: input.tableId,
      mesoneraId: input.mesoneraId,
      mesoneraName: input.mesoneraName,
      customerId: input.customerId,
      customerName: input.customerName ?? customer?.name,
      customerPhone: input.customerPhone ?? customer?.phone,
      status: input.prepaid ? "PREPAGADA" : "ABIERTA",
      prepaid: Boolean(input.prepaid),
      items: [],
      payments: [],
      discountUsd: 0,
      discountBs: 0,
      notes: input.notes,
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

  updateAccountItemQty(input: {
    accountId: string;
    itemId: string;
    qty: number;
    userName: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    if (account.status === "CERRADA" || account.status === "CANCELADA") {
      return { ok: false, error: "Cuenta cerrada" };
    }
    const item = account.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false, error: "Ítem no encontrado" };
    if (input.qty < item.qtyServed) {
      return {
        ok: false,
        error: `No puede bajar de ${item.qtyServed} (ya servidas)`,
      };
    }
    const pres = state.presentations.find((p) => p.id === item.presentationId);
    if (!pres) return { ok: false, error: "Presentación no encontrada" };
    state.accounts = state.accounts.map((a) =>
      a.id !== account.id
        ? a
        : {
            ...a,
            updatedAt: new Date().toISOString(),
            items: a.items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    qty: input.qty,
                    qtyBase: toBaseUnits(pres, input.qty),
                  }
                : i,
            ),
          },
    );
    audit(
      "update_qty",
      "account",
      input.userName,
      `Ítem ${item.id} → ${input.qty}`,
      account.id,
      { beforeValue: String(item.qty), afterValue: String(input.qty) },
    );
    emit();
    return { ok: true, data: state.accounts.find((a) => a.id === account.id)! };
  },

  removeAccountItem(input: {
    accountId: string;
    itemId: string;
    userName: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    const item = account.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false, error: "Ítem no encontrado" };
    if (item.qtyServed > 0) {
      return { ok: false, error: "No se puede eliminar: ya hay productos servidos" };
    }
    state.accounts = state.accounts.map((a) =>
      a.id !== account.id
        ? a
        : {
            ...a,
            items: a.items.filter((i) => i.id !== item.id),
            updatedAt: new Date().toISOString(),
          },
    );
    audit("remove_item", "account", input.userName, item.id, account.id);
    emit();
    return { ok: true, data: state.accounts.find((a) => a.id === account.id)! };
  },

  addAccountItem(input: {
    accountId: string;
    productId: string;
    presentationId: string;
    qty: number;
    userName: string;
    /** false = dejar pendiente (no descuenta hasta servir). Default false en POS cuenta. */
    deductStock?: boolean;
    warehouseId?: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    if (
      account.status === "CERRADA" ||
      account.status === "CANCELADA" ||
      account.status === "PAGADA"
    ) {
      return { ok: false, error: "Cuenta no admite ítems" };
    }
    const pres = state.presentations.find((p) => p.id === input.presentationId);
    if (!pres) return { ok: false, error: "Presentación no encontrada" };
    const qtyBase = toBaseUnits(pres, input.qty);
    const warehouseId = input.warehouseId ?? "wh-2";
    const deduct = input.deductStock === true;

    if (deduct) {
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
      qtyServed: deduct ? input.qty : 0,
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
    warehouseId?: string;
  }): AdResult {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    if (account.status === "CERRADA" || account.status === "CANCELADA") {
      return { ok: false, error: "Cuenta cerrada" };
    }
    const item = account.items.find((i) => i.id === input.itemId);
    if (!item) return { ok: false, error: "Ítem no encontrado" };
    const available = item.qty - item.qtyServed;
    if (input.qty <= 0 || input.qty > available) {
      return { ok: false, error: `Solo hay ${available} pendientes de servir` };
    }
    const pres = state.presentations.find((p) => p.id === item.presentationId);
    if (!pres) return { ok: false, error: "Presentación no encontrada" };
    const qtyBase = toBaseUnits(pres, input.qty);
    const warehouseId = input.warehouseId ?? "wh-2";

    const mov = this.registerMovement({
      type: "CONSUMO_CUENTA",
      productId: item.productId,
      presentationId: item.presentationId,
      qtyPresentation: input.qty,
      warehouseId,
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

    const updated = state.accounts.find((a) => a.id === account.id)!;
    const pending = updated.items
      .filter((i) => i.qty > i.qtyServed)
      .map(
        (i) =>
          `${productName(i.productId)} (${presentationName(i.presentationId)}): ${i.qty - i.qtyServed}`,
      )
      .join("\n");
    if (pending && updated.customerPhone) {
      void notifyWhatsApp(() =>
        adWhatsAppService.send({
          toPhone: updated.customerPhone!,
          template: "pending_items",
          customerId: updated.customerId,
          body: adWhatsAppService.buildPendingItems({
            customerName: updated.customerName ?? "Cliente",
            accountNumber: updated.number,
            pendingSummary: pending,
          }),
        }),
      );
    }

    emit();
    return { ok: true, data: undefined };
  },

  addAccountPayment(input: {
    accountId: string;
    method: AdPaymentMethodCode;
    currency: "USD" | "BS";
    amount: number;
    userName: string;
    bank?: string;
    reference?: string;
    originPhone?: string;
    voucherNote?: string;
  }): AdResult {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    const cfg = state.paymentMethods.find((m) => m.code === input.method);
    if (cfg?.requiresBank && !input.bank?.trim()) {
      return { ok: false, error: "Este método requiere banco" };
    }
    if (cfg?.requiresReference && !input.reference?.trim()) {
      return { ok: false, error: "Este método requiere referencia" };
    }
    if (cfg?.requiresVoucher && !input.voucherNote?.trim()) {
      return { ok: false, error: "Este método requiere comprobante" };
    }
    const payment: AdPayment = {
      id: uid("pay"),
      method: input.method,
      currency: input.currency,
      amount: input.amount,
      bank: input.bank,
      reference: input.reference,
      originPhone: input.originPhone,
      voucherNote: input.voucherNote,
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
    audit("payment", "account", input.userName, `${input.method} ${input.amount}`, account.id, {
      beforeValue: JSON.stringify(account.payments.map((p) => p.id)),
      afterValue: JSON.stringify(payment),
      reason: input.reference ? `ref:${input.reference}` : undefined,
    });
    emit();
    return { ok: true, data: undefined };
  },

  applyDiscount(input: {
    accountId: string;
    discountUsd: number;
    discountBs: number;
    reason: string;
    userName: string;
    authorizedBy: string;
  }): AdResult<AdAccount> {
    if (!input.reason.trim()) {
      return { ok: false, error: "Motivo de descuento obligatorio" };
    }
    if (!input.authorizedBy.trim()) {
      return { ok: false, error: "Autorización requerida" };
    }
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    const before = `USD ${account.discountUsd} / Bs ${account.discountBs}`;
    state.accounts = state.accounts.map((a) =>
      a.id !== account.id
        ? a
        : {
            ...a,
            discountUsd: input.discountUsd,
            discountBs: input.discountBs,
            discountReason: `${input.reason} (auth: ${input.authorizedBy})`,
            updatedAt: new Date().toISOString(),
          },
    );
    audit(
      "discount",
      "account",
      input.userName,
      input.reason,
      account.id,
      {
        beforeValue: before,
        afterValue: `USD ${input.discountUsd} / Bs ${input.discountBs}`,
        reason: input.reason,
      },
    );
    emit();
    return { ok: true, data: state.accounts.find((a) => a.id === account.id)! };
  },

  reopenAccount(input: {
    accountId: string;
    userName: string;
    reason: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    if (account.status !== "CERRADA" && account.status !== "PAGADA") {
      return { ok: false, error: "Solo se reabren cuentas cerradas/pagadas" };
    }
    if (!input.reason.trim()) {
      return { ok: false, error: "Motivo obligatorio" };
    }
    // Anula ventas ligadas sin devolver stock: lo servido sigue fuera hasta voidAccount.
    for (const sale of state.sales.filter(
      (s) => s.accountId === account.id && s.status === "completed",
    )) {
      state.sales = state.sales.map((s) =>
        s.id === sale.id
          ? {
              ...s,
              status: "voided" as const,
              voidReason: `Reapertura cuenta #${account.number}: ${input.reason}`,
            }
          : s,
      );
      audit("void", "sale", input.userName, `Reapertura → anula ${sale.receiptNumber}`, sale.id, {
        beforeValue: "completed",
        afterValue: "voided_no_stock_restore",
        reason: input.reason,
      });
    }
    const reopened: AdAccount = {
      ...account,
      status: "ABIERTA",
      receiptNumber: undefined,
      closedAt: undefined,
      closedBy: undefined,
      notes: `${account.notes ?? ""}\nReabierta: ${input.reason}`.trim(),
      updatedAt: new Date().toISOString(),
    };
    state.accounts = state.accounts.map((a) =>
      a.id === account.id ? reopened : a,
    );
    if (account.tableId) {
      state.tables = state.tables.map((t) =>
        t.id === account.tableId ? { ...t, status: "cuenta_abierta" } : t,
      );
    }
    audit("reopen", "account", input.userName, input.reason, account.id, {
      beforeValue: account.status,
      afterValue: "ABIERTA",
      reason: input.reason,
    });
    emit();
    return { ok: true, data: reopened };
  },

  voidAccount(input: {
    accountId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
    warehouseId?: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    if (account.status === "CANCELADA") {
      return { ok: false, error: "Cuenta ya anulada" };
    }
    if (!input.reason.trim() || !input.authorizedBy.trim()) {
      return { ok: false, error: "Motivo y autorización obligatorios" };
    }
    const warehouseId = input.warehouseId ?? "wh-2";
    const servedSummary = account.items
      .filter((i) => i.qtyServed > 0)
      .map(
        (i) =>
          `${i.presentationId}:${i.qtyServed}/${i.qty}`,
      )
      .join(", ");

    // Solo lo SERVIDO salió del inventario → solo eso se devuelve vía kardex.
    for (const item of account.items) {
      if (item.qtyServed <= 0) continue;
      const mov = this.registerMovement({
        type: "DEVOLUCION",
        productId: item.productId,
        presentationId: item.presentationId,
        qtyPresentation: item.qtyServed,
        warehouseId,
        userName: input.userName,
        reason: `Anulación cuenta #${account.number}: ${input.reason}`,
        reference: account.id,
      });
      if (!mov.ok) return mov;
    }

    // Si hubo venta por cierre, anularla sin segunda devolución de stock.
    for (const sale of state.sales.filter(
      (s) => s.accountId === account.id && s.status === "completed",
    )) {
      state.sales = state.sales.map((s) =>
        s.id === sale.id
          ? {
              ...s,
              status: "voided" as const,
              voidReason: `Anulación cuenta #${account.number}: ${input.reason}`,
            }
          : s,
      );
      audit("void", "sale", input.userName, sale.receiptNumber, sale.id, {
        beforeValue: "completed",
        afterValue: "voided_via_account",
        reason: input.reason,
      });
    }

    const voided: AdAccount = {
      ...account,
      status: "CANCELADA",
      voidedAt: new Date().toISOString(),
      voidedBy: input.userName,
      voidReason: `${input.reason} (auth: ${input.authorizedBy})`,
      updatedAt: new Date().toISOString(),
    };
    state.accounts = state.accounts.map((a) =>
      a.id === account.id ? voided : a,
    );
    if (account.tableId) {
      state.tables = state.tables.map((t) =>
        t.id === account.tableId ? { ...t, status: "disponible" } : t,
      );
    }
    audit("void", "account", input.userName, input.reason, account.id, {
      beforeValue: `${account.status}|served:${servedSummary || "none"}`,
      afterValue: "CANCELADA",
      reason: input.reason,
    });
    emit();
    return { ok: true, data: voided };
  },

  closeAccount(input: {
    accountId: string;
    userName: string;
    notes?: string;
  }): AdResult<AdAccount> {
    const account = state.accounts.find((a) => a.id === input.accountId);
    if (!account) return { ok: false, error: "Cuenta no encontrada" };
    const receiptNumber = nextReceiptNumber(state.receiptSeq++);
    const closed: AdAccount = {
      ...account,
      status: "CERRADA",
      receiptNumber,
      cashierName: input.userName,
      closedAt: new Date().toISOString(),
      closedBy: input.userName,
      notes: input.notes ?? account.notes,
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

    const { subtotal, total } = accountTotals(closed);
    const sale: AdSale = {
      id: uid("sale"),
      receiptNumber,
      accountId: closed.id,
      tableId: closed.tableId,
      mesoneraName: closed.mesoneraName,
      cashierName: input.userName,
      customerId: closed.customerId,
      customerName: closed.customerName,
      customerPhone: closed.customerPhone,
      items: closed.items.map((it) => ({
        productId: it.productId,
        presentationId: it.presentationId,
        qty: it.qty,
        unitPrice: it.unitPrice,
        qtyBase: it.qtyBase,
      })),
      payments: closed.payments,
      subtotal,
      discountUsd: closed.discountUsd,
      discountBs: closed.discountBs,
      total,
      warehouseId: "wh-2",
      userName: input.userName,
      status: "completed",
      notes: closed.notes,
      createdAt: closed.closedAt!,
    };
    state.sales = [sale, ...state.sales];
    const receipt = buildReceiptFromAccount(closed);
    receipt.number = receiptNumber;
    receipt.saleId = sale.id;
    state.receipts = [receipt, ...state.receipts];

    if (closed.customerPhone) {
      void notifyWhatsApp(() =>
        adWhatsAppService.send({
          toPhone: closed.customerPhone!,
          template: "account_closed",
          customerId: closed.customerId,
          receiptNumber,
          body: adWhatsAppService.buildAccountClosed({
            customerName: closed.customerName ?? "Cliente",
            receiptNumber,
            totalUsd: total.usd,
          }),
        }),
      );
    }

    audit("close", "account", input.userName, `Cerró #${account.number} → ${receiptNumber}`, account.id, {
      beforeValue: account.status,
      afterValue: `CERRADA|${receiptNumber}|totalUsd=${total.usd}`,
    });
    audit("venta", "pos", input.userName, `${receiptNumber} $${sale.total.usd}`, sale.id, {
      beforeValue: undefined,
      afterValue: JSON.stringify({
        receiptNumber,
        total: sale.total,
        payments: sale.payments.length,
      }),
    });
    emit();
    return { ok: true, data: closed };
  },

  createPrepaid(input: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    items: {
      productId: string;
      presentationId: string;
      qty: number;
    }[];
    payments?: Omit<AdPayment, "id" | "createdAt">[];
    userName: string;
  }): AdResult<AdPrepaidAccount> {
    if (!input.items.length) return { ok: false, error: "Agregue productos" };
    const customer = input.customerId
      ? state.customers.find((c) => c.id === input.customerId)
      : undefined;
    const phone = input.customerPhone ?? customer?.phone;
    if (!phone?.trim()) {
      return { ok: false, error: "Teléfono del cliente obligatorio" };
    }
    const code = nextPrepaidCode(state.prepaidSeq++);
    const token = `ad_qr_${code.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${uid("t").slice(-4)}`;
    const receiptNumber = nextReceiptNumber(state.receiptSeq++);
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
        reference: code,
      });
      if (!mov.ok) return mov;
    }

    const prepaid: AdPrepaidAccount = {
      id: uid("pp"),
      code,
      qrToken: token,
      receiptNumber,
      customerId: input.customerId,
      customerName: input.customerName ?? customer?.name,
      customerPhone: phone,
      status: "ACTIVO",
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.prepaids = [prepaid, ...state.prepaids];

    const subtotal = items.reduce(
      (acc, it) => addPrices(acc, multiplyPrice(it.unitPrice, it.qtyPurchased)),
      { usd: 0, bs: 0 },
    );
    const payments: AdPayment[] = (input.payments ?? []).map((p) => ({
      ...p,
      id: uid("pay"),
      createdAt: new Date().toISOString(),
    }));
    const receipt: AdReceipt = {
      id: uid("rcpt"),
      number: receiptNumber,
      kind: "prepaid",
      prepaidId: prepaid.id,
      customerId: prepaid.customerId,
      customerName: prepaid.customerName,
      customerPhone: prepaid.customerPhone,
      cashierName: input.userName,
      items: items.map((it) => ({
        productName: productName(it.productId),
        presentationName: presentationName(it.presentationId),
        qty: it.qtyPurchased,
        unitPrice: it.unitPrice,
        lineTotal: multiplyPrice(it.unitPrice, it.qtyPurchased),
      })),
      payments,
      subtotal,
      discountUsd: 0,
      discountBs: 0,
      total: subtotal,
      paidUsd: paidByCurrency(payments).usd,
      paidBs: paidByCurrency(payments).bs,
      balanceUsd: 0,
      createdAt: prepaid.createdAt,
    };
    state.receipts = [receipt, ...state.receipts];

    const balanceSummary = items
      .map(
        (it) =>
          `${productName(it.productId)}: ${it.qtyPurchased} pendientes`,
      )
      .join("\n");
    void notifyWhatsApp(() =>
      adWhatsAppService.send({
        toPhone: phone,
        template: "prepaid_balance",
        customerId: prepaid.customerId,
        receiptNumber,
        body: adWhatsAppService.buildPrepaidBalance({
          customerName: prepaid.customerName ?? "Cliente",
          code,
          balanceSummary,
        }),
      }),
    );

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

    const before = available;
    const qtyBase = item.qtyBasePerUnit * input.qty;
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

    if (prepaid.customerPhone) {
      void notifyWhatsApp(() =>
        adWhatsAppService.send({
          toPhone: prepaid.customerPhone!,
          template: "prepaid_consume",
          customerId: prepaid.customerId,
          receiptNumber: prepaid.receiptNumber,
          body: adWhatsAppService.buildPrepaidConsume({
            customerName: prepaid.customerName ?? "Cliente",
            code: prepaid.code,
            before,
            consumed: input.qty,
            after: before - input.qty,
            productName: productName(input.productId),
          }),
        }),
      );
    }

    audit(
      "consume",
      "prepaid",
      input.mesoneraName,
      `${prepaid.code} −${input.qty}`,
      prepaid.id,
      {
        beforeValue: String(before),
        afterValue: String(before - input.qty),
      },
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

  findReceipt(numberOrId: string): AdReceipt | undefined {
    const q = numberOrId.trim().toLowerCase();
    return state.receipts.find(
      (r) => r.number.toLowerCase() === q || r.id.toLowerCase() === q,
    );
  },

  completeSale(input: {
    items: AdSaleItem[];
    payments: Omit<AdPayment, "id" | "createdAt">[];
    warehouseId: string;
    userName: string;
    tableId?: string;
    mesoneraName?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    accountId?: string;
    discountUsd?: number;
    discountBs?: number;
    notes?: string;
  }): AdResult<AdSale> {
    if (!input.items.length) return { ok: false, error: "Agregue productos" };
    if (!input.payments.length) return { ok: false, error: "Registre pagos" };

    for (const pay of input.payments) {
      const cfg = state.paymentMethods.find((m) => m.code === pay.method);
      if (cfg?.requiresBank && !pay.bank?.trim()) {
        return { ok: false, error: `${cfg.name}: requiere banco` };
      }
      if (cfg?.requiresReference && !pay.reference?.trim()) {
        return { ok: false, error: `${cfg.name}: requiere referencia` };
      }
    }

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

    const customer = input.customerId
      ? state.customers.find((c) => c.id === input.customerId)
      : undefined;
    const subtotal = input.items.reduce(
      (acc, l) => addPrices(acc, multiplyPrice(l.unitPrice, l.qty)),
      { usd: 0, bs: 0 },
    );
    const discountUsd = input.discountUsd ?? 0;
    const discountBs = input.discountBs ?? 0;
    const total = {
      usd: Number((subtotal.usd - discountUsd).toFixed(2)),
      bs: Number((subtotal.bs - discountBs).toFixed(2)),
    };
    const payments: AdPayment[] = input.payments.map((p) => ({
      ...p,
      id: uid("pay"),
      createdAt: new Date().toISOString(),
    }));
    const receiptNumber = nextReceiptNumber(state.receiptSeq++);
    const sale: AdSale = {
      id: uid("sale"),
      receiptNumber,
      accountId: input.accountId,
      tableId: input.tableId,
      mesoneraName: input.mesoneraName,
      cashierName: input.userName,
      customerId: input.customerId,
      customerName: input.customerName ?? customer?.name,
      customerPhone: input.customerPhone ?? customer?.phone,
      items: input.items,
      payments,
      subtotal,
      discountUsd,
      discountBs,
      total,
      warehouseId: input.warehouseId,
      userName: input.userName,
      status: "completed",
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    state.sales = [sale, ...state.sales];
    const receipt = buildReceiptFromSale(sale);
    state.receipts = [receipt, ...state.receipts];

    if (sale.customerPhone) {
      const itemsSummary = sale.items
        .map(
          (it) =>
            `${productName(it.productId)} ${presentationName(it.presentationId)} x${it.qty}`,
        )
        .join("\n");
      const paymentSummary = payments
        .map((p) => `${p.method} ${p.currency} ${p.amount}`)
        .join(" + ");
      void notifyWhatsApp(() =>
        adWhatsAppService.send({
          toPhone: sale.customerPhone!,
          template: "purchase_thanks",
          customerId: sale.customerId,
          receiptNumber,
          body: adWhatsAppService.buildPurchaseThanks({
            customerName: sale.customerName ?? "Cliente",
            receiptNumber,
            totalUsd: total.usd,
            totalBs: total.bs,
            paymentSummary,
            itemsSummary,
          }),
        }),
      );
    }

    audit("venta", "pos", input.userName, `${receiptNumber} $${sale.total.usd}`, sale.id, {
      afterValue: JSON.stringify({
        receiptNumber,
        total: sale.total,
        payments: sale.payments.length,
        customerId: sale.customerId,
      }),
    });
    emit();
    return { ok: true, data: sale };
  },

  voidSale(input: {
    saleId: string;
    userName: string;
    reason: string;
    authorizedBy: string;
  }): AdResult<AdSale> {
    const sale = state.sales.find((s) => s.id === input.saleId);
    if (!sale) return { ok: false, error: "Venta no encontrada" };
    if (sale.status === "voided") return { ok: false, error: "Ya anulada" };
    if (!input.reason.trim() || !input.authorizedBy.trim()) {
      return { ok: false, error: "Motivo y autorización obligatorios" };
    }

    const account = sale.accountId
      ? state.accounts.find((a) => a.id === sale.accountId)
      : undefined;

    // POS directo: devolver ítems de la venta.
    // Venta desde cuenta: solo lo SERVIDO (pendiente nunca salió del inventario).
    if (account) {
      for (const item of account.items) {
        if (item.qtyServed <= 0) continue;
        const mov = this.registerMovement({
          type: "DEVOLUCION",
          productId: item.productId,
          presentationId: item.presentationId,
          qtyPresentation: item.qtyServed,
          warehouseId: sale.warehouseId,
          userName: input.userName,
          reason: `Anulación ${sale.receiptNumber}: ${input.reason}`,
          reference: sale.id,
        });
        if (!mov.ok) return mov;
      }
      if (account.status !== "CANCELADA") {
        state.accounts = state.accounts.map((a) =>
          a.id === account.id
            ? {
                ...a,
                status: "CANCELADA" as const,
                voidedAt: new Date().toISOString(),
                voidedBy: input.userName,
                voidReason: `${input.reason} (auth: ${input.authorizedBy})`,
                updatedAt: new Date().toISOString(),
              }
            : a,
        );
      }
    } else {
      for (const line of sale.items) {
        const mov = this.registerMovement({
          type: "DEVOLUCION",
          productId: line.productId,
          presentationId: line.presentationId,
          qtyPresentation: line.qty,
          warehouseId: sale.warehouseId,
          userName: input.userName,
          reason: `Anulación ${sale.receiptNumber}: ${input.reason}`,
          reference: sale.id,
        });
        if (!mov.ok) return mov;
      }
    }

    const voided: AdSale = {
      ...sale,
      status: "voided",
      voidReason: `${input.reason} (auth: ${input.authorizedBy})`,
    };
    state.sales = state.sales.map((s) => (s.id === sale.id ? voided : s));
    audit("void", "sale", input.userName, input.reason, sale.id, {
      beforeValue: JSON.stringify({
        status: "completed",
        total: sale.total,
        items: sale.items.length,
      }),
      afterValue: "voided",
      reason: input.reason,
    });
    emit();
    return { ok: true, data: voided };
  },

  upsertCustomer(customer: AdCustomer): AdResult<AdCustomer> {
    if (!customer.phone?.trim()) {
      return { ok: false, error: "Teléfono obligatorio" };
    }
    if (!customer.firstName?.trim() || !customer.lastName?.trim()) {
      return { ok: false, error: "Nombre y apellido obligatorios" };
    }
    const normalized: AdCustomer = {
      ...customer,
      name: customerDisplayName(customer.firstName, customer.lastName),
      phone: customer.phone.trim(),
    };
    const idx = state.customers.findIndex((c) => c.id === normalized.id);
    if (idx === -1) state.customers = [normalized, ...state.customers];
    else {
      const next = [...state.customers];
      next[idx] = normalized;
      state.customers = next;
    }
    audit("upsert", "customer", "Admin A&D", normalized.name, normalized.id);
    emit();
    return { ok: true, data: normalized };
  },

  createPurchase(input: {
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
    paymentMethod?: AdPaymentMethodCode;
    reference?: string;
    userName: string;
    notes?: string;
  }): AdResult<AdPurchase> {
    if (!input.items.length) return { ok: false, error: "Agregue productos" };
    const items: AdPurchaseItem[] = [];
    for (const raw of input.items) {
      const pres = state.presentations.find((p) => p.id === raw.presentationId);
      if (!pres) return { ok: false, error: "Presentación no encontrada" };
      const qtyBase = toBaseUnits(pres, raw.qty);
      const unitCost = { usd: raw.unitCostUsd, bs: raw.unitCostBs };
      items.push({
        id: uid("puri"),
        productId: raw.productId,
        presentationId: raw.presentationId,
        qty: raw.qty,
        qtyBase,
        unitCost,
        lineCost: multiplyPrice(unitCost, raw.qty),
      });
      const mov = this.registerMovement({
        type: "COMPRA",
        productId: raw.productId,
        presentationId: raw.presentationId,
        qtyPresentation: raw.qty,
        warehouseId: input.warehouseId,
        userName: input.userName,
        reason: `Compra ${input.invoiceNumber}`,
        reference: input.invoiceNumber,
      });
      if (!mov.ok) return mov;
    }
    const totalCost = items.reduce(
      (acc, it) => addPrices(acc, it.lineCost),
      { usd: 0, bs: 0 },
    );
    const purchase: AdPurchase = {
      id: uid("pur"),
      supplierName: input.supplierName,
      invoiceNumber: input.invoiceNumber || `FAC-${state.purchaseSeq++}`,
      date: input.date,
      warehouseId: input.warehouseId,
      items,
      totalCost,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      userName: input.userName,
      createdAt: new Date().toISOString(),
      notes: input.notes,
    };
    state.purchases = [purchase, ...state.purchases];
    audit("create", "purchase", input.userName, purchase.invoiceNumber, purchase.id);
    emit();
    return { ok: true, data: purchase };
  },

  createDailyClosure(input: {
    userName: string;
    countedCashUsd: number;
    countedCashBs: number;
    notes?: string;
  }): AdResult<AdDailyClosure> {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = state.sales.filter(
      (s) => s.createdAt.slice(0, 10) === today && s.status === "completed",
    );
    const voidedCount = state.sales.filter(
      (s) => s.createdAt.slice(0, 10) === today && s.status === "voided",
    ).length;

    const byMethod: AdDailyClosure["byMethod"] = {};
    let expectedCashUsd = 0;
    let expectedCashBs = 0;
    let collectedUsd = 0;
    let collectedBs = 0;
    let discountUsd = 0;

    for (const sale of todaySales) {
      discountUsd += sale.discountUsd;
      for (const pay of sale.payments) {
        const cur = byMethod[pay.method] ?? { usd: 0, bs: 0 };
        if (pay.currency === "USD") {
          cur.usd += pay.amount;
          collectedUsd += pay.amount;
          if (pay.method === "efectivo_usd") expectedCashUsd += pay.amount;
        } else {
          cur.bs += pay.amount;
          collectedBs += pay.amount;
          if (pay.method === "efectivo_bs") expectedCashBs += pay.amount;
        }
        byMethod[pay.method] = cur;
      }
    }

    const byMesoneraMap = new Map<
      string,
      { name: string; salesCount: number; totalUsd: number }
    >();
    for (const sale of todaySales) {
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

    const openAccounts = state.accounts.filter(
      (a) =>
        a.status === "ABIERTA" ||
        a.status === "PREPAGADA" ||
        a.status === "PARCIALMENTE_PAGADA",
    );
    const pendingUsd = openAccounts.reduce((acc, a) => {
      const { total } = accountTotals(a);
      return acc + Math.max(0, total.usd - paidByCurrency(a.payments).usd);
    }, 0);

    const closure: AdDailyClosure = {
      id: uid("dclose"),
      date: today,
      salesCount: todaySales.length,
      totalUsd: todaySales.reduce((a, s) => a + s.total.usd, 0),
      totalBs: todaySales.reduce((a, s) => a + s.total.bs, 0),
      collectedUsd,
      collectedBs,
      pendingUsd: Number(pendingUsd.toFixed(2)),
      discountUsd,
      voidedCount,
      expectedCashUsd,
      countedCashUsd: input.countedCashUsd,
      cashDifferenceUsd: Number(
        (input.countedCashUsd - expectedCashUsd).toFixed(2),
      ),
      expectedCashBs,
      countedCashBs: input.countedCashBs,
      cashDifferenceBs: Number(
        (input.countedCashBs - expectedCashBs).toFixed(2),
      ),
      openAccounts: openAccounts.length,
      closedAccounts: state.accounts.filter(
        (a) => a.status === "CERRADA" && a.closedAt?.slice(0, 10) === today,
      ).length,
      prepaidsActive: state.prepaids.filter((p) => p.status === "ACTIVO")
        .length,
      byMethod,
      byMesonera: [...byMesoneraMap.values()],
      createdAt: new Date().toISOString(),
      createdBy: input.userName,
      notes: input.notes,
    };
    state.dailyClosures = [closure, ...state.dailyClosures];
    audit("daily_close", "closure", input.userName, closure.date, closure.id, {
      afterValue: JSON.stringify({
        expectedCashUsd,
        countedCashUsd: input.countedCashUsd,
        diff: closure.cashDifferenceUsd,
      }),
    });
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
    audit("inv_close", "closure", input.createdBy, "Conteo físico", closure.id, {
      afterValue: JSON.stringify({
        lines: input.lines.length,
        diffs: input.lines.filter((l) => l.differenceBase !== 0).length,
        applyAdjustments: Boolean(input.applyAdjustments),
      }),
    });
    emit();
    return { ok: true, data: closure };
  },

  /** Snapshot de cliente para detalle UI / futura WhatsApp API. */
  getCustomerSummary(customerId: string) {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return undefined;
    const sales = state.sales.filter(
      (s) => s.customerId === customerId && s.status === "completed",
    );
    const accounts = state.accounts.filter((a) => a.customerId === customerId);
    const openAccounts = accounts.filter(
      (a) =>
        a.status === "ABIERTA" ||
        a.status === "PREPAGADA" ||
        a.status === "PARCIALMENTE_PAGADA",
    );
    const receipts = state.receipts.filter((r) => r.customerId === customerId);
    const prepaids = state.prepaids.filter((p) => p.customerId === customerId);
    const payments = [
      ...sales.flatMap((s) => s.payments),
      ...accounts.flatMap((a) => a.payments),
    ];
    const pendingMerchandise = openAccounts.flatMap((a) =>
      a.items
        .filter((i) => i.qty > i.qtyServed)
        .map((i) => ({
          accountNumber: a.number,
          productId: i.productId,
          presentationId: i.presentationId,
          requested: i.qty,
          served: i.qtyServed,
          pending: i.qty - i.qtyServed,
        })),
    );
    const pendingBalanceUsd = openAccounts.reduce((acc, a) => {
      const { total } = accountTotals(a);
      const paid = paidByCurrency(a.payments).usd;
      return acc + Math.max(0, total.usd - paid);
    }, 0);
    const totalPurchasedUsd = sales.reduce((a, s) => a + s.total.usd, 0);
    const lastSale = [...sales].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    )[0];
    return {
      customer,
      sales,
      accounts,
      receipts,
      payments,
      prepaids,
      pendingMerchandise,
      whatsappLogs: state.whatsappLogs.filter((w) => w.customerId === customerId),
      totals: {
        totalPurchasedUsd: Number(totalPurchasedUsd.toFixed(2)),
        pendingBalanceUsd: Number(pendingBalanceUsd.toFixed(2)),
        lastPurchaseAt: lastSale?.createdAt,
        lastPurchaseReceipt: lastSale?.receiptNumber,
        openAccounts: openAccounts.length,
        activePrepaids: prepaids.filter((p) => p.status === "ACTIVO").length,
      },
    };
  },
};

