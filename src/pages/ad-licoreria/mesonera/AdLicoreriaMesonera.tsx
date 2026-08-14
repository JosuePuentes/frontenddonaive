import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { accountAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

const QUICK = [1, 2, 3, 4, 5, 6, 8, 10];

/**
 * Interfaz simplificada para mesoneras: solo servir de cuentas activas.
 * Sin acceso al panel administrativo completo.
 */
export default function AdLicoreriaMesonera() {
  const { accounts, products, presentations, tables, serveAccount, serviceLogs } =
    useAdLicoreria();
  const active = accounts.filter(
    (a) => a.status === "abierta" || a.status === "prepago_activa",
  );
  const [accountId, setAccountId] = useState(active[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const account = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId],
  );
  const table = tables.find((t) => t.id === account?.tableId);
  const line = account?.lines[0];
  const product = products.find((p) => p.id === line?.productId);
  const presentation = presentations.find((p) => p.id === line?.presentationId);
  const available = line
    ? accountAvailable(line.qtyPaid, line.qtyServed)
    : 0;

  function serve(n: number) {
    if (!account || !line) return;
    const result = serveAccount({
      accountId: account.id,
      productId: line.productId,
      presentationId: line.presentationId,
      qty: n,
      mesoneraName: account.mesoneraName ?? "Mesonera",
    });
    setMsg(result.ok ? `Registrado: +${n} servidas` : result.error);
    if (result.ok) setQty(1);
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <AdLicoreriaBrandMark size="sm" />
        <Link to={AD_LICORERIA_ROUTES.inicio} className="ad-btn">
          Admin
        </Link>
      </div>

      <p className="ad-eyebrow">Interfaz mesonera</p>
      <h1 className="ad-display mt-2 text-4xl text-[var(--ad-gold-soft)]">
        Servir cuenta
      </h1>

      <div className="mt-6 space-y-4">
        <label className="block space-y-1 text-xs text-[var(--ad-muted)]">
          Cuenta activa
          <select
            className="ad-select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {active.map((a) => {
              const t = tables.find((x) => x.id === a.tableId);
              return (
                <option key={a.id} value={a.id}>
                  #{a.number} · Mesa {t?.number ?? "—"} · {a.mesoneraName}
                </option>
              );
            })}
          </select>
        </label>

        {account && line ? (
          <section className="ad-panel space-y-3">
            <div className="flex justify-between gap-3">
              <div>
                <p className="ad-eyebrow">Mesa {table?.number}</p>
                <p className="ad-display text-3xl">#{account.number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--ad-muted)]">Disponibles</p>
                <p className="ad-display text-4xl text-[var(--ad-gold-soft)]">
                  {available}
                </p>
              </div>
            </div>
            <p className="text-sm">
              {product?.name} · {presentation?.name}
            </p>
            <p className="text-xs text-[var(--ad-muted)]">
              Pagadas {line.qtyPaid} · Servidas {line.qtyServed}
            </p>

            <div className="ad-mesonera-pad">
              {QUICK.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="ad-btn ad-btn--primary"
                  disabled={n > available}
                  onClick={() => serve(n)}
                >
                  +{n}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="ad-input"
                type="number"
                min={1}
                max={available}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button
                type="button"
                className="ad-btn ad-btn--gold"
                onClick={() => serve(qty)}
              >
                Servir
              </button>
            </div>
            {msg ? (
              <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
            ) : null}
          </section>
        ) : (
          <p className="text-sm text-[var(--ad-muted)]">No hay cuentas activas.</p>
        )}

        <section className="ad-panel">
          <h2 className="ad-panel-title">Últimos servicios</h2>
          <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
            {serviceLogs.slice(0, 6).map((s) => (
              <li key={s.id}>
                {s.mesoneraName} · +{s.qtyServed} ·{" "}
                {new Date(s.createdAt).toLocaleTimeString("es-VE")}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
