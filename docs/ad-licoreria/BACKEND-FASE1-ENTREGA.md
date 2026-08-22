# A&D Backend Fase 1 — Informe de entrega

**Rama:** `cursor/ad-licoreria-portal-335d`  
**Fecha:** 2026-08-15  
**Merge:** no realizado (prohibido en esta fase).

---

## A. Arquitectura encontrada

- Frontend Vite/React en raíz (Donaive + POLISUR + A&D MOCK).
- API Express en `apps/api` (Donaive Core V2).
- Prisma schema PostgreSQL `donaive_core` (Organization, Project, User, capabilities, AuditLog, licencias…).
- Auth Core por headers de desarrollo (`X-User-Id`, roles, projects); JWT reservado no implementado.
- A&D UI: `src/services/ad-licoreria/repository.ts` (MOCK) — **conservado**.
- Cliente HTTP genérico: `src/services/apiClient.ts` + `VITE_API_BASE_URL`.

## B. Modelo Prisma propuesto

Nuevo schema PostgreSQL **`ad_licoreria`** (aditivo, aislado de Core):

- Organización: `AdTenant`, `AdWarehouse`, `AdOperator`, `AdOperatorPermission`, `AdAuditEvent`
- Catálogo: `AdCategory`, `AdProduct`, `AdPresentation` (precios USD/Bs + `unitsPerPresentation`)
- Inventario: `AdStock`, `AdInventoryMovement`, `AdStockTransfer` (+ lines)
- Clientes: `AdCustomer`
- Ventas: `AdSale`, `AdSaleLine` (snapshot), `AdSalePayment`
- Cuentas: `AdTableSpace`, `AdAccount`, `AdAccountLine`
- QR: `AdPrepaid`, `AdPrepaidConsumption` (token opaco)
- Cierres: `AdCashClosure`, `AdInventoryClosure` (+ lines)

Detalle y reglas: `docs/ad-licoreria/BACKEND-FASE1-PLAN.md`.

## C. Cambios realizados

| Área | Archivos |
|---|---|
| Plan | `docs/ad-licoreria/BACKEND-FASE1-PLAN.md` |
| Prisma | `apps/api/prisma/schema.prisma` (+ modelos AD) |
| Migración | `apps/api/prisma/migrations/20260815030000_ad_licoreria_fase1/` |
| API AD | `apps/api/src/ad/*` (auth, password, domain, service, routes, middleware) |
| Mount | `v1.routes.ts` → `/api/v1/ad`, `health.routes.ts` → `/health/ad` |
| Tests | `apps/api/tests/ad-fase1.test.ts`, `ad-health.test.ts` |
| Frontend adapter | `data-source.ts`, `api-client.ts`, `repository-adapter.ts`, `config/api.ts` |
| Docs | README A&D actualizado; este informe |

**No se modificó `main`.**  
**No se eliminó MOCK.**  
**No se migraron pantallas A&D a API.**

## D. Migraciones

- `20260815030000_ad_licoreria_fase1` — **aditiva**: `CREATE SCHEMA IF NOT EXISTS ad_licoreria` + enums/tablas/FKs.
- Sin `DROP`, `TRUNCATE`, `migrate reset`.
- **No aplicada** en este entorno (sin `DATABASE_URL` real). Lista para `prisma migrate deploy` en Render/DB.

## E. Endpoints creados

| Método | Ruta | Auth |
|---|---|---|
| GET | `/health/ad` | público (metadata) |
| GET | `/api/v1/ad/health` | Core + DB |
| POST | `/api/v1/ad/auth/login` | Core |
| GET | `/api/v1/ad/context` | Core + operador AD |
| GET/POST | `/api/v1/ad/warehouses` | + permisos |
| GET/POST | `/api/v1/ad/products` | + permisos |
| POST | `/api/v1/ad/products/:id/presentations` | + permisos |
| GET/PUT | `/api/v1/ad/stock` | + aislamiento depósito |
| GET/POST | `/api/v1/ad/customers` | + permisos |
| POST | `/api/v1/ad/sales` | snapshot + depósito |
| GET | `/api/v1/ad/audit` | + permisos |

## F. Seguridad

- Passwords: scrypt (`scrypt$salt$hash`), nunca texto plano.
- Autorización AD en backend (matriz espejo MOCK).
- Cajero/mesonera: depósito del operador obligatorio; body/query no puede cruzar depósitos.
- Context vía `X-Ad-Operator-Id` (+ validación vínculo `userId` salvo `donaive_admin`).
- Errores uniformes `{ error: { code, message, details } }`.
- Validación Zod de payloads.

## G. Tests

Suite `ad-fase1` + `ad-health`: auth hash, permisos, aislamiento depósito, producto/presentación, stock, cliente, venta+snapshot, auditoría, health público.

## H. Build / verificación

Ejecutado en entrega: `prisma validate`, `prisma generate`, `apps/api` test + build, frontend `npm run build` (Donaive/POLISUR/A&D mismo bundle).

## I. Riesgos

1. Migración no desplegada aún en PostgreSQL de producción/staging.
2. JWT producción pendiente; headers de desarrollo siguen en Core.
3. `AdTenant.projectId` sin FK cross-schema (integridad app-level F1).
4. Activar `VITE_AD_DATA_SOURCE=api` prematuramente no sustituye UI (adapter no redirige pantallas todavía).

## J. Qué falta para Fase 2

- Endpoints cuentas/servir, QR verify, compras, transferencias COP, cierres.
- Seed Tenant + Project A&D.
- `migrate deploy` en entorno con DB.
- Conectar Provider módulo a módulo al API.
- JWT real + login operador endurecido.
- Resolver decisiones pendientes del plan (tasa, soft-reserve, userId obligatorio).
