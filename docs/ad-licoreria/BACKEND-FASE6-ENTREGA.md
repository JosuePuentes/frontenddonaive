# A&D — Fase 6 · Compras + IVA + flujo completo (entrega)

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Fecha:** 2026-08-15  
**Merge:** no.

---

## Criterio

| Check | Resultado |
|---|---|
| Prisma validate | PASS |
| Migración F6 aditiva | `20260815100000_ad_licoreria_fase6_iva` deploy local |
| Tests API (F1–F6) | PASS |
| Build FE / API | PASS |
| MOCK intacto | sí |
| Donaive/POLISUR/main | sin tocar |

---

## Implementado

- Producto `taxable` (IVA 16% por defecto en líneas)
- Líneas/compra: desglose `subtotal` / `tax` / `grandTotal` (USD y Bs)
- Estado `PRELIMINARY` (totalizar sin inventario)
- Flujo: **DRAFT → totalize(PRELIMINARY) → confirm(RECEIVED)** en transacción (stock + kardex + CPP + CxP)
- CxP = **Total General** (incluye IVA) + `subtotal`/`taxAmount`
- Bonificación: CxP sobre facturado+IVA; CPP sobre recibidas (efectivo)
- Edición de líneas en borrador (qty/precio/IVA/bonif/delete)
- `POST /commerce/products` — crear producto desde Compras
- UI `/licoreria/compras` con resumen fijo en vivo + preliminar + confirmar
- Documento preliminar sin utilidad/margen/PVP

## Endpoints nuevos/extendidos

- `GET /commerce/purchases/:id`
- `POST /commerce/purchases/:id/lines`
- `PATCH /commerce/purchases/:id/lines/:lineId`
- `DELETE /commerce/purchases/:id/lines/:lineId`
- `POST /commerce/purchases/:id/totalize`
- `POST /commerce/purchases/:id/confirm` (ahora recibe inventario + CxP)
- `POST /commerce/products`

## Pendientes reales

- Persistencia de ediciones sobre el mismo `purchaseId` sin recrear factura al re-totalizar desde UI (hoy UI puede generar nueva factura si re-guarda)
- PDF/impresión tipográfica (hoy JSON imprimible)
- Escáner cámara nativo (contrato `by-code` listo)

## Conflictos de reglas

Ninguno bloqueante. F5 `createPurchase` ya no crea CxP ni marca ORDERED: el flujo canónico es totalizar→confirmar (F5 E2E actualizado).
