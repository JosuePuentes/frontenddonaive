import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  accountAvailable,
  formatAdPrice,
  multiplyPrice,
  addPrices,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCuentas() {
  const {
    accounts,
    products,
    presentations,
    tables,
    closeAccount,
  } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn ad-btn--gold">
          Mesonera
        </Link>
        <Link to={AD_LICORERIA_ROUTES.prepagos} className="ad-btn">
          Prepagos
        </Link>
        <Link to={AD_LICORERIA_ROUTES.qr} className="ad-btn">
          QR
        </Link>
        <Link to={AD_LICORERIA_ROUTES.mesas} className="ad-btn">
          Mesas
        </Link>
        <Link to={AD_LICORERIA_ROUTES.ventas} className="ad-btn">
          Ventas
        </Link>
      </div>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mesa</th>
              <th>Cliente</th>
              <th>Mesonera</th>
              <th>Apertura</th>
              <th>Consumo</th>
              <th>Total</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const table = tables.find((t) => t.id === a.tableId);
              const total = a.items.reduce(
                (acc, it) => addPrices(acc, multiplyPrice(it.unitPrice, it.qty)),
                { usd: 0, bs: 0 },
              );
              return (
                <tr key={a.id}>
                  <td>#{a.number}</td>
                  <td>{table?.number ?? "—"}</td>
                  <td>{a.customerName ?? "—"}</td>
                  <td>{a.mesoneraName ?? "—"}</td>
                  <td>{new Date(a.openedAt).toLocaleString("es-VE")}</td>
                  <td>
                    {a.items.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      const pr = presentations.find(
                        (x) => x.id === l.presentationId,
                      );
                      return (
                        <div key={l.id}>
                          {p?.name} ({pr?.name}): {l.qtyServed}/{l.qty} · disp.{" "}
                          {accountAvailable(l.qty, l.qtyServed)}
                        </div>
                      );
                    })}
                    {!a.items.length ? "—" : null}
                  </td>
                  <td>{formatAdPrice(total)}</td>
                  <td>
                    <span className="ad-badge">{a.status}</span>
                  </td>
                  <td>
                    {a.status !== "CERRADA" && a.status !== "CANCELADA" ? (
                      <button
                        type="button"
                        className="ad-btn"
                        onClick={() =>
                          closeAccount({
                            accountId: a.id,
                            userName: "Admin A&D",
                          })
                        }
                      >
                        Cerrar
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
