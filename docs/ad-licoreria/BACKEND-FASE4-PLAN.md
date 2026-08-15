# A&D Backend — Fase 4 · Plan

**Rama:** `cursor/ad-licoreria-portal-335d`  
**Base:** Fases 1–3 cerradas  
**Merge:** no.

## Objetivo

Persistencia operativa real: PostgreSQL + migraciones + seed + JWT + E2E.

## No hacer

- Rediseñar UX / módulos nuevos
- WhatsApp / WebSocket TV / cloud / QR nativo / bancos
- DROP / RESET / merge a main
- Eliminar MOCK

## Arquitectura (sin cambios de forma)

```
FE Provider → repository-adapter (mock|api) → apps/api → Prisma → PostgreSQL (schema ad_licoreria)
```

## Trabajo F4

1. Auditar schema F1+F2 (ya existente)
2. Migración aditiva F4 solo si hace falta (sesiones JWT opcionales / índices)
3. `prisma validate` + `migrate status` + `migrate deploy` en DB local
4. Seed reproducible (tenant, 2 depósitos, roles, productos/presentaciones)
5. JWT HS256 (`Authorization: Bearer`) como auth A&D definitiva
6. Middleware context desde JWT (no confiar en warehouseId del body)
7. Remontar `/api/v1/ad/*` protegido con JWT (sin exigir X-User-Id Core)
8. FE: session guarda token; headers Bearer
9. E2E A–O contra PostgreSQL local
10. Docs entrega + builds/tests post-cambio

## DB local (este entorno)

- Host: `127.0.0.1:5432`
- DB: `donaive_core_dev`
- Schema: `ad_licoreria` (aditivo; `donaive_core` ya existe)
- Credenciales locales de desarrollo en `apps/api/.env` (gitignored)

## Auth

- Login público → JWT firmado con `AD_JWT_SECRET` (fallback `JWT_SECRET`)
- Claims: `sub`=operatorId, `tid`=tenantId, `role`, `wid`=warehouseId
- Caducidad: 12h (configurable)
- Headers de desarrollo `X-Ad-Operator-Id` solo como fallback si `AD_ALLOW_DEV_HEADERS=1` (no producción)

## Criterio de cierre

Ver `BACKEND-FASE4-ENTREGA.md` (implementación y validación contra PostgreSQL local completadas).
