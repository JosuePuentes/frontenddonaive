/**
 * Clientes, proveedores, CxC y CxP — offline-first.
 */

import type {
  DsAccountPayment,
  DsAccountStatus,
  DsClient,
  DsPayable,
  DsReceivable,
  DsSupplier,
} from "@/types/donaive-software";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveAccountStatus(
  amount: number,
  paidAmount: number,
  dueDate?: string,
): DsAccountStatus {
  const balance = Math.max(0, amount - paidAmount);
  if (balance <= 0.009) return "PAGADA";
  if (paidAmount > 0.009) {
    if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) {
      return "VENCIDA";
    }
    return "PARCIAL";
  }
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) {
    return "VENCIDA";
  }
  return "PENDIENTE";
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + Math.max(0, days));
  return d.toISOString().slice(0, 10);
}

export type UpsertClientInput = {
  id?: string;
  name: string;
  phone?: string;
  documentId?: string;
  email?: string;
  address?: string;
  creditLimitUsd: number;
  creditDays: number;
  notes?: string;
  active: boolean;
};

export function upsertClientInList(
  list: DsClient[],
  input: UpsertClientInput,
): { ok: true; list: DsClient[]; client: DsClient } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Indique el nombre del cliente" };
  const now = new Date().toISOString();

  if (input.id) {
    const idx = list.findIndex((c) => c.id === input.id);
    if (idx < 0) return { ok: false, error: "Cliente no encontrado" };
    const updated: DsClient = {
      ...list[idx],
      name,
      phone: input.phone?.trim() || undefined,
      documentId: input.documentId?.trim() || undefined,
      email: input.email?.trim() || undefined,
      address: input.address?.trim() || undefined,
      creditLimitUsd: Math.max(0, Number(input.creditLimitUsd) || 0),
      creditDays: Math.max(0, Number(input.creditDays) || 0),
      notes: input.notes?.trim() || undefined,
      active: input.active,
      updatedAt: now,
    };
    const next = [...list];
    next[idx] = updated;
    return { ok: true, list: next, client: updated };
  }

  const created: DsClient = {
    id: uid("cli"),
    name,
    phone: input.phone?.trim() || undefined,
    documentId: input.documentId?.trim() || undefined,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
    creditLimitUsd: Math.max(0, Number(input.creditLimitUsd) || 0),
    creditDays: Math.max(0, Number(input.creditDays) || 0),
    notes: input.notes?.trim() || undefined,
    active: input.active,
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, list: [...list, created], client: created };
}

export type UpsertSupplierInput = {
  id?: string;
  name: string;
  identification?: string;
  phone?: string;
  contactName?: string;
  defaultCurrency: "USD" | "BS";
  creditDays: number;
  creditLimit: number;
  /** Días que tarda en despachar. Default 3. */
  leadTimeDays?: number;
  /** Productos que vende este proveedor. */
  productIds?: string[];
  notes?: string;
  active: boolean;
};

export function upsertSupplierInList(
  list: DsSupplier[],
  input: UpsertSupplierInput,
):
  | { ok: true; list: DsSupplier[]; supplier: DsSupplier }
  | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Indique el nombre del proveedor" };
  const now = new Date().toISOString();

  if (input.id) {
    const idx = list.findIndex((s) => s.id === input.id);
    if (idx < 0) return { ok: false, error: "Proveedor no encontrado" };
    const updated: DsSupplier = {
      ...list[idx],
      name,
      identification: input.identification?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      contactName: input.contactName?.trim() || undefined,
      defaultCurrency: input.defaultCurrency,
      creditDays: Math.max(0, Number(input.creditDays) || 0),
      creditLimit: Math.max(0, Number(input.creditLimit) || 0),
      leadTimeDays: Math.max(1, Number(input.leadTimeDays) || 3),
      productIds: [...(input.productIds ?? list[idx].productIds ?? [])],
      notes: input.notes?.trim() || undefined,
      active: input.active,
      updatedAt: now,
    };
    const next = [...list];
    next[idx] = updated;
    return { ok: true, list: next, supplier: updated };
  }

  const created: DsSupplier = {
    id: uid("sup"),
    name,
    identification: input.identification?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    contactName: input.contactName?.trim() || undefined,
    defaultCurrency: input.defaultCurrency,
    creditDays: Math.max(0, Number(input.creditDays) || 0),
    creditLimit: Math.max(0, Number(input.creditLimit) || 0),
    leadTimeDays: Math.max(1, Number(input.leadTimeDays) || 3),
    productIds: [...(input.productIds ?? [])],
    notes: input.notes?.trim() || undefined,
    active: input.active,
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, list: [...list, created], supplier: created };
}

