/**
 * Bancos y métodos de pago — ingresos de venta y egresos de CxP.
 */

import { DS_PAYMENT_LABELS, paymentUsdEquivalent } from "@/lib/donaive-software/sales";
import type {
  DsBank,
  DsBankMovement,
  DsChangeLine,
  DsPayment,
  DsPaymentMethod,
} from "@/types/donaive-software";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultBanks(): DsBank[] {
  const now = new Date().toISOString();
  return [
    {
      id: "bank-caja-usd",
      name: "Caja efectivo USD",
      currency: "USD",
      paymentMethods: ["efectivo_usd"],
      active: true,
      createdAt: now,
    },
    {
      id: "bank-caja-bs",
      name: "Caja efectivo Bs",
      currency: "BS",
      paymentMethods: ["efectivo_bs"],
      active: true,
      createdAt: now,
    },
  ];
}

export function bankForMethod(
  banks: DsBank[],
  method: DsPaymentMethod,
): DsBank | undefined {
  return banks.find((b) => b.active && b.paymentMethods.includes(method));
}

export function methodsWithoutBank(
  banks: DsBank[],
  methods: DsPaymentMethod[],
): DsPaymentMethod[] {
  return methods.filter((m) => !bankForMethod(banks, m));
}

export function amountInBankCurrency(
  bank: DsBank,
  currency: "USD" | "BS",
  amount: number,
  bcv: number,
): number {
  const rate = bcv > 0 ? bcv : 1;
  if (bank.currency === currency) return amount;
  if (bank.currency === "USD") return amount / rate;
  return amount * rate;
}

export function bankBalance(
  bankId: string,
  movements: DsBankMovement[],
): number {
  let bal = 0;
  for (const m of movements) {
    if (m.bankId !== bankId) continue;
    bal += m.kind === "INCOME" ? m.amount : -m.amount;
  }
  return bal;
}

export function movementFromPayment(input: {
  bank: DsBank;
  payment: DsPayment;
  bcv: number;
  reference: string;
  note: string;
  operatorId?: string;
}): DsBankMovement {
  const amount = amountInBankCurrency(
    input.bank,
    input.payment.currency,
    input.payment.amount,
    input.bcv,
  );
  const usd = paymentUsdEquivalent(input.payment, input.bcv);
  const bs =
    input.payment.currency === "BS"
      ? input.payment.amount
      : input.payment.amount * (input.bcv > 0 ? input.bcv : 1);
  return {
    id: uid("bmov"),
    bankId: input.bank.id,
    kind: "INCOME",
    amount,
    amountUsd: usd,
    amountBs: bs,
    method: input.payment.method,
    reference: input.reference,
    note: input.note,
    createdAt: new Date().toISOString(),
    operatorId: input.operatorId,
  };
}

export function movementFromChange(input: {
  bank: DsBank;
  change: DsChangeLine;
  bcv: number;
  reference: string;
  operatorId?: string;
}): DsBankMovement {
  const amount = amountInBankCurrency(
    input.bank,
    input.change.currency,
    input.change.amount,
    input.bcv,
  );
  const usd =
    input.change.currency === "USD"
      ? input.change.amount
      : input.change.amount / (input.bcv > 0 ? input.bcv : 1);
  const bs =
    input.change.currency === "BS"
      ? input.change.amount
      : input.change.amount * (input.bcv > 0 ? input.bcv : 1);
  return {
    id: uid("bmov"),
    bankId: input.bank.id,
    kind: "OUTCOME",
    amount,
    amountUsd: usd,
    amountBs: bs,
    method: input.bank.currency === "USD" ? "efectivo_usd" : "efectivo_bs",
    reference: input.reference,
    note: "Vuelto de venta",
    createdAt: new Date().toISOString(),
    operatorId: input.operatorId,
  };
}

export function movementFromAccount(input: {
  bank: DsBank;
  kind: "INCOME" | "OUTCOME";
  amount: number;
  accountCurrency: "USD" | "BS";
  bcv: number;
  method?: DsPaymentMethod;
  reference: string;
  note: string;
  operatorId?: string;
}): DsBankMovement {
  const amount = amountInBankCurrency(
    input.bank,
    input.accountCurrency,
    input.amount,
    input.bcv,
  );
  const usd =
    input.accountCurrency === "USD"
      ? input.amount
      : input.amount / (input.bcv > 0 ? input.bcv : 1);
  const bs =
    input.accountCurrency === "BS"
      ? input.amount
      : input.amount * (input.bcv > 0 ? input.bcv : 1);
  return {
    id: uid("bmov"),
    bankId: input.bank.id,
    kind: input.kind,
    amount,
    amountUsd: usd,
    amountBs: bs,
    method: input.method,
    reference: input.reference,
    note: input.note,
    createdAt: new Date().toISOString(),
    operatorId: input.operatorId,
  };
}

export function assignMethodToBank(
  banks: DsBank[],
  bankId: string,
  methods: DsPaymentMethod[],
): DsBank[] {
  return banks.map((b) => {
    if (b.id === bankId) {
      return { ...b, paymentMethods: [...methods] };
    }
    return {
      ...b,
      paymentMethods: b.paymentMethods.filter((m) => !methods.includes(m)),
    };
  });
}

export function bankLabelForMethod(
  banks: DsBank[],
  method: DsPaymentMethod,
): string {
  const bank = bankForMethod(banks, method);
  if (!bank) return `${DS_PAYMENT_LABELS[method]} · sin banco`;
  return `${DS_PAYMENT_LABELS[method]} · ${bank.name}`;
}
