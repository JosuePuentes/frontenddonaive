# Donaive V2 — Arquitectura Backend (documento técnico)

**Estado:** Diseño / no implementado  
**Fecha de referencia:** 2026-08-09  
**Frontend consolidado hasta:** PROMPT 015 (`0b30580`)  
**Base de datos objetivo:** PostgreSQL (Render)  
**Frontend actual:** React + TypeScript + Vite + React Query + Design System existente  

Este documento define la arquitectura futura del backend de Donaive V2.  
**No implica código, migraciones, ORM instalado ni conexión a PostgreSQL en esta fase.**

---

## 1. Arquitectura general

Donaive V2 se organiza como un sistema de **consultoría comercial + entrega + agentes de IA con aprobación humana**.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTES / CANALES                      │
│  Web · WhatsApp · Instagram · Facebook · Academy · Agentes  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                 FRONTEND (repo actual)                      │
│         React · Vite · React Query · Design System          │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS / JSON API
┌─────────────────────────────▼───────────────────────────────┐
│                    API GATEWAY / BFF                        │
│              Auth · Rate limit · Validation                 │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼──────────────┐  ┌───────────▼───────────────┐
│     CORE DOMAIN SERVICES     │  │     AI ORCHESTRATOR       │
│ Auth · CRM · Diagnosis ·     │  │ Routing · Tools · Memory  │
│ Services · Proposals ·       │  │ Approval · Agent Runs     │
│ Projects · Content · Files   │  └───────────┬───────────────┘
└───────────────┬──────────────┘              │
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│                     POSTGRESQL (Render)                     │
│     Relacional + JSONB + índices + auditoría + soft delete  │
└─────────────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────┐
│ Object storage (futuro)      │  Documentos, assets, propuestas PDF
│ Redis / queue (futuro)       │  Jobs, rate limits, agent tasks
│ Vector store (futuro)        │  Memoria semántica (fase posterior)
└──────────────────────────────┘
```

### Principios

1. **Frontend y backend separados** (repos o monorepo con paquetes distintos).
2. **PostgreSQL como fuente de verdad** — no MongoDB.
3. **El frontend tipado actual es el contrato de dominio** a mapear a tablas.
4. **IA sugiere y prepara; humanos aprueban acciones sensibles.**
5. **Multi-tenant preparado, single-tenant operable** en v1 (organización Donaive).
6. **Eventos y auditoría desde el día uno** (aunque el bus sea simple al inicio).

---

## 2. Estructura backend propuesta (separada del frontend)

Repositorio o paquete sugerido: `backenddonaive` / `apps/api`.

```
apps/api/
  src/
    main.ts
    config/
    modules/
      auth/
      users/
      roles/
      permissions/
      organizations/
      contacts/
      crm/                 # leads, opportunities, activities, interactions
      diagnosis/
      services-catalog/
      proposals/
      projects/
      files/
      content/             # blog, academy, media CMS
      analytics/
      audit/
      ai/                  # orchestrator, agents, tools, runs, approvals
    common/
      database/
      events/
      security/
      pagination/
    jobs/                  # cola futura
  prisma/  (o drizzle/)    # migraciones — no creadas todavía
```

### Módulos de dominio

| Módulo | Responsabilidad |
|---|---|
| **API** | REST (o tRPC) versionada, OpenAPI, errores tipados |
| **Autenticación** | Sesión/JWT, refresh, providers futuros |
| **Usuarios** | Identidad interna Donaive |
| **Roles / Permisos** | RBAC alineado a `src/types/permissions.ts` |
| **Organizations** | Tenant + clientes |
| **Contacts** | Personas vinculadas a organizaciones |
| **CRM** | Leads, Opportunities, Activities, Interactions, LossReasons |
| **Diagnósticos** | Observation→Recommendation (modelo PROMPT 010/015) |
| **Servicios** | Catálogo Service / Package / Categories |
| **Propuestas** | Proposal + Items + versiones |
| **Proyectos** | Entrega post-aceptación |
| **Archivos** | Metadatos + storage externo |
| **Contenido** | CMS (blog, academy, media) |
| **Analytics** | Métricas agregadas / reportes |
| **Auditoría** | Quién hizo qué, cuándo, con qué contexto |
| **Agentes IA** | Orchestrator, agents, tools, memory, runs, approvals |

---

## 3. PostgreSQL

### 3.1 Decisión

- **Motor:** PostgreSQL 16+  
- **Hosting inicial:** Render Postgres  
- **No usar MongoDB** para Donaive V2  

### 3.2 Características a aprovechar

| Capacidad | Uso |
|---|---|
| Foreign keys | Integridad Lead→Opportunity→Diagnosis→Proposal→Project |
| Índices | `status`, `organization_id`, `opportunity_id`, fechas, búsquedas |
| Timestamps | `created_at`, `updated_at` en todas las tablas de dominio |
| Soft delete | `deleted_at` en entidades de negocio (no en audit logs) |
| JSONB | Qualification criteria, score dimensions, agent config, metadata |
| Migraciones | Versionadas (Prisma Migrate / Drizzle Kit) |
| Constraints | Enums o check constraints para estados |
| Unique | slugs de servicios, emails por tenant, etc. |

### 3.3 Modelo conceptual (mapeo desde frontend actual)

```
tenants / organizations (tenant + clientes)
users
roles · permissions · role_permissions · user_roles

