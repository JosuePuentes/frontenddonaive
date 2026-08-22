# A&D Licorería & Bodegón — Fase 5

## Cierre de decisiones de negocio (PROPUESTAS)

> **Estado:** análisis / propuestas. **No aprobado aún.**  
> **No implementar** Prisma, API, migraciones ni cambios de lógica mock.  
> Base: Fase 4 (`src/services/ad-licoreria/README.md`) · commit diseño `b8a3ef4`.  
> Cada ítem queda marcado como **PROPUESTA** hasta aprobación explícita del propietario/negocio.

---

## Tabla resumen

| ID | Decisión | Problema | Alternativas | Propuesta | Motivo | Impacto futuro |
|---|---|---|---|---|---|---|
| J.1 | Prepago ↔ inventario | ¿Cuándo salen las 20 cervezas del stock? | A descontar al comprar · B al servir · C reserva soft · D híbrido | **C (reserva / comprometido)** + descuento físico al consumo | Separa existencia real vs comprometida; evita “desaparecer” mercancía no entregada | Tablas `InventoryBalance` + `qtyReserved` o `StockReservation`; kardex al consumir |
| J.2 | Pagos mixtos USD/Bs | ¿Cómo se sabe si $20 + Bs X están la cuenta? | Conversión automática · Sin cobertura cruzada · Tasa congelada al pago · Tasa al cierre | **Sin conversión automática**; cada pago es hecho en su moneda; cobertura = reglas por moneda + tasa **opcional explícita** solo para “equivalencia informativa” | Auditable; no inventa tipos de cambio | `Payment` inmutable; `exchangeRateUsed?` nullable; reportes por moneda |
| J.3 | Pendientes en cuenta | 20 pedidas, 13 servidas, 7 pendientes + ¿cerrar/pagar? | Bloquear cierre · Permitir pago total y dejar pendiente · Convertir a prepago | **Permitir pagar**; **no cerrar** si hay pendiente **salvo** convertir a prepago/QR o anular pendiente con autorización | Dinero ≠ mercancía; evita pérdida de 7 unidades | Estados cuenta; flujo `pending → prepaid` |
| J.4 | Anulación / devolución | Qué kardex/caja en cada caso | Restore siempre · Restore solo servido · Soft-delete | **Matriz por caso** (abajo): solo revierte lo que realmente movió stock/caja | Evita duplicar o inventar stock | Endpoints void + movimientos `DEVOLUCION` / `CAJA_REVERSO` |
| J.5 | Costos / utilidad | Compras a $1 y $1.20 | FIFO · Promedio ponderado · Último costo | **Costo promedio ponderado (CPP)** al recibir compra | Simple, estable para bodegón; suficiente al inicio | `avgCostUsd/Bs` en producto o capa costo; COGS al servir |
| J.6 | Cambio de precios | Cuenta abierta con $5 → catálogo $6 | Precio vivo · Snapshot al pedir · Snapshot al servir | **Snapshot al agregar ítem** (precio de línea inmutable) | Evita pelea en mesa; auditoría clara | `AccountItem.unitPrice*` congelado |
| J.7 | Cierre con abiertas | Qué pertenece al día | Forzar cierre · Reportar pasivos · Bloquear cierre caja | **Cierre de caja permitido**; informe de **pasivos**: abiertas, pendientes, prepagos; sin “borrar” cuentas | El día cierra dinero; mercancía comprometida queda visible | `CashClosing` + snapshot `openAccountsSummary` |
| J.8 | Traslados depósitos | Evitar pérdida/duplicación | Movimiento único · Par salida/entrada · Traslado con estados | **Traslado con estados** (BORRADOR→EN_TRÁNSITO→RECIBIDO) + kardex salida al enviar y entrada al recibir | No hay limbo ni doble conteo | Entidad `StockTransfer` + 2 movimientos |
| J.9 | Permisos sensibles | Quién puede anular/ajustar | Matriz roles | Matriz propuesta abajo (ADMIN/SUPERVISOR/CAJERO/MESONERA/INVENTARIO) | Operación segura sin fricción excesiva | Claims JWT + policy |
| J.10 | QR prepago | Token seguro y operable | Datos en QR · Solo ID · Token firmado | **Token opaco aleatorio** + código `PRE-YYYY-######`; consulta API; rotación/bloqueo | Sin PII; control de abuso | `qrToken` unique; rate limit; audit consumo |

