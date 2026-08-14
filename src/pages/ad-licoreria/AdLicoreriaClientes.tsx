import type { AdCustomer } from "@/types/ad-licoreria";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/**
 * Clientes frecuentes / prepago. Persistencia API en fase posterior.
 */
export default function AdLicoreriaClientes() {
  const { accounts, customers } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Directorio de clientes para cuentas prepagadas y seguimiento comercial.
        Datos mock en esta fase (sin backend).
      </p>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Notas</th>
              <th>Cuentas vinculadas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c: AdCustomer) => {
              const linked = accounts.filter((a) => a.customerId === c.id);
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.notes ?? "—"}</td>
                  <td>
                    {linked.length
                      ? linked.map((a) => `#${a.number}`).join(", ")
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={
                        c.active ? "ad-badge ad-badge--ok" : "ad-badge"
                      }
                    >
                      {c.active ? "Activo" : "Inactivo"}
                    </span>
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
