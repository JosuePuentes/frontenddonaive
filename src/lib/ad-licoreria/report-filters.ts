/**
 * Filtros de reportes A&D — lógica reutilizable (UI → query → futuro API).
 * Preparado para reportes guardados sin implementar persistencia completa.
 */

import type {
  AdAccount,
  AdPaymentMethodCode,
  AdPrepaidAccount,
  AdSale,
} from "@/types/ad-licoreria";
import { inDateRange } from "@/lib/ad-licoreria/report-presets";

/** Agrupación de métodos de pago para filtros de negocio. */
export type AdReportPaymentMethodFilter =
  | ""
  | "efectivo"
  | "transferencia"
  | "pago_movil"
  | "tarjeta"
  | "otro"
  | "mixto";

export const AD_REPORT_PAYMENT_METHOD_LABELS: Record<
  Exclude<AdReportPaymentMethodFilter, "">,
  string
> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  pago_movil: "Pago móvil",
  tarjeta: "Tarjeta",
  otro: "Otro",
  mixto: "Mixto",
};

/**
 * Estados unificados para filtros de reportes (ventas / cuentas / prepagos).
 */
export type AdReportStatusFilter =
  | ""
  | "abierta"
  | "cerrada"
  | "pendiente"
  | "pagada"
  | "anulada"
  | "parcialmente_pagada"
  | "prepago"
  | "consumida";

export const AD_REPORT_STATUS_LABELS: Record<
  Exclude<AdReportStatusFilter, "">,
  string
> = {
  abierta: "Abierta",
  cerrada: "Cerrada",
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
  parcialmente_pagada: "Parcialmente pagada",
  prepago: "Prepago",
  consumida: "Consumida",
};

export type AdReportFilters = {
  from: string;
  to: string;
  warehouseId?: string;
  operatorId?: string;
  cashierId?: string;
  mesoneraName?: string;
  customerId?: string;
  productId?: string;
  categoryId?: string;
  paymentMethod?: AdReportPaymentMethodFilter;
  status?: AdReportStatusFilter;
};

/** Arquitectura para reportes guardados (futuro backend). */
export type AdSavedReportDefinition = {
  id: string;
  name: string;
  filters: AdReportFilters;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
};

function paymentBucket(code: AdPaymentMethodCode): Exclude<
  AdReportPaymentMethodFilter,
  "" | "mixto"
> {
  if (code === "efectivo_usd" || code === "efectivo_bs") return "efectivo";
  if (code === "transferencia") return "transferencia";
  if (code === "pago_movil") return "pago_movil";
  if (code === "tarjeta") return "tarjeta";
  return "otro";
}

export function salePaymentBuckets(sale: AdSale): Set<string> {
  const set = new Set<string>();
  for (const p of sale.payments) set.add(paymentBucket(p.method));
  return set;
}

export function saleMatchesPaymentMethod(
  sale: AdSale,
  filter: AdReportPaymentMethodFilter | undefined,
): boolean {
  if (!filter) return true;
  const buckets = salePaymentBuckets(sale);
  if (filter === "mixto") return buckets.size > 1;
  return buckets.has(filter);
}

/** Estado de venta para filtros unificados. */
export function saleReportStatus(sale: AdSale): AdReportStatusFilter {
  if (sale.status === "voided") return "anulada";
  if (sale.status === "completed") return "pagada";
  return "pendiente";
}

export function accountReportStatus(account: AdAccount): AdReportStatusFilter {
  switch (account.status) {
    case "ABIERTA":
      return "abierta";
    case "CERRADA":
      return "cerrada";
    case "PAGADA":
      return "pagada";
    case "CANCELADA":
      return "anulada";
    case "PARCIALMENTE_PAGADA":
      return "parcialmente_pagada";
    case "PREPAGADA":
      return "prepago";
    default:
      return "pendiente";
  }
}

export function prepaidReportStatus(
  prepaid: AdPrepaidAccount,
): AdReportStatusFilter {
  if (prepaid.status === "AGOTADO" || prepaid.status === "CERRADO") {
    return "consumida";
  }
  if (prepaid.status === "ACTIVO") return "prepago";
  return "pendiente";
}

export function filterSalesByReportQuery(
  sales: AdSale[],
  filters: AdReportFilters,
  opts?: {
    cashierNameById?: (id: string) => string | undefined;
  },
): AdSale[] {
  return sales.filter((s) => {
    if (!inDateRange(s.createdAt, filters.from, filters.to)) return false;
    if (filters.warehouseId && s.warehouseId !== filters.warehouseId) {
      return false;
    }
    if (filters.operatorId && s.operatorId !== filters.operatorId) {
      return false;
    }
    if (filters.cashierId) {
      const name = opts?.cashierNameById?.(filters.cashierId);
      if (
        s.operatorId !== filters.cashierId &&
        s.userName !== name &&
        s.cashierName !== name
      ) {
        return false;
      }
    }
    if (filters.customerId && s.customerId !== filters.customerId) {
      return false;
    }
    if (
      filters.mesoneraName &&
      (s.mesoneraName ?? s.userName) !== filters.mesoneraName
    ) {
      return false;
    }
    if (
      filters.productId &&
      !s.items.some((it) => it.productId === filters.productId)
    ) {
      return false;
    }
    if (!saleMatchesPaymentMethod(s, filters.paymentMethod)) return false;
    if (filters.status) {
      const st = saleReportStatus(s);
      if (filters.status === "pagada" || filters.status === "cerrada") {
        if (st !== "pagada") return false;
      } else if (filters.status === "anulada") {
        if (st !== "anulada") return false;
      } else if (
        filters.status === "abierta" ||
        filters.status === "pendiente" ||
        filters.status === "parcialmente_pagada" ||
        filters.status === "prepago" ||
        filters.status === "consumida"
      ) {
        /* estos estados no aplican a ventas POS completadas/anuladas */
        return false;
      } else if (st !== filters.status) {
        return false;
      }
    }
    return true;
  });
}
