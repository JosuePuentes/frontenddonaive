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
  const sessionKey = session
    ? `${session.id}:${session.role}:${session.active ? 1 : 0}`
    : "none";

  const items = useMemo(() => {
    const matrix = getRolePermissionMatrix();
    return filterNavForUser(session, matrix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);
  const groups = useMemo(() => groupNavItems(items), [items]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    principal: true,
    operacion: true,
    tv: true,
  });
  const brandTo = session ? routes.inicio : routes.home;

  useEffect(() => {
    setExpanded((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of groups) {
        const want = open
          ? true
          : group.id === "principal" ||
            group.id === "operacion" ||
            group.id === "tv" ||
            group.items.some((item) => {
              const normalized = normalizeAdLicoreriaPathname(item.to);
              return (
                path === normalized ||
                (normalized !== "/" && path.startsWith(`${normalized}/`))
              );
            }) ||
            Boolean(prev[group.id]);
        if (next[group.id] !== want) {
          next[group.id] = want;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [groups, path, open]);

  function go(to: string) {
    onClose();
    navigate(to);
  }

  function onGroupTitle(id: AdNavGroupId) {
    const group = groups.find((g) => g.id === id);
    const hubKey = GROUP_HUB_KEY[id];
    const hub = hubKey
      ? group?.items.find((i) => i.key === hubKey) ?? group?.items[0]
      : group?.items[0];
    setExpanded((prev) => ({ ...prev, [id]: true }));
    if (hub) go(hub.to);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          className="ad-nav-backdrop is-open"
          aria-label="Cerrar menú"
          onClick={onClose}
        />
      ) : null}
          <aside
        className={`ad-sidebar ${open ? "is-open" : ""}`}
        aria-hidden={open ? undefined : true}
      >
        <div className="ad-sidebar__head">
          <button
            type="button"
            className="ad-sidebar__brand"
            aria-label="Ir al inicio"
            onClick={() => go(brandTo)}
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
                          go(item.to);
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
