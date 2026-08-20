import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AdPurchaseDocument,
  type AdPurchasePrintDoc,
} from "@/components/ad-licoreria/AdDocumentViews";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";
import { findUnitAndBox, pricesFromCost } from "@/lib/ad-licoreria/pack";
import { searchAdProducts, type AdProductSearchHit } from "@/lib/ad-licoreria/product-lookup";

type DraftLine = {
  key: string;
  presentationId: string;
  unitPresentationId?: string;
  boxPresentationId?: string;
  productLabel: string;
  presentationLabel: string;
  unitsPerPresentation: number;
  boxUnits: number;
  buyMode: "UNIT" | "BOX";
  qty: number;
  qtyBonus: number;
  costMode: "UNIT" | "PRESENTATION" | "TOTAL";
  unitCost: number;
  presentationCost: number;
  lineTotal: number;
  taxable: boolean;
  utilityPercent: number;
};

function lineMoney(l: DraftLine) {
  const upp = l.unitsPerPresentation || 1;
  let unit = l.unitCost;
  let box = l.presentationCost;
  let subtotal = 0;
  if (l.costMode === "UNIT") {
    box = unit * upp;
    subtotal = unit * upp * l.qty;
  } else if (l.costMode === "PRESENTATION") {
    unit = box / upp;
    subtotal = box * l.qty;
  } else {
    subtotal = l.lineTotal;
    box = l.qty > 0 ? subtotal / l.qty : 0;
    unit = box / upp;
  }
  const tax = l.taxable ? subtotal * 0.16 : 0;
  return { unit, box, subtotal, tax, total: subtotal + tax };
}

/**
 * Compras F6 — encabezado → líneas editables → resumen vivo → totalizar → confirmar.
 */
