/**
 * Disponibilidad operativa A&D — cálculo puro (sin side-effects).
 *
 * REGLA:
 * - Compromiso de CUENTA ACTIVA reduce disponible operativo.
 * - Compromiso de CLIENTE (cuenta YA CERRADA) NO bloquea ventas;
 *   genera déficit si el físico no alcanza para la obligación.
 */
import type {
  AdAccount,
  AdCustomerCommitment,
  AdInventoryItem,
  AdPresentation,
  AdPurchaseRequest,
  AdStockTransfer,
  AdWarehouseAvailability,
  AdOperationalAvailability,
  AdFulfillmentPlan,
} from "@/types/ad-licoreria";
import { AD_WH_BODEGON, AD_WH_LICORERIA } from "@/lib/ad-licoreria/warehouses";
import { toBaseUnits } from "@/lib/ad-licoreria/conversions";

const ACTIVE_ACCOUNT_STATUSES = new Set([
  "ABIERTA",
  "PREPAGADA",
  "PARCIALMENTE_PAGADA",
  "PAGADA",
]);

const SOFT_RESERVE_TRANSFER = new Set([
  "SOLICITADA",
  "AUTORIZADA",
]);

export type AvailabilitySnapshot = {
  inventory: AdInventoryItem[];
  accounts: AdAccount[];
  presentations: AdPresentation[];
  transfers: AdStockTransfer[];
  purchaseRequests: AdPurchaseRequest[];
  customerCommitments: AdCustomerCommitment[];
  /** Depósitos a consultar (default: ambos). */
  warehouseIds?: string[];
};

function physicalAt(
  inventory: AdInventoryItem[],
  productId: string,
  warehouseId: string,
): number {
  return (
    inventory.find(
      (i) => i.productId === productId && i.warehouseId === warehouseId,
    )?.qtyBase ?? 0
  );
}

/** Compromiso activo en cuentas abiertas (pendiente de servir), en unidad base. */
export function activeCommittedBase(
  accounts: AdAccount[],
  presentations: AdPresentation[],
  productId: string,
): number {
  let total = 0;
  for (const acc of accounts) {
    if (!ACTIVE_ACCOUNT_STATUSES.has(acc.status)) continue;
    for (const item of acc.items) {
      if (item.productId !== productId) continue;
      const pending = Math.max(0, item.qty - item.qtyServed);
      if (pending <= 0) continue;
      const pres = presentations.find((p) => p.id === item.presentationId);
      total += pending * (pres?.unitsPerPresentation ?? 1);
    }
  }
  return total;
}

/** Soft-reserve de transferencias pendientes de envío (origen). */
export function softReservedOutboundBase(
  transfers: AdStockTransfer[],
  presentations: AdPresentation[],
  productId: string,
  warehouseId: string,
): number {
  let total = 0;
  for (const tr of transfers) {
    if (!SOFT_RESERVE_TRANSFER.has(tr.status)) continue;
    if (tr.fromWarehouseId !== warehouseId) continue;
    for (const line of tr.lines) {
      if (line.productId !== productId) continue;
      const pres = presentations.find((p) => p.id === line.presentationId);
      total += toBaseUnits(pres ?? { unitsPerPresentation: 1 }, line.qty);
    }
  }
  return total;
}

/** Obligación con clientes (cuentas cerradas con pendiente). */
export function customerPendingBase(
  commitments: AdCustomerCommitment[],
  productId: string,
): number {
  return commitments
    .filter((c) => c.productId === productId && c.status === "PENDIENTE")
    .reduce((a, c) => a + c.qtyBaseRemaining, 0);
}

export function customerCommitmentDeficit(
  physicalTotal: number,
  customerPending: number,
): number {
  return Math.max(0, customerPending - physicalTotal);
}

/**
 * Disponibilidad operativa por producto (ambos depósitos).
 * `requestedBase` opcional: cantidad pedida para calcular faltante / plan.
 */
