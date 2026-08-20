import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { AdLicoreriaSidebar } from "@/components/ad-licoreria/AdLicoreriaSidebar";
import { AdLicoreriaTopbar } from "@/components/ad-licoreria/AdLicoreriaTopbar";
import {
  AdFocusModeProvider,
  useAdFocusMode,
} from "@/lib/ad-licoreria/focus-mode";
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
import { getAdLicoreriaRoutes } from "@/constants/ad-licoreria-routes";
import {
  filterNavForUser,
  mobilePrimaryNavItems,
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
  const routes = getAdLicoreriaRoutes();
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

  const needsAuth = !isPublicAdPath(path);
  if (needsAuth) {
    if (mode === "api") {
      if (!isAdSessionValid(apiSession)) {
        if (apiSession) clearAdSession();
        return <Navigate to={routes.login} replace />;
      }
    } else if (!session) {
      return <Navigate to={routes.login} replace />;
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
        <Link className="ad-btn" to={routes.home}>
          Volver al Home
        </Link>
        <Link className="ad-btn ad-btn--gold" to={routes.login}>
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return children;
}

function AdMobileBottomNav({ onOpenMore }: { onOpenMore: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { getCurrentOperator, getRolePermissionMatrix } = useAdLicoreria();
  const session = getCurrentOperator();
  const sessionKey = session
    ? `${session.id}:${session.role}`
    : "none";
  const items = useMemo(() => {
    const matrix = getRolePermissionMatrix();
    return filterNavForUser(session, matrix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);
  const primary = useMemo(
    () => mobilePrimaryNavItems(items, session?.role),
    [items, session?.role],
  );

  if (!primary.length) return null;

  return (
    <nav className="ad-mobile-tabbar" aria-label="Atajos móviles">
      {primary.map((item) => {
        const active =
          pathname === item.to ||
          (item.to !== "/" && pathname.startsWith(`${item.to}/`));
        return (
          <button
            key={item.key}
            type="button"
            className={["ad-mobile-tab", active ? "is-active" : ""].join(" ")}
            onClick={() => navigate(item.to)}
          >
            {item.label}
          </button>
        );
      })}
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
  const { focusMode } = useAdFocusMode();

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
    <div
      className={[
        "ad-layout",
        menuOpen ? "ad-layout--menu-open" : "",
        focusMode ? "ad-layout--focus" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!focusMode ? (
        <AdLicoreriaSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      ) : null}
      <div className="ad-main">
        <AdLicoreriaTopbar onOpenMenu={() => setMenuOpen(true)} />
        <div className="ad-content">
          <AdRouteGate>
            <Outlet />
          </AdRouteGate>
        </div>
        {!focusMode ? (
          <AdMobileBottomNav onOpenMore={() => setMenuOpen(true)} />
        ) : null}
      </div>
    </div>
  );
}

function AdLicoreriaLayout() {
  return (
    <AdLicoreriaProvider>
      <AdTvProvider>
        <AdFocusModeProvider>
          <AdDesignApplier>
            <div className="ad-shell">
              <AdLicoreriaShell />
            </div>
          </AdDesignApplier>
        </AdFocusModeProvider>
      </AdTvProvider>
    </AdLicoreriaProvider>
  );
}

export { AdLicoreriaLayout };
