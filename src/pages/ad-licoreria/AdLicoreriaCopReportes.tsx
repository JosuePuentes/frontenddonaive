import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCopReportes() {
  const { getCopReports, products } = useAdLicoreria();
  const reports = getCopReports();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">COP · analítica operativa</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Reportes del centro de operaciones
          </h1>
        </div>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.cop}>
          ← COP
        </Link>
      </header>

      <section className="ad-cop__grid">
        {(
          [
            ["Día", reports.abastecimientoDia],
            ["Semana", reports.abastecimientoSemana],
            ["Mes", reports.abastecimientoMes],
            ["Año", reports.abastecimientoAnio],
          ] as const
        ).map(([label, data]) => (
          <article key={label} className="ad-panel ad-cop__stat">
            <div className="ad-stat__label">Abastecimiento · {label}</div>
            <p className="mt-2 text-sm text-[var(--ad-muted)]">
              TR {data.transfers} · Compras {data.purchases} · Solicitudes{" "}
              {data.requests}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="ad-panel space-y-2">
          <h2 className="ad-panel-title">Faltantes / bajo disponible</h2>
          <ul className="space-y-1 text-sm">
            {reports.faltantesActuales.map((r) => (
              <li key={r.product.id} className="flex justify-between gap-2">
                <span>{r.product.name}</span>
                <span className="text-[var(--ad-muted)]">
                  disp {r.availability.availableOperationalTotal}
                </span>
              </li>
            ))}
            {!reports.faltantesActuales.length ? (
              <li className="text-[var(--ad-muted)]">Sin faltantes</li>
            ) : null}
          </ul>
        </div>

        <div className="ad-panel space-y-2">
          <h2 className="ad-panel-title">Productos comprometidos</h2>
          <ul className="space-y-1 text-sm">
            {reports.productosComprometidos.map((r) => (
              <li key={r.product.id} className="flex justify-between gap-2">
                <span>{r.product.name}</span>
                <span className="text-[var(--ad-muted)]">
                  {r.availability.committedActiveTotal} u.
                </span>
              </li>
            ))}
            {!reports.productosComprometidos.length ? (
              <li className="text-[var(--ad-muted)]">Sin compromisos activos</li>
            ) : null}
          </ul>
        </div>

        <div className="ad-panel space-y-2">
          <h2 className="ad-panel-title">Déficit de clientes</h2>
          <ul className="space-y-1 text-sm">
            {reports.deficitClientes.map((r) => (
              <li key={r.commitment.id} className="flex justify-between gap-2">
                <span>
                  {r.commitment.customerName ?? "Cliente"} ·{" "}
                  {products.find((p) => p.id === r.commitment.productId)?.name}
                </span>
                <span className="ad-badge ad-badge--warn">
                  déficit {r.deficit} · pend {r.commitment.qtyBaseRemaining}
                </span>
              </li>
            ))}
            {!reports.deficitClientes.length ? (
              <li className="text-[var(--ad-muted)]">Sin déficits</li>
            ) : null}
          </ul>
        </div>

        <div className="ad-panel space-y-2">
          <h2 className="ad-panel-title">Compras necesarias</h2>
          <ul className="space-y-1 text-sm">
            {reports.comprasNecesarias.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>
                  {r.number} ·{" "}
                  {products.find((p) => p.id === r.productId)?.name} × {r.qty}
                </span>
                <span className="text-[var(--ad-muted)]">{r.status}</span>
              </li>
            ))}
            {!reports.comprasNecesarias.length ? (
              <li className="text-[var(--ad-muted)]">Sin solicitudes</li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Movimientos por depósito</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {reports.movimientosPorDeposito.map((m) => (
            <div key={m.warehouse.id} className="ad-cop__wh">
              <h3 className="ad-eyebrow">{warehouseLabel(m.warehouse.id)}</h3>
              <p className="text-sm">
                Movimientos: {m.movements} · SKUs: {m.stockLines.length}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Ventas con faltante (auditoría)</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {reports.ventasConFaltantes.slice(0, 15).map((a) => (
            <li key={a.id}>
              {new Date(a.createdAt).toLocaleString("es-VE")} · {a.userName} ·{" "}
              {a.detail}
            </li>
          ))}
          {!reports.ventasConFaltantes.length ? (
            <li>Sin registros</li>
          ) : null}
        </ul>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Transferencias</h2>
        <ul className="space-y-1 text-sm">
          {reports.transferencias.slice(0, 20).map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span>
                {t.number} · {warehouseLabel(t.fromWarehouseId)} →{" "}
                {warehouseLabel(t.toWarehouseId)}
              </span>
              <span className="ad-badge">{t.status}</span>
            </li>
          ))}
          {!reports.transferencias.length ? (
            <li className="text-[var(--ad-muted)]">Sin transferencias</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
