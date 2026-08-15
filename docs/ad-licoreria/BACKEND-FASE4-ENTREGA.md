# A&D — Fase 4 · Persistencia real + auth JWT + E2E (entrega)

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Fecha:** 2026-08-15  
**Merge:** no.  
**MOCK:** no eliminado (`VITE_AD_DATA_SOURCE=mock|api`).

---

## Criterio de cierre (verificado al final de esta entrega)

| Check | Resultado |
|---|---|
| `npx prisma validate` | PASS |
| `npx prisma migrate status` | Database schema is up to date (F1+F2+F4) |
| `npx prisma migrate deploy` | Aplicado en PostgreSQL local `donaive_core_dev` |
| Seed `npm run seed:ad` | PASS (reproducible) |
| Auth JWT real | PASS (`POST /api/v1/ad/auth/login`) |
| `GET /api/v1/ad/context` | PASS (sesión JWT) |
| Permisos backend | PASS |
| Aislamiento por depósito | PASS (E2E C + cajero Bodegón) |
| Operaciones transaccionales | PASS (venta, servir, prepago, TR, compra, void) |
| API ↔ frontend (JWT Bearer) | PASS (sesión FE) |
| MOCK intacto | PASS |
| API `npm test` | **85/85 PASS** (incluye E2E F4) |
| API `npm run build` | PASS |
| Frontend `npm run build` | PASS |
| E2E PostgreSQL A–O | **14/14 PASS** (DB real local) |
| Donaive / POLISUR | Sin cambios de dominio |
| Merge a `main` | No |

---

## Qué quedó persistente

- Tenant / proyecto A&D (`ad-licoreria`)
- Depósitos, operadores, permisos por rol
- Productos ≠ presentaciones, stock base, movimientos
- Clientes, ventas POS (snapshot de precio), pagos
- Cuentas (pedir ≠ servir), servicio, cierre/anulación
- Prepagos + consumo con verificación identidad
- QR opaco ligado a prepago/cliente
- Compras BORRADOR/ORDERED → recepción → inventario
- Transferencias preliminares → confirmación (TR)
- Disponibilidad operativa (físico / comprometido / soft / pendiente / disponible / déficit)
- Cierres de caja e inventario
- Auditoría (`AdAuditEvent` + `warehouseId`)
- Sesiones JWT (`AdAuthSession` con jti / revocación)
- Espacios/mesas (`AdTableSpace`: number, spaceType, capacity, status)

---

## Migraciones

| Migración | Contenido |
|---|---|
| `20260815030000_ad_licoreria_fase1` | Schema base A&D |
| `20260815043000_ad_licoreria_fase2` | Ops (cuentas, prepago, TR, compras, COP…) |
| `20260815070000_ad_licoreria_fase4_auth_spaces` | **Aditiva:** `AdAuthSession`, `AdTableSpace` campos, `AdAuditEvent.warehouseId` |

**Reglas respetadas:** sin DROP, sin RESET, solo aditivo.

**Entorno de prueba (este agente):** PostgreSQL local disponible → `migrate deploy` **sí se ejecutó**.

---

## Seed

```bash
cd apps/api && npm run seed:ad
```

Crea como mínimo:

- Tenant **A&D Licorería & Bodegón** (`slug: ad-licoreria`)
- Depósitos configurables `LIC` / `BOD` (nombres no hardcodeados en reglas)
- Usuarios demo (password `AdDemo#2026` o `AD_SEED_PASSWORD`):
  - `admin`, `supervisor`, `cajero.lic`, `cajero.bod`, `mesonera.lic`, `mesonera.bod`, `inventario`, `tv`
- Productos/presentaciones (cerveza U/balde/caja, bebidas, bodegón)
- Stock inicial + espacios

Hash: `hashPassword` (scrypt) — **nunca** texto plano.

---

## Autenticación

- `POST /api/v1/ad/auth/login` — valida usuario/password/activo, carga rol/permisos/depósito, emite JWT HS256 + `AdAuthSession`
- `POST /api/v1/ad/auth/logout` — revoca jti
- `GET /api/v1/ad/context` — usuario, rol, permisos, depósito, tenant/proyecto
- Middleware: **Bearer obligatorio**; `X-Ad-Operator-Id` solo si `AD_ALLOW_DEV_HEADERS=1` (no prod)
- Secrets: `AD_JWT_SECRET` (fallback `JWT_SECRET`)

El backend **no confía** en `warehouseId` / `operatorId` / `role` del body para autorización POS/mesonera.

---

## Endpoints clave F4 (además de F1–F3)

| Método | Ruta | Notas |
|---|---|---|
| POST | `/api/v1/ad/auth/login` | Público |
| POST | `/api/v1/ad/auth/logout` | Revoca sesión |
| GET | `/api/v1/ad/context` | JWT |
| POST | `/api/v1/ad/sales` | Incluye `continueWithShortage` + motivo |
| POST | `/api/v1/ad/sales/:id/void` | Revierte stock movido + auditoría before/after |

Resto (cuentas, COP, transferencias, compras, prepagos, cierres, reportes) permanece en routers F2/F3 con persistencia Prisma.

---

## Permisos y aislamiento

- Matriz backend = espejo MOCK (`pos.sell`, `pos.shortage_override`, `inventory.*`, `cop.*`, `purchase.*`, `users.manage`, `settings.manage`, `reports.*`, `closures.*`, `tv.*`, …)
- CAJERO/MESONERA: depósito efectivo = asignado; intento de operar otro depósito → DENEGADO
- `pos.shortage_override`: permiso + motivo + auditoría `shortage_override` (disponibilidad operativa; el físico sigue sin permitir negativo)

---

## Frontend

- `session.ts`: guarda `accessToken`; headers solo `Authorization: Bearer …`
- Selector: `VITE_AD_DATA_SOURCE=mock` (default) | `api`
- Sin rediseño de UX; Diseño Web / TV siguen capas locales MOCK

---

## Tests ejecutados (post-cambios finales)

```bash
cd apps/api && npm test          # 85/85
cd apps/api && npm run build
npm run build                    # frontend root
cd apps/api && npx prisma validate
cd apps/api && npx prisma migrate status
```

E2E F4 (`tests/ad-fase4-e2e.test.ts`) contra PostgreSQL real:

A Login ADMIN · B CAJERO Lic · C acceso Bodegón DENEGADO · D venta · E/F cuenta 20→8+5 / 7 pend · G prepago · H QR · I transferencia · J compra · K shortage · L cierre caja · M cierre inventario · N/O void + auditoría.

---

## Pendiente / no F4

- WhatsApp real, WebSocket TV, cloud storage, escáner QR nativo, bancos
- Nuevos módulos / rediseño Home
- Algunos stubs FE aún delegan a MOCK (p. ej. Diseño/TV; `voidSale` API existe y E2E la cubre — wiring FE progresivo puede completarse sin rediseño)
- Entornos **sin** PostgreSQL: dejar `migrate deploy` pendiente (no inventar PASS)

---

## Regresión

- Donaive Core / POLISUR: no modificados en esta fase
- `main`: no merge
- MOCK: intacto
- Rutas A&D bajo `/api/v1/ad` con JWT propio (sin exigir `X-User-Id` Core)
