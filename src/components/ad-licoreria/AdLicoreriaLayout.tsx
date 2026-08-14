import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { AdLicoreriaSidebar } from "@/components/ad-licoreria/AdLicoreriaSidebar";
import { AdLicoreriaTopbar } from "@/components/ad-licoreria/AdLicoreriaTopbar";
import { AdLicoreriaProvider } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import "@/components/ad-licoreria/ad-licoreria.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap";

function AdLicoreriaLayout() {
  const { pathname } = useLocation();
  const path = normalizeAdLicoreriaPathname(pathname);
  const isLanding = path === "/";
  const isMesonera = path === "/mesonera";

  useEffect(() => {
    const id = "ad-licoreria-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  return (
    <AdLicoreriaProvider>
      <div className="ad-shell">
        {isLanding || isMesonera ? (
          <Outlet />
        ) : (
          <div className="ad-layout">
            <AdLicoreriaSidebar />
            <div className="ad-main">
              <AdLicoreriaTopbar />
              <div className="ad-content">
                <Outlet />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdLicoreriaProvider>
  );
}

export { AdLicoreriaLayout };
