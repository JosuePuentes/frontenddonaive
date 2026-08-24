/** Tasas, productos y compras — persistencia local offline-first. */

import type { CppState } from "@/lib/donaive-software/cpp";
import { applyWeightedCpp } from "@/lib/donaive-software/cpp";
import type {
  DsCashClosure,
  DsProduct,
  DsPurchase,
  DsSale,
  DsStockMovement,
} from "@/types/donaive-software";

export type { DsCashClosure, DsProduct, DsPurchase, DsSale, DsStockMovement };

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
    return JSON.parse(raw) as DsPurchase[];
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

export type { CppState };
