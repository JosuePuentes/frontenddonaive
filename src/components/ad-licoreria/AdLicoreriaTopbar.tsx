import { useLocation, useNavigate } from "react-router";
import { getAdLicoreriaRoutes } from "@/constants/ad-licoreria-routes";
import { AD_ROLE_LABELS } from "@/lib/ad-licoreria/access";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adLogoutRequest } from "@/services/ad-licoreria/session";
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
  const { getCurrentOperator, warehouses, setCurrentOperator, operators } =
    useAdLicoreria();
  const session = getCurrentOperator();
  const mode = getAdDataSourceMode();
  const warehouseLocked = Boolean(session?.warehouseId);
  /** Con sesión: inicio operativo. Sin sesión: home público. */
  const homeTo = session ? routes.inicio : routes.home;

  return (
    <header className="ad-topbar">
      <div className="ad-topbar__lead">
        <button
          type="button"
          className="ad-btn ad-topbar__menu"
          onClick={onOpenMenu}
          aria-label="Abrir menú de módulos"
        >
          Menú
        </button>
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
        ) : (
          <select
            className="ad-select max-w-[12rem]"
            value={session?.id ?? ""}
            onChange={(e) => setCurrentOperator(e.target.value || null)}
            aria-label="Usuario demo en sesión (modo mock)"
          >
            <option value="">Sin sesión</option>
            {operators
              .filter((o) => o.active)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {AD_ROLE_LABELS[o.role]}
                </option>
              ))}
          </select>
        )}
      </div>
    </header>
  );
}

export { AdLicoreriaTopbar };
