import { ReportConfig } from '@/types/ReportTypes';

export const cuadresReports: ReportConfig[] = [
  {
    id: 'cuadres-diarios',
    title: 'Cuadres Diarios',
    description: 'Reporte de cuadres por día específico',
    module: 'cuadres',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Fecha',
        type: 'date',
        required: true
      },
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      }
    ],
    columns: [
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'cajero', label: 'Cajero', type: 'text', width: 100 },
      { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
      { id: 'ventas', label: 'Ventas', type: 'currency', width: 100, align: 'right' },
      { id: 'gastos', label: 'Gastos', type: 'currency', width: 100, align: 'right' },
      { id: 'diferencia', label: 'Diferencia', type: 'currency', width: 100, align: 'right' },
      { id: 'estado', label: 'Estado', type: 'text', width: 80 }
    ]
  },
  {
    id: 'cuadres-rango',
    title: 'Cuadres por Rango de Fechas',
    description: 'Reporte de cuadres en un rango de fechas',
    module: 'cuadres',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Rango de Fechas',
        type: 'dateRange',
        required: true
      },
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      },
      {
        id: 'estado',
        label: 'Estado',
        type: 'select',
        options: [
          { value: 'todos', label: 'Todos' },
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'verificado', label: 'Verificado' },
          { value: 'rechazado', label: 'Rechazado' }
        ]
      }
    ],
    columns: [
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'cajero', label: 'Cajero', type: 'text', width: 100 },
      { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
      { id: 'ventas', label: 'Ventas', type: 'currency', width: 100, align: 'right' },
      { id: 'gastos', label: 'Gastos', type: 'currency', width: 100, align: 'right' },
      { id: 'diferencia', label: 'Diferencia', type: 'currency', width: 100, align: 'right' },
      { id: 'estado', label: 'Estado', type: 'text', width: 80 }
    ]
  },
  {
    id: 'cuadres-resumen',
    title: 'Resumen de Cuadres',
    description: 'Resumen consolidado de cuadres',
    module: 'cuadres',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Rango de Fechas',
        type: 'dateRange',
        required: true
      },
      {
        id: 'agrupacion',
        label: 'Agrupar por',
        type: 'select',
        options: [
          { value: 'farmacia', label: 'Farmacia' },
          { value: 'cajero', label: 'Cajero' },
          { value: 'semana', label: 'Semana' },
          { value: 'mes', label: 'Mes' }
        ],
        defaultValue: 'farmacia'
      }
    ],
    columns: [
      { id: 'grupo', label: 'Grupo', type: 'text', width: 150 },
      { id: 'total_ventas', label: 'Total Ventas', type: 'currency', width: 120, align: 'right' },
      { id: 'total_gastos', label: 'Total Gastos', type: 'currency', width: 120, align: 'right' },
      { id: 'total_diferencia', label: 'Total Diferencia', type: 'currency', width: 120, align: 'right' },
      { id: 'cantidad_cuadres', label: 'Cant. Cuadres', type: 'number', width: 100, align: 'center' }
    ]
  }
];

export const gastosReports: ReportConfig[] = [
  {
    id: 'gastos-diarios',
    title: 'Gastos Diarios',
    description: 'Reporte de gastos por día específico',
    module: 'gastos',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Fecha',
        type: 'date',
        required: true
      },
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      },
      {
        id: 'categoria',
        label: 'Categoría',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las categorías' },
          { value: 'operativo', label: 'Operativo' },
          { value: 'administrativo', label: 'Administrativo' },
          { value: 'mantenimiento', label: 'Mantenimiento' }
        ]
      }
    ],
    columns: [
      { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'categoria', label: 'Categoría', type: 'text', width: 120 },
      { id: 'descripcion', label: 'Descripción', type: 'text', width: 200 },
      { id: 'monto', label: 'Monto', type: 'currency', width: 100, align: 'right' },
      { id: 'usuario', label: 'Usuario', type: 'text', width: 100 },
      { id: 'estado', label: 'Estado', type: 'text', width: 80 }
    ]
  },
  {
    id: 'gastos-rango',
    title: 'Gastos por Rango de Fechas',
    description: 'Reporte de gastos en un rango de fechas',
    module: 'gastos',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Rango de Fechas',
        type: 'dateRange',
        required: true
      },
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      },
      {
        id: 'monto_minimo',
        label: 'Monto Mínimo',
        type: 'number'
      }
    ],
    columns: [
      { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'categoria', label: 'Categoría', type: 'text', width: 120 },
      { id: 'descripcion', label: 'Descripción', type: 'text', width: 200 },
      { id: 'monto', label: 'Monto', type: 'currency', width: 100, align: 'right' },
      { id: 'usuario', label: 'Usuario', type: 'text', width: 100 },
      { id: 'estado', label: 'Estado', type: 'text', width: 80 }
    ]
  }
];