contacts
leads
opportunities
loss_reasons
activities
interactions

diagnoses
observations · problems · root_causes · impacts
process_steps_current · process_steps_proposed
automation_opportunities · solutions · solution_service_links
recommendations

service_categories · services · service_packages · package_services

proposals · proposal_items
projects

files / documents
content_items (CMS)
audit_logs
analytics_events (opcional)

agents · agent_roles · agent_capabilities · agent_tools
agent_memories · agent_events · agent_runs · agent_tasks
approvals
commercial_contexts (materializado o vista)
```

### 3.4 Relaciones clave (cardinalidades)

```
Organization 1──* Contact
Organization 1──* Lead
Organization 1──* Opportunity
Organization 1──* Project

Lead 0..1──* Opportunity
Opportunity 1──* Diagnosis
Opportunity 1──* Proposal
Diagnosis 1──* Solution
Solution *──* Service/Package (vía solution_service_links)
Proposal 1──* ProposalItem → Service/Package/custom
Proposal accepted 1──0..1 Project

Activity / Interaction → (organization | contact | lead | opportunity | diagnosis | proposal | project)
```

### 3.5 Índices mínimos recomendados

- `leads(organization_id, status, source, created_at)`
- `opportunities(organization_id, status, expected_close_date)`
- `diagnoses(opportunity_id, status)`
- `proposals(opportunity_id, status, is_primary)`
- `activities(status, due_at, assigned_to)`
- `agent_runs(agent_id, status, created_at)`
- `audit_logs(entity_type, entity_id, created_at)`
- GIN sobre JSONB de calificación / score / agent config cuando se consulte

### 3.6 Soft delete y auditoría

- Soft delete en: organizations, contacts, leads, opportunities, diagnoses, proposals, projects, services, content.
- Hard append-only en: `audit_logs`, `agent_events`, `approvals` (trazabilidad).
- Nunca borrar físicamente evidencia de aprobación o ejecución de agentes.

### 3.7 JSONB donde aporta flexibilidad

- `leads.qualification` (QualificationCriteria)
- `diagnoses.score` (DiagnosisScoreDimensions)
- `agents.personality`, `agents.objectives`, `agents.channels`
- `agent_runs.input`, `agent_runs.output`
- `commercial_contexts.snapshot`
- Metadata de archivos y campañas futuras

Estados críticos (`status`, enums de pipeline) deben ser columnas tipadas, no solo JSONB.

---

## 4. ORM recomendado

### Comparación breve (TypeScript / Node / PostgreSQL)

| Opción | Fortalezas | Debilidades |
|---|---|---|
| **Prisma** | Excelente DX, migraciones maduras, relaciones claras, tipado fuerte, JSONB soportado, ecosistema amplio, bueno en Render | Abstrae SQL; queries muy complejas a veces requieren raw |
| **Drizzle** | Cercano a SQL, ligero, buen TypeScript, migraciones sólidas | Menos “baterías incluidas”; curva de convenciones del equipo |
| **TypeORM** | Maduro históricamente | DX/migraciones menos predecibles; más deuda potencial |
| **Knex + repositorios** | Control total | Más boilerplate; tipado manual |

### Recomendación: **Prisma**

**Motivos alineados a Donaive V2:**

1. PostgreSQL + TypeScript first-class.  
2. Migraciones versionadas aptas para Render.  
3. Relaciones 1→N del motor comercial se modelan con claridad.  
4. JSONB nativo para calificación, scores y config de agentes.  
5. Escalabilidad de equipo: schema legible = mantenimiento.  
6. Facilita generar tipos compartidos hacia el frontend.  
7. Compatible con jobs/IA posteriores (raw SQL cuando haga falta).

**Alternativa válida:** Drizzle, si se prioriza SQL explícito y menor abstracción.  
**Decisión de esta arquitectura:** Prisma como ORM/repository layer por defecto.

> No instalar todavía. No crear `schema.prisma` en este prompt.

---

## 5. API para el frontend actual

El frontend ya tiene:

- Tipos de dominio (`crm`, `diagnosis`, `services`, `proposal`, `commercial`)
- `queryKeys`
- Stubs en `src/services/*.ts`

Estrategia:

1. Mantener React Query.  
2. Sustituir stubs por clientes HTTP reales sin cambiar la forma de los tipos.  
3. API REST versionada (`/api/v1/...`) con paginación alineada a `PaginatedResponse`.  
4. Errores alineados a `ApiError`.  
5. Auth por Bearer/cookie httpOnly (decisión de implementación posterior).

Contrato mental:

```
crmService.listOpportunities()  →  GET /api/v1/opportunities
crmService.createDiagnosis()    →  POST /api/v1/diagnoses
servicesService.getServices()   →  GET /api/v1/services
```

---

## 6. Arquitectura de agentes de IA

### 6.1 Visión

Los agentes son **departamentos virtuales** de Donaive: analizan, preparan y sugieren.  
El humano aprueba lo sensible. El Orchestrator decide quién actúa y con qué herramientas.

### 6.2 Entidades conceptuales

| Entidad | Descripción |
|---|---|
| **Agent** | Identidad del departamento virtual (nombre, avatar, especialidad, personalidad, objetivos, canales) |
| **AgentRole** | Rol funcional (marketing, diseño, comercial, …) |
| **AgentCapability** | Capacidades declaradas (analyze_market, draft_campaign, …) |
| **AgentTool** | Herramientas permitidas (CRM read, content draft, image request, …) |
| **AgentMemory** | Memoria operativa del agente (preferencias, aprendizajes resumidos) |
| **AgentEvent** | Evento emitido/consumido por el sistema de agentes |
| **AgentRun** | Ejecución concreta (input, output, status, cost tokens, approval) |
| **AgentTask** | Unidad de trabajo asignada a un agente |
| **CommercialContext** | Snapshot tipado: org + lead + opportunity + diagnosis + proposal + interactions recientes |

### 6.3 Agentes especializados (conceptuales)

1. Marketing  
2. Diseño  
3. Comercial  
4. Diagnóstico  
5. Propuestas  
6. Operaciones  
7. Finanzas  
8. Investigación  
9. Contenido  
10. Atención al cliente  
11. Analítica  

Más: **AI Orchestrator** (meta-agente / servicio de enrutamiento).

### 6.4 Perfil público futuro del agente

Cada agente podrá tener:

- identidad, nombre, descripción, especialidad, personalidad  
- avatar  
- objetivos  
- canales (Instagram, Facebook, …) — **sin integración aún**  
- calendario  
- métricas  
- portafolio de contenido  

---

## 7. AI Orchestrator

### Responsabilidades

1. Recibir un evento o solicitud.  
2. Construir / recuperar `CommercialContext` o contexto de marca.  
3. Seleccionar agente(s) por rol + capabilities.  
4. Filtrar tools permitidas según política y approval level.  
5. Crear `AgentTask` / `AgentRun`.  
6. Ejecutar pasos **read / analyze / suggest / generate / prepare**.  
7. Si la acción es `publish` o `execute` sensible → crear `Approval`.  
8. Registrar `AgentEvent` + `audit_log`.  
9. Devolver resultado al CRM / UI / cola.

### Pseudopolítica de decisión

```
IF event = inquiry_received → Agent Comercial (+ Diagnóstico si falta info)
IF event = diagnosis_completed → Agent Propuestas (prepare)
IF event = campaign_created → Agent Marketing → request to Agent Diseño
IF action.requires_external_side_effect → require human approval
IF action.spends_money OR publishes OR sends_sensitive_comm → block until approved
```

No implementar el orquestador en esta fase.

---

## 8. Clasificación de acciones y Human Approval

### 8.1 Niveles de acción

| Nivel | Significado | Default v1 |
|---|---|---|
| `read` | Leer datos internos | Permitido (con authz) |
| `analyze` | Analizar / clasificar | Permitido |
| `suggest` | Sugerir próximos pasos / Activities `suggested` | Permitido |
| `generate` | Generar borradores (texto, brief, imagen interna) | Permitido |
| `prepare` | Preparar campaña/publicación/propuesta draft | Permitido |
| `publish` | Publicar en canales externos | **Requiere aprobación** |
| `execute` | Ejecutar acción externa / gasto / envío sensible | **Requiere aprobación** |

### 8.2 Reglas por defecto (primera etapa)

**IA puede:** analizar, preparar, generar contenido, preparar campañas, preparar publicaciones, sugerir Activities.  

**IA NO puede sin aprobación humana:** publicar, gastar dinero, enviar comunicaciones sensibles, modificar estados comerciales críticos (won/lost), ejecutar tools externas irreversibles.

### 8.3 Modelo de Approval

```
Approval {
  id
  agent_run_id
  action_level          # publish | execute | ...
  status                # pending | granted | rejected | expired
  requested_by          # agent | system
  reviewed_by           # user
  payload_snapshot      # JSONB
  reason
  created_at / reviewed_at
}
```

UI futura: cola de aprobaciones en dashboard privado.

---

## 9. Marketing autónomo (faseada)

### Capacidades futuras del agente Marketing

- Analizar mercado y audiencia  
- Detectar oportunidades  
- Proponer campañas y canales  
- Recomendar presupuesto (sin gastar)  
- Crear brief  
- Solicitar piezas al agente de Diseño  
- Preparar contenido  
- Analizar resultados  
- Proponer optimizaciones  

### Gate

Todo lo que sea **publicar o gastar** → `approval_requested` → humano.

---

## 10. Agente de Diseño

Flujo conceptual:

```
Marketing: "Necesito pieza para campaña X"
        ↓
Diseño: brief visual → genera/propone variantes → entrega assets (draft)
        ↓
Human approval (si se publica o se usa externamente)
```

Sin proveedor de generación de imágenes en esta fase.  
La arquitectura solo reserva: `AgentTask` tipo `design_request`, assets en Files, y approval.

---

## 11. Memoria (tres niveles)

| Nivel | Contenido | Almacenamiento v1 | Futuro |
|---|---|---|---|
| **A. Empresarial** | Marca, metodología, servicios, políticas | Tablas + content CMS + docs | + embeddings |
| **B. Contextual** | Cliente, opportunity, proyecto, campaña, conversación | `CommercialContext` / FKs | + retrieval |
| **C. Del agente** | Preferencias operativas, tareas y resultados | `agent_memories`, summaries | + vector DB |

**No implementar vector database todavía.**  
Diseñar IDs y tablas de memoria textual/JSONB primero.

---

## 12. Eventos futuros

Catálogo inicial (sin event bus aún; pueden persistirse en `agent_events` / `domain_events`):

```
inquiry_received
lead_created
lead_qualified
opportunity_created
diagnosis_completed
proposal_created
proposal_sent
proposal_accepted
project_created
followup_due
campaign_created
content_generated
approval_requested
approval_granted
approval_rejected
agent_task_created
agent_task_completed
```

Evolución: tabla `domain_events` outbox → workers.  
v1 aceptable: emisión interna en servicios + persistencia.

---

## 13. Seguridad

| Control | Enfoque |
|---|---|
| Autenticación | JWT/session; secretos en Render env |
| Autorización | RBAC (roles/permissions) |
| Tenant isolation | `organization_id` / `tenant_id` en queries |
| Secrets | Nunca en frontend; vault/env |
| Audit logs | Append-only |
| Rate limiting | API gateway / middleware |
| Validación | Zod/DTO en boundary |
| Tools IA | Allowlist por agente + action level |
| Aprobación humana | Obligatoria en publish/execute |
| Trazabilidad | `agent_run_id` en audit + approvals |

---

## 14. Multi-tenant

### Enfoque pragmático

- **v1:** un tenant operativo = Donaive; clientes son `organizations` de tipo cliente.  
- **Preparación:** columna `tenant_id` (o `owner_organization_id`) en tablas de negocio sensibles.  
- Evitar schemas-per-tenant al inicio.  
- Row-level filtering por `tenant_id` en repositorio.  
- Más adelante: RLS de PostgreSQL si se requiere aislamiento fuerte.

```
Tenant (Donaive ops)
  └── Organizations (clientes / prospects)
        └── Contacts, Leads, Opportunities, Projects...
```

No complicar v1 con billing multi-tenant completo.

---

## 15. Archivos y documentos

Futuro módulo `files`:

- documentos, imágenes, propuestas PDF, contratos, reportes, assets de marketing  
- metadata en PostgreSQL  
- blobs en object storage (S3-compatible / Render disk solo para prototipo)  
- vinculación polimórfica a proposal/project/campaign/agent_run  

No implementar almacenamiento todavía.

---

## 16. Despliegue futuro en Render

| Componente | Servicio Render |
|---|---|
| API Node/TypeScript | Web Service |
| PostgreSQL | Render Postgres |
| Frontend Vite | Static Site / aparte (Vercel ya alineado al frontend) |
| Workers (futuro) | Background Worker |
| Redis (futuro) | Key Value / externo |

Variables: `DATABASE_URL`, `JWT_SECRET`, `AI_PROVIDER_*`, `STORAGE_*`.  
Migraciones: `prisma migrate deploy` en release command.

---

## 17. Estrategia de evolución (fases)

### Fase A — Fundación API + Postgres + Prisma
- Auth, users, roles, organizations, contacts  
- CRM (leads/opportunities/activities/interactions)  
- Migraciones iniciales mapeando PROMPT 015  

### Fase B — Motor diagnóstico + catálogo + propuestas + proyectos
- Persistencia real de Diagnosis/Proposal/Project  
- Transiciones Proposal accepted → Project (servidor)  

### Fase C — Approvals + Agent skeleton
- Tablas Agent/Task/Run/Approval  
- Orchestrator mínimo (reglas, sin autonomía de publish)  

### Fase D — Agentes Marketing/Diseño (prepare-only)
- Generación de drafts  
- Cola de aprobación humana en UI  

### Fase E — Canales y memoria avanzada
- Integraciones sociales  
- Vector memory  
- Analytics de campañas  

---

## 18. Qué NO se construye todavía

- Backend runtime  
- Tablas / migraciones  
- Instalación de Prisma  
- Conexión PostgreSQL  
- Event bus  
- Vector DB  
- Integraciones Instagram/Facebook/WhatsApp  
- Proveedores de generación de imágenes  
- Publicación autónoma  
- Cambios al frontend (este documento no los requiere)

---

## 19. Alineación con el frontend actual (PROMPT 015)

El modelo tipado ya anticipa el backend:

- Lead statuses ≠ Opportunity statuses  
- Opportunity 1→N Diagnosis / Proposal  
- `SolutionServiceLink`  
- `Activity` con estado `suggested`  
- `LossReason`, `QualificationCriteria`  
- Interaction con `createdBy: human | system | ai_agent`  

El backend debe **persistir estos contratos**, no reinventar el dominio.

---

## 20. Resumen ejecutivo de decisiones

| Tema | Decisión |
|---|---|
| DB | PostgreSQL en Render |
| ORM | **Prisma** (recomendado) |
| API | REST versionada consumida por React Query |
| IA | Orchestrator + agentes especializados |
| Default IA | analyze / suggest / generate / prepare |
| Requiere humano | publish / execute / gasto / comunicaciones sensibles |
| Multi-tenant | `tenant_id` preparado; v1 simple |
| Memoria | 3 niveles; vector DB después |
| Frontend | Se mantiene; no rediseñar |

---

## 21. Siguiente fase sugerida (implementación, no este documento)

1. Crear repositorio/paquete backend.  
2. Inicializar Prisma + PostgreSQL (Render).  
3. Migración 0001: auth + organizations + CRM core.  
4. Endpoints mínimos para sustituir stubs de leads/opportunities.  
5. Tabla `approvals` + esqueleto `agents` (sin ejecución autónoma).  

Hasta nueva instrucción: **solo diseño**. Este archivo es la referencia.
