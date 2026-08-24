import { useMemo, useState } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsFinanzasCuentasInner() {
  const { payables, receivables, payPayable, collectReceivable } =
    useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [tab, setTab] = useState<"cxp" | "cxc">("cxp");
  const [payId, setPayId] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");

  const openPayables = useMemo(
    () => payables.filter((p) => p.balance > 0.009 && p.status !== "ANULADA"),
    [payables],
  );
  const openReceivables = useMemo(
    () => receivables.filter((r) => r.balance > 0.009 && r.status !== "ANULADA"),
    [receivables],
  );

  const totalCxp = openPayables.reduce((a, p) => a + p.balance, 0);
  const totalCxc = openReceivables.reduce((a, r) => a + r.balance, 0);
  const overdueCxp = openPayables
    .filter((p) => p.status === "VENCIDA")
    .reduce((a, p) => a + p.balance, 0);
  const overdueCxc = openReceivables
    .filter((r) => r.status === "VENCIDA")
    .reduce((a, r) => a + r.balance, 0);

  function onPayClick() {
    if (!payId) {
      setMsg("Seleccione una cuenta");
      return;
    }
    if (tab === "cxp") {
      const r = payPayable({ payableId: payId, amount: Number(amount) });
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      setMsg("Pago CxP registrado");
      setAmount("");
      setPayId("");
      return;
    }
    const r = collectReceivable({
      receivableId: payId,
      amount: Number(amount),
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setMsg("Cobro CxC registrado");
    setAmount("");
    setPayId("");
  }

  const rows = tab === "cxp" ? openPayables : openReceivables;

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.finanzas}>Finanzas</Link>
        <span>/</span>
        <span>Cuentas</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Cuentas</h1>
        <p className="ds-lead">
          CxP generadas por compras a crédito y CxC registradas a clientes.
        </p>
        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gap: "0.85rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              CxP pendiente
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem" }}>
              {formatDsNumber(totalCxp, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              CxP vencida
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem", color: "var(--ds-warn)" }}>
              {formatDsNumber(overdueCxp, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              CxC pendiente
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem" }}>
              ${formatDsNumber(totalCxc, 2)}
            </div>
          </div>
          <div>
            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
              CxC vencida
            </div>
            <div className="ds-stat" style={{ fontSize: "1.15rem", color: "var(--ds-warn)" }}>
              ${formatDsNumber(overdueCxc, 2)}
            </div>
          </div>
        </div>
      </section>

      <div className="ds-toggle-row" style={{ marginTop: "1rem" }}>
        <button
          type="button"
          className={`ds-btn${tab === "cxp" ? " ds-btn--primary" : ""}`}
          onClick={() => {
            setTab("cxp");
            setPayId("");
            setMsg("");
          }}
        >
          Cuentas por pagar
        </button>
        <button
          type="button"
          className={`ds-btn${tab === "cxc" ? " ds-btn--primary" : ""}`}
          onClick={() => {
            setTab("cxc");
            setPayId("");
            setMsg("");
          }}
        >
          Cuentas por cobrar
        </button>
      </div>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        {rows.length === 0 ? (
          <p className="ds-muted" style={{ margin: 0 }}>
            {tab === "cxp"
              ? "Sin CxP pendientes. Confirme una compra a crédito con proveedor."
              : "Sin CxC pendientes. Registre un cargo desde Clientes."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>{tab === "cxp" ? "Proveedor" : "Cliente"}</th>
                  <th>Detalle</th>
                  <th>Estado</th>
                  <th>Saldo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tab === "cxp"
                  ? openPayables.map((p) => (
                      <tr key={p.id}>
                        <td>{p.supplierName}</td>
                        <td>
                          #{p.invoiceNumber || "—"}
                          {p.dueDate ? (
                            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                              Vence {p.dueDate}
                            </div>
                          ) : null}
                        </td>
                        <td>{p.status}</td>
                        <td>
                          {formatDsNumber(p.balance, 2)} {p.currency}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ds-btn"
                            onClick={() => setPayId(p.id)}
                          >
                            Abonar
                          </button>
                        </td>
                      </tr>
                    ))
                  : openReceivables.map((r) => (
                      <tr key={r.id}>
                        <td>{r.clientName}</td>
                        <td>
                          {r.concept}
                          {r.dueDate ? (
                            <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                              Vence {r.dueDate}
                            </div>
                          ) : null}
                        </td>
                        <td>{r.status}</td>
                        <td>${formatDsNumber(r.balance, 2)}</td>
                        <td>
                          <button
                            type="button"
                            className="ds-btn"
                            onClick={() => setPayId(r.id)}
                          >
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {payId ? (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "end",
            }}
          >
            <label className="ds-label">
              Monto del abono
              <input
                className="ds-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={onPayClick}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="ds-btn"
              onClick={() => {
                setPayId("");
                setAmount("");
              }}
            >
              Cancelar
            </button>
          </div>
        ) : null}

        {msg ? (
          <p
            style={{
              marginTop: "0.85rem",
              color: msg.includes("registrado")
                ? "var(--ds-ok)"
                : "var(--ds-danger)",
            }}
          >
            {msg}
          </p>
        ) : null}
      </section>

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <Link className="ds-btn" to={routes.proveedoresLista}>
          Proveedores
        </Link>
        <Link className="ds-btn" to={routes.clientesLista}>
          Clientes
        </Link>
      </div>
    </div>
  );
}

export default function DsFinanzasCuentas() {
  return (
    <DsRequirePermission permission="finance.accounts">
      <DsFinanzasCuentasInner />
    </DsRequirePermission>
  );
}
