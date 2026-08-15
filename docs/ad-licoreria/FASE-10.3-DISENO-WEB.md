# A&D Fase 10.3 — Diseño Web (CMS visual del portal)

**Rama:** `cursor/ad-licoreria-portal-335d`  
**Alcance:** MOCK frontend. Sin `apps/api`, sin Prisma, sin WebSocket.

## Objetivo

El administrador controla desde `/licoreria/configuracion/diseno` la apariencia y el contenido visual del portal público `/licoreria`, sin modificar código.

## Arquitectura

```
UI (configuracion/AdLicoreriaConfigDiseno)
  → AdLicoreriaProvider (save/publish/discard/reset)
    → adLicoreriaRepository (permisos)
      → adDesignRepository (draft + published · localStorage)
        → AdPublicHomeView (Home / Preview)
```

| Capa | Ubicación |
|---|---|
| Types | `src/types/ad-licoreria-design.ts` |
| Defaults | `src/services/ad-licoreria/design/defaults.ts` |
| Repository | `src/services/ad-licoreria/design/repository.ts` |
| Apply DOM | `src/services/ad-licoreria/design/apply.ts` |
| Bridge compat | `src/lib/ad-licoreria/site-design.ts` |
| Admin UI | `src/pages/ad-licoreria/configuracion/` |
| Home view | `src/components/ad-licoreria/AdPublicHomeView.tsx` |

Persistencia MOCK: `localStorage` clave `ad-licoreria-site-design-v2`  
Preview: `sessionStorage` clave `ad-licoreria-site-design-preview`  
Migración automática desde v1.

## Flujo borrador / publicado

1. Editar en el panel → estado local.
2. **GUARDAR CAMBIOS** → persiste borrador (Home no cambia).
3. **PUBLICAR CAMBIOS** → copia borrador → publicado; Home consume publicado.
4. **DESCARTAR CAMBIOS** → recarga último borrador guardado.
5. **PREVISUALIZAR HOME / VISTA PREVIA** → `/configuracion/diseno/preview` con borrador actual (incluso sin guardar).
6. **RESTAURAR DISEÑO PREDETERMINADO** → confirmación; solo visual.

## Capítulos del editor

- Identidad de marca (+ flags mostrar/ocultar)
- Tema visual (colores + preview)
- Tipografía (presets seguros; CDN externo = extensión futura)
- Hero (fondo/video, overlay, CTAs, alineación IZQ/CENTRO/DER)
- Secciones (↑ ↓ 👁)
- Productos destacados (consume catálogo demo, no lo duplica)
- Banners (CRUD, duplicar, fechas, imagen móvil)
- Galería
- Popup promocional (opcional)
- Footer
- SEO básico

## Seguridad

Solo `admin` o permiso `settings.manage`.  
Route gate + UI: **Acceso no autorizado**.

## Home público

`/licoreria` renderiza `AdPublicHomeView` con el diseño **publicado**.  
Sin hardcode de marca/colores/CTAs/banners: todo desde configuración (o defaults).

## Pruebas

`npx tsx scripts/ad-licoreria-design-acceptance.mts` → A–M **13/13**.

Regresión: Fase 3 · COP · 8 · 9 · 9.1 · 10.1 · TV.

## Limitaciones MOCK

- Sin API / CDN tipográfico externo
- Imágenes como URL o data URL (límite ~2.5 MB)
- Sin versionado histórico (solo draft + published)
- Popup: una vez por sesión vía `sessionStorage`

## Siguiente paso (fuera de mock)

Definición definitiva Prisma + API. **No agregar más módulos funcionales al MOCK.**

## Intactos

`apps/api` · Prisma · `main` · sin merge · POS/COP/inventario sin cambios de reglas · Donaive/POLISUR sin cambios de producto.
