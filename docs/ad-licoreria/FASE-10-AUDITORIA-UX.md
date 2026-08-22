# A&D Licorería & Bodegón — FASE 10

## Auditoría UX / UI y funcional (MOCK)

**Fecha:** 2026-08-15  
**Rama:** `cursor/ad-licoreria-portal-335d`  
**Alcance:** solo análisis del portal mock `/licoreria`.  
**Fuera de alcance (intactos):** `apps/api`, Prisma, PostgreSQL, API real, `main`, merge, Donaive, POLISUR, reglas de negocio aprobadas, modelo de inventario, permisos existentes (salvo inconsistencias reportadas), flujos POS/mesonera/COP/cierres/QR/clientes/reportes (sin cambios de reglas).

**Veredicto operativo:** el dominio mock está **bien modelado** (disponibilidad operativa, roles, documentos preliminares, auditoría). **No está listo para operación real rápida** sin rediseños de POS, mesonera, inventario operativo y cierre del circuito cobro/cuenta/recibo. Las mejoras funcionales listadas **requieren autorización** antes de implementarse.

---

## A. Auditoría UX completa (por perfil)

### 1. Cajero / POS (`/licoreria/ventas`)

| Capacidad | Estado | Nota |
|---|---|---|
| Usuario actual | Existe | Sesión en topbar; cajero con depósito fijo |
| Depósito asignado | Existe | Bloqueo por `warehouseId` |
| Cliente | Existe | Select; no siempre obligatorio |
| Mesa / espacio | Existe | Select |
| Mesonera | Existe | Floor users del depósito |
| Búsqueda productos | Existe | Texto; sin atajos ni favoritos |
| Presentaciones | Existe | |
| Cantidades | Existe | Sin pad ± rápidos tipo mesonera |
| Precios USD / Bs | Existe | Editables por línea |
| Métodos de pago | Existe | |
| Referencias / banco | Existe | Según config del método |
| Pagos mixtos | Existe | Saldo residual se calcula en USD (frágil con Bs) |
| Cuenta abierta | Existe | Acción «dejar abierta» |
| Servido / pendiente | Parcial | No se gestiona servir en POS |
| Prepago | Existe | Crea prepago; QR no se muestra en el momento |
| QR | Parcial | Flujo en `/qr`, no en POS |
| Preliminar → confirmar | Existe | Incluye faltante + `pos.shortage_override` |
| Impresión / recibo | Débil | Solo `logDocumentAction`; sin ticket visual imprimible |

**UX:** pantalla densa (~1050 líneas), muchos campos a la vez, lento para barra. Riesgo de confundir Facturar / Abrir cuenta / Prepago. Sin teclado/escáner. **Rediseño recomendado: sí (prioridad crítica).**

### 2. Mesonera (`/mesonera`, `/mesas`)

**Existe:** selector mesonera, listado de cuentas propias, abrir espacio, agregar productos, pad servir (+1…+6), prepago/QR con teléfono, totales, shell propio.

**Problemas:**
- **Cobrar** navega a `/ventas` **sin precargar la cuenta** → circuito roto.
- No hay **cierre/solicitar cierre** en sitio.
- «Mis mesas» = cuentas abiertas, no mapa ocupada/libre de todos los espacios.
- Sin observaciones al agregar/servir.
- Reasignación solo en `/mesas` (admin), no en flujo mesonera.
- Selects de producto poco touch-friendly.

**Experiencia objetivo deseada:** MIS MESAS → mesa → cuenta → agregar → servir → cobrar/cerrar.  
**Actual:** se acerca en agregar/servir; **falla en cobro/cierre**. **Rediseño: sí (crítica).**

### 3. COP (`/cop`, `/cop/transferencias`, `/cop/reportes`)

**Existe:** evaluación por producto/depósito con físico, comprometido, disponible, pendiente clientes, déficit, plan transferir/comprar, críticos, CTAs a transferencia y compra.

**Brechas:**
- Soft-reserve de transferencias no se refleja bien en el ciclo feliz (confirmación colapsa estados).
- Riesgo de unidades: sugerencia en **u. base** se pasa como `qty` de presentación (hoy demo 1:1; falla si la 1ª presentación es balde/caja).
- Reportes COP sin presets/filtros del nivel admin.
- Nav lateral muestra COP a quien no debería (solo la página bloquea `cop.read`).

### 4. Transferencias

