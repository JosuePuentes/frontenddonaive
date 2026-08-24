import { useMemo, useState } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { addDays, balanceForParty } from "@/lib/donaive-software/parties";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsClientesListaInner() {
  const { clients, receivables, upsertClient, addReceivable, collectReceivable, can } =
    useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const canManage = can("clients.manage");

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [creditLimitUsd, setCreditLimitUsd] = useState(0);
  const [creditDays, setCreditDays] = useState(15);
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chargeConcept, setChargeConcept] = useState("Venta a crédito");
  const [chargeAmount, setChargeAmount] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payTarget, setPayTarget] = useState("");

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clients) {
      map.set(
        c.id,
        balanceForParty(receivables.filter((r) => r.clientId === c.id)),
      );
    }
    return map;
  }, [clients, receivables]);

  const selectedReceivables = useMemo(
    () =>
      selectedId
        ? receivables.filter((r) => r.clientId === selectedId && r.balance > 0.009)
        : [],
    [receivables, selectedId],
  );

  function resetForm() {
    setEditId(null);
    setName("");
    setPhone("");
    setDocumentId("");
    setCreditLimitUsd(0);
    setCreditDays(15);
    setActive(true);
    setMsg("");
  }

  function loadClient(id: string) {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setEditId(c.id);
    setName(c.name);
    setPhone(c.phone ?? "");
    setDocumentId(c.documentId ?? "");
    setCreditLimitUsd(c.creditLimitUsd);
    setCreditDays(c.creditDays);
    setActive(c.active);
    setSelectedId(c.id);
  }

  function save() {
    if (!canManage) {
      setMsg("Sin permiso para gestionar clientes");
      return;
    }
    const r = upsertClient({
      id: editId ?? undefined,
      name,
      phone,
      documentId,
      creditLimitUsd,
      creditDays,
      active,
    });
    setMsg(r.ok ? "Cliente guardado" : r.error);
    if (r.ok) {
      setSelectedId(r.client.id);
      resetForm();
    }
  }

  function charge() {
    if (!selectedId) return;
    const r = addReceivable({
      clientId: selectedId,
      concept: chargeConcept,
      amount: Number(chargeAmount),
      currency: "USD",
      dueDate: addDays(
        new Date().toISOString().slice(0, 10),
        clients.find((c) => c.id === selectedId)?.creditDays ?? 0,
      ),
    });
    setMsg(r.ok ? "CxC registrada" : r.error);
    if (r.ok) {
      setChargeAmount("");
      setPayTarget(r.receivable.id);
    }
  }

  function collect() {
    if (!payTarget) {
      setMsg("Seleccione la cuenta a cobrar");
      return;
    }
    const r = collectReceivable({
      receivableId: payTarget,
      amount: Number(payAmount),
      method: "cobro",
    });
    setMsg(r.ok ? "Cobro registrado" : r.error);
    if (r.ok) setPayAmount("");
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.clientes}>Clientes</Link>
        <span>/</span>
        <span>Directorio</span>
      </nav>

      <section className="ds-panel">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div>
            <h1 className="ds-title">Clientes</h1>
            <p className="ds-lead">
              Directorio y cuentas por cobrar. Registra cargos a crédito y cobros.
            </p>
          </div>
          <Link className="ds-btn" to={routes.finanzasCuentas}>
            Ver CxC en Finanzas
          </Link>
        </div>

        <div style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Crédito</th>
                <th>Saldo CxC</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ds-muted">
                    Sin clientes aún.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.name}
                      {!c.active ? (
                        <span className="ds-muted"> · inactivo</span>
                      ) : null}
                      {c.documentId ? (
                        <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                          {c.documentId}
                        </div>
                      ) : null}
                    </td>
                    <td>{c.phone ?? "—"}</td>
                    <td>
                      ${formatDsNumber(c.creditLimitUsd, 2)} · {c.creditDays}d
                    </td>
                    <td>
                      <strong>${formatDsNumber(balances.get(c.id) ?? 0, 2)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ds-btn"
                        onClick={() => loadClient(c.id)}
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canManage ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            {editId ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <div
            style={{
              marginTop: "0.85rem",
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            }}
          >
            <label className="ds-label">
              Nombre *
              <input className="ds-input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="ds-label">
              Teléfono
              <input className="ds-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="ds-label">
              Documento
              <input
                className="ds-input"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              />
            </label>
            <label className="ds-label">
              Límite crédito USD
              <input
                className="ds-input"
                type="number"
                value={creditLimitUsd}
                onChange={(e) => setCreditLimitUsd(Number(e.target.value))}
              />
            </label>
            <label className="ds-label">
              Días crédito
              <input
                className="ds-input"
                type="number"
                value={creditDays}
                onChange={(e) => setCreditDays(Number(e.target.value))}
              />
            </label>
          </div>
          <label
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginTop: "0.75rem",
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Activo
          </label>
          <div style={{ marginTop: "0.85rem", display: "flex", gap: "0.5rem" }}>
            <button type="button" className="ds-btn ds-btn--primary" onClick={save}>
              Guardar
            </button>
            {editId ? (
              <button type="button" className="ds-btn" onClick={resetForm}>
                Cancelar
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {selectedId ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            CxC · {clients.find((c) => c.id === selectedId)?.name}
          </h2>
          <p className="ds-muted" style={{ fontSize: "0.85rem" }}>
            Saldo: ${formatDsNumber(balances.get(selectedId) ?? 0, 2)}
          </p>

          {canManage ? (
            <div
              style={{
                marginTop: "0.85rem",
                display: "grid",
                gap: "0.65rem",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              }}
            >
              <label className="ds-label">
                Concepto
                <input
                  className="ds-input"
                  value={chargeConcept}
                  onChange={(e) => setChargeConcept(e.target.value)}
                />
              </label>
              <label className="ds-label">
                Monto USD
                <input
                  className="ds-input"
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                />
              </label>
              <div style={{ display: "flex", alignItems: "end" }}>
                <button type="button" className="ds-btn ds-btn--primary" onClick={charge}>
                  Registrar cargo
                </button>
              </div>
            </div>
          ) : null}

          {selectedReceivables.length > 0 ? (
            <div style={{ marginTop: "1rem" }}>
              {selectedReceivables.map((r) => (
                <div key={r.id} className="ds-line-row">
                  <div>
                    <strong>{r.concept}</strong>
                    <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                      {r.status}
                      {r.dueDate ? ` · vence ${r.dueDate}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    ${formatDsNumber(r.balance, 2)}
                    <div>
                      <button
                        type="button"
                        className="ds-btn"
                        style={{ marginTop: "0.25rem" }}
                        onClick={() => setPayTarget(r.id)}
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {payTarget ? (
                <div
                  style={{
                    marginTop: "0.75rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    alignItems: "end",
                  }}
                >
                  <label className="ds-label">
                    Abono USD
                    <input
                      className="ds-input"
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                  </label>
                  <button type="button" className="ds-btn ds-btn--primary" onClick={collect}>
                    Registrar cobro
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
              Sin saldos pendientes.
            </p>
          )}
        </section>
      ) : null}

      {msg ? (
        <p
          style={{
            marginTop: "1rem",
            color:
              msg.includes("guardado") ||
              msg.includes("registrad") ||
              msg.includes("CxC")
                ? "var(--ds-ok)"
                : "var(--ds-danger)",
          }}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}

export default function DsClientesLista() {
  return (
    <DsRequirePermission permission={["clients.read", "clients.manage"]}>
      <DsClientesListaInner />
    </DsRequirePermission>
  );
}
