import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { accountAvailable } from "@/lib/ad-licoreria/conversions";

export default function AdLicoreriaDashboard() {
  const { products, stock, accounts, tables, sales, cash, movements } =
    useAdLicoreria();
  const totalBase = stock.reduce((a, s) => a + s.qtyBase, 0);
  const openTables = tables.filter((t) => t.status !== "libre").length;
  const prepaid = accounts.filter((a) => a.prepaid && a.status !== "cerrada");
  const availablePrepaid = prepaid.reduce(
    (acc, a) =>
      acc +
      a.lines.reduce((x, l) => x + accountAvailable(l.qtyPaid, l.qtyServed), 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="ad-grid-stats">
        <div className="ad-stat">
          <div className="ad-stat__value">{products.filter((p) => p.active).length}</div>
          <div className="ad-stat__label">Productos activos</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{totalBase}</div>
          <div className="ad-stat__label">Unidades base en stock</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{openTables}</div>
          <div className="ad-stat__label">Mesas ocupadas</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{availablePrepaid}</div>
          <div className="ad-stat__label">Prepago disponible</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">{sales.length}</div>
          <div className="ad-stat__label">Ventas sesión</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat__value">
            {cash.status === "open" ? "ABIERTA" : "CERRADA"}
          </div>
          <div className="ad-stat__label">Caja</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="ad-panel">
          <h2 className="ad-panel-title">Accesos rápidos</h2>
          <div className="flex flex-wrap gap-2">
            <Link to={AD_LICORERIA_ROUTES.pos} className="ad-btn ad-btn--gold">
              POS
            </Link>
            <Link to={AD_LICORERIA_ROUTES.inventario} className="ad-btn">
              Inventario
            </Link>
            <Link to={AD_LICORERIA_ROUTES.depositos} className="ad-btn">
              Transferir
            </Link>
            <Link to={AD_LICORERIA_ROUTES.prepagos} className="ad-btn">
              Prepagos
            </Link>
            <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn">
              Mesonera
            </Link>
          </div>
        </section>
        <section className="ad-panel">
          <h2 className="ad-panel-title">Últimos movimientos</h2>
          <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
            {movements.slice(0, 5).map((m) => (
              <li key={m.id}>
                <span className="text-[var(--ad-gold-soft)]">{m.type}</span> ·{" "}
                {m.qtyBase} u. base · {m.userName}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
