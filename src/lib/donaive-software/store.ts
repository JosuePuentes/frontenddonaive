/** Tasas, productos y compras — persistencia local offline-first. */

import type { CppState } from "@/lib/donaive-software/cpp";
import { applyWeightedCpp } from "@/lib/donaive-software/cpp";
import type {
  DsCashClosure,
  DsClient,
  DsPayable,
  DsProduct,
  DsPurchase,
  DsReceivable,
  DsSale,
  DsStockMovement,
  DsSupplier,
  DsGeneralInventoryState,
  DsGeneralInventoryMovement,
  DsFiscalSettings,
  DsBank,
  DsBankMovement,
  DsCashSession,
} from "@/types/donaive-software";

export type {
  DsCashClosure,
  DsClient,
  DsPayable,
  DsProduct,
  DsPurchase,
  DsReceivable,
  DsSale,
  DsStockMovement,
  DsSupplier,
  DsGeneralInventoryState,
  DsGeneralInventoryMovement,
  DsFiscalSettings,
};

export type DsRatesState = {
  bcv: number;
  protectedRate: number;
  updatedAt: string;
};

/** @deprecated usar DsProduct */
export type DsProductDemo = DsProduct;

const RATES_KEY = "donaive-software-rates-v1";
const PRODUCTS_KEY = "donaive-software-products-v1";
const PURCHASES_KEY = "donaive-software-purchases-v1";
const SALES_KEY = "donaive-software-sales-v1";
const CLOSURES_KEY = "donaive-software-closures-v1";
const MOVEMENTS_KEY = "donaive-software-movements-v1";
const CLIENTS_KEY = "donaive-software-clients-v1";
const SUPPLIERS_KEY = "donaive-software-suppliers-v1";
const PAYABLES_KEY = "donaive-software-payables-v1";
const RECEIVABLES_KEY = "donaive-software-receivables-v1";
const GENERAL_STOCK_KEY = "donaive-software-general-stock-v1";
const GENERAL_MOVEMENTS_KEY = "donaive-software-general-movements-v1";
const FISCAL_SETTINGS_KEY = "donaive-software-fiscal-settings-v1";
const BANKS_KEY = "donaive-software-banks-v1";
const BANK_MOVEMENTS_KEY = "donaive-software-bank-movements-v1";
const CASH_SESSIONS_KEY = "donaive-software-cash-sessions-v1";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProduct(raw: Partial<DsProduct> & { id: string }): DsProduct {
  return {
    id: raw.id,
    name: raw.name ?? "Producto",
    sku: raw.sku ?? raw.id,
    barcode: raw.barcode,
    unitsPerBox: Math.max(1, Number(raw.unitsPerBox) || 1),
    taxable: raw.taxable ?? false,
    utilityPercent: Number(raw.utilityPercent) || 30,
    stock: {
      qtyBase: Number(raw.stock?.qtyBase) || 0,
      unitCostUsd: Number(raw.stock?.unitCostUsd) || 0,
    },
    saleUnitUsd: raw.saleUnitUsd,
    saleBoxUsd: raw.saleBoxUsd,
    minQtyBase: raw.minQtyBase,
    maxQtyBase: raw.maxQtyBase,
    preferredSupplierId: raw.preferredSupplierId,
  };
}

export function loadRates(): DsRatesState {
  const fallback: DsRatesState = {
    bcv: 772.54,
    protectedRate: 870,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as DsRatesState) };
  } catch {
    return fallback;
  }
}

export function saveRates(rates: DsRatesState): void {
  localStorage.setItem(RATES_KEY, JSON.stringify(rates));
}

function defaultProducts(): DsProduct[] {
  return [
    normalizeProduct({
      id: "p1",
      name: "Producto demo A",
      sku: "DEMO-A",
      unitsPerBox: 24,
      taxable: true,
      utilityPercent: 30,
      stock: { qtyBase: 48, unitCostUsd: 1.25 },
      saleUnitUsd: 1.79,
      saleBoxUsd: 42.86,
    }),
    normalizeProduct({
      id: "p2",
      name: "Producto demo B",
      sku: "DEMO-B",
      unitsPerBox: 12,
      taxable: false,
      utilityPercent: 25,
      stock: { qtyBase: 10, unitCostUsd: 3.4 },
      saleUnitUsd: 4.53,
      saleBoxUsd: 54.4,
    }),
  ];
}

export function loadProducts(): DsProduct[] {
  if (typeof window === "undefined") return defaultProducts();
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return defaultProducts();
    const parsed = JSON.parse(raw) as Partial<DsProduct>[];
    return parsed.map((p) => normalizeProduct(p as DsProduct));
  } catch {
    return defaultProducts();
  }
}

