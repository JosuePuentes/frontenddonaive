# Donaive Core API

Backend central de Donaive V2 — plataforma multi-project, licencias, auditoría y CRM (fases futuras).

Ubicación en el monorepo: `apps/api/`  
Schema PostgreSQL: `donaive_core` (aislado del backend legacy en `public`).

## Stack

- Node.js 20+ · TypeScript · Express 5
- Prisma · PostgreSQL (Render)
- Contratos monorepo: `@donaive/core`, `@donaive/domain`

---

## Desarrollo local

```bash
cd apps/api
cp .env.example .env
# Editar .env — DATABASE_URL opcional para dev sin persistencia
npm install
npm run dev
```

La API escucha en `http://localhost:3001` (o el `PORT` configurado).

### Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor con hot-reload (tsx) |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm start` | Ejecuta `dist/server.js` |
| `npm test` | Tests (vitest) |
| `npm run prisma:generate` | Genera Prisma Client |
| `npm run prisma:migrate` | Migraciones en desarrollo |
| `npm run prisma:migrate:deploy` | Aplica migraciones (producción) |
| `npm run prisma:studio` | Prisma Studio |
| `npm run verify:monorepo` | Verifica resolución de `packages/core` y `packages/domain` |
| `npm run render:build` | Build para Render (`prisma:generate` + `build`) |
| `npm run render:start` | Start para Render (`migrate:deploy` + `start`) |

---

## Variables de entorno

Copiar `.env.example` → `.env`. **No commitear secretos.**

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | Producción | URL PostgreSQL. Será provista por Render PostgreSQL al conectar el servicio. |
| `PORT` | No | Puerto HTTP. Render lo inyecta automáticamente. |
| `NODE_ENV` | No | `development` \| `test` \| `production` |
| `CORS_ORIGIN` | Producción | Orígenes permitidos, separados por coma. Ej: `https://donaive.com.ve` |
| `JWT_SECRET` | Futuro | Reservado para autenticación JWT (no implementada aún) |
| `CORE_DB_SCHEMA` | No | Schema PostgreSQL del Core (default: `donaive_core`) |

---

## Prisma

```bash
npm run prisma:generate          # Generar client
npm run prisma:migrate           # Dev: crear/aplicar migraciones
npm run prisma:migrate:deploy      # Prod: solo aplicar migraciones existentes
```

**Importante:**
- Las migraciones viven en `prisma/migrations/`.
- **No ejecutar** `prisma migrate reset` en producción.
- **No borrar** migraciones existentes.
- Inspeccionar la base antes de migrar si comparte instancia con datos legacy.

---

## Tests

```bash
npm test
```

Cobertura mínima: health, autorización, aislamiento entre Projects, audit, integración PostgreSQL (local si hay DB).

---

## Build

```bash
npm run build
```

Salida en `dist/`. TypeScript estricto; sin imports rotos hacia el frontend.

---

## Producción (flujo conceptual)

```bash
npm install
npm run prisma:generate
npm run build
npm run prisma:migrate:deploy   # Solo cuando DATABASE_URL apunte a la base V2
npm start
```

Atajos incluidos:

```bash
npm run render:build
npm run render:start
```

---

## Render deployment

> **Este prompt no conecta Render.** Solo documenta la configuración futura.

### Web Service

| Campo | Valor |
|---|---|
| **Repository** | Repositorio actual de Donaive V2 (monorepo) |
| **Root Directory** | `apps/api` |
| **Runtime** | Node 20+ |
| **Build Command** | `npm install && npm run render:build` |
| **Start Command** | `npm run render:start` |
| **Health Check Path** | `/health/live` |

### Variables de entorno en Render

Configurar manualmente al crear el servicio:

- `DATABASE_URL` — Internal Database URL del PostgreSQL Donaive V2 (cuando exista)
- `NODE_ENV` — `production`
- `CORS_ORIGIN` — dominio(s) del frontend Donaive
- `JWT_SECRET` — generar en Render (futuro)

Render inyecta `PORT` automáticamente.

### Dependencias del monorepo

El backend declara:

```json
"@donaive/core": "file:../../packages/core",
"@donaive/domain": "file:../../packages/domain"
```

Render clona el **repositorio completo** y ejecuta build desde `apps/api/`. Las rutas `file:../../packages/*` resuelven correctamente porque `packages/` está en la raíz del repo.

`postinstall` verifica que los paquetes existan (`verify:monorepo`) y ejecuta `prisma generate`.

**No se requieren npm workspaces** para este despliegue. Si en el futuro se añaden más paquetes compartidos o builds paralelos, evaluar workspaces documentando el cambio antes de implementarlo.

### Health checks

| Ruta | Uso |
|---|---|
| `GET /health/live` | Liveness — proceso HTTP vivo (recomendado para Render) |
| `GET /health` | Estado general + info de DB (200 aunque DB falle) |
| `GET /health/ready` | Readiness — requiere DB conectada (503 si no) |

---

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health/live` | Liveness check |
| GET | `/health` | Health + estado DB |
| GET | `/health/ready` | Readiness check |
| GET | `/api/v1/projects` | Listar projects |
| GET | `/api/v1/projects/:id` | Detalle project |
| POST | `/api/v1/projects` | Crear project |
| GET | `/api/v1/templates` | Plantillas |
| GET | `/api/v1/updates` | Actualizaciones |
| GET | `/api/v1/plans` | Planes |
| GET | `/api/v1/licenses` | Licencias |
| GET | `/api/v1/subscriptions` | Suscripciones |
| GET | `/api/v1/audit` | Auditoría |

---

## Autenticación (desarrollo)

Headers temporales hasta JWT:

```
X-User-Id: <uuid>
X-User-Roles: donaive_admin | project_user,...
X-Accessible-Project-Ids: <uuid>,<uuid>
```

---

## Seguridad

- `helmet` habilitado
- CORS restringido en producción vía `CORS_ORIGIN`
- Stack traces no expuestos en respuestas de producción
- Errores 500 genéricos al cliente; detalle solo en logs server-side

---

## Aislamiento Core / Projects

- **Core:** `apps/api/`, `packages/core/`, `packages/domain/`
- **Projects futuros:** `apps/projects/<project-slug>/`
- Ver `docs/architecture/DONAIVE_V2_BOUNDARIES.md`

El backend anterior (otro repositorio) **no se modifica** en esta arquitectura.
