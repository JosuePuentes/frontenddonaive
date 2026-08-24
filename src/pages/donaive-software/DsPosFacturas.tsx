import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { saleNetUsd } from "@/lib/donaive-software/sales";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsPosFacturasInner() {
  const { sales, returnSale, can } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sales.filter((s) => {
      if (!term) return true;
      return (
        s.receiptNumber.toLowerCase().includes(term) ||
        (s.clientName ?? "").toLowerCase().includes(term) ||
        (s.clientDocument ?? "").toLowerCase().includes(term)
      );
    });
  }, [sales, q]);

  function onReturn(id: string) {
    if (!can("pos.refund")) {
      setMsg("Sin permiso de devolución");
      return;
    }
    const r = returnSale(id);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    navigate(`${routes.posVender}?credito=${id}`);
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.pos}>Punto de venta</Link>
        <span>/</span>
        <span>Facturas</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Facturas</h1>
        <p className="ds-lead">
          Busque por número o cliente. La devolución regresa mercancía, no dinero:
          queda crédito para una factura nueva.
        </p>
        <input
          className="ds-input"
          placeholder="Nº factura o nombre del cliente"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {msg ? (
          <p style={{ color: "var(--ds-danger)" }}>{msg}</p>
        ) : null}
        <div style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Total / neto</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 80).map((s) => (
                <tr key={s.id}>
                  <td>{s.receiptNumber}</td>
                  <td>{s.clientName ?? "Ocasional"}</td>
                  <td>
                    ${formatDsNumber(s.totalUsd, 2)}
                    {s.creditAppliedUsd ? (
                      <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                        Neto ${formatDsNumber(saleNetUsd(s), 2)}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {s.returnedAt
                      ? `Devuelta · crédito $${formatDsNumber(s.creditUsdRemaining ?? 0, 2)}`
                      : s.status}
                  </td>
                  <td>
                    {!s.returnedAt && s.status === "completed" ? (
                      <button
                        type="button"
                        className="ds-btn"
                        onClick={() => onReturn(s.id)}
                      >
                        Devolver
                      </button>
                    ) : s.creditUsdRemaining && s.creditUsdRemaining > 0.01 ? (
                      <Link
                        className="ds-btn ds-btn--primary"
                        to={`${routes.posVender}?credito=${s.id}`}
                      >
                        Usar crédito
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function DsPosFacturas() {
  return (
    <DsRequirePermission permission="pos.sell">
      <DsPosFacturasInner />
    </DsRequirePermission>
  );
}
