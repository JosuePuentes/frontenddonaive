import { useLocation } from "react-router";
import { normalizePolisurPathname } from "@/lib/polisur-host";

function usePolisurTheme() {
  const { pathname, search } = useLocation();
  const unidad = new URLSearchParams(search).get("unidad");
  const path = normalizePolisurPathname(pathname);
  const isCanina =
    path === "/unidad-canina" ||
    (path === "/preinscripcion" && unidad === "canina");

  return { isCanina };
}

export { usePolisurTheme };
