import { getDonaiveSoftwareBasePath } from "@/lib/donaive-software-host";

export function getDonaiveSoftwareRoutes() {
  const b = getDonaiveSoftwareBasePath();
  const p = (path: string) => (b ? `${b}${path}` : path);
  return {
    home: b || "/",
    activar: p("/activar"),
    modulo: (id: string) => p(`/m/${id}`),
    pos: p("/m/pos"),
    posVender: p("/m/pos/vender"),
    posCierres: p("/m/pos/cierres"),
    inventario: p("/m/inventario"),
    inventarioProductos: p("/m/inventario/productos"),
    inventarioMovimientos: p("/m/inventario/movimientos"),
    finanzas: p("/m/finanzas"),
    finanzasTasas: p("/m/finanzas/tasas"),
    finanzasCpp: p("/m/finanzas/costo-promedio"),
    finanzasCuentas: p("/m/finanzas/cuentas"),
    informes: p("/m/informes"),
    informesVentas: p("/m/informes/ventas"),
    informesInventario: p("/m/informes/inventario"),
    configuracion: p("/m/configuracion"),
  } as const;
}

export type DonaiveSoftwareModuleId =
  | "pos"
  | "inventario"
  | "finanzas"
  | "informes"
  | "configuracion";
