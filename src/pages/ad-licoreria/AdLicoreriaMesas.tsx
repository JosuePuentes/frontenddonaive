import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaMesas() {
  const { tables, accounts } = useAdLicoreria();

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ad-muted)]">
        Mesas con estado operativo. La mesonera opera desde una interfaz
        simplificada sin el panel admin completo.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tables.map((t) => {
          const account = accounts.find((a) => a.tableId === t.id);
          return (
            <article key={t.id} className="ad-panel">
              <p className="ad-eyebrow">Mesa</p>
              <h3 className="ad-display mt-1 text-3xl text-[var(--ad-gold-soft)]">
                {t.number}
              </h3>
              <p className="mt-2 text-sm text-[var(--ad-muted)]">
                Capacidad {t.capacity}
              </p>
              <span className="ad-badge mt-3">{t.status.replace("_", " ")}</span>
              {account ? (
                <p className="mt-3 text-sm">
                  Cuenta #{account.number}
                  <br />
                  <span className="text-[var(--ad-muted)]">
                    {account.mesoneraName ?? "Sin mesonera"}
                  </span>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn ad-btn--primary">
        Ir a interfaz mesonera
      </Link>
    </div>
  );
}
