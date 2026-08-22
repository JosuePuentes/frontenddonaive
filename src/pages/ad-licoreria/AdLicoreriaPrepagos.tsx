import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { prepaidAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaPrepagos() {
  const { prepaids, products, presentations, prepaidConsumptions } =
    useAdLicoreria();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
          Prepagos multiproducto con saldo por línea e historial de consumos. El
          QR solo identifica la cuenta (token opaco).
        </p>
        <Link to={AD_LICORERIA_ROUTES.qr} className="ad-btn ad-btn--gold">
          Consultar QR
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {prepaids.map((a) => (
          <article key={a.id} className="ad-panel">
            <p className="ad-eyebrow">{a.status}</p>
            <h3 className="ad-display mt-1 text-2xl text-[var(--ad-gold-soft)]">
              {a.code}
            </h3>
            <p className="mt-2 text-sm text-[var(--ad-muted)]">
              {a.customerName ?? "Cliente"}
              {a.customerPhone ? ` · ${a.customerPhone}` : ""}
              {a.receiptNumber ? ` · ${a.receiptNumber}` : ""}
            </p>
            <p className="mt-1 text-xs text-[var(--ad-muted)]">
              QR token (opaco):{" "}
              <code className="text-[var(--ad-gold-soft)]">{a.qrToken}</code>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {a.items.map((l) => {
                const p = products.find((x) => x.id === l.productId);
                const pr = presentations.find(
                  (x) => x.id === l.presentationId,
                );
                const avail = prepaidAvailable(l.qtyPurchased, l.qtyConsumed);
                return (
                  <li
                    key={l.id}
                    className="border border-[var(--ad-line)] p-3"
                  >
                    <strong>{p?.name}</strong> · {pr?.name}
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="ad-display text-xl">{l.qtyPurchased}</div>
                        Compradas
                      </div>
                      <div>
                        <div className="ad-display text-xl">{l.qtyConsumed}</div>
                        Consumidas
                      </div>
                      <div>
                        <div className="ad-display text-xl text-[var(--ad-gold-soft)]">
                          {avail}
                        </div>
                        Disponibles
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 text-xs text-[var(--ad-muted)]">
              Consumos:{" "}
              {prepaidConsumptions.filter((c) => c.prepaidId === a.id).length}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
