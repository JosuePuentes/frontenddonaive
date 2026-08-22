import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AdPurchaseDocument,
  type AdPurchasePrintDoc,
} from "@/components/ad-licoreria/AdDocumentViews";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import { AdPurchaseLineForm } from "@/components/ad-licoreria/AdPurchaseLineForm";
import { AdNumberInput } from "@/components/ad-licoreria/AdNumberInput";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdFocusMode } from "@/lib/ad-licoreria/focus-mode";
import { findUnitAndBox } from "@/lib/ad-licoreria/pack";
import {
  requiresInvoiceExchangeRate,
} from "@/lib/ad-licoreria/payment-methods";
import {
  computeLineRealCosts,
  newExtraTax,
  type ExtraInvoiceTax,
} from "@/lib/ad-licoreria/purchase-invoice";
import { formatVeNumber } from "@/lib/ad-licoreria/number-format";
import {
  hitToDraftLine,
  lineMoney,
  lineToApiPayload,
  purchaseAmountToDisplay,
  type DraftLine,
} from "@/lib/ad-licoreria/purchase-draft";
import { searchAdProducts, type AdProductSearchHit } from "@/lib/ad-licoreria/product-lookup";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

/**
 * Compras F6 — encabezado → líneas editables → resumen vivo → totalizar → confirmar.
 */