---

## J.1 — Prepagos e inventario · PROPUESTA: reserva (comprometido) + descuento al consumo

### Problema
Cliente compra **20 cervezas** prepago. Si se descuentan ya, el inventario físico “baja” aunque la mercancía siga en el depósito. Si no se descuenta nunca hasta servir, se puede sobrevender el mismo stock a otro cliente.

### Alternativas
| | Descripción |
|---|---|
| A | Descontar 20 al crear prepago (mock actual) |
| B | No descontar hasta servir/consumir |
| C | **Reservar 20** (comprometido) sin bajar “disponible físico” de la misma forma, o bajar `disponible = real − reservado` |
| D | Descontar al crear solo desde depósito servicio; bodega intacta |

### Propuesta (C)
Mantener tres conceptos:

1. **Existencia real** (`qtyBase`): lo que hay físicamente en el depósito.  
2. **Existencia comprometida** (`qtyReservedBase`): prepagos activos + pendientes pagados no servidos.  
3. **Existencia disponible** = real − comprometida (lo vendible a nuevos clientes).

**Al crear prepago de 20:**  
- Caja: registra cobro.  
- Inventario: `qtyReserved += 20` (mismo depósito de servicio, p.ej. Depósito 2).  
- Kardex: movimiento tipo `RESERVA_PREPAGO` (no es salida física; o salida a “ubicación virtual PREPAGO” — ver impacto).  
- **Al consumir 8:** `qtyReserved −= 8`, `qtyBase −= 8`, kardex `CONSUMO_PREPAGO` / `CONSUMO_CUENTA`.  
- **Disponible** baja 20 al reservar; al consumir no cambia el disponible (ya estaba comprometido), solo real.

**Vencimiento / anulación sin consumo:** libera reserva (`qtyReserved −= saldo`), sin tocar `qtyBase` si nunca salió.  
**Anulación con consumo parcial:** no se “devuelve” lo ya consumido salvo devolución explícita (J.4).

### Ejemplo A&D
Prepago PRE-2026-000025 · 20 Regional individual · Depósito 2 tenía 120 reales, 0 reservados → tras compra: real 120, reservado 20, disponible 100. Consumo 8 → real 112, reservado 12, disponible 100.

### Por qué es más segura
Evita mentir el conteo físico (A) y evita sobreventa (B puro). Encaja con “pedido ≠ movimiento” y “servir sí mueve”.

### Impacto Prisma/API
- `InventoryBalance`: `qtyBase`, `qtyReservedBase`.  
- Movimientos: `RESERVA_PREPAGO`, `LIBERACION_RESERVA`, `CONSUMO_PREPAGO`.  
- Reportes: columnas Real / Comprometido / Disponible.  
- Migración desde mock A: alinear createPrepaid (hoy descuenta) en fase de implementación.

### Necesita aprobación comercial
**SÍ** — cambia el significado de “existencia” en pantalla vs mock actual.

---

## J.2 — Pagos mixtos USD / Bs · PROPUESTA: sin conversión automática; hechos por moneda

### Problema
Cuenta de **$20**. Cliente paga **$10 efectivo USD** + **pago móvil en Bs**. ¿Cuándo está pagada? ¿Quién fija la tasa? ¿Qué muestra el cierre?

### Alternativas
| | Descripción |
|---|---|
| A | Convertir todo a USD con tasa del día (automático) |
| B | No hay cobertura cruzada: debe pagarse el total USD en USD y el Bs en Bs (dos totales) |
| C | Dual: precios tienen USD y Bs; el cajero elige cómo “aplicar” cada pago a una moneda del total |
| D | Tasa congelada al abrir cuenta o al primer pago; conversión solo si el cajero marca “equivalencia” |

