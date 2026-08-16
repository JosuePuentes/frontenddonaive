/**
 * Cliente HTTP comercio F5/F6.
 */
import { API_BASE_URL } from "@/config/api";
import { getAdSessionHeaders, loadAdSession } from "./session";

async function commerceFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
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
    commerceFetch<
      {
        id: string;
        name: string;
        brand: string | null;
        sku: string | null;
        taxable?: boolean;
        presentations: {
          id: string;
          name: string;
          unitsPerPresentation: number;
        }[];
      }[]
    >("GET", `/api/v1/ad/products/search?q=${encodeURIComponent(q)}`),
  lookupByCode: (code: string, source: "manual" | "camera" | "wedge" = "manual") =>
    commerceFetch(
      "GET",
      `/api/v1/ad/products/by-code?code=${encodeURIComponent(code)}&source=${source}`,
    ),
  listSuppliers: () =>
    commerceFetch<{ id: string; name: string; creditDays: number }[]>(
      "GET",
      "/api/v1/ad/suppliers",
    ),
  createSupplier: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/suppliers", body),
  listPaymentMethods: () =>
    commerceFetch<
      {
        id: string;
        name: string;
        currency: string;
        usesSpecialRateRef: boolean;
        active: boolean;
      }[]
    >("GET", "/api/v1/ad/payment-methods"),
  createPurchase: (body: Record<string, unknown>) =>
    commerceFetch<Record<string, unknown>>(
      "POST",
      "/api/v1/ad/commerce/purchases",
      body,
    ),
  updatePurchase: (id: string, body: Record<string, unknown>) =>
    commerceFetch<Record<string, unknown>>(
      "PUT",
      `/api/v1/ad/commerce/purchases/${id}`,
      body,
    ),
  getPurchase: (id: string) =>
    commerceFetch<Record<string, unknown>>(
      "GET",
      `/api/v1/ad/commerce/purchases/${id}`,
    ),
  addLine: (purchaseId: string, body: Record<string, unknown>) =>
    commerceFetch(
      "POST",
      `/api/v1/ad/commerce/purchases/${purchaseId}/lines`,
      body,
    ),
  updateLine: (
    purchaseId: string,
    lineId: string,
    body: Record<string, unknown>,
  ) =>
    commerceFetch(
      "PATCH",
      `/api/v1/ad/commerce/purchases/${purchaseId}/lines/${lineId}`,
      body,
    ),
  deleteLine: (purchaseId: string, lineId: string) =>
    commerceFetch(
      "DELETE",
      `/api/v1/ad/commerce/purchases/${purchaseId}/lines/${lineId}`,
    ),
  totalize: (purchaseId: string) =>
    commerceFetch(
      "POST",
      `/api/v1/ad/commerce/purchases/${purchaseId}/totalize`,
      {},
    ),
  confirm: (purchaseId: string) =>
    commerceFetch(
      "POST",
      `/api/v1/ad/commerce/purchases/${purchaseId}/confirm`,
      {},
    ),
  createProduct: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/commerce/products", body),
  listPayables: () => commerceFetch<unknown[]>("GET", "/api/v1/ad/payables"),
  getBcv: () => commerceFetch("GET", "/api/v1/ad/rates/bcv"),
  setBcv: (rate: number, reason?: string) =>
    commerceFetch("POST", "/api/v1/ad/rates/bcv", { rate, reason }),
  getProtected: () => commerceFetch("GET", "/api/v1/ad/rates/protected"),
  setProtected: (rate: number, reason?: string) =>
    commerceFetch("POST", "/api/v1/ad/rates/protected", { rate, reason }),
  analysis: (qs = "") =>
    commerceFetch<unknown[]>(
      "GET",
      `/api/v1/ad/commerce/analysis${qs}`,
    ),
  replenishment: (coverageDays = 7) =>
    commerceFetch<unknown[]>(
      "GET",
      `/api/v1/ad/commerce/replenishment?coverageDays=${coverageDays}&windowDays=30`,
    ),
  createPurchaseOrder: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/commerce/purchase-orders", body),
  listPurchaseOrders: () =>
    commerceFetch<unknown[]>("GET", "/api/v1/ad/commerce/purchase-orders"),
  updatePurchaseOrder: (id: string, body: Record<string, unknown>) =>
    commerceFetch(
      "PATCH",
      `/api/v1/ad/commerce/purchase-orders/${id}`,
      body,
    ),
  convertPurchaseOrder: (id: string, body: Record<string, unknown>) =>
    commerceFetch(
      "POST",
      `/api/v1/ad/commerce/purchase-orders/${id}/convert`,
      body,
    ),
  setPresentationPrice: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/pricing/presentation", body),
  importPreview: (rows: unknown[]) =>
    commerceFetch("POST", "/api/v1/ad/imports/preview", {
      fileName: "upload.json",
      rows,
    }),
  importConfirm: (batchId: string) =>
    commerceFetch("POST", "/api/v1/ad/imports/confirm", { batchId }),
  listPromotions: () =>
    commerceFetch<unknown[]>("GET", "/api/v1/ad/promotions"),
  createPromotion: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/promotions", body),
  updatePromotion: (id: string, body: Record<string, unknown>) =>
    commerceFetch("PATCH", `/api/v1/ad/promotions/${id}`, body),
  createCombo: (body: Record<string, unknown>) =>
    commerceFetch("POST", "/api/v1/ad/combos", body),
};