export default function AdLicoreriaCompras() {
  const { warehouses, hasPermission, categories } = useAdLicoreria();
  const { focusMode, toggleFocusMode } = useAdFocusMode();
  const [suppliers, setSuppliers] = useState<
    { id: string; name: string; creditDays: number }[]
  >([]);
  const [methods, setMethods] = useState<
    {
      id: string;
      name: string;
      currency: string;
      usesSpecialRateRef: boolean;
      code?: string;
    }[]
  >([]);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [currency, setCurrency] = useState<"USD" | "BS">("USD");
  const [invoiceRate, setInvoiceRate] = useState(0);
  const [extraTaxes, setExtraTaxes] = useState<ExtraInvoiceTax[]>([]);
  const [invoice, setInvoice] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [credit, setCredit] = useState(false);
  const [creditDays, setCreditDays] = useState(15);
  const [notes, setNotes] = useState("");

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdProductSearchHit[]>([]);
  const [draftLine, setDraftLine] = useState<DraftLine | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [bcvRate, setBcvRate] = useState(772.54);
  const [protectedRate, setProtectedRate] = useState(870);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [prelim, setPrelim] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
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

  const selectedMethod = useMemo(
    () => methods.find((m) => m.id === paymentMethodId),
    [methods, paymentMethodId],
  );

  const showInvoiceRate = requiresInvoiceExchangeRate(selectedMethod);

  const totals = useMemo(
    () =>
      computeLineRealCosts(lines, extraTaxes, {
        currency,
        invoiceRate: showInvoiceRate ? invoiceRate : undefined,
        bcv: bcvRate,
      }),
    [lines, extraTaxes, currency, showInvoiceRate, invoiceRate, bcvRate],
  );

  const draftRealCost = useMemo(() => {
    if (!draftLine) return undefined;
    const single = computeLineRealCosts([draftLine], extraTaxes, {
      currency,
      invoiceRate: showInvoiceRate ? invoiceRate : undefined,
      bcv: bcvRate,
    });
    return single.lineRealCosts.get(draftLine.key);
  }, [draftLine, extraTaxes, currency, showInvoiceRate, invoiceRate, bcvRate]);

  const printDoc = useMemo((): AdPurchasePrintDoc | null => {
    if (!prelim) return null;
    const d = (prelim as { document?: AdPurchasePrintDoc }).document;
    if (!d) return null;
    return d;
  }, [prelim]);

  const rateCtx = useMemo(
    () => ({
      currency,
      bcv: bcvRate,
      protectedRate,
      useProtected: Boolean(selectedMethod?.usesSpecialRateRef),
      invoiceRate:
        showInvoiceRate && invoiceRate > 0 ? invoiceRate : undefined,
    }),
    [currency, bcvRate, protectedRate, selectedMethod, showInvoiceRate, invoiceRate],
  );

  const totalsDisplay = useMemo(() => {
    const sub = purchaseAmountToDisplay(totals.subtotal, rateCtx);
    const tax = purchaseAmountToDisplay(totals.tax, rateCtx);
    const extra = purchaseAmountToDisplay(totals.extraTaxesTotal, rateCtx);
    const grand = purchaseAmountToDisplay(totals.grandTotal, rateCtx);
    return { sub, tax, extra, grand };
  }, [totals, rateCtx]);

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
        const active = m.data.filter((x) => x.active !== false) as typeof methods;
        setMethods(active);
        if (active[0]) {
          setPaymentMethodId(active[0].id);
          setCurrency((active[0].currency as "USD" | "BS") || "USD");
        }
      }
      const bcv = await adCommerceClient.getBcv();
      if (bcv.ok) {
        const d = bcv.data as { current?: { rate: number } };
        if (d.current?.rate) setBcvRate(d.current.rate);
      }
      const prot = await adCommerceClient.getProtected();
      if (prot.ok) {
        const d = prot.data as {
          current?: { rate: number } | number | null;
        };
        const cur =
          typeof d.current === "number" ? d.current : d.current?.rate;
        if (cur != null && cur > 0) setProtectedRate(cur);
      }
    })();
  }, []);

  useEffect(() => {
    if (showInvoiceRate && !(invoiceRate > 0)) {
      setInvoiceRate(bcvRate);
    }
  }, [showInvoiceRate, bcvRate, invoiceRate]);

  function encodeNotes(userNotes: string) {
    const meta = {
      invoiceRate: showInvoiceRate && invoiceRate > 0 ? invoiceRate : undefined,
      extraTaxes,
    };
    const metaBlock = `[AD_META]${JSON.stringify(meta)}[/AD_META]`;
    const trimmed = userNotes.trim();
    return trimmed ? `${metaBlock}\n${trimmed}` : metaBlock;
  }

  function buildLinePayloads() {
    return lines.map((l) => {
      const real = totals.lineRealCosts.get(l.key);
      return lineToApiPayload(
        l,
        currency,
        real?.realUnit,
        real?.realTotal,
      );
    });
  }

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

  function selectHit(p: (typeof hits)[0], prefer: "UNIT" | "BOX" = "BOX") {
    const draft = hitToDraftLine(p, prefer);
    if (!draft) return;
    setDraftLine(draft);
    setHits([]);
    setQuery("");
    setMsg("Complete costo y cantidad, luego pulse Agregar.");
  }

  function patchDraft(patch: Partial<DraftLine>) {
    setDraftLine((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function commitDraftLine() {
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
      { ...draftLine, key: `${draftLine.presentationId}-${Date.now()}` },
    ]);
    setDraftLine(null);
    setMsg("Producto agregado a la factura");
  }

  function editLine(key: string) {
    const line = lines.find((l) => l.key === key);
    if (!line) return;
    setDraftLine({ ...line, key: `draft-${line.presentationId}-${Date.now()}` });
    setLines((prev) => prev.filter((l) => l.key !== key));
    setMsg("Editando línea — pulse Agregar al confirmar");
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
      barcode: newBarcode.trim() || undefined,
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
    const draft = hitToDraftLine(
      {
        sku: data.sku,
        name: data.name,
        taxable: data.taxable,
        defaultUtilityPercent: data.defaultUtilityPercent,
        presentations: data.presentations,
      },
      buyMode,
    );
    setShowCreateProduct(false);
    setNewSku("");
    setNewBarcode("");
    setNewName("");
    if (draft) {
      setDraftLine(draft);
      setMsg("Producto creado — complete costo y pulse Agregar");
    }
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
      notes: encodeNotes(notes),
      preliminary: true,
      lines: buildLinePayloads(),
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
    setDraftLine(null);
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
            onClick={toggleFocusMode}
            title={focusMode ? "Mostrar menú de módulos" : "Ocultar menú de módulos"}
          >
            {focusMode ? "Mostrar menú" : "Ocultar menú"}
          </button>
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
        {showInvoiceRate ? (
          <label className="text-xs">
            Tasa de la factura (Bs por 1 USD) *
            <AdNumberInput
              value={invoiceRate || bcvRate}
              decimals={2}
              min={0.01}
              onChange={setInvoiceRate}
            />
            <span className="mt-1 block text-[var(--ad-muted)]">
              Solo pagos en Bs. Costo USD = monto Bs ÷ tasa.
            </span>
          </label>
        ) : null}
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
        <p className="text-xs text-[var(--ad-muted)] sm:col-span-full">
          BCV {bcvRate.toLocaleString("es-VE")} · Moneda factura {currency}
          {showInvoiceRate && invoiceRate > 0
            ? ` · Tasa factura ${formatVeNumber(invoiceRate, 2)} Bs/USD`
            : ""}
          {selectedMethod?.usesSpecialRateRef
            ? " · método con tasa protegida (cálculo interno)"
            : ""}
        </p>
      </section>

      <section className="ad-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="ad-panel-title">Impuestos adicionales</h2>
            <p className="text-xs text-[var(--ad-muted)]">
              Montos en Bs. Marque los que reparten entre líneas para sumarlos al
              costo real (CPP).
            </p>
          </div>
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => setExtraTaxes((prev) => [...prev, newExtraTax()])}
          >
            + Impuesto
          </button>
        </div>
        {extraTaxes.length === 0 ? (
          <p className="text-sm text-[var(--ad-muted)]">
            Sin impuestos extra. Use + Impuesto para agregar (ej. municipal, retención).
          </p>
        ) : (
          extraTaxes.map((tax) => (
            <div
              key={tax.id}
              className="grid gap-2 rounded border border-[var(--ad-line)] p-3 sm:grid-cols-[1fr_10rem_auto_auto]"
            >
              <label className="text-xs text-[var(--ad-muted)]">
                Nombre del impuesto
                <input
                  className="ad-input mt-1"
                  value={tax.name}
                  placeholder="Ej. Impuesto municipal"
                  onChange={(e) =>
                    setExtraTaxes((prev) =>
                      prev.map((t) =>
                        t.id === tax.id ? { ...t, name: e.target.value } : t,
                      ),
                    )
                  }
                />
              </label>
              <label className="text-xs text-[var(--ad-muted)]">
                Monto en Bs
                <AdNumberInput
                  value={tax.amountBs}
                  decimals={2}
                  min={0}
                  onChange={(amountBs) =>
                    setExtraTaxes((prev) =>
                      prev.map((t) =>
                        t.id === tax.id ? { ...t, amountBs } : t,
                      ),
                    )
                  }
                />
              </label>
              <label className="flex items-end gap-2 pb-1 text-xs">
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
                Sumar al costo
              </label>
              <button
                type="button"
                className="ad-btn self-end"
                onClick={() =>
                  setExtraTaxes((prev) => prev.filter((t) => t.id !== tax.id))
                }
              >
                Quitar
              </button>
            </div>
          ))
        )}
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
                      onClick={() => selectHit(h, "BOX")}
                    >
                      Caja
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ad-btn"
                    onClick={() => selectHit(h, "UNIT")}
                  >
                    Unidad
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {draftLine ? (
        <section className="ad-panel space-y-2">
          <h2 className="ad-panel-title">Producto en edición</h2>
          <AdPurchaseLineForm
            line={draftLine}
            currency={currency}
            rateCtx={rateCtx}
            realCost={draftRealCost}
            onChange={patchDraft}
            onAdd={commitDraftLine}
            onCancel={() => setDraftLine(null)}
          />
        </section>
      ) : null}

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">
          Líneas de la factura ({lines.length})
        </h2>
        {lines.map((l) => {
          const m = lineMoney(l);
          const real = totals.lineRealCosts.get(l.key);
          const lineDisp = purchaseAmountToDisplay(m.subtotal, rateCtx);
          const realDisp = real
            ? purchaseAmountToDisplay(real.realUnit, rateCtx)
            : null;
          return (
            <article
              key={l.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--ad-line)] p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[var(--ad-gold-soft)]">
                  {l.productLabel}
                  {l.taxable ? (
                    <span className="ml-2 ad-badge ad-badge--ok text-[10px]">
                      IVA
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-[var(--ad-muted)]">
                  {l.presentationLabel} · {l.qty}{" "}
                  {l.buyMode === "BOX" ? "caja(s)" : "u."} · Subtotal{" "}
                  {formatVeNumber(m.subtotal, 2)} {currency}
                  {l.taxable ? ` + IVA ${formatVeNumber(m.tax, 2)}` : ""}
                </div>
                {real && real.realUnit > m.unit ? (
                  <div className="text-xs text-[var(--ad-success)]">
                    Costo real/u.: {formatVeNumber(real.realUnit, 4)} {currency}
                    {l.buyMode === "BOX"
                      ? ` · caja: ${formatVeNumber(real.realBox, 2)}`
                      : ""}
                    {realDisp ? (
                      <span className="ml-2">
                        <AdPriceDisplay
                          price={{ usd: realDisp.usd, bs: realDisp.bs }}
                          stacked
                        />
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-1">
                  <AdPriceDisplay
                    price={{ usd: lineDisp.usd, bs: lineDisp.bs }}
                    stacked
                  />
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => editLine(l.key)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => removeLine(l.key)}
                >
                  Quitar
                </button>
              </div>
            </article>
          );
        })}
        {!lines.length && !draftLine ? (
          <p className="p-2 text-sm text-[var(--ad-muted)]">
            Busque un producto, elija caja o unidad, complete el costo y pulse
            Agregar.
          </p>
        ) : null}
        {!lines.length && draftLine ? (
          <p className="p-2 text-sm text-[var(--ad-muted)]">
            Aún no hay líneas confirmadas en esta factura.
          </p>
        ) : null}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--ad-border)] bg-[var(--ad-surface)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="text-sm tabular-nums">
            <div>
              SUBTOTAL: <strong>{formatVeNumber(totals.subtotal, 2)}</strong>{" "}
              {currency}
            </div>
            <div className="text-xs text-[var(--ad-muted)]">
              Ref. POS:{" "}
              <AdPriceDisplay
                price={{ usd: totalsDisplay.sub.usd, bs: totalsDisplay.sub.bs }}
                stacked
              />
            </div>
            <div>
              IVA 16%: <strong>{formatVeNumber(totals.tax, 2)}</strong>{" "}
              {currency}
            </div>
            {totals.extraTaxesTotalBs > 0 ? (
              <div>
                Impuestos adicionales:{" "}
                <strong>{formatVeNumber(totals.extraTaxesTotalBs, 2)}</strong> Bs
                {currency === "USD" && totals.extraTaxesTotal > 0 ? (
                  <span className="text-[var(--ad-muted)]">
                    {" "}
                    (≈ {formatVeNumber(totals.extraTaxesTotal, 2)} USD)
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="text-base">
              TOTAL GENERAL:{" "}
              <strong>{formatVeNumber(totals.grandTotal, 2)}</strong> {currency}
            </div>
            <div className="text-xs text-[var(--ad-muted)]">
              Ref. POS:{" "}
              <AdPriceDisplay
                price={{
                  usd: totalsDisplay.grand.usd,
                  bs: totalsDisplay.grand.bs,
                }}
                stacked
              />
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
              placeholder="SKU / código interno"
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
            />
            <input
              className="ad-input"
              placeholder="Código de barras EAN"
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              inputMode="numeric"
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
              <label className="text-xs text-[var(--ad-muted)]">
                Unidades por caja
                <AdNumberInput
                  value={newUpp}
                  decimals={0}
                  min={2}
                  onChange={setNewUpp}
                />
              </label>
            ) : null}
            <label className="text-xs text-[var(--ad-muted)]">
              Utilidad contable % (margen sobre PVP, no sobre costo)
              <AdNumberInput
                value={newUtility}
                decimals={1}
                min={0}
                max={99.9}
                onChange={setNewUtility}
              />
            </label>
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
