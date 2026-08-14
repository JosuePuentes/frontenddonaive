import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCaja() {
  const { cash, sales } = useAdLicoreria();
  const salesUsd = sales.reduce((a, s) => a + s.total.usd, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Sesión de caja</h2>
        <p className="ad-display text-4xl text-[var(--ad-gold-soft)]">
          {cash.status === "open" ? "ABIERTA" : "CERRADA"}
        </p>
        <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
          <li>Abierta por: {cash.openedBy}</li>
          <li>Desde: {new Date(cash.openedAt).toLocaleString("es-VE")}</li>
          <li>Fondo USD: ${cash.openingFloatUsd.toFixed(2)}</li>
          <li>Fondo BS: Bs {cash.openingFloatBs.toLocaleString("es-VE")}</li>
        </ul>
      </section>
      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Resumen sesión</h2>
        <div className="ad-stat">
          <div className="ad-stat__value">${salesUsd.toFixed(2)}</div>
          <div className="ad-stat__label">Ventas USD registradas</div>
        </div>
        <p className="text-sm text-[var(--ad-muted)]">
          {sales.length} venta(s) en esta sesión demo.
        </p>
      </section>
    </div>
  );
}
