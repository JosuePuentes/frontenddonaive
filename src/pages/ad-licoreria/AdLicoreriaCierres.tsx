import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaCierres() {
  const { cash, sales, movements } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ad-muted)]">
        Cierres de caja y corte de inventario. La persistencia en API se
        conectará sin cambiar este flujo de UI.
      </p>
      <section className="ad-panel">
        <h2 className="ad-panel-title">Cierre sugerido (sesión actual)</h2>
        <ul className="space-y-2 text-sm">
          <li>
            Estado caja:{" "}
            <span className="text-[var(--ad-gold-soft)]">{cash.status}</span>
          </li>
          <li>Ventas: {sales.length}</li>
          <li>Movimientos inventario: {movements.length}</li>
          <li>
            Total USD ventas: $
            {sales.reduce((a, s) => a + s.total.usd, 0).toFixed(2)}
          </li>
        </ul>
        <button type="button" className="ad-btn mt-4" disabled>
          Cerrar turno (próximamente API)
        </button>
      </section>
    </div>
  );
}
