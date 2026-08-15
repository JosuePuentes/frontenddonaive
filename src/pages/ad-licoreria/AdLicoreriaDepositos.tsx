import { useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type { AdInventoryMovementType } from "@/types/ad-licoreria";

const ADJUST_TYPES: AdInventoryMovementType[] = [
  "COMPRA",
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
  } = useAdLicoreria();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(10);
  const [fromId, setFromId] = useState("wh-1");
  const [toId, setToId] = useState("wh-2");
  const [adjustType, setAdjustType] =
    useState<AdInventoryMovementType>("COMPRA");
  const [adjustWh, setAdjustWh] = useState("wh-1");
  const [msg, setMsg] = useState("");

  const presentations = getPresentationsFor(productId);
  const pres =
    presentations.find((p) => p.id === presentationId) ?? presentations[0];

  function transfer() {
    if (!pres) return;
    const result = transferStock({
      productId,
      presentationId: pres.id,
      qtyPresentation: qty,
      fromId,
      toId,
      userName: "Admin A&D",
      reason: "Traslado entre depósitos",
    });
    setMsg(result.ok ? "Transferencia registrada" : result.error);
  }

  function adjust() {
    if (!pres && adjustType !== "INVENTARIO_INICIAL") {
      // still allow without presentation for unit-based
    }
    const result = registerMovement({
      type: adjustType,
      productId,
      presentationId: pres?.id,
      qtyPresentation: qty,
      warehouseId: adjustWh,
      userName: "Inventario",
      reason: `Movimiento ${adjustType}`,
    });
    setMsg(result.ok ? "Movimiento registrado" : result.error);
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Bodegón y Licorería con inventario independiente. Traslados y

        ajustes quedan en kardex con usuario y motivo.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Existencias</h2>
          {warehouses.map((w) => (
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
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    Desde {w.code}
                  </option>
                ))}
              </select>
              <select
                className="ad-select"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    Hacia {w.code}
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
            <h2 className="ad-panel-title">Entrada / ajuste</h2>
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
              {warehouses.map((w) => (
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
