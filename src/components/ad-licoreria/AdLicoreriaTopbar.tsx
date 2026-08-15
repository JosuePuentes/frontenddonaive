import { Link, useLocation, useNavigate } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
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
  "/mesonera": "Interfaz mesonera",
};

type Props = {
  onOpenMenu: () => void;
};

function AdLicoreriaTopbar({ onOpenMenu }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const path = normalizeAdLicoreriaPathname(pathname);
  const title = titles[path] ?? "A&D";
  const { getCurrentOperator, warehouses, setCurrentOperator, operators } =
    useAdLicoreria();
  const session = getCurrentOperator();
  const mode = getAdDataSourceMode();
  const warehouseLocked = Boolean(session?.warehouseId);

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
        <Link to={AD_LICORERIA_ROUTES.home} className="ad-btn ad-topbar__desktop-only">
          Home
        </Link>
        {mode === "api" ? (
          <button
            type="button"
            className="ad-btn"
            onClick={() => {
              void adLogoutRequest().then(() => {
                navigate(AD_LICORERIA_ROUTES.login, { replace: true });
              });
            }}
          >
            Salir
          </button>
        ) : (
          <select
            className="ad-select max-w-[11rem] ad-topbar__desktop-only"
            value={session?.id ?? ""}
            onChange={(e) => setCurrentOperator(e.target.value || null)}
            aria-label="Usuario en sesión"
          >
            <option value="">Sin sesión</option>
            {operators
              .filter((o) => o.active)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </select>
        )}
      </div>
    </header>
  );
}

export { AdLicoreriaTopbar };
