/**
 * Disponibilidad operativa A&D (puro) — espejo del MOCK.
 * Compromiso activo de cuentas abiertas afecta disponible.
 * Pendientes de clientes cerrados NO bloquean ventas; generan déficit.
 */

export type AvAccountLine = {
  productId: string;
  presentationId: string;
  qtyOrdered: number;
  qtyServed: number;
};

export type AvAccount = {
  status: string;
  warehouseId: string;
  lines: AvAccountLine[];
};

export type AvPresentation = {
  id: string;
  unitsPerPresentation: number;
};

export type AvTransferLine = {
  productId: string;
  presentationId: string;
  qty: number;
  qtyBase: number;
};

export type AvTransfer = {
  status: string;
  fromWarehouseId: string;
  lines: AvTransferLine[];
};

export type AvCommitment = {
  productId: string;
  status: string;
  qtyBaseRemaining: number;
};

export type AvStock = {
  warehouseId: string;
  productId: string;
  qtyBase: number;
};

const ACTIVE_ACCOUNT = new Set([
  "ABIERTA",
  "PREPAGADA",
  "PARCIALMENTE_PAGADA",
  "PAGADA",
]);

const SOFT_RESERVE = new Set(["REQUESTED", "AUTHORIZED", "PRELIMINARY", "SOLICITADA", "AUTORIZADA"]);

export type WarehouseAvailability = {
  warehouseId: string;
  physical: number;
  committedActive: number;
  softReservedOutbound: number;
  availableOperational: number;
};

export type OperationalAvailability = {
  productId: string;
  requestedBase: number;
  byWarehouse: WarehouseAvailability[];
  physicalTotal: number;
  committedActiveTotal: number;
  availableOperationalTotal: number;
  customerPendingBase: number;
  customerCommitmentDeficit: number;
  status: "OK" | "TRANSFER_NEEDED" | "PURCHASE_NEEDED" | "TRANSFER_AND_PURCHASE" | "COMMITMENT_DEFICIT";
  plan: {
    needed: number;
    fromPreferred: number;
    transferSuggestion: number;
    transferFromId?: string;
    purchaseNeeded: number;
    shortfall: number;
    canFulfillFully: boolean;
  };
};

export function computeOperationalAvailability(input: {
  productId: string;
  stocks: AvStock[];
  accounts: AvAccount[];
  presentations: AvPresentation[];
  transfers: AvTransfer[];
  commitments: AvCommitment[];
  warehouseIds: string[];
  preferredWarehouseId: string;
  requestedBase?: number;
}): OperationalAvailability {
  const requestedBase = input.requestedBase ?? 0;
  const factor = (presentationId: string) =>
    input.presentations.find((p) => p.id === presentationId)?.unitsPerPresentation ?? 1;

  let activeCommitted = 0;
  for (const acc of input.accounts) {
    if (!ACTIVE_ACCOUNT.has(acc.status)) continue;
    for (const line of acc.lines) {
      if (line.productId !== input.productId) continue;
      const pending = Math.max(0, line.qtyOrdered - line.qtyServed);
      activeCommitted += pending * factor(line.presentationId);
    }
  }

  const byWarehouse: WarehouseAvailability[] = input.warehouseIds.map((wid) => {
    const physical =
      input.stocks.find(
        (s) => s.warehouseId === wid && s.productId === input.productId,
      )?.qtyBase ?? 0;
    let softOut = 0;
    for (const tr of input.transfers) {
      if (!SOFT_RESERVE.has(tr.status)) continue;
      if (tr.fromWarehouseId !== wid) continue;
      for (const line of tr.lines) {
        if (line.productId !== input.productId) continue;
        softOut += line.qtyBase;
      }
    }
    const committedHere =
      wid === input.preferredWarehouseId ? activeCommitted : 0;
    return {
      warehouseId: wid,
      physical,
      committedActive: committedHere,
      softReservedOutbound: softOut,
      availableOperational: Math.max(0, physical - committedHere - softOut),
    };
  });

  const physicalTotal = byWarehouse.reduce((a, w) => a + w.physical, 0);
  const availableTotal = byWarehouse.reduce(
    (a, w) => a + w.availableOperational,
    0,
  );
  const customerPending = input.commitments
    .filter((c) => c.productId === input.productId && c.status === "PENDIENTE")
    .reduce((a, c) => a + c.qtyBaseRemaining, 0);
  const deficit = Math.max(0, customerPending - physicalTotal);

  const preferred = byWarehouse.find(
    (w) => w.warehouseId === input.preferredWarehouseId,
  );
  const others = byWarehouse.filter(
    (w) => w.warehouseId !== input.preferredWarehouseId,
  );
  const need = Math.max(0, requestedBase);
  let remaining = need - Math.min(need, preferred?.availableOperational ?? 0);
  let transferSuggestion = 0;
  let transferFromId: string | undefined;
  for (const wh of [...others].sort(
    (a, b) => b.availableOperational - a.availableOperational,
  )) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, wh.availableOperational);
    if (take > 0) {
      transferSuggestion += take;
      transferFromId = transferFromId ?? wh.warehouseId;
      remaining -= take;
    }
  }
  const purchaseNeeded = remaining;

  let status: OperationalAvailability["status"] = "OK";
  if (requestedBase > 0) {
    if (purchaseNeeded === 0 && transferSuggestion === 0) status = "OK";
    else if (purchaseNeeded === 0 && transferSuggestion > 0)
      status = "TRANSFER_NEEDED";
    else if (purchaseNeeded > 0 && transferSuggestion > 0)
      status = "TRANSFER_AND_PURCHASE";
    else status = "PURCHASE_NEEDED";
  } else if (deficit > 0) {
    status = "COMMITMENT_DEFICIT";
  }

  return {
    productId: input.productId,
    requestedBase,
    byWarehouse,
    physicalTotal,
    committedActiveTotal: activeCommitted,
    availableOperationalTotal: availableTotal,
    customerPendingBase: customerPending,
    customerCommitmentDeficit: deficit,
    status,
    plan: {
      needed: need,
      fromPreferred: Math.min(need, preferred?.availableOperational ?? 0),
      transferSuggestion,
      transferFromId,
      purchaseNeeded,
      shortfall: purchaseNeeded,
      canFulfillFully: purchaseNeeded === 0,
    },
  };
}

/** CPP — monedas independientes. */
export function weightedAverageCost(
  prevQty: number,
  prevAvg: number,
  inQty: number,
  unitCost: number,
): number {
  const totalQty = prevQty + inQty;
  if (totalQty <= 0) return unitCost;
  return (prevQty * prevAvg + inQty * unitCost) / totalQty;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function opaqueQrToken(): string {
  const rand = cryptoRandom(24);
  return `ad_qr_${rand}`;
}

function cryptoRandom(bytes: number): string {
  // Evita dependencia de node:crypto en browsers; en API usamos randomUUID-like.
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < bytes; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Período HOY en timezone IANA (fallback UTC si Intl falla). */
export function todayPeriodBounds(
  timezone: string,
  now = new Date(),
): { periodStart: Date; periodEnd: Date; dateKey: string } {
  let dateKey: string;
  try {
    dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    dateKey = now.toISOString().slice(0, 10);
  }
  // Aproximación estable: [dateKey 00:00, dateKey+1 00:00) interpretado en UTC offset fijo.
  // Para producción F3 se puede refinar con librería TZ; F2 documenta esta consistencia backend.
  const periodStart = new Date(`${dateKey}T00:00:00.000Z`);
  const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
  return { periodStart, periodEnd, dateKey };
}
