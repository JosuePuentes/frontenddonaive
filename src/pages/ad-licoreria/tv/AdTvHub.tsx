import { Link } from "react-router";
import {
  AD_LICORERIA_ROUTES,
  adTvPlayerPath,
} from "@/constants/ad-licoreria-routes";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";

export default function AdTvHub() {
  const { hasPermission } = useAdLicoreria();
  const { screens, contents, groups, audit } = useAdTv();
  const canManageContent =
    hasPermission("tv.content.manage") || hasPermission("tv.manage");

  if (!hasPermission("tv.view")) {
    return (
      <div className="ad-panel">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          Se requiere permiso tv.view. Use admin / AdDemo#2026 o tvadmin /
          tvadmin.
        </p>
      </div>
    );
  }

  const online = screens.filter((s) => s.status === "ONLINE").length;
  const offline = screens.filter((s) => s.status === "OFFLINE").length;
  const pairing = screens.filter((s) => s.status === "PAIRING").length;
  const demoScreen = screens[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Digital Signage</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Pantallas TV
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ad-muted)]">
            Agregue contenido, abra el reproductor en la TV y reproduzca desde
            Control.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="ad-btn ad-btn--gold"
            to={AD_LICORERIA_ROUTES.tvContenido}
          >
            + Contenido
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tvControl}>
            Control central
          </Link>
        </div>
      </header>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Cómo usarlo (paso a paso)</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--ad-muted)]">
          <li>
            <strong className="text-[var(--ad-text)]">Contenido</strong> — suba
            una imagen o pegue URL (
            <Link
              className="text-[var(--ad-gold-soft)] underline"
              to={AD_LICORERIA_ROUTES.tvContenido}
            >
              ir a Contenido
            </Link>
            ).
          </li>
          <li>
            <strong className="text-[var(--ad-text)]">Entrar como TV</strong> —
            en el televisor abra el navegador y pulse{" "}
            {demoScreen ? (
              <Link
                className="text-[var(--ad-gold-soft)] underline"
                to={adTvPlayerPath(demoScreen.code)}
                target="_blank"
              >
                Abrir {demoScreen.code}
              </Link>
            ) : (
              "/tv/reproductor/TV-001"
            )}
            . Verá un código <code>A&amp;D-####</code> (sin login en la TV).
          </li>
          <li>
            <strong className="text-[var(--ad-text)]">Vincular</strong> — en{" "}
            <Link
              className="text-[var(--ad-gold-soft)] underline"
              to={AD_LICORERIA_ROUTES.tvPantallas}
            >
              Pantallas
            </Link>{" "}
            escriba ese código y pulse Vincular.
          </li>
          <li>
            <strong className="text-[var(--ad-text)]">Reproducir</strong> — en{" "}
            <Link
              className="text-[var(--ad-gold-soft)] underline"
              to={AD_LICORERIA_ROUTES.tvControl}
            >
              Control
            </Link>
            , elija el contenido y ▶ Reproducir.
          </li>
        </ol>
        {!canManageContent ? (
          <p className="text-sm text-[var(--ad-gold-soft)]">
            Su usuario no puede crear contenido. Entre como{" "}
            <code>admin</code> / <code>AdDemo#2026</code> o{" "}
            <code>tvadmin</code> / <code>tvadmin</code>.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ad-panel">
          <p className="text-xs uppercase tracking-wide text-[var(--ad-muted)]">
            Online
          </p>
          <p className="ad-display mt-1 text-3xl text-emerald-400">{online}</p>
        </div>
        <div className="ad-panel">
          <p className="text-xs uppercase tracking-wide text-[var(--ad-muted)]">
            Offline
          </p>
          <p className="ad-display mt-1 text-3xl text-rose-400">{offline}</p>
        </div>
        <div className="ad-panel">
          <p className="text-xs uppercase tracking-wide text-[var(--ad-muted)]">
            Emparejando
          </p>
          <p className="ad-display mt-1 text-3xl text-amber-300">{pairing}</p>
        </div>
        <div className="ad-panel">
          <p className="text-xs uppercase tracking-wide text-[var(--ad-muted)]">
            Contenidos
          </p>
          <p className="ad-display mt-1 text-3xl text-[var(--ad-gold-soft)]">
            {contents.filter((c) => c.active).length}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="ad-panel space-y-3">
          <h2 className="ad-panel-title">Accesos rápidos</h2>
          <div className="flex flex-wrap gap-2">
            <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tvPantallas}>
              Pantallas ({screens.length})
            </Link>
            <Link className="ad-btn ad-btn--gold" to={AD_LICORERIA_ROUTES.tvContenido}>
              Contenido ({contents.length})
            </Link>
            <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tvGrupos}>
              Grupos ({groups.length})
            </Link>
            <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tvControl}>
              Control
            </Link>
          </div>
          {demoScreen ? (
            <p className="text-sm text-[var(--ad-muted)]">
              Abrir como TV (reproductor):{" "}
              <Link
                className="text-[var(--ad-gold-soft)] underline"
                to={adTvPlayerPath(demoScreen.code)}
                target="_blank"
              >
                {demoScreen.code} · {demoScreen.name}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="ad-panel space-y-2">
          <h2 className="ad-panel-title">Actividad reciente</h2>
          {audit.length === 0 ? (
            <p className="text-sm text-[var(--ad-muted)]">Sin eventos aún.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {audit.slice(0, 8).map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span>
                    <span className="text-[var(--ad-gold-soft)]">{e.action}</span>
                    {" · "}
                    {e.detail}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--ad-muted)]">
                    {e.userName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
