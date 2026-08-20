import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "react-router";
import {
  toBaseUnits,
} from "@/lib/ad-licoreria/conversions";
import { useAdFocusMode } from "@/lib/ad-licoreria/focus-mode";
import { getAdLicoreriaRoutes } from "@/constants/ad-licoreria-routes";
import { findUnitAndBox } from "@/lib/ad-licoreria/pack";
import {
  matchPresentationBarcode,
  searchAdProducts,
} from "@/lib/ad-licoreria/product-lookup";
import {
  warehouseLabel,
  warehouseUsesMesas,
} from "@/lib/ad-licoreria/warehouses";
import { AD_SHORTAGE_REASON_LABELS } from "@/types/ad-licoreria";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";
import { AdPackPickPrompt } from "@/components/ad-licoreria/AdPackPickPrompt";
import { AdPriceDisplay } from "@/components/ad-licoreria/AdPriceDisplay";
import {
  AdPreliminarDocument,
  AdSaleReceiptFallback,
} from "@/components/ad-licoreria/AdDocumentViews";
import type {
  AdInvoiceDraft,
  AdPayment,
  AdPaymentMethodCode,
  AdSale,
  AdSaleItem,
  AdShortageOverrideReason,
} from "@/types/ad-licoreria";

type DraftPayment = Omit<AdPayment, "id" | "createdAt">;

