# Donaive V2 — Contratos de Plataforma (Core/Projects)

**Estado:** Contratos TypeScript implementados (PROMPT 016C)  
**Fecha:** 2026-08-12  
**Relacionado:** `DONAIVE_V2_MULTI_PROJECT_PLATFORM.md`, `DONAIVE_V2_BACKEND_ARCHITECTURE.md`  
**Paquetes:** `@donaive/domain`, `@donaive/core`

Este documento describe los contratos TypeScript puros que preparan Donaive V2 como plataforma multi-proyecto. **No implica** backend, Prisma, migraciones, auth real, sync offline ni IA autónoma.

---

## Principio fundamental

```
Cambio en Project A  ≠  Core  ≠  Template  ≠  Project B
```

---

## Paquetes

| Paquete | Responsabilidad | Prohibido incluir |
|---|---|---|
| `@donaive/domain` | Entidades de plataforma | DB, Prisma, HTTP, React, lógica de cliente |
| `@donaive/core` | Capabilities, audit, IA, analytics | Implementación de servicios |

Ubicación: `packages/domain/src/`, `packages/core/src/`.

---

## Distinción CRM vs Plataforma

El frontend CRM (`src/types/crm.ts`) define `Organization` y `Project` del **pipeline comercial** (Leads → Opportunities → Proposals → entregables).

Los contratos de `@donaive/domain` definen entidades de **plataforma operacional**:

| Concepto CRM | Concepto Plataforma |
|---|---|
| Organization (tipo comercial) | Organization (tenant) |
| Project (entregable comercial) | Project (sistema empresarial instalado) |

No renombrar tipos CRM existentes para no romper el build. La convergencia será vía mapeo explícito en backend futuro.

---

## Entidades

### Organization (`packages/domain/src/organization.ts`)

Cliente/tenant comercial.

| Campo | Notas |
|---|---|
| `id` | Inmutable |
| `name` | Mutable |
| `legalName?` | Mutable |
| `status` | `active` \| `inactive` \| `suspended` \| `archived` |
| `createdAt`, `updatedAt` | Auditoría |

### Project (`packages/domain/src/project.ts`)

Instancia operacional de un sistema empresarial.

| Campo | Notas |
|---|---|
| `id`, `organizationId` | **Inmutables** |
| `name` | Nombre comercial (ej. "Licorería y Bodegón A&D") |
| `slug` | Identificador técnico estable |
| `category` | Clasificación industrial (`liquor_store`, `pharmacy`, …) — **no** es el nombre |
| `status` | Ciclo de vida operacional |
| `templateId?`, `currentVersionId?` | Referencias a plantilla |
| `domain?` | Dominio primario de conveniencia |

### Template / TemplateVersion (`packages/domain/src/template.ts`)

| Entidad | Descripción |
|---|---|
| `Template` | Familia reutilizable (Farmacia, Ferretería, POS…) |
| `TemplateVersion` | Versión inmutable post-publicación (`draft` → `published`) |

### ProjectInstance / InstanceVersion (`packages/domain/src/instance.ts`)

```
Template → TemplateVersion → ProjectInstance → InstanceVersion
```

Dos clientes con la misma Template pueden tener `InstanceVersion` distintas (A=2.4.0, B=1.8.0).

### ProjectCustomization (`packages/domain/src/customization.ts`)

Personalización **exclusiva** del Project. No contamina Template ni otros Projects.

| Campo | Ejemplos de `type` |
|---|---|
| `projectId`, `key`, `value` | branding, logo, colors, module_toggle, configuration |

### Module / ProjectModule (`packages/domain/src/module.ts`)

| Entidad | Descripción |
|---|---|
| `Module` | Catálogo global (`pos`, `inventory`, `purchases`, …) |
| `ProjectModule` | Módulo habilitado por Project (`enabled`, `version?`) |

### Update / UpdateRelease / UpdateTarget / ProjectUpdate (`packages/domain/src/update.ts`)

| Entidad | Descripción |
|---|---|
| `Update` | Paquete distribuible (módulo, versiones, compatibilidad) |
| `UpdateRelease` | Update publicado con `releasedAt` |
| `UpdateTarget` | Política: un project, varios, categoría, compatibles, ninguno |
| `ProjectUpdate` | Historial append-only por Project (assigned → installed / failed / rolled_back) |

**Regla:** el historial de updates **no se sobrescribe**.

### Plan (`packages/domain/src/plan.ts`)

Qué compra el cliente: `basic`, `professional`, `enterprise`, `custom`.

Incluye `includedModules?` como defaults del catálogo.

### License / Entitlement (`packages/domain/src/license.ts`)

| Entidad | Descripción |
|---|---|
| `License` | Derecho técnico de uso de un Project |
| `Entitlement` | Módulo/capacidad habilitada (`source`: plan, addon, trial, custom) |

**Regla:** vencimiento **no elimina datos** del Project.

