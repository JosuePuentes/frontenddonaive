/**
 * Gate de rutas A&D — acceso no autorizado.
 * El reproductor TV (/tv/pantalla/:id) es público (solo pairing + playback).
 */
import type { AdPermission } from "@/types/ad-licoreria";
import { can } from "@/lib/ad-licoreria/access";
import type { AdOperator, AdRole } from "@/types/ad-licoreria";

export type AdRouteAccessRule = {
  /** Prefijo de pathname normalizado (sin /licoreria). */
  prefix: string;
  anyOf: AdPermission[];
};

/** Rutas administrativas / operativas con requisito. */
export const AD_ROUTE_ACCESS_RULES: AdRouteAccessRule[] = [
  { prefix: "/ventas", anyOf: ["pos.sell"] },
  { prefix: "/cuentas", anyOf: ["pos.sell", "pos.close_account", "accounts.open", "accounts.serve"] },
  { prefix: "/cierres", anyOf: ["closures.create"] },
  { prefix: "/clientes", anyOf: ["clients.read"] },
  { prefix: "/inventario", anyOf: ["inventory.read"] },
  { prefix: "/depositos", anyOf: ["deposits.manage", "inventory.read"] },
  { prefix: "/productos", anyOf: ["inventory.read", "settings.manage"] },
  { prefix: "/presentaciones", anyOf: ["inventory.read", "settings.manage"] },
  { prefix: "/cop", anyOf: ["cop.read"] },
  { prefix: "/reportes", anyOf: ["reports.read"] },
  { prefix: "/configuracion/diseno/preview", anyOf: ["settings.manage"] },
  { prefix: "/configuracion/diseno", anyOf: ["settings.manage"] },
  { prefix: "/configuracion/usuarios", anyOf: ["users.manage"] },
  { prefix: "/configuracion/permisos", anyOf: ["users.manage"] },
  { prefix: "/configuracion", anyOf: ["settings.manage"] },
  { prefix: "/mesonera", anyOf: ["accounts.open", "accounts.serve", "tables.manage"] },
  { prefix: "/mesas", anyOf: ["tables.manage", "accounts.open"] },
  { prefix: "/qr", anyOf: ["accounts.serve", "pos.sell", "clients.read"] },
  { prefix: "/prepagos", anyOf: ["accounts.serve", "pos.sell"] },
  { prefix: "/tv/pantallas", anyOf: ["tv.view", "tv.screen.manage"] },
  { prefix: "/tv/contenido", anyOf: ["tv.view", "tv.content.manage"] },
  { prefix: "/tv/grupos", anyOf: ["tv.view", "tv.groups.manage"] },
  { prefix: "/tv/control", anyOf: ["tv.view", "tv.control"] },
  { prefix: "/tv", anyOf: ["tv.view"] },
];

export function isTvPlayerPath(normalizedPath: string): boolean {
  return (
    /^\/tv\/pantalla(\/|$)/.test(normalizedPath) ||
    /^\/tv\/reproductor(\/[^/]+)/.test(normalizedPath)
  );
}

export function requiredPermissionsForPath(
  normalizedPath: string,
): AdPermission[] | null {
  if (isTvPlayerPath(normalizedPath)) return null;
  if (normalizedPath === "/" || normalizedPath === "/inicio") return null;
  const match = AD_ROUTE_ACCESS_RULES.find(
    (r) =>
      normalizedPath === r.prefix || normalizedPath.startsWith(`${r.prefix}/`),
  );
  return match?.anyOf ?? null;
}

export function canAccessPath(
  user: AdOperator | null | undefined,
  normalizedPath: string,
  roleOverrides?: Partial<Record<AdRole, AdPermission[]>>,
): boolean {
  const required = requiredPermissionsForPath(normalizedPath);
  if (!required) return true;
  if (!user || !user.active) return false;
  return required.some((p) => can(user, p, roleOverrides));
}
