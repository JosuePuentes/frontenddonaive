import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCierres() {
  const { cash, sales, movements } = useAdLicoreria();
  const salesUsd = sales.reduce((a, s) => a + s.total.usd, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ad-muted)]">
        Caja y cierres de turno. Persistencia API en fase posterior; ahora es
        estado local/mock.
      </p>

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
            <li>
              Fondo BS: Bs {cash.openingFloatBs.toLocaleString("es-VE")}
            </li>
          </ul>
        </section>

        <section className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Cierre sugerido</h2>
          <ul className="space-y-2 text-sm">
            <li>Ventas: {sales.length}</li>
            <li>Movimientos inventario: {movements.length}</li>
            <li>Total USD ventas: ${salesUsd.toFixed(2)}</li>
          </ul>
          <button type="button" className="ad-btn mt-2" disabled>
            Cerrar turno (próximamente API)
          </button>
        </section>
      </div>
    </div>
  );
}
