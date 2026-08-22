import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";

/**
 * Bancos F7 — cuentas financieras por moneda (sin mezclar USD+Bs).
 */
export default function AdLicoreriaBancos() {
  const { hasPermission } = useAdLicoreria();
  const [summary, setSummary] = useState<Record<
    string,
    { balance: number; income: number; expense: number; transfers: number }
  > | null>(null);
  const [accounts, setAccounts] = useState<
    {
      id: string;
      name: string;
      type: string;
      currency: string;
      balance: number;
      active: boolean;
    }[]
  >([]);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<"USD" | "BS">("USD");
  const [type, setType] = useState("DIGITAL");
  const [opening, setOpening] = useState(0);
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await adFinanceClient.listAccounts();
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setSummary(r.data.summaryByCurrency);
    setAccounts(r.data.accounts);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!hasPermission("finance.manage")) {
      setMsg("Sin permiso finance.manage");
      return;
    }
    const r = await adFinanceClient.createAccount({
      name,
      type,
      currency,
      openingBalance: opening,
    });
    setMsg(r.ok ? "Cuenta creada" : r.error);
    if (r.ok) {
      setName("");
      setOpening(0);
      await load();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ad-ink)]">Bancos</h1>
          <p className="text-sm text-[var(--ad-muted)]">
            Cuentas financieras · saldos por moneda · sin mezcla engañosa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.movimientos}>
            Movimientos
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.casaCambio}>
            Casa de Cambio
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tasas}>
            Tasas
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["USD", "BS"] as const).map((cur) => (
            <section key={cur} className="ad-panel space-y-1">
              <h2 className="font-medium">Totales {cur}</h2>
              <p className="tabular-nums text-2xl">
                {summary[cur]?.balance.toFixed(2) ?? "0.00"}
              </p>
              <p className="text-xs text-[var(--ad-muted)]">
                Ingresos hoy {summary[cur]?.income.toFixed(2)} · Egresos{" "}
                {summary[cur]?.expense.toFixed(2)} · Transferencias{" "}
                {summary[cur]?.transfers.toFixed(2)}
              </p>
            </section>
          ))}
        </div>
      )}

      <section className="ad-panel space-y-2">
        <h2 className="font-medium">Cuentas</h2>
        <table className="ad-table w-full text-sm">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Moneda</th>
              <th>Saldo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td>{a.currency}</td>
                <td className="tabular-nums">{a.balance.toFixed(2)}</td>
                <td>{a.active ? "Activa" : "Inactiva"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {hasPermission("finance.manage") && (
        <section className="ad-panel space-y-2">
          <h2 className="font-medium">Nueva cuenta</h2>
          <input
            className="ad-input"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="ad-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="BANK">Banco</option>
            <option value="CASH">Efectivo</option>
            <option value="TILL">Caja</option>
            <option value="DIGITAL">Digital</option>
            <option value="OTHER">Otro</option>
          </select>
          <select
            className="ad-input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "USD" | "BS")}
          >
            <option value="USD">USD</option>
            <option value="BS">Bs</option>
          </select>
          <input
            className="ad-input"
            type="number"
            placeholder="Saldo inicial"
            value={opening}
            onChange={(e) => setOpening(Number(e.target.value))}
          />
          <button type="button" className="ad-btn" onClick={() => void create()}>
            Crear
          </button>
        </section>
      )}

      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
