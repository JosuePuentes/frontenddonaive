/**
 * Cliente HTTP finanzas F7.
 */
import { API_BASE_URL } from "@/config/api";
import { getAdSessionHeaders, loadAdSession } from "./session";

async function financeFetch<T>(
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

export const adFinanceClient = {
  listAccounts: () =>
    financeFetch<{
      summaryByCurrency: Record<
        string,
        { balance: number; income: number; expense: number; transfers: number }
      >;
      activeCount: number;
      accounts: {
        id: string;
        name: string;
        type: string;
        currency: string;
        balance: number;
        active: boolean;
      }[];
    }>("GET", "/api/v1/ad/finance/accounts"),
  createAccount: (body: Record<string, unknown>) =>
    financeFetch("POST", "/api/v1/ad/finance/accounts", body),
  listMovements: (qs = "") =>
    financeFetch<unknown[]>("GET", `/api/v1/ad/finance/movements${qs}`),
  getDashboard: (qs = "") =>
    financeFetch<Record<string, unknown>>(
      "GET",
      `/api/v1/ad/finance/dashboard${qs}`,
    ),
  drillDashboard: (qs: string) =>
    financeFetch<{ section: string; items: unknown[] }>(
      "GET",
      `/api/v1/ad/finance/dashboard/drill${qs}`,
    ),
  createTransfer: (body: Record<string, unknown>) =>
    financeFetch("POST", "/api/v1/ad/finance/transfers", body),
  createExchange: (body: Record<string, unknown>) =>
    financeFetch("POST", "/api/v1/ad/finance/exchange", body),
  previewExchange: (body: Record<string, unknown>) =>
    financeFetch("POST", "/api/v1/ad/finance/exchange/preview", body),
  createExpense: (body: Record<string, unknown>) =>
    financeFetch("POST", "/api/v1/ad/finance/expenses", body),
  totalize: (id: string) =>
    financeFetch("POST", `/api/v1/ad/finance/movements/${id}/totalize`, {}),
  confirm: (id: string) =>
    financeFetch("POST", `/api/v1/ad/finance/movements/${id}/confirm`, {}),
  getSettings: () =>
    financeFetch<{ parallelRateHotkey: string }>(
      "GET",
      "/api/v1/ad/finance/settings",
    ),
  updateSettings: (body: Record<string, unknown>) =>
    financeFetch("PUT", "/api/v1/ad/finance/settings", body),
  reconciliationPreview: (q: {
    accountId: string;
    from?: string;
    to?: string;
  }) => {
    const qs = new URLSearchParams({ accountId: q.accountId });
    if (q.from) qs.set("from", q.from);
    if (q.to) qs.set("to", q.to);
    return financeFetch<Record<string, unknown>>(
      "GET",
      `/api/v1/ad/finance/reconciliations/preview?${qs}`,
    );
  },
  listReconciliations: (accountId?: string) =>
    financeFetch<unknown[]>(
      "GET",
      `/api/v1/ad/finance/reconciliations${
        accountId ? `?accountId=${accountId}` : ""
      }`,
    ),
  createReconciliation: (body: Record<string, unknown>) =>
    financeFetch("POST", "/api/v1/ad/finance/reconciliations", body),
};
