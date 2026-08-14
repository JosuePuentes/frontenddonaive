import { lazy } from "react";
import { Route } from "react-router";
import { polisurRouterPath } from "@/constants/polisur-routes";

const PolisurHome = lazy(() => import("@/pages/polisur/PolisurHome"));
const PolisurUnidadCanina = lazy(
  () => import("@/pages/polisur/PolisurUnidadCanina"),
);
const PolisurDivisionesPage = lazy(
  () => import("@/pages/polisur/PolisurDivisionesPage"),
);
const PolisurPreinscripcion = lazy(
  () => import("@/pages/polisur/PolisurPreinscripcion"),
);
const PolisurContacto = lazy(() => import("@/pages/polisur/PolisurContacto"));
const PolisurMedios = lazy(() => import("@/pages/polisur/PolisurMedios"));

type PolisurRouteTreeProps = {
  prefix: "" | "/polisur";
};

/**
 * Árbol de rutas POLISUR para un prefijo (`/` en dominio propio, `/polisur` en Donaive).
 */
function PolisurRouteTree({ prefix }: PolisurRouteTreeProps) {
  return (
    <>
      <Route
        path={polisurRouterPath(prefix, "home")}
        element={<PolisurHome />}
      />
      <Route
        path={polisurRouterPath(prefix, "unidadCanina")}
        element={<PolisurUnidadCanina />}
      />
      <Route
        path={polisurRouterPath(prefix, "divisiones")}
        element={<PolisurDivisionesPage />}
      />
      <Route
        path={polisurRouterPath(prefix, "preinscripcion")}
        element={<PolisurPreinscripcion />}
      />
      <Route
        path={polisurRouterPath(prefix, "contacto")}
        element={<PolisurContacto />}
      />
      <Route
        path={polisurRouterPath(prefix, "medios")}
        element={<PolisurMedios />}
      />
    </>
  );
}

export { PolisurRouteTree };
