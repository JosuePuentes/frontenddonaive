# Apps — Donaive V2 Monorepo

Estructura preparada para crecer. **No mover masivamente el frontend existente** hasta una fase dedicada de migración.

| App | Estado | Ubicación actual |
|---|---|---|
| `web/` | Frontend Core en raíz del repo | `/src`, `/index.html`, Vite en raíz |
| `api/` | No implementado | Placeholder |
| `ai/` | No implementado | Placeholder |
| `projects/` | Sin instancias de cliente | Placeholder |

## Migración futura (plan mínimo seguro)

```
apps/web/     ← migrar src/, index.html, vite.config cuando el CI lo permita
apps/api/     ← backend Core (PostgreSQL + Prisma en Render)
apps/ai/      ← orquestador IA
apps/projects/<project-slug>/   ← sistemas operativos por cliente
```

Ver `docs/architecture/DONAIVE_V2_BOUNDARIES.md`.