export default function AdLicoreriaCompras() {
  const { warehouses, hasPermission, categories } = useAdLicoreria();
  const [suppliers, setSuppliers] = useState<
    { id: string; name: string; creditDays: number }[]
  >([]);
  const [methods, setMethods] = useState<
    { id: string; name: string; currency: string; usesSpecialRateRef: boolean }[]
  >([]);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [currency, setCurrency] = useState<"USD" | "BS">("USD");
  const [invoice, setInvoice] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [credit, setCredit] = useState(false);
  const [creditDays, setCreditDays] = useState(15);
  const [notes, setNotes] = useState("");

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdProductSearchHit[]>([]);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [prelim, setPrelim] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newTaxable, setNewTaxable] = useState(false);
  const [newUpp, setNewUpp] = useState(20);
  const [newPackMode, setNewPackMode] = useState<"UNIT" | "BOX">("BOX");
  const [newUtility, setNewUtility] = useState(30);
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id ?? "");

  const dueDate = useMemo(() => {
    if (!credit || !creditDays) return "";
    const d = new Date(invoiceDate || Date.now());
    d.setDate(d.getDate() + creditDays);
    return d.toISOString().slice(0, 10);
  }, [credit, creditDays, invoiceDate]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const l of lines) {
      const m = lineMoney(l);
      subtotal += m.subtotal;
      tax += m.tax;
    }
    return { subtotal, tax, grandTotal: subtotal + tax };
  }, [lines]);

  const printDoc = useMemo((): AdPurchasePrintDoc | null => {
    if (!prelim) return null;
    const d = (prelim as { document?: AdPurchasePrintDoc }).document;
    if (!d) return null;
    return d;
  }, [prelim]);

  useEffect(() => {
    void (async () => {
      const s = await adCommerceClient.listSuppliers();
      if (s.ok) {
        setSuppliers(s.data);
        if (s.data[0]) {
          setSupplierId(s.data[0].id);
          setCreditDays(s.data[0].creditDays || 15);
        }
      }
      const m = await adCommerceClient.listPaymentMethods();
      if (m.ok) {
        const active = m.data.filter((x) => x.active !== false);
        setMethods(active);
        if (active[0]) {
          setPaymentMethodId(active[0].id);
          setCurrency((active[0].currency as "USD" | "BS") || "USD");
        }
      }
    })();
  }, []);

  async function search(source: "manual" | "camera" | "wedge" = "manual") {
    const term = query.trim();
    if (!term) {
      setHits([]);
      return;
    }
    const r = await searchAdProducts(term, source);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setHits(r.products);
    setMsg(r.products.length ? "" : "Sin resultados");
  }

  function addHit(p: (typeof hits)[0], prefer: "UNIT" | "BOX" = "BOX") {
    const pack = findUnitAndBox(p.presentations);
    const hasBox = Boolean(pack.box);
    const buyMode: "UNIT" | "BOX" = hasBox ? prefer : "UNIT";
    const chosen =
      buyMode === "BOX" && pack.box ? pack.box : pack.unit ?? p.presentations[0];
    if (!chosen) return;
    setLines((prev) => [
      ...prev,
      {
        key: `${chosen.id}-${Date.now()}`,
        presentationId: chosen.id,
        unitPresentationId: pack.unit?.id,
        boxPresentationId: pack.box?.id,
        productLabel: `${p.sku ?? ""} ${p.name}`.trim(),
        presentationLabel: chosen.name,
        unitsPerPresentation: chosen.unitsPerPresentation || 1,
        boxUnits: pack.box?.unitsPerPresentation || chosen.unitsPerPresentation || 1,
        buyMode,
        qty: 1,
        qtyBonus: 0,
        costMode: buyMode === "BOX" ? "PRESENTATION" : "UNIT",
        unitCost: 0,
        presentationCost: 0,
        lineTotal: 0,
        taxable: Boolean(p.taxable),
        utilityPercent: Number(p.defaultUtilityPercent) || 0,
      },
    ]);
    setHits([]);
    setQuery("");
  }

  function setBuyMode(line: DraftLine, buyMode: "UNIT" | "BOX") {
    const nextId =
      buyMode === "BOX"
        ? line.boxPresentationId ?? line.presentationId
        : line.unitPresentationId ?? line.presentationId;
    const upp = buyMode === "BOX" ? Math.max(2, line.boxUnits || line.unitsPerPresentation) : 1;
    const label = buyMode === "BOX" ? `Caja x${upp}` : "Unidad";
    updateLine(line.key, {
      buyMode,
      costMode: buyMode === "BOX" ? "PRESENTATION" : "UNIT",
      presentationId: nextId,
      presentationLabel: label,
      unitsPerPresentation: upp,
    });
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  async function createProductInline() {
    if (!hasPermission("products.manage")) {
      setMsg("Sin permiso products.manage");
      return;
    }
    const r = await adCommerceClient.createProduct({
      sku: newSku,
      name: newName,
      brand: newBrand,
      categoryId: newCategoryId || undefined,
      taxable: newTaxable,
      packMode: newPackMode,
      unitsPerBox: newPackMode === "BOX" ? newUpp : 1,
      unitsPerPresentation: newPackMode === "BOX" ? newUpp : 1,
      defaultUtilityPercent: newUtility,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    const data = r.data as {
      name: string;
      sku: string;
      taxable: boolean;
      presentations: { id: string; name: string; unitsPerPresentation: number }[];
      defaultUtilityPercent?: number;
    };
    const pack = findUnitAndBox(data.presentations);
    const hasBox = Boolean(pack.box);
    const buyMode: "UNIT" | "BOX" = hasBox ? "BOX" : "UNIT";
    const pr =
      buyMode === "BOX" && pack.box ? pack.box : pack.unit ?? data.presentations[0];
    setLines((prev) => [
      ...prev,
      {
        key: `${pr.id}-${Date.now()}`,
        presentationId: pr.id,
        unitPresentationId: pack.unit?.id,
        boxPresentationId: pack.box?.id,
        productLabel: `${data.sku} ${data.name}`,
        presentationLabel: pr.name,
        unitsPerPresentation: Number(pr.unitsPerPresentation) || 1,
        boxUnits: pack.box?.unitsPerPresentation || Number(pr.unitsPerPresentation) || 1,
        buyMode,
        qty: 1,
        qtyBonus: 0,
        costMode: buyMode === "BOX" ? "PRESENTATION" : "UNIT",
        unitCost: 0,
        presentationCost: 0,
        lineTotal: 0,
        taxable: data.taxable,
        utilityPercent: Number(data.defaultUtilityPercent) || newUtility,
      },
    ]);
    setShowCreateProduct(false);
    setNewSku("");
    setNewName("");
    setMsg("Producto creado y agregado a la compra");
  }

  async function saveDraftOrTotalize(mode: "draft" | "totalize") {
    if (!hasPermission("purchases.create") && !hasPermission("purchase.create")) {
      setMsg("Sin permiso de compras");
      return;
    }
    if (!supplierId || !warehouseId || !invoice.trim() || !lines.length) {
      setMsg("Proveedor, depósito, factura y líneas son obligatorios");
      return;
    }
    const body = {
      warehouseId,
      supplierId,
      invoiceNumber: invoice.trim(),
      invoiceDate: new Date(invoiceDate).toISOString(),
      currency,
      paymentMethodId: paymentMethodId || undefined,
      paymentCondition: credit ? "CREDITO" : "CONTADO",
      creditDays: credit ? creditDays : 0,
      dueDate: credit && dueDate ? new Date(dueDate).toISOString() : undefined,
      notes,
      preliminary: true,
      lines: lines.map((l) => ({
        presentationId: l.presentationId,
        qty: l.qty,
        qtyBonus: l.qtyBonus,
        costMode: l.costMode,
        unitCostUsd: currency === "USD" ? l.unitCost : 0,
        unitCostBs: currency === "BS" ? l.unitCost : 0,
        presentationCostUsd: currency === "USD" ? l.presentationCost : 0,
        presentationCostBs: currency === "BS" ? l.presentationCost : 0,
        lineTotalUsd: currency === "USD" ? l.lineTotal : 0,
        lineTotalBs: currency === "BS" ? l.lineTotal : 0,
        taxable: l.taxable,
      })),
    };

    let id = purchaseId;
    if (!id) {
      const created = await adCommerceClient.createPurchase(body);
      if (!created.ok) {
        setMsg(created.error);
        return;
      }
      id = String((created.data as { id: string }).id);
      setPurchaseId(id);
    } else {
      const updated = await adCommerceClient.updatePurchase(id, body);
      if (!updated.ok) {
        setMsg(updated.error);
        return;
      }
      id = String((updated.data as { id: string }).id);
      setPurchaseId(id);
    }

    if (mode === "totalize") {
      const t = await adCommerceClient.totalize(id);
      if (!t.ok) {
        setMsg(t.error);
        return;
      }
      setPrelim(t.data as Record<string, unknown>);
      setMsg("Preliminar listo — revise y confirme");
    } else {
      setMsg("Borrador guardado (misma compra)");
    }
  }

  async function confirmPurchase() {
    if (!purchaseId) {
      setMsg("Totalice primero");
      return;
    }
    if (!hasPermission("purchases.approve") && !hasPermission("purchase.approve")) {
      setMsg("Sin permiso para confirmar");
      return;
    }
    const r = await adCommerceClient.confirm(purchaseId);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setMsg("Compra confirmada — inventario y CxP registrados");
    setPrelim(r.data as Record<string, unknown>);
    setLines([]);
    setInvoice("");
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ad-ink)]">Compras</h1>
          <p className="text-sm text-[var(--ad-muted)]">
            Proveedor → líneas → IVA → preliminar → confirmar (inventario + CxP).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ad-btn"
            onClick={() => setShowCreateProduct(true)}
          >
            Crear producto
          </button>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.proveedores}>
            Proveedores
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.comprasAnalisis}>
            Análisis
          </Link>
        </div>
      </div>

      <section className="ad-panel grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <label className="text-xs">
          Proveedor *
          <select
            className="ad-input mt-1"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Depósito *
          <select
            className="ad-input mt-1"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Método de pago
          <select
            className="ad-input mt-1"
            value={paymentMethodId}
            onChange={(e) => {
              setPaymentMethodId(e.target.value);
              const m = methods.find((x) => x.id === e.target.value);
              if (m) setCurrency((m.currency as "USD" | "BS") || "USD");
            }}
          >
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.usesSpecialRateRef ? " *" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Moneda
          <select
            className="ad-input mt-1"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "USD" | "BS")}
          >
            <option value="USD">USD</option>
            <option value="BS">Bs</option>
          </select>
        </label>
        <label className="text-xs">
          Factura *
          <input
            className="ad-input mt-1"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Fecha factura
          <input
            className="ad-input mt-1"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm self-end pb-2">
          <input
            type="checkbox"
            checked={credit}
            onChange={(e) => setCredit(e.target.checked)}
          />
          Crédito
        </label>
        {credit && (
          <>
            <label className="text-xs">
              Días crédito
              <input
                className="ad-input mt-1"
                type="number"
                value={creditDays}
                onChange={(e) => setCreditDays(Number(e.target.value))}
              />
            </label>
            <label className="text-xs">
              Vencimiento
              <input className="ad-input mt-1" value={dueDate} readOnly />
            </label>
          </>
        )}
        <label className="text-xs sm:col-span-2">
          Observaciones
          <input
            className="ad-input mt-1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </section>

      <section className="ad-panel space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            className="ad-input min-w-[16rem] flex-1"
            placeholder="Buscar código, nombre, marca… (escáner USB → Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void search("wedge");
            }}
            autoComplete="off"
          />
          <button type="button" className="ad-btn" onClick={() => void search()}>
            Buscar
          </button>
          {(hasPermission("inventory.read") ||
            hasPermission("pos.sell") ||
            hasPermission("products.manage")) ? (
          <Link className="ad-btn ad-btn--gold" to={AD_LICORERIA_ROUTES.escaner}>
            Visor escáner
          </Link>
          ) : null}
        </div>
        {msg ? <p className="text-sm text-[var(--ad-muted)]">{msg}</p> : null}
        {hits.length > 0 && (
          <ul className="max-h-40 overflow-auto text-sm">
            {hits.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ad-border)] py-1"
              >
                <span>
                  {h.sku} · {h.name} {h.brand ? `· ${h.brand}` : ""}
                  {h.taxable ? " · IVA" : ""}
                  {h.defaultUtilityPercent
                    ? ` · util. ${h.defaultUtilityPercent}%`
                    : ""}
                </span>
                <span className="flex flex-wrap gap-1">
                  {h.presentations.some((x) => x.unitsPerPresentation > 1) ? (
                    <button
                      type="button"
                      className="ad-btn ad-btn--gold"
                      onClick={() => addHit(h, "BOX")}
                    >
                      Caja
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => addHit(h, "UNIT")}
                  >
                    Unidad
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Líneas de la factura</h2>
        {lines.map((l) => {
          const m = lineMoney(l);
          const px = pricesFromCost(
            m.unit,
            Math.max(1, l.boxUnits || l.unitsPerPresentation),
            l.utilityPercent,
          );
          const hasBox = Boolean(l.boxPresentationId) || l.boxUnits > 1;
          return (
            <article
              key={l.key}
              className="space-y-2 rounded border border-[var(--ad-line)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-[var(--ad-gold-soft)]">
                    {l.productLabel}
                    {l.taxable ? (
                      <span className="ml-2 ad-badge ad-badge--ok text-[10px]">
                        IVA
                      </span>
                    ) : (
                      <span className="ml-2 ad-badge text-[10px]">Exento</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--ad-muted)]">
                    {l.presentationLabel} · {l.unitsPerPresentation} u. por caja
                  </div>
                </div>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => removeLine(l.key)}
                >
                  Quitar
                </button>
              </div>
              {hasBox ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`ad-btn ${l.buyMode === "BOX" ? "ad-btn--gold" : ""}`}
                    onClick={() => setBuyMode(l, "BOX")}
                  >
                    Compré por caja
                  </button>
                  <button
                    type="button"
                    className={`ad-btn ${l.buyMode === "UNIT" ? "ad-btn--gold" : ""}`}
                    onClick={() => setBuyMode(l, "UNIT")}
                  >
                    Compré por unidad
                  </button>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-[var(--ad-muted)]">¿Este producto lleva IVA?</p>
                <div className="mt-1 grid max-w-sm grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`ad-btn ${!l.taxable ? "ad-btn--gold" : ""}`}
                    onClick={() => updateLine(l.key, { taxable: false })}
                  >
                    Sin IVA
                  </button>
                  <button
                    type="button"
                    className={`ad-btn ${l.taxable ? "ad-btn--gold" : ""}`}
                    onClick={() => updateLine(l.key, { taxable: true })}
                  >
                    Con IVA 16%
                  </button>
                </div>
              </div>
              <label className="text-xs text-[var(--ad-muted)]">
                {l.buyMode === "BOX" ? "¿Cuántas cajas compré?" : "¿Cuántas unidades?"}
                <input
                  className="ad-input mt-1"
                  type="number"
                  min={0}
                  value={l.qty}
                  onChange={(e) =>
                    updateLine(l.key, { qty: Number(e.target.value) })
                  }
                />
              </label>
              {l.buyMode === "BOX" ? (
                <label className="text-xs text-[var(--ad-muted)]">
                  Costo de cada caja ({currency})
                  <input
                    className="ad-input mt-1"
                    type="number"
                    step="0.01"
                    value={l.presentationCost}
                    onChange={(e) =>
                      updateLine(l.key, {
                        presentationCost: Number(e.target.value),
                      })
                    }
                  />
                </label>
              ) : (
                <label className="text-xs text-[var(--ad-muted)]">
                  Costo de cada unidad ({currency})
                  <input
                    className="ad-input mt-1"
                    type="number"
                    step="0.0001"
                    value={l.unitCost}
                    onChange={(e) =>
                      updateLine(l.key, {
                        unitCost: Number(e.target.value),
                      })
                    }
                  />
                </label>
              )}
              <div className="rounded bg-black/20 p-2 text-sm leading-6">
                <div>
                  Costo por caja: <strong>{px.boxCost.toFixed(2)}</strong>
                </div>
                <div>
                  Costo por unidad: <strong>{m.unit.toFixed(4)}</strong>
                </div>
                <div>
                  Total de esta línea: <strong>{m.subtotal.toFixed(2)}</strong>{" "}
                  {currency}
                  {l.taxable ? ` + IVA ${m.tax.toFixed(2)}` : ""}
                </div>
                {l.utilityPercent > 0 ? (
                  <>
                    <div className="mt-1 text-[var(--ad-gold-soft)]">
                      Utilidad contable ficha {l.utilityPercent}%
                    </div>
                    <div>
                      PVP unidad: <strong>{px.unitSale.toFixed(2)}</strong>
                    </div>
                    <div>
                      PVP caja: <strong>{px.boxSale.toFixed(2)}</strong>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-[var(--ad-muted)]">
                    Sin utilidad en la ficha: cárguela en Productos para ver el
                    PVP.
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {!lines.length && (
          <p className="p-2 text-sm text-[var(--ad-muted)]">
            Busque el producto y elija si lo compró por caja o por unidad.
          </p>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--ad-border)] bg-[var(--ad-surface)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="text-sm tabular-nums">
            <div>
              SUBTOTAL: <strong>{totals.subtotal.toFixed(2)}</strong>
            </div>
            <div>
              IVA 16%: <strong>{totals.tax.toFixed(2)}</strong>
            </div>
            <div className="text-base">
              TOTAL GENERAL: <strong>{totals.grandTotal.toFixed(2)}</strong>{" "}
              {currency}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ad-btn"
              onClick={() => void saveDraftOrTotalize("draft")}
            >
              Guardar borrador
            </button>
            <button
              type="button"
              className="ad-btn"
              onClick={() => void saveDraftOrTotalize("totalize")}
            >
              Totalizar
            </button>
          </div>
        </div>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      {showCreateProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ad-panel w-full max-w-lg space-y-2">
            <h2 className="font-medium">Crear producto</h2>
            <p className="text-xs text-[var(--ad-muted)]">
              Indique si entra por caja o unidad y la utilidad. Eso queda en la
              ficha.
            </p>
            <input
              className="ad-input"
              placeholder="Código"
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
            />
            <input
              className="ad-input"
              placeholder="Descripción"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="ad-input"
              placeholder="Marca"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
            />
            <select
              className="ad-input"
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`ad-btn ${newPackMode === "UNIT" ? "ad-btn--gold" : ""}`}
                onClick={() => setNewPackMode("UNIT")}
              >
                Por unidad
              </button>
              <button
                type="button"
                className={`ad-btn ${newPackMode === "BOX" ? "ad-btn--gold" : ""}`}
                onClick={() => setNewPackMode("BOX")}
              >
                Por caja
              </button>
            </div>
            {newPackMode === "BOX" ? (
              <input
                className="ad-input"
                type="number"
                min={2}
                placeholder="Unidades por caja"
                value={newUpp}
                onChange={(e) => setNewUpp(Number(e.target.value))}
              />
            ) : null}
            <input
              className="ad-input"
              type="number"
              min={0}
              placeholder="Utilidad contable %"
              value={newUtility}
              onChange={(e) => setNewUtility(Number(e.target.value))}
            />
            <div>
              <p className="mb-1 text-xs text-[var(--ad-muted)]">¿Aplica IVA?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`ad-btn ${!newTaxable ? "ad-btn--gold" : ""}`}
                  onClick={() => setNewTaxable(false)}
                >
                  Sin IVA
                </button>
                <button
                  type="button"
                  className={`ad-btn ${newTaxable ? "ad-btn--gold" : ""}`}
                  onClick={() => setNewTaxable(true)}
                >
                  Con IVA 16%
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="ad-btn"
                onClick={() => void createProductInline()}
              >
                Guardar
              </button>
              <button
                type="button"
                className="ad-btn"
                onClick={() => setShowCreateProduct(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {prelim && printDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ad-panel max-h-[90vh] w-full max-w-4xl space-y-3 overflow-auto">
            <AdPurchaseDocument
              document={printDoc}
              onBack={
                (prelim as { status?: string }).status === "RECEIVED"
                  ? undefined
                  : () => setPrelim(null)
              }
              onConfirm={
                (prelim as { status?: string }).status === "RECEIVED"
                  ? undefined
                  : () => void confirmPurchase()
              }
              confirmLabel="Confirmar compra"
            />
            {(prelim as { status?: string }).status === "RECEIVED" ? (
              <button
                type="button"
                className="ad-btn"
                onClick={() => {
                  setPrelim(null);
                  setPurchaseId(null);
                }}
              >
                Cerrar / nueva compra
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
