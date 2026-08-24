import { useMemo, useState } from "react";
import { Link } from "react-router";
import { DsBarChart } from "@/components/donaive-software/DsBarChart";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import {
  buildPurchaseSummary,
  buildReplenishmentAnalysis,
  rangePreset,
} from "@/lib/donaive-software/reports";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsAnalisisComprasInner() {
  const { products, sales, purchases } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [coverageDays, setCoverageDays] = useState(7);
  const [lookbackDays, setLookbackDays] = useState(14);

  const rows = useMemo(
    () =>
      buildReplenishmentAnalysis({
        products,
        sales,
        purchases,
        coverageDays,
        lookbackDays,
      }),
    [products, sales, purchases, coverageDays, lookbackDays],
  );

  const purchaseSummary = useMemo(
    () => buildPurchaseSummary(purchases, rangePreset("30d")),
    [purchases],
  );

  const toOrder = rows.filter((r) => r.suggestedQtyBase > 0);

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.analisis}>Análisis</Link>
        <span>/</span>
        <span>Compras</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Análisis de compras</h1>
        <p className="ds-lead">
          Sugerencias de reposición según ventas recientes y días de cobertura
          deseados.
        </p>
        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            maxWidth: 420,
          }}
        >
          <label className="ds-label">
            Días de cobertura
            <input
              className="ds-input"
              type="number"
              min={1}
              max={90}
              value={coverageDays}
              onChange={(e) => setCoverageDays(Number(e.target.value) || 7)}
            />
          </label>
          <label className="ds-label">
            Ventas a mirar (días)
            <input
              className="ds-input"
              type="number"
              min={1}
              max={90}
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value) || 14)}
            />
          </label>
        </div>
        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              A reponer
            </div>
            <div className="ds-stat">{toOrder.length}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Compras (30d)
            </div>
            <div className="ds-stat">{purchaseSummary.purchaseCount}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Gastado (30d)
            </div>
            <div className="ds-stat" style={{ fontSize: "1.1rem" }}>
              {formatDsNumber(purchaseSummary.totalSpend, 2)}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <DsBarChart
          title="Sugerido a comprar (unidades)"
          items={toOrder.slice(0, 12).map((r) => ({
            label: r.sku,
            value: r.suggestedQtyBase,
            secondary: `${formatDsNumber(r.avgDaily, 1)}/día`,
          }))}
          formatValue={(n) => formatDsNumber(n, 0)}
          emptyText="Sin sugerencias. Necesitas ventas recientes o stock bajo relativo a la rotación."
        />
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            Lista de reposición
          </h2>
          <Link className="ds-btn ds-btn--primary" to={routes.comprasNueva}>
            Ir a nueva compra
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
            Aún no hay datos suficientes. Vende en el POS y vuelve a consultar.
          </p>
        ) : (
          <div style={{ marginTop: "0.75rem", overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Vendidas</th>
                  <th>Prom./día</th>
                  <th>Sugerido</th>
                  <th>Cajas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.productId}>
                    <td>
                      {r.name}
                      <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                        {r.sku}
                      </div>
                    </td>
                    <td>{formatDsNumber(r.stock, 0)}</td>
                    <td>{formatDsNumber(r.soldInPeriod, 0)}</td>
                    <td>{formatDsNumber(r.avgDaily, 2)}</td>
                    <td>
                      <strong
                        style={{
                          color:
                            r.suggestedQtyBase > 0
                              ? "var(--ds-accent)"
                              : undefined,
                        }}
                      >
                        {formatDsNumber(r.suggestedQtyBase, 0)} u.
                      </strong>
                    </td>
                    <td>
                      {r.unitsPerBox > 1
                        ? formatDsNumber(r.suggestedBoxes, 0)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {purchaseSummary.bySupplier.length > 0 ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <DsBarChart
            title="Compras por proveedor (últimos 30 días)"
            items={purchaseSummary.bySupplier.map((s) => ({
              label: s.name,
              value: s.total,
              secondary: `${s.count} fact.`,
            }))}
            formatValue={(n) => formatDsNumber(n, 0)}
          />
        </section>
      ) : null}
    </div>
  );
}

export default function DsAnalisisCompras() {
  return (
    <DsRequirePermission permission="analysis.view">
      <DsAnalisisComprasInner />
    </DsRequirePermission>
  );
}
