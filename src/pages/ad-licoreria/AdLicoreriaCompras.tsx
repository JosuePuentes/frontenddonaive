import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

type DraftLine = {
  key: string;
  presentationId: string;
  productLabel: string;
  presentationLabel: string;
  unitsPerPresentation: number;
  qty: number;
  qtyBonus: number;
  costMode: "UNIT" | "PRESENTATION" | "TOTAL";
  unitCost: number;
  presentationCost: number;
  lineTotal: number;
  taxable: boolean;
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
  const [hits, setHits] = useState<
    {
      id: string;
      name: string;
      brand: string | null;
      sku: string | null;
      taxable?: boolean;
      presentations: {
        id: string;
        name: string;
        unitsPerPresentation: number;
      }[];
    }[]
  >([]);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [prelim, setPrelim] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newTaxable, setNewTaxable] = useState(false);
  const [newUpp, setNewUpp] = useState(1);
  const [newPresName, setNewPresName] = useState("Unidad");
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

  async function search() {
    const r = await adCommerceClient.searchProducts(query.trim());
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setHits(r.data);
  }

  function addHit(p: (typeof hits)[0], presentationId?: string) {
    const pr =
      p.presentations.find((x) => x.id === presentationId) ??
      p.presentations[0];
    if (!pr) return;
    setLines((prev) => [
      ...prev,
      {
        key: `${pr.id}-${Date.now()}`,
        presentationId: pr.id,
        productLabel: `${p.sku ?? ""} ${p.name}`.trim(),
        presentationLabel: pr.name,
        unitsPerPresentation: pr.unitsPerPresentation || 1,
        qty: 1,
        qtyBonus: 0,
        costMode: "PRESENTATION",
        unitCost: 0,
        presentationCost: 0,
        lineTotal: 0,
        taxable: Boolean(p.taxable),
      },
    ]);
    setHits([]);
    setQuery("");
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
      presentationName: newPresName,
      unitsPerPresentation: newUpp,
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
    };
    const pr = data.presentations[0];
    setLines((prev) => [
      ...prev,
      {
        key: `${pr.id}-${Date.now()}`,
        presentationId: pr.id,
        productLabel: `${data.sku} ${data.name}`,
        presentationLabel: pr.name,
        unitsPerPresentation: Number(pr.unitsPerPresentation) || 1,
        qty: 1,
        qtyBonus: 0,
        costMode: "UNIT",
        unitCost: 0,
        presentationCost: 0,
        lineTotal: 0,
        taxable: data.taxable,
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
      // Re-crear borrador simple: si ya hay id, totalizar sobre el existente
      // (ediciones locales se reenvían creando nueva compra si se borró).
      const created = await adCommerceClient.createPurchase({
        ...body,
        invoiceNumber: `${invoice.trim()}-${Date.now().toString().slice(-4)}`,
      });
      if (!created.ok) {
        setMsg(created.error);
        return;
      }
      id = String((created.data as { id: string }).id);
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
      setMsg("Borrador guardado");
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
    setPrelim(null);
    setLines([]);
    setPurchaseId(null);
    setInvoice("");
  }

  function printPrelim() {
    if (!prelim) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<pre>${JSON.stringify((prelim as { document?: unknown }).document ?? prelim, null, 2)}</pre>`,
    );
    w.document.close();
    w.print();
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
            placeholder="Buscar código, nombre, marca… (escáner → Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void search();
            }}
          />
          <button type="button" className="ad-btn" onClick={() => void search()}>
            Buscar
          </button>
        </div>
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
                </span>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => addHit(h)}
                >
                  Agregar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ad-panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-[var(--ad-muted)]">
              <th className="p-1">Producto</th>
              <th className="p-1">Cant.</th>
              <th className="p-1">Bonif.</th>
              <th className="p-1">Modo</th>
              <th className="p-1">Costo</th>
              <th className="p-1">IVA</th>
              <th className="p-1">Subtotal</th>
              <th className="p-1" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const m = lineMoney(l);
              return (
                <tr key={l.key} className="border-t border-[var(--ad-border)]">
                  <td className="p-1">
                    <div className="font-medium">{l.productLabel}</div>
                    <div className="text-xs text-[var(--ad-muted)]">
                      {l.presentationLabel} · {l.unitsPerPresentation} u
                    </div>
                  </td>
                  <td className="p-1">
                    <input
                      className="ad-input w-20"
                      type="number"
                      value={l.qty}
                      onChange={(e) =>
                        updateLine(l.key, { qty: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="p-1">
                    <input
                      className="ad-input w-20"
                      type="number"
                      value={l.qtyBonus}
                      onChange={(e) =>
                        updateLine(l.key, { qtyBonus: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="p-1">
                    <select
                      className="ad-input"
                      value={l.costMode}
                      onChange={(e) =>
                        updateLine(l.key, {
                          costMode: e.target.value as DraftLine["costMode"],
                        })
                      }
                    >
                      <option value="UNIT">Unitario</option>
                      <option value="PRESENTATION">Caja</option>
                      <option value="TOTAL">Total</option>
                    </select>
                  </td>
                  <td className="p-1">
                    {l.costMode === "UNIT" && (
                      <input
                        className="ad-input w-24"
                        type="number"
                        step="0.0001"
                        value={l.unitCost}
                        onChange={(e) =>
                          updateLine(l.key, {
                            unitCost: Number(e.target.value),
                          })
                        }
                      />
                    )}
                    {l.costMode === "PRESENTATION" && (
                      <input
                        className="ad-input w-24"
                        type="number"
                        step="0.01"
                        value={l.presentationCost}
                        onChange={(e) =>
                          updateLine(l.key, {
                            presentationCost: Number(e.target.value),
                          })
                        }
                      />
                    )}
                    {l.costMode === "TOTAL" && (
                      <input
                        className="ad-input w-24"
                        type="number"
                        step="0.01"
                        value={l.lineTotal}
                        onChange={(e) =>
                          updateLine(l.key, {
                            lineTotal: Number(e.target.value),
                          })
                        }
                      />
                    )}
                    <div className="text-[10px] text-[var(--ad-muted)]">
                      u {m.unit.toFixed(4)} · caja {m.box.toFixed(2)}
                    </div>
                  </td>
                  <td className="p-1">
                    <input
                      type="checkbox"
                      checked={l.taxable}
                      onChange={(e) =>
                        updateLine(l.key, { taxable: e.target.checked })
                      }
                    />
                  </td>
                  <td className="p-1 tabular-nums">{m.subtotal.toFixed(2)}</td>
                  <td className="p-1">
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => removeLine(l.key)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!lines.length && (
          <p className="p-2 text-sm text-[var(--ad-muted)]">
            Agregue productos con el buscador.
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
            <input
              className="ad-input"
              placeholder="Presentación"
              value={newPresName}
              onChange={(e) => setNewPresName(e.target.value)}
            />
            <input
              className="ad-input"
              type="number"
              placeholder="Unidades / presentación"
              value={newUpp}
              onChange={(e) => setNewUpp(Number(e.target.value))}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newTaxable}
                onChange={(e) => setNewTaxable(e.target.checked)}
              />
              Aplica IVA 16%
            </label>
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

      {prelim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ad-panel max-h-[90vh] w-full max-w-2xl space-y-3 overflow-auto">
            <h2 className="text-lg font-semibold">Preliminar de compra</h2>
            <p className="text-sm text-[var(--ad-muted)]">
              Sin utilidad / margen / precio de venta.
            </p>
            <pre className="overflow-auto rounded bg-black/5 p-2 text-xs">
              {JSON.stringify(
                (prelim as { document?: unknown }).document ?? prelim,
                null,
                2,
              )}
            </pre>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ad-btn"
                onClick={() => setPrelim(null)}
              >
                Editar compra
              </button>
              <button type="button" className="ad-btn" onClick={printPrelim}>
                Imprimir / Descargar
              </button>
              <button
                type="button"
                className="ad-btn"
                onClick={() => void confirmPurchase()}
              >
                Confirmar compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