### Propuesta (B + D informativa)
1. **Toda línea de pago es un hecho:** método, moneda, monto, banco/ref, hora, usuario. **Inmutable.**  
2. **No hay conversión automática** de Bs→USD para “cerrar” la cuenta.  
3. Cada presentación/cuenta tiene **totalUsd** y **totalBs** (precios independientes).  
4. Cobertura:  
   - `paidUsd ≥ totalUsd − discountUsd` **y**  
   - `paidBs ≥ totalBs − discountBs`  
   ⇒ estado PAGADA.  
5. Si el negocio acepta “pagar el USD en Bs”, debe existir acción explícita:  
   `applyFxPayment { amountBs, rate, target: 'USD_BALANCE' }` con tasa **ingresada/confirmada**, congelada en el pago (`exchangeRateUsed`, `equivalentUsd`). Eso es **opt-in**, no silencioso.  
6. **Vuelto:** solo dentro de la misma moneda del pago en exceso (vuelto USD de efectivo USD; vuelto Bs de efectivo Bs). No “vuelto cruzado” automático.  
7. **Cierre / reportes:** sumas por método y moneda; columna opcional “equivalencias FX” separada.

### Ejemplo
Total línea: $20 · Bs 7400 (precios de catálogo).  
Pago: $10 efectivo USD + pago móvil Bs 3700 (ref 123).  
Estado: parcial (faltan $10 USD y Bs 3700) — **no** asumir que Bs 3700 “valen” $10.

### Por qué es más segura
Auditable centavo a centavo; evita disputas por tasa BCV/paralela; alineado a regla Fase 4.

### Impacto Prisma/API
- `Payment.exchangeRateUsed` nullable.  
- Endpoint de equivalencia FX separado y autorizado.  
- Cierre: `byMethod` ya parcial en mock; mantener por moneda.

### Necesita aprobación comercial
**SÍ** — define si aceptan cobro cruzado con tasa o exigen cuadrar ambas monedas.

---

## J.3 — Cuenta con productos pendientes · PROPUESTA: pagar sí; cerrar solo si pendiente=0 o se convierte a prepago

### Problema
20 solicitadas · 13 servidas · 7 pendientes. ¿Puede pagar? ¿Cerrar? ¿Quién sirve las 7 mañana?

### Vocabulario propuesto (definitivo)

| Concepto | Significado |
|---|---|
| SOLICITADO | Cantidad pedida en la cuenta |
| SERVIDO | Ya entregado; **ya movió inventario** |
| PENDIENTE | SOLICITADO − SERVIDO (aún no sale de inventario) |
| PAGADO | Dinero recibido (por moneda, J.2) |
| CONSUMIDO | En prepago: qtyConsumed (equivalente a servido de saldo) |
| CERRADA | Cuenta sin pendientes operativos + recibo emitido |

### Alternativas
| | Descripción |
|---|---|
| A | Bloquear pago hasta servir todo |
| B | Permitir pago total; permitir cierre dejando 7 “colgados” en la cuenta |
| C | Permitir pago; al cerrar **obligar** convertir 7 → prepago/QR o anularlas |
| D | Las 7 pendientes se anulan al cerrar (malo) |

### Propuesta (C)
1. **Sí puede pagar** antes de terminar de servir (pago parcial o total).  
2. **No puede CERRAR** si `pendiente > 0`, excepto:  
   - **Convertir pendientes a prepago** (genera PRE-… + QR; aplica J.1 reserva sobre esas 7), o  
   - **Anular pendientes** (no servidas) con autorización (no hay devolución de stock; nunca salieron).  
3. Identificación: quedan en `AccountItem` o pasan a `PrepaidItem` con vínculo `sourceAccountId`.  
4. Consumo posterior: mesonera/cajero vía QR o cuenta prepago.  
5. Cliente abandona sin pagar: cuenta ABIERTA/PENDIENTE en cierre diario (J.7); inventario de pendientes intacto.  
6. Inventario: solo las 13 servidas están fuera; las 7 no.

### Ejemplo
Tras servir 13: stock −13. Cliente paga $20. Al cerrar, sistema exige: “7 pendientes → Prepago” → PRE-… con 7; cuenta CERRADA; recibo refleja servido + prepago generado.

