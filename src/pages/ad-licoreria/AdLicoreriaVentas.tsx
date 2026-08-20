import { useMemo, useState } from "react";
import {
  formatAdPrice,
  toBaseUnits,
} from "@/lib/ad-licoreria/conversions";
import { findUnitAndBox } from "@/lib/ad-licoreria/pack";
import {
  warehouseLabel,
} from "@/lib/ad-licoreria/warehouses";
import { AD_SHORTAGE_REASON_LABELS } from "@/types/ad-licoreria";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
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
    setCurrentOperator,
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
  const posCashiers = operators.filter(
    (o) =>
      o.active &&
      o.posEnabled !== false &&
      o.warehouseId &&
      (o.role === "cajero" || o.role === "mesonera"),
  );

  const cashierId = sessionUser?.warehouseId
    ? sessionUser.id
    : (currentOperatorId ?? "");
  const posWarehouseId = sessionUser?.warehouseId ?? "";
  const floorUsers = posWarehouseId
    ? getFloorOperatorsForWarehouse(posWarehouseId)
    : [];

  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(1);
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
  const [posStep, setPosStep] = useState<"productos" | "cliente" | "cobro">(
    "productos",
  );

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
  const pack = findUnitAndBox(availablePres);
  const needsPackPick = Boolean(pack.unit && pack.box);
  const activePres =
    presentations.find((p) => p.id === presentationId) ??
    (needsPackPick ? undefined : availablePres[0]);
  const cashier = operators.find((o) => o.id === cashierId) ?? sessionUser;
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
    Boolean(cashier?.warehouseId) &&
    cashier?.posEnabled !== false &&
    hasPermission("pos.sell", cashier?.id);

  const qtyAvail = useMemo(() => {
    if (!activePres || qty <= 0 || !posWarehouseId) return null;
    const requestedBase = toBaseUnits(activePres, qty);
    return getOperationalAvailability(
      productId,
      requestedBase,
      posWarehouseId,
    );
  }, [
    activePres,
    qty,
    productId,
    getOperationalAvailability,
    posWarehouseId,
  ]);

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
    setPosStep("productos");
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
    setMsg(
      `Prepago ${result.data.code} · Recibo ${result.data.receiptNumber} · QR listo`,
    );
  }

  const qtyShortfall = qtyAvail
    ? Math.max(0, qtyAvail.requestedBase - qtyAvail.availableOperationalTotal)
    : 0;

  return (
    <div className="ad-pos">
      <header className="ad-pos__header">
        <div>
          <p className="ad-eyebrow">Punto de venta</p>
          <h2 className="ad-panel-title">Cobrar rápido</h2>
          <p className="text-sm text-[var(--ad-muted)]">
            {posWarehouseId
              ? `Depósito: ${warehouseLabel(posWarehouseId, warehouses)}`
              : "Seleccione un usuario POS con depósito"}
            {cashier ? ` · ${cashier.name}` : ""}
          </p>
        </div>
        {!canSell ? (
          <p className="text-sm text-[var(--ad-danger)]">
            Sin permiso POS o sin depósito asignado.
          </p>
        ) : null}
      </header>

      <nav className="ad-pos__steps" aria-label="Pasos de venta">
        {(
          [
            ["productos", "1", "Productos"],
            ["cliente", "2", "Cliente"],
            ["cobro", "3", "Cobro"],
          ] as const
        ).map(([k, n, label]) => {
          const locked = k !== "productos" && cart.length === 0;
          return (
            <button
              key={k}
              type="button"
              className={`ad-pos__step ${posStep === k ? "is-active" : ""} ${
                k === "cliente" && cart.length ? "has-data" : ""
              } ${k === "cobro" && cart.length ? "has-data" : ""}`}
              disabled={locked}
              onClick={() => setPosStep(k)}
            >
              <span className="ad-pos__step-num">{n}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <p className="ad-pos__hint">
        {posStep === "productos"
          ? "1) Elija producto → presentación → cantidad → Agregar"
          : posStep === "cliente"
            ? "2) Opcional: mesa, mesonera o cliente. Luego Cobro."
            : "3) Añada el pago y pulse Facturar."}
      </p>

      {!sessionUser?.warehouseId ? (
        <section className="ad-panel space-y-2">
          <p className="text-sm text-[var(--ad-muted)]">Usuario de caja</p>
          <select
            className="ad-select"
            value={cashier?.id ?? ""}
            onChange={(e) => {
              const r = setCurrentOperator(e.target.value || null);
              setCart([]);
              setPayments([]);
              setDraft(null);
              setMsg(
                r.ok
                  ? r.data
                    ? `Sesión POS: ${r.data.name}`
                    : "Sin sesión"
                  : r.error,
              );
            }}
          >
            <option value="">Seleccione usuario POS</option>
            {posCashiers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {warehouseLabel(m.warehouseId ?? "", warehouses)}
              </option>
            ))}
          </select>
        </section>
      ) : null}

      {posStep === "productos" ? (
        <section className="ad-panel ad-pos__panel space-y-3">
          <h3 className="ad-pos__section-title">Buscar y agregar</h3>
          <input
            className="ad-input ad-pos__search"
            placeholder="Buscar nombre, marca o código…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="search"
            autoComplete="off"
          />

          <div className="ad-pos__products">
            {filteredProducts.slice(0, 24).map((p) => (
              <button
                key={p.id}
                type="button"
                className={`ad-pos__product ${productId === p.id ? "is-active" : ""}`}
                onClick={() => {
                  setProductId(p.id);
                  setPresentationId("");
                }}
              >
                <strong>{p.name}</strong>
                <span>
                  {p.brand} · {p.sku}
                </span>
              </button>
            ))}
            {!filteredProducts.length ? (
              <p className="text-sm text-[var(--ad-muted)]">Sin productos</p>
            ) : null}
          </div>

          <div className="ad-pos__add-row">
            {needsPackPick ? (
              <div className="grid w-full grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`ad-btn ${pack.unit && presentationId === pack.unit.id ? "ad-btn--gold" : ""}`}
                  onClick={() => pack.unit && setPresentationId(pack.unit.id)}
                >
                  Unidad
                  {pack.unit ? ` · ${formatAdPrice(pack.unit.price)}` : ""}
                </button>
                <button
                  type="button"
                  className={`ad-btn ${pack.box && presentationId === pack.box.id ? "ad-btn--gold" : ""}`}
                  onClick={() => pack.box && setPresentationId(pack.box.id)}
                >
                  Caja x{pack.box?.unitsPerPresentation}
                  {pack.box ? ` · ${formatAdPrice(pack.box.price)}` : ""}
                </button>
              </div>
            ) : (
              <label className="ad-pos__field">
                <span>Presentación</span>
                <select
                  className="ad-select"
                  value={activePres?.id ?? ""}
                  onChange={(e) => setPresentationId(e.target.value)}
                >
                  {availablePres.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {formatAdPrice(p.price)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!activePres && needsPackPick ? (
              <p className="w-full text-sm text-[var(--ad-gold-soft)]">
                ¿Cómo vende: por unidad o por caja?
              </p>
            ) : null}
            <label className="ad-pos__field ad-pos__field--qty">
              <span>Cantidad</span>
              <input
                className="ad-input"
                type="number"
                min={1}
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              className="ad-btn ad-btn--gold ad-pos__add-btn"
              onClick={addLine}
              disabled={!canSell || !activePres}
            >
              + Agregar
            </button>
          </div>

          {qtyAvail ? (
            <p className="text-xs text-[var(--ad-muted)]">
              Disponible: {qtyAvail.availableOperationalTotal}
              {qtyShortfall > 0 ? ` · Faltan ${qtyShortfall}` : " · OK"}
            </p>
          ) : null}

          <h3 className="ad-pos__section-title">
            Carrito ({cart.length})
          </h3>
          <div className="ad-pos__cart">
            {cart.map((l, i) => {
              const prod = products.find((p) => p.id === l.productId);
              const pres = presentations.find((p) => p.id === l.presentationId);
              const alert = cartAlerts[i];
              const lineUsd = l.unitPrice.usd * l.qty;
              return (
                <article key={`${l.presentationId}-${i}`} className="ad-pos__cart-item">
                  <div className="ad-pos__cart-main">
                    <strong>{prod?.name ?? "Producto"}</strong>
                    <span className="text-[var(--ad-muted)]">
                      {pres?.name} · ${l.unitPrice.usd.toFixed(2)} c/u
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
                    <strong className="ad-pos__line-total">
                      ${lineUsd.toFixed(2)}
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
      ) : null}

      {posStep === "cliente" ? (
        <section className="ad-panel ad-pos__panel space-y-3">
          <h3 className="ad-pos__section-title">Cliente y mesa</h3>
          <p className="text-sm text-[var(--ad-muted)]">
            Opcional: asocie mesa, mesonera o cliente antes de cobrar.
          </p>
          <label className="ad-pos__field">
            <span>Mesa / espacio</span>
            <select
              className="ad-select"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            >
              <option value="">Sin mesa (venta directa)</option>
              {tables
                .filter(
                  (t) =>
                    t.active &&
                    (!posWarehouseId ||
                      !t.warehouseId ||
                      t.warehouseId === posWarehouseId),
                )
                .map((t) => (
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
        </section>
      ) : null}

      {posStep === "cobro" ? (
        <section className="ad-panel ad-pos__panel space-y-3">
          <h3 className="ad-pos__section-title">Cobro</h3>
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
              <span>
                Resta ${Math.max(0, netUsd - paidUsd).toFixed(2)}
              </span>
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
                onChange={(e) => setDiscountUsd(Number(e.target.value) || 0)}
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
          <button type="button" className="ad-btn ad-btn--touch" onClick={addPayment}>
            Añadir pago
          </button>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {payments.map((p, i) => (
              <li key={`${p.method}-${i}`} className="flex justify-between gap-2">
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
              Facturar (preliminar)
            </button>
            <button
              type="button"
              className="ad-btn ad-btn--primary ad-btn--touch"
              onClick={() => void leaveOpen()}
              disabled={!canSell || !cart.length}
            >
              Abrir cuenta
            </button>
            <button
              type="button"
              className="ad-btn ad-btn--touch"
              onClick={() => void toPrepaid()}
              disabled={!canSell || !cart.length}
            >
              Prepago + QR
            </button>
          </div>
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
        </section>
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
            {mesonera ? ` · ${mesonera.name}` : ""}
          </p>
        </div>
        <div className="ad-pos__footer-actions">
          {posStep !== "productos" ? (
            <button
              type="button"
              className="ad-btn"
              onClick={() =>
                setPosStep(posStep === "cobro" ? "cliente" : "productos")
              }
            >
              Atrás
            </button>
          ) : null}
          {posStep === "productos" ? (
            <button
              type="button"
              className="ad-btn ad-btn--gold"
              disabled={!cart.length}
              onClick={() => setPosStep("cliente")}
            >
              Siguiente
            </button>
          ) : null}
          {posStep === "cliente" ? (
            <button
              type="button"
              className="ad-btn ad-btn--gold"
              disabled={!cart.length}
              onClick={() => setPosStep("cobro")}
            >
              Ir a cobro
            </button>
          ) : null}
          {posStep === "cobro" ? (
            <button
              type="button"
              className="ad-btn ad-btn--gold"
              disabled={!canSell || !cart.length}
              onClick={() => void openPrelim()}
            >
              Facturar
            </button>
          ) : null}
        </div>
      </div>

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
    </div>
  );
}

