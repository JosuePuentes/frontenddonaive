import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { getAdLicoreriaRoutes } from "@/constants/ad-licoreria-routes";
import {
  filterNavForUser,
  groupNavItems,
  type AdNavGroupId,
} from "@/lib/ad-licoreria/nav-by-role";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Primera ruta “hub” de cada grupo (tap en el título = ir al módulo). */
const GROUP_HUB_KEY: Partial<Record<AdNavGroupId, string>> = {
  principal: "inicio",
  operacion: "ventas",
  inventario: "cop",
  compras: "compras",
  finanzas: "finanzas",
  tv: "tv",
  admin: "configuracion",
};

function AdLicoreriaSidebar({ open, onClose }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const routes = getAdLicoreriaRoutes();
  const path = normalizeAdLicoreriaPathname(pathname);
  const { getCurrentOperator, getRolePermissionMatrix } = useAdLicoreria();
  const session = getCurrentOperator();
  const matrix = getRolePermissionMatrix();
  const items = filterNavForUser(session, matrix);
  const groups = useMemo(() => groupNavItems(items), [items]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const brandTo = session ? routes.inicio : routes.home;

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const group of groups) {
        const hasActive = group.items.some((item) => {
          const normalized = normalizeAdLicoreriaPathname(item.to);
          return (
            path === normalized ||
            (normalized !== "/" && path.startsWith(`${normalized}/`))
          );
        });
        if (open) {
          next[group.id] = true;
          continue;
        }
        if (next[group.id] != null && !hasActive) continue;
        next[group.id] =
          group.id === "principal" ||
          group.id === "operacion" ||
          group.id === "tv" ||
          hasActive;
      }
      return next;
    });
  }, [groups, path, open]);

  function onGroupTitle(id: AdNavGroupId) {
    const group = groups.find((g) => g.id === id);
    const hubKey = GROUP_HUB_KEY[id];
    const hub = hubKey
      ? group?.items.find((i) => i.key === hubKey) ?? group?.items[0]
      : group?.items[0];

    setExpanded((prev) => ({ ...prev, [id]: true }));

    if (hub) {
      navigate(hub.to);
      onClose();
    }
  }

  return (
    <>
      <button
        type="button"
        className={`ad-nav-backdrop ${open ? "is-open" : ""}`}
        aria-label="Cerrar menú"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside className={`ad-sidebar ${open ? "is-open" : ""}`}>
        <div className="ad-sidebar__head">
          <button
            type="button"
            className="ad-sidebar__brand"
            aria-label="Ir al inicio"
            onClick={() => {
              navigate(brandTo);
              onClose();
            }}
          >
            <AdLicoreriaBrandMark size="md" />
          </button>
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
            const isOpen = Boolean(expanded[group.id]);
            return (
              <div key={group.id} className="ad-nav-group">
                <button
                  type="button"
                  className="ad-nav-group__title"
                  aria-expanded={isOpen}
                  onClick={() => onGroupTitle(group.id)}
                >
                  <span>{group.label}</span>
                  <span className="ad-nav-group__hint">Abrir</span>
                </button>
                {isOpen ? (
                  <div className="ad-nav-group__items">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.to);
                          onClose();
                        }}
                        className={({ isActive }) =>
                          ["ad-nav-link", isActive ? "is-active" : ""].join(" ")
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export { AdLicoreriaSidebar };
