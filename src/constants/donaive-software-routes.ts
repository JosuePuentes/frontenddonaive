import { getDonaiveSoftwareBasePath } from "@/lib/donaive-software-host";

export function getDonaiveSoftwareRoutes() {
  const b = getDonaiveSoftwareBasePath();
  const p = (path: string) => (b ? `${b}${path}` : path);
  return {
    home: b || "/",
    activar: p("/activar"),
    login: p("/login"),
    modulo: (id: string) => p(`/m/${id}`),
    pos: p("/m/pos"),
    posVender: p("/m/pos/vender"),
    posCierres: p("/m/pos/cierres"),
    inventario: p("/m/inventario"),
    inventarioProductos: p("/m/inventario/productos"),
    inventarioMovimientos: p("/m/inventario/movimientos"),
    compras: p("/m/compras"),
    comprasNueva: p("/m/compras/nueva"),
    comprasHistorial: p("/m/compras/historial"),
    finanzas: p("/m/finanzas"),
    finanzasTasas: p("/m/finanzas/tasas"),
    finanzasCpp: p("/m/finanzas/costo-promedio"),
    finanzasCuentas: p("/m/finanzas/cuentas"),
    clientes: p("/m/clientes"),
    clientesLista: p("/m/clientes/lista"),
    proveedores: p("/m/proveedores"),
    proveedoresLista: p("/m/proveedores/lista"),
    informes: p("/m/informes"),
    informesVentas: p("/m/informes/ventas"),
    informesInventario: p("/m/informes/inventario"),
    informesReposicion: p("/m/informes/reposicion"),
    informesVentasDiarias: p("/m/informes/ventas-diarias"),
    analisis: p("/m/analisis"),
    analisisCompras: p("/m/analisis/compras"),
    planificacion: p("/m/planificacion"),
    planificacionCompras: p("/m/planificacion/compras"),
    presidente: p("/m/presidente"),
    presidenteResumen: p("/m/presidente/resumen"),
    configuracion: p("/m/configuracion"),
    configLicencia: p("/m/configuracion/licencia"),
    configUsuarios: p("/m/configuracion/usuarios"),
    configPermisos: p("/m/configuracion/permisos"),
  } as const;
}

export type DonaiveSoftwareModuleId =
  | "pos"
  | "inventario"
  | "compras"
  | "finanzas"
  | "clientes"
  | "proveedores"
  | "informes"
  | "analisis"
  | "planificacion"
  | "presidente"
  | "configuracion";
