/**
 * Cliente HTTP Fase 5 (comercio). Usa sesión JWT cuando VITE_AD_DATA_SOURCE=api.
 */
import { API_BASE_URL } from "@/config/api";
import { getAdSessionHeaders, loadAdSession } from "./session";

async function commerceFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!API_BASE_URL) {
    return { ok: false, error: "VITE_API_BASE_URL no configurada" };
  }
  if (!loadAdSession()?.accessToken) {
    return { ok: false, error: "Sesión API requerida" };
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

export const adCommerceClient = {
  searchProducts: (q: string) =>
    commerceFetch<unknown[]>("GET", `/api/v1/ad/products/search?q=${encodeURIComponent(q)}`),
  listSuppliers: () => commerceFetch<unknown[]>("GET", "/api/v1/ad/suppliers"),
  createSupplier: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/suppliers", body),
  createPurchase: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/commerce/purchases", body),
  listPayables: () => commerceFetch<unknown[]>("GET", "/api/v1/ad/payables"),
  getBcv: () => commerceFetch("GET", "/api/v1/ad/rates/bcv"),
  setBcv: (rate: number, reason?: string) =>
    commerceFetch("POST", "/api/v1/ad/rates/bcv", { rate, reason }),
  getProtected: () => commerceFetch("GET", "/api/v1/ad/rates/protected"),
  setProtected: (rate: number, reason?: string) =>
    commerceFetch("POST", "/api/v1/ad/rates/protected", { rate, reason }),
  analysis: () => commerceFetch<unknown[]>("GET", "/api/v1/ad/commerce/analysis"),
  replenishment: (coverageDays = 7) =>
    commerceFetch<unknown[]>(
      "GET",
      `/api/v1/ad/commerce/replenishment?coverageDays=${coverageDays}&windowDays=30`,
    ),
  createPurchaseOrder: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/commerce/purchase-orders", body),
  importPreview: (rows: unknown[]) =>
    commerceFetch("POST", "/api/v1/ad/imports/preview", {
      fileName: "upload.json",
      rows,
    }),
  importConfirm: (batchId: string) =>
    commerceFetch("POST", "/api/v1/ad/imports/confirm", { batchId }),
  createPromotion: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/promotions", body),
  createCombo: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/combos", body),
};
