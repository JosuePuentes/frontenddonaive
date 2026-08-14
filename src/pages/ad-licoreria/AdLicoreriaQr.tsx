import { useMemo, useState } from "react";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { accountAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/**
 * El QR no embebe datos sensibles: solo token opaco.
 * Aquí se simula la consulta por token.
 */
export default function AdLicoreriaQr() {
  const { accounts, products, presentations } = useAdLicoreria();
  const [token, setToken] = useState(accounts[0]?.qrToken ?? "");

  const account = useMemo(
    () => accounts.find((a) => a.qrToken === token.trim()),
    [accounts, token],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Token QR (identificador seguro)</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          El código QR solo transporta un token. La cuenta se recupera en
          servidor/consulta; no se guardan saldos dentro del QR.
        </p>
        <input
          className="ad-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ad_qr_…"
        />
        {account ? (
          <div className="rounded-[2px] border border-dashed border-[var(--ad-line-strong)] p-4 text-center">
            <div className="mx-auto mb-3 inline-grid h-36 w-36 place-items-center bg-[repeating-linear-gradient(45deg,#d4af6a_0_2px,transparent_2px_8px)] opacity-80">
              <span className="bg-[var(--ad-bg-panel)] px-2 py-1 text-[0.65rem] tracking-widest text-[var(--ad-gold)]">
                QR
              </span>
            </div>
            <p className="text-xs text-[var(--ad-muted)] break-all">{account.qrToken}</p>
          </div>
        ) : null}
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Vista al escanear</h2>
        {account ? (
          <div className="space-y-3 text-center">
            <div className="flex justify-center">
              <AdLicoreriaBrandMark size="md" />
            </div>
            <p className="ad-display text-3xl text-[var(--ad-gold-soft)]">
              Cuenta #{account.number}
            </p>
            {account.lines.map((l) => {
              const p = products.find((x) => x.id === l.productId);
              const pr = presentations.find((x) => x.id === l.presentationId);
              return (
                <div
                  key={`${l.productId}-${l.presentationId}`}
                  className="border border-[var(--ad-line)] p-4 text-left"
                >
                  <p className="text-sm text-[var(--ad-muted)]">Producto</p>
                  <p className="text-lg">{p?.name}</p>
                  <p className="text-sm text-[var(--ad-muted)]">{pr?.name}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="ad-display text-2xl">{l.qtyPaid}</div>
                      Pagadas
                    </div>
                    <div>
                      <div className="ad-display text-2xl">{l.qtyServed}</div>
                      Servidas
                    </div>
                    <div>
                      <div className="ad-display text-2xl text-[var(--ad-gold-soft)]">
                        {accountAvailable(l.qtyPaid, l.qtyServed)}
                      </div>
                      Disponibles
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--ad-danger)]">Token no encontrado</p>
        )}
      </section>
    </div>
  );
}
