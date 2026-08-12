# Donaive V2 — Plataforma Multi-Project, Plantillas, Versionado y Aislamiento

**Estado:** Diseño / no implementado  
**Fecha de referencia:** 2026-08-12  
**Relacionado:** `DONAIVE_V2_BACKEND_ARCHITECTURE.md` (PROMPT 015A), PROMPT 016A  
**Alcance:** Arquitectura y contratos conceptuales únicamente  

Este documento define cómo Donaive Core administra **múltiples sistemas empresariales independientes**, creados desde **plantillas versionadas**, con **actualizaciones selectivas**, **planes/licencias**, **dominios**, **analytics controlados** y **aislamiento estricto** entre proyectos.

**No implica:** backend, Prisma, migraciones, endpoints, auth real, sync offline, IA real, pagos, ni sistemas de cliente implementados.

---

## Principio fundamental

```
Cambio exclusivo en Project A
  ≠ Core
  ≠ Template base
  ≠ Project B / C
  ≠ datos de otro cliente
  ≠ configuración global
```

- **Donaive Core** = inteligencia, relación comercial, supervisión, catálogo de plantillas/releases, licencias, analytics autorizado.
- **Project** = sistema empresarial independiente (instancia) con lógica, datos, usuarios y configuración propios.
- **Template** = base reutilizable versionada; **nunca** es una instancia de cliente.

---

## A. Conceptos fundamentales

### 1. Organization
Cliente/empresa (tenant comercial).  
Puede tener uno o varios Projects.

### 2. Project
Instancia concreta de un sistema empresarial.  
Identidad técnica inmutable: `projectId`.  
Nombre comercial (`displayName`) y dominio son mutables.

### 3. ProjectCategory
Clasificación interna. **No** es el nombre comercial.

Ejemplos:
`PHARMACY` · `DRUGSTORE` · `LIQUOR_STORE` · `LIQUOR_AND_GROCERY` · `HARDWARE` · `RESTAURANT` · `RETAIL` · `SERVICES` · `CUSTOM`

```
category = LIQUOR_AND_GROCERY
displayName = "Licorería y Bodegón A&D"
```

### 4. ProjectTemplate
Base reutilizable (`farmacia`, `ferretería`, `licorería/bodegón`, …).

### 5. ProjectTemplateVersion
Versión concreta de una plantilla (`v1.0`, `v1.1`, `v2.0`).

### 6. ProjectInstanceVersion
Versión **adoptada actualmente** por un Project (puede diferir entre A/B/C).

### 7. Module
Capacidad funcional independiente:  
`POS` · `INVENTORY` · `PURCHASES` · `EXPENSES` · `ACCOUNTS_RECEIVABLE` · `REPORTS` · `FINANCE` · `AI` · `OFFLINE` · …

### 8. Update / Release
Paquete distribuible (cambio de módulo/plantilla con changelog y compatibilidad).

### 9. UpdateTarget
Política de destinatarios: uno, varios, categoría, compatibles, o ninguno automático.

### 10. License
Derecho técnico de uso (módulos, dispositivos, fechas, estado).

### 11. Subscription
Relación comercial/contractual (plan, ciclo de facturación futuro).

### 12. Plan
Conjunto de módulos, límites y capacidades.

### 13. Device
Dispositivo autorizado para un Project.

### 14. Domain
Dominio/subdominio asociado al Project (no es ID técnico).

### 15. ProjectConfiguration
Configuración operativa de la instancia (impuestos locales, moneda, turnos, etc.).

### 16. ProjectCustomization
Personalización **exclusiva** de un Project; no contamina plantilla ni otros projects.

---

## B. Identidad y aislamiento

### Identificadores

| Campo | Naturaleza |
|---|---|
| `organizationId` | Inmutable |
| `projectId` | Inmutable |
| `category` | Clasificación (mutable con cuidado) |
| `displayName` | Mutable |
| `domain` | Mutable |
| `slug` | Mutable con reglas de unicidad |

Ejemplo:
```
organizationId = org_xxxxx
projectId      = proj_xxxxx
category       = LIQUOR_AND_GROCERY
displayName    = "Licorería y Bodegón A&D"
domain         = licoreria-and.donaive.com.ve
```

### Regla de aislamiento

Toda operación autorizada exige:

```
organizationId + projectId + role + capability + resource
```

