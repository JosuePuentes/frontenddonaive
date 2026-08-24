import { useMemo } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import {
  buildPurchasePlanning,
  downloadCsv,
  planningToCsv,
} from "@/lib/donaive-software/planning";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

const URGENCY_LABEL: Record<string, string> = {
  CRITICAL: "Crítico — comprar ya",
  BUY: "Comprar",
  OK: "Ok",
  OVER: "Sobre máximo",
};

function DsPlanificacionComprasInner() {
  const { products, sales, purchases, suppliers } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

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

  function exportCsv() {
    downloadCsv(
      `plan-compras-${new Date().toISOString().slice(0, 10)}.csv`,
      planningToCsv(plan.bySupplier),
    );
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.planificacion}>Planificación</Link>
        <span>/</span>
        <span>Compras sugeridas</span>
      </nav>

      <section className="ds-panel">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h1 className="ds-title">Planificación de compras</h1>
            <p className="ds-lead">
              El mínimo cubre el despacho del proveedor más 2 días de seguridad.
              El máximo cubre 14 días de venta. Si el stock alcanza para menos
              días que el despacho, el producto queda en crítico.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="ds-btn" onClick={exportCsv}>
              Exportar CSV
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={() => window.print()}
            >
              Imprimir
            </button>
          </div>
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
              Críticos
            </div>
            <div className="ds-stat">{plan.criticalCount}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              A reponer
            </div>
            <div className="ds-stat">{plan.buyCount}</div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              Proveedores
            </div>
            <div className="ds-stat">{plan.bySupplier.length}</div>
          </div>
        </div>
      </section>

      {plan.bySupplier.length === 0 ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <p className="ds-muted" style={{ margin: 0 }}>
            No hay compras sugeridas. Cuando haya ventas, el sistema calculará
            mínimo, máximo y el pedido por proveedor.
          </p>
        </section>
      ) : (
        plan.bySupplier.map((g) => (
          <section key={g.supplierId ?? "none"} className="ds-panel" style={{ marginTop: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
              {g.supplierName}
            </h2>
            <p className="ds-muted" style={{ margin: "0.35rem 0 0.75rem" }}>
              Despacho {g.leadTimeDays} día(s) · estimado $
              {formatDsNumber(g.totalSuggestedUsd, 2)}
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Mín / Máx</th>
                    <th>Días de stock</th>
                    <th>Estado</th>
                    <th>Pedir u.</th>
                    <th>Pedir cajas</th>
                  </tr>
                </thead>
                <tbody>
                  {g.lines.map((r) => (
                    <tr key={r.productId}>
                      <td>
                        {r.name}
                        <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                          {r.sku} · {formatDsNumber(r.avgDaily, 1)} u./día
                        </div>
                      </td>
                      <td>{formatDsNumber(r.stock, 0)}</td>
                      <td>
                        {formatDsNumber(r.minQtyBase, 0)} /{" "}
                        {formatDsNumber(r.maxQtyBase, 0)}
                      </td>
                      <td>
                        {Number.isFinite(r.stockDays)
                          ? `${formatDsNumber(r.stockDays, 1)} d`
                          : "∞"}
                      </td>
                      <td>{URGENCY_LABEL[r.urgency] ?? r.urgency}</td>
                      <td>{formatDsNumber(r.suggestedQtyBase, 0)}</td>
                      <td>{formatDsNumber(r.suggestedBoxes, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default function DsPlanificacionCompras() {
  return (
    <DsRequirePermission permission={["planning.view", "president.view"]}>
      <DsPlanificacionComprasInner />
    </DsRequirePermission>
  );
}
