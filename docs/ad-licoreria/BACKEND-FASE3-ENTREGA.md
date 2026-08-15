# A&D — Fase 3 · Conexión Frontend ↔ API real (cierre)

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Fecha:** 2026-08-15  
**Merge:** no.  
**MOCK:** no eliminado.

---

## Criterio de cierre (verificado al final)

| Check | Resultado |
|---|---|
| Frontend `npm run build` | PASS (post-correcciones) |
| API `npm run build` | PASS (post-correcciones) |
| API `npm test` | PASS (post-correcciones) |
| Uniones `AdResult \| Promise` en Provider | eliminadas |
| MOCK default | funciona |
| Selector API | `VITE_AD_DATA_SOURCE=api` |
| main / merge | no tocados |

---

## Contrato async unificado

**Causa raíz:** el Provider exponía `AdResult | Promise<AdResult>` y las páginas leían `.ok` de forma síncrona.

**Corrección:**

1. `asAdAsync()` / `resolveAdResult()` normalizan sync|async → `Promise<AdResult<T>>` (`Promise.resolve`, sin casts inseguros).
2. `AdLicoreriaProvider` tipa **todas** las mutaciones duales mock|api como `Promise<AdResult<…>>` y las envuelve con `asAdAsync(...)`.
3. Los consumers A&D usan `await resolveAdResult(...)` (o `await` directo).
4. Getters / Diseño / TV / settings locales siguen sync (nunca API).

```
mock → repository.ts (sync)  ─┐
                               ├─→ Provider asAdAsync → Promise ─→ páginas await
api  → api-backed-repository   ─┘
```

---

## Endpoints conectados

### Públicos
- `POST /api/v1/ad/auth/login`
- `POST /api/v1/ad/bootstrap`

### Portal
- `GET /snapshot`, operators, permissions/matrix, `PATCH /warehouses/:id`
- accounts list/get/payments, `GET /reports/summary`

### F1/F2 vía adapter
context, products/presentations, stock, customers, sales (`AD-YYYY-######`),
accounts serve/close/void, inventory/availability, purchases, transfers (`TR-YYYY-######`),
prepaids/QR, COP, closures, audit.

---

## Módulos FE conectados

Auth, contexto, usuarios, depósitos, productos/presentaciones, inventario, clientes,
POS (preliminar→confirm), cuentas/mesonera/servir, pagos, prepagos/QR, compras,
COP, transferencias, cierres, auditoría (snapshot), reportes (summary).

**MOCK local:** Diseño Web, TV.

---

## Smokes locales (sin DB)

```bash
npx tsx scripts/ad-fase3-smoke.mts          # asAdAsync
npx tsx scripts/ad-fase3-mock-smoke.mts     # repository MOCK + asAdAsync
npx tsx scripts/ad-fase3-api-mode-smoke.mts # selector mock|api
```

API real end-to-end requiere PostgreSQL + migraciones F1/F2 aplicadas + `VITE_API_BASE_URL`.

---

## Pendientes reales

1. JWT (headers de desarrollo documentados; no inventado).
2. Aplicar migraciones en entorno con DB autorizada.
3. E2E login→venta→recibo con API viva.
4. Stubs restantes en modo API: discount/reopen (delegan MOCK), TV/diseño.
5. Snapshot: mapear sales/purchases/closures completos (hoy parcial; mutaciones construyen entidad tipada).

## Riesgos

- Sin sesión API, mutaciones fallan (sin fallback silencioso a MOCK).
- Headers ≠ JWT.
- Snapshot limitado; tenants grandes necesitarán paginación.

## Confirmación de alcance

- `main` no modificado / no merge.
- Prisma: sin migraciones nuevas en este cierre (solo uso de F1/F2 ya aprobadas).
- Cambios API: auth público, portal, formatos `AD-`/`TR-`, tests F3 — alcance Fase 3.
- Donaive / POLISUR no tocados.
