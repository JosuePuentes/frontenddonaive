import { NavLink } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import {
  AD_LICORERIA_ROUTES,
  adLicoreriaNavItems,
} from "@/constants/ad-licoreria-routes";

function AdLicoreriaSidebar() {
  return (
    <aside className="ad-sidebar">
      <NavLink to={AD_LICORERIA_ROUTES.home} end>
        <AdLicoreriaBrandMark size="md" />
      </NavLink>
      <nav className="ad-sidebar__nav" aria-label="A&D administración">
        {adLicoreriaNavItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) =>
              ["ad-nav-link", isActive ? "is-active" : ""].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <p className="mt-auto px-2 text-[0.65rem] leading-relaxed text-[var(--ad-muted)]">
        Módulo Donaive · inventario por unidad base · dominio propio pendiente
      </p>
    </aside>
  );
}

export { AdLicoreriaSidebar };
