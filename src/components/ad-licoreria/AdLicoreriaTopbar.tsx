import { useLocation, useNavigate } from "react-router";
import { getAdLicoreriaRoutes } from "@/constants/ad-licoreria-routes";
import { AD_ROLE_LABELS } from "@/lib/ad-licoreria/access";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdFocusMode } from "@/lib/ad-licoreria/focus-mode";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adLogoutRequest } from "@/services/ad-licoreria/session";
import { adMockLogout } from "@/services/ad-licoreria/mock-login";
import { getAdDataSourceMode } from "@/services/ad-licoreria/repository-adapter";

const titles: Record<string, string> = {
  "/": "Portal",
  "/inicio": "Inicio",
  "/cop": "Centro de operaciones",
  "/cop/transferencias": "Transferencias",
  "/cop/reportes": "Reportes COP",
  "/ventas": "Ventas / POS",
  "/inventario": "Inventario / Kardex",
  "/productos": "Productos",
  "/presentaciones": "Presentaciones",
  "/depositos": "Depósitos",
  "/mesas": "Espacios",
  "/cuentas": "Cuentas",
  "/prepagos": "Cuentas prepagadas",
  "/qr": "QR de cuenta",
  "/cierres": "Cierres y caja",
  "/clientes": "Clientes",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
  "/configuracion/usuarios": "Usuarios",
  "/configuracion/permisos": "Permisos",
  "/tv": "TV",
  "/tv/contenido": "Contenido TV",
  "/tv/pantallas": "Pantallas",
  "/tv/control": "Control TV",
  "/mesonera": "Interfaz mesonera",
};

type Props = {
  onOpenMenu: () => void;
};

function AdLicoreriaTopbar({ onOpenMenu }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const routes = getAdLicoreriaRoutes();
  const path = normalizeAdLicoreriaPathname(pathname);
  const title = titles[path] ?? "A&D";
  const { getCurrentOperator, warehouses } = useAdLicoreria();
  const session = getCurrentOperator();
  const mode = getAdDataSourceMode();
  const warehouseLocked = Boolean(session?.warehouseId);
  const { focusMode, toggleFocusMode } = useAdFocusMode();
  /** Con sesión: inicio operativo. Sin sesión: home público. */
  const homeTo = session ? routes.inicio : routes.home;

  return (
    <header className="ad-topbar">
      <div className="ad-topbar__lead">
        {!focusMode ? (
          <button
            type="button"
            className="ad-btn ad-topbar__menu"
            onClick={onOpenMenu}
            aria-label="Abrir menú de módulos"
          >
            Menú
          </button>
        ) : null}
        <div className="min-w-0">
          <p className="ad-eyebrow">A&D Licorería & Bodegón</p>
          <h1 className="ad-display mt-1 text-xl text-[var(--ad-text)] sm:text-3xl truncate">
            {title}
          </h1>
          {session ? (
            <p className="mt-1 text-xs text-[var(--ad-muted)] truncate">
              {session.name} · {AD_ROLE_LABELS[session.role]}
              {session.warehouseId
                ? ` · ${warehouseLabel(session.warehouseId, warehouses)}`
                : " · Transversal"}
              {warehouseLocked ? " · fijado" : ""}
            </p>
          ) : null}
        </div>
      </div>
      <div className="ad-topbar__actions">
        <button
          type="button"
          className="ad-btn"
          onClick={toggleFocusMode}
          title={focusMode ? "Mostrar menú de módulos" : "Ocultar menú de módulos"}
        >
          {focusMode ? "Mostrar menú" : "Ocultar menú"}
        </button>
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          onClick={() => navigate(homeTo)}
        >
          {session ? "Inicio" : "Home"}
        </button>
        {mode === "api" ? (
          <button
            type="button"
            className="ad-btn"
            onClick={() => {
              void adLogoutRequest().then(() => {
                navigate(routes.login, { replace: true });
              });
            }}
          >
            Salir
          </button>
        ) : session ? (
          <button
            type="button"
            className="ad-btn"
            onClick={() => {
              adMockLogout();
              navigate(routes.login, { replace: true });
            }}
          >
            Salir
          </button>
        ) : (
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={() => navigate(routes.login)}
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}

export { AdLicoreriaTopbar };
