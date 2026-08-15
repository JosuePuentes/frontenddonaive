import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router";
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
  filterNavForUser,
  mobilePrimaryNavKeys,
} from "@/lib/ad-licoreria/nav-by-role";
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

function AdMobileBottomNav({ onOpenMore }: { onOpenMore: () => void }) {
  const { getCurrentOperator, getRolePermissionMatrix } = useAdLicoreria();
  const session = getCurrentOperator();
  const matrix = getRolePermissionMatrix();
  const items = filterNavForUser(session, matrix);
  const keys = mobilePrimaryNavKeys(session?.role);
  const primary = useMemo(() => {
    const picked = keys
      .map((k) => items.find((i) => i.key === k))
      .filter(Boolean) as typeof items;
    return picked.slice(0, 4);
  }, [items, keys]);

  if (!primary.length) return null;

  return (
    <nav className="ad-mobile-tabbar" aria-label="Atajos móviles">
      {primary.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          className={({ isActive }) =>
            ["ad-mobile-tab", isActive ? "is-active" : ""].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
      <button type="button" className="ad-mobile-tab" onClick={onOpenMore}>
        Más
      </button>
    </nav>
  );
}

function AdLicoreriaShell() {
  const { pathname } = useLocation();
  const path = normalizeAdLicoreriaPathname(pathname);
  const isLanding = path === "/";
  const isLogin = path === "/login";
  const isMesonera = path === "/mesonera";
  const isTvPlayer = isTvPlayerPath(path);
  const isDesignPreview = path === "/configuracion/diseno/preview";
  const bare = isLanding || isLogin || isMesonera || isTvPlayer || isDesignPreview;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const id = "ad-licoreria-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  if (bare) {
    return <Outlet />;
  }

  return (
    <div className={`ad-layout ${menuOpen ? "ad-layout--menu-open" : ""}`}>
      <AdLicoreriaSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="ad-main">
        <AdLicoreriaTopbar onOpenMenu={() => setMenuOpen(true)} />
        <div className="ad-content">
          <AdRouteGate>
            <Outlet />
          </AdRouteGate>
        </div>
        <AdMobileBottomNav onOpenMore={() => setMenuOpen(true)} />
      </div>
    </div>
  );
}

function AdLicoreriaLayout() {
  return (
    <AdLicoreriaProvider>
      <AdTvProvider>
        <AdDesignApplier>
          <div className="ad-shell">
            <AdLicoreriaShell />
          </div>
        </AdDesignApplier>
      </AdTvProvider>
    </AdLicoreriaProvider>
  );
}

export { AdLicoreriaLayout };
