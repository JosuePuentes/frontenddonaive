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
  const [msg, setMsg] = useState("");

  const byMethod = useMemo(() => {
    const map: Record<string, { usd: number; bs: number }> = {};
    for (const sale of sales) {
      for (const pay of sale.payments) {
        const cur = map[pay.method] ?? { usd: 0, bs: 0 };
        if (pay.currency === "USD") cur.usd += pay.amount;
        else cur.bs += pay.amount;
        map[pay.method] = cur;
      }
    }
    return map;
  }, [sales]);

  function runDaily() {
    const r = createDailyClosure("Admin A&D");
    setMsg(r.ok ? `Cierre diario ${r.data.date} guardado` : r.error);
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
        Cierre diario de caja/ventas y cierre de inventario teórico vs físico.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Cierre diario</h2>
          <div className="ad-grid-stats">
            <div className="ad-stat">
              <div className="ad-stat__value">
                ${sales.reduce((a, s) => a + s.total.usd, 0).toFixed(0)}
              </div>
              <div className="ad-stat__label">Total USD</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">
                {sales.reduce((a, s) => a + s.total.bs, 0).toLocaleString("es-VE")}
              </div>
              <div className="ad-stat__label">Total Bs</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">{sales.length}</div>
              <div className="ad-stat__label">Ventas</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">
                {
                  accounts.filter(
                    (a) => a.status === "ABIERTA" || a.status === "PREPAGADA",
                  ).length
                }
              </div>
              <div className="ad-stat__label">Cuentas abiertas</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat__value">
                {accounts.filter((a) => a.status === "CERRADA").length}
              </div>
              <div className="ad-stat__label">Cuentas cerradas</div>
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
          <button type="button" className="ad-btn ad-btn--gold" onClick={runDaily}>
            Generar cierre diario
          </button>
          <ul className="text-xs text-[var(--ad-muted)]">
            {dailyClosures.slice(0, 3).map((c) => (
              <li key={c.id}>
                {c.date} · ${c.totalUsd.toFixed(2)} · {c.createdBy}
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
          <button type="button" className="ad-btn ad-btn--primary" onClick={runInventory}>
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
