import { useMemo } from "react";
import { Link } from "react-router";
import { DsBarChart } from "@/components/donaive-software/DsBarChart";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { completeDsPrice, formatDsMoney } from "@/lib/donaive-software/rates";
import { buildInventoryReportFromStock } from "@/lib/donaive-software/reports";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsInformesInventarioInner() {
  const { products, rates, generalInventory } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const report = useMemo(
    () => buildInventoryReportFromStock(products, generalInventory.stockByProduct),
    [products, generalInventory.stockByProduct],
  );

  const valueMoney = completeDsPrice(
    { usd: report.totalValueUsd, bs: 0 },
    rates.bcv,
  );

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.informes}>Informes</Link>
        <span>/</span>
        <span>Inventario</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Informe de inventario</h1>
        <p className="ds-lead">
          Inventario general (fiscal): solo compras marcadas para general y ventas fiscales.
        </p>
        <button
          type="button"
          className="ds-btn"
          style={{ marginTop: "0.75rem" }}
          onClick={() => {
            const lines = report.rows.map((r) =>
              [`"${r.sku}"`, `"${r.name.replace(/"/g, '""')}"`, r.qtyBase, r.unitCostUsd.toFixed(2), r.valueUsd.toFixed(2)].join(","),
            );
            const content = ["SKU,Producto,Stock,CPP USD,Valor USD", ...lines].join("\n");
            const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `inventario-general-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Descargar general CSV
        </button>
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
              SKUs
            </div>
            <div className="ds-stat">{report.rows.length}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Unidades
            </div>
            <div className="ds-stat">{formatDsNumber(report.totalUnits, 0)}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Valor a CPP
            </div>
            <div className="ds-stat" style={{ fontSize: "1.1rem" }}>
              {formatDsMoney(valueMoney)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Stock bajo
            </div>
            <div
              className="ds-stat"
              style={{
                color:
                  report.lowStockCount > 0 ? "var(--ds-warn)" : "var(--ds-ok)",
              }}
            >
              {report.lowStockCount}
            </div>
          </div>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <DsBarChart
          title="Valor por producto (USD a CPP)"
          items={report.rows
            .filter((r) => r.valueUsd > 0)
            .slice(0, 10)
            .map((r) => ({
              label: r.sku,
              value: r.valueUsd,
              secondary: `${r.qtyBase} u.`,
            }))}
          formatValue={(n) => `$${formatDsNumber(n, 0)}`}
          emptyText="Sin stock valorizado"
        />
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Detalle</h2>
        <div style={{ marginTop: "0.75rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>CPP</th>
                <th>Valor</th>
                <th>Alerta</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.productId}>
                  <td>
                    {r.name}
                    <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                      {r.sku} · caja x{r.unitsPerBox}
                    </div>
                  </td>
                  <td>{formatDsNumber(r.qtyBase, 0)} u.</td>
                  <td>${formatDsNumber(r.unitCostUsd, 2)}</td>
                  <td>${formatDsNumber(r.valueUsd, 2)}</td>
                  <td>
                    {r.lowStock ? (
                      <span style={{ color: "var(--ds-warn)" }}>Bajo</span>
                    ) : (
                      <span className="ds-muted">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function DsInformesInventario() {
  return (
    <DsRequirePermission permission="reports.read">
      <DsInformesInventarioInner />
    </DsRequirePermission>
  );
}
