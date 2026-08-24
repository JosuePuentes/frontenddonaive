import type { DonaiveSoftwareModuleId } from "@/constants/donaive-software-routes";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import type { DsPermission } from "@/types/donaive-software";

export type DsModuleFeature = {
  id: string;
  title: string;
  description: string;
  path: string;
  /** Permiso mínimo para ver la función. */
  permission: DsPermission | DsPermission[];
};

export type DsModuleDef = {
  id: DonaiveSoftwareModuleId;
  title: string;
  short: string;
  description: string;
  /** Al menos uno de estos permisos para ver el módulo en el hub. */
  permissions: DsPermission[];
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
      permissions: ["pos.sell", "pos.closures"],
      features: [
        {
          id: "vender",
          title: "Vender",
          description: "Cobrar productos y pagos mixtos USD/Bs.",
          path: r.posVender,
          permission: "pos.sell",
        },
        {
          id: "cierres",
          title: "Cierres",
          description: "Cerrar turno y revisar recaudación.",
          path: r.posCierres,
          permission: "pos.closures",
        },
      ],
    },
    {
      id: "inventario",
      title: "Inventario",
      short: "Stock",
      description: "Productos, existencias y movimientos.",
      permissions: [
      "inventory.read",
      "inventory.products",
      "inventory.adjust",
      "inventory.movements",
    ],
      features: [
        {
          id: "productos",
          title: "Productos",
          description: "Ficha, empaque caja/unidad y precios.",
          path: r.inventarioProductos,
          permission: "inventory.products",
        },
        {
          id: "movimientos",
          title: "Movimiento de unidades",
          description: "Kardex de entradas, salidas y rotación.",
          path: r.inventarioMovimientos,
          permission: ["inventory.adjust", "inventory.movements", "president.view"],
        },
      ],
    },
    {
      id: "compras",
      title: "Compras",
      short: "Entradas",
      description: "Registrar compras, CPP e impuestos.",
      permissions: ["purchases.create", "purchases.manage", "purchases.approve"],
      features: [
        {
          id: "nueva",
          title: "Nueva compra",
          description: "Factura, tasa Bs y costo ponderado.",
          path: r.comprasNueva,
          permission: "purchases.create",
        },
        {
          id: "historial",
          title: "Historial",
          description: "Compras registradas y estados.",
          path: r.comprasHistorial,
          permission: "purchases.manage",
        },
      ],
    },
    {
      id: "finanzas",
      title: "Finanzas",
      short: "Dinero",
      description: "Tasas BCV, costo promedio y cuentas.",
      permissions: [
        "finance.rates",
        "finance.cpp",
        "finance.accounts",
        "finance.manage",
      ],
      features: [
        {
          id: "tasas",
          title: "Tasas",
          description: "BCV y tasa protegida del negocio.",
          path: r.finanzasTasas,
          permission: "finance.rates",
        },
        {
          id: "cpp",
          title: "Costo promedio",
          description: "CPP ponderado al entrar mercancía.",
          path: r.finanzasCpp,
          permission: "finance.cpp",
        },
        {
          id: "cuentas",
          title: "Cuentas",
          description: "Cuentas por cobrar y pagar.",
          path: r.finanzasCuentas,
          permission: "finance.accounts",
        },
      ],
    },
    {
      id: "clientes",
      title: "Clientes",
      short: "CxC",
      description: "Directorio y cuentas por cobrar.",
      permissions: ["clients.read", "clients.manage"],
      features: [
        {
          id: "lista",
          title: "Directorio",
          description: "Clientes, crédito y saldos.",
          path: r.clientesLista,
          permission: "clients.read",
        },
      ],
    },
    {
      id: "proveedores",
      title: "Proveedores",
      short: "CxP",
      description: "Proveedores y cuentas por pagar.",
      permissions: ["suppliers.manage"],
      features: [
        {
          id: "lista",
          title: "Directorio",
          description: "Proveedores y saldos pendientes.",
          path: r.proveedoresLista,
          permission: "suppliers.manage",
        },
      ],
    },
    {
      id: "informes",
      title: "Informes",
      short: "Reportes",
      description: "Ventas, inventario y resultados.",
      permissions: ["reports.read"],
      features: [
        {
          id: "ventas",
          title: "Ventas",
          description: "Resumen por período y método de pago.",
          path: r.informesVentas,
          permission: "reports.read",
        },
        {
          id: "ventas-diarias",
          title: "Resumen ventas diarias",
          description: "Tickets, totales y top del día.",
          path: r.informesVentasDiarias,
          permission: ["reports.read", "reports.daily"],
        },
        {
          id: "inv",
          title: "Inventario",
          description: "Valorizado a CPP y alertas de stock.",
          path: r.informesInventario,
          permission: "reports.read",
        },
        {
          id: "reposicion",
          title: "Reposición",
          description: "Productos bajo mínimo según movimiento.",
          path: r.informesReposicion,
          permission: ["reports.read", "planning.view"],
        },
      ],
    },
    {
      id: "planificacion",
      title: "Planificación",
      short: "Compras",
      description: "Sugeridos por proveedor, exportar e imprimir.",
      permissions: ["planning.view"],
      features: [
        {
          id: "compras-plan",
          title: "Planificación de compras",
          description: "Sugeridos por proveedor según lead time y rotación.",
          path: r.planificacionCompras,
          permission: "planning.view",
        },
      ],
    },
    {
      id: "presidente",
      title: "Presidencia",
      short: "Supervisión",
      description: "Solo lectura: ventas, inventario, métricas y gráficas.",
      permissions: ["president.view"],
      features: [
        {
          id: "resumen",
          title: "Resumen ejecutivo",
          description: "Indicadores clave del negocio.",
          path: r.presidenteResumen,
          permission: "president.view",
        },
        {
          id: "ventas-dia",
          title: "Ventas del día",
          description: "Resumen diario de tickets y recaudación.",
          path: r.informesVentasDiarias,
          permission: ["president.view", "reports.daily"],
        },
        {
          id: "mov-unidades",
          title: "Movimiento de unidades",
          description: "Kardex de rotación (solo consulta).",
          path: r.inventarioMovimientos,
          permission: ["president.view", "inventory.movements"],
        },
        {
          id: "plan",
          title: "Planificación de compras",
          description: "Sugeridos y alertas críticas (solo consulta).",
          path: r.planificacionCompras,
          permission: ["president.view", "planning.view"],
        },
        {
          id: "reposicion",
          title: "Reposición",
          description: "Productos que necesitan compra.",
          path: r.informesReposicion,
          permission: ["president.view", "planning.view"],
        },
      ],
    },
    {
      id: "analisis",
      title: "Análisis",
      short: "Compras",
      description: "Sugerencias y rotación de mercancía.",
      permissions: ["analysis.view"],
      features: [
        {
          id: "compras",
          title: "Análisis de compras",
          description: "Qué reponer según ventas y stock.",
          path: r.analisisCompras,
          permission: "analysis.view",
        },
      ],
    },
    {
      id: "configuracion",
      title: "Configuración",
      short: "Ajustes",
      description: "Licencia, usuarios y permisos.",
      permissions: ["license.manage", "users.manage", "settings.manage"],
      features: [
        {
          id: "licencia",
          title: "Licencia / negocio",
          description: "Nombre comercial y estado de activación.",
          path: r.configLicencia,
          permission: "license.manage",
        },
        {
          id: "usuarios",
          title: "Usuarios",
          description: "Operadores, roles y acceso.",
          path: r.configUsuarios,
          permission: "users.manage",
        },
        {
          id: "permisos",
          title: "Permisos por rol",
          description: "Matriz editable de capacidades.",
          path: r.configPermisos,
          permission: "users.manage",
        },
      ],
    },
  ];
}

export function getModuleById(id: string): DsModuleDef | undefined {
  return getDonaiveSoftwareModules().find((m) => m.id === id);
}

export function filterModulesForUser(
  modules: DsModuleDef[],
  canAccess: (permission: DsPermission | DsPermission[]) => boolean,
): DsModuleDef[] {
  return modules
    .filter((m) => canAccess(m.permissions))
    .map((m) => ({
      ...m,
      features: m.features.filter((f) => canAccess(f.permission)),
    }))
    .filter((m) => m.features.length > 0);
}

export function filterFeaturePermission(
  permission: DsPermission | DsPermission[],
): DsPermission[] {
  return Array.isArray(permission) ? permission : [permission];
}
