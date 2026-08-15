# A&D Backend — Fase 1 · Plan de arquitectura

**Rama:** `cursor/ad-licoreria-portal-335d`  
**Fecha:** 2026-08-15  
**Objetivo:** cimientos API + Prisma para migrar A&D módulo a módulo sin romper el frontend MOCK.

---

## A. Arquitectura encontrada (auditoría)

### Monorepo

| Pieza | Ubicación | Rol |
|---|---|---|
| Frontend Vite/React | `/workspace` (raíz) | Donaive + POLISUR + A&D MOCK |
| API Express | `apps/api` | Donaive Core V2 |
| Contratos | `packages/core`, `packages/domain` | Plataforma |
| Prisma | `apps/api/prisma/schema.prisma` | Schema PostgreSQL `donaive_core` |

### Prisma actual (`donaive_core`)

Plataforma multi-project: `Organization`, `Project`, `User`, `Capability`, `RoleCapability`, `UserRoleAssignment`, `ProjectUser`, licencias, templates, `AuditLog`, analytics/AI prep.

- **No** hay POS, inventario operativo, ventas, cuentas, QR ni depósitos A&D.
- `ProjectCategory` ya incluye `liquor_store` y `liquor_and_grocery` (útil para marcar el Project A&D).
- `User.passwordHash` existe; **JWT aún no implementado** (auth por headers de desarrollo: `X-User-Id`, `X-User-Roles`, `X-Accessible-Project-Ids`).
- Aislamiento: schema `donaive_core` vs legacy `public`.

### API actual

- Health: `/health`, `/health/live`, `/health/ready`
- Rutas protegidas: `/api/v1/projects|templates|updates|plans|licenses|subscriptions|audit`
- Middleware: helmet, cors, `databaseGuard`, `authMiddleware`, `errorHandler` uniforme `{ error: { code, message, details } }`
- Validación: Zod en env; services con AppError hierarchy

### Frontend A&D

- Fuente de verdad operativa: `src/services/ad-licoreria/repository.ts` (MOCK en memoria)
- Diseño web: `localStorage` (draft/published)
- TV: repository + realtime MOCK
- Cliente HTTP genérico: `src/services/apiClient.ts` + `VITE_API_BASE_URL` (no usado por A&D aún)

### Conflicto / no-conflicto

| Tema | Decisión |
|---|---|
| Reutilizar `User` de Donaive | **Sí** — identidad global; perfil operativo A&D aparte |
| Reutilizar `PlatformRole` | **No** — roles A&D (`admin/cajero/mesonera/…`) son de negocio del local, no de plataforma |
| Reutilizar `AuditLog` de Core | **Parcial** — Core audit es de plataforma; A&D necesita audit operativo con before/after de ventas/stock. Se crea `AdAuditEvent` en schema A&D; opcionalmente espejo a Core después |
| Meter tablas A&D en `donaive_core` | **No** — contaminaría el schema de plataforma. Nuevo schema PostgreSQL `ad_licoreria` |
| Borrar / reset DB | **Prohibido** — solo migraciones aditivas |
| Eliminar MOCK frontend | **No en Fase 1** |

---

## B. Entidades a reutilizar vs nuevas

### Reutilizar (donaive_core)

- `User` — login/email/passwordHash/status
- `Project` — contenedor A&D (`category = liquor_and_grocery`, slug técnico estable)
- `Organization` — dueño comercial del Project
- `Capability` / `RoleCapability` — capabilities de plataforma (no reemplazan permisos A&D)
- Auth middleware + AppError + health + CORS

### Nuevas (schema `ad_licoreria`)

Núcleo Fase 1 (modelo Prisma + servicios mínimos):

**Organización / operación**

- `AdTenant` — vínculo 1:1 con `Project.id` (string; integridad app-level en F1)
- `AdWarehouse`
- `AdOperator` — perfil operativo (username, role A&D, warehouseId, userId opcional → User)
- `AdOperatorPermission` — permisos granulares A&D (`pos.sell`, `pos.shortage_override`, …)
- `AdAuditEvent`

**Catálogo**

- `AdCategory`
- `AdProduct`
- `AdPresentation` — `unitsPerPresentation` configurable; precios USD y Bs independientes

**Inventario**

- `AdStock` — qtyBase por (productId, warehouseId)
- `AdInventoryMovement` — kardex
- `AdStockTransfer` + `AdStockTransferLine` — estados de documento

**Clientes**

- `AdCustomer` — nombre, cédula, teléfono

**Ventas**

- `AdSale`, `AdSaleLine` (precio snapshot), `AdSalePayment`, recibo

**Cuentas / mesonera** (modelo en Prisma; API completa en Fase 2+)

- `AdAccount`, `AdAccountLine`, `AdTableSpace`

**Prepagos / QR** (modelo; API completa en Fase 2+)

- `AdPrepaid`, `AdPrepaidConsumption`

**Cierres** (modelo; API completa en Fase 2+)

- `AdCashClosure`, `AdInventoryClosure` (+ líneas)

---

## C. Relaciones e índices (resumen)