**Existe:** multi-línea, origen/destino, responsable, borrador preliminar, confirmar → `TR-YYYY-######`, historial, auditoría.

**Brechas:** Imprimir/Descargar solo auditan (sin documento real); un click confirma y mueve stock (sin recepción explícita ENVIADA→RECIBIDA); Depósitos tiene traslado instantáneo paralelo (dos modelos).

### 5. Compras

**Existe:** COP → «Crear compra» → solicitud mock con producto, qty, depósito, motivo, estado.

**Brechas:** UI oculta por permiso pero **repository no enforce** `cop.purchase_request`; proveedor/costo poco visibles en el flujo de alerta; sin pantalla de ciclo de vida rica.

### 6. Inventario (`/inventario`)

**Estado actual:** solo **físico** (`qtyBase`) + kardex.  
**Falta mostrar:** comprometido activo, disponible operativo, pendiente clientes, déficit, en transferencia, en compra.  
El motor `getOperationalAvailability` **sí existe** — la UI de Inventario no lo usa. **Rediseño: sí (alta).**

### 7. Clientes

**Existe:** nombre, teléfono, identificación, historial ventas/cuentas/pendientes/prepagos.

**Brechas:** cédula no forzada; sin puente claro a QR del prepago; consulta posterior OK a nivel mock.

### 8. QR / Prepagos

**Existe:** token opaco, datos de titular, líneas/saldo, consumo con verificación de teléfono, auditoría de consumo, mensaje de que el QR solo no basta.

**Brechas:** UI de cédula ausente (`verifyDocumentId: undefined`); mesonera hardcodeada `"Ana"` en `/qr`; sin escáner nativo (correcto para esta fase); prepago no se visualiza al facturar.

### 9. Reportes

**Admin:** presets HOY/AYER/SEMANA/MES/AÑO/rango + filtros depósito/usuario/mesonera/cajero/cliente/producto/categoría/método/estado; definición guardada mock en sesión.

**Faltan / débiles:** export; persistencia real de reportes guardados; informe unificado de descuentos/anulaciones más destacado; COP reportes pobres; «stock crítico» a veces físico ≠ operativo.

### 10. Cierres

**Existe:** cierre de caja vs cierre de inventario; esperado/contado/diferencia; responsable; depósito; auditoría al guardar.

**Brecha crítica:** UI de esperado de caja suma ventas **sin filtrar «hoy»**; repository sí filtra hoy → **diferencia en pantalla puede mentir**. Inventario: Δ no se ve en vivo antes de confirmar.

### 11. Permisos

Roles y `pos.shortage_override` coherentes en capa central.  
**Inconsistencias:** nav sin filtrar por permiso; config usuarios/compras con hide UI ≠ gate repo en algunos casos; matriz visual de permisos incompleta vs catálogo.

### 12. Responsive

| Perfil | Objetivo | Estado |
|---|---|---|
| Mesonera | Teléfono/tablet | Parcial (shell + pad; cobro rompe móvil) |
| Cajero | PC/tablet | Débil (tabla densa, sin layout tablet) |
| COP / Admin | PC/laptop | Aceptable en desktop; sidebar apilada &lt;960px |

### 13. Documentos

Patrón preliminar→confirmar existe en factura y transferencia.  
Impresión/PDF reales ausentes. Depósitos permite movimiento irreversible sin documento TR.

---

## B. Problemas encontrados (prioridad)

