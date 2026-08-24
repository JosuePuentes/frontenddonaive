import { useMemo, useState } from "react";
import { Link } from "react-router";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { balanceForParty } from "@/lib/donaive-software/parties";
import { formatDsNumber } from "@/lib/donaive-software/purchase-draft";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsProveedoresListaInner() {
  const { suppliers, payables, upsertSupplier, payPayable } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [identification, setIdentification] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState<"USD" | "BS">("BS");
  const [creditDays, setCreditDays] = useState(15);
  const [creditLimit, setCreditLimit] = useState(0);
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payTarget, setPayTarget] = useState("");

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of suppliers) {
      map.set(
        s.id,
        balanceForParty(payables.filter((p) => p.supplierId === s.id)),
      );
    }
    return map;
  }, [suppliers, payables]);

  const openPayables = useMemo(
    () =>
      selectedId
        ? payables.filter((p) => p.supplierId === selectedId && p.balance > 0.009)
        : [],
    [payables, selectedId],
  );

  function resetForm() {
    setEditId(null);
    setName("");
    setIdentification("");
    setPhone("");
    setDefaultCurrency("BS");
    setCreditDays(15);
    setCreditLimit(0);
    setActive(true);
    setMsg("");
  }

  function loadSupplier(id: string) {
    const s = suppliers.find((x) => x.id === id);
    if (!s) return;
    setEditId(s.id);
    setName(s.name);
    setIdentification(s.identification ?? "");
    setPhone(s.phone ?? "");
    setDefaultCurrency(s.defaultCurrency);
    setCreditDays(s.creditDays);
    setCreditLimit(s.creditLimit);
    setActive(s.active);
    setSelectedId(s.id);
  }

  function save() {
    const r = upsertSupplier({
      id: editId ?? undefined,
      name,
      identification,
      phone,
      defaultCurrency,
      creditDays,
      creditLimit,
      active,
    });
    setMsg(r.ok ? "Proveedor guardado" : r.error);
    if (r.ok) {
      setSelectedId(r.supplier.id);
      resetForm();
    }
  }

  function pay() {
    if (!payTarget) {
      setMsg("Seleccione la cuenta a pagar");
      return;
    }
    const r = payPayable({
      payableId: payTarget,
      amount: Number(payAmount),
      method: "pago",
    });
    setMsg(r.ok ? "Pago registrado" : r.error);
    if (r.ok) setPayAmount("");
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.proveedores}>Proveedores</Link>
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
            <h1 className="ds-title">Proveedores</h1>
            <p className="ds-lead">
              Directorio y cuentas por pagar. Las compras a crédito generan CxP
              automáticamente.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link className="ds-btn" to={routes.comprasNueva}>
              Nueva compra
            </Link>
            <Link className="ds-btn" to={routes.finanzasCuentas}>
              Ver CxP en Finanzas
            </Link>
          </div>
        </div>

        <div style={{ marginTop: "1rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Crédito</th>
                <th>Saldo CxP</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ds-muted">
                    Sin proveedores. Créalos aquí o desde una compra.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.name}
                      {!s.active ? (
                        <span className="ds-muted"> · inactivo</span>
                      ) : null}
                      {s.identification ? (
                        <div className="ds-muted" style={{ fontSize: "0.75rem" }}>
                          {s.identification}
                        </div>
                      ) : null}
                    </td>
                    <td>{s.phone ?? "—"}</td>
                    <td>
                      {s.creditDays}d · límite {formatDsNumber(s.creditLimit, 0)}
                    </td>
                    <td>
                      <strong>{formatDsNumber(balances.get(s.id) ?? 0, 2)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ds-btn"
                        onClick={() => loadSupplier(s.id)}
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

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
          {editId ? "Editar proveedor" : "Nuevo proveedor"}
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
            RIF / ID
            <input
              className="ds-input"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
            />
          </label>
          <label className="ds-label">
            Teléfono
            <input className="ds-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="ds-label">
            Moneda habitual
            <select
              className="ds-input"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value as "USD" | "BS")}
            >
              <option value="BS">Bs</option>
              <option value="USD">USD</option>
            </select>
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
          <label className="ds-label">
            Límite crédito
            <input
              className="ds-input"
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
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

      {selectedId ? (
        <section className="ds-panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
            CxP · {suppliers.find((s) => s.id === selectedId)?.name}
          </h2>
          <p className="ds-muted" style={{ fontSize: "0.85rem" }}>
            Saldo: {formatDsNumber(balances.get(selectedId) ?? 0, 2)}
          </p>
          {openPayables.length === 0 ? (
            <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
              Sin saldos pendientes.
            </p>
          ) : (
            <div style={{ marginTop: "0.75rem" }}>
              {openPayables.map((p) => (
                <div key={p.id} className="ds-line-row">
                  <div>
                    <strong>#{p.invoiceNumber || p.id}</strong>
                    <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                      {p.status} · {p.currency}
                      {p.dueDate ? ` · vence ${p.dueDate}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {formatDsNumber(p.balance, 2)}
                    <div>
                      <button
                        type="button"
                        className="ds-btn"
                        style={{ marginTop: "0.25rem" }}
                        onClick={() => setPayTarget(p.id)}
                      >
                        Pagar
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
                    Abono
                    <input
                      className="ds-input"
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                  </label>
                  <button type="button" className="ds-btn ds-btn--primary" onClick={pay}>
                    Registrar pago
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {msg ? (
        <p
          style={{
            marginTop: "1rem",
            color:
              msg.includes("guardado") || msg.includes("registrado")
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

export default function DsProveedoresLista() {
  return (
    <DsRequirePermission permission="suppliers.manage">
      <DsProveedoresListaInner />
    </DsRequirePermission>
  );
}
