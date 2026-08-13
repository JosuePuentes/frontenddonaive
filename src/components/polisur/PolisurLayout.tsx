import { useEffect } from "react";
import { Outlet } from "react-router";
import { PolisurNavbar } from "@/components/polisur/PolisurNavbar";
import { PolisurFooter } from "@/components/polisur/PolisurFooter";
import "@/components/polisur/polisur.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Manrope:wght@400;500;600;700&display=swap";

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
    <div className="polisur-shell">
      <PolisurNavbar />
      <main>
        <Outlet />
      </main>
      <PolisurFooter />
    </div>
  );
}

export { PolisurLayout };
