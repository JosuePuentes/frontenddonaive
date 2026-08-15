# A&D — Cierre funcional (post F9)

## Objetivo

Cerrar pendientes reales de F9 antes de validación de negocio / despliegue.

## Cambios

### 1. Snapshot de costo en `AdSaleLine` (prioridad)

Al confirmar venta se guardan:

- `unitCostUsdSnapshot` / `unitCostBsSnapshot`
- `lineCostUsdSnapshot` / `lineCostBsSnapshot`
- `cppUsdSnapshot` / `cppBsSnapshot`
- `costSource`, `costSnapshotAt`, `bcvRateAtSale`, `costCurrency`

La utilidad histórica = ingreso − costo snapshot. **Nunca** CPP actual.

### 2. OC → compra

`POST /api/v1/ad/commerce/purchase-orders/:id/convert`

- Idempotente vía `AdPurchase.purchaseOrderId` único
- Segunda conversión retorna la misma compra (`idempotent: true`)
- Opcional `confirm: true` → totaliza + confirma (inventario/CxP una sola vez)

### 3. PDF real

- `GET /api/v1/ad/documents/purchases/:id/pdf`
- `GET /api/v1/ad/documents/purchase-orders/:id/pdf`
- Motor: **pdfkit** (API)
- Sin utilidad / margen / PVP / tasa paralela
- Fallback FE: print-HTML

### 4. Umbral zona crítica configurable

En `AdFinanceSettings`:

- `pricingCriticalUtilityPercent` (precios)
- `inventoryCriticalCoverageDays` / `inventoryWarnCoverageDays` (reposición)

UI: Configuración financiera.

### 5. Dashboard

Filtros: producto, método de pago, proveedor, depósito + períodos.
Rentabilidad usa snapshot.

## Migración

`20260815240000_ad_licoreria_cierre_snapshot_pdf`

## Tests

`apps/api/tests/ad-cierre-final.test.ts` — escenarios A–J + PDF + umbral.

## Pendientes / límites

- PDF de transferencias/recibos/cierres: estructura lista; compra y OC implementados primero.
- Snapshot en ventas previas a esta migración = 0 (solo ventas nuevas).
- Tasa paralela sigue privada (no en PDF/dashboard).