| ID | Hallazgo | Problema | Impacto | Prioridad |
|---|---|---|---|---|
| H1 | Cobro mesonera → POS sin cuenta | Link a ventas sin contexto | No se cobra la cuenta del piso | **Crítica** |
| H2 | Cierre de caja: esperado UI ≠ repo | UI no filtra «hoy» | Diferencia falsa en pantalla | **Crítica** |
| H3 | Inventario solo físico | No muestra capas operativas | Decisiones de stock engañosas | **Alta** |
| H4 | Nav sin permisos | Todos ven todas las rutas | Acceso confuso / riesgo mock | **Alta** |
| H5 | Compra: sin gate en repository | Solo hide UI | Flag/API futura insegura | **Alta** |
| H6 | COP qty base vs presentación | Sugerencia u.base → qty presentación | Sobre-transferir/comprar si units≠1 | **Alta** |
| H7 | Soft-reserve / ciclo TR colapsado | Confirmación salta estados | Disponible no baja en tránsito | **Alta** |
| H8 | Recibo/impresión simulados | Solo log | Sin documento de piso | **Alta** |
| H9 | QR sin cédula en UI + mesonera fija | Identidad incompleta | Validación parcial | **Alta** |
| H10 | Saldo POS multi-moneda | Residual en USD ignora Bs | Cobro incompleto | **Alta** |
| H11 | Sin cierre en mesonera | Hay que ir a Cuentas admin | Flujo piso lento | **Alta** |
| H12 | Dos modelos de transferencia | Depósitos instantáneo vs COP TR | Auditoría inconsistente | **Media** |
| H13 | Mapa mesas ocupada/libre | Solo cuentas abiertas | Visión de piso incompleta | **Media** |
| H14 | Observaciones mesonera | Ausentes | Pérdida de contexto | **Media** |
| H15 | Reportes COP débiles | Sin presets/filtros | Doble estándar admin/COP | **Media** |
| H16 | Δ inventario no en vivo | Solo tras guardar | Error de conteo | **Media** |
| H17 | Matriz permisos incompleta en UI | No 1:1 con catálogo | ADMIN edita a ciegas | **Media** |
| H18 | Auth descuento texto libre | No es supervisor real | Bypass social | **Media** |
| H19 | Prepagos pantalla pasiva | Solo listado | Huérfana | **Baja** |
| H20 | Nomenclatura TR borrador | `TR-BORR-…` vs definitivo | Confusión menor | **Baja** |

---

## C. Mejoras recomendadas (requieren autorización)

1. **Flujo mesonera end-to-end:** mesa → cuenta → agregar → servir → cobrar/cerrar (con POS precargado o cobro embebido).  
2. **Rediseño POS velocidad:** favoritos, atajos, pad qty, menos selects, ticket imprimible, QR al confirmar prepago.  
3. **Inventario operativo** reutilizando `getOperationalAvailability`.  
4. **Nav + route guards** por `can(user, permission)`.  
5. **Alinear cierre de caja** UI/repo (mismo filtro fecha/depósito/cajero).  
6. **Ciclo TR** con recepción y soft-reserve visible; unificar o etiquetar traslado de Depósitos.  
7. **Enforcement repository** en compras (y revisar config usuarios).  
8. **COP:** convertir u.base → qty presentación explícita.  
9. **QR:** input cédula + operador de sesión.  
10. **Shells por rol** (mesonera phone, cajero tablet, COP desktop).

> Ninguna de estas se implementa en Fase 10 sin aprobación explícita (pueden tocar UX operativa o enforcement).

---

## D. Pantallas que necesitan rediseño

| Pantalla | Prioridad | Motivo |
|---|---|---|
| `/ventas` (POS) | Crítica | Velocidad y prevención de errores |
| `/mesonera` | Crítica | Acciones de piso + cobro/cierre |
| `/inventario` | Alta | Capas operativas |
| `/cop` | Alta | Claridad + unidades + CTAs |
| `/cop/transferencias` | Alta | Documento + ciclo de estados |
| `/cierres` | Alta | Esperado fiel + Δ en vivo |
| `/qr` (+ consumo mesonera) | Alta | Identidad completa |
| Shell / sidebar | Alta | Nav por rol + responsive |
| `/cuentas` | Media | Herramienta de cierre vs tabla admin |
| `/clientes` | Media | Identidad + puente QR |
| `/cop/reportes` | Media | Paridad con reportes admin |
| `/mesas` | Media | Mapa ocupada/libre |
| `/prepagos` | Baja | Definir rol o fusionar |

---

## E. Funcionalidades que faltan (o están incompletas)

- Cobro de cuenta desde mesonera con contexto  
- Cierre / solicitar cierre en mesonera  
- Ticket/recibo e impresión real (mock visual)  
- QR visible al emitir prepago  
- Validación cédula en UI QR  
- Inventario: columnas operativas  
- Soft-reserve efectivo + recepción TR  
- Export de reportes / reportes guardados persistentes  
- Route guards + nav filtrada  
- Gate repository compras  
- Observaciones de mesa/cuenta  
- Layout tablet cajero  
- Escáner nativo (explícitamente **no** en esta fase)

---

## F. Matriz

