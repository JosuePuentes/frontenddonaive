import { useState } from "react";
import { uid } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type { AdCustomer } from "@/types/ad-licoreria";

export default function AdLicoreriaClientes() {
  const { customers, accounts, prepaids, upsertCustomer } = useAdLicoreria();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  function create() {
    if (!name.trim()) {
      setMsg("Nombre obligatorio");
      return;
    }
    const customer: AdCustomer = {
      id: uid("cli"),
      name: name.trim(),
      phone: phone.trim() || undefined,
      documentId: documentId.trim() || undefined,
      notes: notes.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const r = upsertCustomer(customer);
    setMsg(r.ok ? `Cliente ${customer.name} creado` : r.error);
    if (r.ok) {
      setName("");
      setPhone("");
      setDocumentId("");
      setNotes("");
    }
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Clientes con historial de cuentas y prepagos. Persistencia API en fase
        posterior.
      </p>

      <section className="ad-panel grid gap-2 sm:grid-cols-2">
        <input
          className="ad-input"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Identificación (opcional)"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Observaciones"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="button" className="ad-btn ad-btn--gold sm:col-span-2" onClick={create}>
          Crear cliente
        </button>
        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)] sm:col-span-2">{msg}</p>
        ) : null}
      </section>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>ID</th>
              <th>Notas</th>
              <th>Cuentas</th>
              <th>Prepagos</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const linkedAcc = accounts.filter((a) => a.customerId === c.id);
              const linkedPp = prepaids.filter((p) => p.customerId === c.id);
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.documentId ?? "—"}</td>
                  <td>{c.notes ?? "—"}</td>
                  <td>
                    {linkedAcc.length
                      ? linkedAcc.map((a) => `#${a.number}`).join(", ")
                      : "—"}
                  </td>
                  <td>
                    {linkedPp.length
                      ? linkedPp.map((p) => p.code).join(", ")
                      : "—"}
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
