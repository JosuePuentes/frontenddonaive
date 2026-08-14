import { useMemo, useState } from "react";
import { formatAdPrice, toBaseUnits } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type {
  AdPaymentLine,
  AdPaymentMethod,
  AdSaleLine,
} from "@/types/ad-licoreria";

const PAY_METHODS: { id: AdPaymentMethod; label: string }[] = [
  { id: "efectivo_usd", label: "Efectivo USD" },
  { id: "efectivo_bs", label: "Efectivo BS" },
  { id: "pago_movil", label: "Pago móvil" },
  { id: "transferencia", label: "Transferencia" },
  { id: "zelle", label: "Zelle" },
  { id: "punto_venta", label: "Punto de venta" },
  { id: "qr", label: "QR" },
  { id: "otro", label: "Otro" },
];

export default function AdLicoreriaVentas() {
  const {
    products,
    presentations,
    getPresentationsFor,
    getStock,
    completeSale,
  } = useAdLicoreria();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(1);
  const [lines, setLines] = useState<AdSaleLine[]>([]);
  const [payMethod, setPayMethod] = useState<AdPaymentMethod>("efectivo_usd");
  const [payAmount, setPayAmount] = useState("");
  const [payments, setPayments] = useState<AdPaymentLine[]>([]);
  const [msg, setMsg] = useState("");

  const availablePres = useMemo(
    () => getPresentationsFor(productId),
    [getPresentationsFor, productId],
  );

  const activePres =
    presentations.find((p) => p.id === presentationId) ?? availablePres[0];

  const totalUsd = lines.reduce((a, l) => a + l.unitPrice.usd * l.qty, 0);
  const paidUsd = payments
    .filter((p) => p.currency === "USD")
    .reduce((a, p) => a + p.amount, 0);

  function addLine() {
    const pres = activePres;
    if (!pres) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const qtyBase = toBaseUnits(pres, qty);
    setLines((prev) => [
      ...prev,
      {
        productId,
        presentationId: pres.id,
        qty,
        unitPrice: { ...pres.price },
        qtyBase,
      },
    ]);
    setMsg("");
  }

  function addPayment() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    const currency = payMethod.includes("bs") ? "BS" : "USD";
    setPayments((p) => [
      ...p,
      { method: payMethod, currency, amount },
    ]);
    setPayAmount("");
  }

  function checkout() {
    const result = completeSale({
      lines,
      payments,
      warehouseId: "wh-barra",
      userName: "Cajero",
    });
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setLines([]);
    setPayments([]);
    setMsg(`Venta registrada · $${result.sale.total.usd.toFixed(2)}`);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Agregar producto</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-[var(--ad-muted)]">
            Producto
            <select
              className="ad-select"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setPresentationId("");
              }}
            >
              {products
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-[var(--ad-muted)]">
            Presentación
            <select
              className="ad-select"
              value={activePres?.id ?? ""}
              onChange={(e) => setPresentationId(e.target.value)}
            >
              {availablePres.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unitsPerPresentation} u.) · {formatAdPrice(p.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-[var(--ad-muted)]">
            Cantidad
            <input
              className="ad-input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </label>
          <div className="flex items-end">
            <button type="button" className="ad-btn ad-btn--primary w-full" onClick={addLine}>
              Agregar
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--ad-muted)]">
          Stock barra:{" "}
          <strong className="text-[var(--ad-gold-soft)]">
            {getStock(productId, "wh-barra")}
          </strong>{" "}
          unidades base
          {activePres
            ? ` · esta línea = ${toBaseUnits(activePres, qty)} u. base`
            : null}
        </p>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Presentación</th>
                <th>Cant.</th>
                <th>Base</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const prod = products.find((p) => p.id === l.productId);
                const pres = presentations.find((p) => p.id === l.presentationId);
                return (
                  <tr key={`${l.presentationId}-${i}`}>
                    <td>{prod?.name}</td>
                    <td>{pres?.name}</td>
                    <td>{l.qty}</td>
                    <td>{l.qtyBase}</td>
                    <td>{formatAdPrice({ usd: l.unitPrice.usd * l.qty, bs: l.unitPrice.bs * l.qty })}</td>
                  </tr>
                );
              })}
              {!lines.length ? (
                <tr>
                  <td colSpan={5} className="text-[var(--ad-muted)]">
                    Sin ítems
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Pago (puede ser mixto)</h2>
        <p className="ad-display text-3xl text-[var(--ad-gold-soft)]">
          ${totalUsd.toFixed(2)}
        </p>
        <div className="grid gap-2">
          <select
            className="ad-select"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value as AdPaymentMethod)}
          >
            {PAY_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            className="ad-input"
            placeholder="Monto"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <button type="button" className="ad-btn" onClick={addPayment}>
            Añadir pago
          </button>
        </div>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {payments.map((p, i) => (
            <li key={`${p.method}-${i}`}>
              {p.method} · {p.currency} {p.amount}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--ad-muted)]">
          Pagado USD: ${paidUsd.toFixed(2)}
        </p>
        <button type="button" className="ad-btn ad-btn--gold w-full" onClick={checkout}>
          Cerrar venta
        </button>
        {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      </section>
    </div>
  );
}
