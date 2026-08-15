import { lazy, type ReactNode } from "react";
import { Route } from "react-router";
import { adLicoreriaRouterPath } from "@/constants/ad-licoreria-routes";

const AdLicoreriaHome = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaHome"),
);
const AdLicoreriaInicio = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaInicio"),
);
const AdLicoreriaVentas = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaVentas"),
);
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
const AdLicoreriaCierres = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaCierres"),
);
const AdLicoreriaClientes = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaClientes"),
);
const AdLicoreriaReportes = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaReportes"),
);
const AdLicoreriaConfiguracion = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaConfiguracion"),
);
const AdLicoreriaMesonera = lazy(
  () => import("@/pages/ad-licoreria/mesonera/AdLicoreriaMesonera"),
);
const AdLicoreriaCop = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaCop"),
);
const AdLicoreriaCopTransferencias = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaCopTransferencias"),
);
const AdLicoreriaCopReportes = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaCopReportes"),
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
        path={adLicoreriaRouterPath(prefix, "inicio")}
        element={<AdLicoreriaInicio />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "cop")}
        element={<AdLicoreriaCop />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "copTransferencias")}
        element={<AdLicoreriaCopTransferencias />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "copReportes")}
        element={<AdLicoreriaCopReportes />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "ventas")}
        element={<AdLicoreriaVentas />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "cuentas")}
        element={<AdLicoreriaCuentas />}
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
        path={adLicoreriaRouterPath(prefix, "cierres")}
        element={<AdLicoreriaCierres />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "clientes")}
        element={<AdLicoreriaClientes />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "reportes")}
        element={<AdLicoreriaReportes />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "configuracion")}
        element={<AdLicoreriaConfiguracion />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "mesonera")}
        element={<AdLicoreriaMesonera />}
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
        path={adLicoreriaRouterPath(prefix, "mesas")}
        element={<AdLicoreriaMesas />}
      />
    </>
  );
}

export { adLicoreriaRouteTree };
