import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { accountAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCuentas() {
  const { accounts, products, presentations, tables } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Mesa</th>
              <th>Mesonera</th>
              <th>Estado</th>
              <th>Prepago</th>
              <th>Líneas</th>
              <th>QR token</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const table = tables.find((t) => t.id === a.tableId);
              return (
                <tr key={a.id}>
                  <td>#{a.number}</td>
                  <td>{table?.number ?? "—"}</td>
                  <td>{a.mesoneraName ?? "—"}</td>
                  <td>{a.status}</td>
                  <td>{a.prepaid ? "Sí" : "No"}</td>
                  <td>
                    {a.lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      const pr = presentations.find(
                        (x) => x.id === l.presentationId,
                      );
                      return (
                        <div key={`${l.productId}-${l.presentationId}`}>
                          {p?.name} ({pr?.name}): pagadas {l.qtyPaid} ·
                          servidas {l.qtyServed} · disp.{" "}
                          {accountAvailable(l.qtyPaid, l.qtyServed)}
                        </div>
                      );
                    })}
                  </td>
                  <td>
                    <code className="text-xs text-[var(--ad-gold-soft)]">
                      {a.qrToken}
                    </code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Link to={AD_LICORERIA_ROUTES.qr} className="ad-btn">
        Ver consulta QR
      </Link>
    </div>
  );
}
