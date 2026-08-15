import { useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type { AdInventoryMovementType } from "@/types/ad-licoreria";

const ADJUST_TYPES: AdInventoryMovementType[] = [
  "AJUSTE_ENTRADA",
  "AJUSTE_SALIDA",
  "DEVOLUCION",
  "INVENTARIO_INICIAL",
];

export default function AdLicoreriaDepositos() {
  const {
    products,
    warehouses,
    getPresentationsFor,
    getStock,
    transferStock,
    registerMovement,
    createPurchase,
    hasPermission,
    canAccessWarehouse,
    getCurrentOperator,
  } = useAdLicoreria();
  const session = getCurrentOperator();
  const visibleWarehouses = warehouses.filter(
    (w) => w.active && canAccessWarehouse(w.id),
  );
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(10);
  const [fromId, setFromId] = useState(visibleWarehouses[0]?.id ?? "wh-1");
  const [toId, setToId] = useState(visibleWarehouses[1]?.id ?? "wh-2");
  const [adjustType, setAdjustType] =
    useState<AdInventoryMovementType>("AJUSTE_ENTRADA");
  const [adjustWh, setAdjustWh] = useState(visibleWarehouses[0]?.id ?? "wh-1");
  const [msg, setMsg] = useState("");

  const [buyWh, setBuyWh] = useState(visibleWarehouses[0]?.id ?? "wh-1");
  const [buyProductId, setBuyProductId] = useState(products[0]?.id ?? "");
  const [buyPresId, setBuyPresId] = useState("");
  const [buyQty, setBuyQty] = useState(12);
  const [buyCostUsd, setBuyCostUsd] = useState(0.4);
  const [buyCostBs, setBuyCostBs] = useState(148);
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const presentations = getPresentationsFor(productId);
  const pres =
    presentations.find((p) => p.id === presentationId) ?? presentations[0];
  const buyPresentations = getPresentationsFor(buyProductId);
  const buyPres =
    buyPresentations.find((p) => p.id === buyPresId) ?? buyPresentations[0];

  function transfer() {
    if (
      !hasPermission("inventory.transfer") &&
      !hasPermission("cop.transfer")
    ) {
      setMsg("Sin permiso para transferencias");
      return;
    }
    if (!pres) return;
    const result = transferStock({
      productId,
      presentationId: pres.id,
      qtyPresentation: qty,
      fromId,
      toId,
      userName: session?.name ?? "Admin A&D",
      reason: "Traslado entre depósitos",
    });
    setMsg(result.ok ? "Transferencia registrada" : result.error);
  }

  function adjust() {
    if (!hasPermission("inventory.adjust")) {
      setMsg("Sin permiso para ajustar inventario");
      return;
    }
    if (!canAccessWarehouse(adjustWh)) {
      setMsg("No puede ajustar inventario de otro depósito");
      return;
    }
    const result = registerMovement({
      type: adjustType,
      productId,
      presentationId: pres?.id,
      qtyPresentation: qty,
      warehouseId: adjustWh,
      userName: session?.name ?? "Inventario",
      reason: `Movimiento ${adjustType}`,
    });
    setMsg(result.ok ? "Movimiento registrado" : result.error);
  }

  function registerPurchase() {
    if (!hasPermission("purchase.create")) {
      setMsg("Sin permiso para crear compras");
      return;
    }
    if (!buyPres) {
      setMsg("Seleccione presentación");
      return;
    }
    if (!buyWh) {
      setMsg("Seleccione el depósito destino de la compra");
      return;
    }
    if (!supplier.trim() || !invoiceNumber.trim()) {
      setMsg("Proveedor y referencia de compra obligatorios");
      return;
    }
    const result = createPurchase({
      supplierName: supplier.trim(),
      invoiceNumber: invoiceNumber.trim(),
      date: new Date().toISOString().slice(0, 10),
      warehouseId: buyWh,
      items: [
        {
          productId: buyProductId,
          presentationId: buyPres.id,
          qty: buyQty,
          unitCostUsd: buyCostUsd,
          unitCostBs: buyCostBs,
        },
      ],
      userName: session?.name ?? "Inventario",
      notes: `Entrada a ${warehouses.find((w) => w.id === buyWh)?.name ?? buyWh}`,
    });
    setMsg(
      result.ok
        ? `Compra registrada → ${warehouses.find((w) => w.id === buyWh)?.name}`
        : result.error,
    );
    if (result.ok) {
      setSupplier("");
      setInvoiceNumber("");
    }
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Cada depósito mantiene inventario independiente. En compras debe elegir
        el depósito destino. Puede renombrar depósitos en Configuración.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Existencias</h2>
          {visibleWarehouses.map((w) => (
            <div key={w.id} className="border border-[var(--ad-line)] p-3">
              <p className="text-sm text-[var(--ad-gold-soft)]">
                {w.name} ({w.code})
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--ad-muted)]">
                {products.map((p) => (
                  <li key={p.id}>
                    {p.name}:{" "}
                    <strong className="text-[var(--ad-text)]">
                      {getStock(p.id, w.id)}
                    </strong>{" "}
                    {p.baseUnitLabel}s
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="space-y-4">
          <section className="ad-panel space-y-3">
            <h2 className="ad-panel-title">Compra → depósito destino</h2>
            <p className="text-sm text-[var(--ad-muted)]">
              Obligatoria la selección del depósito que recibe la mercancía.
            </p>
            <select
              className="ad-select"
              value={buyWh}
              onChange={(e) => setBuyWh(e.target.value)}
            >
              {visibleWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  Destino: {w.name} ({w.code})
                </option>
              ))}
            </select>
            <input
              className="ad-input"
              placeholder="Proveedor"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
            <input
              className="ad-input"
              placeholder="Nº factura / referencia"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <select
              className="ad-select"
              value={buyProductId}
              onChange={(e) => {
                setBuyProductId(e.target.value);
                setBuyPresId("");
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="ad-select"
              value={buyPres?.id ?? ""}
              onChange={(e) => setBuyPresId(e.target.value)}
            >
              {buyPresentations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <input
                className="ad-input"
                type="number"
                min={1}
                value={buyQty}
                onChange={(e) => setBuyQty(Number(e.target.value))}
                placeholder="Cant."
              />
              <input
                className="ad-input"
                type="number"
                min={0}
                step="0.01"
                value={buyCostUsd}
                onChange={(e) => setBuyCostUsd(Number(e.target.value))}
                placeholder="Costo USD"
              />
              <input
                className="ad-input"
                type="number"
                min={0}
                step="0.01"
                value={buyCostBs}
                onChange={(e) => setBuyCostBs(Number(e.target.value))}
                placeholder="Costo Bs"
              />
            </div>
            <button
              type="button"
              className="ad-btn ad-btn--gold w-full"
              onClick={registerPurchase}
            >
              Registrar compra en depósito
            </button>
          </section>

          <section className="ad-panel space-y-3">
            <h2 className="ad-panel-title">Traslado</h2>
            <select
              className="ad-select"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setPresentationId("");
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="ad-select"
              value={pres?.id ?? ""}
              onChange={(e) => setPresentationId(e.target.value)}
            >
              {presentations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unitsPerPresentation} u. base)
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
            <div className="grid grid-cols-2 gap-2">
              <select
                className="ad-select"
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
              >
                {visibleWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    Desde {w.name}
                  </option>
                ))}
              </select>
              <select
                className="ad-select"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                {visibleWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    Hacia {w.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="ad-btn ad-btn--gold w-full"
              onClick={transfer}
            >
              Transferir
            </button>
          </section>

          <section className="ad-panel space-y-3">
            <h2 className="ad-panel-title">Ajuste</h2>
            <select
              className="ad-select"
              value={adjustType}
              onChange={(e) =>
                setAdjustType(e.target.value as AdInventoryMovementType)
              }
            >
              {ADJUST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="ad-select"
              value={adjustWh}
              onChange={(e) => setAdjustWh(e.target.value)}
            >
              {visibleWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button type="button" className="ad-btn w-full" onClick={adjust}>
              Registrar movimiento
            </button>
          </section>
          {msg ? (
            <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
