/** Tasas y demo de productos — persistencia local offline-first. */

import type { CppState } from "@/lib/donaive-software/cpp";
import { applyWeightedCpp } from "@/lib/donaive-software/cpp";

export type DsRatesState = {
  bcv: number;
  protectedRate: number;
  updatedAt: string;
};

export type DsProductDemo = {
  id: string;
  name: string;
  sku: string;
  unitsPerBox: number;
  stock: CppState;
};

const RATES_KEY = "donaive-software-rates-v1";
const PRODUCTS_KEY = "donaive-software-products-v1";

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

function defaultProducts(): DsProductDemo[] {
  return [
    {
      id: "p1",
      name: "Producto demo A",
      sku: "DEMO-A",
      unitsPerBox: 24,
      stock: { qtyBase: 48, unitCostUsd: 1.25 },
    },
    {
      id: "p2",
      name: "Producto demo B",
      sku: "DEMO-B",
      unitsPerBox: 12,
      stock: { qtyBase: 10, unitCostUsd: 3.4 },
    },
  ];
}

export function loadProducts(): DsProductDemo[] {
  if (typeof window === "undefined") return defaultProducts();
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return defaultProducts();
    return JSON.parse(raw) as DsProductDemo[];
  } catch {
    return defaultProducts();
  }
}

export function saveProducts(products: DsProductDemo[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function receiveStock(
  products: DsProductDemo[],
  productId: string,
  qtyBase: number,
  unitCostUsd: number,
): DsProductDemo[] {
  return products.map((p) => {
    if (p.id !== productId) return p;
    return {
      ...p,
      stock: applyWeightedCpp(p.stock, qtyBase, unitCostUsd),
    };
  });
}
