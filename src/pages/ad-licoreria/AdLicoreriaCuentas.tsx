import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  accountAvailable,
  addPrices,
  formatAdPrice,
  multiplyPrice,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type { AdPaymentMethodCode } from "@/types/ad-licoreria";

export default function AdLicoreriaCuentas() {
  const {
    accounts,
    products,
    presentations,
    tables,
    paymentMethods,
    closeAccount,
    reopenAccount,
    voidAccount,
    applyDiscount,
    addAccountPayment,
    serveAccountItem,
  } = useAdLicoreria();

  const [msg, setMsg] = useState("");
  const [auth, setAuth] = useState("");
  const [reason, setReason] = useState("");
  const [discountUsd, setDiscountUsd] = useState(0);
  const [payAccountId, setPayAccountId] = useState("");
  const [payMethod, setPayMethod] = useState<AdPaymentMethodCode>("efectivo_usd");
  const [payAmount, setPayAmount] = useState("");
  const [payBank, setPayBank] = useState("");
  const [payRef, setPayRef] = useState("");

  const activeMethods = paymentMethods.filter((m) => m.active);
  const methodCfg = activeMethods.find((m) => m.code === payMethod);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn ad-btn--gold">
          Mesonera
        </Link>
        <Link to={AD_LICORERIA_ROUTES.prepagos} className="ad-btn">
          Prepagos
        </Link>
        <Link to={AD_LICORERIA_ROUTES.qr} className="ad-btn">
          QR
        </Link>
        <Link to={AD_LICORERIA_ROUTES.mesas} className="ad-btn">
          Mesas
        </Link>
        <Link to={AD_LICORERIA_ROUTES.ventas} className="ad-btn">
          Ventas
        </Link>
      </div>

      <section className="ad-panel grid gap-2 sm:grid-cols-4">
        <input
          className="ad-input"
          placeholder="Autorización (admin)"
          value={auth}
          onChange={(e) => setAuth(e.target.value)}
        />
        <input
          className="ad-input sm:col-span-2"
          placeholder="Motivo anulación / descuento / reapertura"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <input
          className="ad-input"
          type="number"
          placeholder="Desc. USD"
          value={discountUsd}
          onChange={(e) => setDiscountUsd(Number(e.target.value))}
        />
      </section>

      <section className="ad-panel grid gap-2 sm:grid-cols-5">
        <select
          className="ad-select"
          value={payAccountId}
          onChange={(e) => setPayAccountId(e.target.value)}
        >
          <option value="">Cuenta a pagar</option>
          {accounts
            .filter(
              (a) =>
                a.status !== "CERRADA" &&
                a.status !== "CANCELADA" &&
                a.status !== "PAGADA",
            )
            .map((a) => (
              <option key={a.id} value={a.id}>
                #{a.number}
              </option>
            ))}
        </select>
        <select
          className="ad-select"
          value={payMethod}
          onChange={(e) => setPayMethod(e.target.value as AdPaymentMethodCode)}
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
          value={payAmount}
          onChange={(e) => setPayAmount(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Banco / ref"
          value={methodCfg?.requiresBank ? payBank : payRef}
          onChange={(e) =>
            methodCfg?.requiresBank
              ? setPayBank(e.target.value)
              : setPayRef(e.target.value)
          }
        />
        <button
          type="button"
          className="ad-btn"
          onClick={() => {
            if (!payAccountId) return;
            const r = addAccountPayment({
              accountId: payAccountId,
              method: payMethod,
              currency: methodCfg?.currency ?? "USD",
              amount: Number(payAmount),
              userName: "Cajero",
              bank: payBank || undefined,
              reference: payRef || undefined,
            });
            setMsg(r.ok ? "Pago registrado" : r.error);
            if (r.ok) {
              setPayAmount("");
              setPayBank("");
              setPayRef("");
            }
          }}
        >
          Registrar pago
        </button>
      </section>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mesa</th>
              <th>Cliente</th>
              <th>Mesonera</th>
              <th>Consumo</th>
              <th>Total</th>
              <th>Pagos</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const table = tables.find((t) => t.id === a.tableId);
              const subtotal = a.items.reduce(
                (acc, it) => addPrices(acc, multiplyPrice(it.unitPrice, it.qty)),
                { usd: 0, bs: 0 },
              );
              const total = {
                usd: subtotal.usd - (a.discountUsd || 0),
                bs: subtotal.bs - (a.discountBs || 0),
              };
              const paidUsd = a.payments
                .filter((p) => p.currency === "USD")
                .reduce((s, p) => s + p.amount, 0);
              return (
                <tr key={a.id}>
                  <td>
                    #{a.number}
                    {a.receiptNumber ? (
                      <div className="text-xs text-[var(--ad-muted)]">
                        {a.receiptNumber}
                      </div>
                    ) : null}
                  </td>
                  <td>{table?.number ?? "—"}</td>
                  <td>
                    {a.customerName ?? "—"}
                    {a.customerPhone ? (
                      <div className="text-xs text-[var(--ad-muted)]">
                        {a.customerPhone}
                      </div>
                    ) : null}
                  </td>
                  <td>{a.mesoneraName ?? "—"}</td>
                  <td>
                    {a.items.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      const pr = presentations.find(
                        (x) => x.id === l.presentationId,
                      );
                      const pending = accountAvailable(l.qty, l.qtyServed);
                      return (
                        <div key={l.id} className="mb-1">
                          {p?.name} ({pr?.name}): sol.{l.qty} / serv.
                          {l.qtyServed} / pend.{pending}
                          {pending > 0 &&
                          a.status !== "CERRADA" &&
                          a.status !== "CANCELADA" ? (
                            <button
                              type="button"
                              className="ad-btn ml-1"
                              onClick={() => {
                                const r = serveAccountItem({
                                  accountId: a.id,
                                  itemId: l.id,
                                  qty: Math.min(1, pending),
                                  mesoneraName: a.mesoneraName ?? "Mesonera",
                                });
                                setMsg(
                                  r.ok
                                    ? `Servido 1 en #${a.number}`
                                    : r.error,
                                );
                              }}
                            >
                              +1 servir
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                    {!a.items.length ? "—" : null}
                  </td>
                  <td>
                    {formatAdPrice(total)}
                    {a.discountUsd > 0 ? (
                      <div className="text-xs text-[var(--ad-muted)]">
                        desc. ${a.discountUsd}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    ${paidUsd.toFixed(2)}
                    <div className="text-xs text-[var(--ad-muted)]">
                      {a.payments.length} mov.
                    </div>
                  </td>
                  <td>
                    <span className="ad-badge">{a.status}</span>
                  </td>
                  <td className="space-y-1">
                    {a.status !== "CERRADA" &&
                    a.status !== "CANCELADA" &&
                    a.status !== "PAGADA" ? (
                      <>
                        <button
                          type="button"
                          className="ad-btn"
                          onClick={() => {
                            const r = closeAccount({
                              accountId: a.id,
                              userName: "Admin A&D",
                            });
                            setMsg(
                              r.ok
                                ? `Cerrada · ${r.data.receiptNumber}`
                                : r.error,
                            );
                          }}
                        >
                          Cerrar
                        </button>
                        <button
                          type="button"
                          className="ad-btn"
                          onClick={() => {
                            const r = applyDiscount({
                              accountId: a.id,
                              discountUsd,
                              discountBs: 0,
                              reason,
                              userName: "Admin A&D",
                              authorizedBy: auth,
                            });
                            setMsg(r.ok ? "Descuento aplicado" : r.error);
                          }}
                        >
                          Descuento
                        </button>
                        <button
                          type="button"
                          className="ad-btn"
                          onClick={() => {
                            const r = voidAccount({
                              accountId: a.id,
                              userName: "Admin A&D",
                              reason,
                              authorizedBy: auth,
                            });
                            setMsg(r.ok ? "Cuenta anulada" : r.error);
                          }}
                        >
                          Anular
                        </button>
                      </>
                    ) : null}
                    {a.status === "CERRADA" || a.status === "PAGADA" ? (
                      <button
                        type="button"
                        className="ad-btn"
                        onClick={() => {
                          const r = reopenAccount({
                            accountId: a.id,
                            userName: "Admin A&D",
                            reason,
                          });
                          setMsg(r.ok ? "Cuenta reabierta" : r.error);
                        }}
                      >
                        Reabrir
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
    </div>
  );
}
