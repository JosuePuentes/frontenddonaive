import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  accountAvailable,
  prepaidAvailable,
  multiplyPrice,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

const QUICK = [1, 2, 3, 4, 5, 6];

/**
 * Interfaz mesonera: solo sus mesas/cuentas asignadas.
 */
export default function AdLicoreriaMesonera() {
  const {
    accounts,
    prepaids,
    products,
    presentations,
    tables,
    operators,
    openAccount,
    addAccountItem,
    serveAccountItem,
    findPrepaidByQr,
    consumePrepaid,
    getPresentationsFor,
    getAccountsForMesonera,
    setCurrentOperator,
    getCurrentOperator,
  } = useAdLicoreria();

  const mesoneras = operators.filter(
    (o) => o.role === "mesonera" && o.active,
  );
  const session = getCurrentOperator();
  const [mesoneraId, setMesoneraId] = useState(
    session?.role === "mesonera"
      ? session.id
      : (mesoneras[0]?.id ?? ""),
  );
  const mesonera = operators.find((o) => o.id === mesoneraId);

  const myAccounts = useMemo(
    () => (mesoneraId ? getAccountsForMesonera(mesoneraId) : []),
    [getAccountsForMesonera, mesoneraId, accounts],
  );

  const [mode, setMode] = useState<"cuenta" | "prepago">("cuenta");
  const [tableId, setTableId] = useState("");
  const [accountId, setAccountId] = useState(myAccounts[0]?.id ?? "");
  const [qr, setQr] = useState(prepaids[0]?.code ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const account = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId],
  );
  const prepaid = useMemo(
    () => findPrepaidByQr(qr),
    [findPrepaidByQr, qr, prepaids],
  );
  const availablePres = getPresentationsFor(productId);
  const pres =
    presentations.find((p) => p.id === presentationId) ?? availablePres[0];

  const myTables = tables.filter(
    (t) =>
      t.active &&
      (!mesonera?.warehouseId ||
        !t.warehouseId ||
        t.warehouseId === mesonera.warehouseId),
  );

  function selectMesonera(id: string) {
    setMesoneraId(id);
    setCurrentOperator(id);
    const first = getAccountsForMesonera(id)[0];
    setAccountId(first?.id ?? "");
  }

  function doOpen() {
    if (!mesonera) return;
    const r = openAccount({
      tableId: tableId || undefined,
      mesoneraId: mesonera.id,
      mesoneraName: mesonera.name,
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setAccountId(r.data.id);
    setMsg(`Cuenta #${r.data.number} abierta`);
  }

  function addToAccount() {
    if (!account || !pres || !mesonera) return;
    const r = addAccountItem({
      accountId: account.id,
      productId,
      presentationId: pres.id,
      qty,
      userName: mesonera.name,
      deductStock: false,
      warehouseId: mesonera.warehouseId ?? undefined,
    });
    setMsg(r.ok ? `+${qty} a #${account.number}` : r.error);
  }

  function serve(n: number, itemId: string) {
    if (!account || !mesonera) return;
    const r = serveAccountItem({
      accountId: account.id,
      itemId,
      qty: n,
      mesoneraName: mesonera.name,
      warehouseId: mesonera.warehouseId ?? undefined,
    });
    setMsg(r.ok ? `Servidas +${n}` : r.error);
  }

  function consumePp(n: number) {
    if (!prepaid || !mesonera) return;
    const line = prepaid.items.find(
      (i) => prepaidAvailable(i.qtyPurchased, i.qtyConsumed) > 0,
    );
    if (!line) {
      setMsg("Sin saldo");
      return;
    }
    const r = consumePrepaid({
      prepaidId: prepaid.id,
      productId: line.productId,
      presentationId: line.presentationId,
      qty: n,
      mesoneraName: mesonera.name,
    });
    setMsg(r.ok ? `Prepago −${n}` : r.error);
  }

  return (
    <div className="ad-shell min-h-screen p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <AdLicoreriaBrandMark size="sm" />
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.inicio}>
          Admin
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="ad-select max-w-xs"
          value={mesoneraId}
          onChange={(e) => selectMesonera(e.target.value)}
        >
          {mesoneras.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`ad-btn ${mode === "cuenta" ? "ad-btn--gold" : ""}`}
          onClick={() => setMode("cuenta")}
        >
          Mis mesas
        </button>
        <button
          type="button"
          className={`ad-btn ${mode === "prepago" ? "ad-btn--gold" : ""}`}
          onClick={() => setMode("prepago")}
        >
          Prepago / QR
        </button>
      </div>

      {mode === "cuenta" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <section className="space-y-3">
            <h2 className="ad-panel-title">Mis mesas</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {myAccounts.map((a) => {
                const table = tables.find((t) => t.id === a.tableId);
                const total = a.items.reduce(
                  (s, it) => s + it.unitPrice.usd * it.qty,
                  0,
                );
                const served = a.items.reduce((s, it) => s + it.qtyServed, 0);
                const pending = a.items.reduce(
                  (s, it) => s + accountAvailable(it.qty, it.qtyServed),
                  0,
                );
                return (
                  <article
                    key={a.id}
                    className={`ad-panel cursor-pointer ${accountId === a.id ? "ring-1 ring-[var(--ad-gold)]" : ""}`}
                    onClick={() => setAccountId(a.id)}
                  >
                    <p className="ad-eyebrow">
                      {table?.code ?? table?.number ?? "Sin espacio"}
                    </p>
                    <p className="text-sm">{a.customerName ?? "Cliente"}</p>
                    <p className="ad-display text-3xl text-[var(--ad-gold-soft)]">
                      ${total.toFixed(0)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ad-muted)]">
                      Servido: {served} · Pendiente: {pending}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="ad-badge">Ver cuenta</span>
                    </div>
                  </article>
                );
              })}
              {!myAccounts.length ? (
                <p className="text-sm text-[var(--ad-muted)]">
                  Sin cuentas asignadas a {mesonera?.name ?? "—"}
                </p>
              ) : null}
            </div>

            <div className="ad-panel space-y-2">
              <h3 className="ad-panel-title">Abrir cuenta</h3>
              <select
                className="ad-select"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              >
                <option value="">Espacio</option>
                {myTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code ?? t.number} · {t.status}
                  </option>
                ))}
              </select>
              <button type="button" className="ad-btn ad-btn--gold" onClick={doOpen}>
                Abrir
              </button>
            </div>
          </section>

          <section className="ad-panel space-y-3">
            <h2 className="ad-panel-title">
              Cuenta #{account?.number ?? "—"}
            </h2>
            {account ? (
              <>
                <p className="text-sm text-[var(--ad-muted)]">
                  {account.customerName ?? "Sin cliente"} ·{" "}
                  {account.mesoneraName}
                </p>
                <ul className="space-y-2">
                  {account.items.map((it) => {
                    const pend = accountAvailable(it.qty, it.qtyServed);
                    return (
                      <li
                        key={it.id}
                        className="border border-[var(--ad-line)] p-2"
                      >
                        <div className="flex justify-between gap-2 text-sm">
                          <span>
                            {products.find((p) => p.id === it.productId)?.name} ×
                            {it.qty}
                          </span>
                          <span>
                            ${multiplyPrice(it.unitPrice, it.qty).usd.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ad-muted)]">
                          Servido {it.qtyServed} · Pendiente {pend}
                        </p>
                        <div className="ad-mesonera-pad mt-2">
                          {QUICK.map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="ad-btn"
                              disabled={n > pend}
                              onClick={() => serve(n, it.id)}
                            >
                              +{n}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <select
                    className="ad-select"
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      setPresentationId("");
                    }}
                  >
                    {products
                      .filter((p) => p.active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                  <select
                    className="ad-select"
                    value={pres?.id ?? ""}
                    onChange={(e) => setPresentationId(e.target.value)}
                  >
                    {availablePres.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="ad-input w-20"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </div>
                <button
                  type="button"
                  className="ad-btn ad-btn--primary"
                  onClick={addToAccount}
                >
                  Agregar
                </button>
              </>
            ) : (
              <p className="text-sm text-[var(--ad-muted)]">
                Seleccione una de sus mesas
              </p>
            )}
          </section>
        </div>
      ) : (
        <section className="ad-panel max-w-lg space-y-3">
          <h2 className="ad-panel-title">Prepago / QR</h2>
          <input
            className="ad-input"
            value={qr}
            onChange={(e) => setQr(e.target.value)}
            placeholder="Código o token"
          />
          {prepaid ? (
            <>
              <p className="text-sm">
                {prepaid.code} · {prepaid.customerName}
              </p>
              <div className="ad-mesonera-pad">
                {QUICK.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="ad-btn"
                    onClick={() => consumePp(n)}
                  >
                    −{n}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--ad-muted)]">No encontrado</p>
          )}
        </section>
      )}

      {msg ? (
        <p className="mt-4 text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}
    </div>
  );
}