### Por qué es más segura
No pierde las 7 ni finge que se sirvieron; el dinero y la mercancía quedan trazados.

### Impacto Prisma/API
- Regla en `POST /accounts/:id/close`.  
- `POST /accounts/:id/convert-pending-to-prepaid`.  
- Mock hoy permite cerrar con pendientes → cambiar en fase implementación (no ahora).

### Necesita aprobación comercial
**SÍ** — afecta UX en barra al final de la noche.

---

## J.4 — Anulación y devolución · PROPUESTA: matriz por caso (solo revertir lo movido)

### Problema
Anular en momentos distintos mueve (o no) inventario y caja de forma distinta. Hay que evitar doble devolución.

### Matriz propuesta

| Caso | Inventario | Caja | Auditoría |
|---|---|---|---|
| **1. Venta POS anulada antes de “servir”** (si el flujo fuera pedido sin descuento) | Sin movimiento (nunca salió) | Reverso del cobro si hubo | void sale |
| **1b. Venta POS `completeSale` anulada** (mock: ya descontó) | `DEVOLUCION` qty vendida | Reverso pagos / nota crédito | void + kardex |
| **2. Venta/cuenta anulada después de servir** | `DEVOLUCION` solo **qtyServed** | Reverso pagos según política (total o proporcional) | void account/sale |
| **3. Anulación parcial de cuenta** | Devolver solo líneas/cantidades servidas anuladas; pendientes cancelados sin kardex | Ajuste de pagos si aplica | motivo + auth |
| **4. Anulación completa de cuenta** | Devolver todo lo servido; pendientes se cancelan sin kardex | Reverso de pagos registrados | status ANULADA |
| **5. Prepago anulado (0 consumo)** | Liberar reserva (J.1); si mock A había descontado, `DEVOLUCION` total | Reverso cobro | void prepaid |
| **6. Prepago parcial consumido anulado** | No devolver lo consumido automáticamente; liberar reserva del **saldo**; devolución física de consumido solo con **devolución explícita** | Reembolso proporcional o total según autorización | dos acciones: void saldo vs return consumed |
| **7. Producto servido y luego devuelto** | `DEVOLUCION` explícita (no “anulación de venta” genérica) | Ajuste caja / nota | motivo, auth, foto/ref opcional |

**Principio:** nunca modificar `qtyBase` sin kardex; nunca devolver lo no salido; never double-restore (mock ya cuida voidAccount vs voidSale).

### Ejemplo
Cuenta 20/13/7 anulada → kardex +13; las 7 no generan entrada; pagos se revierten con movimiento de caja `SALIDA`/`AJUSTE` documentado.

### Impacto Prisma/API
- Policies en `/void` endpoints.  
- `CashMovement` tipo `REVERSO_VENTA`.  
- Flags `stockRestored` en void para idempotencia.

### Necesita aprobación comercial
**Parcial** — la matriz técnica puede adoptarse; **política de reembolso en efectivo** (siempre / solo supervisor) sí requiere aprobación.

---

## J.5 — Costos y utilidad · PROPUESTA: costo promedio ponderado (CPP)

### Problema
100 u. a $1 + 100 u. a $1.20 → ¿cuál es el costo de vender 10?

### Alternativas
| | Descripción |
|---|---|
| FIFO | Sale primero el lote más antiguo |
| CPP | Costo promedio tras cada compra recibida |
| Último costo | Siempre el de la última compra |
| Estándar fijo | Costo manual en ficha |

### Propuesta: **CPP por moneda (USD y Bs por separado)**
Al recibir compra:  
`nuevoPromedio = (qty*avg + entrantes*costo) / (qty+entrantes)` sobre existencia real del producto (todos los depósitos o por depósito — **propuesta inicial: promedio global del producto** para simplicidad).

Al servir/vender: COGS = `qtyBase × avgCost`.  
Utilidad línea ≈ `precioVenta − COGS` (misma moneda; no cruzar).

### Ejemplo
Stock 100 @ $1 → compra 100 @ $1.20 → avg $1.10. Vende 10 → COGS $11; si venta $15 → margen $4.

