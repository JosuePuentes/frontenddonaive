# Donaive Core API

Backend central de Donaive V2 — CRM, plataforma multi-project, licencias, auditoría.

## Stack

- Node.js + TypeScript
- Express 5
- Prisma + PostgreSQL (Render)
- Schema aislado: `donaive_core` (no modifica tablas legacy en `public`)

## Inicio rápido

```bash
cd apps/api
cp .env.example .env
# Configurar DATABASE_URL con PostgreSQL Render (sin credenciales en el repo)
npm install
npm run prisma:generate
npm run prisma:migrate:deploy   # solo tras verificar la base
npm run dev
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check (sin DB requerida) |
| GET | `/api/v1/projects` | Listar projects (filtrado por permisos) |
| GET | `/api/v1/projects/:id` | Detalle de project |
| POST | `/api/v1/projects` | Crear project |
| GET | `/api/v1/templates` | Plantillas |
| GET | `/api/v1/updates` | Actualizaciones |
| GET | `/api/v1/plans` | Planes |
| GET | `/api/v1/licenses` | Licencias |
| GET | `/api/v1/subscriptions` | Suscripciones |
| GET | `/api/v1/audit` | Auditoría |

## Autenticación (desarrollo)

Headers temporales hasta JWT completo:

```
X-User-Id: <uuid>
X-User-Roles: project_user | donaive_admin,...
X-Accessible-Project-Ids: <uuid>,<uuid>
```

## Migraciones — IMPORTANTE

- El schema Prisma usa `donaive_core` para **aislar** del backend legacy.
- **No ejecutar migraciones destructivas** sin inspeccionar la base Render.
- Si `DATABASE_URL` apunta a una base con datos del backend anterior, documentar antes de migrar.

## Aislamiento Core / Projects

Ver `docs/architecture/DONAIVE_V2_BOUNDARIES.md`.

Projects futuros viven en `apps/projects/<slug>/` y se comunican con Core solo vía API/contratos.
