import { useMemo, useState } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber, searchProducts } from "@/lib/donaive-software/purchase-draft";
import {
  cartItemToLine,
  cartTotals,
  DS_PAYMENT_METHODS,
  productBoxSaleUsd,
  productUnitSaleUsd,
  remainingToPay,
  type CartItem,
} from "@/lib/donaive-software/sales";
import { formatDsMoney, completeDsPrice } from "@/lib/donaive-software/rates";
import { splitStockUnits } from "@/lib/donaive-software/stock";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPayment, DsPaymentMethod, DsProduct } from "@/types/donaive-software";

function uidKey(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function DsPosVenderInner() {
  const { products, rates, completeSale, can } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DsProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<DsPayment[]>([]);
  const [payMethod, setPayMethod] = useState<DsPaymentMethod>("efectivo_usd");
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [msg, setMsg] = useState("");
  const [lastTicket, setLastTicket] = useState<string | null>(null);
  const [saleKind, setSaleKind] = useState<"NORMAL" | "FISCAL">("NORMAL");
  const [fiscalPrinter, setFiscalPrinter] = useState<"printer_1" | "printer_2">("printer_1");
  const [fiscalPin, setFiscalPin] = useState("");

  const lines = useMemo(() => {
    const out = [];
    for (const item of cart) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) continue;
      const line = cartItemToLine(item, p, rates.bcv);
      if (line) out.push(line);
    }
    return out;
  }, [cart, products, rates.bcv]);

  const totals = useMemo(() => cartTotals(lines), [lines]);
  const remain = useMemo(
    () => remainingToPay(totals.totalUsd, payments, rates.bcv),
    [totals.totalUsd, payments, rates.bcv],
  );

  const methodMeta = DS_PAYMENT_METHODS.find((m) => m.code === payMethod);

  function doSearch() {
    const found = searchProducts(products, query);
    setHits(found.slice(0, 10));
    setMsg(found.length ? "" : "Sin resultados");
  }

  function addToCart(p: DsProduct, sellMode: "UNIT" | "BOX") {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.productId === p.id && c.sellMode === sellMode,
      );
      if (existing) {
        return prev.map((c) =>
          c.key === existing.key ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [
        ...prev,
        { key: uidKey(), productId: p.id, sellMode, qty: 1 },
      ];
    });
    setHits([]);
    setQuery("");
    setMsg("");
  }

  function setQty(key: string, qty: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.key === key ? { ...c, qty: Math.max(0, qty) } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function addPayment() {
    const amount = Number(payAmount);
    if (!(amount > 0)) {
      setMsg("Indique un monto de pago válido");
      return;
    }
    const currency = methodMeta?.currency ?? "USD";
    setPayments((prev) => [
      ...prev,
      {
        method: payMethod,
        currency,
        amount,
        reference: payRef.trim() || undefined,
      },
    ]);
    setPayAmount("");
    setPayRef("");
    setMsg("");
  }

  function fillRemaining() {
    if (!methodMeta) return;
    if (methodMeta.currency === "USD") {
      setPayAmount(remain.remainUsd.toFixed(2));
    } else {
      setPayAmount(remain.remainBs.toFixed(2));
    }
  }

  function checkout() {
    const r = completeSale({
      cart,
      payments,
      saleKind,
      fiscalPrinter: saleKind === "FISCAL" ? fiscalPrinter : undefined,
      fiscalPin: saleKind === "FISCAL" ? fiscalPin : undefined,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setLastTicket(r.sale.receiptNumber);
    setCart([]);
    setPayments([]);
    setFiscalPin("");
    setMsg(`Venta ${r.sale.receiptNumber} registrada`);
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.pos}>Punto de venta</Link>
        <span>/</span>
        <span>Vender</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Vender</h1>
        <p className="ds-lead">
          Cobro con tasa BCV {formatDsNumber(rates.bcv, 2)} Bs/USD. Pagos mixtos
          USD/Bs. El stock se descuenta al confirmar.
        </p>

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <input
            className="ds-input"
            style={{ flex: "1 1 220px", marginTop: 0 }}
            placeholder="Buscar SKU, nombre o código"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            autoFocus
          />
          <button type="button" className="ds-btn" onClick={doSearch}>
            Buscar
          </button>
        </div>

        {hits.length > 0 ? (
          <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.35rem" }}>
            {hits.map((p) => {
              const stock = splitStockUnits(p.stock.qtyBase, p.unitsPerBox);
              const unitPx = completeDsPrice(
                { usd: productUnitSaleUsd(p), bs: 0 },
                rates.bcv,
              );
              return (
                <div key={p.id} className="ds-line-row" style={{ alignItems: "center" }}>
                  <div>
                    <strong>{p.sku}</strong> · {p.name}
                    <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                      Stock {stock.totalUnits} u. · PVP {formatDsMoney(unitPx)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    {p.unitsPerBox > 1 ? (
                      <button
                        type="button"
                        className="ds-btn ds-btn--primary"
                        onClick={() => addToCart(p, "BOX")}
                      >
                        Caja ({formatDsNumber(productBoxSaleUsd(p), 2)})
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="ds-btn"
                      onClick={() => addToCart(p, "UNIT")}
                    >
                      Unidad
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {lines.length > 0 ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            Carrito ({lines.length})
          </h2>
          {lines.map((l) => {
            const item = cart.find((c) => c.key === l.key);
            return (
              <div key={l.key} className="ds-line-row">
                <div>
                  <strong>{l.productLabel}</strong>
                  <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                    {l.sellMode === "BOX" ? "Por caja" : "Por unidad"} ·{" "}
                    {l.qtyBase} u.
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>{formatDsMoney({ usd: l.lineTotalUsd, bs: l.lineTotalBs })}</div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.35rem",
                      justifyContent: "flex-end",
                      marginTop: "0.35rem",
                    }}
                  >
                    <input
                      className="ds-input"
                      style={{ width: 72, marginTop: 0, padding: "0.4rem" }}
                      type="number"
                      min={1}
                      value={item?.qty ?? l.qty}
                      onChange={(e) => setQty(l.key, Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="ds-btn"
                      onClick={() => setQty(l.key, 0)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <span className="ds-muted">Total</span>
            <strong className="ds-stat" style={{ fontSize: "1.25rem" }}>
              {formatDsMoney({ usd: totals.totalUsd, bs: totals.totalBs })}
            </strong>
          </div>
        </section>
      ) : null}

      {lines.length > 0 ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Pagos</h2>
          <div
            style={{
              marginTop: "0.85rem",
              display: "grid",
              gap: "0.65rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            }}
          >
            <label className="ds-label">
              Tipo de venta
              <select
                className="ds-input"
                value={saleKind}
                onChange={(e) => setSaleKind(e.target.value as "NORMAL" | "FISCAL")}
              >
                <option value="NORMAL">Venta normal</option>
                {can("pos.fiscal") ? (
                  <option value="FISCAL">Factura fiscal</option>
                ) : null}
              </select>
            </label>
            {saleKind === "FISCAL" ? (
              <>
                <label className="ds-label">
                  Impresora fiscal
                  <select
                    className="ds-input"
                    value={fiscalPrinter}
                    onChange={(e) =>
                      setFiscalPrinter(e.target.value as "printer_1" | "printer_2")
                    }
                  >
                    <option value="printer_1">Impresora 1</option>
                    <option value="printer_2">Impresora 2</option>
                  </select>
                </label>
                <label className="ds-label">
                  PIN fiscal
                  <input
                    className="ds-input"
                    type="password"
                    value={fiscalPin}
                    onChange={(e) => setFiscalPin(e.target.value)}
                  />
                </label>
              </>
            ) : null}
          </div>
          <div
            style={{
              marginTop: "0.85rem",
              display: "grid",
              gap: "0.65rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            }}
          >
            <label className="ds-label">
              Método
              <select
                className="ds-input"
                value={payMethod}
                onChange={(e) =>
                  setPayMethod(e.target.value as DsPaymentMethod)
                }
              >
                {DS_PAYMENT_METHODS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="ds-label">
              Monto ({methodMeta?.currency ?? "USD"})
              <input
                className="ds-input"
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </label>
            <label className="ds-label">
              Referencia
              <input
                className="ds-input"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
            </label>
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <button type="button" className="ds-btn" onClick={fillRemaining}>
              Completar restante
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={addPayment}
            >
              Agregar pago
            </button>
          </div>

          {payments.length > 0 ? (
            <div style={{ marginTop: "0.75rem" }}>
              {payments.map((p, i) => (
                <div key={`${p.method}-${i}`} className="ds-line-row">
                  <span>
                    {DS_PAYMENT_METHODS.find((m) => m.code === p.method)?.label}{" "}
                    · {p.currency}{" "}
                    {p.reference ? `· ${p.reference}` : ""}
                  </span>
                  <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {formatDsNumber(p.amount, 2)}
                    <button
                      type="button"
                      className="ds-btn"
                      onClick={() =>
                        setPayments((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      Quitar
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="ds-line-row" style={{ marginTop: "0.5rem" }}>
            <span className="ds-muted">Resta</span>
            <strong>
              ${formatDsNumber(remain.remainUsd, 2)} · Bs{" "}
              {formatDsNumber(remain.remainBs, 2)}
            </strong>
          </div>

          <button
            type="button"
            className="ds-btn ds-btn--primary"
            style={{ marginTop: "1rem" }}
            disabled={!remain.covered}
            onClick={checkout}
          >
            Confirmar venta
          </button>
        </section>
      ) : null}

      {msg ? (
        <p
          style={{
            marginTop: "1rem",
            color:
              msg.includes("registrada") || msg.includes("Venta")
                ? "var(--ds-ok)"
                : "var(--ds-danger)",
          }}
        >
          {msg}
          {lastTicket && msg.includes(lastTicket) ? (
            <>
              {" "}
              ·{" "}
              <Link to={routes.posCierres} style={{ color: "var(--ds-accent)" }}>
                Ir a cierres
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export default function DsPosVender() {
  return (
    <DsRequirePermission permission="pos.sell">
      <DsPosVenderInner />
    </DsRequirePermission>
  );
}
