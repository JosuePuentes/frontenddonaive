import { useMemo, useState } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { bankBalance } from "@/lib/donaive-software/banks";
import { downloadCsv } from "@/lib/donaive-software/planning";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { DS_PAYMENT_METHODS } from "@/lib/donaive-software/sales";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPaymentMethod } from "@/types/donaive-software";

function DsFinanzasBancosInner() {
  const { banks, bankMovements, upsertBank } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<"USD" | "BS">("BS");
  const [methods, setMethods] = useState<DsPaymentMethod[]>([]);
  const [editId, setEditId] = useState<string | undefined>();
  const [msg, setMsg] = useState("");
  const [filterBank, setFilterBank] = useState("");

  const movs = useMemo(
    () =>
      bankMovements.filter((m) => !filterBank || m.bankId === filterBank),
    [bankMovements, filterBank],
  );

  function toggleMethod(code: DsPaymentMethod) {
    setMethods((prev) =>
      prev.includes(code) ? prev.filter((m) => m !== code) : [...prev, code],
    );
  }

  function save() {
    const r = upsertBank({
      id: editId,
      name,
      currency,
      paymentMethods: methods,
      active: true,
    });
    setMsg(r.ok ? "Banco guardado" : r.error);
    if (r.ok) {
      setName("");
      setMethods([]);
      setEditId(undefined);
    }
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.finanzas}>Finanzas</Link>
        <span>/</span>
        <span>Bancos</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Bancos</h1>
        <p className="ds-lead">
          Cada banco tiene moneda y métodos de pago. La venta suma al banco del
          método; CxP descuenta del banco con el que paga.
        </p>
        <div
          style={{
            display: "grid",
            gap: "0.65rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            marginTop: "0.85rem",
          }}
        >
          <label className="ds-label">
            Nombre
            <input
              className="ds-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Banesco, Zelle US..."
            />
          </label>
          <label className="ds-label">
            Moneda
            <select
              className="ds-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "USD" | "BS")}
            >
              <option value="BS">Bolívares</option>
              <option value="USD">Dólares</option>
            </select>
          </label>
        </div>
        <div className="ds-chip-row">
          {DS_PAYMENT_METHODS.map((m) => (
            <button
              key={m.code}
              type="button"
              className={`ds-chip${methods.includes(m.code) ? " ds-chip--active" : ""}`}
              onClick={() => toggleMethod(m.code)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ds-btn ds-btn--primary"
          style={{ marginTop: "0.75rem" }}
          onClick={save}
        >
          {editId ? "Actualizar banco" : "Crear banco"}
        </button>
        {msg ? <p>{msg}</p> : null}
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Saldos</h2>
        <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Banco</th>
                <th>Moneda</th>
                <th>Métodos</th>
                <th>Saldo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {banks.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.currency}</td>
                  <td className="ds-muted">{b.paymentMethods.join(", ") || "—"}</td>
                  <td>{formatDsNumber(bankBalance(b.id, bankMovements), 2)}</td>
                  <td>
                    <button
                      type="button"
                      className="ds-btn"
                      onClick={() => {
                        setEditId(b.id);
                        setName(b.name);
                        setCurrency(b.currency);
                        setMethods([...b.paymentMethods]);
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Movimientos</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select
              className="ds-input"
              style={{ marginTop: 0 }}
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
            >
              <option value="">Todos</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ds-btn"
              onClick={() =>
                downloadCsv(
                  "bancos-movimientos.csv",
                  [
                    "Fecha,Banco,Tipo,Monto,USD,Bs,Ref",
                    ...movs.map((m) => {
                      const bank = banks.find((b) => b.id === m.bankId)?.name ?? m.bankId;
                      return `${m.createdAt},${bank},${m.kind},${m.amount},${m.amountUsd},${m.amountBs},${m.reference}`;
                    }),
                  ].join("\n"),
                )
              }
            >
              Exportar CSV
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Banco</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {movs.slice(0, 80).map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleString("es-VE")}</td>
                  <td>{banks.find((b) => b.id === m.bankId)?.name ?? m.bankId}</td>
                  <td>{m.kind === "INCOME" ? "Ingreso" : "Egreso"}</td>
                  <td>{formatDsNumber(m.amount, 2)}</td>
                  <td className="ds-muted">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function DsFinanzasBancos() {
  return (
    <DsRequirePermission permission="finance.manage">
      <DsFinanzasBancosInner />
    </DsRequirePermission>
  );
}
