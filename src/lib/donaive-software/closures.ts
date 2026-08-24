/**
 * Cierres de caja — esperado vs contado, desglose por método.
 */

import { DS_PAYMENT_LABELS } from "@/lib/donaive-software/sales";
import type {
  DsCashClosure,
  DsPaymentMethod,
  DsSale,
} from "@/types/donaive-software";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function salesForDate(
  sales: DsSale[],
  date: string,
  opts?: { operatorId?: string },
): DsSale[] {
  return sales.filter((s) => {
    if (s.createdAt.slice(0, 10) !== date) return false;
    if (s.status !== "completed") return false;
    if (opts?.operatorId && s.operatorId && s.operatorId !== opts.operatorId) {
      return false;
    }
    return true;
  });
}

export function aggregateByMethod(sales: DsSale[]) {
  const map: Record<string, { usd: number; bs: number }> = {};
  for (const sale of sales) {
    for (const pay of sale.payments) {
      const cur = map[pay.method] ?? { usd: 0, bs: 0 };
      if (pay.currency === "USD") cur.usd += pay.amount;
      else cur.bs += pay.amount;
      map[pay.method] = cur;
    }
  }
  return map;
}

export function expectedCashFromSales(sales: DsSale[]) {
  let usd = 0;
  let bs = 0;
  for (const sale of sales) {
    for (const pay of sale.payments) {
      if (pay.method === "efectivo_usd" && pay.currency === "USD") {
        usd += pay.amount;
      }
      if (pay.method === "efectivo_bs" && pay.currency === "BS") {
        bs += pay.amount;
      }
    }
  }
  return { usd, bs };
}

export function buildCashClosure(input: {
  sales: DsSale[];
  allSales: DsSale[];
  date: string;
  countedCashUsd: number;
  countedCashBs: number;
  notes?: string;
  createdBy?: string;
  operatorId?: string;
}): DsCashClosure {
  const scoped = input.sales;
  const voidedCount = input.allSales.filter(
    (s) =>
      s.createdAt.slice(0, 10) === input.date &&
      s.status === "voided" &&
      (!input.operatorId || s.operatorId === input.operatorId),
  ).length;

  let totalUsd = 0;
  let totalBs = 0;
  for (const s of scoped) {
    totalUsd += s.totalUsd;
    totalBs += s.totalBs;
  }

  const byMethod = aggregateByMethod(scoped);
  const expected = expectedCashFromSales(scoped);
  const countedUsd = Math.max(0, Number(input.countedCashUsd) || 0);
  const countedBs = Math.max(0, Number(input.countedCashBs) || 0);

  return {
    id: uid("cls"),
    date: input.date,
    salesCount: scoped.length,
    voidedCount,
    totalUsd,
    totalBs,
    byMethod,
    expectedCashUsd: expected.usd,
    expectedCashBs: expected.bs,
    countedCashUsd: countedUsd,
    countedCashBs: countedBs,
    diffUsd: countedUsd - expected.usd,
    diffBs: countedBs - expected.bs,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    operatorId: input.operatorId,
  };
}

export function methodLabel(code: string): string {
  return DS_PAYMENT_LABELS[code as DsPaymentMethod] ?? code;
}
