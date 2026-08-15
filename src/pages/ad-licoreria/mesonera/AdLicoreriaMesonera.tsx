import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AdAccountChargePanel } from "@/components/ad-licoreria/AdAccountChargePanel";
import { maskDocument } from "@/components/ad-licoreria/AdDocumentViews";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  accountAvailable,
  prepaidAvailable,
  multiplyPrice,
} from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";

const QUICK = [1, 2, 3, 4, 5, 6];

type PanelMode = "lista" | "detalle" | "agregar" | "servir" | "prepago";

/**
 * Mesonera operativa — Mis mesas (teléfono/tablet).
 * Cobro embebido: no navega a /ventas vacío.
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
    hasPermission,
  } = useAdLicoreria();

  const mesoneras = operators.filter((o) => o.role === "mesonera" && o.active);
  const session = getCurrentOperator();
  const canMesonera =
    !!session &&
    (hasPermission("accounts.open") ||
      hasPermission("accounts.serve") ||
      hasPermission("tables.manage") ||
      session.role === "admin");

  const [mesoneraId, setMesoneraId] = useState(
    session?.role === "mesonera" ? session.id : (mesoneras[0]?.id ?? ""),
  );
  const mesonera = operators.find((o) => o.id === mesoneraId);

  const myAccounts = useMemo(
    () => (mesoneraId ? getAccountsForMesonera(mesoneraId) : []),
    [getAccountsForMesonera, mesoneraId, accounts],
  );

  const [panel, setPanel] = useState<PanelMode>("lista");
  const [tableId, setTableId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [chargeOpen, setChargeOpen] = useState(false);
  const [qr, setQr] = useState(prepaids[0]?.code ?? "");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyDoc, setVerifyDoc] = useState("");
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

  if (!canMesonera) {
    return (
      <div className="ad-panel m-4 space-y-2">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          {session
            ? `${session.name} no tiene acceso a Mis mesas.`
            : "Sin sesión activa."}
        </p>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.inicio}>
          Volver
        </Link>
      </div>
    );
  }

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
    setAccountId("");
    setPanel("lista");
    setChargeOpen(false);
  }

  function openDetail(id: string, next: PanelMode = "detalle") {
    setAccountId(id);
    setPanel(next);
  }

  async function doOpen() {
    if (!mesonera) return;
    const r = await resolveAdResult(
      openAccount({
        tableId: tableId || undefined,
        mesoneraId: mesonera.id,
        mesoneraName: mesonera.name,
        warehouseId: mesonera.warehouseId ?? undefined,
      }),
    );
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setAccountId(r.data.id);
    setPanel("agregar");
    setMsg(`Cuenta #${r.data.number} abierta`);
  }

  async function addToAccount() {
    if (!account || !pres || !mesonera) return;
    const r = await resolveAdResult(
      addAccountItem({
        accountId: account.id,
        productId,
        presentationId: pres.id,
        qty,
        userName: mesonera.name,
        deductStock: false,
        warehouseId: mesonera.warehouseId ?? undefined,
      }),
    );
    setMsg(r.ok ? `+${qty} a #${account.number}` : r.error);
    if (r.ok) setPanel("detalle");
  }

  async function serve(n: number, itemId: string) {
    if (!account || !mesonera) return;
    const r = await resolveAdResult(
      serveAccountItem({
        accountId: account.id,
        itemId,
        qty: n,
        mesoneraName: mesonera.name,
        warehouseId: mesonera.warehouseId ?? undefined,
      }),
    );
    setMsg(r.ok ? `Servidas +${n}` : r.error);
  }

  async function consumePp(n: number) {
    if (!prepaid || !mesonera) return;
    if (!verifyPhone.trim() || !verifyDoc.trim()) {
      setMsg("Teléfono y cédula obligatorios para consumir");
      return;
    }
    const line =
      prepaid.items.find(
        (i) => prepaidAvailable(i.qtyPurchased, i.qtyConsumed) > 0,
      ) ?? prepaid.items[0];
    if (!line) {
      setMsg("Sin saldo");
      return;
    }
    const r = await resolveAdResult(
      consumePrepaid({
        prepaidId: prepaid.id,
        productId: line.productId,
        presentationId: line.presentationId,
        qty: n,
        mesoneraName: mesonera.name,
        verifyPhone: verifyPhone.trim(),
        verifyDocumentId: verifyDoc.trim(),
      }),
    );
    setMsg(r.ok ? `Prepago −${n}` : r.error);
  }

  return (
    <div className="ad-shell ad-mesonera-shell min-h-screen p-3 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <AdLicoreriaBrandMark size="sm" />
        <div className="flex flex-wrap gap-2">
          <select
            className="ad-select max-w-[10rem]"
            value={mesoneraId}
            onChange={(e) => selectMesonera(e.target.value)}
            aria-label="Mesonera"
          >
            {mesoneras.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`ad-btn ad-btn--touch ${panel === "prepago" ? "ad-btn--gold" : ""}`}
            onClick={() => setPanel(panel === "prepago" ? "lista" : "prepago")}
          >
            QR
          </button>
          <Link className="ad-btn ad-btn--touch" to={AD_LICORERIA_ROUTES.inicio}>
            Admin
          </Link>
        </div>
      </header>

      {panel !== "prepago" ? (
        <>
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <p className="ad-eyebrow">Operación de piso</p>
              <h1 className="ad-display text-3xl text-[var(--ad-gold-soft)]">
                Mis mesas
              </h1>
            </div>
            <span className="ad-badge">{myAccounts.length} abiertas</span>
          </div>

          <div className="ad-mesonera-grid">
            {myAccounts.map((a) => {
              const table = tables.find((t) => t.id === a.tableId);
              const total = a.items.reduce(
                (s, it) => s + it.unitPrice.usd * it.qty,
                0,
              );
              const paid = a.payments
                .filter((p) => p.currency === "USD")
                .reduce((s, p) => s + p.amount, 0);
              const served = a.items.reduce((s, it) => s + it.qtyServed, 0);
              const pending = a.items.reduce(
                (s, it) => s + accountAvailable(it.qty, it.qtyServed),
                0,
              );
              const mins = Math.max(
                0,
                Math.round(
                  (Date.now() - new Date(a.openedAt).getTime()) / 60000,
                ),
              );
              const active = accountId === a.id && panel !== "lista";
              return (
                <article
                  key={a.id}
                  className={`ad-mesa-card ${active ? "is-active" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="ad-eyebrow">
                        {table?.code ?? table?.number ?? "Sin espacio"}
                      </p>
                      <p className="text-base font-medium">
                        {a.customerName ?? "Cliente"}
                      </p>
                    </div>
                    <span className="ad-badge">{a.status}</span>
                  </div>
                  <p className="ad-display text-4xl text-[var(--ad-gold-soft)]">
                    ${total.toFixed(0)}
                  </p>
                  <p className="text-sm text-[var(--ad-muted)]">
                    Servido {served} · Pend {pending} · Saldo $
                    {Math.max(0, total - paid).toFixed(0)} · {mins} min
                  </p>
                  <div className="ad-mesa-actions">
                    <button
                      type="button"
                      className="ad-btn ad-btn--touch"
                      onClick={() => openDetail(a.id, "detalle")}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className="ad-btn ad-btn--touch ad-btn--gold"
                      onClick={() => openDetail(a.id, "agregar")}
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      className="ad-btn ad-btn--touch"
                      onClick={() => openDetail(a.id, "servir")}
                    >
                      Servir
                    </button>
                    <button
                      type="button"
                      className="ad-btn ad-btn--touch ad-btn--primary"
                      onClick={() => {
                        setAccountId(a.id);
                        setChargeOpen(true);
                      }}
                    >
                      Cobrar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {!myAccounts.length ? (
            <p className="mt-4 text-sm text-[var(--ad-muted)]">
              Sin cuentas asignadas a {mesonera?.name ?? "—"}
            </p>
          ) : null}

          <section className="ad-panel mt-4 space-y-2">
            <h2 className="ad-panel-title">Abrir mesa</h2>
            <div className="flex flex-wrap gap-2">
              <select
                className="ad-select max-w-xs flex-1"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              >
                <option value="">Espacio libre…</option>
                {myTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code ?? t.number} · {t.status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ad-btn ad-btn--gold ad-btn--touch"
                onClick={doOpen}
              >
                Abrir
              </button>
            </div>
          </section>

          {account && panel !== "lista" ? (
            <section className="ad-panel mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="ad-panel-title">
                  #{account.number} ·{" "}
                  {tables.find((t) => t.id === account.tableId)?.number ?? "—"}
                </h2>
                <button
                  type="button"
                  className="ad-btn"
                  onClick={() => {
                    setPanel("lista");
                    setAccountId("");
                  }}
                >
                  Volver
                </button>
              </div>
              <p className="text-sm text-[var(--ad-muted)]">
                {account.customerName ?? "Sin cliente"} · {account.mesoneraName}
              </p>

              <ul className="space-y-2">
                {account.items.map((it) => {
                  const pend = accountAvailable(it.qty, it.qtyServed);
                  return (
                    <li key={it.id} className="ad-line-item">
                      <div className="flex justify-between gap-2 text-sm">
                        <span>
                          {products.find((p) => p.id === it.productId)?.name} ×
                          {it.qty}
                        </span>
                        <span>
                          $
                          {multiplyPrice(it.unitPrice, it.qty).usd.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ad-muted)]">
                        Servido {it.qtyServed} · Pendiente {pend}
                      </p>
                      {panel === "servir" || panel === "detalle" ? (
                        <div className="ad-mesonera-pad mt-2">
                          {QUICK.map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="ad-btn ad-btn--touch"
                              disabled={n > pend}
                              onClick={() => serve(n, it.id)}
                            >
                              +{n}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {panel === "agregar" || panel === "detalle" ? (
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_5rem]">
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
                      className="ad-input"
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                  </div>
                  <button
                    type="button"
                    className="ad-btn ad-btn--primary ad-btn--touch w-full sm:w-auto"
                    onClick={addToAccount}
                  >
                    Agregar a la cuenta
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                className="ad-btn ad-btn--primary ad-btn--touch w-full"
                onClick={() => setChargeOpen(true)}
              >
                Cobrar esta mesa
              </button>
            </section>
          ) : null}
        </>
      ) : (
        <section className="ad-panel max-w-lg space-y-3">
          <h2 className="ad-panel-title">Prepago / QR</h2>
          <p className="text-sm text-[var(--ad-muted)]">
            El QR es solo un token. Consumo exige teléfono + cédula.
          </p>
          <input
            className="ad-input"
            value={qr}
            onChange={(e) => setQr(e.target.value)}
            placeholder="Código o token"
          />
          <input
            className="ad-input"
            value={verifyPhone}
            onChange={(e) => setVerifyPhone(e.target.value)}
            placeholder="Teléfono del titular"
          />
          <input
            className="ad-input"
            value={verifyDoc}
            onChange={(e) => setVerifyDoc(e.target.value)}
            placeholder="Cédula del titular"
          />
          {prepaid ? (
            <>
              <div className="rounded border border-[var(--ad-line)] p-3 text-sm">
                <p className="font-medium">{prepaid.customerName}</p>
                <p className="text-[var(--ad-muted)]">
                  {prepaid.customerPhone} ·{" "}
                  {maskDocument(prepaid.customerDocumentId)}
                </p>
                <p className="mt-1 text-xs">{prepaid.code}</p>
              </div>
              <div className="ad-mesonera-pad">
                {QUICK.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="ad-btn ad-btn--touch"
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

      {chargeOpen && account ? (
        <AdAccountChargePanel
          account={account}
          operatorName={mesonera?.name ?? "Mesonera"}
          onClose={() => setChargeOpen(false)}
          onDone={(m) => {
            setMsg(m);
            setPanel("lista");
            setAccountId("");
          }}
        />
      ) : null}
    </div>
  );
}
