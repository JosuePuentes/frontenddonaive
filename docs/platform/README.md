# docs/platform

Documentación operativa de la plataforma Donaive V2.

## Arquitectura

- [Backend Architecture](../architecture/DONAIVE_V2_BACKEND_ARCHITECTURE.md)
- [Multi-Project Platform](../architecture/DONAIVE_V2_MULTI_PROJECT_PLATFORM.md)
- [Platform Contracts](../architecture/DONAIVE_V2_PLATFORM_CONTRACTS.md)
- [Boundaries](../architecture/DONAIVE_V2_BOUNDARIES.md)

## Paquetes de contratos

| Paquete | Contenido |
|---|---|
| `@donaive/domain` | Entidades de plataforma (Organization, Project, Template, …) |
| `@donaive/core` | Capabilities, Audit, IA, Analytics |

## Base de datos (futuro)

PostgreSQL (Render) + Prisma. Estrategia evolutiva: schema-per-project → híbrido.

**Sin migraciones ni conexión real en PROMPT 016C.**