export function saveProducts(products: DsProduct[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function loadPurchases(): DsPurchase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DsPurchase[];
    return parsed.map((p) => ({
      ...p,
      paymentCondition: p.paymentCondition ?? "CONTADO",
      extraTaxes: p.extraTaxes ?? [],
    }));
  } catch {
    return [];
  }
}

export function savePurchases(purchases: DsPurchase[]): void {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
}

export function appendPurchase(purchase: DsPurchase): DsPurchase[] {
  const list = [purchase, ...loadPurchases()];
  savePurchases(list);
  return list;
}

export function receiveStock(
  products: DsProduct[],
  productId: string,
  qtyBase: number,
  unitCostUsd: number,
): DsProduct[] {
  return products.map((p) => {
    if (p.id !== productId) return p;
    return {
      ...p,
      stock: applyWeightedCpp(p.stock, qtyBase, unitCostUsd),
    };
  });
}

export type UpsertProductInput = {
  id?: string;
  name: string;
  sku: string;
  barcode?: string;
  unitsPerBox: number;
  taxable: boolean;
  utilityPercent: number;
};

export function upsertProduct(
  products: DsProduct[],
  input: UpsertProductInput,
): { ok: true; products: DsProduct[]; product: DsProduct } | { ok: false; error: string } {
  const sku = input.sku.trim().toUpperCase();
  const name = input.name.trim();
  if (!sku) return { ok: false, error: "Indique el SKU" };
  if (!name) return { ok: false, error: "Indique el nombre" };
  const upp = Math.max(1, Number(input.unitsPerBox) || 1);

  const dup = products.find(
    (p) => p.sku.toUpperCase() === sku && p.id !== input.id,
  );
  if (dup) return { ok: false, error: "Ya existe un producto con ese SKU" };

  if (input.id) {
    const idx = products.findIndex((p) => p.id === input.id);
    if (idx < 0) return { ok: false, error: "Producto no encontrado" };
    const prev = products[idx];
    const updated = normalizeProduct({
      ...prev,
      name,
      sku,
      barcode: input.barcode?.trim() || undefined,
      unitsPerBox: upp,
      taxable: input.taxable,
      utilityPercent: input.utilityPercent,
    });
    const next = [...products];
    next[idx] = updated;
    saveProducts(next);
    return { ok: true, products: next, product: updated };
  }

  const created = normalizeProduct({
    id: uid("p"),
    name,
    sku,
    barcode: input.barcode?.trim() || undefined,
    unitsPerBox: upp,
    taxable: input.taxable,
    utilityPercent: input.utilityPercent,
    stock: { qtyBase: 0, unitCostUsd: 0 },
  });
  const next = [...products, created];
  saveProducts(next);
  return { ok: true, products: next, product: created };
}

export function loadSales(): DsSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SALES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DsSale[];
  } catch {
    return [];
  }
}

export function saveSales(sales: DsSale[]): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function appendSale(sale: DsSale): DsSale[] {
  const list = [sale, ...loadSales()];
  saveSales(list);
  return list;
}

export function loadClosures(): DsCashClosure[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLOSURES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DsCashClosure[];
  } catch {
    return [];
  }
}

export function saveClosures(closures: DsCashClosure[]): void {
  localStorage.setItem(CLOSURES_KEY, JSON.stringify(closures));
}

export function appendClosure(closure: DsCashClosure): DsCashClosure[] {
  const list = [closure, ...loadClosures()];
  saveClosures(list);
  return list;
}

export function loadMovements(): DsStockMovement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MOVEMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DsStockMovement[];
  } catch {
    return [];
  }
}

