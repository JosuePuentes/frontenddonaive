import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsInventarioMovimientosInner() {
  const { movements } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.inventario}>Inventario</Link>
        <span>/</span>
        <span>Movimientos</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Movimiento de unidades</h1>
        <p className="ds-lead">
          Kardex local: entradas por compras y salidas por ventas.
        </p>

        {movements.length === 0 ? (
          <p className="ds-muted" style={{ marginTop: "1.25rem" }}>
            Aún no hay movimientos. Confirme una compra o una venta.
          </p>
        ) : (
          <div style={{ marginTop: "1rem", overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 100).map((m) => (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(m.createdAt).toLocaleString("es-VE")}
                    </td>
                    <td>{m.type}</td>
                    <td>{m.productLabel}</td>
                    <td
                      style={{
                        color:
                          m.qtyBase < 0 ? "var(--ds-danger)" : "var(--ds-ok)",
                      }}
                    >
                      {m.qtyBase > 0 ? "+" : ""}
                      {formatDsNumber(m.qtyBase, 0)} u.
                    </td>
                    <td className="ds-muted">{m.note ?? "—"}</td>
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

export default function DsInventarioMovimientos() {
  return (
    <DsRequirePermission
      permission={["inventory.adjust", "inventory.movements", "president.view"]}
    >
      <DsInventarioMovimientosInner />
    </DsRequirePermission>
  );
}
