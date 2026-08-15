# A&D Fase 10.1 — UX operativa implementada

**Rama:** `cursor/ad-licoreria-portal-335d`  
**Base:** `docs/ad-licoreria/FASE-10-AUDITORIA-UX.md`

## UX implementada

- Mesonera «Mis mesas» + cobro embebido (`AdAccountChargePanel`) sin navegar a `/ventas` vacío
- Inventario operativo consumiendo `getOperationalAvailability`
- COP: conversión u.base → presentación en transferir/comprar
- POS: pasos producto → cliente → cobro; preliminar/recibo visuales
- Cierre de caja: período **HOY** alineado con repository
- QR: teléfono **y** cédula obligatorios
- Nav filtrada por permisos/rol
- CSS touch / mesonera / documentos

## Problemas corregidos (de la auditoría)

| ID | Corrección |
|---|---|
| H1 | Cobro embebido con cuenta precargada |
| H2 | Cierre UI filtra HOY como el repo |
| H3 | Inventario muestra capas operativas |
| H4 | Sidebar filtrado por `can()` |
| H5 | Gate `createPurchaseRequest` en repository |
| H6 | COP convierte base→presentación |
| H8 | Recibo/preliminar imprimibles (mock print) |
| H9 | QR exige teléfono + cédula |
| H11 | Cierre desde panel de cobro mesonera |

## Decisión de negocio aplicada (autorizada en 10.1)

**QR:** el consumo ahora exige **teléfono y cédula** (antes: uno u otro). Documentado en suite 10.1 Q1 y Fase 9 N.

## Pendiente (sin implementar)

- Soft-reserve / recepción TR multi-paso (solo UX de estados existente)
- Unificar traslado instantáneo de Depósitos vs documentos COP
- Export persistente de reportes
- Escáner nativo QR
- Layout tablet cajero más profundo

## Pruebas

| Suite | Resultado |
|---|---|
| Fase 3 | 14/14 PASS |
| COP | 25/25 PASS |
| Fase 8 | 6/6 PASS |
| Fase 9 | 22/22 PASS |
| Fase 9.1 | 9/9 PASS |
| Fase 10.1 | 8/8 PASS |
| `npm run build` | OK |

## Intactos

`apps/api` · Prisma · `main` · sin merge · sin endpoints
