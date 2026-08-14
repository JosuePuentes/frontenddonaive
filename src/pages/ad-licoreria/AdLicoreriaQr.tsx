import { useMemo, useState } from "react";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { prepaidAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

const QUICK = [1, 2, 3, 4, 5];

export default function AdLicoreriaQr() {
  const {
    prepaids,
    products,
    presentations,
    prepaidConsumptions,
    findPrepaidByQr,
    consumePrepaid,
  } = useAdLicoreria();
  const [token, setToken] = useState(prepaids[0]?.qrToken ?? "");
  const [qty, setQty] = useState(1);
  const [lineKey, setLineKey] = useState("");
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
    const result = consumePrepaid({
      prepaidId: account.id,
      productId: activeLine.productId,
      presentationId: activeLine.presentationId,
      qty: n,
      mesoneraName: "María",
    });
    setMsg(result.ok ? `Consumo +${n} registrado` : result.error);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Identificador QR (token / código)</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          El QR no embebe saldos ni datos sensibles: solo un token/código que
          recupera la cuenta.
        </p>
        <input
          className="ad-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="PRE-2026-000125 o ad_qr_…"
        />
        {account ? (
          <div className="rounded-[2px] border border-dashed border-[var(--ad-line-strong)] p-4 text-center">
            <div className="mx-auto mb-3 inline-grid h-36 w-36 place-items-center bg-[repeating-linear-gradient(45deg,#d4af6a_0_2px,transparent_2px_8px)] opacity-80">
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
            <p className="text-center text-sm text-[var(--ad-muted)]">
              {account.customerName ?? "Cliente"} · {account.status} ·{" "}
              {new Date(account.createdAt).toLocaleDateString("es-VE")}
            </p>

            {account.items.map((l) => {
              const p = products.find((x) => x.id === l.productId);
              const pr = presentations.find((x) => x.id === l.presentationId);
              return (
                <div
                  key={l.id}
                  className="border border-[var(--ad-line)] p-4"
                >
                  <p className="text-lg">
                    {p?.name} · {pr?.name}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="ad-display text-2xl">{l.qtyPurchased}</div>
                      Compradas
                    </div>
                    <div>
                      <div className="ad-display text-2xl">{l.qtyConsumed}</div>
                      Consumidas
                    </div>
                    <div>
                      <div className="ad-display text-2xl text-[var(--ad-gold-soft)]">
                        {prepaidAvailable(l.qtyPurchased, l.qtyConsumed)}
                      </div>
                      Disponibles
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="space-y-2 border-t border-[var(--ad-line)] pt-3">
              <p className="ad-panel-title">Registrar consumo</p>
              <select
                className="ad-select"
                value={
                  lineKey ||
                  `${activeLine?.productId}:${activeLine?.presentationId}`
                }
                onChange={(e) => setLineKey(e.target.value)}
              >
                {account.items.map((l) => {
                  const p = products.find((x) => x.id === l.productId);
                  return (
                    <option
                      key={l.id}
                      value={`${l.productId}:${l.presentationId}`}
                    >
                      {p?.name} · disp.{" "}
                      {prepaidAvailable(l.qtyPurchased, l.qtyConsumed)}
                    </option>
                  );
                })}
              </select>
              <div className="ad-mesonera-pad">
                {QUICK.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="ad-btn ad-btn--primary"
                    onClick={() => consume(n)}
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
              {msg ? (
                <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p>
              ) : null}
            </div>

            <div>
              <p className="ad-panel-title">Historial</p>
              <ul className="space-y-1 text-xs text-[var(--ad-muted)]">
                {prepaidConsumptions
                  .filter((c) => c.prepaidId === account.id)
                  .map((c) => (
                    <li key={c.id}>
                      {c.mesoneraName} · −{c.qty} ·{" "}
                      {new Date(c.createdAt).toLocaleString("es-VE")}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--ad-danger)]">
            Token/código no encontrado
          </p>
        )}
      </section>
    </div>
  );
}