Nunca confiar solo en frontend, URL, slug o parámetros del cliente.

```
op(projectId=A) ⇏ projectId=B
op(projectId=A) ⇏ Core tables globales
op(projectId=A) ⇏ Template source
```

---

## C. Flujo Template → Project

```
ProjectTemplate
      ↓
ProjectTemplateVersion (v1.0)
      ↓
Create Project (from template version)
      ↓
ProjectInstance (projectId único)
      ↓
ProjectInstanceVersion (= versión plantilla adoptada al crear)
      +
ProjectConfiguration (defaults clonados, luego independientes)
```

Ejemplo:
```
Template "Ferretería" v1.0
  → Ferretería A (proj_a, instanceVersion=1.0)
  → Ferretería B (proj_b, instanceVersion=1.0)
  → Ferretería C (proj_c, instanceVersion=1.0)
```

La plantilla **no** es cliente. Clonar crea instancias independientes.

---

## D. Customizaciones

Separar capas:

| Capa | Pertenece a | ¿Se propaga? |
|---|---|---|
| Código/base de plantilla | TemplateVersion | Solo vía Update explícito |
| Configuración | ProjectConfiguration | No |
| Personalización | ProjectCustomization | No |
| Update/Release | Catálogo Core | Solo a targets asignados |
| Código específico del proyecto | Project codebase / customization | No |

### ProjectCustomization (contrato conceptual)

```
ProjectCustomization {
  id
  projectId
  module                 # ej. REPORTS
  key / slug
  title
  description
  version
  status                 # draft | active | deprecated
  source                 # client_request | donaive_dev | import
  artifactRef            # referencia a paquete/código/config
  createdAt
  updatedAt
}
```

**Prohibido:** promover automáticamente una customización de A a Template o a B/C.  
La promoción a plantilla, si existe, es un proceso **explícito** de productización (nuevo Release), no un side-effect.

---

## E. Versionamiento

Dos ejes distintos:

### TEMPLATE VERSION
```
Ferretería Template:
  v1.0 → v1.1 → v1.2 → v2.0
```

### PROJECT / INSTANCE VERSION
```
A → v1.2
B → v1.0
C → v2.0
```

No asumir que todos deben estar en `latest`.  
El catálogo histórico de releases es de primera clase.

También versionar **por módulo** cuando aplique:

```
Project A:
  POS=2.0
  INVENTORY=1.5
  REPORTS=1.2
```

---

## F. Actualizaciones (Update / Release)

### Entidades

```
Update / Release {
  id
  category?              # HARDWARE, LIQUOR_AND_GROCERY, ...
  module                 # POS, INVENTORY, ...
  fromVersion
  toVersion
  requirements[]
  compatibility          # semver ranges / explicit matrix
  releasedAt
  status                 # draft | published | deprecated | yanked
  changelog
  migrationNotes         # code vs data
  rollbackPolicy         # none | code_only | guided
}

UpdateTarget {
  mode                   # project | projects | category | compatible | none
  projectIds[]?
  category?
  filters?
}

UpdateAssignment {
  updateId
  projectId
  assignedBy
  assignedAt
  status                 # assigned | approved | installing | installed | failed | rolled_back | skipped
  approvedAt?
  installedAt?
  failureReason?
}

Installation {
  assignmentId
  projectId
  fromVersion
  toVersion
  startedAt
  finishedAt?
  result
  logsRef?
}

Rollback {
  installationId
  previousVersion
  newVersion
  reason
  authorizedBy
  authorizedAt
  result
  scope                  # code | data_guided | none
}
```

Ejemplo:
```
UPDATE-001
  category: HARDWARE
  module: POS
  1.0 → 1.1
  compatibleWith: 1.0
```

---

## G. Distribución selectiva

Core debe poder:

| Modo | Ejemplo |
|---|---|
| Un Project | Solo A |
| Varios | A y C |
| Toda una categoría | Todas las HARDWARE |
| Todos los compatibles | Los que cumplen matriz |
| Ninguno automático | Publicar release sin rollout |

```
Aplicar POS v2 → A, C
No aplicar → B
```

Toda selección queda en `UpdateAssignment` + auditoría.

---

## H. Actualizaciones históricas

Una empresa nueva (o una rezagada) puede adoptar releases antiguos **si son compatibles**:

