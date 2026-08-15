# A&D — Fase 5 · Comercio / compras profesionales (entrega)

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Fecha:** 2026-08-15  
**Merge:** no.  
**MOCK:** intacto (`VITE_AD_DATA_SOURCE=mock|api`).

---

## Criterio de cierre (verificado)

| Check | Resultado |
|---|---|
| `prisma validate` | PASS |
| `migrate status` | up to date (F1–F5) |
| `migrate deploy` | Aplicado en PostgreSQL local |
| API `npm test` | Incluye F5 (dominio + E2E A–X) |
| API build | PASS |
| Frontend build | PASS |
| Donaive / POLISUR | Sin cambios de dominio |
| Merge a `main` | No |

---

## Qué se implementó

### Persistencia (migración aditiva)
`20260815090000_ad_licoreria_fase5_commerce`

- Extiende `AdPurchase` / `AdPurchaseLine` (bonificación, costMode, costos efectivos, snapshots de tasa, CxP link)
- `AdSupplier`, `AdPayable`, `AdPayablePayment`
- `AdExchangeRate` (BCV | PROTECTED)
- `AdPaymentMethod` (`usesSpecialRateRef`)
- `AdPresentationPrice`, `AdPromotion`(+items/métodos), `AdCombo`(+items/métodos)
- `AdPurchaseOrder`(+lines), `AdImportBatch`/`AdImportRow`
- Índices de búsqueda producto (sku/barcode/name/brand)

### Dominio puro
`apps/api/src/ad/commerce-domain.ts` — costo unitario/caja/total, bonificación, equivalente protegida→BCV, utilidad/precio, reposición.

### API (`adCommerceRouter`)
| Área | Endpoints |
|---|---|
| Búsqueda / escaneo contrato | `GET /products/search`, `GET /products/by-code` |
| Proveedores | `GET/POST /suppliers`, `GET/PATCH /suppliers/:id` |
| Compras F5 | `POST /commerce/purchases`, `POST /commerce/purchases/:id/confirm` |
| CxP | `GET /payables`, `POST /payables/:id/payments` |
| Tasas | `GET/POST /rates/bcv`, `GET/POST /rates/protected` |
| Métodos pago | `GET/POST /payment-methods` |
| Precios | `POST /pricing/presentation`, `GET /pricing/pos` |
| Promos / combos | `POST /promotions`, `POST /combos` |
| Análisis / OC | `GET /commerce/analysis`, `GET /commerce/replenishment`, `POST /commerce/purchase-orders` |
| Import | `POST /imports/preview`, `POST /imports/confirm` |

Recepción de stock sigue en `POST /purchases/:id/receive` (F2) usando **qty recibida** + **costo efectivo** para CPP.

### Permisos nuevos
`products.manage`, `products.cost.manage`, `purchases.*`, `suppliers.manage`, `payables.manage`, `pricing.manage`, `pricing.override`, `promotions.manage`, `purchase-analysis.view`, `purchase-orders.create`, `rates.bcv.manage`, `rates.protected.manage`

Backend es autoridad. Tasa protegida **no** se lista en respuestas de compra (`protectedRateSnapshot` sanitizado).

### Frontend
Rutas: `/licoreria/compras`, `/compras/analisis`, `/proveedores`, `/importacion`, `/configuracion/tasas`  
Cliente: `commerce-client.ts` (JWT). MOCK/API dual preservado; módulos F5 avanzados requieren sesión API.

### Reglas clave
- PEDIR≠SERVIR intacto (no tocado)
- Bonificación no aumenta CxP; sí reduce costo efectivo inventario
- Transferencias no generan costo de compra
- Snapshots de tasa históricos no se sobrescriben
- Precio bajo costo: `pricing.override` + motivo + auditoría

---

## Tests

`tests/ad-fase5-commerce.test.ts`

- Dominio puro: C/D/E/F/L/N/O/V  
- E2E PG: A/B búsqueda, G proveedor, J/K tasas, D/E/F/H/I/L/M compra+CxP+CPP, N/O/P/Q precios+auditoría, R/S promo método, T combo, U/V/W análisis/OC, import, X aislamiento

---

## Riesgos / pendientes

- UI de promociones/combos/POS integración de precio por método: API lista; UI POS puede consumir `GET /pricing/pos` progresivamente
- Parser Excel nativo (xlsx): contrato JSON/CSV listo; binario Excel nativo pendiente
- Escáner cámara nativo: contrato `by-code?source=camera|wedge|manual` listo; sin SDK hardware
- Módulo bancos / conciliación: preparado vía `paymentMethod.accountLabel` + CxP
- Seed no crea proveedores/tasas por defecto (se crean en E2E / UI)

---

## No hecho (explícito)

WhatsApp, WebSocket TV, cloud storage, integración bancaria real, merge a main, Fase 6+.
