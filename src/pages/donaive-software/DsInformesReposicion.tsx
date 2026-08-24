import { useMemo } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { buildPurchasePlanning } from "@/lib/donaive-software/planning";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

const URGENCY_LABEL: Record<string, string> = {
  CRITICAL: "Crítico",
  BUY: "Reponer",
  OK: "Ok",
  OVER: "Sobre máximo",
};

function DsInformesReposicionInner() {
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

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.informes}>Informes</Link>
        <span>/</span>
        <span>Reposición</span>
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
            <h1 className="ds-title">Reposición de productos</h1>
            <p className="ds-lead">
              Productos bajo mínimo o en crítico según movimiento diario y
              tiempo de despacho del proveedor.
            </p>
          </div>
          <button type="button" className="ds-btn" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>

        {plan.rows.length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "1rem" }}>
            Ningún producto necesita reposición ahora.
          </p>
        ) : (
          <div style={{ marginTop: "1rem", overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Proveedor</th>
                  <th>Stock</th>
                  <th>Mín</th>
                  <th>Máx</th>
                  <th>Días stock</th>
                  <th>Despacho</th>
                  <th>Estado</th>
                  <th>Pedir</th>
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((r) => (
                  <tr key={r.productId}>
                    <td>
                      {r.name}
                      <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                        {r.sku}
                      </div>
                    </td>
                    <td>{r.supplierName ?? "Sin asignar"}</td>
                    <td>{formatDsNumber(r.stock, 0)}</td>
                    <td>{formatDsNumber(r.minQtyBase, 0)}</td>
                    <td>{formatDsNumber(r.maxQtyBase, 0)}</td>
                    <td>
                      {Number.isFinite(r.stockDays)
                        ? formatDsNumber(r.stockDays, 1)
                        : "∞"}
                    </td>
                    <td>{r.leadTimeDays} d</td>
                    <td>{URGENCY_LABEL[r.urgency] ?? r.urgency}</td>
                    <td>
                      {formatDsNumber(r.suggestedQtyBase, 0)} u.
                      {r.unitsPerBox > 1
                        ? ` (${formatDsNumber(r.suggestedBoxes, 0)} cj)`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DsInformesReposicion() {
  return (
    <DsRequirePermission permission={["reports.read", "planning.view", "president.view"]}>
      <DsInformesReposicionInner />
    </DsRequirePermission>
  );
}