```
Catálogo:
  POS v2.0
  Inventario v2.0
  Reportes v1.5

Nuevo cliente hoy:
  seleccionar POS v2.0 + Inventario v2.0
```

Contrato: **no** depender solo de `latestVersion`.  
UI/API futura: “catálogo de releases instalables” filtrado por categoría + compatibilidad + entitlements.

---

## I. Rollback

Diferenciar:

| Tipo | Qué revierte | Riesgo |
|---|---|---|
| **Code rollback** | Artefacto/app a versión previa | Medio |
| **Data migration rollback** | Migraciones de datos | Alto; a menudo **no automático** |

Política v1:
- Preferir code rollback cuando sea seguro.
- Data rollback solo con procedimiento guiado y aprobación.
- Registrar siempre versión anterior/nueva, motivo, autorizador, resultado.

---

## J. Planes y módulos

Separación:

```
Plan ──< PlanModule >── Module
Subscription ── Plan
License ── Project + Entitlements (modules/limits)
```

Ejemplo:
```
PLAN PROFESSIONAL = POS + Inventario + Compras + Gastos + Reportes
Cliente X         = POS + Inventario solamente
```

**No** acoplar módulos de forma rígida a una categoría.  
La categoría sugiere defaults de plantilla; el plan define lo contratado.

### Entitlement (contrato)

```
Entitlement {
  projectId
  module
  enabled
  limits?              # devices, users, storage, ...
  source               # plan | addon | trial | custom
}
```

---

## K. Licencias

```
License {
  id
  projectId
  organizationId
  planId
  modules / entitlements
  deviceLimit
  startsAt
  expiresAt
  gracePeriodEndsAt?
  status               # active | grace | suspended | expired | revoked
  activationRef?
  renewalRef?
}
```

### Reglas críticas

- Vencimiento **no elimina datos**.
- Vencimiento **no elimina el Project**.
- Vencimiento **no destruye información local** (offline futuro).
- Produce **estado de acceso controlado** (`suspended` / `expired` con modo lectura limitada si se define).

Device:
```
Device {
  id
  projectId
  fingerprint / name
  status               # active | revoked | pending
  lastSeenAt?
}
```

---

## L. Dominios

```
Domain {
  id
  projectId
  host                   # licoreria-and.donaive.com.ve | cliente.com
  type                   # donaive_subdomain | custom
  status                 # pending | active | error
  sslStatus?
}
```

El dominio **no** es `projectId`.  
Routing futuro por `Host` → resolución a `projectId`.

---

## M. Categorías

Clasificación interna multi-instancia:

```
LIQUOR_AND_GROCERY
  - Licorería y Bodegón A&D
  - Bodegón XYZ
  - Licorería ABC
```

Todas independientes; compartirán plantillas/releases de categoría solo si se asignan.

---

## N. Analytics global de Donaive

### Principio
- Core/Admin (autorizado) puede consultar datos **autorizados** de A+B+C.
- Cliente A solo ve A.
- Preferir **agregados** (data minimization) para vistas globales.

### Contrato conceptual (read-only)

```
OperationalExport / AnalyticsSnapshot {
  projectId
  organizationId
  category
  period
  metrics {
    sales
    units
    inventory
    rotation
    expenses
    costs
    profit
    productCategoryBreakdown
    trends
  }
  sensitivity          # aggregate | detailed
  authorizedFor[]      # roles/capabilities
}
```

Fuentes futuras:
- API read-only del Project
- snapshots periódicos
- eventos agregados

---

## O. Analytics por categoría

Preguntas futuras:
- “Mayor rotación entre ferreterías”
- “Margen promedio en licorerías”
- “Categorías más vendidas”

Respuesta arquitectónica:
- Agregar por `category` **sin** filtrar hacia un cliente terceros.
- No exponer identidad de A a B.
- Roles: `donaive.analytics.category.read` ≠ `project.analytics.read`.

---

## P. Seguridad

### Project isolation (obligatorio)

Authorization backend (cuando exista) valida:

```
organizationId
projectId
role
capability
resource
action
```

Prohibido confiar en:
- frontend alone
- URL/slug
- parámetros client-supplied sin verificación server-side

### Capabilidades mínimas (conceptuales)

```
core.project.create
core.template.manage
core.update.assign
core.license.manage
core.analytics.global.read
project.*.admin
project.*.write
project.*.read
intelligence.project.read
agent.prepare
agent.publish   # requires approval
```

