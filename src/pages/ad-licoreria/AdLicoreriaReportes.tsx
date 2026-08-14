import { useMemo, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

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
  } = useAdLicoreria();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mesonera, setMesonera] = useState("");

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

  const byProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filteredSales) {
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
  }, [filteredSales, products]);

  const mesoneras = operators.filter((o) => o.role === "mesonera");

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ad-muted)]">
        Reportes con filtros. Estructura lista para conectar backend/export.
      </p>

      <section className="ad-panel grid gap-2 sm:grid-cols-4">
        <input
          className="ad-input"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          className="ad-input"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
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
      </section>

      <div className="ad-grid-stats">
        <div className="ad-stat">
          <div className="ad-stat__value">{filteredSales.length}</div>
          <div className="ad-stat__label">Ventas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            ${filteredSales.reduce((a, s) => a + s.total.usd, 0).toFixed(0)}
          </div>
          <div className="ad-stat__label">USD</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{movements.length}</div>
          <div className="ad-stat__label">Mov. inventario</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            {accounts.filter((a) => a.status === "ABIERTA").length}
          </div>
          <div className="ad-stat__label">Cuentas abiertas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            {prepaids.filter((p) => p.status === "ACTIVO").length}
          </div>
          <div className="ad-stat__label">Prepagos activos</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            {inventory.reduce((a, i) => a + i.qtyBase, 0)}
          </div>
          <div className="ad-stat__label">Stock base</div>
        </div>
      </div>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Productos más vendidos (u. base)</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {byProduct.slice(0, 8).map((r) => (
            <li key={r.name}>
              {r.name}: {r.qty}
            </li>
          ))}
          {!byProduct.length ? <li>Sin datos en el filtro</li> : null}
        </ul>
      </section>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Presentaciones activas</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          {presentations.filter((p) => p.active).length} presentaciones ·{" "}
          {products.filter((p) => p.active).length} productos
        </p>
      </section>
    </div>
  );
}