### Por qué al inicio
Menos complejo que FIFO (capas/lotes); más estable que “último costo”; suficiente para bodegón hasta que pidan trazabilidad sanitaria por lote.

### Impacto Prisma/API
- `Product.avgCostUsd/Bs` actualizado en `receive purchase`.  
- Opcional tabla `CostLayer` más adelante si migran a FIFO.  
- Reportes margen usan avg al momento del movimiento (guardar `unitCostSnapshot` en SaleItem/Account serve).

### Necesita aprobación comercial
**SÍ** (ligera) — contador/dueño debe aceptar CPP vs FIFO.

---

## J.6 — Cambio de precios · PROPUESTA: snapshot al agregar a la cuenta/carrito

### Problema
Catálogo pasa de $5 → $6 con cuenta abierta.

### Alternativas
| | Descripción |
|---|---|
| A | Toda la cuenta recalcula a $6 |
| B | Precio congelado al abrir cuenta |
| C | **Congelado al agregar cada ítem** |
| D | Congelado al servir |

### Propuesta (C)
`AccountItem` / `SaleItem` guardan `unitPriceUsd/Bs` al **agregar**.  
Nuevos ítems toman precio vigente.  
Ítems ya servidos no se repricing.  
Cambio de precio de catálogo = auditoría `upsert presentation`.

### Ejemplo
Línea A agregada a $5 (luego servida). Catálogo → $6. Línea B nueva a $6. Total mezcla correcto y explicable.

### Impacto Prisma/API
Ya alineado al mock (`unitPrice` en ítem). Persistir snapshots obligatorios; no FK viva al precio.

### Necesita aprobación comercial
**No crítico** — práctica estándar POS; se puede adoptar como default.

---

## J.7 — Cierre diario con cuentas abiertas · PROPUESTA: cerrar caja + snapshot de pasivos

### Problema
Al cierre hay mesas abiertas, pendientes, prepagos, pagos parciales.

### Diferenciar siempre

| Concepto | En el cierre |
|---|---|
| VENTA | Tickets/cuentas **cerradas** del día (completed) |
| COBRADO | Sumatoria de `Payment` del día (por moneda/método) |
| SERVIDO | Unidades con kardex CONSUMO del día |
| PENDIENTE | Mercancía solicitada no servida + saldos prepago |

### Propuesta
1. **Sí se puede cerrar caja** del turno/día.  
2. El cierre incluye sección **Pasivos operativos** (no son “ventas del día”):  
   - cuentas ABIERTAS/PENDIENTES (totales y paid)  
   - unidades pendientes de servir  
   - prepagos activos (comprometido)  
3. No forzar cierre de mesas automáticamente.  
4. Dinero del día = cobros registrados en el período de la sesión de caja.  
5. Mercancía comprometida = J.1 + pendientes de cuentas.

### Ejemplo
Cierre: vendido $500, cobrado $480, efectivo esperado $200 / contado $198.  
Pasivos: 3 cuentas abiertas ($45 saldo), 27 u. pendientes, 4 prepagos activos (80 u. reservadas).

### Impacto Prisma/API
- `CashClosing.openAccountsJson` / tabla hija.  
- Mock `createDailyClosure` ya cuenta abiertas; ampliar snapshot.

### Necesita aprobación comercial
**No crítico** — operativa recomendada; confirmar si el turno **bloquea** nuevas ventas hasta abrir caja del día siguiente (fuera de J.7 estricto).

---

## J.8 — Traslados entre depósitos · PROPUESTA: traslado con estados + doble kardex

### Problema
A → B no debe desaparecer ni duplicar mercancía.

### Alternativas
| | Descripción |
|---|---|
| A | Un solo movimiento mágico |
| B | Par inmediato SALIDA+ENTRADA (mock actual) |
| C | Documento de traslado con estados |

### Propuesta (C, simplificada)
Estados: `BORRADOR` → `ENVIADO` → `RECIBIDO` | `ANULADO`.

