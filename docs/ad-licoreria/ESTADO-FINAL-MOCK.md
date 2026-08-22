# A&D Licorería & Bodegón — Estado final MOCK

**Rama:** `cursor/ad-licoreria-portal-335d`  
**PR:** #16  
**Alcance:** frontend MOCK únicamente. Sin merge a `main`. Sin `apps/api` / Prisma / endpoints.

Este documento cierra la fase funcional MOCK. El siguiente trabajo es **exclusivamente** backend API/Prisma y conexión de servicios reales.

---

## 1. Módulos existentes

| Módulo | Ruta(s) | Estado |
|---|---|---|
| Home público | `/licoreria` | Diseño publicado |
| Inicio / dashboard | `/licoreria/inicio` | OK |
| POS / Ventas | `/licoreria/ventas` | OK |
| Cuentas | `/licoreria/cuentas` | OK |
| Mesonera · Mis mesas | `/licoreria/mesonera` | OK · cobro embebido |
| Mesas / espacios | `/licoreria/mesas` | OK |
| Prepagos | `/licoreria/prepagos` | OK |
| QR | `/licoreria/qr` | OK · identidad tel+cédula |
| Inventario | `/licoreria/inventario` | Operativo (capas) |
| Productos | `/licoreria/productos` | OK |
| Presentaciones | `/licoreria/presentaciones` | OK |
| Depósitos | `/licoreria/depositos` | Configurables |
| COP | `/licoreria/cop` | Centro operativo |
| Transferencias COP | `/licoreria/cop/transferencias` | TR-YYYY-###### |
| Reportes COP | `/licoreria/cop/reportes` | OK |
| Cierres | `/licoreria/cierres` | Caja + inventario · HOY |
| Clientes | `/licoreria/clientes` | Historial / pendientes |
| Reportes | `/licoreria/reportes` | Presets + filtros |
| Configuración | `/licoreria/configuracion` | Depósitos, tasa, pagos |
| Usuarios | `/licoreria/configuracion/usuarios` | Roles + depósito |
| Permisos | `/licoreria/configuracion/permisos` | Matriz |
| Diseño web | `/licoreria/configuracion/diseno` | Draft → Publish |
| Preview diseño | `/licoreria/configuracion/diseno/preview` | Borrador |
| TV hub | `/licoreria/tv` | Digital Signage |
| TV pantallas | `/licoreria/tv/pantallas` | Pairing A&D-#### |
| TV contenido | `/licoreria/tv/contenido` | MOCK URLs |
| TV grupos | `/licoreria/tv/grupos` | OK |
| TV control | `/licoreria/tv/control` | PLAY/PAUSE/STOP/vol |
| TV reproductor | `/licoreria/tv/reproductor/:id` | Fullscreen (alias `/tv/pantalla/:id`) |

---

## 2. Roles y permisos

**Roles:** ADMIN · SUPERVISOR · CAJERO · MESONERA · INVENTARIO · TV

**Permisos sensibles (centralizados en `access.ts` + repository):**

- `pos.sell`, `pos.discount`, `pos.refund`, `pos.close_account`
- `pos.shortage_override` — solo ADMIN/SUPERVISOR por defecto; flag UI no basta
- Inventario / compras / COP / reportes / users / settings
- `tv.view`, `tv.manage`, `tv.control`, `tv.content.manage`, `tv.groups.manage`, `tv.screen.manage`

**Depósitos:** cajero/mesonera ligados a un depósito; no venden desde otro. ADMIN/INVENTARIO transversales según permisos.

**TV:** sin POS, inventario, COP ni admin (salvo permisos explícitos).

---

## 3. Reglas principales (aprobadas)

