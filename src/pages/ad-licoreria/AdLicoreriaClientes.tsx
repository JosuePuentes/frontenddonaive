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
    accounts,
    prepaids,
    sales,
    receipts,
    whatsappLogs,
    prepaidConsumptions,
    upsertCustomer,
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

  const history = useMemo(() => {
    if (!selected) return null;
    return {
      accounts: accounts.filter((a) => a.customerId === selected.id),
      sales: sales.filter((s) => s.customerId === selected.id),
      prepaids: prepaids.filter((p) => p.customerId === selected.id),
      receipts: receipts.filter((r) => r.customerId === selected.id),
      whatsapp: whatsappLogs.filter((w) => w.customerId === selected.id),
      pendingItems: accounts
        .filter((a) => a.customerId === selected.id)
        .flatMap((a) =>
          a.items
            .filter((i) => i.qty > i.qtyServed)
            .map((i) => ({
              account: a.number,
              productId: i.productId,
              pending: i.qty - i.qtyServed,
            })),
        ),
      prepaidBalance: prepaids
        .filter((p) => p.customerId === selected.id && p.status === "ACTIVO")
        .flatMap((p) =>
          p.items.map((i) => ({
            code: p.code,
            productId: i.productId,
            available: prepaidAvailable(i.qtyPurchased, i.qtyConsumed),
          })),
        ),
      payments: [
        ...sales
          .filter((s) => s.customerId === selected.id)
          .flatMap((s) =>
            s.payments.map((p) => ({
              ...p,
              source: `Venta ${s.receiptNumber}`,
            })),
          ),
        ...accounts
          .filter((a) => a.customerId === selected.id)
          .flatMap((a) =>
            a.payments.map((p) => ({
              ...p,
              source: `Cuenta #${a.number}`,
            })),
          ),
      ],
      consumptions: prepaidConsumptions.filter((c) =>
        prepaids.some(
          (p) => p.id === c.prepaidId && p.customerId === selected.id,
        ),
      ),
    };
  }, [
    selected,
    accounts,
    sales,
    prepaids,
    receipts,
    whatsappLogs,
    prepaidConsumptions,
  ]);

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
          {!selected ? (
            <p className="text-sm text-[var(--ad-muted)]">
              Seleccione un cliente
            </p>
          ) : (
            <>
              <div>
                <h2 className="ad-panel-title">{selected.name}</h2>
                <p className="text-sm text-[var(--ad-muted)]">
                  {selected.phone}
                  {selected.email ? ` · ${selected.email}` : ""}
                  {selected.documentId ? ` · ${selected.documentId}` : ""}
                </p>
                <p className="text-xs text-[var(--ad-muted)]">
                  Alta: {new Date(selected.createdAt).toLocaleString("es-VE")} ·{" "}
                  {selected.active ? "ACTIVO" : "INACTIVO"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Compras / ventas
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {history?.sales.map((s) => (
                      <li key={s.id}>
                        {s.receiptNumber} · ${s.total.usd.toFixed(2)} ·{" "}
                        {s.status}
                      </li>
                    ))}
                    {!history?.sales.length ? <li>Sin ventas</li> : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Pagos
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {history?.payments.slice(0, 8).map((p, i) => (
                      <li key={`${p.id}-${i}`}>
                        {p.source}: {p.method} {p.currency} {p.amount}
                      </li>
                    ))}
                    {!history?.payments.length ? <li>Sin pagos</li> : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Prepagos / saldo
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {history?.prepaidBalance.map((b, i) => (
                      <li key={`${b.code}-${i}`}>
                        {b.code}: {b.available} pend. ({b.productId})
                      </li>
                    ))}
                    {!history?.prepaidBalance.length ? (
                      <li>Sin saldo prepago</li>
                    ) : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Productos pendientes
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {history?.pendingItems.map((p, i) => (
                      <li key={`${p.account}-${i}`}>
                        Cuenta #{p.account}: {p.pending} ({p.productId})
                      </li>
                    ))}
                    {!history?.pendingItems.length ? (
                      <li>Sin pendientes</li>
                    ) : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    Recibos
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {history?.receipts.map((r) => (
                      <li key={r.id}>
                        {r.number} · {r.kind} · ${r.total.usd.toFixed(2)}
                      </li>
                    ))}
                    {!history?.receipts.length ? <li>Sin recibos</li> : null}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                    WhatsApp (mock)
                  </h3>
                  <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
                    {history?.whatsapp.slice(0, 5).map((w) => (
                      <li key={w.id}>
                        {w.template} · {w.status} ·{" "}
                        {new Date(w.createdAt).toLocaleString("es-VE")}
                      </li>
                    ))}
                    {!history?.whatsapp.length ? <li>Sin mensajes</li> : null}
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