| Transición | Kardex |
|---|---|
| ENVIADO | `TRASLADO_SALIDA` en A; mercancía en tránsito (`qtyInTransit` o depósito virtual TRANSITO) |
| RECIBIDO | `TRASLADO_ENTRADA` en B por qty recibida |
| Diferencia | Si recibe 18 de 20: AJUSTE/PERDIDA 2 con auth |
| ANULADO antes de recibir | Reversa salida (entrada de vuelta a A) |
| ANULADO después | No; usar traslado inverso |

**Fase 1 de API** puede implementar B (atómico) si A y B están en el mismo local y el traslado es inmediato; el modelo C queda listo para cuando haya demora real.

**Propuesta operativa A&D local:** usar **B atómico** mientras sea mismo edificio; documentar C como extensión.  
**Marca comercial:** para “evita desaparecer”, B atómico en transacción DB ya es seguro si es sincronizado.

Ajuste fino de propuesta: **B atómico en v1** + entidad `StockTransfer` con status `RECIBIDO` inmediato; evolucionar a EN_TRÁNSITO cuando lo necesiten.

### Ejemplo
100 Regional A→B: en una transacción −100 A, +100 B, dos líneas kardex, `transferId` común.

### Impacto Prisma/API
- `StockTransfer`, `StockTransferItem`.  
- `POST /inventory/transfers` transaccional.

### Necesita aprobación comercial
**No** para v1 atómico; **sí** si quieren flujo con demora/chofer.

---

## J.9 — Permisos y operaciones sensibles · PROPUESTA: matriz

Leyenda: ● permitido · ◐ con autorización de SUPERVISOR/ADMIN · ○ no

| Operación | ADMIN | SUPERVISOR | CAJERO | MESONERA | INVENTARIO |
|---|---|---|---|---|---|
| Cambiar precios catálogo | ● | ● | ○ | ○ | ◐ (costo sí / precio venta ◐) |
| Aplicar descuento | ● | ● | ◐ | ○ | ○ |
| Anular venta POS | ● | ● | ◐ | ○ | ○ |
| Anular cuenta | ● | ● | ◐ | ○ | ○ |
| Reabrir cuenta | ● | ● | ○ | ○ | ○ |
| Modificar inventario (ajuste) | ● | ● | ○ | ○ | ● |
| Traslados | ● | ● | ○ | ○ | ● |
| Aprobar diff de caja | ● | ● | ○ | ○ | ○ |
| Cerrar caja | ● | ● | ● | ○ | ○ |
| Cerrar inventario / conteo | ● | ● | ○ | ○ | ● |
| Anular prepago | ● | ● | ◐ | ○ | ○ |
| Autorizar devolución servido | ● | ● | ○ | ○ | ◐ |
| Servir / consumir QR | ● | ● | ● | ● | ○ |
| Ver reportes globales | ● | ● | ◐ | ○ (propios) | ◐ (inv) |

Autorización = segundo factor: usuario supervisor (preferido) o PIN de supervisor registrado (alternativa).  
**Propuesta:** usuario supervisor en v1 (auditable); PIN opcional después.

### Necesita aprobación comercial
**SÍ** — quién en el local es SUPERVISOR y si el cajero puede auto-anular con tope ($) .

---

## J.10 — QR de prepago · PROPUESTA: token opaco + código humano

### Problema
QR debe operar saldo sin filtrar datos sensibles ni ser trivialmente falsificable.

### Contenido del QR
Solo: `https://{host}/licoreria/qr?t={qrToken}` **o** payload `ad:{qrToken}`.  
**No** incluir: teléfono, nombre, montos, productos, cantidades.

### Datos al consultar API
`GET /prepaids/by-token/:token` → código PRE-…, cliente (según permiso), ítems, purchased/consumed/available, estado, historial consumos (quién, cuándo).

### Seguridad propuesta
| Riesgo | Mitigación |
|---|---|
| Duplicación / foto del QR | Token de alta entropía; consumo auditado; opcional confirmar PIN/últimos 4 tel |
| QR perdido | Reemitir token (invalida anterior) · ADMIN/SUPERVISOR |
| Consumo simultáneo | Transacción + `version` / row lock; rechazo si saldo insuficiente |
| Anulación | J.4.5–6 |
| Vencimiento | `expiresAt` opcional; job marca VENCIDO y libera reserva |
| Recuperación | Buscar por PRE-… + teléfono cliente |

