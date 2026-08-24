import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { DsPurchaseLineForm } from "@/components/donaive-software/DsPurchaseLineForm";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import {
  computeLineRealCosts,
  newExtraTax,
} from "@/lib/donaive-software/purchase-invoice";
import {
  formatDsNumber,
  formatLineQtySummary,
  lineMoney,
  productToDraftLine,
  searchProducts,
  type DsDraftLine,
} from "@/lib/donaive-software/purchase-draft";
import {
  amountToDisplay,
  formatDsMoney,
  type DsRateContext,
} from "@/lib/donaive-software/rates";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsExtraInvoiceTax, DsProduct } from "@/types/donaive-software";

function DsComprasNuevaInner() {
  const { products, rates, confirmPurchase, upsertProduct, suppliers, upsertSupplier } =
    useDonaiveSoftware();
  const navigate = useNavigate();
  const routes = getDonaiveSoftwareRoutes();

  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [paymentCondition, setPaymentCondition] = useState<"CONTADO" | "CREDITO">(
    "CONTADO",
  );
  const [creditDays, setCreditDays] = useState(15);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [currency, setCurrency] = useState<"USD" | "BS">("BS");
  const [invoiceRate, setInvoiceRate] = useState(rates.bcv);
  const [extraTaxes, setExtraTaxes] = useState<DsExtraInvoiceTax[]>([]);
  const [notes, setNotes] = useState("");

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DsProduct[]>([]);
  const [draftLine, setDraftLine] = useState<DsDraftLine | null>(null);
  const [lines, setLines] = useState<DsDraftLine[]>([]);
  const [msg, setMsg] = useState("");

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newUpp, setNewUpp] = useState(24);
  const [newTaxable, setNewTaxable] = useState(true);
  const [newUtility, setNewUtility] = useState(30);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");

  const showInvoiceRate = currency === "BS";

  const rateCtx: DsRateContext = useMemo(
    () => ({
      currency,
      bcv: rates.bcv,
      protectedRate: rates.protectedRate,
      useProtected: false,
      invoiceRate: showInvoiceRate && invoiceRate > 0 ? invoiceRate : undefined,
    }),
    [currency, rates, showInvoiceRate, invoiceRate],
  );

  const totals = useMemo(
    () =>
      computeLineRealCosts(lines, extraTaxes, {
        currency,
        invoiceRate: showInvoiceRate ? invoiceRate : undefined,
        bcv: rates.bcv,
      }),
    [lines, extraTaxes, currency, showInvoiceRate, invoiceRate, rates.bcv],
  );

  const totalsDisplay = useMemo(() => {
    const sub = amountToDisplay(totals.subtotal, rateCtx);
    const tax = amountToDisplay(totals.tax, rateCtx);
    const extra = amountToDisplay(totals.extraTaxesTotal, rateCtx);
    const grand = amountToDisplay(totals.grandTotal, rateCtx);
    return { sub, tax, extra, grand };
  }, [totals, rateCtx]);

  function doSearch() {
    const found = searchProducts(products, query);
    setHits(found.slice(0, 12));
    setMsg(found.length ? "" : "Sin resultados");
  }

  function selectProduct(p: DsProduct, prefer: "UNIT" | "BOX" = "BOX") {
    setDraftLine(productToDraftLine(p, prefer));
    setHits([]);
    setQuery("");
    setMsg("Complete costo y cantidad, luego agregue a la factura.");
  }

  function commitDraft() {
    if (!draftLine) return;
    if (!draftLine.qty || draftLine.qty <= 0) {
      setMsg("Indique la cantidad comprada");
      return;
    }
    const m = lineMoney(draftLine);
    if (m.subtotal <= 0) {
      setMsg("Indique el costo o total de la línea");
      return;
    }
    setLines((prev) => [
      ...prev,
      { ...draftLine, key: `${draftLine.productId}-${Date.now()}` },
    ]);
    setDraftLine(null);
    setMsg("Producto agregado a la factura");
  }

  function savePurchase() {
    if (showInvoiceRate && !(invoiceRate > 0)) {
      setMsg("Indique la tasa de la factura en Bs");
      return;
    }
    if (!supplierId && !supplierName.trim()) {
      setMsg("Seleccione o cree un proveedor");
      return;
    }
    const r = confirmPurchase({
      supplierId: supplierId || undefined,
      supplierName:
        supplierName ||
        suppliers.find((s) => s.id === supplierId)?.name ||
        "",
      invoiceNumber,
      invoiceDate,
      currency,
      invoiceRate: showInvoiceRate ? invoiceRate : undefined,
      paymentCondition,
      creditDays: paymentCondition === "CREDITO" ? creditDays : undefined,
      extraTaxes,
      lines,
      notes,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    navigate(routes.comprasHistorial, { replace: true });
  }

  function createSupplierQuick() {
    const r = upsertSupplier({
      name: newSupplierName,
      defaultCurrency: currency,
      creditDays: 15,
      creditLimit: 0,
      active: true,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setSupplierId(r.supplier.id);
    setSupplierName(r.supplier.name);
    setCreditDays(r.supplier.creditDays || 15);
    setShowNewSupplier(false);
    setNewSupplierName("");
    setMsg("Proveedor creado");
  }

  function onSelectSupplier(id: string) {
    setSupplierId(id);
    const s = suppliers.find((x) => x.id === id);
    if (s) {
      setSupplierName(s.name);
      setCreditDays(s.creditDays || 15);
      setCurrency(s.defaultCurrency);
    }
  }

  function createProduct() {
    const r = upsertProduct({
      name: newName,
      sku: newSku,
      unitsPerBox: newUpp,
      taxable: newTaxable,
      utilityPercent: newUtility,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setShowNewProduct(false);
    selectProduct(r.product);
    setNewSku("");
    setNewName("");
    setMsg("Producto creado — complete la línea de compra.");
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.compras}>Compras</Link>
        <span>/</span>
        <span>Nueva compra</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Nueva compra</h1>
        <p className="ds-lead">
          Factura en {currency === "BS" ? "bolívares" : "dólares"}. El costo
          real (IVA + impuestos repartibles) alimenta el CPP al confirmar.
        </p>

        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          <label className="ds-label">
            Proveedor *
            <select
              className="ds-input"
              value={supplierId}
              onChange={(e) => onSelectSupplier(e.target.value)}
            >
              <option value="">Seleccione…</option>
              {suppliers
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <div style={{ display: "flex", alignItems: "end" }}>
            <button
              type="button"
              className="ds-btn"
              onClick={() => setShowNewSupplier((v) => !v)}
            >
              {showNewSupplier ? "Cancelar" : "+ Proveedor"}
            </button>
          </div>
          <label className="ds-label">
            Condición
            <select
              className="ds-input"
              value={paymentCondition}
              onChange={(e) =>
                setPaymentCondition(e.target.value as "CONTADO" | "CREDITO")
              }
            >
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </label>
          {paymentCondition === "CREDITO" ? (
            <label className="ds-label">
              Días de crédito
              <input
                className="ds-input"
                type="number"
                min={0}
                value={creditDays}
                onChange={(e) => setCreditDays(Number(e.target.value))}
              />
            </label>
          ) : null}
          <label className="ds-label">
            Nº factura
            <input
              className="ds-input"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </label>
          <label className="ds-label">
            Fecha
            <input
              className="ds-input"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </label>
          <label className="ds-label">
            Moneda factura
            <select
              className="ds-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "USD" | "BS")}
            >
              <option value="BS">Bs (bolívares)</option>
              <option value="USD">USD</option>
            </select>
          </label>
          {showInvoiceRate ? (
            <label className="ds-label">
              Tasa factura (Bs/USD) *
              <input
                className="ds-input"
                type="number"
                step="0.01"
                value={invoiceRate}
                onChange={(e) => setInvoiceRate(Number(e.target.value))}
              />
            </label>
          ) : null}
          <label className="ds-label">
            Notas
            <input
              className="ds-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
        {showNewSupplier ? (
          <div
            style={{
              marginTop: "0.85rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "end",
            }}
          >
            <label className="ds-label" style={{ flex: "1 1 200px" }}>
              Nombre del proveedor
              <input
                className="ds-input"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={createSupplierQuick}
            >
              Crear proveedor
            </button>
          </div>
        ) : null}
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Impuestos extra</h2>
          <button
            type="button"
            className="ds-btn"
            onClick={() => setExtraTaxes((prev) => [...prev, newExtraTax()])}
          >
            + Impuesto
          </button>
        </div>
        <p className="ds-muted" style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
          Montos en Bs. Marque «repartir al costo» para prorratear entre líneas
          y sumar al CPP.
        </p>
        {extraTaxes.length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
            Sin impuestos extra (ej. municipal, retención).
          </p>
        ) : (
          <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.65rem" }}>
            {extraTaxes.map((tax) => (
              <div
                key={tax.id}
                style={{
                  display: "grid",
                  gap: "0.5rem",
                  gridTemplateColumns: "1fr 120px auto auto",
                  alignItems: "end",
                }}
              >
                <label className="ds-label">
                  Nombre
                  <input
                    className="ds-input"
                    value={tax.name}
                    onChange={(e) =>
                      setExtraTaxes((prev) =>
                        prev.map((t) =>
                          t.id === tax.id ? { ...t, name: e.target.value } : t,
                        ),
                      )
                    }
                  />
                </label>
                <label className="ds-label">
                  Monto Bs
                  <input
                    className="ds-input"
                    type="number"
                    step="0.01"
                    value={tax.amountBs}
                    onChange={(e) =>
                      setExtraTaxes((prev) =>
                        prev.map((t) =>
                          t.id === tax.id
                            ? { ...t, amountBs: Number(e.target.value) }
                            : t,
                        ),
                      )
                    }
                  />
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.8rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tax.allocateToCost}
                    onChange={(e) =>
                      setExtraTaxes((prev) =>
                        prev.map((t) =>
                          t.id === tax.id
                            ? { ...t, allocateToCost: e.target.checked }
                            : t,
                        ),
                      )
                    }
                  />
                  Repartir al CPP
                </label>
                <button
                  type="button"
                  className="ds-btn"
                  onClick={() =>
                    setExtraTaxes((prev) => prev.filter((t) => t.id !== tax.id))
                  }
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Productos</h2>
        <div
          style={{
            marginTop: "0.75rem",
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
          />
          <button type="button" className="ds-btn" onClick={doSearch}>
            Buscar
          </button>
          <button
            type="button"
            className="ds-btn"
            onClick={() => setShowNewProduct((v) => !v)}
          >
            {showNewProduct ? "Cancelar producto" : "+ Producto nuevo"}
          </button>
        </div>

        {showNewProduct ? (
          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gap: "0.65rem",
              maxWidth: 480,
            }}
          >
            <label className="ds-label">
              SKU
              <input className="ds-input" value={newSku} onChange={(e) => setNewSku(e.target.value)} />
            </label>
            <label className="ds-label">
              Nombre
              <input className="ds-input" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </label>
            <label className="ds-label">
              Unidades por caja
              <input
                className="ds-input"
                type="number"
                min={1}
                value={newUpp}
                onChange={(e) => setNewUpp(Number(e.target.value))}
              />
            </label>
            <label className="ds-label">
              Utilidad %
              <input
                className="ds-input"
                type="number"
                value={newUtility}
                onChange={(e) => setNewUtility(Number(e.target.value))}
              />
            </label>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={newTaxable}
                onChange={(e) => setNewTaxable(e.target.checked)}
              />
              Gravado con IVA
            </label>
            <button type="button" className="ds-btn ds-btn--primary" onClick={createProduct}>
              Crear y agregar a compra
            </button>
          </div>
        ) : null}

        {hits.length > 0 ? (
          <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.35rem" }}>
            {hits.map((p) => (
              <div
                key={p.id}
                className="ds-line-row"
                style={{ alignItems: "center" }}
              >
                <div>
                  <strong>{p.sku}</strong> · {p.name}
                  <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                    caja x{p.unitsPerBox} · stock {p.stock.qtyBase} u.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {p.unitsPerBox > 1 ? (
                    <button
                      type="button"
                      className="ds-btn ds-btn--primary"
                      onClick={() => selectProduct(p, "BOX")}
                    >
                      Por caja
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ds-btn"
                    onClick={() => selectProduct(p, "UNIT")}
                  >
                    Por unidad
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {draftLine ? (
          <DsPurchaseLineForm
            line={draftLine}
            currency={currency}
            rateCtx={rateCtx}
            onChange={(patch) =>
              setDraftLine((prev) => (prev ? { ...prev, ...patch } : prev))
            }
            onAdd={commitDraft}
            onCancel={() => setDraftLine(null)}
          />
        ) : null}
      </section>

      {lines.length > 0 ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            Líneas ({lines.length})
          </h2>
          {lines.map((l) => {
            const m = lineMoney(l);
            const real = totals.lineRealCosts.get(l.key);
            const subDisp = amountToDisplay(m.subtotal, rateCtx);
            return (
              <div key={l.key} className="ds-line-row">
                <div>
                  <strong>{l.productLabel}</strong>
                  <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                    {formatLineQtySummary(l)}
                    {l.qtyBonus > 0 ? ` + ${l.qtyBonus} regalo` : ""}
                  </div>
                  {real && real.allocatedExtraTax > 0 ? (
                    <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                      + imp. repartidos{" "}
                      {formatDsNumber(real.allocatedExtraTax, 2)} {currency}
                    </div>
                  ) : null}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>{formatDsMoney(subDisp)}</div>
                  <button
                    type="button"
                    className="ds-btn"
                    style={{ marginTop: "0.35rem" }}
                    onClick={() =>
                      setLines((prev) => prev.filter((x) => x.key !== l.key))
                    }
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: "1rem", maxWidth: 360, marginLeft: "auto" }}>
            <div className="ds-line-row">
              <span className="ds-muted">Subtotal</span>
              <span>{formatDsMoney(totalsDisplay.sub)}</span>
            </div>
            <div className="ds-line-row">
              <span className="ds-muted">IVA</span>
              <span>{formatDsMoney(totalsDisplay.tax)}</span>
            </div>
            {totals.extraTaxesTotalBs > 0 ? (
              <div className="ds-line-row">
                <span className="ds-muted">Impuestos extra</span>
                <span>
                  {formatDsNumber(totals.extraTaxesTotalBs, 2)} Bs
                </span>
              </div>
            ) : null}
            <div className="ds-line-row">
              <strong>Total</strong>
              <strong>{formatDsMoney(totalsDisplay.grand)}</strong>
            </div>
          </div>
        </section>
      ) : null}

      {msg ? (
        <p
          style={{
            marginTop: "1rem",
            color: msg.includes("agregad") || msg.includes("creado")
              ? "var(--ds-ok)"
              : "var(--ds-danger)",
          }}
        >
          {msg}
        </p>
      ) : null}

      <div
        style={{
          marginTop: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.65rem",
        }}
      >
        <button
          type="button"
          className="ds-btn ds-btn--primary"
          disabled={lines.length === 0}
          onClick={savePurchase}
        >
          Confirmar compra
        </button>
        <Link className="ds-btn" to={routes.comprasHistorial}>
          Ver historial
        </Link>
      </div>
    </div>
  );
}

export default function DsComprasNueva() {
  return (
    <DsRequirePermission permission="purchases.create">
      <DsComprasNuevaInner />
    </DsRequirePermission>
  );
}
