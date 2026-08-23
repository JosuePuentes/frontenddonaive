import { useEffect, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { normalizeDonaiveSoftwarePathname } from "@/lib/donaive-software-host";
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
  const { license } = useDonaiveSoftware();
  const { pathname } = useLocation();
  const path = normalizeDonaiveSoftwarePathname(pathname);
  const routes = getDonaiveSoftwareRoutes();
  const isActivar = path === "/activar";

  if (!license && !isActivar) {
    return <Navigate to={routes.activar} replace />;
  }
  if (license && isActivar) {
    return <Navigate to={routes.home} replace />;
  }
  return children;
}

function Shell() {
  const { license, rates } = useDonaiveSoftware();
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
          {license ? (
            <div className="ds-muted" style={{ fontSize: "0.85rem" }}>
              BCV {rates.bcv.toLocaleString("es-VE", { maximumFractionDigits: 2 })}
            </div>
          ) : null}
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