1. POS: producto → presentación → qty → cliente → operador → depósito → cobro → preliminar → confirmar → recibo.
2. Pagos: USD / Bs / mixtos + referencias.
3. Faltante operativo: override solo con `pos.shortage_override` + motivo obligatorio + auditoría.
4. Pendientes de cliente **no** bloquean venta automática si hay físico.
5. Inventario UI: físico / comprometido / disponible / pendiente / déficit / otro depósito.
6. Transferencias: origen ≠ destino · documento TR · BORRADOR → PRELIMINAR → CONFIRMAR → RECIBIDA.
7. Compras: depósito destino obligatorio.
8. QR: token opaco + verificación teléfono **y** cédula.
9. Cierre caja: período HOY alineado UI/repo.
10. Diseño web: Home consume solo **publicado**; borrador no afecta público hasta PUBLICAR.
11. TV: pairing sin password en pantalla · comandos MOCK vía `TvRealtimeTransport`.

---

## 4. Pruebas realizadas (cierre)

| Suite | Resultado |
|---|---|
| Fase 3 | 14/14 PASS |
| COP | 25/25 PASS |
| Fase 8 | 6/6 PASS |
| Fase 9 | 22/22 PASS |
| Fase 9.1 | 9/9 PASS |
| Fase 10.1 | 8/8 PASS |
| TV 10.2 | 17/17 PASS |
| Diseño 10.3 | 13/13 PASS |
| `npm run build` | OK |

---

## 5. Qué es MOCK hoy

| Área | Implementación MOCK |
|---|---|
| Persistencia operativa | Memoria + reset repository |
| Diseño web | `localStorage` draft/published |
| Auth / sesión | Operador seleccionado en UI |
| WhatsApp | Log mock (`adWhatsAppService`) |
| QR | Token opaco local + verify identity |
| TV sync | `TvRealtimeTransport` in-memory |
| Media TV / banners | URLs / data URL |
| Recibos / TR / AD- | Numeración local |

---

## 6. Qué se reemplaza por API / Prisma

- Usuarios, roles, permisos, depósitos y asignaciones
- Productos, presentaciones, inventario, movimientos, kardex
- Ventas, cuentas, pagos, recibos, anulaciones, descuentos
- Prepagos / QR (token server-side + anti-doble consumo)
- Transferencias COP y compras
- Cierres de caja e inventario
- Clientes e historial
- Reportes (consultas reales)
- Diseño web publicado (entidad Design + media storage)
- Auditoría persistente

---

## 7. Qué se reemplaza por WebSocket (TV)

`TvRealtimeTransport` MOCK → cliente WebSocket autenticado por `pairingToken`:

- `PLAY` / `PAUSE` / `STOP` / `SET_VOLUME` / `MUTE` / `LOAD_CONTENT` / `SYNC`
- Heartbeat → ONLINE/OFFLINE
- Broadcast a grupo / todas las pantallas

Contrato de comando ya preparado (`AdTvCommand` con `screenIds`, `contentId`, `position`, `issuedAt`).

---

## 8. Pendientes reales para producción

1. **Autenticación real** (login, JWT/sesión, refresh).
2. **API + Prisma + PostgreSQL** (sustituir repositories MOCK).
3. **WhatsApp** proveedor real (hoy solo log).
4. **QR real** (firmado, TTL, validación concurrente backend).
5. **WebSocket TV** + dominio/subdominio de pantallas (opcional).
6. **Almacenamiento cloud** de logos, banners y media TV.
7. Soft-reserve / recepción TR multi-paso más estricta (hoy estados UX).
8. Export persistente de reportes.
9. Escáner nativo QR en dispositivo.
10. Versionado de diseño web (hoy solo draft + published).

---

## 9. Arquitectura A&D (intocable en este cierre)

```
UI → Provider → Repository MOCK → (futuro) API
TV: UI → AdTvProvider → tv/repository → TvRealtimeTransport MOCK → (futuro) WS
Diseño: UI → design/repository (localStorage) → Home published
```

No se modifican Donaive, POLISUR, `apps/api`, Prisma ni `main`.

---

## 10. Confirmación de cierre MOCK

- No se agregarán más módulos funcionales al MOCK.
- Siguiente fase: definición y conexión **API / Prisma** + servicios reales (auth, WhatsApp, QR, WebSocket TV).
