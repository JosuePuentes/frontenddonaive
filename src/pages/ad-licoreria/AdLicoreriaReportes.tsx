import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaReportes() {
  const { sales, movements, accounts, stock } = useAdLicoreria();

  return (
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
  );
}