export function saveMovements(movements: DsStockMovement[]): void {
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

export function appendMovements(newOnes: DsStockMovement[]): DsStockMovement[] {
  const list = [...newOnes, ...loadMovements()];
  saveMovements(list);
  return list;
}

function loadJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function loadJsonObject<T extends object>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

export function loadClients(): DsClient[] {
  return loadJsonArray<DsClient>(CLIENTS_KEY);
}

export function saveClients(clients: DsClient[]): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function normalizeSupplier(raw: Partial<DsSupplier> & { id: string }): DsSupplier {
  return {
    id: raw.id,
    name: raw.name ?? "Proveedor",
    identification: raw.identification,
    phone: raw.phone,
    contactName: raw.contactName,
    defaultCurrency: raw.defaultCurrency === "USD" ? "USD" : "BS",
    creditDays: Math.max(0, Number(raw.creditDays) || 0),
    creditLimit: Math.max(0, Number(raw.creditLimit) || 0),
    leadTimeDays: Math.max(1, Number(raw.leadTimeDays) || 3),
    productIds: Array.isArray(raw.productIds) ? raw.productIds : [],
    notes: raw.notes,
    active: raw.active !== false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export function loadSuppliers(): DsSupplier[] {
  return loadJsonArray<DsSupplier>(SUPPLIERS_KEY).map((s) =>
    normalizeSupplier(s),
  );
}

export function saveSuppliers(suppliers: DsSupplier[]): void {
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
}

export function loadPayables(): DsPayable[] {
  return loadJsonArray<DsPayable>(PAYABLES_KEY);
}

export function savePayables(payables: DsPayable[]): void {
  localStorage.setItem(PAYABLES_KEY, JSON.stringify(payables));
}

export function appendPayable(payable: DsPayable): DsPayable[] {
  const list = [payable, ...loadPayables()];
  savePayables(list);
  return list;
}

export function loadReceivables(): DsReceivable[] {
  return loadJsonArray<DsReceivable>(RECEIVABLES_KEY);
}

export function saveReceivables(receivables: DsReceivable[]): void {
  localStorage.setItem(RECEIVABLES_KEY, JSON.stringify(receivables));
}

export function appendReceivable(receivable: DsReceivable): DsReceivable[] {
  const list = [receivable, ...loadReceivables()];
  saveReceivables(list);
  return list;
}

export function loadGeneralInventory(): DsGeneralInventoryState {
  const stockByProduct = loadJsonObject<Record<string, number>>(GENERAL_STOCK_KEY, {});
  const movements = loadJsonArray<DsGeneralInventoryMovement>(GENERAL_MOVEMENTS_KEY);
  return { stockByProduct, movements };
}

export function saveGeneralInventory(state: DsGeneralInventoryState): void {
  localStorage.setItem(GENERAL_STOCK_KEY, JSON.stringify(state.stockByProduct));
  localStorage.setItem(GENERAL_MOVEMENTS_KEY, JSON.stringify(state.movements));
}

export function applyGeneralInventoryMovement(
  state: DsGeneralInventoryState,
  movement: DsGeneralInventoryMovement,
): DsGeneralInventoryState {
  const current = Math.max(0, Number(state.stockByProduct[movement.productId]) || 0);
  const nextQty = Math.max(0, current + movement.qtyBase);
  return {
    stockByProduct: {
      ...state.stockByProduct,
      [movement.productId]: nextQty,
    },
    movements: [movement, ...state.movements],
  };
}

export function loadFiscalSettings(): DsFiscalSettings {
  return loadJsonObject<DsFiscalSettings>(FISCAL_SETTINGS_KEY, {
    pinHash: null,
    updatedAt: new Date().toISOString(),
  });
}

export function saveFiscalSettings(settings: DsFiscalSettings): void {
  localStorage.setItem(FISCAL_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadBanks(): DsBank[] {
  const list = loadJsonArray<DsBank>(BANKS_KEY);
  if (list.length) return list;
  const seeded = [
    {
      id: "bank-caja-usd",
      name: "Caja efectivo USD",
      currency: "USD" as const,
      paymentMethods: ["efectivo_usd" as const],
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "bank-caja-bs",
      name: "Caja efectivo Bs",
      currency: "BS" as const,
      paymentMethods: ["efectivo_bs" as const],
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
  if (typeof window !== "undefined") saveBanks(seeded);
  return seeded;
}

export function saveBanks(banks: DsBank[]): void {
  localStorage.setItem(BANKS_KEY, JSON.stringify(banks));
}

export function loadBankMovements(): DsBankMovement[] {
  return loadJsonArray<DsBankMovement>(BANK_MOVEMENTS_KEY);
}

export function saveBankMovements(movements: DsBankMovement[]): void {
  localStorage.setItem(BANK_MOVEMENTS_KEY, JSON.stringify(movements));
}

export function appendBankMovements(
  extra: DsBankMovement[],
): DsBankMovement[] {
  const list = [...extra, ...loadBankMovements()];
  saveBankMovements(list);
  return list;
}

export function loadCashSessions(): DsCashSession[] {
  return loadJsonArray<DsCashSession>(CASH_SESSIONS_KEY);
}

export function saveCashSessions(sessions: DsCashSession[]): void {
  localStorage.setItem(CASH_SESSIONS_KEY, JSON.stringify(sessions));
}

export type { CppState };
