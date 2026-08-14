import { AD_LICORERIA_MEDIA, adLicoreriaBrand } from "@/content/ad-licoreria/brand";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaConfiguracion() {
  const { warehouses, cash } = useAdLicoreria();

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Configuración del portal. Persistencia y dominio propio se conectarán
        después; esta fase es frontend + estado local.
      </p>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Identidad</h2>
        <p>
          {adLicoreriaBrand.name} — {adLicoreriaBrand.tagline}
        </p>
        <p className="text-sm text-[var(--ad-muted)]">
          Logo oficial: <code>{AD_LICORERIA_MEDIA.logo}</code>
        </p>
        <p className="text-xs text-[var(--ad-muted)]">
          Coloque el archivo del propietario en{" "}
          <code>public/ad-licoreria/logo/oficial.png</code>. No inventar logo.
        </p>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Depósitos</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {warehouses.map((w) => (
            <li key={w.id}>
              {w.name} ({w.code}) · {w.kind}
            </li>
          ))}
        </ul>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Caja</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Sesión: {cash.status} · Fondo USD ${cash.openingFloatUsd} · BS{" "}
          {cash.openingFloatBs.toLocaleString("es-VE")}
        </p>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Rutas / dominio</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          <li>Namespace actual: <code>/licoreria</code></li>
          <li>
            Dominio propio: preparado vía <code>isAdLicoreriaHost()</code> (sin
            DNS real todavía)
          </li>
          <li>
            Dev: <code>VITE_AD_LICORERIA_HOST=true</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
