import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import DsModal from "@/components/donaive-software/DsModal";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import {
  findProductByCode,
  formatDsNumber,
  searchProducts,
} from "@/lib/donaive-software/purchase-draft";
import { completeDsPrice, formatDsMoney } from "@/lib/donaive-software/rates";
import {
  cartItemToLine,
  cartTotals,
  DS_PAYMENT_METHODS,
  paymentBalance,
  productUnitSaleUsd,
  type CartItem,
} from "@/lib/donaive-software/sales";
import { splitStockUnits } from "@/lib/donaive-software/stock";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type {
  DsChangeLine,
  DsClient,
  DsPayment,
  DsPaymentMethod,
  DsProduct,
} from "@/types/donaive-software";

function uidKey(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

type Step = "none" | "client" | "product" | "kind" | "pay" | "change" | "done";

function DsPosVenderInner() {
  const {
    products,
    rates,
    clients,
    sales,
    cashSessions,
    completeSale,
    upsertClient,
    openCashSession,
    can,
  } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [params] = useSearchParams();
  const creditFrom = params.get("credito") ?? "";

  const openSession = cashSessions.find((s) => s.status === "open");
  const origin = sales.find((s) => s.id === creditFrom);
  const creditUsd = Math.max(0, origin?.creditUsdRemaining ?? 0);

  const [step, setStep] = useState<Step>("none");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DsProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [client, setClient] = useState<DsClient | null>(null);
  const [clientQ, setClientQ] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientDoc, setNewClientDoc] = useState("");
  const [saleKind, setSaleKind] = useState<"NORMAL" | "FISCAL">("NORMAL");
  const [fiscalPrinter, setFiscalPrinter] = useState<"printer_1" | "printer_2">(
    "printer_1",
  );
  const [fiscalPin, setFiscalPin] = useState("");
  const [payments, setPayments] = useState<DsPayment[]>([]);
  const [payMethod, setPayMethod] = useState<DsPaymentMethod>("efectivo_usd");
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [changeUsd, setChangeUsd] = useState("");
  const [changeBs, setChangeBs] = useState("");
  const [msg, setMsg] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [openUsd, setOpenUsd] = useState("0");
  const [openBs, setOpenBs] = useState("0");

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
  const ivaUsd = useMemo(() => {
    let taxable = 0;
    for (const l of lines) {
      const p = products.find((x) => x.id === l.productId);
      if (p?.taxable) taxable += l.lineTotalUsd;
    }
    return (taxable * 16) / 116;
  }, [lines, products]);
  const balance = useMemo(
    () => paymentBalance(totals.totalUsd, payments, rates.bcv, creditUsd),
    [totals.totalUsd, payments, rates.bcv, creditUsd],
  );
  const methodMeta = DS_PAYMENT_METHODS.find((m) => m.code === payMethod);
  const clientHits = useMemo(() => {
    const q = clientQ.trim().toLowerCase();
    if (!q) return clients.filter((c) => c.active).slice(0, 8);
    return clients
      .filter(
        (c) =>
          c.active &&
          (c.name.toLowerCase().includes(q) ||
            (c.documentId ?? "").toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [clients, clientQ]);

  useEffect(() => {
    if (origin && !client) {
      const found = clients.find((c) => c.id === origin.clientId);
      if (found) setClient(found);
    }
  }, [origin, client, clients]);

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
      return [...prev, { key: uidKey(), productId: p.id, sellMode, qty: 1 }];
    });
    setHits([]);
    setQuery("");
    setMsg("");
    setStep("none");
  }

  function scanOrSearch() {
    const exact = findProductByCode(products, query);
    if (exact) {
      addToCart(exact, "UNIT");
      return;
    }
    const found = searchProducts(products, query);
    setHits(found.slice(0, 12));
    setMsg(found.length ? "" : "Sin resultados");
    setStep("product");
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
      setMsg("Indique un monto válido");
      return;
    }
    setPayments((prev) => [
      ...prev,
      {
        method: payMethod,
        currency: methodMeta?.currency ?? "USD",
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
    setPayAmount(
      methodMeta.currency === "USD"
        ? balance.remainUsd.toFixed(2)
        : balance.remainBs.toFixed(2),
    );
  }

  function goTotalize() {
    if (!openSession) {
      setMsg("Abra el turno de caja para vender");
      return;
    }
    if (!cart.length) {
      setMsg("Agregue productos");
      return;
    }
    setStep("kind");
    setMsg("");
  }

  function goPayments() {
    if (saleKind === "FISCAL" && !fiscalPin.trim()) {
      setMsg("Indique el PIN fiscal");
      return;
    }
    setStep("pay");
    setMsg("");
  }

  function goAfterPayments() {
    if (!balance.covered) {
      setMsg(
        `Falta $${formatDsNumber(balance.remainUsd, 2)} · Bs ${formatDsNumber(balance.remainBs, 2)}`,
      );
      return;
    }
    if (balance.hasChange) {
      setChangeUsd(balance.overUsd.toFixed(2));
      setChangeBs("0");
      setStep("change");
      setMsg("");
      return;
    }
    facturar();
  }

  function facturar(change?: DsChangeLine[]) {
    const r = completeSale({
      cart,
      payments,
      saleKind,
      fiscalPrinter: saleKind === "FISCAL" ? fiscalPrinter : undefined,
      fiscalPin: saleKind === "FISCAL" ? fiscalPin : undefined,
      clientId: client?.id,
      change,
      creditAppliedUsd: creditUsd || undefined,
      originSaleId: origin?.id,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setTicket(r.sale.receiptNumber);
    setCart([]);
    setPayments([]);
    setFiscalPin("");
    setChangeUsd("");
    setChangeBs("");
    setMsg("");
    setStep("done");
    setTimeout(() => window.print(), 250);
  }

  function confirmChange() {
    const usd = Math.max(0, Number(changeUsd) || 0);
    const bs = Math.max(0, Number(changeBs) || 0);
    const linesCh: DsChangeLine[] = [];
    if (usd > 0) linesCh.push({ currency: "USD", amount: usd });
    if (bs > 0) linesCh.push({ currency: "BS", amount: bs });
    facturar(linesCh);
  }

  function createClientQuick() {
    const r = upsertClient({
      name: newClientName,
      documentId: newClientDoc,
      creditLimitUsd: 0,
      creditDays: 0,
      active: true,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setClient(r.client);
    setNewClientName("");
    setNewClientDoc("");
    setStep("none");
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

      {!openSession ? (
        <section className="ds-panel" style={{ marginBottom: "1rem" }}>
          <h1 className="ds-title">Abrir turno</h1>
          <p className="ds-lead">
            Cada caja abre y cierra para cerrar el ciclo del turno.
          </p>
          <div
            style={{
              display: "grid",
              gap: "0.65rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              marginTop: "0.85rem",
            }}
          >
            <label className="ds-label">
              Efectivo inicial USD
              <input
                className="ds-input"
                type="number"
                value={openUsd}
                onChange={(e) => setOpenUsd(e.target.value)}
              />
            </label>
            <label className="ds-label">
              Efectivo inicial Bs
              <input
                className="ds-input"
                type="number"
                value={openBs}
                onChange={(e) => setOpenBs(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn--primary"
            style={{ marginTop: "0.85rem" }}
            onClick={() => {
              const r = openCashSession({
                openingCashUsd: Number(openUsd) || 0,
                openingCashBs: Number(openBs) || 0,
              });
              setMsg(r.ok ? "" : r.error);
            }}
          >
            Abrir caja
          </button>
        </section>
      ) : null}

      <div className="ds-pos">
        <section className="ds-panel">
          <h1 className="ds-title">Punto de venta</h1>
          <p className="ds-lead">
            BCV {formatDsNumber(rates.bcv, 2)} Bs/USD
            {openSession
              ? ` · Turno ${openSession.shiftNumber} · ${openSession.registerName}`
              : ""}
            {creditUsd > 0
              ? ` · Crédito por devolución $${formatDsNumber(creditUsd, 2)}`
              : ""}
          </p>

          <div
            style={{
              marginTop: "0.85rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="ds-btn"
              onClick={() => setStep("client")}
            >
              {client ? client.name : "Cliente"}
            </button>
            <input
              className="ds-input"
              style={{ flex: "1 1 220px", marginTop: 0 }}
              placeholder="Código de barras, SKU o nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scanOrSearch()}
              autoFocus
            />
            <button type="button" className="ds-btn" onClick={scanOrSearch}>
              Buscar
            </button>
          </div>

          <div className="ds-pos__actions">
            <button type="button" className="ds-btn" onClick={() => setStep("client")}>
              Cliente
            </button>
            <button type="button" className="ds-btn" onClick={() => setStep("product")}>
              Producto
            </button>
            <button
              type="button"
              className="ds-btn"
              onClick={() => setCart((c) => c.slice(0, -1))}
            >
              Quitar
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={goTotalize}
            >
              Totalizar
            </button>
            <Link className="ds-btn" to={routes.posFacturas}>
              Facturas
            </Link>
          </div>

          {lines.length === 0 ? (
            <p className="ds-muted" style={{ marginTop: "1rem" }}>
              Escanee o busque productos. Luego pulse Totalizar.
            </p>
          ) : (
            <div style={{ marginTop: "0.75rem" }}>
              {lines.map((l) => {
                const item = cart.find((c) => c.key === l.key);
                return (
                  <div key={l.key} className="ds-line-row">
                    <div>
                      <strong>{l.productLabel}</strong>
                      <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                        {l.sellMode === "BOX" ? "Caja" : "Unidad"} · {l.qtyBase} u.
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>
                        {formatDsMoney({
                          usd: l.lineTotalUsd,
                          bs: l.lineTotalBs,
                        })}
                      </div>
                      <input
                        className="ds-input"
                        style={{ width: 72, marginTop: "0.35rem", padding: "0.35rem" }}
                        type="number"
                        min={1}
                        value={item?.qty ?? l.qty}
                        onChange={(e) => setQty(l.key, Number(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="ds-panel ds-pos__totals">
          <div className="ds-muted">Total USD</div>
          <div className="ds-pos__total-usd">
            ${formatDsNumber(totals.totalUsd, 2)}
          </div>
          <div className="ds-muted">
            IVA est. ${formatDsNumber(ivaUsd, 2)} · Bs{" "}
            {formatDsNumber(totals.totalBs, 2)}
          </div>
          {creditUsd > 0 ? (
            <div>
              Crédito aplicado ${formatDsNumber(Math.min(creditUsd, totals.totalUsd), 2)}
              <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                A pagar ${formatDsNumber(balance.dueUsd, 2)}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="ds-btn ds-btn--primary"
            onClick={goTotalize}
          >
            Totalizar
          </button>
          {msg ? (
            <p style={{ color: "var(--ds-danger)", margin: 0 }}>{msg}</p>
          ) : null}
        </aside>
      </div>

      <DsModal
        open={step === "client"}
        title="Cliente"
        onClose={() => setStep("none")}
      >
        <input
          className="ds-input"
          placeholder="Buscar nombre o cédula/RIF"
          value={clientQ}
          onChange={(e) => setClientQ(e.target.value)}
        />
        <div style={{ marginTop: "0.65rem", display: "grid", gap: "0.35rem" }}>
          <button
            type="button"
            className="ds-btn"
            onClick={() => {
              setClient(null);
              setStep("none");
            }}
          >
            Consumidor ocasional
          </button>
          {clientHits.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ds-btn"
              onClick={() => {
                setClient(c);
                setStep("none");
              }}
            >
              {c.name} {c.documentId ? `· ${c.documentId}` : ""}
            </button>
          ))}
        </div>
        <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.95rem" }}>
          Crear cliente
        </h3>
        <label className="ds-label">
          Nombre
          <input
            className="ds-input"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
        </label>
        <label className="ds-label">
          Cédula / RIF
          <input
            className="ds-input"
            value={newClientDoc}
            onChange={(e) => setNewClientDoc(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="ds-btn ds-btn--primary"
          style={{ marginTop: "0.75rem" }}
          onClick={createClientQuick}
        >
          Guardar y usar
        </button>
      </DsModal>

      <DsModal
        open={step === "product"}
        title="Buscar producto"
        onClose={() => setStep("none")}
        wide
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            className="ds-input"
            style={{ marginTop: 0 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && scanOrSearch()}
            placeholder="Código, SKU o nombre"
          />
          <button type="button" className="ds-btn" onClick={scanOrSearch}>
            Buscar
          </button>
        </div>
        <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.4rem" }}>
          {(hits.length ? hits : searchProducts(products, query || "a").slice(0, 8)).map(
            (p) => {
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
                      Stock {stock.totalUnits} u. · {formatDsMoney(unitPx)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    {p.unitsPerBox > 1 ? (
                      <button
                        type="button"
                        className="ds-btn ds-btn--primary"
                        onClick={() => addToCart(p, "BOX")}
                      >
                        Caja
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
            },
          )}
        </div>
      </DsModal>

      <DsModal
        open={step === "kind"}
        title="Tipo de factura"
        onClose={() => setStep("none")}
        footer={
          <>
            <button type="button" className="ds-btn" onClick={() => setStep("none")}>
              Atrás
            </button>
            <button type="button" className="ds-btn ds-btn--primary" onClick={goPayments}>
              Siguiente
            </button>
          </>
        }
      >
        <label className="ds-label">
          Documento
          <select
            className="ds-input"
            value={saleKind}
            onChange={(e) => setSaleKind(e.target.value as "NORMAL" | "FISCAL")}
          >
            <option value="NORMAL">Natural / ticket</option>
            {can("pos.fiscal") ? (
              <option value="FISCAL">Factura fiscal</option>
            ) : null}
          </select>
        </label>
        {saleKind === "FISCAL" ? (
          <>
            <label className="ds-label">
              Impresora
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
        {msg ? <p style={{ color: "var(--ds-danger)" }}>{msg}</p> : null}
      </DsModal>

      <DsModal
        open={step === "pay"}
        title="Pagos"
        onClose={() => setStep("kind")}
        footer={
          <>
            <button type="button" className="ds-btn" onClick={() => setStep("kind")}>
              Atrás
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={goAfterPayments}
            >
              {balance.hasChange ? "Siguiente · vuelto" : "Facturar"}
            </button>
          </>
        }
      >
        <p className="ds-muted" style={{ marginTop: 0 }}>
          A pagar ${formatDsNumber(balance.dueUsd, 2)} · Bs{" "}
          {formatDsNumber(balance.dueUsd * rates.bcv, 2)}. Resta $
          {formatDsNumber(balance.remainUsd, 2)} / Bs{" "}
          {formatDsNumber(balance.remainBs, 2)}.
        </p>
        <div
          style={{
            display: "grid",
            gap: "0.55rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          <label className="ds-label">
            Método
            <select
              className="ds-input"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as DsPaymentMethod)}
            >
              {DS_PAYMENT_METHODS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ds-label">
            Monto ({methodMeta?.currency})
            <input
              className="ds-input"
              type="number"
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
        <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.65rem" }}>
          <button type="button" className="ds-btn" onClick={fillRemaining}>
            Completar resto
          </button>
          <button type="button" className="ds-btn ds-btn--primary" onClick={addPayment}>
            Agregar pago
          </button>
        </div>
        {payments.map((p, i) => (
          <div key={`${p.method}-${i}`} className="ds-line-row">
            <span>
              {DS_PAYMENT_METHODS.find((m) => m.code === p.method)?.label} ·{" "}
              {p.currency}
            </span>
            <span>
              {formatDsNumber(p.amount, 2)}{" "}
              <button
                type="button"
                className="ds-btn"
                onClick={() => setPayments((prev) => prev.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            </span>
          </div>
        ))}
        {msg ? <p style={{ color: "var(--ds-danger)" }}>{msg}</p> : null}
      </DsModal>

      <DsModal
        open={step === "change"}
        title="Vuelto / multivueltos"
        onClose={() => setStep("pay")}
        footer={
          <>
            <button type="button" className="ds-btn" onClick={() => setStep("pay")}>
              Atrás
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={confirmChange}
            >
              Facturar
            </button>
          </>
        }
      >
        <p className="ds-muted" style={{ marginTop: 0 }}>
          Excedente ${formatDsNumber(balance.overUsd, 2)} · Bs{" "}
          {formatDsNumber(balance.overBs, 2)}. Reparta el vuelto en USD y/o Bs.
        </p>
        <label className="ds-label">
          Vuelto USD
          <input
            className="ds-input"
            type="number"
            value={changeUsd}
            onChange={(e) => setChangeUsd(e.target.value)}
          />
        </label>
        <label className="ds-label">
          Vuelto Bs
          <input
            className="ds-input"
            type="number"
            value={changeBs}
            onChange={(e) => setChangeBs(e.target.value)}
          />
        </label>
        {msg ? <p style={{ color: "var(--ds-danger)" }}>{msg}</p> : null}
      </DsModal>

      <DsModal
        open={step === "done"}
        title="Factura lista"
        onClose={() => setStep("none")}
      >
        <p>
          Ticket <strong>{ticket}</strong> enviado a impresión.
        </p>
        <button
          type="button"
          className="ds-btn ds-btn--primary"
          onClick={() => window.print()}
        >
          Reimprimir
        </button>
      </DsModal>

      {ticket ? (
        <div className="ds-receipt">
          <h2>Donaive Software</h2>
          <p>Ticket {ticket}</p>
        </div>
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
