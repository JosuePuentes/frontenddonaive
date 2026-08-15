import { useEffect, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";

/**
 * Casa de Cambio F7 — conversión con tasa explícita sobre cuentas financieras.
 * No reinterpreta ventas originales.
 */
export default function AdLicoreriaCasaCambio() {
  const { hasPermission } = useAdLicoreria();
  const [accounts, setAccounts] = useState<
    { id: string; name: string; currency: string; balance: number }[]
  >([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState(0);
  const [rate, setRate] = useState(870);
  const [concept, setConcept] = useState("Cambio de moneda");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [prelim, setPrelim] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await adFinanceClient.listAccounts();
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
    })();
  }, []);

  async function doPreview() {
    const r = await adFinanceClient.previewExchange({
      fromAccountId: fromId,
      toAccountId: toId,
      amount,
      rateBsPerUsd: rate,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setPreview(r.data as Record<string, unknown>);
  }

  async function draftAndTotalize() {
    if (!hasPermission("finance.exchange")) {
      setMsg("Sin permiso finance.exchange");
      return;
    }
    const d = await adFinanceClient.createExchange({
      fromAccountId: fromId,
      toAccountId: toId,
      amount,
      rateBsPerUsd: rate,
      concept,
    });
    if (!d.ok) {
      setMsg(d.error);
      return;
    }
    const id = String((d.data as { id: string }).id);
    const t = await adFinanceClient.totalize(id);
    if (!t.ok) {
      setMsg(t.error);
      return;
    }
    setPrelim(t.data as Record<string, unknown>);
    setMsg("Preliminar listo");
  }

  async function confirm() {
    if (!prelim?.id) return;
    const c = await adFinanceClient.confirm(String(prelim.id));
    setMsg(c.ok ? "Cambio confirmado" : c.error);
    if (c.ok) {
      setPrelim(null);
      setPreview(null);
      const r = await adFinanceClient.listAccounts();
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
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Casa de Cambio</h1>
      <p className="text-sm text-[var(--ad-muted)]">
        Tasa explícita obligatoria. La venta original no se modifica.
      </p>

      <section className="ad-panel">
        <h2 className="mb-2 font-medium">Disponibilidad</h2>
        <table className="ad-table w-full text-sm">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Moneda</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.currency}</td>
                <td className="tabular-nums">{a.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ad-panel grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          Origen
          <select
            className="ad-input mt-1"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Destino
          <select
            className="ad-input mt-1"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Monto origen
          <input
            className="ad-input mt-1"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          Tasa (Bs / USD)
          <input
            className="ad-input mt-1"
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Concepto
          <input
            className="ad-input mt-1"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="button" className="ad-btn" onClick={() => void doPreview()}>
            Vista previa
          </button>
          <button
            type="button"
            className="ad-btn"
            onClick={() => void draftAndTotalize()}
          >
            Totalizar preliminar
          </button>
        </div>
      </section>

      {preview && (
        <pre className="overflow-auto rounded bg-black/5 p-3 text-xs">
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}

      {prelim && (
        <div className="ad-panel space-y-2">
          <h2 className="font-medium">Preliminar</h2>
          <pre className="overflow-auto text-xs">
            {JSON.stringify(
              (prelim as { document?: unknown }).document ?? prelim,
              null,
              2,
            )}
          </pre>
          <button type="button" className="ad-btn" onClick={() => void confirm()}>
            Confirmar cambio
          </button>
        </div>
      )}

      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
