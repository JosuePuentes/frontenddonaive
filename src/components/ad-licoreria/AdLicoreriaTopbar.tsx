import { Link, useLocation } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { AD_ROLE_LABELS } from "@/lib/ad-licoreria/access";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import { warehouseLabel } from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

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
  const path = normalizeAdLicoreriaPathname(pathname);
  const title = titles[path] ?? "A&D";
  const { getCurrentOperator, warehouses, setCurrentOperator, operators } =
    useAdLicoreria();
  const session = getCurrentOperator();

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
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn">
          Mesonera
        </Link>
        <Link to={AD_LICORERIA_ROUTES.ventas} className="ad-btn ad-btn--gold">
          Abrir ventas
        </Link>
      </div>
    </header>
  );
}

export { AdLicoreriaTopbar };
