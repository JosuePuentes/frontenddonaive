/**
 * POS — carrito, cobro mixto USD/Bs y descuento de stock.
 */

import { pricesFromCpp } from "@/lib/donaive-software/cpp";
import { completeDsPrice } from "@/lib/donaive-software/rates";
import type {
  DsPayment,
  DsPaymentMethod,
  DsProduct,
  DsSale,
  DsSaleLine,
  DsStockMovement,
} from "@/types/donaive-software";

export const DS_PAYMENT_METHODS: {
  code: DsPaymentMethod;
  label: string;
  currency: "USD" | "BS";
}[] = [
  { code: "efectivo_usd", label: "Efectivo USD", currency: "USD" },
  { code: "efectivo_bs", label: "Efectivo Bs", currency: "BS" },
  { code: "pago_movil", label: "Pago móvil", currency: "BS" },
  { code: "transferencia", label: "Transferencia", currency: "BS" },
  { code: "zelle", label: "Zelle", currency: "USD" },
  { code: "tarjeta", label: "Tarjeta", currency: "BS" },
  { code: "otro", label: "Otro", currency: "USD" },
];

export const DS_PAYMENT_LABELS: Record<DsPaymentMethod, string> = {
  efectivo_usd: "Efectivo USD",
  efectivo_bs: "Efectivo Bs",
  pago_movil: "Pago móvil",
  transferencia: "Transferencia",
  zelle: "Zelle",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function productUnitSaleUsd(p: DsProduct): number {
  if (p.saleUnitUsd && p.saleUnitUsd > 0) return p.saleUnitUsd;
  const px = pricesFromCpp(
    p.stock.unitCostUsd,
    p.unitsPerBox,
    p.utilityPercent || 30,
  );
  return px.unitSale;
}

export function productBoxSaleUsd(p: DsProduct): number {
  if (p.saleBoxUsd && p.saleBoxUsd > 0) return p.saleBoxUsd;
  return productUnitSaleUsd(p) * Math.max(1, p.unitsPerBox);
}

export type CartItem = {
  key: string;
  productId: string;
  sellMode: "UNIT" | "BOX";
  qty: number;
};

export function cartItemToLine(
  item: CartItem,
  product: DsProduct,
  bcv: number,
): DsSaleLine | null {
  if (item.qty <= 0) return null;
  const upp = Math.max(1, product.unitsPerBox);
  const qtyBase =
    item.sellMode === "BOX" ? item.qty * upp : item.qty;
  const unitUsd =
    item.sellMode === "BOX"
      ? productBoxSaleUsd(product) / upp
      : productUnitSaleUsd(product);
  const lineTotalUsd =
    item.sellMode === "BOX"
      ? productBoxSaleUsd(product) * item.qty
      : productUnitSaleUsd(product) * item.qty;
  const money = completeDsPrice({ usd: lineTotalUsd, bs: 0 }, bcv);
  const unitMoney = completeDsPrice({ usd: unitUsd, bs: 0 }, bcv);
  return {
    key: item.key,
    productId: product.id,
    productLabel: `${product.sku} ${product.name}`.trim(),
    sku: product.sku,
    sellMode: item.sellMode,
    qty: item.qty,
    qtyBase,
    unitPriceUsd: unitMoney.usd,
    unitPriceBs: unitMoney.bs,
    lineTotalUsd: money.usd,
    lineTotalBs: money.bs,
    unitCostUsd: product.stock.unitCostUsd,
  };
}

export function cartTotals(lines: DsSaleLine[]) {
  let totalUsd = 0;
  let totalBs = 0;
  for (const l of lines) {
    totalUsd += l.lineTotalUsd;
    totalBs += l.lineTotalBs;
  }
  return { totalUsd, totalBs };
}

/** Equivalente USD de un pago (Bs ÷ BCV). */
export function paymentUsdEquivalent(pay: DsPayment, bcv: number): number {
  if (pay.currency === "USD") return pay.amount;
  const rate = bcv > 0 ? bcv : 1;
  return pay.amount / rate;
}

export function paymentsCoverage(payments: DsPayment[], bcv: number) {
  let paidUsdEq = 0;
  let paidUsd = 0;
  let paidBs = 0;
  for (const p of payments) {
    paidUsdEq += paymentUsdEquivalent(p, bcv);
    if (p.currency === "USD") paidUsd += p.amount;
    else paidBs += p.amount;
  }
  return { paidUsdEq, paidUsd, paidBs };
}

export function remainingToPay(
  totalUsd: number,
  payments: DsPayment[],
  bcv: number,
) {
  const { paidUsdEq } = paymentsCoverage(payments, bcv);
  const remainUsd = Math.max(0, totalUsd - paidUsdEq);
  const remainBs = remainUsd * (bcv > 0 ? bcv : 1);
  return { remainUsd, remainBs, covered: remainUsd < 0.01 };
}

export type CompleteSaleInput = {
  products: DsProduct[];
  cart: CartItem[];
  payments: DsPayment[];
  bcv: number;
  createdBy?: string;
  operatorId?: string;
  allowShortage?: boolean;
};

export function completeSale(
  input: CompleteSaleInput,
):
  | {
      ok: true;
      sale: DsSale;
      products: DsProduct[];
      movements: DsStockMovement[];
    }
  | { ok: false; error: string } {
  if (!input.cart.length) {
    return { ok: false, error: "Agregue productos al carrito" };
  }
  if (!input.payments.length) {
    return { ok: false, error: "Agregue al menos un pago" };
  }

  const lines: DsSaleLine[] = [];
  const stockNeed = new Map<string, number>();

  for (const item of input.cart) {
    const product = input.products.find((p) => p.id === item.productId);
    if (!product) {
      return { ok: false, error: "Producto no encontrado en el carrito" };
    }
    const line = cartItemToLine(item, product, input.bcv);
    if (!line) {
      return { ok: false, error: "Cantidad inválida en el carrito" };
    }
    if (!(productUnitSaleUsd(product) > 0) && !(product.saleBoxUsd && product.saleBoxUsd > 0)) {
      // still allow if unit cost based price exists via productUnitSaleUsd
    }
    if (!(line.lineTotalUsd > 0)) {
      return {
        ok: false,
        error: `${product.name} no tiene precio de venta. Actualice PVP o compre mercancía.`,
      };
    }
    lines.push(line);
    stockNeed.set(
      product.id,
      (stockNeed.get(product.id) ?? 0) + line.qtyBase,
    );
  }

  if (!input.allowShortage) {
    for (const [productId, need] of stockNeed) {
      const p = input.products.find((x) => x.id === productId)!;
      if (p.stock.qtyBase < need) {
        return {
          ok: false,
          error: `Stock insuficiente: ${p.name} (hay ${p.stock.qtyBase} u., necesita ${need})`,
        };
      }
    }
  }

  const { totalUsd, totalBs } = cartTotals(lines);
  const rem = remainingToPay(totalUsd, input.payments, input.bcv);
  if (!rem.covered) {
    return {
      ok: false,
      error: `Falta por cobrar $${rem.remainUsd.toFixed(2)} (Bs ${rem.remainBs.toFixed(2)})`,
    };
  }

  const products = input.products.map((p) => {
    const need = stockNeed.get(p.id);
    if (!need) return p;
    return {
      ...p,
      stock: {
        ...p.stock,
        qtyBase: Math.max(0, p.stock.qtyBase - need),
      },
    };
  });

  const now = new Date().toISOString();
  const saleId = uid("sale");
  const receiptNumber = `T-${Date.now().toString().slice(-8)}`;

  const movements: DsStockMovement[] = lines.map((l) => ({
    id: uid("mov"),
    type: "VENTA" as const,
    productId: l.productId,
    productLabel: l.productLabel,
    qtyBase: -l.qtyBase,
    unitCostUsd: l.unitCostUsd,
    note: `Ticket ${receiptNumber}`,
    refId: saleId,
    createdAt: now,
    createdBy: input.createdBy,
  }));

  const sale: DsSale = {
    id: saleId,
    receiptNumber,
    lines,
    payments: input.payments.map((p) => ({ ...p })),
    totalUsd,
    totalBs,
    bcvRateAtSale: input.bcv,
    status: "completed",
    createdAt: now,
    createdBy: input.createdBy,
    operatorId: input.operatorId,
  };

  return { ok: true, sale, products, movements };
}
