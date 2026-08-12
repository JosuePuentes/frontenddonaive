# Donaive V2 — Boundaries (Core / Projects / Templates)

**Estado:** Definido e implementado a nivel de contratos (PROMPT 016C)  
**Fecha:** 2026-08-12  
**Regla fundamental:** Un cambio dentro de un Project nunca debe modificar accidentalmente Donaive Core ni otro Project.

---

## Bounded contexts

### CORE (Donaive Core)

Responsable de:
- Organizations, CRM comercial (Leads, Opportunities, Diagnosis, Proposals, Services)
- Projects como entidades administrativas de plataforma
- Templates, Template Versions, Project Instances, Instance Versions
- Updates, Plans, Licenses, Subscriptions, Modules, Domains
- Project Users (asignación), Approvals, Audit
- Analytics global autorizado (read-only)
- AI Orchestrator futuro

**Ubicación futura:** `apps/api/`, `apps/web/`, `packages/core/`, `packages/domain/`

### PROJECT (instancia operacional)

Cada Project contiene **exclusivamente** su lógica operacional:
- POS, inventario, compras, gastos, reportes del negocio
- Usuarios locales, configuración operativa, customizaciones
- Base de datos operacional (schema/DB del project)

**Ubicación futura:** `apps/projects/<project-slug>/`

---

## Diagrama de dependencias

```
                    ┌─────────────────────┐
                    │    Donaive Core     │
                    │  apps/web, apps/api │
                    │  packages/core      │
                    │  packages/domain    │
                    └──────────┬──────────┘
                               │
              contratos/API    │    contratos/API
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
 ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
 │  Project A  │        │  Project B  │        │  Project C  │
 │ apps/projects/a    │ apps/projects/b    │ apps/projects/c
 └─────────────┘        └─────────────┘        └─────────────┘
        │                      │                      │
        └────────── NO cross-import ──────────────────┘
```

---

## Permitido

### Project → paquetes compartidos

```
Project
  ↓
packages/shared     (utils puros)
packages/ui         (componentes UI)
packages/domain     (contratos de entidades — tipos)
packages/core       (capabilities, audit — tipos)
```

### Project → Core (solo vía contrato/API)

```
Project  ──HTTP/API──►  Core endpoints públicos
Project  ──read──►       exports autorizados hacia Intelligence
```

### Core → metadata de Projects

Core administra metadata (licencias, dominios, updates, registry). **No escribe** datos operacionales del Project salvo API explícita.

### Templates → Projects (solo vía provisioning/update)

```
TemplateVersion  ──create instance──►  ProjectInstance
Update/Release   ──assign/install──►  ProjectUpdate (historial)
```

---

## Prohibido

### Project A → Project B

```
Project A  ──X──►  Project B   (código, tipos internos, DB, secretos)
```

Nunca importar módulos, servicios, componentes ni configuración de otro Project.

### Project → Core database internals

```
Project  ──X──►  Prisma client Core
Project  ──X──►  tablas/schemas Core directamente
```

Un Project consume **contratos y APIs**, no la capa de persistencia interna del Core.

### Customización → Template (automático)

```
ProjectCustomization(A)  ──X──►  Template base
ProjectCustomization(A)  ──X──►  Project B
```

Promover una customización a Template requiere proceso explícito de productización (nuevo Release).

### Intelligence → escritura operacional

```
Donaive Intelligence  ──X──►  modificar datos operacionales del Project
```

Solo lectura / agregados autorizados.

### Agent → autonomía

```
AI Agent  ──prepare/analyze/suggest──►  OK (con authz)
AI Agent  ──publish/execute──►  REQUIERE aprobación humana
```

---

## Aislamiento de datos (PostgreSQL futuro)

| Capa | Ubicación futura | Aislado |
|---|---|---|
| Core metadata | schemas/tables Core | Global con RLS por org/project |
| Project operacional | schema-per-project o DB dedicada | Estricto |
| Analytics | snapshots/exports | Read-only, agregados |

Estrategia evolutiva: schema-per-project → híbrido → DB dedicada por cliente grande.

**Sin migraciones en PROMPT 016C.** Contratos TypeScript estables independientemente de la estrategia física.

---

## Monorepo — estructura actual (mínima segura)

```
/                          # Frontend Core actual (sin mover)
apps/
  web/                     # Documentación migración futura
  api/                     # Placeholder backend Core
  ai/                      # Placeholder orchestrator
  projects/                # Placeholder — sin instancias de cliente
packages/
  core/                    # @donaive/core — capabilities, audit, IA
  domain/                  # @donaive/domain — entidades plataforma
  auth/                    # Placeholder
  shared/                  # Placeholder
  ui/                      # Placeholder
docs/
  architecture/            # Contratos y boundaries
  platform/                # Índice operativo
```

**Decisión:** no mover `/src` a `apps/web/` para evitar romper build, rutas y despliegue. Documentado como plan de migración.

---

## Validación de aislamiento (futuro)

Toda operación autorizada exigirá:

```
organizationId + projectId + role + capability + resource
```

Nunca confiar en:
- Frontend alone
- URL/slug/domain sin resolución server-side
- Parámetros client-supplied sin verificación

---

## Reglas para futuros Projects

1. Namespace: `apps/projects/<project-slug>/`
2. `slug` técnico estable; nombre comercial en `name` (mutable)
3. Categoría (`liquor_store`, `pharmacy`, …) ≠ nombre comercial
4. No codificar nombres comerciales en rutas arquitectónicas
5. No crear `apps/projects/licoreria-001` hasta prompt dedicado

---

## Offline-first (requisito futuro)

Projects operativos (especialmente POS) requerirán:

| Modo | Comportamiento |
|---|---|
| ONLINE | sync local ↔ cloud bidireccional |
| OFFLINE | operaciones locales + cola |
| RECONEXIÓN | flush de cola + resolución de conflictos |

Documentado en `@donaive/core` (`OfflineSyncRequirement`). Sin implementación.

---

## Checklist de revisión (PR futuro)

- [ ] ¿Importa código de otro Project? → **Rechazar**
- [ ] ¿Accede a DB Core directamente? → **Rechazar**
- [ ] ¿Customización afecta Template u otro Project? → **Rechazar**
- [ ] ¿Agent publica/ejecuta sin approval? → **Rechazar**
- [ ] ¿Update sobrescribe historial? → **Rechazar**
- [ ] ¿Licencia vencida elimina datos? → **Rechazar**
