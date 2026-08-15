/**
 * Cliente HTTP mínimo para `/api/v1/ad/*`.
 * Fase 1: preparado; las pantallas siguen en MOCK por defecto.
 */

import { API_BASE_URL } from "@/config/api";
import { apiGetJson, type ApiResult } from "@/services/apiClient";

export type AdApiAuthHeaders = {
  userId: string;
  operatorId: string;
  email?: string;
  roles?: string;
  projectIds?: string;
};

function adHeaders(auth: AdApiAuthHeaders): Record<string, string> {
  return {
    "X-User-Id": auth.userId,
    "X-Ad-Operator-Id": auth.operatorId,
    ...(auth.email ? { "X-User-Email": auth.email } : {}),
    ...(auth.roles ? { "X-User-Roles": auth.roles } : {}),
    ...(auth.projectIds
      ? { "X-Accessible-Project-Ids": auth.projectIds }
      : {}),
  };
}

function joinUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${normalizedPath}`;
}

async function adRequestJson<T>(
  method: "GET" | "POST" | "PUT",
  path: string,
  auth: AdApiAuthHeaders,
  body?: unknown,
): Promise<ApiResult<T>> {
  if (!API_BASE_URL) {
    return {
      ok: false,
      error: {
        message:
          "VITE_API_BASE_URL no está configurada. Configura el frontend para usar API A&D.",
      },
    };
  }

  const url = joinUrl(API_BASE_URL, path);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...adHeaders(auth),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const status = res.status;
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      payload = undefined;
    }

    if (!res.ok) {
      const errObj = payload as { error?: { message?: string } } | undefined;
      return {
        ok: false,
        status,
        error: {
          message:
            errObj?.error?.message ?? `HTTP ${status} al llamar ${path}`,
          details: payload,
        },
      };
    }

    const data = (payload as { data: T }).data;
    return { ok: true, status, data };
  } catch (err) {
    return {
      ok: false,
      error: {
        message: err instanceof Error ? err.message : "Error de red A&D",
      },
    };
  }
}

export const adApiClient = {
  healthLive(): Promise<ApiResult<{ status: string; module: string }>> {
    return apiGetJson("/health/ad");
  },

  health(auth: AdApiAuthHeaders) {
    return adRequestJson<{
      status: string;
      module: string;
      schema: string;
      phase: number;
    }>("GET", "/api/v1/ad/health", auth);
  },

  context(auth: AdApiAuthHeaders) {
    return adRequestJson<{
      tenantId: string;
      operator: { id: string; role: string; warehouseId: string | null };
      permissions: string[];
    }>("GET", "/api/v1/ad/context", auth);
  },

  listProducts(auth: AdApiAuthHeaders) {
    return adRequestJson<unknown[]>("GET", "/api/v1/ad/products", auth);
  },

  createProduct(auth: AdApiAuthHeaders, body: Record<string, unknown>) {
    return adRequestJson<unknown>("POST", "/api/v1/ad/products", auth, body);
  },

  createPresentation(
    auth: AdApiAuthHeaders,
    productId: string,
    body: Record<string, unknown>,
  ) {
    return adRequestJson<unknown>(
      "POST",
      `/api/v1/ad/products/${productId}/presentations`,
      auth,
      body,
    );
  },

  getStock(auth: AdApiAuthHeaders, warehouseId: string) {
    return adRequestJson<unknown[]>(
      "GET",
      `/api/v1/ad/stock?warehouseId=${encodeURIComponent(warehouseId)}`,
      auth,
    );
  },

  setStock(auth: AdApiAuthHeaders, body: Record<string, unknown>) {
    return adRequestJson<unknown>("PUT", "/api/v1/ad/stock", auth, body);
  },

  listCustomers(auth: AdApiAuthHeaders) {
    return adRequestJson<unknown[]>("GET", "/api/v1/ad/customers", auth);
  },

  createCustomer(auth: AdApiAuthHeaders, body: Record<string, unknown>) {
    return adRequestJson<unknown>("POST", "/api/v1/ad/customers", auth, body);
  },

  createSale(auth: AdApiAuthHeaders, body: Record<string, unknown>) {
    return adRequestJson<unknown>("POST", "/api/v1/ad/sales", auth, body);
  },

  listAudit(auth: AdApiAuthHeaders) {
    return adRequestJson<unknown[]>("GET", "/api/v1/ad/audit", auth);
  },
};
