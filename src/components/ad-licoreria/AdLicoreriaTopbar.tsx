import { Link, useLocation } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";

const titles: Record<string, string> = {
  "/": "Portal",
  "/inicio": "Inicio",
  "/ventas": "Ventas / POS",
  "/inventario": "Inventario / Kardex",
  "/productos": "Productos",
  "/presentaciones": "Presentaciones",
  "/depositos": "Depósitos",
  "/mesas": "Mesas",
  "/cuentas": "Cuentas",
  "/prepagos": "Cuentas prepagadas",
  "/qr": "QR de cuenta",
  "/cierres": "Cierres y caja",
  "/clientes": "Clientes",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
  "/mesonera": "Interfaz mesonera",
};

function AdLicoreriaTopbar() {
  const { pathname } = useLocation();
  const path = normalizeAdLicoreriaPathname(pathname);
  const title = titles[path] ?? "A&D";

  return (
    <header className="ad-topbar">
      <div>
        <p className="ad-eyebrow">A&D Licorería & Bodegón</p>
        <h1 className="ad-display mt-1 text-2xl text-[var(--ad-text)] sm:text-3xl">
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
