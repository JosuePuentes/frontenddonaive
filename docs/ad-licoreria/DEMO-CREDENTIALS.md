# Credenciales demo A&D (seed)

Fuente: `apps/api/prisma/seed-ad-licoreria.ts`

**Contraseña común (todos los operadores seed):** `AdDemo#2026`  
Variable opcional: `AD_SEED_PASSWORD` (default = esa).

**Tenant slug:** `ad-licoreria`

## ADMIN demo (prueba en navegador)

| Campo | Valor |
|-------|--------|
| Usuario / login | `admin` |
| Contraseña | `AdDemo#2026` |
| Rol | `admin` |
| Permisos | todos (`AD_DEFAULT_ROLE_PERMISSIONS.admin` / admin bypass) |
| Depósito asignado | ninguno (transversal) |

## Otros operadores seed

| Usuario | Rol | Depósito |
|---------|-----|----------|
| `supervisor` | supervisor | transversal |
| `cajero.lic` | cajero | LIC |
| `cajero.bod` | cajero | BOD |
| `mesonera.lic` | mesonera | LIC |
| `mesonera.bod` | mesonera | BOD |
| `inventario` | inventario | transversal |
| `tv` | tv | transversal |

**No mostrar estas credenciales en la UI pública del Home/login.**
