# A&D — Fase 8 · Dashboard financiero y operativo (entrega)

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Fecha:** 2026-08-15  
**Merge:** no.  
**Escáner / PDF / promociones avanzadas / análisis compras:** no iniciados.

---

## Criterio

| Check | Resultado |
|---|---|
| Prisma validate | PASS (sin migración nueva) |
| Migraciones | ninguna F8 (solo lectura sobre F7) |
| Tests API | ver informe |
| Build FE / API | ver informe |
| MOCK \| API | ambos |
| main / Donaive / POLISUR | sin tocar |

---

## Endpoints

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/v1/ad/finance/dashboard` | Agregado único por período |
| GET | `/api/v1/ad/finance/dashboard/drill` | Listado origen de una métrica |

Query dashboard: `preset`, `from`, `to`, `displayCurrency`, `warehouseId`.  
Query drill: `section`, `from`, `to`, `accountId`, `warehouseId`, `productId`, `limit`.

Secciones drill: `sales`, `profitability`, `payments`, `banks`, `expenses`, `exchange`, `purchases`, `inventory`, `inventoryMovements`.

---

## UI

- `/licoreria/finanzas` → **Dashboard** (antes apuntaba a Bancos)
- `/licoreria/bancos` → cuentas (F7)
- Resumen ejecutivo en Inicio permanece MOCK local; el dashboard completo está en Finanzas

---

## Reglas

1. **Solo lectura** — no modifica costos, ventas, saldos ni movimientos.
2. **Utilidad** usa **CPP histórico** (`avgCostUsd`), no costo de reposición.
3. **BCV** se muestra como tasa informativa vigente; no reescribe historial.
4. **Tasa paralela** no aparece en tarjetas/gráficos/reportes del dashboard.
5. **Saldo bancario ≠ utilidad**.
6. **Casa de Cambio** distingue valor original vs convertido; no etiqueta automática de “pérdida”.
7. Inventario usa `computeOperationalAvailability` existente.

### Decisión CPP en ventas

`AdSaleLine` no guarda snapshot de costo al vender. La utilidad del período usa el CPP actual del producto como aproximación del costo histórico contable. Documentado para una futura fase de snapshot por línea.

---

## Permisos

Nuevo: `finance.dashboard.view` (admin + supervisor).  
También acepta `finance.view` o `reports.read` para compatibilidad.

---

## MOCK

Con `VITE_AD_DATA_SOURCE=mock` el dashboard muestra resumen de ventas/utilidad desde el provider local (sin romper MOCK). Drill-down completo requiere API.

---

## Pendientes

- Snapshot de costo en líneas de venta (utilidad 100% histórica por factura)
- Export PDF/Excel real (catálogo preparado, `exportReady: false`)
- Series semanales/mensuales UI gráficas avanzadas
- Escáner, PDF tipográfico final, promociones avanzadas, análisis compras (fuera de alcance)
