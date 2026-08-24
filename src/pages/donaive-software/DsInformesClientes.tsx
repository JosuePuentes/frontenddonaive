import { useMemo } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { downloadCsv } from "@/lib/donaive-software/planning";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsInformesClientesInner() {
  const { clients, receivables, sales } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const rows = useMemo(
    () =>
      clients.map((c) => {
        const cxc = receivables
          .filter((r) => r.clientId === c.id)
          .reduce((a, r) => a + r.balance, 0);
        const spent = sales
          .filter((s) => s.clientId === c.id && s.status === "completed")
          .reduce((a, s) => a + s.totalUsd, 0);
        return { ...c, cxc, spent };
      }),
    [clients, receivables, sales],
  );

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.informes}>Informes</Link>
        <span>/</span>
        <span>Clientes</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Informe de clientes</h1>
        <p className="ds-lead">Ventas acumuladas y saldos por cobrar.</p>
        <button
          type="button"
          className="ds-btn"
          style={{ marginTop: "0.75rem" }}
          onClick={() =>
            downloadCsv(
              "clientes.csv",
              [
                "Cliente,Documento,CxC USD,Ventas USD",
                ...rows.map(
                  (r) =>
                    `"${r.name.replace(/"/g, '""')}",${r.documentId ?? ""},${r.cxc.toFixed(2)},${r.spent.toFixed(2)}`,
                ),
              ].join("\n"),
            )
          }
        >
          Exportar CSV
        </button>
        <div style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>CxC</th>
                <th>Ventas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.documentId ?? "—"}</td>
                  <td>${formatDsNumber(r.cxc, 2)}</td>
                  <td>${formatDsNumber(r.spent, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function DsInformesClientes() {
  return (
    <DsRequirePermission permission={["reports.read", "clients.read"]}>
      <DsInformesClientesInner />
    </DsRequirePermission>
  );
}
