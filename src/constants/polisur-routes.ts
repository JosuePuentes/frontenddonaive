import { getPolisurBasePath } from "@/lib/polisur-host";

/**
 * Rutas públicas de POLISUR.
 *
 * - Donaive / desarrollo: prefijo `/polisur` (no colisiona con `/`, `/contacto`, etc.)
 * - Dominio propio polisur.com.ve: rutas en raíz (`/`, `/unidad-canina`, …)
 */
const POLISUR_SEGMENTS = {
  divisiones: "/divisiones",
  unidadCanina: "/unidad-canina",
  preinscripcion: "/preinscripcion",
  contacto: "/contacto",
  medios: "/medios",
} as const;

export type PolisurRoutes = {
  home: string;
  institucion: string;
  divisiones: string;
  unidadCanina: string;
  preinscripcion: string;
  preinscripcionCanina: string;
  contacto: string;
  medios: string;
};

function joinPolisurPath(base: "" | "/polisur", segment: string): string {
  if (!segment) {
    return base || "/";
  }
  return `${base}${segment}`;
}

export function getPolisurRoutes(base = getPolisurBasePath()): PolisurRoutes {
  const home = joinPolisurPath(base, "");
  return {
    home,
    institucion: `${home}#institucion`,
    divisiones: joinPolisurPath(base, POLISUR_SEGMENTS.divisiones),
    unidadCanina: joinPolisurPath(base, POLISUR_SEGMENTS.unidadCanina),
    preinscripcion: joinPolisurPath(base, POLISUR_SEGMENTS.preinscripcion),
    preinscripcionCanina: `${joinPolisurPath(base, POLISUR_SEGMENTS.preinscripcion)}?unidad=canina`,
    contacto: joinPolisurPath(base, POLISUR_SEGMENTS.contacto),
    medios: joinPolisurPath(base, POLISUR_SEGMENTS.medios),
  };
}

/** Alias estático para compatibilidad (resuelve en runtime según hostname). */
export const POLISUR_ROUTES = getPolisurRoutes();

export type PolisurRouteKey = keyof PolisurRoutes;
export type PolisurRoutePath = PolisurRoutes[PolisurRouteKey];

export function getPolisurNavItems(base = getPolisurBasePath()) {
  const routes = getPolisurRoutes(base);
  return [
    { key: "inicio", label: "Inicio", to: routes.home },
    { key: "institucion", label: "Institución", to: routes.institucion },
    { key: "divisiones", label: "Divisiones", to: routes.divisiones },
    {
      key: "unidad-canina",
      label: "Unidad Canina",
      to: routes.unidadCanina,
    },
    {
      key: "preinscripcion",
      label: "Preinscripción",
      to: routes.preinscripcion,
    },
    { key: "contacto", label: "Contacto", to: routes.contacto },
  ] as const;
}

export const polisurNavItems = getPolisurNavItems();

/** Prefijos de ruta registrados en React Router (dominio propio + namespace legacy). */
export const POLISUR_ROUTE_PREFIXES = ["", "/polisur"] as const;

export function polisurRouterPath(
  prefix: "" | "/polisur",
  segment: keyof typeof POLISUR_SEGMENTS | "home",
): string {
  if (segment === "home") {
    return prefix || "/";
  }
  return joinPolisurPath(prefix, POLISUR_SEGMENTS[segment]);
}
