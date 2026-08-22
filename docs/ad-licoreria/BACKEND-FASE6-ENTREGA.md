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
- Flujo: **DRAFT → edición libre → TOTALIZAR → PRELIMINARY → editar (PUT) → TOTALIZAR → CONFIRMAR**
- `PUT /commerce/purchases/:id` sincroniza la **misma** compra (no nueva factura); re-totalizar actualiza totales
- Solo **CONFIRM** aplica inventario, CPP y CxP; re-totalizar no crea CxP
- CxP = **Total General** (incluye IVA) + `subtotal`/`taxAmount` separados
- Bonificación: CxP sobre facturado+IVA; CPP sobre recibidas (efectivo)
- Edición de líneas en borrador (qty/precio/IVA/bonif/delete) + auditoría before/after
- `POST /commerce/products` — crear producto desde Compras y volver a la compra
- UI `/licoreria/compras`: resumen vivo Subtotal/IVA/Total + documento imprimible real
- Documento preliminar/confirmada: proveedor, factura, líneas (código/desc/marca/pres/cant/costos), IVA, totales, pago, moneda, crédito, vencimiento — **sin** utilidad/margen/PVP/tasa paralela

## Endpoints nuevos/extendidos

- `GET /commerce/purchases/:id`
- `PUT /commerce/purchases/:id` — sync mismo `purchaseId` (DRAFT/PRELIMINARY)
- `POST /commerce/purchases/:id/lines`
- `PATCH /commerce/purchases/:id/lines/:lineId`
- `DELETE /commerce/purchases/:id/lines/:lineId`
- `POST /commerce/purchases/:id/totalize`
- `POST /commerce/purchases/:id/confirm` (inventario + CxP)
- `POST /commerce/products`

## Pendientes reales (post F6 — no Bancos aún)

- Escáner cámara nativo (contrato `by-code` listo)
- PDF archivo descargable (hoy impresión tipográfica vía ventana de impresión del navegador)
- Bancos / Casa de Cambio / Dashboard (fuera de alcance de este cierre)

## Conflictos de reglas

Ninguno bloqueante. F5 `createPurchase` ya no crea CxP ni marca ORDERED: el flujo canónico es totalizar→confirmar (F5 E2E actualizado).

## Cierre pendientes F6 (validación)

| Check | Resultado |
|---|---|
| Re-totalización mismo `purchaseId` | cubierto en test E2E |
| CxP sin duplicación al re-totalizar | cubierto |
| Documento imprimible | `AdPurchaseDocument` + `moneyDoc` |
| Resumen en vivo UI | barra fija Subtotal/IVA/Total |
| Crear producto desde Compras | mantenido |