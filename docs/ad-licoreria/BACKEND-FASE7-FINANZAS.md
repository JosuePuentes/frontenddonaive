# A&D — Fase 7 · Finanzas / Bancos / Casa de Cambio (entrega)

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Fecha:** 2026-08-15  
**Merge:** no.  
**Dashboard:** no iniciado (siguiente fase).

---

## Criterio

| Check | Resultado |
|---|---|
| Prisma validate | PASS |
| Migración F7 aditiva | `20260815210000_ad_licoreria_fase7_finance` |
| Aplicada a PostgreSQL local | sí |
| Tests API (F1–F7) | ver informe de entrega |
| Build FE / API | ver informe |
| MOCK intacto | sí (`VITE_AD_DATA_SOURCE=mock\|api`) |
| Donaive/POLISUR/main | sin tocar |

---

## Entidades nuevas

| Modelo | Rol |
|---|---|
| `AdFinancialAccount` | Banco / efectivo / caja / digital — saldo por moneda |
| `AdFinancialMovement` | Ledger: borrador → preliminar → confirmado |
| `AdFinanceSettings` | Atajo configurable tasa paralela |

### Extensiones

- `AdPaymentMethod.financialAccountId` — vínculo 1:1 opcional
- `AdSalePayment` — `paymentMethodId`, `financialAccountId`, `financialMovementId`
- `AdPayablePayment` — egreso al pagar CxP
- `AdProduct.replacementCostUsd/Bs` — reposición (≠ CPP)

### Enums

- `AdFinancialAccountType`: BANK, CASH, TILL, DIGITAL, OTHER  
- `AdFinancialMovementType`: INGRESO_VENTA, EGRESO_COMPRA, EGRESO_GASTO, RETIRO, TRANSFERENCIA, CAMBIO_MONEDA, AJUSTE, OTROS  
- `AdFinancialDocStatus`: DRAFT, PRELIMINARY, CONFIRMED, VOIDED  

---

## Reglas financieras

1. **Monedas separadas** — nunca sumar USD+Bs en un total engañoso.
2. **Tasa BCV** — visible + historial + auditoría.
3. **Tasa paralela (PROTECTED)** — privada; no en POS/dashboards; atajo configurable; permiso `finance.parallel_rate` / `rates.protected.manage`.
4. **Método con `usesSpecialRateRef`** — compra usa snapshots BCV+protegida; no convierte ventas automáticamente.
5. **Venta → INGRESO_VENTA** en cuenta del método (si está vinculada).
6. **Compra CONTADO** → CxP PAGADA + EGRESO_COMPRA (si hay cuenta).
7. **Compra CRÉDITO** → CxP pendiente **sin** egreso hasta `payPayable`.
8. **Transferencia misma moneda** — 1:1.
9. **Cambio de moneda** — tasa explícita obligatoria; documento preliminar; no altera factura de venta.
10. **CPP** — costo efectivo sobre unidades recibidas (bonificación diluye); histórico inmutable al cambiar tasas.
11. **Reposición** — `costoHistórico × paralelaActual / bcvActual` cuando aplica ref. paralela; no modifica CPP.
12. **Auditoría** — before/after en tasas, cuentas, movimientos, pagos CxP, métodos.

---

## Endpoints nuevos

| Método | Ruta |
|---|---|
| GET/PUT | `/api/v1/ad/finance/settings` |
| GET/POST | `/api/v1/ad/finance/accounts` |
| PATCH | `/api/v1/ad/finance/accounts/:id` |
| GET | `/api/v1/ad/finance/movements` |
| GET | `/api/v1/ad/finance/movements/:id` |
| POST | `/api/v1/ad/finance/transfers` |
| POST | `/api/v1/ad/finance/exchange` (+ `/preview`) |
| POST | `/api/v1/ad/finance/expenses` |
| POST | `/api/v1/ad/finance/movements/:id/totalize` |
| POST | `/api/v1/ad/finance/movements/:id/confirm` |
| GET | `/api/v1/ad/finance/products/:productId/replacement-cost` |

Extendidos: `payment-methods` (+ `financialAccountId`), `payables/:id/payments` (+ cuenta), ventas (ingreso automático).

---

## UI

```
Finanzas
├── Bancos (/bancos)
├── Movimientos (/finanzas/movimientos)
├── Casa de Cambio (/casa-cambio)
├── Tasas (/configuracion/tasas)
└── Configuración financiera (/finanzas/configuracion)
```

---

## Permisos

`finance.view` · `finance.manage` · `finance.transfer` · `finance.exchange` · `finance.rates` · `finance.parallel_rate` · `finance.expenses` · `finance.withdrawals`

| Rol | Acceso |
|---|---|
| ADMIN | todo |
| SUPERVISOR | operativo (sin parallel_rate por defecto) |
| CAJERO | solo `finance.view` |
| MESONERA | ninguno |
| INVENTARIO | ninguno financiero |

---

## Ejemplos numéricos

**CPP con regalía:** 100 × $22,90 = $2.290; +10 gratis → efectivo caja = 2290/110.

**Paralela:** $10 @ 870 → 8.700 Bs; / BCV 772,54 ≈ **$11,26** ref. BCV (snapshot histórico).

**Reposición posterior:** paralela 900, BCV 800 → $10 × 900/800 = **$11,25** (CPP histórico intacto).

**Casa de cambio:** 772.540 Bs @ 870 → 772.540/870 USD. Venta original $100 permanece $100.

---

## Pendientes reales

- Conciliación bancaria / extractos
- PDF tipográfico de transferencias (hoy preliminar JSON/documento API)
- Dashboard ejecutivo (fase siguiente — **no iniciado**)
- Seed de cuentas/métodos demo opcionales

## Conflictos

Ninguno bloqueante. `AdAccount` (mesa POS) distinto de `AdFinancialAccount`.