export function getOperationalAvailability(
  snap: AvailabilitySnapshot,
  productId: string,
  requestedBase = 0,
  preferredWarehouseId: string = AD_WH_LICORERIA,
): AdOperationalAvailability {
  const warehouseIds =
    snap.warehouseIds ?? [AD_WH_LICORERIA, AD_WH_BODEGON];

  const activeCommitted = activeCommittedBase(
    snap.accounts,
    snap.presentations,
    productId,
  );

  /** Compromiso activo se imputa al depósito preferido (punto de servicio). */
  const byWarehouse: AdWarehouseAvailability[] = warehouseIds.map((wid) => {
    const physical = physicalAt(snap.inventory, productId, wid);
    const softOut = softReservedOutboundBase(
      snap.transfers,
      snap.presentations,
      productId,
      wid,
    );
    const committedHere =
      wid === preferredWarehouseId ? activeCommitted : 0;
    const available = Math.max(0, physical - committedHere - softOut);
    return {
      warehouseId: wid,
      physical,
      committedActive: committedHere,
      softReservedOutbound: softOut,
      availableOperational: available,
    };
  });

  const physicalTotal = byWarehouse.reduce((a, w) => a + w.physical, 0);
  const committedTotal = activeCommitted;
  const availableTotal = byWarehouse.reduce(
    (a, w) => a + w.availableOperational,
    0,
  );
  const pendingCustomers = customerPendingBase(
    snap.customerCommitments,
    productId,
  );
  const deficit = customerCommitmentDeficit(physicalTotal, pendingCustomers);

  const pendingTransfers = snap.transfers.filter(
    (t) =>
      t.status !== "RECIBIDA" &&
      t.status !== "CANCELADA" &&
      t.lines.some((l) => l.productId === productId),
  ).length;
  const pendingPurchases = snap.purchaseRequests.filter(
    (p) =>
      (p.status === "SOLICITADA" ||
        p.status === "APROBADA" ||
        p.status === "ORDENADA") &&
      p.productId === productId,
  ).length;

  const preferred = byWarehouse.find((w) => w.warehouseId === preferredWarehouseId);
  const others = byWarehouse.filter((w) => w.warehouseId !== preferredWarehouseId);

  const plan = buildFulfillmentPlan({
    requestedBase,
    preferredAvailable: preferred?.availableOperational ?? 0,
    otherWarehouses: others.map((w) => ({
      warehouseId: w.warehouseId,
      available: w.availableOperational,
    })),
  });

  let status: AdOperationalAvailability["status"] = "OK";
  if (requestedBase > 0) {
    if (plan.shortfall === 0 && plan.transferSuggestion === 0) status = "OK";
    else if (plan.shortfall === 0 && plan.transferSuggestion > 0)
      status = "TRANSFER_NEEDED";
    else if (plan.purchaseNeeded > 0 && plan.transferSuggestion > 0)
      status = "TRANSFER_AND_PURCHASE";
    else status = "PURCHASE_NEEDED";
  } else if (deficit > 0) {
    status = "COMMITMENT_DEFICIT";
  }

  return {
    productId,
    requestedBase,
    byWarehouse,
    physicalTotal,
    committedActiveTotal: committedTotal,
    availableOperationalTotal: availableTotal,
    customerPendingBase: pendingCustomers,
    customerCommitmentDeficit: deficit,
    pendingTransfers,
    pendingPurchases,
    plan,
    status,
  };
}

export function buildFulfillmentPlan(input: {
  requestedBase: number;
  preferredAvailable: number;
  otherWarehouses: { warehouseId: string; available: number }[];
}): AdFulfillmentPlan {
  const need = Math.max(0, input.requestedBase);
  const fromPreferred = Math.min(need, input.preferredAvailable);
  let remaining = need - fromPreferred;

  let transferSuggestion = 0;
  let transferFromId: string | undefined;
  let purchaseNeeded = 0;

  const sorted = [...input.otherWarehouses].sort(
    (a, b) => b.available - a.available,
  );
  for (const wh of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, wh.available);
    if (take > 0) {
      transferSuggestion += take;
      transferFromId = transferFromId ?? wh.warehouseId;
      remaining -= take;
    }
  }
  purchaseNeeded = remaining;

  return {
    needed: need,
    fromPreferred,
    transferSuggestion,
    transferFromId,
    purchaseNeeded,
    shortfall: purchaseNeeded,
    canFulfillFully: purchaseNeeded === 0,
  };
}

export function fulfillmentMessage(av: AdOperationalAvailability): string {
  const faltan = Math.max(
    0,
    av.requestedBase - av.availableOperationalTotal,
  );
  if (av.requestedBase <= 0) return "";
  if (faltan <= 0 && av.plan.transferSuggestion === 0) {
    return "PUEDE CUMPLIRSE";
  }
  if (faltan <= 0 && av.plan.transferSuggestion > 0) {
    return `ABASTECIMIENTO NECESARIO · transferir ${av.plan.transferSuggestion} u. base`;
  }
  return `Para cumplir completamente esta orden faltan ${faltan} unidades.`;
}
