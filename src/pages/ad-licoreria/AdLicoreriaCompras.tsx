import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

/**
 * Compras profesionales F5 — preliminar → confirmar.
 * Requiere modo API + JWT para persistencia completa.
 */
export default function AdLicoreriaCompras() {
  const { products, getPresentationsFor, warehouses, hasPermission } =
    useAdLicoreria();
  const [supplierName, setSupplierName] = useState("");
  const [invoice, setInvoice] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(20);
  const [qtyBonus, setQtyBonus] = useState(0);
  const [costMode, setCostMode] = useState<"UNIT" | "PRESENTATION" | "TOTAL">(
    "PRESENTATION",
  );
  const [presentationCost, setPresentationCost] = useState(22.9);
  const [unitCost, setUnitCost] = useState(0.6361);
  const [lineTotal, setLineTotal] = useState(458);
  const [credit, setCredit] = useState(false);
  const [creditDays, setCreditDays] = useState(15);
  const [preliminary, setPreliminary] = useState(true);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  const presentations = getPresentationsFor(productId);
  const pres = presentations[0];
  const upp = pres?.unitsPerPresentation ?? 1;

  const calc = useMemo(() => {
    if (costMode === "UNIT") {
      return {
        unit: unitCost,
        box: unitCost * upp,
        total: unitCost * upp * qty,
      };
    }
    if (costMode === "PRESENTATION") {
      return {
        unit: presentationCost / upp,
        box: presentationCost,
        total: presentationCost * qty,
      };
    }
    return {
      unit: lineTotal / (qty * upp),
      box: lineTotal / qty,
      total: lineTotal,
    };
  }, [costMode, unitCost, presentationCost, lineTotal, qty, upp]);

  async function submit() {
    if (!hasPermission("purchases.create") && !hasPermission("purchase.create")) {
      setMsg("Sin permiso de compras");
      return;
    }
    if (!pres) {
      setMsg("Seleccione presentación");
      return;
    }
    const body = {
      warehouseId,
      supplierName: supplierName || "Proveedor",
      invoiceNumber: invoice || `TMP-${Date.now()}`,
      currency: "USD",
      paymentCondition: credit ? "CREDITO" : "CONTADO",
      creditDays: credit ? creditDays : 0,
      preliminary,
      lines: [
        {
          presentationId: pres.id,
          qty,
          qtyBonus,
          costMode,
          unitCostUsd: unitCost,
          presentationCostUsd: presentationCost,
          lineTotalUsd: lineTotal,
        },
      ],
    };
    const r = await adCommerceClient.createPurchase(body);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setPreview(r.data as Record<string, unknown>);
    setMsg(preliminary ? "Preliminar guardado" : "Compra confirmada");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ad-ink)]">Compras</h1>
          <p className="text-sm text-[var(--ad-muted)]">
            Multi-producto, bonificación, costo unitario/caja/total y cuentas por
            pagar.
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.proveedores}>
            Proveedores
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.comprasAnalisis}>
            Análisis
          </Link>
        </div>
      </div>

      <section className="ad-panel grid gap-2 sm:grid-cols-3">
        <input
          className="ad-input"
          placeholder="Proveedor"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Factura"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
        />
        <select
          className="ad-input"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select
          className="ad-input"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          className="ad-input"
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          placeholder="Cant. facturada"
        />
        <input
          className="ad-input"
          type="number"
          value={qtyBonus}
          onChange={(e) => setQtyBonus(Number(e.target.value))}
          placeholder="Bonificación"
        />
        <select
          className="ad-input"
          value={costMode}
          onChange={(e) =>
            setCostMode(e.target.value as "UNIT" | "PRESENTATION" | "TOTAL")
          }
        >
          <option value="UNIT">Costo unitario</option>
          <option value="PRESENTATION">Costo por caja</option>
          <option value="TOTAL">Costo total</option>
        </select>
        {costMode === "UNIT" && (
          <input
            className="ad-input"
            type="number"
            step="0.0001"
            value={unitCost}
            onChange={(e) => setUnitCost(Number(e.target.value))}
          />
        )}
        {costMode === "PRESENTATION" && (
          <input
            className="ad-input"
            type="number"
            step="0.01"
            value={presentationCost}
            onChange={(e) => setPresentationCost(Number(e.target.value))}
          />
        )}
        {costMode === "TOTAL" && (
          <input
            className="ad-input"
            type="number"
            step="0.01"
            value={lineTotal}
            onChange={(e) => setLineTotal(Number(e.target.value))}
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={credit}
            onChange={(e) => setCredit(e.target.checked)}
          />
          Crédito
        </label>
        {credit && (
          <input
            className="ad-input"
            type="number"
            value={creditDays}
            onChange={(e) => setCreditDays(Number(e.target.value))}
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={preliminary}
            onChange={(e) => setPreliminary(e.target.checked)}
          />
          Preliminar
        </label>
      </section>

      <section className="ad-panel text-sm">
        <p>
          Costo unidad: <strong>${calc.unit.toFixed(4)}</strong> · Caja:{" "}
          <strong>${calc.box.toFixed(2)}</strong> · Total factura:{" "}
          <strong>${calc.total.toFixed(2)}</strong>
        </p>
        <p className="text-[var(--ad-muted)]">
          Recibido: {qty + qtyBonus} · Costo efectivo/caja ≈ $
          {(calc.total / Math.max(1, qty + qtyBonus)).toFixed(4)}
        </p>
        <button type="button" className="ad-btn mt-2" onClick={() => void submit()}>
          {preliminary ? "Guardar preliminar" : "Confirmar compra"}
        </button>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </section>

      {preview && (
        <pre className="ad-panel overflow-auto text-xs">
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}
    </div>
  );
}
