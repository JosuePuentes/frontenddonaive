# A&D — Fase 3 · Conexión Frontend ↔ API real

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Fecha:** 2026-08-15  
**Merge:** no.  
**MOCK:** no eliminado.

---

## Objetivo

Migrar el portal A&D desde `repository.ts` (MOCK) hacia `apps/api` mediante:

- `VITE_AD_DATA_SOURCE=mock` → MOCK (default seguro)
- `VITE_AD_DATA_SOURCE=api` → API real + PostgreSQL/Prisma

El usuario puede volver a MOCK sin romper la app.

---

## Endpoints conectados (nuevos / usados en F3)

### Públicos (sin `X-User-Id` Core)

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/v1/ad/auth/login` | Login A&D por `tenantSlug` + usuario/password |
| POST | `/api/v1/ad/bootstrap` | Crear tenant inicial + depósitos LIC/BOD + admin |

### Portal (auth Core + `X-Ad-Operator-Id`)

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/v1/ad/snapshot` | Hidratación completa del FE |
| GET/POST/PUT | `/api/v1/ad/operators` | CRUD usuarios |
| GET | `/api/v1/ad/permissions/matrix` | Matriz roles |
| PATCH | `/api/v1/ad/warehouses/:id` | Editar/activar depósito |
| GET | `/api/v1/ad/accounts` | Listado cuentas (filtro mesonera) |
| GET | `/api/v1/ad/accounts/:id` | Detalle cuenta |
| POST | `/api/v1/ad/accounts/:id/payments` | Pagos de cuenta |
| GET | `/api/v1/ad/reports/summary` | Resumen reportes |

### Ya existentes F1/F2 usados por el adapter

Auth context, warehouses, products/presentations, stock, customers, sales (`AD-YYYY-######`), accounts (open/items/serve/close/void), inventory/availability, purchases+receive, transfers (`TR-YYYY-######`), prepaids+consume+QR, COP, closures, audit.

---

## Módulos conectados (FE)

| # | Módulo | Estado F3 |
|---|---|---|
| 1 | Autenticación | Login panel + sesión `sessionStorage` |
| 2 | Contexto / tenant | Headers de sesión + hydrate snapshot |
| 3 | Usuarios y permisos | `upsertOperator` → API |
| 4 | Depósitos | create / patch active |
| 5 | Productos | CRUD API |
| 6 | Presentaciones | CRUD API |
| 7 | Inventario / stock | snapshot + setInventoryQty + availability local |
| 8 | Clientes | upsert API |
| 9 | POS / ventas | preliminar local → `POST /sales` real |
| 10 | Cuentas | open/items/payments/close/void |
| 11 | Mesonera | await + API serve/add |
| 12 | Servir | `POST .../serve` |
| 13 | Pagos | cuenta + venta (USD/Bs independientes) |
| 14 | Prepagos | create/consume API |
| 15 | QR | consume exige teléfono+cédula |
| 16 | Compras | create+receive |
| 17 | COP | dashboard + purchase-requests |
| 18 | Transferencias | draft+receive |
| 19 | Cierres | cash + inventory |
| 20 | Auditoría | vía snapshot |
| 21 | Reportes | summary endpoint (UI presets MOCK-compatible) |

**Siguen en MOCK local (no rompen):** Diseño Web, TV / Digital Signage, métodos de pago UI, algunos stubs (reopen/discount/table reassign).

---

## Mecanismo dual

```
getAdRepository()
  mock → adLicoreriaRepository (repository.ts)
  api  → adApiBackedRepository (api-backed-repository.ts)
```

Archivos clave FE:

- `src/services/ad-licoreria/data-source.ts`
- `src/services/ad-licoreria/session.ts`
- `src/services/ad-licoreria/api-backed-repository.ts`
- `src/services/ad-licoreria/repository-adapter.ts`
- `src/services/ad-licoreria/async-result.ts`
- `src/providers/ad-licoreria/AdLicoreriaProvider.tsx`
- `src/components/ad-licoreria/AdApiLoginPanel.tsx`

---

## Tests

| Suite | Resultado |
|---|---|
| `apps/api` vitest | **71 passed** (incluye `ad-fase3-portal.test.ts` × 8) |
| `apps/api` `tsc` build | OK |
| Root `npm run build` (FE) | OK |

Cobertura F3 API: login/bootstrap montaje público, snapshot protegido, matriz roles, password.

---

## Build

- Frontend: `npm run build` ✓
- API: `cd apps/api && npm run build` ✓
- API tests: `cd apps/api && npm test` → 71/71 ✓

---

## Archivos principales modificados / creados

### API

- `apps/api/src/ad/public-auth.routes.ts` (nuevo)
- `apps/api/src/ad/portal.routes.ts` (nuevo)
- `apps/api/src/ad/portal.service.ts` (nuevo)
- `apps/api/src/app.ts` (monta auth público antes de Core auth)
- `apps/api/src/ad/routes.ts` (monta portal router)
- `apps/api/tests/ad-fase3-portal.test.ts` (nuevo)

### Frontend

- `api-backed-repository.ts`, `session.ts`, `async-result.ts`
- `repository-adapter.ts`, `AdLicoreriaProvider.tsx`
- `AdApiLoginPanel.tsx`, `AdLicoreriaLayout.tsx`
- Páginas A&D: Ventas, Cuentas, Mesonera, COP, QR, Cierres, Clientes, Productos, Presentaciones, Depósitos, Config, ChargePanel, etc. (`resolveAdResult`)

---

## Pendientes

1. **JWT real** — sigue headers de desarrollo (`X-User-Id` / `X-Ad-Operator-Id`); no inventado.
2. **Migraciones F2** aplicar en entorno con PostgreSQL autorizado.
3. Algunos stubs aún delegan a MOCK en modo API: descuentos/reabrir cuenta, reassign mesonera, TV/diseño (intencional).
4. Reportes UI: summary API conectado; filtros avanzados pueden seguir enriqueciendo desde snapshot local.
5. Prepago: API descuenta stock al **consumir**; MOCK UI histórico puede diferir (documentado F2).
6. Pruebas E2E con DB real (login → venta → recibo `AD-YYYY-######`).

---

## Riesgos

- Sin sesión API en modo `api`, mutaciones fallan con mensaje claro (no hay silent fallback a MOCK).
- Headers de desarrollo no son JWT: no usar en producción pública sin capa auth.
- Snapshot carga hasta N registros (300 ventas/cuentas); tenants grandes necesitarán paginación.
- POS preliminar es local; confirmación es API — si falla la red tras preliminar, el draft queda cancelable localmente.

---

## Cómo probar modo API

```bash
# API
cd apps/api && npm run dev

# FE
VITE_AD_DATA_SOURCE=api VITE_API_BASE_URL=http://localhost:PORT npm run dev
```

1. Abrir `/licoreria`
2. Bootstrap tenant (si vacío) → Login
3. Hydrate automático vía `/snapshot`
4. Operar POS / cuentas / COP

Volver a MOCK: quitar flag o `VITE_AD_DATA_SOURCE=mock`.

---

## No tocado

- Donaive / POLISUR / rutas `/polisur`
- `main` (sin merge)
- Eliminación de MOCK
