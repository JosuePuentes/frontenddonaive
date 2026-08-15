import { NavLink } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { filterNavForUser } from "@/lib/ad-licoreria/nav-by-role";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

function AdLicoreriaSidebar() {
  const { getCurrentOperator, getRolePermissionMatrix } = useAdLicoreria();
  const session = getCurrentOperator();
  const matrix = getRolePermissionMatrix();
  const items = filterNavForUser(session, matrix);

  return (
    <aside className="ad-sidebar">
      <NavLink to={AD_LICORERIA_ROUTES.home} end>
        <AdLicoreriaBrandMark size="md" />
      </NavLink>
      <p className="px-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ad-muted)]">
        {session
          ? `${session.name} · ${session.role}`
          : "Sin sesión"}
      </p>
      <nav className="ad-sidebar__nav" aria-label="A&D por rol">
        {items.map((item) => (
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
        Menú filtrado por permisos · mock operativo
      </p>
    </aside>
  );
}

export { AdLicoreriaSidebar };
