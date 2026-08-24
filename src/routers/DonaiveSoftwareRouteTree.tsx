import { lazy } from "react";
import { Route } from "react-router";

const DsHub = lazy(() => import("@/pages/donaive-software/DsHub"));
const DsActivar = lazy(() => import("@/pages/donaive-software/DsActivar"));
const DsLogin = lazy(() => import("@/pages/donaive-software/DsLogin"));
const DsModuleHome = lazy(() => import("@/pages/donaive-software/DsModuleHome"));
const DsPosVender = lazy(() => import("@/pages/donaive-software/DsPosVender"));
const DsPosCierres = lazy(() => import("@/pages/donaive-software/DsPosCierres"));
const DsInventarioProductos = lazy(
  () => import("@/pages/donaive-software/DsInventarioProductos"),
);
const DsInventarioMovimientos = lazy(
  () => import("@/pages/donaive-software/DsInventarioMovimientos"),
);
const DsComprasNueva = lazy(
  () => import("@/pages/donaive-software/DsComprasNueva"),
);
const DsComprasHistorial = lazy(
  () => import("@/pages/donaive-software/DsComprasHistorial"),
);
const DsFinanzasTasas = lazy(
  () => import("@/pages/donaive-software/DsFinanzasTasas"),
);
const DsFinanzasCpp = lazy(
  () => import("@/pages/donaive-software/DsFinanzasCpp"),
);
const DsFinanzasCuentas = lazy(
  () => import("@/pages/donaive-software/DsFinanzasCuentas"),
);
const DsClientesLista = lazy(
  () => import("@/pages/donaive-software/DsClientesLista"),
);
const DsProveedoresLista = lazy(
  () => import("@/pages/donaive-software/DsProveedoresLista"),
);
const DsInformesVentas = lazy(
  () => import("@/pages/donaive-software/DsInformesVentas"),
);
const DsInformesInventario = lazy(
  () => import("@/pages/donaive-software/DsInformesInventario"),
);
const DsAnalisisCompras = lazy(
  () => import("@/pages/donaive-software/DsAnalisisCompras"),
);
const DsConfiguracion = lazy(
  () => import("@/pages/donaive-software/DsConfiguracion"),
);
const DsConfigUsuarios = lazy(
  () => import("@/pages/donaive-software/DsConfigUsuarios"),
);
const DsConfigPermisos = lazy(
  () => import("@/pages/donaive-software/DsConfigPermisos"),
);

/** Fragmentos de ruta bajo prefijo "" (dominio propio) o "/software". */
export function donaiveSoftwareRouteTree(prefix: "" | "/software") {
  const p = (path: string) => {
    if (!prefix) return path === "/" ? "/" : path;
    if (path === "/") return prefix;
    return `${prefix}${path}`;
  };

  return (
    <>
      <Route path={p("/")} element={<DsHub />} />
      <Route path={p("/activar")} element={<DsActivar />} />
      <Route path={p("/login")} element={<DsLogin />} />
      <Route path={p("/m/:moduleId")} element={<DsModuleHome />} />
      <Route path={p("/m/pos/vender")} element={<DsPosVender />} />
      <Route path={p("/m/pos/cierres")} element={<DsPosCierres />} />
      <Route
        path={p("/m/inventario/productos")}
        element={<DsInventarioProductos />}
      />
      <Route
        path={p("/m/inventario/movimientos")}
        element={<DsInventarioMovimientos />}
      />
      <Route path={p("/m/compras/nueva")} element={<DsComprasNueva />} />
      <Route path={p("/m/compras/historial")} element={<DsComprasHistorial />} />
      <Route path={p("/m/finanzas/tasas")} element={<DsFinanzasTasas />} />
      <Route
        path={p("/m/finanzas/costo-promedio")}
        element={<DsFinanzasCpp />}
      />
      <Route path={p("/m/finanzas/cuentas")} element={<DsFinanzasCuentas />} />
      <Route path={p("/m/clientes/lista")} element={<DsClientesLista />} />
      <Route path={p("/m/proveedores/lista")} element={<DsProveedoresLista />} />
      <Route path={p("/m/informes/ventas")} element={<DsInformesVentas />} />
      <Route
        path={p("/m/informes/inventario")}
        element={<DsInformesInventario />}
      />
      <Route path={p("/m/analisis/compras")} element={<DsAnalisisCompras />} />
      <Route path={p("/m/configuracion/licencia")} element={<DsConfiguracion />} />
      <Route path={p("/m/configuracion/usuarios")} element={<DsConfigUsuarios />} />
      <Route path={p("/m/configuracion/permisos")} element={<DsConfigPermisos />} />
    </>
  );
}
