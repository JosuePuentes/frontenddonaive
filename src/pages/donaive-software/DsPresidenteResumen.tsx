import { useMemo } from "react";
import { Link } from "react-router";
import { DsBarChart } from "@/components/donaive-software/DsBarChart";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import {
  buildDailySalesSummary,
  buildPurchasePlanning,
} from "@/lib/donaive-software/planning";
import { buildInventoryReport, buildSalesReport, rangePreset } from "@/lib/donaive-software/reports";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsPresidenteResumenInner() {
  const { products, sales, purchases, suppliers, movements } =
    useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const today = buildDailySalesSummary(sales);
  const week = useMemo(
    () => buildSalesReport(sales, rangePreset("7d")),
    [sales],
  );
  const inventory = useMemo(() => buildInventoryReport(products), [products]);
  const plan = useMemo(
    () =>
      buildPurchasePlanning({
        products,
        sales,
        purchases,
        suppliers,
      }),
    [products, sales, purchases, suppliers],
  );

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.presidente}>Presidencia</Link>
        <span>/</span>
        <span>Resumen</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Resumen ejecutivo</h1>
        <p className="ds-lead">
          Supervisión de ventas, inventario y reposición. Este rol no factura
          ni edita datos operativos.
        </p>
        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          }}
        >
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Ventas hoy USD
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem" }}>
              ${formatDsNumber(today.totalUsd, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Tickets hoy
            </div>
            <div className="ds-stat">{today.tickets}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Valor inventario
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem" }}>
              ${formatDsNumber(inventory.totalValueUsd, 0)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Críticos
            </div>
            <div className="ds-stat">{plan.criticalCount}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Movimientos
            </div>
            <div className="ds-stat">{movements.length}</div>
          </div>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <DsBarChart
          title="Ventas 7 días (USD)"
          items={week.byDay.map((d) => ({
            label: d.date.slice(5),
            value: d.usd,
            secondary: `${d.tickets} tkt`,
          }))}
          formatValue={(n) => `$${formatDsNumber(n, 0)}`}
        />
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Alertas de compra</h2>
        {plan.rows.slice(0, 8).length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
            Sin alertas de reposición.
          </p>
        ) : (
          <div style={{ marginTop: "0.75rem", overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Días stock</th>
                  <th>Despacho</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {plan.rows.slice(0, 8).map((r) => (
                  <tr key={r.productId}>
                    <td>{r.name}</td>
                    <td>
                      {Number.isFinite(r.stockDays)
                        ? formatDsNumber(r.stockDays, 1)
                        : "∞"}
                    </td>
                    <td>{r.leadTimeDays} d</td>
                    <td>
                      {r.urgency === "CRITICAL" ? "Crítico" : "Reponer"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link className="ds-btn" to={routes.informesVentasDiarias}>
            Ventas del día
          </Link>
          <Link className="ds-btn" to={routes.inventarioMovimientos}>
            Movimiento de unidades
          </Link>
          <Link className="ds-btn" to={routes.presidenteInventarios}>
            Inventarios máster/general
          </Link>
          <Link className="ds-btn ds-btn--primary" to={routes.planificacionCompras}>
            Plan de compras
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function DsPresidenteResumen() {
  return (
    <DsRequirePermission permission="president.view">
      <DsPresidenteResumenInner />
    </DsRequirePermission>
  );
}
