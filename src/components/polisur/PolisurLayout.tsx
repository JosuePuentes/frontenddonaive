import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { PolisurNavbar } from "@/components/polisur/PolisurNavbar";
import { PolisurFooter } from "@/components/polisur/PolisurFooter";
import { PolisurSiteProvider } from "@/providers/polisur/PolisurSiteProvider";
import "@/components/polisur/polisur.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Manrope:wght@400;500;600;700&display=swap";

function PolisurScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ""));
      if (id) {
        // Espera un frame por si el destino está en la página que acaba de montar.
        const timer = window.setTimeout(() => {
          const target = document.getElementById(id);
          if (target) {
            target.scrollIntoView({ behavior: "auto", block: "start" });
            return;
          }
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }, 0);
        return () => window.clearTimeout(timer);
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}

function PolisurLayout() {
  useEffect(() => {
    const id = "polisur-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  return (
    <PolisurSiteProvider>
      <div className="polisur-shell">
        <PolisurScrollToTop />
        <PolisurNavbar />
        <main>
          <Outlet />
        </main>
        <PolisurFooter />
      </div>
    </PolisurSiteProvider>
  );
}

export { PolisurLayout };