### Subscription (`packages/domain/src/subscription.ts`)

Estado comercial de la relación cliente–Donaive. Separada de `License` y `Plan`.

Usa `LifecycleWindow`: `startDate`, `endDate?`, `status`, `gracePeriod?`.

Estados: `active`, `trial`, `past_due`, `expired`, `suspended`, `cancelled`.

### ProjectDomain (`packages/domain/src/project-domain.ts`)

| Campo | Valores |
|---|---|
| `type` | `subdomain` \| `custom_domain` |
| `hostname` | `sistema.donaive.com.ve`, `cliente.com` |
| `isPrimary` | Múltiples dominios por Project |

### ProjectUser (`packages/domain/src/project-user.ts`)

| Rol | Descripción |
|---|---|
| `project_admin` | Admin del Project (≠ Donaive Admin) |
| `manager`, `user`, `viewer` | Roles operacionales |

---

## Contratos Core

### Capabilities (`packages/core/src/capabilities.ts`)

Grupos:
- **Core:** `core.project.create`, `core.template.manage`, `core.update.assign`, …
- **Project:** `project.read`, `project.write`, `project.users.manage`, …
- **Intelligence:** `intelligence.project.read`, `intelligence.category.read`, …
- **Agent:** `agent.prepare`, `agent.publish`, `agent.execute`, …

Roles: `donaive_admin`, `project_admin`, `donaive_intelligence`, `ai_agent`, …

### AuditLog (`packages/core/src/audit.ts`)

Append-only. Campos: `actorType`, `action`, `entityType`, `entityId`, `projectId?`, `before?`, `after?`, `approvalId?`, `agentRunId?`.

### IA (`packages/core/src/ai.ts`)

| Contrato | Propósito |
|---|---|
| `AgentContext` | Contexto de ejecución del agente |
| `ProjectAccess` | Alcance sobre un Project (`readOnly` por defecto) |
| `AgentPermission` | Modos permitidos; `publish`/`execute` requieren aprobación |

### Analytics (`packages/core/src/analytics.ts`)

| Contrato | Propósito |
|---|---|
| `AnalyticsSnapshot` | Export agregado read-only desde Project |
| `OperationalMetrics` | ventas, rotación, gastos, utilidad, … |
| `OfflineSyncRequirement` | Requisito futuro documentado (sin implementación) |

Flujo futuro:
```
Project → export/snapshot/event → Donaive Analytics (solo lectura)
```

---

## Relaciones (ownership)

```
Organization 1 ──< Project N
Template 1 ──< TemplateVersion N
TemplateVersion 1 ──< ProjectInstance N (vía provisioning)
ProjectInstance 1 ──< InstanceVersion N
Project 1 ──< ProjectCustomization N
Project 1 ──< ProjectModule N
Project 1 ──< ProjectDomain N
Project 1 ──< ProjectUser N
Project 1 ──< License N
Organization 1 ──< Subscription N
Plan 1 ──< Subscription N
Update 1 ──< UpdateTarget N
Update 1 ──< ProjectUpdate N (historial por Project)
```

**Ownership de datos operacionales (POS, inventario):** exclusivo del Project (schema/DB futuro). Core solo metadata y exports autorizados.

---

## PostgreSQL + Prisma (preparado, no implementado)

Fuente futura: **PostgreSQL en Render + Prisma**.

Estrategia evolutiva documentada en `DONAIVE_V2_MULTI_PROJECT_PLATFORM.md`:

| Fase | Estrategia |
|---|---|
| Pocos projects | schema-per-project + RLS |
| Crecimiento | híbrido (schema vs DB dedicada) |
| Escala | multi-cluster + catálogo Core central |

Tablas Core conceptuales (sin migraciones): `organizations`, `projects`, `project_templates`, `project_template_versions`, `project_instance_versions`, `modules`, `plans`, `subscriptions`, `licenses`, `domains`, `project_customizations`, `updates`, `update_assignments`, `audit_logs`, …

Los contratos TypeScript deben permanecer estables aunque la estrategia física evolucione.

---

## Futuro offline-first

Requisito documentado en `@donaive/core` (`OfflineSyncRequirement`):

- ONLINE: local ↔ cloud sync
- OFFLINE: operaciones locales + cola
- RECONEXIÓN: cola → cloud + resolución de conflictos

Sin algoritmo ni implementación en este prompt.

---

## Consumo desde frontend

Re-export mínimo en `src/types/platform.ts`:

```typescript
export type { Project as PlatformProject } from "@donaive/domain";
export type { CORE_CAPABILITIES } from "@donaive/core";
```

Aliases TypeScript/Vite: `@donaive/domain`, `@donaive/core`.

---

## Qué NO está implementado

- Backend API, Prisma, migraciones
- Auth real, pagos, facturación
- POS, inventario, compras, gastos
- Sync offline, agentes IA autónomos
- Projects de cliente (`apps/projects/*`)
- Motor dinámico de configuración/customizations
