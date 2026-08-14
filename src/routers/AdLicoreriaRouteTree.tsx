import { lazy, type ReactNode } from "react";
import { Route } from "react-router";
import { adLicoreriaRouterPath } from "@/constants/ad-licoreria-routes";

const AdLicoreriaHome = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaHome"),
);
const AdLicoreriaDashboard = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaDashboard"),
);
const AdLicoreriaPos = lazy(() => import("@/pages/ad-licoreria/AdLicoreriaPos"));
const AdLicoreriaInventario = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaInventario"),
);
const AdLicoreriaProductos = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaProductos"),
);
const AdLicoreriaPresentaciones = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaPresentaciones"),
);
const AdLicoreriaDepositos = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaDepositos"),
);
const AdLicoreriaMesas = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaMesas"),
);
const AdLicoreriaCuentas = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaCuentas"),
);
const AdLicoreriaPrepagos = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaPrepagos"),
);
const AdLicoreriaQr = lazy(() => import("@/pages/ad-licoreria/AdLicoreriaQr"));
const AdLicoreriaCaja = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaCaja"),
);
const AdLicoreriaCierres = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaCierres"),
);
const AdLicoreriaReportes = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaReportes"),
);
const AdLicoreriaAuditoria = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaAuditoria"),
);
const AdLicoreriaMesonera = lazy(
  () => import("@/pages/ad-licoreria/mesonera/AdLicoreriaMesonera"),
);

/**
 * Árbol de rutas A&D. Invocar como función:
 * `{adLicoreriaRouteTree("/licoreria")}` — no como componente.
 */
function adLicoreriaRouteTree(prefix: "" | "/licoreria"): ReactNode {
  return (
    <>
      <Route
        path={adLicoreriaRouterPath(prefix, "home")}
        element={<AdLicoreriaHome />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "dashboard")}
        element={<AdLicoreriaDashboard />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "pos")}
        element={<AdLicoreriaPos />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "inventario")}
        element={<AdLicoreriaInventario />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "productos")}
        element={<AdLicoreriaProductos />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "presentaciones")}
        element={<AdLicoreriaPresentaciones />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "depositos")}
        element={<AdLicoreriaDepositos />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "mesas")}
        element={<AdLicoreriaMesas />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "cuentas")}
        element={<AdLicoreriaCuentas />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "prepagos")}
        element={<AdLicoreriaPrepagos />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "qr")}
        element={<AdLicoreriaQr />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "caja")}
        element={<AdLicoreriaCaja />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "cierres")}
        element={<AdLicoreriaCierres />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "reportes")}
        element={<AdLicoreriaReportes />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "auditoria")}
        element={<AdLicoreriaAuditoria />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "mesonera")}
        element={<AdLicoreriaMesonera />}
      />
    </>
  );
}

export { adLicoreriaRouteTree };
