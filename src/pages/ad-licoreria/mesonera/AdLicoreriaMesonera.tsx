import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  accountAvailable,
  prepaidAvailable,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

const QUICK = [1, 2, 3, 4, 5, 6];

/**
 * Interfaz mesonera: mesas, cuentas, prepagos/QR y servicios rápidos.
 * Sin panel administrativo completo.
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
    closeAccount,
    findPrepaidByQr,
    consumePrepaid,
    getPresentationsFor,
    serviceLogs,
  } = useAdLicoreria();

  const mesoneras = operators.filter((o) => o.role === "mesonera");
  const [mode, setMode] = useState<"cuenta" | "prepago">("cuenta");
  const [mesoneraId, setMesoneraId] = useState(mesoneras[0]?.id ?? "");
  const [tableId, setTableId] = useState(
    tables.find((t) => t.status === "disponible")?.id ?? tables[0]?.id ?? "",
  );
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.status === "ABIERTA" || a.status === "PREPAGADA")
      ?.id ?? "",
  );
  const [qr, setQr] = useState(prepaids[0]?.code ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [presentationId, setPresentationId] = useState("");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const mesonera = operators.find((o) => o.id === mesoneraId);
  const openAccounts = accounts.filter(
    (a) =>
      a.status === "ABIERTA" ||
      a.status === "PREPAGADA" ||
      a.status === "PARCIALMENTE_PAGADA",
  );
  const account = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId],
  );
  const prepaid = useMemo(() => findPrepaidByQr(qr), [findPrepaidByQr, qr, prepaids]);
  const availablePres = getPresentationsFor(productId);
  const pres =
    presentations.find((p) => p.id === presentationId) ?? availablePres[0];

  function doOpen() {
    const r = openAccount({
      tableId,
      mesoneraId: mesonera?.id,
      mesoneraName: mesonera?.name ?? "Mesonera",
    });
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setAccountId(r.data.id);
    setMsg(`Cuenta #${r.data.number} abierta`);
  }

  function addToAccount() {
    if (!account || !pres) return;
    const r = addAccountItem({
      accountId: account.id,
      productId,
      presentationId: pres.id,
      qty,
      userName: mesonera?.name ?? "Mesonera",
      deductStock: false,
    });
    setMsg(r.ok ? `+${qty} agregadas a #${account.number}` : r.error);
  }

  function serve(n: number, itemId: string) {
    if (!account) return;
    const r = serveAccountItem({
      accountId: account.id,
      itemId,
      qty: n,
      mesoneraName: mesonera?.name ?? "Mesonera",
    });
    setMsg(r.ok ? `Servidas +${n}` : r.error);
  }

  function consumePp(n: number) {
    if (!prepaid) return;
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
      mesoneraName: mesonera?.name ?? "Mesonera",
    });
    setMsg(r.ok ? `Prepago −${n}` : r.error);
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <AdLicoreriaBrandMark size="sm" />
        <Link to={AD_LICORERIA_ROUTES.inicio} className="ad-btn">
          Admin
        </Link>
      </div>

      <p className="ad-eyebrow">Interfaz mesonera</p>
      <h1 className="ad-display mt-2 text-4xl text-[var(--ad-gold-soft)]">
        Operación rápida
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`ad-btn ${mode === "cuenta" ? "ad-btn--gold" : ""}`}
          onClick={() => setMode("cuenta")}
        >
          Cuenta / mesa
        </button>
        <button
          type="button"
          className={`ad-btn ${mode === "prepago" ? "ad-btn--gold" : ""}`}
          onClick={() => setMode("prepago")}
        >
          QR prepago
        </button>
      </div>

      <label className="mt-4 block space-y-1 text-xs text-[var(--ad-muted)]">
        Mesonera
        <select
          className="ad-select"
          value={mesoneraId}
          onChange={(e) => setMesoneraId(e.target.value)}
        >
          {mesoneras.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      {mode === "cuenta" ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <select
              className="ad-select"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {t.number}
                </option>
              ))}
            </select>
            <button type="button" className="ad-btn ad-btn--primary" onClick={doOpen}>
              Abrir cuenta
            </button>
          </div>

          <select
            className="ad-select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Seleccionar cuenta</option>
            {openAccounts.map((a) => {
              const t = tables.find((x) => x.id === a.tableId);
              return (
                <option key={a.id} value={a.id}>
                  #{a.number} · Mesa {t?.number ?? "—"}
                </option>
              );
            })}
          </select>

          {account ? (
            <section className="ad-panel space-y-3">
              <p className="ad-display text-3xl">#{account.number}</p>
              <p className="text-sm text-[var(--ad-muted)]">{account.status}</p>

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
              <div className="flex gap-2">
                <input
                  className="ad-input"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
                <button type="button" className="ad-btn ad-btn--gold" onClick={addToAccount}>
                  Agregar
                </button>
              </div>

              {account.items.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                const avail = accountAvailable(item.qty, item.qtyServed);
                return (
                  <div key={item.id} className="border border-[var(--ad-line)] p-3">
                    <p className="text-sm">
                      {p?.name}: {item.qtyServed}/{item.qty} · disp. {avail}
                    </p>
                    <div className="ad-mesonera-pad mt-2">
                      {QUICK.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="ad-btn ad-btn--primary"
                          disabled={n > avail}
                          onClick={() => serve(n, item.id)}
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="ad-btn w-full"
                onClick={() =>
                  closeAccount({
                    accountId: account.id,
                    userName: mesonera?.name ?? "Mesonera",
                  })
                }
              >
                Cerrar cuenta
              </button>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <input
            className="ad-input"
            value={qr}
            onChange={(e) => setQr(e.target.value)}
            placeholder="Escanear / pegar código QR"
          />
          {prepaid ? (
            <section className="ad-panel space-y-3">
              <p className="ad-display text-2xl text-[var(--ad-gold-soft)]">
                {prepaid.code}
              </p>
              {prepaid.items.map((l) => {
                const p = products.find((x) => x.id === l.productId);
                return (
                  <p key={l.id} className="text-sm">
                    {p?.name}:{" "}
                    {prepaidAvailable(l.qtyPurchased, l.qtyConsumed)} disp.
                  </p>
                );
              })}
              <div className="ad-mesonera-pad">
                {QUICK.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="ad-btn ad-btn--primary"
                    onClick={() => consumePp(n)}
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-sm text-[var(--ad-muted)]">Sin prepago</p>
          )}
        </div>
      )}

      {msg ? (
        <p className="mt-4 text-sm text-[var(--ad-gold-soft)]">{msg}</p>
      ) : null}

      <section className="ad-panel mt-4">
        <h2 className="ad-panel-title">Últimos servicios</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {serviceLogs.slice(0, 6).map((s) => (
            <li key={s.id}>
              {s.mesoneraName} · +{s.qtyServed} ·{" "}
              {new Date(s.createdAt).toLocaleTimeString("es-VE")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
