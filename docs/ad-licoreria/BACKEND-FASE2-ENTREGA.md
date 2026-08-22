# A&D Backend — Fase 2 · Entrega

**Rama:** `cursor/ad-licoreria-portal-335d`  
**Fecha:** 2026-08-15  
**Merge:** no.

---

## A. Modelos agregados / extendidos

Nuevos / extendidos en `ad_licoreria`:

- `AdAccount` (+ number, discounts, void/close), `AdAccountPayment`, `AdServiceLog`
- `AdPrepaid` (+ code, phone, document, version, warehouse, sourceAccount), `AdPrepaidItem`
- `AdCustomerCommitment` (`blocksSales=false`)
- `AdPurchase`, `AdPurchaseLine`, `AdPurchaseRequest`
- `AdProduct.avgCostUsd/Bs` (CPP)
- `AdTenant.timezone` (período HOY)
- `AdStockTransfer.stockMoved`, statuses extendidos
- Movement types: `PREPAID_CONSUME`, `ADJUST_IN/OUT`

## B. Migración

`apps/api/prisma/migrations/20260815043000_ad_licoreria_fase2/`

- Aditiva sobre F1 (`20260815030000_ad_licoreria_fase1`)
- Sin DROP / TRUNCATE / reset
- Defaults seguros en columnas NOT NULL nuevas
- **No aplicada** aquí (sin DB autorizada)

## C. Endpoints (`/api/v1/ad`)

| Dominio | Rutas |
|---|---|
| Accounts | `POST /accounts`, `/accounts/:id/items`, `/serve`, `/close`, `/void` |
| Inventory | `GET /inventory`, `/inventory/availability` |
| Purchases | `POST /purchases`, `/purchases/:id/receive` |
| Transfers | `POST /transfers`, `/transfers/:id/receive` (atómico v1) |
| Prepaids/QR | `POST /prepaids`, `/prepaids/:id/consume`, `GET /qr/:token` |
| COP | `GET /cop/availability`, `POST /cop/purchase-requests` |
| Closures | `POST /closures/cash`, `/closures/inventory` |

(+ F1: health, auth, context, warehouses, products, stock, customers, sales, audit)

## D. Reglas implementadas

- PEDIR ≠ descuento; SERVIR sí (kardex `SERVE`)
- Compromiso activo afecta disponible operativo; no bloquea venta física
- Pendiente cliente post-cierre → commitment (`blocksSales=false`) o prepago
- Prepago: **no** descuenta al crear; descuenta al consumir (`PREPAID_CONSUME`) — alineado a F2 (MOCK UI sigue descontando al crear)
- QR: token opaco + verify teléfono y cédula
- Transferencias: flujo atómico DRAFT→RECEIVED (v1)
- Compras: ORDERED → RECEIVE + CPP USD/Bs independientes
- Cierre caja: período HOY por `AdTenant.timezone` (backend)
- Anulación cuenta: solo revierte qty servida

## E. Transacciones / concurrencia

- Serve: `updateMany` stock `qty >= need` + serve line guard
- Prepaid consume: version optimistic + item qty guard + stock guard
- Purchase receive / transfer confirm: status/`stockMoved` guard anti-doble
- Lock in-memory en motor de tests

## F. Auditoría

Eventos: create/add_item/serve/close/void account, prepaid create/consume, purchase create/receive, transfer create/confirm, closures, stock set. before/after cuando aplica.

## G. Tests

`ad-fase2-ops.test.ts` — 20 escenarios solicitados (motor in-memory + mismas reglas).  
Suites F1 previas se mantienen.

## H. Build

Ver ejecución en entrega: prisma validate, api test/build, frontend build.

## I. Qué queda MOCK

- Toda la UI A&D (`repository.ts`) con `VITE_AD_DATA_SOURCE=mock`
- Diseño web / TV / WhatsApp
- Prepago MOCK aún descuenta al crear (diferencia documentada vs API F2)

## J. Riesgos

1. Migración F2 no desplegada.
2. JWT sigue pendiente (no inventado).
3. `projectId` cross-schema: unique index + validación app-level; **sin FK** a `donaive_core` (evitar acoplar schemas). Solución F3 candidata: trigger/check o tabla puente.
4. Prepago MOCK vs API diverge en momento de descuento stock.
5. Transfer EN_TRÁNSITO multi-paso completo deferred (atómico v1 OK por spec).
6. `todayPeriodBounds` usa dateKey + UTC day window (refinar TZ lib en F3 si hace falta).

## K. Qué falta para Fase 3

- Conectar pantallas módulo a módulo al API (`VITE_AD_DATA_SOURCE=api`)
- JWT / sesión real
- Seed Tenant+Project+operadores
- `migrate deploy` en Render
- Soft-reserve transfer multi-paso estricto (opcional)
- Unificar regla prepago MOCK↔API en UI
- WhatsApp / TV / diseño a backend
