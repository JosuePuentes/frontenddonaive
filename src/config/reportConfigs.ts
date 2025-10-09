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
            type: 'date' as const,
            required: true
          },
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select' as const,
            options: farmaciaOptions
          }
        ],
        columns: [
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'cajero', label: 'Cajero', type: 'text' as const, width: 100 },
          { id: 'fecha', label: 'Fecha', type: 'date' as const, width: 100 },
          { id: 'ventas', label: 'Ventas', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'gastos', label: 'Gastos', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'diferencia', label: 'Diferencia', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'estado', label: 'Estado', type: 'text' as const, width: 80 }
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
            type: 'dateRange' as const,
            required: true
          },
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select' as const,
            options: farmaciaOptions
          },
          {
            id: 'estado',
            label: 'Estado',
            type: 'select' as const,
            options: [
              { value: 'todos', label: 'Todos' },
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'verificado', label: 'Verificado' },
              { value: 'rechazado', label: 'Rechazado' }
            ]
          }
        ],
        columns: [
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'cajero', label: 'Cajero', type: 'text' as const, width: 100 },
          { id: 'fecha', label: 'Fecha', type: 'date' as const, width: 100 },
          { id: 'ventas', label: 'Ventas', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'gastos', label: 'Gastos', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'diferencia', label: 'Diferencia', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'estado', label: 'Estado', type: 'text' as const, width: 80 }
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
            type: 'date' as const,
            required: true
          },
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select' as const,
            options: farmaciaOptions
          },
          {
            id: 'categoria',
            label: 'Categoría',
            type: 'select' as const,
            options: [
              { value: 'todas', label: 'Todas las categorías' },
              { value: 'operativo', label: 'Operativo' },
              { value: 'administrativo', label: 'Administrativo' },
              { value: 'mantenimiento', label: 'Mantenimiento' }
            ]
          }
        ],
        columns: [
          { id: 'fecha', label: 'Fecha', type: 'date' as const, width: 100 },
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'categoria', label: 'Categoría', type: 'text' as const, width: 120 },
          { id: 'descripcion', label: 'Descripción', type: 'text' as const, width: 200 },
          { id: 'monto', label: 'Monto', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'usuario', label: 'Usuario', type: 'text' as const, width: 100 },
          { id: 'estado', label: 'Estado', type: 'text' as const, width: 80 }
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
            type: 'select' as const,
            options: farmaciaOptions
          },
          {
            id: 'proveedor',
            label: 'Proveedor',
            type: 'text' as const
          },
          {
            id: 'vencimiento',
            label: 'Vencimiento',
            type: 'select' as const,
            options: [
              { value: 'todos', label: 'Todos' },
              { value: 'vencidas', label: 'Vencidas' },
              { value: 'por_vencer', label: 'Por vencer (30 días)' }
            ]
          }
        ],
        columns: [
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'proveedor', label: 'Proveedor', type: 'text' as const, width: 150 },
          { id: 'numero_factura', label: 'N° Factura', type: 'text' as const, width: 100 },
          { id: 'fecha_emision', label: 'Fecha Emisión', type: 'date' as const, width: 120 },
          { id: 'fecha_vencimiento', label: 'Fecha Vencimiento', type: 'date' as const, width: 120 },
          { id: 'monto', label: 'Monto', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'estado', label: 'Estado', type: 'text' as const, width: 80 }
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
            type: 'dateRange' as const,
            required: true
          },
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select' as const,
            options: farmaciaOptions
          },
          {
            id: 'cajero',
            label: 'Cajero',
            type: 'text' as const
          }
        ],
        columns: [
          { id: 'fecha', label: 'Fecha', type: 'date' as const, width: 100 },
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'cajero', label: 'Cajero', type: 'text' as const, width: 120 },
          { id: 'turno', label: 'Turno', type: 'text' as const, width: 80 },
          { id: 'ventas', label: 'Ventas', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'porcentaje_comision', label: '% Comisión', type: 'number' as const, width: 100, align: 'center' as const },
          { id: 'comision_calculada', label: 'Comisión', type: 'currency' as const, width: 100, align: 'right' as const }
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
            type: 'dateRange' as const,
            required: true
          },
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select' as const,
            options: farmaciaOptions
          }
        ],
        columns: [
          { id: 'fecha', label: 'Fecha', type: 'date' as const, width: 100 },
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'tipo_comision', label: 'Tipo Comisión', type: 'text' as const, width: 120 },
          { id: 'monto_base', label: 'Monto Base', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'porcentaje', label: '% Comisión', type: 'number' as const, width: 100, align: 'center' as const },
          { id: 'comision_total', label: 'Comisión Total', type: 'currency' as const, width: 100, align: 'right' as const }
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
            type: 'dateRange' as const,
            required: true
          },
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select' as const,
            options: farmaciaOptions
          },
          {
            id: 'estado',
            label: 'Estado',
            type: 'select' as const,
            options: [
              { value: 'todos', label: 'Todos' },
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'aprobado', label: 'Aprobado' },
              { value: 'rechazado', label: 'Rechazado' }
            ]
          }
        ],
        columns: [
          { id: 'fecha', label: 'Fecha', type: 'date' as const, width: 100 },
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'numero_vale', label: 'N° Vale', type: 'text' as const, width: 100 },
          { id: 'cliente', label: 'Cliente', type: 'text' as const, width: 150 },
          { id: 'monto', label: 'Monto', type: 'currency' as const, width: 100, align: 'right' as const },
          { id: 'estado', label: 'Estado', type: 'text' as const, width: 80 },
          { id: 'usuario', label: 'Usuario', type: 'text' as const, width: 100 }
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
            type: 'dateRange' as const,
            required: true
          },
          {
            id: 'farmacia',
            label: 'Farmacia',
            type: 'select' as const,
            options: farmaciaOptions
          }
        ],
        columns: [
          { id: 'fecha', label: 'Fecha', type: 'date' as const, width: 100 },
          { id: 'farmacia', label: 'Farmacia', type: 'text' as const, width: 120 },
          { id: 'ventas_bs', label: 'Ventas Bs', type: 'currency' as const, width: 120, align: 'right' as const },
          { id: 'ventas_usd', label: 'Ventas USD', type: 'currency' as const, width: 120, align: 'right' as const },
          { id: 'total_ventas', label: 'Total Ventas', type: 'currency' as const, width: 120, align: 'right' as const },
          { id: 'cantidad_transacciones', label: 'Transacciones', type: 'number' as const, width: 100, align: 'center' as const }
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
            type: 'dateRange' as const,
            required: true
          },
          {
            id: 'agrupacion',
            label: 'Agrupar por',
            type: 'select' as const,
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
          { id: 'grupo', label: 'Grupo', type: 'text' as const, width: 150 },
          { id: 'total_ventas_bs', label: 'Total Ventas Bs', type: 'currency' as const, width: 120, align: 'right' as const },
          { id: 'total_ventas_usd', label: 'Total Ventas USD', type: 'currency' as const, width: 120, align: 'right' as const },
          { id: 'promedio_diario', label: 'Promedio Diario', type: 'currency' as const, width: 120, align: 'right' as const },
          { id: 'cantidad_dias', label: 'Días', type: 'number' as const, width: 80, align: 'center' as const }
        ]
      }
    ]
  };
};