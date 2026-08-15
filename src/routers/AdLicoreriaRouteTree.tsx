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
const AdLicoreriaConfigUsuarios = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaConfigUsuarios"),
);
const AdLicoreriaConfigPermisos = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaConfigPermisos"),
);
const AdLicoreriaConfigDiseno = lazy(
  () => import("@/pages/ad-licoreria/AdLicoreriaConfigDiseno"),
);
const AdTvHub = lazy(() => import("@/pages/ad-licoreria/tv/AdTvHub"));
const AdTvPantallas = lazy(
  () => import("@/pages/ad-licoreria/tv/AdTvPantallas"),
);
const AdTvContenido = lazy(
  () => import("@/pages/ad-licoreria/tv/AdTvContenido"),
);
const AdTvGrupos = lazy(() => import("@/pages/ad-licoreria/tv/AdTvGrupos"));
const AdTvControl = lazy(() => import("@/pages/ad-licoreria/tv/AdTvControl"));
const AdTvPlayer = lazy(() => import("@/pages/ad-licoreria/tv/AdTvPlayer"));

/**
 * Árbol de rutas A&D. Invocar como función:
 * `{adLicoreriaRouteTree("/licoreria")}` — no como componente.
 */
function adLicoreriaRouteTree(prefix: "" | "/licoreria"): ReactNode {
  const tvPlayer =
    prefix === ""
      ? "/tv/pantalla/:id"
      : `${prefix}/tv/pantalla/:id`;

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
        path={adLicoreriaRouterPath(prefix, "configUsuarios")}
        element={<AdLicoreriaConfigUsuarios />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "configPermisos")}
        element={<AdLicoreriaConfigPermisos />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "configDiseno")}
        element={<AdLicoreriaConfigDiseno />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "tv")}
        element={<AdTvHub />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "tvPantallas")}
        element={<AdTvPantallas />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "tvContenido")}
        element={<AdTvContenido />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "tvGrupos")}
        element={<AdTvGrupos />}
      />
      <Route
        path={adLicoreriaRouterPath(prefix, "tvControl")}
        element={<AdTvControl />}
      />
      <Route path={tvPlayer} element={<AdTvPlayer />} />
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
