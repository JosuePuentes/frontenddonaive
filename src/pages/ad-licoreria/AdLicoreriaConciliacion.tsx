import { useEffect, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";
import { isAdApiDataSource } from "@/services/ad-licoreria/data-source";

/**
 * Fase 9 — Conciliación básica: saldo declarado vs sistema.
 * No modifica saldos; solo registra y audita.
 */
export default function AdLicoreriaConciliacion() {
  const { hasPermission } = useAdLicoreria();
  const [accounts, setAccounts] = useState<
    { id: string; name: string; currency: string; balance: number }[]
  >([]);
  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [declared, setDeclared] = useState(0);
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<unknown[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isAdApiDataSource()) return;
    void adFinanceClient.listAccounts().then((r) => {
      if (r.ok) {
        setAccounts(
          r.data.accounts.map((a) => ({
            id: a.id,
            name: a.name,
            currency: a.currency,
            balance: a.balance,
          })),
        );
      }
    });
    void adFinanceClient.listReconciliations().then((r) => {
      if (r.ok) setHistory(r.data as unknown[]);
    });
  }, []);

  async function doPreview() {
    if (!hasPermission("finance.reconcile")) {
      setMsg("Sin permiso finance.reconcile");
      return;
    }
    const r = await adFinanceClient.reconciliationPreview({
      accountId,
      from,
      to,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setPreview(r.data as Record<string, unknown>);
    setDeclared(Number((r.data as { systemBalance: number }).systemBalance));
    setMsg("");
  }

  async function save() {
    if (!hasPermission("finance.reconcile")) {
      setMsg("Sin permiso finance.reconcile");
      return;
    }
    const r = await adFinanceClient.createReconciliation({
      accountId,
      asOfDate: to,
      from,
      to,
      declaredBalance: declared,
      notes: notes || undefined,
    });
    setMsg(r.ok ? "Conciliación registrada" : r.error);
    if (r.ok) {
      const h = await adFinanceClient.listReconciliations();
      if (h.ok) setHistory(h.data as unknown[]);
    }
  }

  if (!hasPermission("finance.reconcile") && !hasPermission("finance.manage")) {
    return <p className="text-sm">Sin permiso para conciliación.</p>;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Conciliación financiera</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Compara saldo del sistema con el declarado. No altera saldos ni
          movimientos; queda auditado.
        </p>
      </header>

      <section className="ad-panel grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          Cuenta
          <select
            className="ad-select mt-1 block w-full"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Seleccione</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency}) · {a.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Desde
          <input
            className="ad-input mt-1 block w-full"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Hasta
          <input
            className="ad-input mt-1 block w-full"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button type="button" className="ad-btn" onClick={() => void doPreview()}>
          Calcular preview
        </button>
      </section>

      {preview ? (
        <section className="ad-panel grid gap-2 sm:grid-cols-3 text-sm">
          <div>Apertura calc.: <strong>{Number(preview.openingBalance).toFixed(2)}</strong></div>
          <div>Ingresos: <strong>{Number(preview.income).toFixed(2)}</strong></div>
          <div>Egresos: <strong>{Number(preview.expense).toFixed(2)}</strong></div>
          <div>Transf. in: <strong>{Number(preview.transfersIn).toFixed(2)}</strong></div>
          <div>Transf. out: <strong>{Number(preview.transfersOut).toFixed(2)}</strong></div>
          <div>Saldo calc.: <strong>{Number(preview.calculatedBalance).toFixed(2)}</strong></div>
          <div>Saldo sistema: <strong>{Number(preview.systemBalance).toFixed(2)}</strong></div>
          <label className="text-sm sm:col-span-2">
            Saldo declarado
            <input
              className="ad-input mt-1 block w-full"
              type="number"
              step="0.01"
              value={declared}
              onChange={(e) => setDeclared(Number(e.target.value))}
            />
          </label>
          <div>
            Diferencia (decl. − sist.):{" "}
            <strong>{(declared - Number(preview.systemBalance)).toFixed(2)}</strong>
          </div>
          <label className="text-sm sm:col-span-3">
            Observación
            <input
              className="ad-input mt-1 block w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button type="button" className="ad-btn" onClick={() => void save()}>
            Registrar conciliación
          </button>
        </section>
      ) : null}

      {msg ? <p className="text-sm">{msg}</p> : null}

      <section className="ad-panel">
        <h2 className="mb-2 font-medium">Histórico</h2>
        <pre className="overflow-auto text-xs">
          {JSON.stringify(history, null, 2)}
        </pre>
      </section>
    </div>
  );
}
