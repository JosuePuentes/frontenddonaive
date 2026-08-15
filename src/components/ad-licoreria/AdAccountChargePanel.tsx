import { useMemo, useState } from "react";
import {
  accountAvailable,
  addPrices,
  multiplyPrice,
} from "@/lib/ad-licoreria/conversions";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import type {
  AdAccount,
  AdPaymentMethodCode,
} from "@/types/ad-licoreria";
import { AdReceiptDocument } from "@/components/ad-licoreria/AdDocumentViews";

type Props = {
  account: AdAccount;
  operatorName: string;
  onClose: () => void;
  onDone?: (msg: string) => void;
};

/**
 * Cobro embebido sobre una cuenta abierta (mesonera / piso).
 * No navega a /ventas vacío: la cuenta queda precargada.
 */
export function AdAccountChargePanel({
  account,
  operatorName,
  onClose,
  onDone,
}: Props) {
  const {
    products,
    presentations,
    tables,
    paymentMethods,
    addAccountPayment,
    closeAccount,
    findReceipt,
    accounts,
  } = useAdLicoreria();

  const live =
    accounts.find((a) => a.id === account.id) ?? account;

  const [payMethod, setPayMethod] =
    useState<AdPaymentMethodCode>("efectivo_usd");
  const [payAmount, setPayAmount] = useState("");
  const [payBank, setPayBank] = useState("");
  const [payRef, setPayRef] = useState("");
  const [settleAs, setSettleAs] = useState<"commitment" | "prepaid">(
    "prepaid",
  );
  const [confirmClose, setConfirmClose] = useState(false);
  const [msg, setMsg] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  const activeMethods = paymentMethods.filter((m) => m.active);
  const methodCfg = activeMethods.find((m) => m.code === payMethod);
  const table = tables.find((t) => t.id === live.tableId);

  const totals = useMemo(() => {
    const sub = live.items.reduce(
      (acc, it) => addPrices(acc, multiplyPrice(it.unitPrice, it.qty)),
      { usd: 0, bs: 0 },
    );
    const total = {
      usd: Math.max(0, sub.usd - (live.discountUsd || 0)),
      bs: Math.max(0, sub.bs - (live.discountBs || 0)),
    };
    const paidUsd = live.payments
      .filter((p) => p.currency === "USD")
      .reduce((s, p) => s + p.amount, 0);
    const paidBs = live.payments
      .filter((p) => p.currency === "BS")
      .reduce((s, p) => s + p.amount, 0);
    const served = live.items.reduce((s, it) => s + it.qtyServed, 0);
    const pending = live.items.reduce(
      (s, it) => s + accountAvailable(it.qty, it.qtyServed),
      0,
    );
    const ordered = live.items.reduce((s, it) => s + it.qty, 0);
    return {
      sub,
      total,
      paidUsd,
      paidBs,
      balanceUsd: Math.max(0, total.usd - paidUsd),
      balanceBs: Math.max(0, total.bs - paidBs),
      served,
      pending,
      ordered,
    };
  }, [live]);

  const receipt = receiptNumber
    ? findReceipt(receiptNumber)
    : undefined;

  async function addPay() {
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMsg("Monto inválido");
      return;
    }
    const r = await resolveAdResult(
      addAccountPayment({
        accountId: live.id,
        method: payMethod,
        currency: methodCfg?.currency ?? "USD",
        amount,
        userName: operatorName,
        bank: payBank || undefined,
        reference: payRef || undefined,
      }),
    );
    setMsg(r.ok ? "Pago registrado" : r.error);
    if (r.ok) {
      setPayAmount("");
      setPayBank("");
      setPayRef("");
    }
  }

  async function doClose() {
    if (!confirmClose) {
      setConfirmClose(true);
      setMsg("Confirme el cierre de la cuenta");
      return;
    }
    const r = await resolveAdResult(
      closeAccount({
        accountId: live.id,
        userName: operatorName,
        settlePendingAs: totals.pending > 0 ? settleAs : "commitment",
        notes: `Cobro piso · ${operatorName}`,
      }),
    );
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setReceiptNumber(r.data.receiptNumber ?? null);
    setMsg(
      r.data.receiptNumber
        ? `Cuenta cerrada · ${r.data.receiptNumber}`
        : "Cuenta cerrada",
    );
    onDone?.(
      totals.pending > 0 && settleAs === "prepaid"
        ? "Cerrada con prepago/QR por pendiente"
        : "Cuenta cobrada y cerrada",
    );
  }

  if (receipt) {
    return (
      <div className="ad-modal-backdrop" role="dialog" aria-modal="true">
        <div className="ad-modal ad-modal--wide">
          <AdReceiptDocument
            receipt={receipt}
            title="Recibo de cuenta"
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ad-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ad-modal ad-modal--wide space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="ad-eyebrow">Cobro embebido</p>
            <h2 className="ad-panel-title">
              Cuenta #{live.number} ·{" "}
              {table?.code ?? table?.number ?? "Sin mesa"}
            </h2>
            <p className="text-sm text-[var(--ad-muted)]">
              {live.customerName ?? "Cliente"} · {live.mesoneraName} ·{" "}
              {warehouseLabel(live.warehouseId ?? "")}
            </p>
          </div>
          <button type="button" className="ad-btn" onClick={onClose}>
            Cerrar panel
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Total USD" value={`$${totals.total.usd.toFixed(2)}`} />
          <Stat label="Total Bs" value={totals.total.bs.toFixed(0)} />
          <Stat
            label="Saldo USD"
            value={`$${totals.balanceUsd.toFixed(2)}`}
            danger={totals.balanceUsd > 0.01}
          />
          <Stat
            label="Saldo Bs"
            value={totals.balanceBs.toFixed(0)}
            danger={totals.balanceBs > 0.01}
          />
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <p>
            Pedido: <strong>{totals.ordered}</strong>
          </p>
          <p>
            Servido: <strong>{totals.served}</strong>
          </p>
          <p>
            Pendiente: <strong>{totals.pending}</strong>
          </p>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Ped.</th>
                <th>Serv.</th>
                <th>Pend.</th>
                <th>USD</th>
              </tr>
            </thead>
            <tbody>
              {live.items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {products.find((p) => p.id === it.productId)?.name}
                    <div className="text-xs text-[var(--ad-muted)]">
                      {
                        presentations.find((p) => p.id === it.presentationId)
                          ?.name
                      }
                    </div>
                  </td>
                  <td>{it.qty}</td>
                  <td>{it.qtyServed}</td>
                  <td>{accountAvailable(it.qty, it.qtyServed)}</td>
                  <td>
                    {multiplyPrice(it.unitPrice, it.qty).usd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--ad-gold-soft)]">
            Pagos realizados
          </h3>
          {live.payments.length ? (
            <ul className="space-y-1 text-sm">
              {live.payments.map((p) => (
                <li key={p.id}>
                  {p.method} · {p.currency} {p.amount}
                  {p.reference ? ` · ${p.reference}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--ad-muted)]">Sin pagos aún</p>
          )}
        </section>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <select
            className="ad-select"
            value={payMethod}
            onChange={(e) =>
              setPayMethod(e.target.value as AdPaymentMethodCode)
            }
          >
            {activeMethods.map((m) => (
              <option key={m.id} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            className="ad-input"
            placeholder="Monto"
            inputMode="decimal"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          {methodCfg?.requiresBank ? (
            <input
              className="ad-input"
              placeholder="Banco"
              value={payBank}
              onChange={(e) => setPayBank(e.target.value)}
            />
          ) : null}
          {methodCfg?.requiresReference ? (
            <input
              className="ad-input"
              placeholder="Referencia"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />
          ) : null}
          <button type="button" className="ad-btn ad-btn--gold" onClick={addPay}>
            Agregar pago
          </button>
        </section>

        {totals.pending > 0 ? (
          <section className="ad-cop__alert space-y-2">
            <p className="text-sm">
              Hay <strong>{totals.pending}</strong> unidades pendientes de
              servir. Al cerrar:
            </p>
            <select
              className="ad-select max-w-md"
              value={settleAs}
              onChange={(e) =>
                setSettleAs(e.target.value as "commitment" | "prepaid")
              }
            >
              <option value="prepaid">Generar prepago / QR</option>
              <option value="commitment">Compromiso cliente (no bloquea ventas)</option>
            </select>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`ad-btn ${confirmClose ? "ad-btn--primary" : "ad-btn--gold"}`}
            onClick={doClose}
          >
            {confirmClose ? "Confirmar cierre y recibo" : "Cerrar cuenta / recibo"}
          </button>
          {confirmClose ? (
            <button
              type="button"
              className="ad-btn"
              onClick={() => setConfirmClose(false)}
            >
              Cancelar confirmación
            </button>
          ) : null}
        </div>

        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
        ) : null}
      </div>
    </div>
  );
}

function Stat(props: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="ad-panel !p-3">
      <p className="ad-eyebrow">{props.label}</p>
      <p
        className={`ad-display text-2xl ${
          props.danger ? "text-[var(--ad-danger)]" : "text-[var(--ad-gold-soft)]"
        }`}
      >
        {props.value}
      </p>
    </div>
  );
}