export default function AdLicoreriaVentas() {
  const {
    products,
    presentations,
    tables,
    warehouses,
    operators,
    customers,
    paymentMethods,
    currentOperatorId,
    getPresentationsFor,
    getOperationalAvailability,
    getFloorOperatorsForWarehouse,
    getCurrentOperator,
    openAccount,
    addAccountItem,
    createPrepaid,
    createInvoiceDraft,
    confirmInvoiceDraft,
    cancelInvoiceDraft,
    hasPermission,
  } = useAdLicoreria();

  const activeMethods = paymentMethods.filter((m) => m.active);
  const sessionUser = getCurrentOperator();
  const routes = getAdLicoreriaRoutes();
  const { focusMode, toggleFocusMode } = useAdFocusMode();

  const cashierId = sessionUser?.id ?? currentOperatorId ?? "";
  const posWarehouseId = sessionUser?.warehouseId ?? "";
  const floorUsers = posWarehouseId
    ? getFloorOperatorsForWarehouse(posWarehouseId)
    : [];

  const [query, setQuery] = useState("");
  const [tableId, setTableId] = useState("");
  const [mesoneraId, setMesoneraId] = useState(floorUsers[0]?.id ?? "");
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
  const [discountUsd, setDiscountUsd] = useState(0);
  const [discountAuth, setDiscountAuth] = useState("");
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState<AdInvoiceDraft | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<string | null>(null);
  const [confirmedSale, setConfirmedSale] = useState<AdSale | null>(null);
  const [shortageReason, setShortageReason] = useState("");
  const [shortageNote, setShortageNote] = useState("");
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [cobroOpen, setCobroOpen] = useState(false);
  const [packPick, setPackPick] = useState<{ productId: string } | null>(null);

  const usesMesas = warehouseUsesMesas(posWarehouseId, warehouses);
  const posTables = useMemo(
    () =>
      tables.filter(
        (t) =>
          t.active &&
          usesMesas &&
          (!posWarehouseId || !t.warehouseId || t.warehouseId === posWarehouseId),
      ),
    [tables, posWarehouseId, usesMesas],
  );
  const selectedTable = tables.find((t) => t.id === tableId);
  const hasExtras = Boolean(
    customerId ||
      notes.trim() ||
      (usesMesas && (tableId || mesoneraId)),
  );

  useEffect(() => {
    if (!usesMesas) {
      setTableId("");
      setMesoneraId("");
    }
  }, [usesMesas, posWarehouseId]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)),
    );
  }, [products, query]);

  const cashier = sessionUser ?? operators.find((o) => o.id === cashierId);
  const mesonera = operators.find((o) => o.id === mesoneraId);
  const customer = customers.find((c) => c.id === customerId);
  const methodCfg = activeMethods.find((m) => m.code === payMethod);
  const totalUsd = cart.reduce((a, l) => a + l.unitPrice.usd * l.qty, 0);
  const totalBs = cart.reduce((a, l) => a + l.unitPrice.bs * l.qty, 0);
  const netUsd = Math.max(0, totalUsd - discountUsd);
  const paidUsd = payments
    .filter((p) => p.currency === "USD")
    .reduce((a, p) => a + p.amount, 0);

  const canSell =
    Boolean(posWarehouseId) &&
    Boolean(cashier) &&
    cashier?.posEnabled !== false &&
    hasPermission("pos.sell", cashier?.id);

  function pickProduct(pid: string) {
    const presList = getPresentationsFor(pid);
    const pickPack = findUnitAndBox(presList);
    if (pickPack.unit && pickPack.box) {
      setPackPick({ productId: pid });
      return;
    }
    const pres = presList[0];
    if (pres) {
      addLineToCart(pid, pres.id, 1);
      setQuery("");
      setMsg("");
    }
  }

  const cartAlerts = useMemo(
    () =>
      cart.map((line) => {
        const av = getOperationalAvailability(
          line.productId,
          line.qtyBase,
          posWarehouseId,
        );
        const shortfall = Math.max(
          0,
          line.qtyBase - av.availableOperationalTotal,
        );
        return { line, av, shortfall };
      }),
    [cart, getOperationalAvailability, posWarehouseId],
  );

  function addLineToCart(pid: string, presId: string, lineQty: number) {
    const pres = presentations.find((p) => p.id === presId);
    if (!pres || lineQty <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.presentationId === pres.id);
      if (idx >= 0) {
        const next = [...prev];
        const line = next[idx];
        const newQty = line.qty + lineQty;
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
          productId: pid,
          presentationId: pres.id,
          qty: lineQty,
          unitPrice: { ...pres.price },
          qtyBase: toBaseUnits(pres, lineQty),
        },
      ];
    });
    setMsg("");
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const term = query.trim();
    if (!term) return;
    if (/^\d{4,}$/.test(term) || term.length >= 8) {
      void handleBarcodeScan(term, "wedge");
      return;
    }
    if (filteredProducts.length === 1) {
      pickProduct(filteredProducts[0].id);
    }
  }

  const handleBarcodeScan = useCallback(
    async (code: string, source: "wedge" | "camera" = "wedge") => {
      const trimmed = code.trim();
      if (!trimmed) return;
      setQuery(trimmed);

      let resolvedProductId: string | undefined;
      let resolvedPresentationId: string | undefined;

      const presByCode = matchPresentationBarcode(presentations, trimmed);
      if (presByCode) {
        resolvedProductId = presByCode.productId;
        resolvedPresentationId = presByCode.id;
      } else {
        const bySkuOrBarcode = products.find(
          (p) =>
            p.active &&
            (p.barcode?.trim().toLowerCase() === trimmed.toLowerCase() ||
              p.sku.trim().toLowerCase() === trimmed.toLowerCase()),
        );
        if (bySkuOrBarcode) resolvedProductId = bySkuOrBarcode.id;
      }

      if (!resolvedProductId && isAdApiDataSource()) {
        const r = await searchAdProducts(trimmed, source);
        if (r.ok && r.products.length) {
          const hit = r.products[0];
          resolvedProductId = hit.id;
          const pres = matchPresentationBarcode(hit.presentations, trimmed);
          if (pres) resolvedPresentationId = pres.id;
        }
      }

      if (!resolvedProductId) {
        setMsg("Producto no encontrado");
        return;
      }

      const product = products.find((p) => p.id === resolvedProductId);
      if (!product?.active) {
        setMsg("Producto no disponible");
        return;
      }

      if (resolvedPresentationId) {
        addLineToCart(resolvedProductId, resolvedPresentationId, 1);
        setQuery("");
        return;
      }

      const presList = getPresentationsFor(resolvedProductId);
      const scannedPack = findUnitAndBox(presList);
      if (scannedPack.unit && scannedPack.box) {
        setPackPick({ productId: resolvedProductId });
        return;
      }

      const onlyPres = presList[0];
      if (onlyPres) {
        addLineToCart(resolvedProductId, onlyPres.id, 1);
        setQuery("");
      }
    },
    [getPresentationsFor, presentations, products],
  );

  function applyPackPick(mode: "UNIT" | "BOX") {
    if (!packPick) return;
    const presList = getPresentationsFor(packPick.productId);
    const pickPack = findUnitAndBox(presList);
    const pres = mode === "BOX" ? pickPack.box : pickPack.unit;
    if (!pres) return;
    addLineToCart(packPick.productId, pres.id, 1);
    setPackPick(null);
    setQuery("");
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

  async function openPrelim() {
    if (!canSell || !posWarehouseId || !cashierId) {
      setMsg("Sesión POS inválida: usuario con depósito asignado requerido");
      return;
    }
    if (!cart.length) {
      setMsg("Agregue productos");
      return;
    }
    if (!payments.length) {
      setMsg("Registre al menos un pago");
      return;
    }
    if (discountUsd > 0 && !discountAuth.trim()) {
      setMsg("Descuento requiere autorización");
      return;
    }
    const result = await resolveAdResult(
      createInvoiceDraft({
        items: cart,
        payments,
        warehouseId: posWarehouseId,
        operatorId: cashierId,
        cashierName: cashier?.name ?? "Cajero",
        tableId: tableId || undefined,
        mesoneraName: mesonera?.name,
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        customerDocumentId: customer?.documentId,
        discountUsd,
        notes: notes.trim() || undefined,
      }),
    );
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setDraft(result.data);
    setCobroOpen(false);
    setConfirmedReceipt(null);
    setMsg(`Preliminar ${result.data.provisionalNumber}`);
  }

  const canShortageOverride =
    hasPermission("pos.shortage_override") ||
    hasPermission("pos.shortage_override", cashier?.id);

  async function confirmDraft(continueWithShortage = false) {
    if (!draft) return;
    if (continueWithShortage) {
      if (!canShortageOverride) {
        setMsg(
          "Sin permiso pos.shortage_override. Solicite a un supervisor o admin.",
        );
        return;
      }
      if (!shortageReason.trim()) {
        setMsg("Seleccione el motivo para continuar con faltante");
        return;
      }
      if (shortageReason === "otro" && !shortageNote.trim()) {
        setMsg("Detalle obligatorio cuando el motivo es «otro»");
        return;
      }
    }
    const result = await resolveAdResult(
      confirmInvoiceDraft({
        draftId: draft.id,
        userName: cashier?.name ?? mesonera?.name ?? "Cajero",
        continueWithShortage,
        shortageDecision: continueWithShortage ? shortageReason : undefined,
        shortageReasonCode: continueWithShortage ? shortageReason : undefined,
        shortageReasonNote:
          continueWithShortage && shortageReason === "otro"
            ? shortageNote.trim()
            : continueWithShortage
              ? shortageNote.trim() || undefined
              : undefined,
      }),
    );
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setConfirmedReceipt(result.data.receiptNumber);
    setConfirmedSale(result.data);
    setCart([]);
    setPayments([]);
    setNotes("");
    setDiscountUsd(0);
    setDiscountAuth("");
    setShortageReason("");
    setShortageNote("");
    setDraft(null);
    setCobroOpen(false);
    setMsg(`Factura confirmada ${result.data.receiptNumber}`);
  }

  async function leaveOpen() {
    if (!cart.length) {
      setMsg("Agregue productos");
      return;
    }
    if (!cashierId && !mesoneraId) {
      setMsg("Seleccione usuario del depósito");
      return;
    }
    const opened = await resolveAdResult(
      openAccount({
        tableId: tableId || undefined,
        mesoneraId: mesonera?.id ?? cashier?.id,
        mesoneraName: mesonera?.name ?? cashier?.name ?? "Mesonera",
        customerId: customer?.id,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        notes: notes.trim() || undefined,
      }),
    );
    if (!opened.ok) {
      setMsg(opened.error);
      return;
    }
    for (const line of cart) {
      const r = await resolveAdResult(
        addAccountItem({
          accountId: opened.data.id,
          productId: line.productId,
          presentationId: line.presentationId,
          qty: line.qty,
          userName: mesonera?.name ?? cashier?.name ?? "Mesonera",
          deductStock: false,
          warehouseId: posWarehouseId,
        }),
      );
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
    }
    setCart([]);
    setPayments([]);
    setNotes("");
    setCobroOpen(false);
    setExtrasOpen(false);
    setMsg(
      `Cuenta #${opened.data.number} abierta en ${warehouseLabel(posWarehouseId, warehouses)} · pendientes de servir`,
    );
  }

  async function toPrepaid() {
    if (!cart.length) {
      setMsg("Agregue productos");
      return;
    }
    if (!cashierId) {
      setMsg("Seleccione el usuario POS de este depósito");
      return;
    }
    if (!customer?.phone) {
      setMsg("Seleccione un cliente con teléfono para prepago");
      return;
    }
    const result = await resolveAdResult(
      createPrepaid({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        items: cart.map((c) => ({
          productId: c.productId,
          presentationId: c.presentationId,
          qty: c.qty,
        })),
        payments,
        userName: cashier?.name ?? "Cajero",
      }),
    );
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setCart([]);
    setPayments([]);
    setNotes("");
    setCobroOpen(false);
    setExtrasOpen(false);
    setMsg(
      `Prepago ${result.data.code} · Recibo ${result.data.receiptNumber} · QR listo`,
    );
  }

  return (
    <div className="ad-pos">
      <header className="ad-pos__header">
        <div>
          <p className="ad-eyebrow">Punto de venta</p>
          <h2 className="ad-panel-title">Cobrar rápido</h2>
          <p className="text-sm text-[var(--ad-muted)]">
            {cashier?.name ?? "Inicie sesión con su usuario de caja"}
            {canSell
              ? " · Escriba o use el visor escáner para agregar al carrito"
              : ""}
          </p>
        </div>
        <button
          type="button"
          className="ad-btn shrink-0"
          onClick={toggleFocusMode}
        >
          {focusMode ? "Mostrar menú" : "Ocultar menú"}
        </button>
        {!canSell ? (
          <p className="text-sm text-[var(--ad-danger)]">
            {!posWarehouseId
              ? "Su usuario no tiene depósito asignado. Configúrelo en Usuarios."
              : "Sin permiso para vender en POS."}
          </p>
        ) : null}
      </header>

      <section className="ad-panel ad-pos__panel space-y-3">
          <h3 className="ad-pos__section-title">Buscar producto</h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="ad-input ad-pos__search min-w-[12rem] flex-1"
              placeholder="Nombre, marca, SKU o código…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              inputMode="search"
              autoComplete="off"
              autoFocus
            />
            {(hasPermission("inventory.read") ||
              hasPermission("pos.sell") ||
              hasPermission("products.manage")) ? (
            <Link className="ad-btn ad-btn--gold" to={routes.escaner}>
              Visor escáner
            </Link>
            ) : null}
          </div>
          <p className="text-xs text-[var(--ad-muted)]">
            Para escanear con cámara use el módulo «Visor escáner». Aquí puede
            buscar por nombre o digitar / pistola USB.
          </p>

          {query.trim() ? (
            <ul className="ad-pos__search-hits max-h-52 overflow-auto rounded border border-[var(--ad-line)] text-sm">
              {filteredProducts.slice(0, 15).map((p) => {
                const pres = getPresentationsFor(p.id)[0];
                return (
                  <li
                    key={p.id}
                    className="border-b border-[var(--ad-line)] last:border-0"
                  >
                    <button
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-white/5"
                      onClick={() => pickProduct(p.id)}
                      disabled={!canSell}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[var(--ad-muted)]">
                        {p.brand} · {p.sku}
                        {pres ? (
                          <>
                            {" · "}
                            <AdPriceDisplay price={pres.price} stacked />
                          </>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
              {!filteredProducts.length ? (
                <li className="px-3 py-2 text-[var(--ad-muted)]">
                  Sin coincidencias
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-sm text-[var(--ad-muted)]">
              Escriba para filtrar o escanee un código de barras.
            </p>
          )}

          <h3 className="ad-pos__section-title">
            Carrito ({cart.length})
          </h3>
          <div className="ad-pos__cart">
            {cart.map((l, i) => {
              const prod = products.find((p) => p.id === l.productId);
              const pres = presentations.find((p) => p.id === l.presentationId);
              const alert = cartAlerts[i];
              const lineUsd = l.unitPrice.usd * l.qty;
              const lineBs = l.unitPrice.bs * l.qty;
              return (
                <article key={`${l.presentationId}-${i}`} className="ad-pos__cart-item">
                  <div className="ad-pos__cart-main">
                    <strong>{prod?.name ?? "Producto"}</strong>
                    <span className="text-[var(--ad-muted)] block">
                      {pres?.name} ·{" "}
                      <AdPriceDisplay price={l.unitPrice} stacked />
                    </span>
                    {alert && alert.shortfall > 0 ? (
                      <span className="text-[var(--ad-gold-soft)] text-xs">
                        Faltan {alert.shortfall} u.
                      </span>
                    ) : null}
                  </div>
                  <div className="ad-pos__cart-controls">
                    <div className="ad-pos__qty" role="group" aria-label="Cantidad">
                      <button
                        type="button"
                        className="ad-pos__qty-btn"
                        aria-label="Restar"
                        onClick={() => setLineQty(i, l.qty - 1)}
                      >
                        −
                      </button>
                      <span className="ad-pos__qty-val">{l.qty}</span>
                      <button
                        type="button"
                        className="ad-pos__qty-btn"
                        aria-label="Sumar"
                        onClick={() => setLineQty(i, l.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <strong className="ad-pos__line-total block">
                      <AdPriceDisplay
                        price={{ usd: lineUsd, bs: lineBs }}
                        stacked
                      />
                    </strong>
                    <button
                      type="button"
                      className="ad-btn ad-pos__remove"
                      onClick={() =>
                        setCart((c) => c.filter((_, idx) => idx !== i))
                      }
                    >
                      Quitar
                    </button>
                  </div>
                </article>
              );
            })}
            {!cart.length ? (
              <p className="text-sm text-[var(--ad-muted)]">
                Aún no hay ítems. Busque un producto y pulse + Agregar.
              </p>
            ) : null}
          </div>
        </section>

      {msg ? (
        <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}

      {confirmedSale ? (
        <AdSaleReceiptFallback
          sale={confirmedSale}
          productName={(id) =>
            products.find((p) => p.id === id)?.name ?? id
          }
          presentationName={(id) =>
            presentations.find((p) => p.id === id)?.name ?? id
          }
          onClose={() => {
            setConfirmedSale(null);
            setConfirmedReceipt(null);
          }}
        />
      ) : confirmedReceipt ? (
        <div className="ad-cop__alert text-sm">Recibo {confirmedReceipt}</div>
      ) : null}

      <div className="ad-pos__footer">
        <div className="ad-pos__footer-total">
          <p className="ad-eyebrow">Total</p>
          <p className="ad-display text-2xl text-[var(--ad-gold-soft)]">
            ${netUsd.toFixed(2)}
          </p>
          <p className="text-xs text-[var(--ad-muted)]">
            {cart.length} ítem(s)
            {customer ? ` · ${customer.name}` : ""}
            {usesMesas && selectedTable
              ? ` · ${selectedTable.code ?? `Mesa ${selectedTable.number}`}`
              : ""}
            {mesonera ? ` · ${mesonera.name}` : ""}
          </p>
        </div>
        <div className="ad-pos__footer-actions">
          <button
            type="button"
            className={`ad-btn ${hasExtras ? "ad-btn--gold" : ""}`}
            onClick={() => setExtrasOpen(true)}
          >
            Más opciones
            {hasExtras ? " · ✓" : ""}
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            disabled={!canSell || !cart.length}
            onClick={() => {
              setCobroOpen(true);
              if (!payAmount && netUsd > 0) {
                setPayAmount(String(Math.max(0, netUsd - paidUsd).toFixed(2)));
              }
            }}
          >
            Cobrar
          </button>
        </div>
      </div>

      {extrasOpen ? (
        <div
          className="ad-modal-backdrop"
          role="presentation"
          onClick={() => setExtrasOpen(false)}
        >
          <div
            className="ad-modal space-y-3"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ad-pos-extras-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="ad-pos-extras-title" className="ad-panel-title">
              Opciones de la venta
            </h3>
            <p className="text-sm text-[var(--ad-muted)]">
              Todo es opcional. Puede agregar productos y cobrar sin completar
              esto.
            </p>
            {usesMesas ? (
              <>
                <label className="ad-pos__field">
                  <span>Mesa / espacio (bodegón)</span>
                  <select
                    className="ad-select"
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                  >
                    <option value="">Venta directa</option>
                    {posTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code ?? `Mesa ${t.number}`} ({t.status})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ad-pos__field">
                  <span>Mesonera</span>
                  <select
                    className="ad-select"
                    value={mesoneraId}
                    onChange={(e) => setMesoneraId(e.target.value)}
                  >
                    <option value="">Sin mesonera</option>
                    {floorUsers
                      .filter((m) => m.role === "mesonera")
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            ) : (
              <p className="text-sm text-[var(--ad-muted)]">
                En licorería no se usan mesas; venta directa en mostrador.
              </p>
            )}
            <label className="ad-pos__field">
              <span>Cliente</span>
              <select
                className="ad-select"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Cliente general</option>
                {customers
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </option>
                  ))}
              </select>
            </label>
            <label className="ad-pos__field">
              <span>Notas</span>
              <textarea
                className="ad-input min-h-16"
                placeholder="Observaciones de la venta"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            {usesMesas && cart.length > 0 ? (
              <div className="rounded border border-[var(--ad-line)] p-3 space-y-2">
                <p className="text-sm text-[var(--ad-muted)]">
                  Opcional: dejar productos en cuenta de mesa sin cobrar ahora.
                </p>
                <button
                  type="button"
                  className="ad-btn ad-btn--primary w-full"
                  disabled={!canSell}
                  onClick={() => {
                    void leaveOpen();
                    setExtrasOpen(false);
                  }}
                >
                  Abrir cuenta en mesa
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="ad-btn ad-btn--gold w-full"
              onClick={() => setExtrasOpen(false)}
            >
              Listo
            </button>
          </div>
        </div>
      ) : null}

      {cobroOpen ? (
        <div
          className="ad-modal-backdrop"
          role="presentation"
          onClick={() => setCobroOpen(false)}
        >
          <div
            className="ad-modal ad-modal--wide space-y-3"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ad-pos-cobro-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="ad-pos-cobro-title" className="ad-panel-title">
              Cobro
            </h3>
            <div className="ad-pos__total-card">
              <p className="ad-eyebrow">Total a cobrar</p>
              <p className="ad-display text-4xl text-[var(--ad-gold-soft)]">
                ${netUsd.toFixed(2)}
              </p>
              <p className="text-sm text-[var(--ad-muted)]">
                Bs {Math.max(0, totalBs).toLocaleString("es-VE")}
                {discountUsd ? ` · desc. $${discountUsd.toFixed(2)}` : ""}
              </p>
              <div className="ad-pos__pay-status">
                <span>Pagado ${paidUsd.toFixed(2)}</span>
                <span>Resta ${Math.max(0, netUsd - paidUsd).toFixed(2)}</span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="ad-pos__field">
                <span>Descuento USD</span>
                <input
                  className="ad-input"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={discountUsd || ""}
                  onChange={(e) =>
                    setDiscountUsd(Number(e.target.value) || 0)
                  }
                />
              </label>
              <label className="ad-pos__field">
                <span>Autorización</span>
                <input
                  className="ad-input"
                  placeholder="Si aplica descuento"
                  value={discountAuth}
                  onChange={(e) => setDiscountAuth(e.target.value)}
                />
              </label>
            </div>

            <label className="ad-pos__field">
              <span>Método de pago</span>
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
            </label>
            <label className="ad-pos__field">
              <span>Monto {methodCfg?.currency ?? ""}</span>
              <input
                className="ad-input"
                placeholder="0.00"
                inputMode="decimal"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </label>
            {methodCfg?.requiresBank ? (
              <label className="ad-pos__field">
                <span>Banco</span>
                <input
                  className="ad-input"
                  value={payBank}
                  onChange={(e) => setPayBank(e.target.value)}
                />
              </label>
            ) : null}
            {methodCfg?.requiresReference ? (
              <label className="ad-pos__field">
                <span>Referencia</span>
                <input
                  className="ad-input"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </label>
            ) : null}
            {payMethod === "pago_movil" ? (
              <label className="ad-pos__field">
                <span>Teléfono origen</span>
                <input
                  className="ad-input"
                  value={payOrigin}
                  onChange={(e) => setPayOrigin(e.target.value)}
                  inputMode="tel"
                />
              </label>
            ) : null}
            <button
              type="button"
              className="ad-btn ad-btn--touch"
              onClick={addPayment}
            >
              Añadir pago
            </button>
            <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
              {payments.map((p, i) => (
                <li
                  key={`${p.method}-${i}`}
                  className="flex justify-between gap-2"
                >
                  <span>
                    {p.method} · {p.currency} {p.amount}
                    {p.reference ? ` · ${p.reference}` : ""}
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

            <div className="ad-pos__actions">
              <button
                type="button"
                className="ad-btn ad-btn--gold ad-btn--touch"
                onClick={() => void openPrelim()}
                disabled={!canSell || !cart.length}
              >
                Facturar
              </button>
              <button
                type="button"
                className="ad-btn ad-btn--touch"
                onClick={() => void toPrepaid()}
                disabled={!canSell || !cart.length}
              >
                Prepago + QR
              </button>
              <button
                type="button"
                className="ad-btn ad-btn--touch"
                onClick={() => setCobroOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {draft ? (
        <div className="ad-modal-backdrop">
          <div className="ad-modal ad-modal--wide">
            <AdPreliminarDocument
              draft={draft}
              productName={(id) =>
                products.find((p) => p.id === id)?.name ?? id
              }
              presentationName={(id) =>
                presentations.find((p) => p.id === id)?.name ?? id
              }
              warehouseName={warehouseLabel(draft.warehouseId, warehouses)}
              onBack={() => {
                void (async () => {
                  await resolveAdResult(
                    cancelInvoiceDraft({
                      draftId: draft.id,
                      userName: cashier?.name ?? "Cajero",
                    }),
                  );
                  setDraft(null);
                })();
              }}
              onConfirm={() =>
                void confirmDraft(
                  draft.supplyAlerts.some((a) => a.shortfall > 0),
                )
              }
              confirmDisabled={
                draft.supplyAlerts.some((a) => a.shortfall > 0) &&
                !canShortageOverride
              }
              confirmLabel={
                draft.supplyAlerts.some((a) => a.shortfall > 0)
                  ? "Continuar con faltante"
                  : "Confirmar factura"
              }
              footerExtra={
                draft.supplyAlerts.some((a) => a.shortfall > 0) ? (
                  <div className="ad-cop__alert space-y-3">
                    <p className="text-sm font-medium text-[var(--ad-gold-soft)]">
                      La operación supera la disponibilidad operativa.
                    </p>
                    {canShortageOverride ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          className="ad-select"
                          value={shortageReason}
                          onChange={(e) => setShortageReason(e.target.value)}
                        >
                          <option value="">Motivo de sobregiro…</option>
                          {(
                            Object.keys(
                              AD_SHORTAGE_REASON_LABELS,
                            ) as AdShortageOverrideReason[]
                          ).map((k) => (
                            <option key={k} value={k}>
                              {AD_SHORTAGE_REASON_LABELS[k]}
                            </option>
                          ))}
                        </select>
                        <input
                          className="ad-input"
                          placeholder={
                            shortageReason === "otro"
                              ? "Detalle obligatorio"
                              : "Nota (opcional)"
                          }
                          value={shortageNote}
                          onChange={(e) => setShortageNote(e.target.value)}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--ad-muted)]">
                        Sin permiso <code>pos.shortage_override</code>.
                      </p>
                    )}
                  </div>
                ) : null
              }
            />
          </div>
        </div>
      ) : null}

      {packPick ? (
        <AdPackPickPrompt
          productName={
            products.find((p) => p.id === packPick.productId)?.name ?? "Producto"
          }
          unitPrice={
            findUnitAndBox(getPresentationsFor(packPick.productId)).unit?.price
          }
          boxPrice={
            findUnitAndBox(getPresentationsFor(packPick.productId)).box?.price
          }
          boxUnits={
            findUnitAndBox(getPresentationsFor(packPick.productId)).box
              ?.unitsPerPresentation
          }
          onPick={applyPackPick}
          onCancel={() => setPackPick(null)}
        />
      ) : null}
    </div>
  );
}

