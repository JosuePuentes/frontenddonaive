import { useMemo, useState } from "react";
import {
  formatAdPrice,
  toBaseUnits,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type {
  AdPaymentMethod,
  AdSaleItem,
} from "@/types/ad-licoreria";

const PAY_METHODS: { id: AdPaymentMethod; label: string }[] = [
  { id: "efectivo_usd", label: "Efectivo USD" },
  { id: "efectivo_bs", label: "Efectivo Bs" },
  { id: "transferencia", label: "Transferencia" },
  { id: "pago_movil", label: "Pago móvil" },
  { id: "qr", label: "QR" },
  { id: "otro", label: "Otro" },
];

export default function AdLicoreriaVentas() {
  const {
    products,
    presentations,
    tables,
    operators,
    customers,
    getPresentationsFor,
    getStock,
    completeSale,
    openAccount,
    addAccountItem,
    createPrepaid,
  } = useAdLicoreria();

  const mesoneras = operators.filter((o) => o.role === "mesonera" && o.active);
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(1);
  const [tableId, setTableId] = useState("");
  const [mesoneraId, setMesoneraId] = useState(mesoneras[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState<AdSaleItem[]>([]);
  const [payMethod, setPayMethod] = useState<AdPaymentMethod>("efectivo_usd");
  const [payAmount, setPayAmount] = useState("");
  const [payments, setPayments] = useState<
    { method: AdPaymentMethod; currency: "USD" | "BS"; amount: number }[]
  >([]);
  const [msg, setMsg] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.filter((p) => p.active);
    return products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)),
    );
  }, [products, query]);

  const availablePres = getPresentationsFor(productId);
  const activePres =
    presentations.find((p) => p.id === presentationId) ?? availablePres[0];
  const mesonera = operators.find((o) => o.id === mesoneraId);
  const customer = customers.find((c) => c.id === customerId);
  const totalUsd = cart.reduce((a, l) => a + l.unitPrice.usd * l.qty, 0);

  function addLine() {
    const pres = activePres;
    if (!pres) return;
    setCart((prev) => [
      ...prev,
      {
        productId,
        presentationId: pres.id,
        qty,
        unitPrice: { ...pres.price },
        qtyBase: toBaseUnits(pres, qty),
      },
    ]);
    setMsg("");
  }

  function addPayment() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    const currency = payMethod === "efectivo_bs" ? "BS" : "USD";
    setPayments((p) => [...p, { method: payMethod, currency, amount }]);
    setPayAmount("");
  }

  function checkout() {
    const result = completeSale({
      items: cart,
      payments,
      warehouseId: "wh-2",
      userName: mesonera?.name ?? "Cajero",
      tableId: tableId || undefined,
      mesoneraName: mesonera?.name,
      customerName: customer?.name,
    });
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setCart([]);
    setPayments([]);
    setMsg(`Venta OK · $${result.data.total.usd.toFixed(2)}`);
  }

  function leaveOpen() {
    if (!cart.length) {
      setMsg("Agregue productos");
      return;
    }
    const opened = openAccount({
      tableId: tableId || undefined,
      mesoneraId: mesonera?.id,
      mesoneraName: mesonera?.name ?? "Mesonera",
      customerId: customer?.id,
      customerName: customer?.name,
    });
    if (!opened.ok) {
      setMsg(opened.error);
      return;
    }
    for (const line of cart) {
      const r = addAccountItem({
        accountId: opened.data.id,
        productId: line.productId,
        presentationId: line.presentationId,
        qty: line.qty,
        userName: mesonera?.name ?? "Mesonera",
        deductStock: true,
        warehouseId: "wh-2",
      });
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
    }
    setCart([]);
    setPayments([]);
    setMsg(`Cuenta abierta #${opened.data.number}`);
  }

  function toPrepaid() {
    if (!cart.length) {
      setMsg("Agregue productos");
      return;
    }
    const result = createPrepaid({
      customerId: customer?.id,
      customerName: customer?.name,
      items: cart.map((c) => ({
        productId: c.productId,
        presentationId: c.presentationId,
        qty: c.qty,
      })),
      userName: mesonera?.name ?? "Cajero",
    });
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setCart([]);
    setPayments([]);
    setMsg(`Prepago ${result.data.code} · QR listo`);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Centro de ventas</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="ad-select"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
          >
            <option value="">Sin mesa</option>
            {tables
              .filter((t) => t.active)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {t.number} ({t.status})
                </option>
              ))}
          </select>
          <select
            className="ad-select"
            value={mesoneraId}
            onChange={(e) => setMesoneraId(e.target.value)}
          >
            {mesoneras.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Cliente opcional</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <input
          className="ad-input"
          placeholder="Buscar producto, SKU o marca…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid max-h-40 gap-1 overflow-auto sm:grid-cols-2">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`ad-btn text-left ${productId === p.id ? "ad-btn--primary" : ""}`}
              onClick={() => {
                setProductId(p.id);
                setPresentationId("");
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1.4fr_0.6fr_auto]">
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
          <input
            className="ad-input"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
          <button type="button" className="ad-btn ad-btn--gold" onClick={addLine}>
            + Agregar
          </button>
        </div>
        <p className="text-xs text-[var(--ad-muted)]">
          Stock Depósito 2:{" "}
          <strong className="text-[var(--ad-gold-soft)]">
            {getStock(productId, "wh-2")}
          </strong>{" "}
          u. base
          {activePres
            ? ` · línea = ${toBaseUnits(activePres, qty)} u. base`
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
                <th />
              </tr>
            </thead>
            <tbody>
              {cart.map((l, i) => {
                const prod = products.find((p) => p.id === l.productId);
                const pres = presentations.find(
                  (p) => p.id === l.presentationId,
                );
                return (
                  <tr key={`${l.presentationId}-${i}`}>
                    <td>{prod?.name}</td>
                    <td>{pres?.name}</td>
                    <td>{l.qty}</td>
                    <td>{l.qtyBase}</td>
                    <td>
                      {formatAdPrice({
                        usd: l.unitPrice.usd * l.qty,
                        bs: l.unitPrice.bs * l.qty,
                      })}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ad-btn"
                        onClick={() =>
                          setCart((c) => c.filter((_, idx) => idx !== i))
                        }
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!cart.length ? (
                <tr>
                  <td colSpan={6} className="text-[var(--ad-muted)]">
                    Carrito vacío
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Cobro / cuenta</h2>
        <p className="ad-display text-4xl text-[var(--ad-gold-soft)]">
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
        <div className="grid gap-2">
          <button type="button" className="ad-btn ad-btn--gold" onClick={checkout}>
            Cobrar y cerrar
          </button>
          <button type="button" className="ad-btn ad-btn--primary" onClick={leaveOpen}>
            Dejar cuenta abierta
          </button>
          <button type="button" className="ad-btn" onClick={toPrepaid}>
            Convertir a prepago + QR
          </button>
        </div>
        {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      </section>
    </div>
  );
}
