import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsMoney, completeDsPrice } from "@/lib/donaive-software/rates";
import { splitStockUnits } from "@/lib/donaive-software/stock";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

export default function DsInventarioProductos() {
  const { products, rates } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.inventario}>Inventario</Link>
        <span>/</span>
        <span>Productos</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Productos</h1>
        <p className="ds-lead">
          Stock en unidades, con desglose caja/sueltas cuando la ficha define
          empaque.
        </p>
        <div style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>CPP</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const s = splitStockUnits(p.stock.qtyBase, p.unitsPerBox);
                const money = completeDsPrice(
                  { usd: p.stock.unitCostUsd, bs: 0 },
                  rates.bcv,
                );
                return (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                        {p.sku} · caja x{p.unitsPerBox}
                      </div>
                    </td>
                    <td>
                      {s.totalUnits} u.
                      {s.hasBoxPack ? (
                        <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                          {s.fullBoxes} caja(s) · {s.looseUnits} suelta(s)
                          {!s.canSellFullBox
                            ? " · solo venta por unidad"
                            : ""}
                        </div>
                      ) : null}
                    </td>
                    <td>{formatDsMoney(money)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
