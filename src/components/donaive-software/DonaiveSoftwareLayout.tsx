import { useEffect, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { normalizeDonaiveSoftwarePathname } from "@/lib/donaive-software-host";
import { DS_ROLE_LABELS } from "@/lib/donaive-software/access";
import {
  DonaiveSoftwareProvider,
  useDonaiveSoftware,
} from "@/providers/donaive-software/DonaiveSoftwareProvider";
import "@/components/donaive-software/donaive-software.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap";

function FontLoader() {
  useEffect(() => {
    const id = "donaive-software-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
  return null;
}

function Gate({ children }: { children: ReactNode }) {
  const { license, currentUser } = useDonaiveSoftware();
  const { pathname } = useLocation();
  const path = normalizeDonaiveSoftwarePathname(pathname);
  const routes = getDonaiveSoftwareRoutes();
  const isActivar = path === "/activar";
  const isLogin = path === "/login";

  if (!license && !isActivar) {
    return <Navigate to={routes.activar} replace />;
  }
  if (license && isActivar) {
    return <Navigate to={routes.login} replace />;
  }
  if (license && !currentUser && !isLogin) {
    return <Navigate to={routes.login} replace />;
  }
  if (license && currentUser && isLogin) {
    return <Navigate to={routes.home} replace />;
  }
  return children;
}

function Shell() {
  const { license, rates, currentUser, logout } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  return (
    <div className="ds-root">
      <FontLoader />
      <div className="ds-shell">
        <header className="ds-topbar">
          <div>
            <Link className="ds-brand" to={routes.home}>
              Donaive <span>Software</span>
            </Link>
            {license ? (
              <div className="ds-business">{license.businessName}</div>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {license && currentUser ? (
              <>
                <span className="ds-muted" style={{ fontSize: "0.85rem" }}>
                  {currentUser.name} · {DS_ROLE_LABELS[currentUser.role]}
                </span>
                <button type="button" className="ds-btn" onClick={logout}>
                  Salir
                </button>
              </>
            ) : null}
            {license ? (
              <div className="ds-muted" style={{ fontSize: "0.85rem" }}>
                BCV{" "}
                {rates.bcv.toLocaleString("es-VE", {
                  maximumFractionDigits: 2,
                })}
              </div>
            ) : null}
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

export function DonaiveSoftwareLayout() {
  return (
    <DonaiveSoftwareProvider>
      <Gate>
        <Shell />
      </Gate>
    </DonaiveSoftwareProvider>
  );
}