### Ejemplo
Compra 20 → PRE-2026-000001 + token `ad_qr_…`. Consume 8 (María, 22:15) → saldo 12. Misma consulta QR muestra 20/8/12.

### Impacto Prisma/API
- `qrToken` unique indexed; `tokenVersion`.  
- Rate limit por IP/usuario en endpoint público de consulta.  
- Mock ya usa token opaco + código PRE-.

### Necesita aprobación comercial
**Parcial** — ¿exigir verificación de teléfono al consumir? (recomendado en local concurrido: **sí, últimos 4 dígitos**).

---

## DECISIONES RECOMENDADAS (resumen ejecutivo)

| ID | Recomendación corta |
|---|---|
| **J.1** | Reserva/comprometido al crear prepago; descuento físico al consumir |
| **J.2** | Pagos como hechos por moneda; sin FX automática; FX solo explícita y auditada |
| **J.3** | Pagar con pendientes OK; cerrar solo si pendiente=0 o conversión a prepago/QR |
| **J.4** | Reversar solo lo movido (servido/cobrado); matriz por caso; idempotencia |
| **J.5** | Costo promedio ponderado (USD y Bs separados) + snapshot COGS al movimiento |
| **J.6** | Precio snapshot al agregar ítem a cuenta/carrito |
| **J.7** | Cierre de caja con snapshot de pasivos (abiertas/pendientes/prepagos) |
| **J.8** | v1 traslado atómico (salida+entrada); modelo listo para EN_TRÁNSITO después |
| **J.9** | Matriz roles; operaciones sensibles con SUPERVISOR/ADMIN |
| **J.10** | QR = token opaco; consulta API; reemitir/bloquear; lock en consumo |

---

## DECISIONES QUE NECESITAN APROBACIÓN

Prioridad para no bloquear Prisma de más:

1. **J.1** — Reserva vs descuento inmediato (cambia reportes de existencia vs mock).  
2. **J.2** — ¿Exigen cuadrar USD y Bs por separado o permiten cobro cruzado con tasa?  
3. **J.3** — ¿Obligar conversión a prepago al cerrar con pendientes?  
4. **J.5** — CPP vs FIFO (contador).  
5. **J.9** — Topes de anulación/descuento del cajero y quién es supervisor.  
6. **J.4 (reembolso)** — Política de devolución de dinero en efectivo.  
7. **J.10** — ¿Verificación últimos 4 del teléfono al consumir QR?

**Pueden adoptarse por defecto técnico (avisar, no bloquear):** J.6, J.7, J.8-v1, J.4-matriz kardex, J.10-token opaco.

---

## SIGUIENTE FASE (solo después de aprobar)

Orden propuesto — **no ejecutar ahora**:

1. Actualizar Fase 4 README marcando J.* como **APROBADAS** con el texto final.  
2. Diseño definitivo de entidades (incl. `qtyReserved`, `StockTransfer`, snapshots de costo).  
3. Diagrama de relaciones / estados alineado a aprobaciones.  
4. Prisma schema (nuevo, en `apps/api` cuando toque).  
5. Migraciones.  
6. API `/api/v1/ad/...`.  
7. Adapter repository HTTP en frontend.  
8. Integración UI + pruebas de aceptación contra API.

---

## Relación con J.* de la Fase 4 (nota)

La Fase 4 listó un J.1–J.10 más corto (depósito de consumo, multi-caja, WA cierre, etc.).  
Esta Fase 5 **reformula y profundiza** el set de decisiones críticas pedidas por negocio.  
Ítems Fase 4 no cubiertos aquí quedan como backlog post-aprobación:

- Depósito de consumo por defecto = Depósito 2 (barra), configurable por turno.  
- Multi-caja / multi-sucursal.  
- Destinatarios WhatsApp de CIERRE_DIARIO.  
- Enums de estado de cuenta (`EN_SERVICIO`, etc.).

---

*Documento Fase 5 — propuestas para revisión humana. Sin cambios de código de negocio ni Prisma/API.*
