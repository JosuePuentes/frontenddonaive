import { lazy, type ReactNode } from "react";
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
const PolisurNoticias = lazy(() => import("@/pages/polisur/PolisurNoticias"));
const PolisurNoticiaDetalle = lazy(
  () => import("@/pages/polisur/PolisurNoticiaDetalle"),
);

/**
 * Devuelve `<Route>` hijos para un prefijo POLISUR.
 *
 * Debe invocarse como función (`{polisurRouteTree("/polisur")}`), no como
 * componente `<PolisurRouteTree />`: React Router exige que los hijos de
 * `<Routes>` / layout `<Route>` sean `<Route>` o Fragment, no componentes custom.
 */
function polisurRouteTree(prefix: "" | "/polisur"): ReactNode {
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
        path={polisurRouterPath(prefix, "noticias")}
        element={<PolisurNoticias />}
      />
      <Route
        path={polisurRouterPath(prefix, "noticia")}
        element={<PolisurNoticiaDetalle />}
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

export { polisurRouteTree };