---

## Q. Auditoría

Registrar al menos:

- creación de Project / desde Template  
- asignación/instalación/rollback de Update  
- activación/suspensión de licencia  
- cambio de plan  
- acceso cross-project / consulta global  
- acción de agente IA  

```
AuditLog {
  who
  what
  where
  when
  why?
  organizationId?
  projectId?
  approvalId?
  agentRunId?
  metadata?
}
```

Append-only. Especialmente para evitar modificación accidental de datos de clientes.

---

## R. Reglas de dependencia (monorepo)

```
Core (apps/api, packages/core, packages/domain)
Templates (versioned artifacts / packages/templates/*)
Projects (apps/projects/<projectId-or-slug>/*)
Packages compartidos puros (ui, types, shared utils)
```

### Boundaries

1. Project **nunca** importa código privado de otro Project.  
2. Customización de A **no** es dependencia de B.  
3. Templates versionados; no “editar en caliente” la fuente usada por instancias.  
4. Contratos compartidos solo vía `packages/*` públicos.  
5. Core no escribe datos operativos de Project salvo API explícita y autorizada.  
6. Intelligence read-only por defecto.  
7. Migraciones de un Project no alteran tablas/schemas de otro.  
8. Secretos no compartidos entre Projects.  
9. Agentes: prepare libre (con authz); publish/execute con aprobación humana (PROMPT 015A).

---

## S. PostgreSQL (estrategia, sin instalar)

Mantener decisión: **PostgreSQL + Prisma** (ver 015A).  
**No instalar en este prompt.**

### Estrategia de aislamiento de datos (evolutiva)

| Fase | Estrategia | Motivo |
|---|---|---|
| Pocos Projects (1–5) | **Schema-per-project** (o tenant schema) + RLS donde aplique | Aislamiento fuerte con coste operativo bajo |
| Crecimiento | Híbrido: schemas para pequeños; **DB-per-project** para grandes | Backups/restore y ruido vecino |
| Escala alta | Multi-cluster / DB dedicadas + catálogo Core central | Operaciones y compliance |

### Inventario conceptual de tablas Core (no migraciones)

```
organizations
projects
project_categories
project_templates
project_template_versions
project_instance_versions
modules
plans · plan_modules
subscriptions
licenses · entitlements · devices
domains
project_configurations
project_customizations
updates / releases
update_targets
update_assignments
installations
rollbacks
audit_logs
analytics_snapshots (opcional)
```

Los datos operativos (POS, inventario, ventas del cliente) viven en el **espacio del Project** (schema/DB), no mezclados en tablas Core sin contrato.

**Los contratos** `Organization / Project / Template / Version / Update / License` deben permanecer estables aunque la estrategia física evolucione.

---

## T. Backend futuro — bounded contexts

### Bounded contexts (Core)

| Context | Responsabilidad |
|---|---|
| **Identity & Access** | Users, roles, permissions, sessions |
| **CRM & Commercial** | Leads, Opportunities, Diagnosis, Proposals (PROMPT 015) |
| **Catalog & Delivery** | Templates, Versions, Updates, Assignments, Install/Rollback |
| **Billing & Entitlements** | Plans, Subscriptions, Licenses, Devices (pagos reales después) |
| **Project Registry** | Projects, Domains, Configurations, Customizations metadata |
| **Intelligence** | Snapshots/exports read-only, category analytics |
| **AI Orchestration** | Agents, Tools, Runs, Approvals (015A) |
| **Audit** | Append-only trail |

### Bounded contexts (Project instance)

| Context | Ejemplos |
|---|---|
| **Commerce Ops** | POS, tickets, cajas |
| **Inventory** | stock, lotes, movimientos |
| **Purchasing** | compras, proveedores |
| **Finance Ops** | gastos, CxC/CxP locales |
| **Reporting** | reportes del negocio |
| **Local Devices** | terminals, offline queue (futuro) |

### APIs conceptuales (futuras)

```
Core:
  POST   /projects                    # create from template version
  GET    /projects/:id
  POST   /updates/:id/assignments     # selective rollout
  POST   /assignments/:id/install
  POST   /assignments/:id/rollback
  GET    /releases?category=&module=
  GET    /analytics/category/:cat     # aggregates
  GET    /intelligence/projects/:id/snapshot

Project:
  GET    /exports/sales
  GET    /exports/inventory
  GET    /exports/expenses
  # write endpoints solo del propio project
```

