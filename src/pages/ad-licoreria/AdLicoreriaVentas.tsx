import { useMemo, useState } from "react";
import {
  formatAdPrice,
  toBaseUnits,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type {
  AdPayment,
  AdPaymentMethodCode,
  AdSaleItem,
} from "@/types/ad-licoreria";

type DraftPayment = Omit<AdPayment, "id" | "createdAt">;

export default function AdLicoreriaVentas() {
  const {
    products,
    presentations,
    tables,
    operators,
    customers,
    paymentMethods,
    getPresentationsFor,
    getStock,
    completeSale,
    openAccount,
    addAccountItem,
    createPrepaid,
  } = useAdLicoreria();

  const mesoneras = operators.filter(
    (o) => (o.role === "mesonera" || o.role === "cajero") && o.active,
  );
  const activeMethods = paymentMethods.filter((m) => m.active);

  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(1);
  const [tableId, setTableId] = useState("");
  const [mesoneraId, setMesoneraId] = useState(mesoneras[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState<AdSaleItem[]>([]);
  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState<AdPaymentMethodCode>(
    activeMethods[0]?.code ?? "efectivo_usd",
  );
  const [payAmount, setPayAmount] = useState("");
  const [payBank, setPayBank] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payOrigin, setPayOrigin] = useState("");
  const [payments, setPayments] = useState<DraftPayment[]>([]);
  const [msg, setMsg] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.filter((p) => p.active);
    return products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)),
    );
  }, [products, query]);

  const availablePres = getPresentationsFor(productId);
  const activePres =
    presentations.find((p) => p.id === presentationId) ?? availablePres[0];
  const mesonera = operators.find((o) => o.id === mesoneraId);
  const customer = customers.find((c) => c.id === customerId);
  const methodCfg = activeMethods.find((m) => m.code === payMethod);
  const totalUsd = cart.reduce((a, l) => a + l.unitPrice.usd * l.qty, 0);
  const totalBs = cart.reduce((a, l) => a + l.unitPrice.bs * l.qty, 0);

  function addLine() {
    const pres = activePres;
    if (!pres || qty <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.presentationId === pres.id);
      if (idx >= 0) {
        const next = [...prev];
        const line = next[idx];
        const newQty = line.qty + qty;
        next[idx] = {
          ...line,
          qty: newQty,
          qtyBase: toBaseUnits(pres, newQty),
        };
        return next;
      }
      return [
        ...prev,
        {
          productId,
          presentationId: pres.id,
          qty,
          unitPrice: { ...pres.price },
          qtyBase: toBaseUnits(pres, qty),
        },
      ];
    });
    setMsg("");
  }

  function setLineQty(index: number, nextQty: number) {
    setCart((prev) =>
      prev
        .map((l, i) => {
          if (i !== index) return l;
          const pres = presentations.find((p) => p.id === l.presentationId);
          if (!pres || nextQty <= 0) return l;
          return {
            ...l,
            qty: nextQty,
            qtyBase: toBaseUnits(pres, nextQty),
          };
        })
        .filter((l) => l.qty > 0),
    );
  }

  function addPayment() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    const currency = methodCfg?.currency ?? "USD";
    if (methodCfg?.requiresBank && !payBank.trim()) {
      setMsg("Este método requiere banco");
      return;
    }
    if (methodCfg?.requiresReference && !payRef.trim()) {
      setMsg("Este método requiere referencia");
      return;
    }
    setPayments((p) => [
      ...p,
      {
        method: payMethod,
        currency,
        amount,
        bank: payBank.trim() || undefined,
        reference: payRef.trim() || undefined,
        originPhone: payOrigin.trim() || undefined,
      },
    ]);
    setPayAmount("");
    setPayBank("");
    setPayRef("");
    setPayOrigin("");
    setMsg("");
  }

  function checkout() {
    const result = completeSale({
      items: cart,
      payments,
      warehouseId: "wh-2",
      userName: mesonera?.name ?? "Cajero",
      tableId: tableId || undefined,
      mesoneraName: mesonera?.name,
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      notes: notes.trim() || undefined,
    });
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setCart([]);
    setPayments([]);
    setNotes("");
    setMsg(
      `Venta OK · Recibo ${result.data.receiptNumber} · $${result.data.total.usd.toFixed(2)}`,
    );
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
      customerPhone: customer?.phone,
      notes: notes.trim() || undefined,
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
        deductStock: false,
        warehouseId: "wh-2",
      });
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
    }
    setCart([]);
    setPayments([]);
    setNotes("");
    setMsg(
      `Cuenta #${opened.data.number} abierta · productos pendientes de servir`,
    );
  }

  function toPrepaid() {
    if (!cart.length) {
      setMsg("Agregue productos");
      return;
    }
    if (!customer?.phone) {
      setMsg("Seleccione un cliente con teléfono para prepago");
      return;
    }
    const result = createPrepaid({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: cart.map((c) => ({
        productId: c.productId,
        presentationId: c.presentationId,
        qty: c.qty,
      })),
      payments,
      userName: mesonera?.name ?? "Cajero",
    });
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setCart([]);
    setPayments([]);
    setNotes("");
    setMsg(
      `Prepago ${result.data.code} · Recibo ${result.data.receiptNumber} · QR listo`,
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Punto de venta</h2>
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
                {m.name} · {m.role}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Cliente</option>
            {customers
              .filter((c) => c.active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
          </select>
        </div>

        <input
          className="ad-input"
          placeholder="Buscar por nombre, SKU o código…"
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
              <span className="mt-0.5 block text-xs opacity-70">{p.sku}</span>
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
                    <td>
                      <input
                        className="ad-input w-16"
                        type="number"
                        min={1}
                        value={l.qty}
                        onChange={(e) => setLineQty(i, Number(e.target.value))}
                      />
                    </td>
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

        <textarea
          className="ad-input min-h-16"
          placeholder="Observaciones de la venta / cuenta"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Cobro / cuenta</h2>
        <p className="ad-display text-4xl text-[var(--ad-gold-soft)]">
          ${totalUsd.toFixed(2)}
        </p>
        <p className="text-sm text-[var(--ad-muted)]">
          Bs {totalBs.toLocaleString("es-VE")} · pagos mixtos permitidos
        </p>
        <div className="grid gap-2">
          <select
            className="ad-select"
            value={payMethod}
            onChange={(e) =>
              setPayMethod(e.target.value as AdPaymentMethodCode)
            }
          >
            {activeMethods.map((m) => (
              <option key={m.id} value={m.code}>
                {m.name} ({m.currency})
              </option>
            ))}
          </select>
          <input
            className="ad-input"
            placeholder={`Monto ${methodCfg?.currency ?? ""}`}
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
          {payMethod === "pago_movil" ? (
            <input
              className="ad-input"
              placeholder="Teléfono origen"
              value={payOrigin}
              onChange={(e) => setPayOrigin(e.target.value)}
            />
          ) : null}
          <button type="button" className="ad-btn" onClick={addPayment}>
            Añadir pago
          </button>
        </div>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {payments.map((p, i) => (
            <li key={`${p.method}-${i}`} className="flex justify-between gap-2">
              <span>
                {p.method} · {p.currency} {p.amount}
                {p.reference ? ` · ref ${p.reference}` : ""}
              </span>
              <button
                type="button"
                className="ad-btn"
                onClick={() =>
                  setPayments((list) => list.filter((_, idx) => idx !== i))
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2">
          <button type="button" className="ad-btn ad-btn--gold" onClick={checkout}>
            Cobrar y cerrar (recibo)
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--primary"
            onClick={leaveOpen}
          >
            Abrir cuenta (servir después)
          </button>
          <button type="button" className="ad-btn" onClick={toPrepaid}>
            Prepago + QR
          </button>
        </div>
        {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      </section>
    </div>
  );
}
