import { useMemo, useState } from "react";
import {
  customerDisplayName,
  prepaidAvailable,
  uid,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type { AdCustomer } from "@/types/ad-licoreria";

export default function AdLicoreriaClientes() {
  const {
    customers,
    products,
    presentations,
    upsertCustomer,
    getCustomerSummary,
  } = useAdLicoreria();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customers[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.documentId ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  const selected = customers.find((c) => c.id === selectedId);
  const summary = selectedId
    ? getCustomerSummary(selectedId)
    : undefined;

  function resetForm() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setDocumentId("");
    setNotes("");
    setEditingId(null);
  }

  function loadEdit(c: AdCustomer) {
    setEditingId(c.id);
    setFirstName(c.firstName);
    setLastName(c.lastName);
    setPhone(c.phone);
    setEmail(c.email ?? "");
    setAddress(c.address ?? "");
    setDocumentId(c.documentId ?? "");
    setNotes(c.notes ?? "");
    setSelectedId(c.id);
  }

  function save() {
    if (!phone.trim()) {
      setMsg("Teléfono obligatorio");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setMsg("Nombre y apellido obligatorios");
      return;
    }
    const customer: AdCustomer = {
      id: editingId ?? uid("cli"),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: customerDisplayName(firstName, lastName),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      documentId: documentId.trim() || undefined,
      notes: notes.trim() || undefined,
      active: true,
      createdAt:
        customers.find((c) => c.id === editingId)?.createdAt ??
        new Date().toISOString(),
    };
    const r = upsertCustomer(customer);
    setMsg(r.ok ? `Cliente ${customer.name} guardado` : r.error);
    if (r.ok) {
      setSelectedId(customer.id);
      resetForm();
    }
  }

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Clientes con teléfono obligatorio, historial de compras, pagos,
        prepagos, saldos y WhatsApp mock.
      </p>

      <section className="ad-panel grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <input
          className="ad-input"
          placeholder="Nombre *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Apellido *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Teléfono *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Identificación"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="ad-input"
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          className="ad-input sm:col-span-2 lg:col-span-3"
          placeholder="Observaciones"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
          <button type="button" className="ad-btn ad-btn--gold" onClick={save}>
            {editingId ? "Guardar cambios" : "Crear cliente"}
          </button>
          {editingId ? (
            <button type="button" className="ad-btn" onClick={resetForm}>
              Cancelar
            </button>
          ) : null}
        </div>
        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)] sm:col-span-2 lg:col-span-3">
            {msg}
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="ad-panel space-y-3">
          <input
            className="ad-input"
            placeholder="Buscar cliente…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ad-table-wrap max-h-[28rem] overflow-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={selectedId === c.id ? "bg-white/5" : undefined}
                  >
                    <td>
                      <button
                        type="button"
                        className="text-left text-[var(--ad-gold-soft)]"
                        onClick={() => setSelectedId(c.id)}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td>{c.phone}</td>
                    <td>
                      <button
                        type="button"
                        className="ad-btn"
                        onClick={() => loadEdit(c)}
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

        <section className="ad-panel space-y-4">
          {!selected || !summary ? (
            <p className="text-sm text-[var(--ad-muted)]">
              Seleccione un cliente
            </p>
          ) : (
            <>
              <div>
                <h2 className="ad-panel-title">Detalle · {selected.name}</h2>
                <p className="text-sm text-[var(--ad-muted)]">
                  Tel: {selected.phone}
                  {selected.email ? ` · ${selected.email}` : ""}
                  {selected.documentId ? ` · ID ${selected.documentId}` : ""}
                </p>
                <p className="text-xs text-[var(--ad-muted)]">
                  Alta: {new Date(selected.createdAt).toLocaleString("es-VE")} ·{" "}
                  {selected.active ? "ACTIVO" : "INACTIVO"}
                </p>
              </div>

              <div className="ad-grid-stats">
                <div className="ad-stat">
                  <div className="ad-stat__value">
                    ${summary.totals.totalPurchasedUsd.toFixed(0)}
                  </div>
                  <div className="ad-stat__label">Total comprado</div>
                </div>
                <div className="ad-stat">
                  <div className="ad-stat__value">
                    ${summary.totals.pendingBalanceUsd.toFixed(0)}
                  </div>
                  <div className="ad-stat__label">Saldo pendiente</div>
                </div>
                <div className="ad-stat">
                  <div className="ad-stat__value">
                    {summary.totals.lastPurchaseReceipt ?? "—"}
                  </div>
                  <div className="ad-stat__label">Última compra</div>
                </div>
                <div className="ad-stat">
                  <div className="ad-stat__value">
                    {summary.totals.activePrepaids}
                  </div>
                  <div className="ad-stat__label">Prepagos activos</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Historial de compras
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {summary.sales.map((s) => (
                      <li key={s.id}>
                        {s.receiptNumber} · ${s.total.usd.toFixed(2)} ·{" "}
                        {new Date(s.createdAt).toLocaleDateString("es-VE")}
                      </li>
                    ))}
                    {!summary.sales.length ? <li>Sin ventas</li> : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Pagos
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {summary.payments.slice(0, 10).map((p, i) => (
                      <li key={`${p.id}-${i}`}>
                        {p.method} {p.currency} {p.amount}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </li>
                    ))}
                    {!summary.payments.length ? <li>Sin pagos</li> : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Prepagos / mercancía QR
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {summary.prepaids.map((p) => (
                      <li key={p.id}>
                        {p.code} · {p.status} ·{" "}
                        {p.items.reduce(
                          (a, i) =>
                            a + prepaidAvailable(i.qtyPurchased, i.qtyConsumed),
                          0,
                        )}{" "}
                        disp.
                      </li>
                    ))}
                    {!summary.prepaids.length ? <li>Sin prepagos</li> : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Mercancía pendiente
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {summary.pendingMerchandise.map((p, i) => (
                      <li key={`${p.accountNumber}-${i}`}>
                        #{p.accountNumber}:{" "}
                        {products.find((x) => x.id === p.productId)?.name ??
                          p.productId}{" "}
                        (
                        {presentations.find((x) => x.id === p.presentationId)
                          ?.name ?? "—"}
                        ) sol.{p.requested}/serv.{p.served}/pend.{p.pending}
                      </li>
                    ))}
                    {!summary.pendingMerchandise.length ? (
                      <li>Sin pendientes</li>
                    ) : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Recibos
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {summary.receipts.map((r) => (
                      <li key={r.id}>
                        {r.number} · {r.kind} · ${r.total.usd.toFixed(2)}
                      </li>
                    ))}
                    {!summary.receipts.length ? <li>Sin recibos</li> : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    WhatsApp mock (listo para API)
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {summary.whatsappLogs.slice(0, 6).map((w) => (
                      <li key={w.id}>
                        {w.template} · {w.status} · {w.toPhone}
                      </li>
                    ))}
                    {!summary.whatsappLogs.length ? (
                      <li>Sin mensajes</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
