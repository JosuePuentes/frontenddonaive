import type { ReportConfig } from '@/types/ReportTypes';

// Función para generar configuraciones de reportes con farmacias dinámicas
export const generateReportConfigs = (farmacias: { id: string; nombre: string }[]) => {
  const farmaciaOptions = [
    { value: 'todas', label: 'Todas las farmacias' },
    ...farmacias.map(f => ({ value: f.id, label: f.nombre }))
  ];

  return {
    cuadresReports: [
      {
        id: 'cuadres-diarios',
        title: 'Cuadres Diarios',
        description: 'Reporte de cuadres por día específico',
        module: 'cuadres',
        formats: [
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
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
            options: farmaciaOptions
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
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
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
            options: farmaciaOptions
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
      }
    ],

    gastosReports: [
      {
        id: 'gastos-diarios',
        title: 'Gastos Diarios',
        description: 'Reporte de gastos por día específico',
        module: 'gastos',
        formats: [
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
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
            options: farmaciaOptions
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
      }
    ],

    cuentasPorPagarReports: [
      {
        id: 'cuentas-pendientes',
        title: 'Cuentas Pendientes',
        description: 'Reporte de cuentas por pagar pendientes',
        module: 'cuentasPorPagar',
        formats: [
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
        ],
        filters: [
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select',
            options: farmaciaOptions
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
      }
    ],

    comisionesReports: [
      {
        id: 'comisiones-turno',
        title: 'Comisiones por Turno',
        description: 'Reporte de comisiones por turno',
        module: 'comisiones',
        formats: [
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
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
            options: farmaciaOptions
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
      },
      {
        id: 'comisiones-generales',
        title: 'Comisiones Generales',
        description: 'Reporte de comisiones generales',
        module: 'comisiones',
        formats: [
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
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
            options: farmaciaOptions
          }
        ],
        columns: [
          { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
          { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
          { id: 'tipo_comision', label: 'Tipo Comisión', type: 'text', width: 120 },
          { id: 'monto_base', label: 'Monto Base', type: 'currency', width: 100, align: 'right' },
          { id: 'porcentaje', label: '% Comisión', type: 'number', width: 100, align: 'center' },
          { id: 'comision_total', label: 'Comisión Total', type: 'currency', width: 100, align: 'right' }
        ]
      }
    ],

    valesReports: [
      {
        id: 'vales-farmacia',
        title: 'Vales por Farmacia',
        description: 'Reporte de vales por farmacia',
        module: 'vales',
        formats: [
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
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
            options: farmaciaOptions
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
    ],

    ventasReports: [
      {
        id: 'venta-total',
        title: 'Venta Total',
        description: 'Reporte de ventas totales por farmacia',
        module: 'ventas',
        formats: [
          { type: 'pdf' as const, label: 'PDF', icon: '📄' },
          { type: 'excel' as const, label: 'Excel', icon: '📊' },
          { type: 'csv' as const, label: 'CSV', icon: '📋' }
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
            options: farmaciaOptions
          }
        ],
        columns: [
          { id: 'fecha', label: 'Fecha', type: 'date', width: 100 },
          { id: 'farmacia', label: 'Farmacia', type: 'text', width: 120 },
          { id: 'ventas_bs', label: 'Ventas Bs', type: 'currency', width: 120, align: 'right' },
          { id: 'ventas_usd', label: 'Ventas USD', type: 'currency', width: 120, align: 'right' },
          { id: 'total_ventas', label: 'Total Ventas', type: 'currency', width: 120, align: 'right' },
          { id: 'cantidad_transacciones', label: 'Transacciones', type: 'number', width: 100, align: 'center' }
        ]
      },
      {
        id: 'resumen-ventas',
        title: 'Resumen de Ventas',
        description: 'Resumen consolidado de ventas',
        module: 'ventas',
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
              { value: 'dia', label: 'Día' },
              { value: 'semana', label: 'Semana' },
              { value: 'mes', label: 'Mes' }
            ],
            defaultValue: 'farmacia'
          }
        ],
        columns: [
          { id: 'grupo', label: 'Grupo', type: 'text', width: 150 },
          { id: 'total_ventas_bs', label: 'Total Ventas Bs', type: 'currency', width: 120, align: 'right' },
          { id: 'total_ventas_usd', label: 'Total Ventas USD', type: 'currency', width: 120, align: 'right' },
          { id: 'promedio_diario', label: 'Promedio Diario', type: 'currency', width: 120, align: 'right' },
          { id: 'cantidad_dias', label: 'Días', type: 'number', width: 80, align: 'center' }
        ]
      }
    ]
  };
};