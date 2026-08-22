# A&D Fase 10.2 — Módulo TV / Digital Signage

**Rama:** `cursor/ad-licoreria-portal-335d`  
**Alcance:** MOCK frontend únicamente. Sin `apps/api`, sin Prisma, sin WebSocket real.

## Arquitectura

```
UI (pages/ad-licoreria/tv)
  → AdTvProvider
    → adTvRepository (MOCK)
      → TvRealtimeTransport (MOCK in-memory)
```

Separación estricta respecto al POS/COP:

| Capa | Ubicación |
|---|---|
| Types | `src/types/ad-tv.ts` |
| Demo data | `src/content/ad-licoreria/tv/demo-data.ts` |
| Repository | `src/services/ad-licoreria/tv/repository.ts` |
| Realtime | `src/services/ad-licoreria/tv/realtime.ts` |
| Provider | `src/providers/ad-licoreria/AdTvProvider.tsx` |
| Páginas | `src/pages/ad-licoreria/tv/*` |

## Rutas

| Ruta | Uso |
|---|---|
| `/licoreria/tv` | Hub Digital Signage |
| `/licoreria/tv/pantallas` | Registro / vinculación / tarjetas |
| `/licoreria/tv/contenido` | Catálogo IMAGE/VIDEO/TEXT/MENU/PROMOTION |
| `/licoreria/tv/grupos` | Grupos TODOS / LICORERÍA / BARRA / … |
| `/licoreria/tv/control` | Centro de mando (PLAY/PAUSE/STOP/volumen) |
| `/licoreria/tv/pantalla/:id` | Reproductor fullscreen (navegador TV) |

## Permisos

Catálogo añadido a la matriz existente:

- `tv.view`
- `tv.manage`
- `tv.control`
- `tv.content.manage`
- `tv.groups.manage`
- `tv.screen.manage`

Rol **TV** por defecto: `tv.view` + `tv.control` (sin POS, inventario, COP, compras, cierres ni admin).

Usuarios demo:

| Usuario | Rol | Permisos |
|---|---|---|
| `tvbarra` · TV Barra | TV | view + control · pantalla `tvs-001` |
| `tvadmin` · Administrador TV | TV | todos los `tv.*` |

El shell filtra navegación; rutas no autorizadas muestran **Acceso no autorizado**.

## Modelo MOCK

- `AdTvScreen` — ONLINE / OFFLINE / PAIRING, pairingCode `A&D-####`, volumen, mute, playbackState
- `AdTvContent` — tipo + URL/ruta + duración (sin cloud storage)
- `AdTvGroup` — miembros `screenIds`
- `AdTvCommand` — `{ command, screenIds, contentId, position, issuedAt, issuedBy }`
- `AdTvAuditEvent` — TV_PAIRED, PLAY, PAUSE, STOP, VOLUME_CHANGED, …

## Flujo de vinculación

1. Crear pantalla (admin).
2. Crear usuario TV (opcional, asociado a pantalla/grupo).
3. Abrir `/licoreria/tv/pantalla/TV-001` en el TV.
4. TV muestra código temporal `A&D-####` (sin password admin).
5. Admin: Pantallas → Vincular pantalla → introduce código.
6. TV queda ONLINE · “✓ Pantalla vinculada”.
7. Control → seleccionar destino + contenido → ▶ REPRODUCIR.
8. Broadcast MOCK a todas las pantallas del destino.

## Comandos (`TvRealtimeTransport`)

`connect` · `disconnect` · `sendCommand` · `broadcastCommand` · `subscribe` · `unsubscribe`

Tipos: `PLAY` | `PAUSE` | `STOP` | `SEEK` | `SET_VOLUME` | `MUTE` | `LOAD_CONTENT` | `SYNC` | `RESTART`

PLAY incluye `screenIds`, `contentId`, `position`, `issuedAt` para futura sincronización multi-dispositivo.

## Pruebas

`npx tsx scripts/ad-licoreria-tv-acceptance.mts` — casos A–Q (17).

Regresión esperada: Fase 3 · COP · Fase 8 · 9 · 9.1 · 10.1.

## Limitaciones MOCK

- Sin WebSocket real ni dominio dedicado.
- Sin almacenamiento cloud de media (solo URL/ruta).
- Heartbeat / lastSeen simulados en memoria.
- Emparejamiento sin TTL de código (demo).

## WebSocket futuro

El backend reemplazará `createMockTvRealtimeTransport()` por un cliente WS que:

1. Autentique la pantalla con `pairingToken`.
2. Emita el mismo envelope `{ type: "command", command: AdTvCommand }`.
3. Mantenga heartbeat → status ONLINE/OFFLINE.
4. Conserve contratos `AdTvCommand` / `AdTvScreen` sin rehacer la UI.

Documentado en código: **«MOCK — preparado para WebSocket backend.»**

## Intactos

`apps/api` · Prisma · `main` · sin merge · sin endpoints reales · POS/COP/inventario sin cambios de reglas.
