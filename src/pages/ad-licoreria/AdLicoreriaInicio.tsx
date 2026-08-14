import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { prepaidAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaInicio() {
  const {
    products,
    inventory,
    accounts,
    tables,
    sales,
    prepaids,
    movements,
    audit,
  } = useAdLicoreria();

  const totalBase = inventory.reduce((a, s) => a + s.qtyBase, 0);
  const openTables = tables.filter((t) => t.status !== "disponible").length;
  const openAccounts = accounts.filter(
    (a) =>
      a.status === "ABIERTA" ||
      a.status === "PREPAGADA" ||
      a.status === "PARCIALMENTE_PAGADA",
  );
  const activePrepaids = prepaids.filter((p) => p.status === "ACTIVO");
  const prepaidUnits = activePrepaids.reduce(
    (acc, p) =>
      acc +
      p.items.reduce(
        (x, i) => x + prepaidAvailable(i.qtyPurchased, i.qtyConsumed),
        0,
      ),
    0,
  );
  const completedSales = sales.filter((s) => s.status === "completed");
  const salesUsd = completedSales.reduce((a, s) => a + s.total.usd, 0);
  const salesBs = completedSales.reduce((a, s) => a + s.total.bs, 0);
  const pendingProducts = openAccounts.reduce(
    (acc, a) =>
      acc + a.items.reduce((x, i) => x + Math.max(0, i.qty - i.qtyServed), 0),
    0,
  );
  const byPay = new Map<string, number>();
  for (const s of completedSales) {
    for (const p of s.payments) {
      if (p.currency === "USD") {
        byPay.set(p.method, (byPay.get(p.method) ?? 0) + p.amount);
      }
    }
  }
  const topProducts = (() => {
    const map = new Map<string, number>();
    for (const s of completedSales) {
      for (const it of s.items) {
        map.set(it.productId, (map.get(it.productId) ?? 0) + it.qtyBase);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, qty]) => ({
        name: products.find((p) => p.id === id)?.name ?? id,
        qty,
      }));
  })();
  const lowStock = products.filter((p) => {
    const qty = inventory
      .filter((i) => i.productId === p.id)
      .reduce((a, i) => a + i.qtyBase, 0);
    return qty < p.minStockBase;
  });

  return (
    <div className="space-y-5">
      <div className="ad-grid-stats">
        <div className="ad-stat">
          <div className="ad-stat__value">${salesUsd.toFixed(0)}</div>
          <div className="ad-stat__label">Ventas USD hoy</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            Bs {salesBs.toLocaleString("es-VE", { maximumFractionDigits: 0 })}
          </div>
          <div className="ad-stat__label">Ventas Bs hoy</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{openAccounts.length}</div>
          <div className="ad-stat__label">Cuentas abiertas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{openTables}</div>
          <div className="ad-stat__label">Mesas ocupadas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{prepaidUnits}</div>
          <div className="ad-stat__label">Prepago disponible</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{lowStock.length}</div>
          <div className="ad-stat__label">Stock bajo</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{totalBase}</div>
          <div className="ad-stat__label">Unidades base stock</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{completedSales.length}</div>
          <div className="ad-stat__label">Tickets venta</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{pendingProducts}</div>
          <div className="ad-stat__label">Productos pendientes</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel">
          <h2 className="ad-panel-title">Operación rápida</h2>
          <div className="flex flex-wrap gap-2">
            <Link to={AD_LICORERIA_ROUTES.ventas} className="ad-btn ad-btn--gold">
              Ventas
            </Link>
            <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn ad-btn--primary">
              Mesonera
            </Link>
            <Link to={AD_LICORERIA_ROUTES.cuentas} className="ad-btn">
              Cuentas
            </Link>
            <Link to={AD_LICORERIA_ROUTES.prepagos} className="ad-btn">
              Prepagos
            </Link>
            <Link to={AD_LICORERIA_ROUTES.depositos} className="ad-btn">
              Depósitos
            </Link>
            <Link to={AD_LICORERIA_ROUTES.cierres} className="ad-btn">
              Cierres
            </Link>
          </div>
        </section>

        <section className="ad-panel">
          <h2 className="ad-panel-title">Stock bajo</h2>
          {lowStock.length ? (
            <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
              {lowStock.map((p) => (
                <li key={p.id}>
                  {p.name} · mín. {p.minStockBase} {p.baseUnitLabel}s
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--ad-muted)]">Sin alertas</p>
          )}
        </section>

        <section className="ad-panel">
          <h2 className="ad-panel-title">Últimas ventas</h2>
          <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
            {completedSales.slice(0, 5).map((s) => (
              <li key={s.id}>
                {s.receiptNumber} · ${s.total.usd.toFixed(2)} ·{" "}
                {s.mesoneraName ?? s.userName}
              </li>
            ))}
            {!completedSales.length ? <li>Sin ventas aún</li> : null}
          </ul>
        </section>

        <section className="ad-panel">
          <h2 className="ad-panel-title">Top productos / pagos USD</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
            {topProducts.map((p) => (
              <li key={p.name}>
                {p.name}: {p.qty} u.
              </li>
            ))}
            {[...byPay.entries()].slice(0, 4).map(([m, usd]) => (
              <li key={m}>
                {m}: ${usd.toFixed(2)}
              </li>
            ))}
            {!topProducts.length && !byPay.size ? <li>Sin datos</li> : null}
          </ul>
        </section>

        <section className="ad-panel">
          <h2 className="ad-panel-title">Actividad reciente</h2>
          <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
            {audit.slice(0, 6).map((e) => (
              <li key={e.id}>
                <span className="text-[var(--ad-gold-soft)]">{e.action}</span> ·{" "}
                {e.detail}
              </li>
            ))}
            {movements.slice(0, 2).map((m) => (
              <li key={m.id}>
                {m.type} · {m.qtyBase} u. · {m.userName}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