export const cuentasPorPagarReports: ReportConfig[] = [
  {
    id: 'cuentas-pendientes',
    title: 'Cuentas Pendientes',
    description: 'Reporte de cuentas por pagar pendientes',
    module: 'cuentasPorPagar',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      },
      {
        id: 'proveedor',
        label: 'Proveedor',
        type: 'text'
      },
      {
        id: 'vencimiento',
        label: 'Vencimiento',
        type: 'select',
        options: [
          { value: 'todos', label: 'Todos' },
          { value: 'vencidas', label: 'Vencidas' },
          { value: 'por_vencer', label: 'Por vencer (30 días)' }
        ]
      }
    ],
    columns: [
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'proveedor', label: 'Proveedor', type: 'text', width: 150 },
      { id: 'numero_factura', label: 'N° Factura', type: 'text', width: 100 },
      { id: 'fecha_emision', label: 'Fecha Emisión', type: 'date', width: 120 },
      { id: 'fecha_vencimiento', label: 'Fecha Vencimiento', type: 'date', width: 120 },
      { id: 'monto', label: 'Monto', type: 'currency', width: 100, align: 'right' },
      { id: 'estado', label: 'Estado', type: 'text', width: 80 }
    ]
  },
  {
    id: 'pagos-realizados',
    title: 'Pagos Realizados',
    description: 'Reporte de pagos realizados',
    module: 'cuentasPorPagar',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Rango de Fechas',
        type: 'dateRange',
        required: true
      },
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      }
    ],
    columns: [
      { id: 'fecha_pago', label: 'Fecha Pago', type: 'date', width: 120 },
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'proveedor', label: 'Proveedor', type: 'text', width: 150 },
      { id: 'numero_factura', label: 'N° Factura', type: 'text', width: 100 },
      { id: 'monto_pagado', label: 'Monto Pagado', type: 'currency', width: 120, align: 'right' },
      { id: 'metodo_pago', label: 'Método Pago', type: 'text', width: 100 },
      { id: 'usuario', label: 'Usuario', type: 'text', width: 100 }
    ]
  }
];

export const inventariosReports: ReportConfig[] = [
  {
    id: 'inventario-actual',
    title: 'Inventario Actual',
    description: 'Reporte del inventario actual por farmacia',
    module: 'inventarios',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      },
      {
        id: 'categoria',
        label: 'Categoría',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las categorías' },
          { value: 'medicamentos', label: 'Medicamentos' },
          { value: 'productos', label: 'Productos' }
        ]
      },
      {
        id: 'stock_bajo',
        label: 'Solo Stock Bajo',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'si', label: 'Sí' }
        ],
        defaultValue: 'no'
      }
    ],
    columns: [
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'codigo', label: 'Código', type: 'text', width: 100 },
      { id: 'producto', label: 'Producto', type: 'text', width: 200 },
      { id: 'categoria', label: 'Categoría', type: 'text', width: 120 },
      { id: 'stock_actual', label: 'Stock Actual', type: 'number', width: 100, align: 'center' },
      { id: 'stock_minimo', label: 'Stock Mínimo', type: 'number', width: 100, align: 'center' },
      { id: 'precio_costo', label: 'Precio Costo', type: 'currency', width: 100, align: 'right' },
      { id: 'valor_inventario', label: 'Valor Inventario', type: 'currency', width: 120, align: 'right' }
    ]
  }
];