### Relación con el backend actual (otro repo / Render)

- No moverlo en este prompt.  
- Futuro: adaptador de exports → Intelligence; coexistencia temporal; cutover por Project.  
- Core nuevo convive hasta que los contratos de Template/Update/License estén listos.

---

## Diagrama textual (plataforma)

```
[Donaive Core]
  Templates + Versions
  Releases / Updates
  Plans / Licenses / Domains
  CRM / Diagnosis / Proposals
  Intelligence (read-only)
  AI Orchestrator + Approvals
        │
        │ create / assign update / license
        ▼
[Project A]     [Project B]     [Project C]
 instancia      instancia       instancia
 custom A-only  custom B-only   ...
 data A         data B          data C
        │
        └── exports agregados ──► Intelligence (autorizado)
```

---

## Estructura de carpetas (alineada a 016A + templates)

```
apps/
  web/                         # Donaive Core frontend
  api/                         # Donaive Core API
  projects/
    <projectKey>-web/
    <projectKey>-api/
packages/
  ui/
  domain/                      # contratos CRM/commercial
  platform/                    # Project/Template/Update/License contracts
  auth/
  shared/
templates/                     # artefactos versionados de plantilla (futuro)
  hardware/
  liquor-and-grocery/
  pharmacy/
docs/architecture/
```

`projectKey` operativo puede derivar de `projectId` (nunca solo del displayName).

---

## Ejemplo extremo a extremo (Ferretería)

```
Template HARDWARE v1.0
  → create A, B, C @ v1.0

Custom report solo en A
  → ProjectCustomization(projectId=A, module=REPORTS)

Release POS 1.0→2.0 (UPDATE-pos-2)
  → assign A, C
  → B permanece en POS 1.0

Nuevo cliente D
  → create from Template v1.0
  → opcionalmente install POS 2.0 desde catálogo histórico

License D: PLAN BASIC (POS+INVENTORY), expiresAt=...
  → al vencer: status=suspended, datos intactos
```

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Contaminación de plantilla por custom A | Capas separadas + promoción explícita |
| Update rompe datos | Compatibility matrix + install staging + rollback policy |
| Fuga cross-project en analytics | Agregados + authz + audit |
| Acoplamiento monorepo | Import boundaries + ownership |
| “Latest” forzado | Catálogo histórico + instance version |

---

## Decisiones a confirmar antes de implementar

1. Aislamiento físico inicial: **schema-per-project** vs `tenant_id`+RLS.  
2. Granularidad de versionado: plantilla completa vs **módulo**.  
3. Quién aprueba installs: solo Donaive Admin, o también Project Admin.  
4. Política exacta post-vencimiento (read-only vs bloqueo total).  
5. Forma de artefactos de Template/Update (paquetes, imágenes, migrations).  
6. Nivel de detalle de exports a Intelligence (aggregate-first).

---

## Qué queda para la siguiente fase (implementación futura)

1. Contratos TypeScript en `packages/platform` (types only).  
2. Scaffold monorepo `apps/api` + `apps/projects/...` sin lógica de negocio real.  
3. Prisma schema Core (Organization/Project/Template/Update/License) — cuando se autorice.  
4. UI admin Core: catálogo de releases + assignments.  
5. Primer Project real (Licorería) como instancia desde template, sin contaminar Core.

---

## Relación con documentos previos

| Doc | Aporta |
|---|---|
| PROMPT 015 / `commercial` types | Motor comercial Lead→Project |
| PROMPT 015A backend | Postgres, Prisma, agentes, approvals |
| PROMPT 016A plataforma | Core vs Projects, Intelligence, Render |
| **Este doc (016B)** | Templates, versions, updates selectivos, planes/licencias, customizaciones |

---

## Resumen ejecutivo

Donaive opera un **catálogo versionado de plantillas y releases**, crea **instancias independientes (Projects)** con IDs inmutables, permite **personalizaciones locales**, **distribuye updates de forma selectiva o histórica**, controla acceso vía **Plan/License/Entitlement**, y consulta analytics **autorizados y preferentemente agregados**, sin que un Project vea o modifique a otro ni al Core.
