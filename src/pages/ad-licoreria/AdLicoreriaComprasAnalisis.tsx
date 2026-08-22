import { useEffect, useMemo, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";

type Suggestion = {
  productId: string;
  productName: string;
  brand?: string | null;
  presentationId?: string | null;
  avgDaily: number;
  stockPhysical?: number;
  stockCommitted?: number;
  stockAvailable: number;
  inTransitQtyBase?: number;
  suggestedQtyBase: number;
  needQtyBase: number;
  estimatedCoverageDays: number;
};

type AnalysisRow = {
  productId: string;
  productName: string;
  brand?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  qtyBase: number;
  avgUnitCost: number;
  frequency: number;
  lastAt: string;
  lastUnitCost: number;
};

type LineEdit = Suggestion & { qtyBase: number; selected: boolean };

/**
 * Fase 9 — Análisis de compras + sugerencia “mercancía para X días” + OC preliminar.
 */
export default function AdLicoreriaComprasAnalisis() {
  const { hasPermission, warehouses } = useAdLicoreria();
  const [coverageDays, setCoverageDays] = useState(7);
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisRow[]>([]);
  const [lines, setLines] = useState<LineEdit[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const api = isAdApiDataSource();

  useEffect(() => {
    if (!api) return;
    void adCommerceClient.listSuppliers().then((r) => {
      if (r.ok) setSuppliers(r.data);
    });
  }, [api]);

  const filteredAnalysis = useMemo(() => {
    if (!supplierId) return analysis;
    return analysis.filter((a) => a.supplierId === supplierId);
  }, [analysis, supplierId]);

  async function load() {
    if (!hasPermission("purchase-analysis.view")) {
      setMsg("Sin permiso purchase-analysis.view");
      return;
    }
    if (!api) {
      setMsg("Modo MOCK: use VITE_AD_DATA_SOURCE=api para análisis real.");
      return;
    }
    setLoading(true);
    const a = await adCommerceClient.analysis(
      supplierId ? `?supplierId=${supplierId}` : "",
    );
    const s = await adCommerceClient.replenishment(coverageDays);
    setLoading(false);
    if (!a.ok) {
      setMsg(a.error);
      return;
    }
    if (!s.ok) {
      setMsg(s.error);
      return;
    }
    setAnalysis(a.data as AnalysisRow[]);
    const sug = (s.data as Suggestion[]).map((row) => ({
      ...row,
      qtyBase: Math.ceil(Number(row.suggestedQtyBase) || 0),
      selected: Number(row.suggestedQtyBase) > 0,
    }));
    setLines(sug);
    setMsg(`Cobertura ${coverageDays} días · ${sug.length} productos`);
  }

  async function createPo(preliminary: boolean) {
    if (!hasPermission("purchase-orders.create")) {
      setMsg("Sin permiso purchase-orders.create");
      return;
    }
    const selected = lines.filter((l) => l.selected && l.qtyBase > 0);
    if (!selected.length) {
      setMsg("Seleccione al menos un producto con cantidad > 0");
      return;
    }
    const r = await adCommerceClient.createPurchaseOrder({
      coverageDays,
      supplierId: supplierId || undefined,
      warehouseId: warehouses[0]?.id,
      preliminary,
      lines: selected.map((l) => ({
        productId: l.productId,
        presentationId: l.presentationId ?? undefined,
        suggestedQtyBase: l.suggestedQtyBase,
        qtyBase: l.qtyBase,
      })),
    });
    setMsg(
      r.ok
        ? `OC ${(r.data as { documentNumber: string; status: string }).documentNumber} · ${(r.data as { status: string }).status}`
        : r.error,
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Análisis de compras</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Sugerencias por ventas históricas y disponibilidad operativa. Indique
          cuántos días de mercancía necesita; no usa stock mínimo fijo.
        </p>
      </header>

      <section className="ad-panel flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Necesito mercancía para (días)
          <input
            className="ad-input mt-1 block w-28"
            type="number"
            min={1}
            value={coverageDays}
            onChange={(e) => setCoverageDays(Number(e.target.value) || 1)}
          />
        </label>
        <label className="text-sm">
          Proveedor
          <select
            className="ad-select mt-1 block min-w-[12rem]"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Todos</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ad-btn" disabled={loading} onClick={() => void load()}>
          Calcular
        </button>
        <button
          type="button"
          className="ad-btn"
          onClick={() => void createPo(true)}
        >
          Generar OC preliminar
        </button>
        <button
          type="button"
          className="ad-btn"
          onClick={() => void createPo(false)}
        >
          Confirmar OC
        </button>
      </section>

      {msg ? <p className="text-sm">{msg}</p> : null}

      <section className="ad-panel overflow-x-auto">
        <h2 className="mb-2 font-medium">Sugerencias editables</h2>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[var(--ad-muted)]">
              <th className="p-1" />
              <th className="p-1">Producto</th>
              <th className="p-1">Avg/día</th>
              <th className="p-1">Físico</th>
              <th className="p-1">Disp.</th>
              <th className="p-1">Tránsito</th>
              <th className="p-1">Sugerido</th>
              <th className="p-1">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={l.productId} className="border-t border-white/10">
                <td className="p-1">
                  <input
                    type="checkbox"
                    checked={l.selected}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...l, selected: e.target.checked };
                      setLines(next);
                    }}
                  />
                </td>
                <td className="p-1">
                  {l.productName}
                  {l.brand ? (
                    <span className="text-[var(--ad-muted)]"> · {l.brand}</span>
                  ) : null}
                </td>
                <td className="p-1 tabular-nums">{l.avgDaily.toFixed(2)}</td>
                <td className="p-1 tabular-nums">{l.stockPhysical ?? "—"}</td>
                <td className="p-1 tabular-nums">{l.stockAvailable.toFixed(0)}</td>
                <td className="p-1 tabular-nums">{l.inTransitQtyBase ?? 0}</td>
                <td className="p-1 tabular-nums">{l.suggestedQtyBase.toFixed(0)}</td>
                <td className="p-1">
                  <input
                    className="ad-input w-20"
                    type="number"
                    min={0}
                    value={l.qtyBase}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = {
                        ...l,
                        qtyBase: Number(e.target.value) || 0,
                        selected: true,
                      };
                      setLines(next);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ad-panel overflow-x-auto">
        <h2 className="mb-2 font-medium">Historial por proveedor / producto</h2>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[var(--ad-muted)]">
              <th className="p-1">Proveedor</th>
              <th className="p-1">Producto</th>
              <th className="p-1">Qty</th>
              <th className="p-1">Costo prom.</th>
              <th className="p-1">Último</th>
              <th className="p-1">Frecuencia</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnalysis.map((a) => (
              <tr
                key={`${a.productId}-${a.supplierId}`}
                className="border-t border-white/10"
              >
                <td className="p-1">{a.supplierName ?? "—"}</td>
                <td className="p-1">{a.productName}</td>
                <td className="p-1 tabular-nums">{a.qtyBase.toFixed(0)}</td>
                <td className="p-1 tabular-nums">${a.avgUnitCost.toFixed(4)}</td>
                <td className="p-1 tabular-nums">${a.lastUnitCost.toFixed(4)}</td>
                <td className="p-1 tabular-nums">{a.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
