import { useMemo, useState } from "react";
import {
  formatAdPrice,
  toBaseUnits,
} from "@/lib/ad-licoreria/conversions";
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
    getStock,
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
  const activePres =
    presentations.find((p) => p.id === presentationId) ?? availablePres[0];
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
  const paidBs = payments
    .filter((p) => p.currency === "BS")
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
          posWarehouseId || "wh-2",
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

  function setLinePrice(
    index: number,
    field: "usd" | "bs",
    value: number,
  ) {
    setCart((prev) =>
      prev.map((l, i) =>
        i !== index
          ? l
          : {
              ...l,
              unitPrice: {
                ...l.unitPrice,
                [field]: Number.isFinite(value) ? value : 0,
              },
            },
      ),
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

  function openPrelim() {
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
    const result = createInvoiceDraft({
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
    });
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

  function confirmDraft(continueWithShortage = false) {
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
    const result = confirmInvoiceDraft({
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
    });
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
  const licAv = qtyAvail?.byWarehouse.find(
    (w) => w.warehouseId === posWarehouseId,
  );
  const bodAv = qtyAvail?.byWarehouse.find(
    (w) => w.warehouseId !== posWarehouseId,
  );

  return (
    <div className="ad-pos space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["productos", "1 · Producto"],
            ["cliente", "2 · Cliente / mesa"],
            ["cobro", "3 · Cobro"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`ad-btn ad-btn--touch ${posStep === k ? "ad-btn--gold" : ""}`}
            onClick={() => setPosStep(k)}
          >
            {label}
          </button>
        ))}
      </div>
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className={`ad-panel space-y-3 ${posStep !== "productos" && posStep !== "cliente" ? "max-xl:hidden" : ""}`}>
        <h2 className="ad-panel-title">Punto de venta</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Flujo rápido: producto → cantidad → cliente/mesa → cobro → preliminar →
          confirmar. Depósito fijado por sesión.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                    ? `Sesión POS: ${r.data.name} · ${warehouseLabel(r.data.warehouseId ?? "", warehouses)}`
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
          <div className="ad-input flex items-center text-sm">
            Depósito asignado:{" "}
            <strong className="ml-1 text-[var(--ad-gold-soft)]">
              {posWarehouseId
                ? warehouseLabel(posWarehouseId, warehouses)
                : "—"}
            </strong>
          </div>
          <select
            className="ad-select"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
          >
            <option value="">Sin mesa</option>
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
          <select
            className="ad-select"
            value={mesoneraId}
            onChange={(e) => setMesoneraId(e.target.value)}
          >
            <option value="">Mesonera (piso)</option>
            {floorUsers
              .filter((m) => m.role === "mesonera")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
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
        {!canSell ? (
          <p className="text-sm text-[var(--ad-danger)]">
            Seleccione un cajero con depósito asignado y permiso POS. El
            depósito no se puede cambiar manualmente.
          </p>
        ) : null}

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

        {qtyAvail ? (
          <div className="ad-cop__alert text-sm">
            <p>
              Disponible operativo:{" "}
              <strong>{qtyAvail.availableOperationalTotal}</strong>
              {qtyShortfall > 0 ? (
                <>
                  {" "}
                  · Faltan: <strong>{qtyShortfall}</strong>
                </>
              ) : null}
            </p>
            {qtyShortfall > 0 ? (
              <>
                <p className="text-[var(--ad-gold-soft)]">
                  ⚠ Para cumplir completamente esta orden faltan {qtyShortfall}{" "}
                  unidades.
                </p>
                <p className="text-[var(--ad-muted)]">
              {warehouseLabel(posWarehouseId, warehouses)}:{" "}
              {licAv?.availableOperational ?? 0} · Otros depósitos:{" "}
              {bodAv?.availableOperational ?? 0} · Compra necesaria:{" "}
              {qtyAvail.plan.purchaseNeeded}
            </p>
              </>
            ) : null}
            <p className="text-xs text-[var(--ad-muted)]">
              Stock físico {warehouseLabel(posWarehouseId, warehouses)}:{" "}
              {getStock(productId, posWarehouseId)} u. base
              {activePres
                ? ` · línea = ${toBaseUnits(activePres, qty)} u. base`
                : null}
            </p>
          </div>
        ) : null}

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Presentación</th>
                <th>Cant.</th>
                <th>USD</th>
                <th>Bs</th>
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
                const alert = cartAlerts[i];
                return (
                  <tr key={`${l.presentationId}-${i}`}>
                    <td>
                      {prod?.name}
                      {alert && alert.shortfall > 0 ? (
                        <span className="mt-1 block text-xs text-[var(--ad-gold-soft)]">
                          Faltan {alert.shortfall} u.
                        </span>
                      ) : null}
                    </td>
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
                    <td>
                      <input
                        className="ad-input w-20"
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.unitPrice.usd}
                        onChange={(e) =>
                          setLinePrice(i, "usd", Number(e.target.value))
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="ad-input w-24"
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.unitPrice.bs}
                        onChange={(e) =>
                          setLinePrice(i, "bs", Number(e.target.value))
                        }
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
                  <td colSpan={8} className="text-[var(--ad-muted)]">
                    Carrito vacío · inventario se descuenta al servir/cobrar
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
          ${netUsd.toFixed(2)}
        </p>
        <p className="text-sm text-[var(--ad-muted)]">
          Bruto ${totalUsd.toFixed(2)} · Bs {totalBs.toLocaleString("es-VE")} ·
          pagado ${paidUsd.toFixed(2)} / Bs {paidBs.toLocaleString("es-VE")} ·
          saldo USD ${(netUsd - paidUsd).toFixed(2)}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="ad-input"
            type="number"
            min={0}
            step="0.01"
            placeholder="Descuento USD"
            value={discountUsd || ""}
            onChange={(e) => setDiscountUsd(Number(e.target.value) || 0)}
          />
          <input
            className="ad-input"
            placeholder="Autorización descuento"
            value={discountAuth}
            onChange={(e) => setDiscountAuth(e.target.value)}
          />
        </div>
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
            Añadir pago (parcial/mixto)
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
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={openPrelim}
          >
            Facturar (preliminar)
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
                cancelInvoiceDraft({
                  draftId: draft.id,
                  userName: cashier?.name ?? "Cajero",
                });
                setDraft(null);
              }}
              onConfirm={() =>
                confirmDraft(draft.supplyAlerts.some((a) => a.shortfall > 0))
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
                    {draft.supplyAlerts
                      .filter((a) => a.shortfall > 0)
                      .map((a) => {
                        const preferred = a.availability.byWarehouse.find(
                          (w) => w.warehouseId === draft.warehouseId,
                        );
                        return (
                          <div key={a.productId} className="text-sm">
                            <p>{a.productName}</p>
                            <ul className="mt-1 space-y-0.5 text-[var(--ad-muted)]">
                              <li>
                                Físico:{" "}
                                {preferred?.physical ??
                                  a.availability.physicalTotal}
                              </li>
                              <li>
                                Comprometido:{" "}
                                {preferred?.committedActive ??
                                  a.availability.committedActiveTotal}
                              </li>
                              <li>
                                Disponible:{" "}
                                {preferred?.availableOperational ??
                                  a.availability.availableOperationalTotal}
                              </li>
                              <li>Solicitado: {a.requestedBase}</li>
                              <li>Déficit: {a.shortfall}</li>
                            </ul>
                          </div>
                        );
                      })}
                    {canShortageOverride ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          className="ad-select"
                          value={shortageReason}
                          onChange={(e) => setShortageReason(e.target.value)}
                        >
                          <option value="">Motivo del override…</option>
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
    </div>
  );
}
