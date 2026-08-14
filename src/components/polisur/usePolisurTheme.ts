import { useLocation } from "react-router";

function usePolisurTheme() {
  const { pathname, search } = useLocation();
  const unidad = new URLSearchParams(search).get("unidad");
  const isCanina =
    pathname.startsWith("/polisur/unidad-canina") ||
    (pathname.startsWith("/polisur/preinscripcion") && unidad === "canina");

  return { isCanina };
}

export { usePolisurTheme };
