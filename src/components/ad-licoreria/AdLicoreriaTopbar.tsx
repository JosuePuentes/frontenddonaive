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

function AdLicoreriaTopbar() {
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
      <div>
        <p className="ad-eyebrow">A&D Licorería & Bodegón</p>
        <h1 className="ad-display mt-1 text-2xl text-[var(--ad-text)] sm:text-3xl">
          {title}
        </h1>
        {session ? (
          <p className="mt-1 text-xs text-[var(--ad-muted)]">
            Sesión: {session.name} · {AD_ROLE_LABELS[session.role]}
            {session.warehouseId
              ? ` · ${warehouseLabel(session.warehouseId, warehouses)}`
              : " · Transversal"}
            {warehouseLocked ? " · depósito fijado" : ""}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link to={AD_LICORERIA_ROUTES.home} className="ad-btn">
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
            Cerrar sesión
          </button>
        ) : (
          <select
            className="ad-select max-w-[11rem]"
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
        {session?.role === "mesonera" || mode === "mock" ? (
          <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn">
            Mesonera
          </Link>
        ) : null}
        {session?.role === "cajero" ||
        session?.role === "admin" ||
        mode === "mock" ? (
          <Link to={AD_LICORERIA_ROUTES.ventas} className="ad-btn ad-btn--gold">
            Abrir ventas
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export { AdLicoreriaTopbar };
