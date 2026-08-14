import { useMemo, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

type Preset =
  | "hoy"
  | "ayer"
  | "semana"
  | "mes"
  | "anio"
  | "personalizado";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function rangeForPreset(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const today = isoDate(now);
  if (preset === "hoy") return { from: today, to: today };
  if (preset === "ayer") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const s = isoDate(y);
    return { from: s, to: s };
  }
  if (preset === "semana") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: isoDate(d), to: today };
  }
  if (preset === "mes") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: isoDate(d), to: today };
  }
  if (preset === "anio") {
    const d = new Date(now.getFullYear(), 0, 1);
    return { from: isoDate(d), to: today };
  }
  return { from: "", to: "" };
}

export default function AdLicoreriaReportes() {
  const {
    sales,
    movements,
    accounts,
    prepaids,
    products,
    presentations,
    categories,
    operators,
    inventory,
    customers,
    warehouses,
  } = useAdLicoreria();

  const [preset, setPreset] = useState<Preset>("hoy");
  const initial = rangeForPreset("hoy");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [categoryId, setCategoryId] = useState("");
  const [mesonera, setMesonera] = useState("");

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === "personalizado") return;
    const r = rangeForPreset(p);
    setFrom(r.from);
    setTo(r.to);
  }

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = s.createdAt.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (mesonera && (s.mesoneraName ?? s.userName) !== mesonera) return false;
      if (categoryId) {
        const ok = s.items.some((it) => {
          const p = products.find((x) => x.id === it.productId);
          return p?.categoryId === categoryId;
        });
        if (!ok) return false;
      }
      return true;
    });
  }, [sales, from, to, mesonera, categoryId, products]);

  const completed = filteredSales.filter((s) => s.status === "completed");
  const voided = filteredSales.filter((s) => s.status === "voided");

  const byMethod = useMemo(() => {
    const map = new Map<string, { usd: number; bs: number }>();
    for (const s of completed) {
      for (const p of s.payments) {
        const cur = map.get(p.method) ?? { usd: 0, bs: 0 };
        if (p.currency === "USD") cur.usd += p.amount;
        else cur.bs += p.amount;
        map.set(p.method, cur);
      }
    }
    return [...map.entries()];
  }, [completed]);

  const byProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completed) {
      for (const it of s.items) {
        map.set(it.productId, (map.get(it.productId) ?? 0) + it.qtyBase);
      }
    }
    return [...map.entries()]
      .map(([id, qty]) => ({
        name: products.find((p) => p.id === id)?.name ?? id,
        qty,
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [completed, products]);

  const byPresentation = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completed) {
      for (const it of s.items) {
        map.set(
          it.presentationId,
          (map.get(it.presentationId) ?? 0) + it.qty,
        );
      }
    }
    return [...map.entries()]
      .map(([id, qty]) => ({
        name: presentations.find((p) => p.id === id)?.name ?? id,
        qty,
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [completed, presentations]);

  const byMesonera = useMemo(() => {
    const map = new Map<string, { count: number; usd: number }>();
    for (const s of completed) {
      const name = s.mesoneraName ?? s.userName;
      const cur = map.get(name) ?? { count: 0, usd: 0 };
      cur.count += 1;
      cur.usd += s.total.usd;
      map.set(name, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].usd - a[1].usd);
  }, [completed]);

  const byTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completed) {
      const key = s.tableId ?? "sin-mesa";
      map.set(key, (map.get(key) ?? 0) + s.total.usd);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [completed]);

  const lowStock = products.filter((p) => {
    const qty = inventory
      .filter((i) => i.productId === p.id)
      .reduce((a, i) => a + i.qtyBase, 0);
    return qty < p.minStockBase;
  });

  const mesoneras = operators.filter((o) => o.role === "mesonera");
  const openAccounts = accounts.filter(
    (a) =>
      a.status === "ABIERTA" ||
      a.status === "PREPAGADA" ||
      a.status === "PARCIALMENTE_PAGADA",
  );
  const closedInRange = accounts.filter((a) => {
    if (a.status !== "CERRADA" || !a.closedAt) return false;
    const d = a.closedAt.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const collectedUsd = completed.reduce(
    (a, s) =>
      a +
      s.payments
        .filter((p) => p.currency === "USD")
        .reduce((x, p) => x + p.amount, 0),
    0,
  );
  const discountUsd = completed.reduce((a, s) => a + s.discountUsd, 0);
  const totalUsd = completed.reduce((a, s) => a + s.total.usd, 0);

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ad-muted)]">
        Ventas del día y reportes operativos. Listo para conectar API/export.
      </p>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Filtro de período</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["hoy", "Hoy"],
              ["ayer", "Ayer"],
              ["semana", "Esta semana"],
              ["mes", "Este mes"],
              ["anio", "Este año"],
              ["personalizado", "Personalizado"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`ad-btn ${preset === id ? "ad-btn--gold" : ""}`}
              onClick={() => applyPreset(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <input
            className="ad-input"
            type="date"
            value={from}
            onChange={(e) => {
              setPreset("personalizado");
              setFrom(e.target.value);
            }}
          />
          <input
            className="ad-input"
            type="date"
            value={to}
            onChange={(e) => {
              setPreset("personalizado");
              setTo(e.target.value);
            }}
          />
          <select
            className="ad-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={mesonera}
            onChange={(e) => setMesonera(e.target.value)}
          >
            <option value="">Todas las mesoneras</option>
            {mesoneras.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Ventas del período</h2>
        <div className="ad-grid-stats">
          <div className="ad-stat">
            <div className="ad-stat__value">{completed.length}</div>
            <div className="ad-stat__label">Ventas cerradas</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{openAccounts.length}</div>
            <div className="ad-stat__label">Cuentas abiertas</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{closedInRange.length}</div>
            <div className="ad-stat__label">Cuentas cerradas</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">${totalUsd.toFixed(0)}</div>
            <div className="ad-stat__label">Total vendido</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">${collectedUsd.toFixed(0)}</div>
            <div className="ad-stat__label">Total cobrado USD</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">${discountUsd.toFixed(0)}</div>
            <div className="ad-stat__label">Descuentos</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">{voided.length}</div>
            <div className="ad-stat__label">Anulaciones</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat__value">
              {prepaids.filter((p) => p.status === "ACTIVO").length}
            </div>
            <div className="ad-stat__label">Prepagos activos</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel">
          <h2 className="ad-panel-title">Por método de pago</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byMethod.map(([method, v]) => (
              <li key={method}>
                {method}: ${v.usd.toFixed(2)} · Bs {v.bs.toLocaleString("es-VE")}
              </li>
            ))}
            {!byMethod.length ? <li>Sin datos</li> : null}
          </ul>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Por mesonera</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byMesonera.map(([name, v]) => (
              <li key={name}>
                {name}: {v.count} ventas · ${v.usd.toFixed(2)}
              </li>
            ))}
            {!byMesonera.length ? <li>Sin datos</li> : null}
          </ul>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Por producto (u. base)</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byProduct.slice(0, 8).map((r) => (
              <li key={r.name}>
                {r.name}: {r.qty}
              </li>
            ))}
            {!byProduct.length ? <li>Sin datos</li> : null}
          </ul>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Por presentación</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byPresentation.slice(0, 8).map((r) => (
              <li key={r.name}>
                {r.name}: {r.qty}
              </li>
            ))}
            {!byPresentation.length ? <li>Sin datos</li> : null}
          </ul>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Por mesa (USD)</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {byTable.slice(0, 8).map(([id, usd]) => (
              <li key={id}>
                {id}: ${usd.toFixed(2)}
              </li>
            ))}
            {!byTable.length ? <li>Sin datos</li> : null}
          </ul>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Inventario / clientes</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            <li>Movimientos kardex: {movements.length}</li>
            <li>Stock bajo: {lowStock.length}</li>
            <li>Clientes: {customers.length}</li>
            <li>
              Existencia total:{" "}
              {inventory.reduce((a, i) => a + i.qtyBase, 0)} u. base
            </li>
            {warehouses.map((w) => (
              <li key={w.id}>
                {w.name}:{" "}
                {inventory
                  .filter((i) => i.warehouseId === w.id)
                  .reduce((a, i) => a + i.qtyBase, 0)}{" "}
                u.
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