- Tenant → Warehouses, Operators, Products, Customers, Sales, …
- Product → Presentations; Stock por Warehouse
- Operator → Warehouse opcional (obligatorio para POS/mesonera en reglas de servicio)
- Sale → Warehouse, Operator, Customer?; lines con presentationId + priceUsd/priceBs snapshot
- Transfer: fromWarehouseId ≠ toWarehouseId (CHECK + validación servicio)
- Índices: `(tenantId, …)`, uniques `(warehouseId, productId)` stock, `receiptNumber`, `qrToken` opaco unique
- Auditoría: action, entity, entityId, userId, before/after JSON, createdAt

Claves: UUID string `@default(uuid())` alineado con Core.

---

## D. Reglas de negocio → restricciones DB / servicio

| Regla MOCK | En Fase 1 |
|---|---|
| Producto ≠ presentación | Modelos separados |
| Conversión configurable | `unitsPerPresentation` Decimal/Float |
| USD/Bs independientes | Columnas `priceUsd` + `priceBs`; sin tasa automática en DB |
| Snapshot de precio en venta | Columns en `AdSaleLine` inmutables post-create |
| Pedir ≠ descontar; Servir sí | Movimientos solo en serve / sale confirm (servicio; cuentas en F2) |
| Comprometido vs físico | Calculado en servicio (cuentas abiertas); no columna única “disponible” como verdad |
| Pendiente cliente post-cierre no bloquea físico | Documentado; lógica en F2 ventas |
| Depósitos independientes | `AdStock` por warehouse |
| POS no cruza depósitos | Middleware + validación `operator.warehouseId === sale.warehouseId` |
| Compra con destino | Modelo compra F2; transfer ya con origen/destino |
| QR token opaco + identidad | Campos en `AdPrepaid`; endpoints F2 |
| Password no plano | `passwordHash` con scrypt (Node crypto); nunca texto |

### Decisiones pendientes (NO inventar en DB irreversible)

1. **¿Un solo Tenant A&D o multi-tenant A&D por Organization?** → F1 asume **un Tenant por Project**; seed configurable.
2. **¿Tasa de cambio vive en settings globales del Tenant o por venta?** → MOCK tiene settings; columna `AdTenantSettings.exchangeRateUsdToBs` opcional; **no** auto-convertir.
3. **¿Reserva soft de stock al abrir cuenta?** → MOCK no soft-reserve; F2 debe confirmar antes de constraint de stock.
4. **¿JWT vs headers para operadores A&D?** → F1 reutiliza headers Core + contexto A&D; JWT producción pendiente (`JWT_SECRET` reservado).
5. **¿Operadores A&D obligatoriamente Users de Donaive?** → F1 `userId` **opcional**; recomendación F2: obligatorio para producción.

---

## E. Estrategia MOCK → API

```
UI (sin cambios estructurales)
  → AdLicoreriaProvider
    → dataSource adapter  (NUEVO)
         ├─ mock: repository.ts (default F1)
         └─ api:  adApiClient → /api/v1/ad/*  (preparado, feature flag)
```

- **No eliminar** `repository.ts`.
- Feature flag: `VITE_AD_DATA_SOURCE=mock|api` (default `mock`).
- Migración progresiva por módulo en Fases 2+: catálogo → inventario → clientes → ventas → cuentas → QR → cierres → diseño → TV.

### Fuente de verdad tras F1

| Dominio | Verdad |
|---|---|
| Plataforma Donaive | PostgreSQL `donaive_core` |
| Operación A&D (cuando API on) | PostgreSQL `ad_licoreria` |
| UI A&D por defecto | MOCK memoria |
| Diseño web / TV | Sigue MOCK hasta fase dedicada |

---

## F. API Fase 1 (solo infraestructura + núcleo)

Prefijo: `/api/v1/ad`

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/health` | Health A&D (schema + flags) |
| GET | `/context` | Usuario + operador + warehouse + permisos |
| GET/POST | `/warehouses` | Listar / crear depósito |
| GET/POST | `/products` | Catálogo |
| POST | `/products/:id/presentations` | Presentación + conversión |
| GET/PUT | `/stock` | Stock por depósito |
| GET/POST | `/customers` | Clientes |
| POST | `/sales` | Venta con snapshot + aislamiento depósito |
| GET | `/audit` | Auditoría operativa |

Auth: mismos headers Core + `X-Ad-Operator-Id` / resolución por userId.  
Autorización: permisos A&D en backend (no confiar en body del cliente para warehouse).

---

## G. Riesgos

1. `DATABASE_URL` vacía en este entorno → migración creada pero **no aplicada** aquí; `prisma validate` + `generate` sí.
2. Tests de integración Core asumen Postgres local; no deben romperse.
3. Multi-schema Prisma: hay que listar `ad_licoreria` en `schemas = [...]`.
4. Duplicar conceptos User vs AdOperator si no se documenta el vínculo.
5. Migrar UI demasiado pronto rompería demos; flag mock por defecto mitiga.

---

## H. Qué queda para Fase 2

- Endpoints cuentas/mesonera/servir
- Prepagos/QR con verify identidad
- Compras + COP transferencias completas
- Cierres caja/inventario
- JWT real + hashing obligatorio en login
- Conectar Provider al adapter API módulo a módulo
- Seed Tenant A&D + Project
- Diseño web / TV a API (más adelante)
- Aplicar migrate deploy en Render con DB real
