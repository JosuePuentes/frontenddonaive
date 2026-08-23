import type { DonaiveSoftwareModuleId } from "@/constants/donaive-software-routes";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

export type DsModuleFeature = {
  id: string;
  title: string;
  description: string;
  path: string;
};

export type DsModuleDef = {
  id: DonaiveSoftwareModuleId;
  title: string;
  short: string;
  description: string;
  features: DsModuleFeature[];
};

export function getDonaiveSoftwareModules(): DsModuleDef[] {
  const r = getDonaiveSoftwareRoutes();
  return [
    {
      id: "pos",
      title: "Punto de venta",
      short: "POS",
      description: "Cobrar, mesas y cierres del día.",
      features: [
        {
          id: "vender",
          title: "Vender",
          description: "Cobrar productos y pagos mixtos USD/Bs.",
          path: r.posVender,
        },
        {
          id: "cierres",
          title: "Cierres",
          description: "Cerrar turno y revisar recaudación.",
          path: r.posCierres,
        },
      ],
    },
    {
      id: "inventario",
      title: "Inventario",
      short: "Stock",
      description: "Productos, existencias y movimientos.",
      features: [
        {
          id: "productos",
          title: "Productos",
          description: "Ficha, empaque caja/unidad y precios.",
          path: r.inventarioProductos,
        },
        {
          id: "movimientos",
          title: "Movimientos",
          description: "Entradas, salidas y ajustes.",
          path: r.inventarioMovimientos,
        },
      ],
    },
    {
      id: "finanzas",
      title: "Finanzas",
      short: "Dinero",
      description: "Tasas BCV, costo promedio y cuentas.",
      features: [
        {
          id: "tasas",
          title: "Tasas",
          description: "BCV y tasa protegida (misma lógica A&D).",
          path: r.finanzasTasas,
        },
        {
          id: "cpp",
          title: "Costo promedio",
          description: "CPP ponderado al entrar mercancía.",
          path: r.finanzasCpp,
        },
        {
          id: "cuentas",
          title: "Cuentas",
          description: "Cuentas por cobrar y pagar.",
          path: r.finanzasCuentas,
        },
      ],
    },
    {
      id: "informes",
      title: "Informes",
      short: "Reportes",
      description: "Ventas, inventario y resultados.",
      features: [
        {
          id: "ventas",
          title: "Ventas",
          description: "Resumen por período y método de pago.",
          path: r.informesVentas,
        },
        {
          id: "inv",
          title: "Inventario",
          description: "Valorizado a CPP y alertas de stock.",
          path: r.informesInventario,
        },
      ],
    },
    {
      id: "configuracion",
      title: "Configuración",
      short: "Ajustes",
      description: "Licencia del negocio y preferencias.",
      features: [
        {
          id: "licencia",
          title: "Licencia / negocio",
          description: "Nombre comercial y estado de activación.",
          path: r.configuracion,
        },
      ],
    },
  ];
}

export function getModuleById(id: string): DsModuleDef | undefined {
  return getDonaiveSoftwareModules().find((m) => m.id === id);
}
