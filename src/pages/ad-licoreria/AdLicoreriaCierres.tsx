import { useMemo, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCierres() {
  const {
    sales,
    accounts,
    prepaids,
    inventory,
    products,
    warehouses,
    dailyClosures,
    inventoryClosures,
    createDailyClosure,
    createInventoryClosure,
    getStock,
  } = useAdLicoreria();

  const [warehouseId, setWarehouseId] = useState("wh-1");
  const [physical, setPhysical] = useState<Record<string, number>>({});
  const [countedUsd, setCountedUsd] = useState(0);
  const [countedBs, setCountedBs] = useState(0);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const byMethod = useMemo(() => {
    const map: Record<string, { usd: number; bs: number }> = {};
    for (const sale of sales.filter((s) => s.status === "completed")) {
      for (const pay of sale.payments) {
        const cur = map[pay.method] ?? { usd: 0, bs: 0 };
        if (pay.currency === "USD") cur.usd += pay.amount;
        else cur.bs += pay.amount;
        map[pay.method] = cur;
      }
    }
    return map;
  }, [sales]);

  const expectedCash = useMemo(() => {
    let usd = 0;
    let bs = 0;
    for (const sale of sales.filter((s) => s.status === "completed")) {
      for (const pay of sale.payments) {
        if (pay.method === "efectivo_usd" && pay.currency === "USD") {
          usd += pay.amount;
        }
        if (pay.method === "efectivo_bs" && pay.currency === "BS") {
          bs += pay.amount;
        }
      }
    }
    return { usd, bs };
  }, [sales]);

  function runDaily() {
    const r = createDailyClosure({
      userName: "Admin A&D",
      countedCashUsd: countedUsd,
      countedCashBs: countedBs,
      notes: notes.trim() || undefined,
    });
    setMsg(
      r.ok
        ? `Cierre ${r.data.date}: dif USD ${r.data.cashDifferenceUsd} · dif Bs ${r.data.cashDifferenceBs}`
        : r.error,
    );
  }

  function runInventory() {
    const lines = products.map((p) => {
      const theoretical = getStock(p.id, warehouseId);
      const phys = physical[p.id] ?? theoretical;
      return {
        productId: p.id,
        warehouseId,
        theoreticalBase: theoretical,
        physicalBase: phys,
        differenceBase: phys - theoretical,
      };
    });
    const r = createInventoryClosure({
      lines,
      createdBy: "Inventario",
      warehouseId,
      applyAdjustments: true,
      notes: "Conteo físico",
    });
    setMsg(
      r.ok
        ? `Cierre inventario: ${lines.filter((l) => l.differenceBase !== 0).length} diferencias`
        : r.error,
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ad-muted)]">
        Cierre de caja (efectivo esperado vs contado) e inventario teórico vs
        físico. Los cierres no reescriben historial silenciosamente.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Cierre de caja</h2>
          <div className="ad-grid-stats">
            <div className="ad-stat">
              <div className="ad-stat__value">
                ${sales.filter((s) => s.status === "completed").reduce((a, s) => a + s.total.usd, 0).toFixed(0)}
              </div>
              <div className="ad-stat__label">Total vendido USD</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">
                {sales.filter((s) => s.status === "voided").length}
              </div>
              <div className="ad-stat__label">Anulaciones</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">${expectedCash.usd.toFixed(2)}</div>
              <div className="ad-stat__label">Efectivo USD esperado</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">
                {expectedCash.bs.toLocaleString("es-VE")}
              </div>
              <div className="ad-stat__label">Efectivo Bs esperado</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">
                {
                  accounts.filter(
                    (a) =>
                      a.status === "ABIERTA" ||
                      a.status === "PREPAGADA" ||
                      a.status === "PARCIALMENTE_PAGADA",
                  ).length
                }
              </div>
              <div className="ad-stat__label">Cuentas abiertas</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">
                {prepaids.filter((p) => p.status === "ACTIVO").length}
              </div>
              <div className="ad-stat__label">Prepagos activos</div>
            </div>
          </div>

          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {Object.entries(byMethod).map(([method, v]) => (
              <li key={method}>
                {method}: ${v.usd.toFixed(2)} · Bs {v.bs.toLocaleString("es-VE")}
              </li>
            ))}
            {!Object.keys(byMethod).length ? <li>Sin pagos aún</li> : null}
          </ul>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm text-[var(--ad-muted)]">
              Efectivo USD contado
              <input
                className="ad-input mt-1"
                type="number"
                value={countedUsd}
                onChange={(e) => setCountedUsd(Number(e.target.value))}
              />
            </label>
            <label className="text-sm text-[var(--ad-muted)]">
              Efectivo Bs contado
              <input
                className="ad-input mt-1"
                type="number"
                value={countedBs}
                onChange={(e) => setCountedBs(Number(e.target.value))}
              />
            </label>
          </div>
          <input
            className="ad-input"
            placeholder="Observaciones del cierre"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-xs text-[var(--ad-muted)]">
            Diferencia estimada: USD{" "}
            {(countedUsd - expectedCash.usd).toFixed(2)} · Bs{" "}
            {(countedBs - expectedCash.bs).toLocaleString("es-VE")}
          </p>
          <button type="button" className="ad-btn ad-btn--gold" onClick={runDaily}>
            Generar cierre diario
          </button>
          <ul className="text-xs text-[var(--ad-muted)]">
            {dailyClosures.slice(0, 5).map((c) => (
              <li key={c.id}>
                {c.date} · ${c.totalUsd.toFixed(2)} · dif USD{" "}
                {c.cashDifferenceUsd} · {c.createdBy}
              </li>
            ))}
          </ul>
        </section>

        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Cierre inventario</h2>
          <select
            className="ad-select"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <div className="ad-table-wrap max-h-72 overflow-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Teórico</th>
                  <th>Físico</th>
                  <th>Dif.</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const theoretical = getStock(p.id, warehouseId);
                  const phys = physical[p.id] ?? theoretical;
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{theoretical}</td>
                      <td>
                        <input
                          className="ad-input w-24"
                          type="number"
                          value={phys}
                          onChange={(e) =>
                            setPhysical((prev) => ({
                              ...prev,
                              [p.id]: Number(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td>{phys - theoretical}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="ad-btn ad-btn--primary"
            onClick={runInventory}
          >
            Guardar cierre e aplicar ajustes
          </button>
          <ul className="text-xs text-[var(--ad-muted)]">
            {inventoryClosures.slice(0, 3).map((c) => (
              <li key={c.id}>
                {new Date(c.createdAt).toLocaleString("es-VE")} ·{" "}
                {c.lines.filter((l) => l.differenceBase !== 0).length} dif. ·{" "}
                {c.createdBy}
              </li>
            ))}
          </ul>
          <p className="text-[0.65rem] text-[var(--ad-muted)]">
            Stock items cargados: {inventory.length}
          </p>
        </section>
      </div>
      {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
    </div>
  );
}