| FUNCIONALIDAD | EXISTE | FUNCIONA | UX OK | FALTA |
|---|---|---|---|---|
| POS venta rápida | Parcial | Sí (mock) | No | Atajos, ticket, layout |
| Usuario + depósito POS | Sí | Sí | Sí | — |
| Cliente / mesa / mesonera POS | Sí | Sí | Parcial | Reglas de obligatoriedad |
| Pagos mixtos + refs | Sí | Parcial | Parcial | Saldo multi-moneda |
| Preliminar factura | Sí | Sí | Sí | Vista documento |
| Override faltante + permiso | Sí | Sí | Sí | — |
| Cuenta abierta / servir | Sí | Sí | Parcial | Servir solo fuera de POS |
| Prepago desde venta | Sí | Sí | No | Mostrar QR |
| Mesonera agregar/servir | Sí | Sí | Parcial | Touch + observaciones |
| Mesonera cobrar/cerrar | Parcial | No E2E | No | Contexto cuenta + cierre |
| Mapa mesas libre/ocupada | Parcial | Parcial | No | Vista piso |
| COP métricas operativas | Sí | Sí | Parcial | Soft-reserve, críticos |
| COP → transferencia | Sí | Parcial | Parcial | Unidades presentación |
| COP → compra | Sí | Parcial | Parcial | Gate repo, proveedor/costo |
| TR preliminar → confirmar | Sí | Sí | Parcial | Print, recepción |
| Inventario físico | Sí | Sí | Sí | — |
| Inventario operativo | Motor sí / UI no | — | No | Columnas operativas |
| Clientes + historial | Sí | Sí | Parcial | Cédula, puente QR |
| QR identidad + consumo | Parcial | Parcial | Parcial | Cédula UI, operador |
| Reportes admin filtros | Sí | Sí | Sí | Export, persistencia |
| Reportes COP | Parcial | Sí | No | Presets/filtros |
| Cierre caja | Sí | Parcial | No | Alinear esperado hoy |
| Cierre inventario | Sí | Sí | Parcial | Δ en vivo |
| Permisos / roles | Sí | Parcial | Parcial | Nav + gates faltantes |
| `pos.shortage_override` | Sí | Sí | Sí | — |
| Responsive mesonera | Parcial | Parcial | Parcial | Cobro móvil |
| Responsive cajero/COP | Parcial | Sí | No | Layouts por rol |
| Documentos imprimibles | Parcial | Log only | No | PDF/print real |

---

## G. Validación responsive

| Viewport | Mesonera | Cajero | COP/Admin |
|---|---|---|---|
| Teléfono | Usable agregar/servir; cobro falla al saltar a POS denso | Pobre (tablas, muchos campos) | Nav apilada, scroll largo |
| Tablet | Mejor; selects aún incómodos | Aceptable con scroll; sin layout dedicado | Aceptable |
| Laptop/PC | OK | OK funcional, no «rápido barra» | Mejor perfil |

**Breakpoint actual:** ~960px (shell) / ~900px (COP). Falta shell por rol.

---

## H. Build

Ejecutar: `npm run build` (resultado en entrega del agente / CI de la rama).

---

## I. Tests existentes

| Suite | Propósito |
|---|---|
| `scripts/ad-licoreria-fase9-acceptance.mts` | Validación integral A–T |
| `scripts/ad-licoreria-fase91-acceptance.mts` | Override + filtros U1–U9 |
| `scripts/ad-licoreria-fase8-acceptance.mts` | Roles / depósitos |
| `scripts/ad-licoreria-cop-acceptance.mts` | Escenario COP |
| `scripts/ad-licoreria-acceptance.mts` | Acceptance base |

Fase 10 **no añade** suite de reglas nuevas: es auditoría. Las suites anteriores deben seguir en PASS.

---

## Decisiones pendientes (NO modificar sin autorización)

1. ¿Cobro embebido en mesonera o POS con `?accountId=`?  
2. ¿Inventario pasa a vista operativa (solo UI) o se mantiene kardex físico aparte?  
3. ¿Unificar traslado Depósitos → solo documentos COP?  
4. ¿Ciclo TR multi-paso obligatorio en piso?  
5. ¿Cédula obligatoria en clientes/QR?

---

## Confirmaciones

- `apps/api` intacta  
- Prisma / PostgreSQL intactos  
- Sin endpoints nuevos  
- Sin merge / sin `main`  
- Sin cambios de reglas de negocio en esta fase  
- Entregable: este informe + evidencia build/tests
