import { useMemo } from "react";
import { NavLink, useLocation } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  filterNavForUser,
  groupNavItems,
} from "@/lib/ad-licoreria/nav-by-role";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

function AdLicoreriaSidebar({ open, onClose }: Props) {
  const { pathname } = useLocation();
  const path = normalizeAdLicoreriaPathname(pathname);
  const { getCurrentOperator, getRolePermissionMatrix } = useAdLicoreria();
  const session = getCurrentOperator();
  const matrix = getRolePermissionMatrix();
  const items = filterNavForUser(session, matrix);
  const groups = useMemo(() => groupNavItems(items), [items]);

  return (
    <>
      <button
        type="button"
        className={`ad-nav-backdrop ${open ? "is-open" : ""}`}
        aria-label="Cerrar menú"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className={`ad-sidebar ${open ? "is-open" : ""}`}
        aria-hidden={!open ? undefined : undefined}
      >
        <div className="ad-sidebar__head">
          <NavLink to={AD_LICORERIA_ROUTES.home} end onClick={onClose}>
            <AdLicoreriaBrandMark size="md" />
          </NavLink>
          <button
            type="button"
            className="ad-btn ad-sidebar__close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            Cerrar
          </button>
        </div>
        <p className="px-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ad-muted)]">
          {session ? `${session.name} · ${session.role}` : "Sin sesión"}
        </p>
        <nav className="ad-sidebar__nav" aria-label="A&D por rol">
          {groups.map((group) => {
            const hasActive = group.items.some((item) => {
              const seg = item.to.replace(/\/licoreria$/, "") || "/";
              const normalized = normalizeAdLicoreriaPathname(item.to);
              return (
                path === normalized ||
                (normalized !== "/" && path.startsWith(`${normalized}/`)) ||
                path === seg
              );
            });
            const defaultOpen =
              group.id === "principal" ||
              group.id === "operacion" ||
              hasActive;
            return (
              <details
                key={group.id}
                className="ad-nav-group"
                open={defaultOpen}
              >
                <summary className="ad-nav-group__title">{group.label}</summary>
                <div className="ad-nav-group__items">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        ["ad-nav-link", isActive ? "is-active" : ""].join(" ")
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </details>
            );
          })}
        </nav>
        <p className="mt-auto px-2 text-[0.65rem] leading-relaxed text-[var(--ad-muted)]">
          Menú por permisos · grupos colapsables
        </p>
      </aside>
    </>
  );
}

export { AdLicoreriaSidebar };
