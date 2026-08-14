/**
 * Rutas públicas de POLISUR.
 *
 * Namespace `/polisur` para no colisionar con Donaive
 * (cuya raíz `/` y `/contacto` ya existen).
 *
 * Cuando el dominio oficial de POLISUR apunte a este despliegue,
 * se podrá mapear el host a este namespace (rewrite/Vercel) sin
 * reemplazar las rutas de Donaive.
 */
export const POLISUR_ROUTES = {
  home: "/polisur",
  institucion: "/polisur#institucion",
  divisiones: "/polisur/divisiones",
  unidadCanina: "/polisur/unidad-canina",
  preinscripcion: "/polisur/preinscripcion",
  contacto: "/polisur/contacto",
  /** Acceso interno — no incluir en navegación principal */
  medios: "/polisur/medios",
} as const;

export type PolisurRouteKey = keyof typeof POLISUR_ROUTES;
export type PolisurRoutePath = (typeof POLISUR_ROUTES)[PolisurRouteKey];

export const polisurNavItems = [
  { key: "inicio", label: "Inicio", to: POLISUR_ROUTES.home },
  { key: "institucion", label: "Institución", to: POLISUR_ROUTES.institucion },
  { key: "divisiones", label: "Divisiones", to: POLISUR_ROUTES.divisiones },
  {
    key: "unidad-canina",
    label: "Unidad Canina",
    to: POLISUR_ROUTES.unidadCanina,
  },
  {
    key: "preinscripcion",
    label: "Preinscripción",
    to: POLISUR_ROUTES.preinscripcion,
  },
  { key: "contacto", label: "Contacto", to: POLISUR_ROUTES.contacto },
] as const;
