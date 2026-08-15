import { useMemo, useState } from "react";
import { AD_ROLE_LABELS } from "@/lib/ad-licoreria/access";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";

export default function AdLicoreriaCierres() {
  const {
    sales,
    accounts,
    prepaids,
    products,
    warehouses,
    dailyClosures,
    inventoryClosures,
    createDailyClosure,
    createInventoryClosure,
    getStock,
    getCurrentOperator,
    hasPermission,
    canAccessWarehouse,
  } = useAdLicoreria();

  const session = getCurrentOperator();
  const [warehouseId, setWarehouseId] = useState(
    session?.warehouseId ?? warehouses[0]?.id ?? "wh-1",
  );
  const [physical, setPhysical] = useState<Record<string, number>>({});
  const [countedUsd, setCountedUsd] = useState(0);
  const [countedBs, setCountedBs] = useState(0);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const closureWarehouseId = session?.warehouseId ?? warehouseId;
  const canClose = hasPermission("closures.create");

  /** Mismo período que createDailyClosure: HOY + depósito (+ cajero si aplica). */
  const scopedSales = useMemo(() => {
    return sales.filter((s) => {
      if (s.createdAt.slice(0, 10) !== today) return false;
      if (s.status !== "completed") return false;
      if (closureWarehouseId && s.warehouseId !== closureWarehouseId) {
        return false;
      }
      if (
        session?.role === "cajero" &&
        session.id &&
        s.operatorId &&
        s.operatorId !== session.id
      ) {
        return false;
      }
      return true;
    });
  }, [sales, closureWarehouseId, session, today]);

  const voidedToday = useMemo(
    () =>
      sales.filter(
        (s) =>
          s.createdAt.slice(0, 10) === today &&
          s.status === "voided" &&
          (!closureWarehouseId || s.warehouseId === closureWarehouseId) &&
          (!(session?.role === "cajero" && session.id) ||
            s.operatorId === session.id),
      ),
    [sales, today, closureWarehouseId, session],
  );

  const byMethod = useMemo(() => {
    const map: Record<string, { usd: number; bs: number }> = {};
    for (const sale of scopedSales) {
      for (const pay of sale.payments) {
        const cur = map[pay.method] ?? { usd: 0, bs: 0 };
        if (pay.currency === "USD") cur.usd += pay.amount;
        else cur.bs += pay.amount;
        map[pay.method] = cur;
      }
    }
    return map;
  }, [scopedSales]);

  const expectedCash = useMemo(() => {
    let usd = 0;
    let bs = 0;
    for (const sale of scopedSales) {
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
  }, [scopedSales]);

  async function runDaily() {
    if (!canClose) {
      setMsg("Sin permiso para cierres de caja");
      return;
    }
    const r = await resolveAdResult(
      createDailyClosure({
        userName: session?.name ?? "Cajero",
        operatorId: session?.id,
        warehouseId: closureWarehouseId,
        countedCashUsd: countedUsd,
        countedCashBs: countedBs,
        notes: notes.trim() || undefined,
      }),
    );
    setMsg(
      r.ok
        ? `Cierre ${r.data.date} · ${warehouseLabel(closureWarehouseId, warehouses)} · dif USD ${r.data.cashDifferenceUsd} · dif Bs ${r.data.cashDifferenceBs}`
        : r.error,
    );
  }

  async function runInventory() {
    if (!hasPermission("inventory.adjust") && !hasPermission("inventory.read")) {
      setMsg("Sin permiso de inventario");
      return;
    }
    if (!canAccessWarehouse(warehouseId)) {
      setMsg("No puede cerrar inventario de otro depósito");
      return;
    }
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
    const r = await resolveAdResult(
      createInventoryClosure({
        lines,
        createdBy: session?.name ?? "Inventario",
        warehouseId,
        applyAdjustments: hasPermission("inventory.adjust"),
        notes: "Conteo físico",
      }),
    );
    setMsg(
      r.ok
        ? `Cierre inventario: ${lines.filter((l) => l.differenceBase !== 0).length} diferencias`
        : r.error,
    );
  }

  const visibleWarehouses = warehouses.filter(
    (w) => w.active && canAccessWarehouse(w.id),
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ad-muted)]">
        Cada cajero cierra su propia operación y depósito. No se mezclan cierres
        de depósitos distintos.
      </p>
      {session ? (
        <p className="text-sm text-[var(--ad-gold-soft)]">
          Sesión: {session.name} · {AD_ROLE_LABELS[session.role]}
          {session.warehouseId
            ? ` · ${warehouseLabel(session.warehouseId, warehouses)}`
            : " · Transversal"}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Cierre de caja</h2>
          <p className="text-sm text-[var(--ad-muted)]">
            Período: <strong className="text-[var(--ad-text)]">HOY ({today})</strong>
            {" · "}
            Depósito:{" "}
            <strong className="text-[var(--ad-text)]">
              {warehouseLabel(closureWarehouseId, warehouses)}
            </strong>
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="ad-panel !p-3">
              <p className="ad-eyebrow">Ventas del día</p>
              <p className="ad-display text-2xl">
                $
                {scopedSales
                  .reduce((a, s) => a + s.total.usd, 0)
                  .toFixed(0)}
              </p>
              <p className="text-xs text-[var(--ad-muted)]">
                {scopedSales.length} ventas · {voidedToday.length} anulaciones
              </p>
            </div>
            <div className="ad-panel !p-3">
              <p className="ad-eyebrow">Dinero recibido</p>
              <p className="text-sm">
                Efectivo USD esp. ${expectedCash.usd.toFixed(2)}
              </p>
              <p className="text-sm">
                Efectivo Bs esp. {expectedCash.bs.toLocaleString("es-VE")}
              </p>
              <p className="text-xs text-[var(--ad-muted)] mt-1">
                Dif. USD {(countedUsd - expectedCash.usd).toFixed(2)} · Dif. Bs{" "}
                {(countedBs - expectedCash.bs).toFixed(0)}
              </p>
            </div>
            <div className="ad-panel !p-3">
              <p className="ad-eyebrow">Pendientes / pasivos</p>
              <p className="text-sm">
                Cuentas abiertas:{" "}
                {
                  accounts.filter(
                    (a) =>
                      (a.status === "ABIERTA" ||
                        a.status === "PREPAGADA" ||
                        a.status === "PARCIALMENTE_PAGADA") &&
                      (!closureWarehouseId ||
                        a.warehouseId === closureWarehouseId),
                  ).length
                }
              </p>
              <p className="text-sm">
                Prepagos activos:{" "}
                {prepaids.filter((p) => p.status === "ACTIVO").length}
              </p>
              <p className="text-sm">
                Descuentos USD:{" "}
                {scopedSales
                  .reduce((a, s) => a + (s.discountUsd || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>

          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            <li className="text-[var(--ad-gold-soft)]">Pagos del día por método</li>
            {Object.entries(byMethod).map(([method, v]) => (
              <li key={method}>
                {method}: ${v.usd.toFixed(2)} · Bs {v.bs.toLocaleString("es-VE")}
              </li>
            ))}
            {!Object.keys(byMethod).length ? <li>Sin pagos hoy en el alcance</li> : null}
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
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={runDaily}
            disabled={!canClose}
          >
            Generar cierre diario
          </button>
          <ul className="text-xs text-[var(--ad-muted)]">
            {dailyClosures.slice(0, 5).map((c) => (
              <li key={c.id}>
                {c.date} · {c.createdBy}
                {c.warehouseId
                  ? ` · ${warehouseLabel(c.warehouseId, warehouses)}`
                  : ""}{" "}
                · Δ USD {c.cashDifferenceUsd}
              </li>
            ))}
          </ul>
        </section>

        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Cierre de inventario</h2>
          <select
            className="ad-select"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {visibleWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <div className="max-h-64 space-y-2 overflow-auto">
            {products.map((p) => {
              const theo = getStock(p.id, warehouseId);
              return (
                <label
                  key={p.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {p.name}{" "}
                    <span className="text-[var(--ad-muted)]">
                      (teo. {theo})
                    </span>
                  </span>
                  <input
                    className="ad-input w-24"
                    type="number"
                    value={physical[p.id] ?? theo}
                    onChange={(e) =>
                      setPhysical((prev) => ({
                        ...prev,
                        [p.id]: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              );
            })}
          </div>
          <button type="button" className="ad-btn" onClick={runInventory}>
            Registrar conteo
          </button>
          <ul className="text-xs text-[var(--ad-muted)]">
            {inventoryClosures.slice(0, 5).map((c) => (
              <li key={c.id}>
                {c.createdAt.slice(0, 10)} · {c.createdBy} ·{" "}
                {warehouseLabel(c.warehouseId ?? "", warehouses)}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
    </div>
  );
}