export function createPayableFromPurchase(input: {
  supplierId: string;
  supplierName: string;
  purchaseId: string;
  invoiceNumber: string;
  currency: "USD" | "BS";
  amount: number;
  paymentCondition: "CONTADO" | "CREDITO";
  dueDate?: string;
}): DsPayable {
  const amount = Math.max(0, Number(input.amount) || 0);
  const paid =
    input.paymentCondition === "CONTADO" ? amount : 0;
  const balance = Math.max(0, amount - paid);
  return {
    id: uid("ap"),
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    purchaseId: input.purchaseId,
    invoiceNumber: input.invoiceNumber || input.purchaseId,
    currency: input.currency,
    amount,
    paidAmount: paid,
    balance,
    dueDate: input.dueDate,
    status: resolveAccountStatus(amount, paid, input.dueDate),
    issuedAt: new Date().toISOString(),
    payments:
      paid > 0
        ? [
            {
              id: uid("pay"),
              amount: paid,
              paidAt: new Date().toISOString(),
              method: "contado",
              note: "Pago al confirmar compra",
            },
          ]
        : [],
  };
}

export function applyAccountPayment<
  T extends { amount: number; paidAmount: number; balance: number; dueDate?: string; status: DsAccountStatus; payments: DsAccountPayment[] },
>(
  account: T,
  amount: number,
  meta?: { method?: string; reference?: string; note?: string },
): { ok: true; account: T } | { ok: false; error: string } {
  const pay = Math.max(0, Number(amount) || 0);
  if (!(pay > 0)) return { ok: false, error: "Indique un monto válido" };
  if (account.status === "ANULADA") {
    return { ok: false, error: "Cuenta anulada" };
  }
  if (account.balance <= 0.009) {
    return { ok: false, error: "La cuenta ya está pagada" };
  }
  if (pay > account.balance + 0.01) {
    return { ok: false, error: "El abono supera el saldo" };
  }
  const paidAmount = account.paidAmount + pay;
  const balance = Math.max(0, account.amount - paidAmount);
  const payment: DsAccountPayment = {
    id: uid("pay"),
    amount: pay,
    paidAt: new Date().toISOString(),
    method: meta?.method,
    reference: meta?.reference,
    note: meta?.note,
  };
  return {
    ok: true,
    account: {
      ...account,
      paidAmount,
      balance,
      status: resolveAccountStatus(account.amount, paidAmount, account.dueDate),
      payments: [...account.payments, payment],
    },
  };
}

export function createReceivable(input: {
  clientId: string;
  clientName: string;
  concept: string;
  currency: "USD" | "BS";
  amount: number;
  dueDate?: string;
  saleId?: string;
  notes?: string;
}): { ok: true; receivable: DsReceivable } | { ok: false; error: string } {
  const amount = Math.max(0, Number(input.amount) || 0);
  if (!(amount > 0)) return { ok: false, error: "Indique el monto" };
  if (!input.concept.trim()) return { ok: false, error: "Indique el concepto" };
  return {
    ok: true,
    receivable: {
      id: uid("ar"),
      clientId: input.clientId,
      clientName: input.clientName,
      saleId: input.saleId,
      concept: input.concept.trim(),
      currency: input.currency,
      amount,
      paidAmount: 0,
      balance: amount,
      dueDate: input.dueDate,
      status: resolveAccountStatus(amount, 0, input.dueDate),
      issuedAt: new Date().toISOString(),
      payments: [],
      notes: input.notes?.trim() || undefined,
    },
  };
}

export function balanceForParty(
  accounts: { balance: number; status: DsAccountStatus }[],
): number {
  return accounts
    .filter((a) => a.status !== "ANULADA")
    .reduce((acc, a) => acc + a.balance, 0);
}

export function refreshOverdueStatuses<
  T extends { balance: number; amount: number; paidAmount: number; dueDate?: string; status: DsAccountStatus },
>(accounts: T[]): T[] {
  return accounts.map((a) => {
    if (a.status === "ANULADA" || a.status === "PAGADA") return a;
    return {
      ...a,
      status: resolveAccountStatus(a.amount, a.paidAmount, a.dueDate),
    };
  });
}
