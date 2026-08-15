import { useNavigate } from "react-router";
import { getAdLicoreriaRoutes } from "@/constants/ad-licoreria-routes";
import { prepaidAvailable } from "@/lib/ad-licoreria/conversions";
import { rangeForPreset } from "@/lib/ad-licoreria/report-presets";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaInicio() {
  const navigate = useNavigate();
  const routes = getAdLicoreriaRoutes();
  const {
    products,
    inventory,
    accounts,
    tables,
    sales,
    prepaids,
    movements,
    audit,
    dailyClosures,
    inventoryClosures,
    paymentMethods,
    hasPermission,
  } = useAdLicoreria();
  const canTv = hasPermission("tv.view");

  const { from: todayFrom, to: todayTo } = rangeForPreset("hoy");
  const todaySales = sales.filter((s) => {
    const d = s.createdAt.slice(0, 10);
    return (
      s.status === "completed" &&
      (!todayFrom || d >= todayFrom) &&
      (!todayTo || d <= todayTo)
    );
  });
  const todayVoided = sales.filter((s) => {
    const d = s.createdAt.slice(0, 10);
    return s.status === "voided" && d >= todayFrom && d <= todayTo;
  });

  const salesUsd = todaySales.reduce((a, s) => a + s.total.usd, 0);
  const collectedUsd = todaySales.reduce(
    (a, s) =>
      a +
      s.payments
        .filter((p) => p.currency === "USD")
        .reduce((x, p) => x + p.amount, 0),
    0,
  );
  const collectedBs = todaySales.reduce(
    (a, s) =>
      a +
      s.payments
        .filter((p) => p.currency === "BS")
        .reduce((x, p) => x + p.amount, 0),
    0,
  );
  const expectedCashUsd = todaySales.reduce(
    (a, s) =>
      a +
      s.payments
        .filter((p) => p.method === "efectivo_usd" && p.currency === "USD")
        .reduce((x, p) => x + p.amount, 0),
    0,
  );
  const expectedCashBs = todaySales.reduce(
    (a, s) =>
      a +
      s.payments
        .filter((p) => p.method === "efectivo_bs" && p.currency === "BS")
        .reduce((x, p) => x + p.amount, 0),
    0,
  );

  const openAccounts = accounts.filter(
    (a) =>
      a.status === "ABIERTA" ||
      a.status === "PREPAGADA" ||
      a.status === "PARCIALMENTE_PAGADA",
  );
  const pendingBalance = openAccounts.reduce((acc, a) => {
    const total = a.items.reduce((x, i) => x + i.unitPrice.usd * i.qty, 0);
    const paid = a.payments
      .filter((p) => p.currency === "USD")
      .reduce((x, p) => x + p.amount, 0);
    return acc + Math.max(0, total - (a.discountUsd || 0) - paid);
  }, 0);
  const pendingProducts = openAccounts.reduce(
    (acc, a) =>
      acc + a.items.reduce((x, i) => x + Math.max(0, i.qty - i.qtyServed), 0),
    0,
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
  const unitsSoldToday = todaySales.reduce(
    (a, s) => a + s.items.reduce((x, i) => x + i.qtyBase, 0),
    0,
  );
  const lowStock = products.filter((p) => {
    const qty = inventory
      .filter((i) => i.productId === p.id)
      .reduce((a, i) => a + i.qtyBase, 0);
    return qty < p.minStockBase;
  });
  const lastInv = inventoryClosures[0];
  const invDiffs = lastInv
    ? lastInv.lines.filter((l) => l.differenceBase !== 0).length
    : 0;
  const lastDaily = dailyClosures[0];
  const openTables = tables.filter((t) => t.status !== "disponible").length;
  const digitalToday = todaySales.reduce((a, s) => {
    return (
      a +
      s.payments.filter(
        (p) =>
          p.method !== "efectivo_usd" &&
          p.method !== "efectivo_bs" &&
          paymentMethods.find((m) => m.code === p.method)?.active !== false,
      ).length
    );
  }, 0);

  const alerts: string[] = [];
  if (lowStock.length) alerts.push(`${lowStock.length} productos bajo mínimo`);
  if (pendingProducts)
    alerts.push(`${pendingProducts} unidades pendientes de servir`);
  if (openAccounts.length)
    alerts.push(`${openAccounts.length} cuentas abiertas`);
  if (todayVoided.length)
    alerts.push(`${todayVoided.length} anulaciones hoy`);
  if (invDiffs) alerts.push(`${invDiffs} diferencias en último conteo`);

  return (
    <div className="space-y-5">
      <div className="ad-grid-stats">
        <div className="ad-stat">
          <div className="ad-stat__value">${salesUsd.toFixed(0)}</div>
          <div className="ad-stat__label">Ventas del día</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">${collectedUsd.toFixed(0)}</div>
          <div className="ad-stat__label">Cobrado USD</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            {collectedBs.toLocaleString("es-VE", { maximumFractionDigits: 0 })}
          </div>
          <div className="ad-stat__label">Cobrado Bs</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">${pendingBalance.toFixed(0)}</div>
          <div className="ad-stat__label">Pendiente USD</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{openAccounts.length}</div>
          <div className="ad-stat__label">Cuentas abiertas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{prepaidUnits}</div>
          <div className="ad-stat__label">Prepagos activos (u.)</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{unitsSoldToday}</div>
          <div className="ad-stat__label">Productos vendidos (base)</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{lowStock.length}</div>
          <div className="ad-stat__label">Inventario crítico</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{invDiffs}</div>
          <div className="ad-stat__label">Diff. inventario</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">${expectedCashUsd.toFixed(0)}</div>
          <div className="ad-stat__label">Efectivo USD esperado</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            {lastDaily ? `$${lastDaily.countedCashUsd.toFixed(0)}` : "—"}
          </div>
          <div className="ad-stat__label">Efectivo USD contado</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{openTables}</div>
          <div className="ad-stat__label">Mesas ocupadas</div>
        </div>
      </div>

      {alerts.length ? (
        <section className="ad-panel">
          <h2 className="ad-panel-title">Alertas</h2>
          <ul className="space-y-1 text-sm text-[var(--ad-gold-soft)]">
            {alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel">
          <h2 className="ad-panel-title">Accesos rápidos</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ad-btn ad-btn--gold"
              onClick={() => navigate(routes.ventas)}
            >
              Ventas
            </button>
            {canTv ? (
              <button
                type="button"
                className="ad-btn ad-btn--gold"
                onClick={() => navigate(routes.tv)}
              >
                TV
              </button>
            ) : null}
            <button
              type="button"
              className="ad-btn ad-btn--primary"
              onClick={() => navigate(routes.mesonera)}
            >
              Mesonera
            </button>
            <button
              type="button"
              className="ad-btn"
              onClick={() => navigate(routes.cop)}
            >
              COP
            </button>
            <button
              type="button"
              className="ad-btn"
              onClick={() => navigate(routes.cuentas)}
            >
              Cuentas
            </button>
            <button
              type="button"
              className="ad-btn"
              onClick={() => navigate(routes.prepagos)}
            >
              Prepagos
            </button>
            <button
              type="button"
              className="ad-btn"
              onClick={() => navigate(routes.cierres)}
            >
              Cierres
            </button>
            <button
              type="button"
              className="ad-btn"
              onClick={() => navigate(routes.reportes)}
            >
              Reportes
            </button>
            {canTv ? (
              <button
                type="button"
                className="ad-btn"
                onClick={() => navigate(routes.tvControl)}
              >
                Control TV
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-[var(--ad-muted)]">
            Efectivo Bs esperado hoy: {expectedCashBs.toLocaleString("es-VE")} ·
            pagos digitales (líneas): {digitalToday}
          </p>
        </section>

        <section className="ad-panel">
          <h2 className="ad-panel-title">Inventario crítico</h2>
          {lowStock.length ? (
            <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
              {lowStock.map((p) => (
                <li key={p.id}>
                  {p.name} · mín. {p.minStockBase} {p.baseUnitLabel}s
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--ad-muted)]">Sin alertas de stock</p>
          )}
        </section>

        <section className="ad-panel">
          <h2 className="ad-panel-title">Ventas de hoy</h2>
          <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
            {todaySales.slice(0, 6).map((s) => (
              <li key={s.id}>
                {s.receiptNumber} · ${s.total.usd.toFixed(2)} ·{" "}
                {s.mesoneraName ?? s.userName}
              </li>
            ))}
            {!todaySales.length ? <li>Sin ventas aún</li> : null}
          </ul>
        </section>

        <section className="ad-panel">
          <h2 className="ad-panel-title">Actividad reciente</h2>
          <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
            {audit.slice(0, 8).map((e) => (
              <li key={e.id}>
                <span className="text-[var(--ad-gold-soft)]">{e.action}</span> ·{" "}
                {e.detail}
              </li>
            ))}
            {movements.slice(0, 3).map((m) => (
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
