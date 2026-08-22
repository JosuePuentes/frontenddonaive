# A&D Licorería — Fase 9: Cierre funcional comercial y financiero

## Objetivo

Cerrar pendientes comerciales/financieros post F8 sin duplicar modelos ni romper MOCK. Alcance: análisis de compras, precios/presentaciones, promociones, escáner, documentos, conciliación, casa de cambio, dashboard, auditoría y tests.

## Reutilizado (no duplicado)

| Área | Origen |
|------|--------|
| Bonificación / CPP / CxP | F5–F6 `commerce-domain`, `commerce-purchase` |
| Precios utilidad / below-cost | F5 `POST /pricing/presentation` |
| Promociones / combos create | F5 |
| Reposición / OC | F5 `suggestReplenishment`, `purchaseAnalysis` |
| Casa de cambio / ledger | F7 |
| Dashboard agregado | F8 |

## Nuevos / completados en F9

### Endpoints

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/v1/ad/promotions` | Listado |
| PATCH | `/api/v1/ad/promotions/:id` | Activar/desactivar / métodos |
| GET | `/api/v1/ad/commerce/purchase-orders` | Listado OC |
| PATCH | `/api/v1/ad/commerce/purchase-orders/:id` | Confirmar / editar líneas |
| GET | `/api/v1/ad/finance/reconciliations/preview` | Preview |
| GET | `/api/v1/ad/finance/reconciliations` | Histórico |
| POST | `/api/v1/ad/finance/reconciliations` | Registrar (auditado) |
| GET | `/api/v1/ad/finance/dashboard?preset=ultimos_7_dias` | Nuevo preset |

### Migración

`20260815230000_ad_licoreria_fase9_closure` — tabla `AdFinancialReconciliation`.

### Permiso

`finance.reconcile` — admin + supervisor.

### Rutas FE

- `/licoreria/finanzas/conciliacion`
- `/licoreria/promociones`
- Análisis compras UI usable (`/compras/analisis`)
- Presentaciones con utilidad/precio + override
- Escáner `AdProductScanner` (cámara opcional + fallback manual)

### Documentos / PDF

- Sin dependencia PDF en `package.json`.
- Fallback oficial: HTML + `window.print()` / Guardar como PDF (`document-export.ts`).
- Impresión no incluye utilidad, margen ni tasa paralela.

## Reglas clave

1. **CPP histórico** inmutable; bonificación reduce costo efectivo y **no** aumenta CxP.
2. **Costo de reposición** = tasas actuales (finance); no reescribe histórico.
3. **Reposición**: `need = avgDaily × X días − (disponible operativo + OC en tránsito)`. Sin stock mínimo fijo.
4. **Precio bajo costo**: requiere `pricing.override` + motivo + auditoría `price_below_cost`.
5. **Zona crítica provisional**: utilidad &lt; 5% sobre costo (ver decisiones pendientes).
6. **Casa de cambio**: venta original intacta; se muestran valor original, convertido, tasa e impacto; **no** se etiqueta pérdida automática por cambio de representación.
7. **Conciliación**: `difference = declared − system`; no modifica saldos.
8. **Tasa paralela**: nunca en UI pública / documentos / dashboard.

## MOCK

`VITE_AD_DATA_SOURCE=mock` sigue operativo. Análisis/promos/conciliación/API pricing requieren `api` para datos reales; la UI degrada con mensaje claro.

## Tests

`apps/api/tests/ad-fase9-cierre.test.ts` — A–O + búsqueda.

## Decisiones pendientes (NO inventadas en silencio)

1. **Umbral exacto de “cerca del costo / zona crítica”** — provisional 5% utilidad; negocio debe confirmar.
2. **Snapshot de costo en `AdSaleLine`** — utilidad dashboard sigue aproximando con CPP actual del producto (limitación F8 documentada).
3. **Pipeline OC → compra automática** — F9 confirma OC; conversión a `AdPurchase` no es automática.
4. **Motor PDF tipográfico embebido** — diferido; fallback print-HTML.
5. **Parser Excel binario nativo** — import JSON rows sigue siendo el contrato.

## Fuera de alcance (no iniciar)

Escáner avanzado industrial, PDF tipográfico server-side, promociones calendarias avanzadas, análisis de compras ML, merge a `main`, cambios Donaive/POLISUR.
