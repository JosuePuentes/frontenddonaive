import { accountAvailable } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaPrepagos() {
  const { accounts, products, presentations } = useAdLicoreria();
  const prepaid = accounts.filter((a) => a.prepaid);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Cuentas prepagadas: el cliente paga por adelantado y consume en visitas
        posteriores mientras la cuenta siga activa.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {prepaid.map((a) => (
          <article key={a.id} className="ad-panel">
            <p className="ad-eyebrow">Cuenta prepago</p>
            <h3 className="ad-display mt-1 text-3xl text-[var(--ad-gold-soft)]">
              #{a.number}
            </h3>
            <p className="mt-2 text-sm text-[var(--ad-muted)]">
              {a.customerName ?? "Cliente"} · {a.status}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {a.lines.map((l) => {
                const p = products.find((x) => x.id === l.productId);
                const pr = presentations.find((x) => x.id === l.presentationId);
                const avail = accountAvailable(l.qtyPaid, l.qtyServed);
                return (
                  <li
                    key={`${l.productId}-${l.presentationId}`}
                    className="border border-[var(--ad-line)] p-3"
                  >
                    <strong>{p?.name}</strong> · {pr?.name}
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="ad-display text-xl text-[var(--ad-text)]">
                          {l.qtyPaid}
                        </div>
                        Pagadas
                      </div>
                      <div>
                        <div className="ad-display text-xl text-[var(--ad-text)]">
                          {l.qtyServed}
                        </div>
                        Servidas
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
          </article>
        ))}
      </div>
    </div>
  );
}