export const metasReports: ReportConfig[] = [
  {
    id: 'metas-mensuales',
    title: 'Metas Mensuales',
    description: 'Reporte de metas por mes',
    module: 'metas',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' }
    ],
    filters: [
      {
        id: 'mes',
        label: 'Mes',
        type: 'select',
        required: true,
        options: [
          { value: 'enero', label: 'Enero' },
          { value: 'febrero', label: 'Febrero' },
          { value: 'marzo', label: 'Marzo' },
          { value: 'abril', label: 'Abril' },
          { value: 'mayo', label: 'Mayo' },
          { value: 'junio', label: 'Junio' },
          { value: 'julio', label: 'Julio' },
          { value: 'agosto', label: 'Agosto' },
          { value: 'septiembre', label: 'Septiembre' },
          { value: 'octubre', label: 'Octubre' },
          { value: 'noviembre', label: 'Noviembre' },
          { value: 'diciembre', label: 'Diciembre' }
        ]
      },
      {
        id: 'año',
        label: 'Año',
        type: 'number',
        required: true,
        defaultValue: new Date().getFullYear()
      }
    ],
    columns: [
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'meta_ventas', label: 'Meta Ventas', type: 'currency', width: 120, align: 'right' },
      { id: 'ventas_realizadas', label: 'Ventas Realizadas', type: 'currency', width: 120, align: 'right' },
      { id: 'porcentaje_cumplimiento', label: '% Cumplimiento', type: 'number', width: 120, align: 'center' },
      { id: 'estado', label: 'Estado', type: 'text', width: 80 }
    ]
  }
];

export const comisionesReports: ReportConfig[] = [
  {
    id: 'comisiones-turno',
    title: 'Comisiones por Turno',
    description: 'Reporte de comisiones por turno',
    module: 'comisiones',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Rango de Fechas',
        type: 'dateRange',
        required: true
      },
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      },
      {
        id: 'cajero',
        label: 'Cajero',
        type: 'text'
      }
    ],
    columns: [
      { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'cajero', label: 'Cajero', type: 'text', width: 120 },
      { id: 'turno', label: 'Turno', type: 'text', width: 80 },
      { id: 'ventas', label: 'Ventas', type: 'currency', width: 100, align: 'right' },
      { id: 'porcentaje_comision', label: '% Comisión', type: 'number', width: 100, align: 'center' },
      { id: 'comision_calculada', label: 'Comisión', type: 'currency', width: 100, align: 'right' }
    ]
  }
];

export const valesReports: ReportConfig[] = [
  {
    id: 'vales-farmacia',
    title: 'Vales por Farmacia',
    description: 'Reporte de vales por farmacia',
    module: 'vales',
    formats: [
      { type: 'pdf', label: 'PDF', icon: '📄' },
      { type: 'excel', label: 'Excel', icon: '📊' },
      { type: 'csv', label: 'CSV', icon: '📋' }
    ],
    filters: [
      {
        id: 'fecha',
        label: 'Rango de Fechas',
        type: 'dateRange',
        required: true
      },
      {
        id: 'farmacia',
        label: 'Farmacia',
        type: 'select',
        options: [
          { value: 'todas', label: 'Todas las farmacias' },
          { value: 'farmacia1', label: 'Farmacia 1' },
          { value: 'farmacia2', label: 'Farmacia 2' }
        ]
      },
      {
        id: 'estado',
        label: 'Estado',
        type: 'select',
        options: [
          { value: 'todos', label: 'Todos' },
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'aprobado', label: 'Aprobado' },
          { value: 'rechazado', label: 'Rechazado' }
        ]
      }
    ],
    columns: [
      { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
      { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
      { id: 'numero_vale', label: 'N° Vale', type: 'text', width: 100 },
      { id: 'cliente', label: 'Cliente', type: 'text', width: 150 },
      { id: 'monto', label: 'Monto', type: 'currency', width: 100, align: 'right' },
      { id: 'estado', label: 'Estado', type: 'text', width: 80 },
      { id: 'usuario', label: 'Usuario', type: 'text', width: 100 }
    ]
  }
];
