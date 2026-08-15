import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { AdLicoreriaSidebar } from "@/components/ad-licoreria/AdLicoreriaSidebar";
import { AdLicoreriaTopbar } from "@/components/ad-licoreria/AdLicoreriaTopbar";
import { AdLicoreriaProvider, useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { normalizeAdLicoreriaPathname } from "@/lib/ad-licoreria-host";
import { applySiteDesignToDom } from "@/lib/ad-licoreria/site-design";
import "@/components/ad-licoreria/ad-licoreria.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap";

function AdDesignApplier({ children }: { children: ReactNode }) {
  const { siteDesign } = useAdLicoreria();
  useEffect(() => {
    applySiteDesignToDom(siteDesign);
  }, [siteDesign]);
  return children;
}

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
      <AdDesignApplier>
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
      </AdDesignApplier>
    </AdLicoreriaProvider>
  );
}

export { AdLicoreriaLayout };
