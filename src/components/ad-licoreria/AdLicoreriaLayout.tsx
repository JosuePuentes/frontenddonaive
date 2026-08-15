import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { AdLicoreriaSidebar } from "@/components/ad-licoreria/AdLicoreriaSidebar";
import { AdLicoreriaTopbar } from "@/components/ad-licoreria/AdLicoreriaTopbar";
import {
  AdLicoreriaProvider,
  useAdLicoreria,
} from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { AdTvProvider } from "@/providers/ad-licoreria/AdTvProvider";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import { applySiteDesignToDom } from "@/lib/ad-licoreria/site-design";
import {
  canAccessPath,
  isTvPlayerPath,
} from "@/lib/ad-licoreria/route-access";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  clearAdSession,
  isAdSessionValid,
  loadAdSession,
  subscribeAdSession,
} from "@/services/ad-licoreria/session";
import { getAdDataSourceMode } from "@/services/ad-licoreria/repository-adapter";
import "@/components/ad-licoreria/ad-licoreria.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap";

function AdDesignApplier({ children }: { children: ReactNode }) {
  const { siteDesign } = useAdLicoreria();
  useEffect(() => {
    applySiteDesignToDom(siteDesign);
  }, [siteDesign]);
  return children;
}

function isPublicAdPath(normalizedPath: string): boolean {
  if (normalizedPath === "/" || normalizedPath === "/login") return true;
  return isTvPlayerPath(normalizedPath);
}

function AdRouteGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const path = normalizeAdLicoreriaPathname(pathname);
  const { getCurrentOperator, getRolePermissionMatrix } = useAdLicoreria();
  const session = getCurrentOperator();
  const matrix = getRolePermissionMatrix();
  const mode = getAdDataSourceMode();
  const apiSession = useSyncExternalStore(
    subscribeAdSession,
    loadAdSession,
    () => null,
  );

  if (isTvPlayerPath(path)) {
    return children;
  }

  if (mode === "api" && !isPublicAdPath(path)) {
    if (!isAdSessionValid(apiSession)) {
      if (apiSession) clearAdSession();
      return <Navigate to={AD_LICORERIA_ROUTES.login} replace />;
    }
  }

  if (!canAccessPath(session, path, matrix)) {
    return (
      <div className="ad-panel mx-auto mt-10 max-w-lg space-y-3">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
        <p className="text-sm text-[var(--ad-muted)]">
          {session
            ? `${session.name} (${session.role}) no tiene permiso para esta ruta.`
            : "Sin sesión activa."}
        </p>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.home}>
          Volver al Home
        </Link>
        {mode === "api" ? (
          <Link className="ad-btn ad-btn--gold" to={AD_LICORERIA_ROUTES.login}>
            Iniciar sesión
          </Link>
        ) : (
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.inicio}>
            Volver al inicio
          </Link>
        )}
      </div>
    );
  }

  return children;
}

function AdLicoreriaLayout() {
  const { pathname } = useLocation();
  const path = normalizeAdLicoreriaPathname(pathname);
  const isLanding = path === "/";
  const isLogin = path === "/login";
  const isMesonera = path === "/mesonera";
  const isTvPlayer = isTvPlayerPath(path);
  const isDesignPreview = path === "/configuracion/diseno/preview";
  const bare = isLanding || isLogin || isMesonera || isTvPlayer || isDesignPreview;

  useEffect(() => {
    const id = "ad-licoreria-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  return (
    <AdLicoreriaProvider>
      <AdTvProvider>
        <AdDesignApplier>
          <div className="ad-shell">
            {bare ? (
              <Outlet />
            ) : (
              <div className="ad-layout">
                <AdLicoreriaSidebar />
                <div className="ad-main">
                  <AdLicoreriaTopbar />
                  <div className="ad-content">
                    <AdRouteGate>
                      <Outlet />
                    </AdRouteGate>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdDesignApplier>
      </AdTvProvider>
    </AdLicoreriaProvider>
  );
}

export { AdLicoreriaLayout };
