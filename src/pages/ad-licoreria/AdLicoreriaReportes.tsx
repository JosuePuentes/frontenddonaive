import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaReportes() {
  const { sales, movements, accounts, stock, audit } = useAdLicoreria();

  return (
    <div className="space-y-5">
      <div className="ad-grid-stats">
        <div className="ad-stat">
          <div className="ad-stat__value">{sales.length}</div>
          <div className="ad-stat__label">Ventas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            ${sales.reduce((a, s) => a + s.total.usd, 0).toFixed(0)}
          </div>
          <div className="ad-stat__label">Ingresos USD</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{movements.length}</div>
          <div className="ad-stat__label">Mov. inventario</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{accounts.length}</div>
          <div className="ad-stat__label">Cuentas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            {stock.reduce((a, s) => a + s.qtyBase, 0)}
          </div>
          <div className="ad-stat__label">Stock total base</div>
        </div>
      </div>

      <section className="ad-panel">
        <h2 className="ad-panel-title">Auditoría reciente</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Usuario</th>
                <th>Detalle</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 12).map((e) => (
                <tr key={e.id}>
                  <td>{e.action}</td>
                  <td>{e.entity}</td>
                  <td>{e.userName}</td>
                  <td>{e.detail}</td>
                  <td>{new Date(e.createdAt).toLocaleString("es-VE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
