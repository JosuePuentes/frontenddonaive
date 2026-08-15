import { useMemo, useState } from "react";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { maskDocument } from "@/components/ad-licoreria/AdDocumentViews";
import { prepaidAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

const QUICK = [1, 2, 3, 4, 5];

/**
 * Consumo QR: token opaco + teléfono + cédula obligatorios.
 */
export default function AdLicoreriaQr() {
  const {
    prepaids,
    products,
    presentations,
    prepaidConsumptions,
    findPrepaidByQr,
    consumePrepaid,
    getCurrentOperator,
  } = useAdLicoreria();

  const session = getCurrentOperator();
  const [token, setToken] = useState(prepaids[0]?.qrToken ?? "");
  const [qty, setQty] = useState(1);
  const [lineKey, setLineKey] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyDoc, setVerifyDoc] = useState("");
  const [msg, setMsg] = useState("");

  const account = useMemo(
    () => findPrepaidByQr(token),
    [findPrepaidByQr, token, prepaids],
  );

  const activeLine =
    account?.items.find(
      (i) => `${i.productId}:${i.presentationId}` === lineKey,
    ) ?? account?.items[0];

  function consume(n: number) {
    if (!account || !activeLine) return;
    if (!verifyPhone.trim() || !verifyDoc.trim()) {
      setMsg("Teléfono y cédula obligatorios");
      return;
    }
    const result = consumePrepaid({
      prepaidId: account.id,
      productId: activeLine.productId,
      presentationId: activeLine.presentationId,
      qty: n,
      mesoneraName: session?.name ?? "Operador",
      verifyPhone: verifyPhone.trim(),
      verifyDocumentId: verifyDoc.trim(),
    });
    setMsg(result.ok ? `Consumo +${n} registrado` : result.error);
  }

  const history = prepaidConsumptions.filter(
    (c) => account && c.prepaidId === account.id,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Identificador QR (token)</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Una fotografía del QR no basta. Debe verificar teléfono y cédula del
          titular antes de consumir.
        </p>
        <input
          className="ad-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="PRE-2026-000125 o ad_qr_…"
        />
        <input
          className="ad-input"
          value={verifyPhone}
          onChange={(e) => setVerifyPhone(e.target.value)}
          placeholder="Teléfono del titular *"
        />
        <input
          className="ad-input"
          value={verifyDoc}
          onChange={(e) => setVerifyDoc(e.target.value)}
          placeholder="Cédula del titular *"
        />
        {account ? (
          <div className="rounded-[2px] border border-dashed border-[var(--ad-line-strong)] p-4 text-center">
            <div className="mx-auto mb-3 inline-grid h-28 w-28 place-items-center bg-[repeating-linear-gradient(45deg,#d4af6a_0_2px,transparent_2px_8px)] opacity-80">
              <span className="bg-[var(--ad-bg-panel)] px-2 py-1 text-[0.65rem] tracking-widest text-[var(--ad-gold)]">
                QR
              </span>
            </div>
            <p className="font-mono text-sm text-[var(--ad-gold-soft)]">
              {account.code}
            </p>
            <p className="mt-1 break-all text-xs text-[var(--ad-muted)]">
              {account.qrToken}
            </p>
          </div>
        ) : null}
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Vista al escanear</h2>
        {account ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <AdLicoreriaBrandMark size="md" />
            </div>
            <p className="text-center ad-display text-3xl text-[var(--ad-gold-soft)]">
              {account.code}
            </p>
            <dl className="ad-doc__meta">
              <div>
                <dt>Titular</dt>
                <dd>{account.customerName ?? "—"}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{account.customerPhone ?? "—"}</dd>
              </div>
              <div>
                <dt>Cédula</dt>
                <dd>{maskDocument(account.customerDocumentId)}</dd>
              </div>
              <div>
                <dt>Recibo</dt>
                <dd>{account.receiptNumber ?? "—"}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <span className="ad-badge">{account.status}</span>
                </dd>
              </div>
            </dl>

            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Orig.</th>
                    <th>Cons.</th>
                    <th>Rest.</th>
                  </tr>
                </thead>
                <tbody>
                  {account.items.map((it) => {
                    const rest = prepaidAvailable(
                      it.qtyPurchased,
                      it.qtyConsumed,
                    );
                    const key = `${it.productId}:${it.presentationId}`;
                    return (
                      <tr
                        key={it.id}
                        className={
                          key ===
                          `${activeLine?.productId}:${activeLine?.presentationId}`
                            ? "bg-[rgba(212,175,106,0.06)]"
                            : undefined
                        }
                        onClick={() => setLineKey(key)}
                      >
                        <td>
                          {products.find((p) => p.id === it.productId)?.name}
                          <div className="text-xs text-[var(--ad-muted)]">
                            {
                              presentations.find(
                                (p) => p.id === it.presentationId,
                              )?.name
                            }
                          </div>
                        </td>
                        <td>{it.qtyPurchased}</td>
                        <td>{it.qtyConsumed}</td>
                        <td>{rest}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                className="ad-input w-24"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button
                type="button"
                className="ad-btn ad-btn--gold"
                onClick={() => consume(qty)}
              >
                Consumir
              </button>
            </div>
            <div className="ad-mesonera-pad">
              {QUICK.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="ad-btn ad-btn--touch"
                  onClick={() => consume(n)}
                >
                  −{n}
                </button>
              ))}
            </div>

            {history.length ? (
              <div>
                <p className="ad-eyebrow mb-2">Consumos recientes</p>
                <ul className="space-y-1 text-xs text-[var(--ad-muted)]">
                  {history.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      −{c.qty} · {c.mesoneraName} ·{" "}
                      {new Date(c.createdAt).toLocaleString("es-VE")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--ad-muted)]">
            Ingrese un token o código válido
          </p>
        )}
        {msg ? (
          <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
        ) : null}
      </section>
    </div>
  );
}
