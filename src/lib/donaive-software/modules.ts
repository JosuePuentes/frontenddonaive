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
      permissions: ["inventory.read", "inventory.products", "inventory.adjust"],
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
          title: "Movimientos",
          description: "Entradas, salidas y ajustes.",
          path: r.inventarioMovimientos,
          permission: "inventory.adjust",
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
          description: "BCV y tasa protegida (misma lógica A&D).",
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
          id: "inv",
          title: "Inventario",
          description: "Valorizado a CPP y alertas de stock.",
          path: r.informesInventario,
          permission: "reports.read",
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
