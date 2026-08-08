export const ROUTES = {
  home: "/",
  empresa: "/empresa",
  soluciones: "/soluciones",
  academy: "/academy",
  media: "/media",
  blog: "/blog",
  contacto: "/contacto",
  privacidad: "/privacidad",
  terminos: "/terminos",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

export const publicRouteList = [
  { key: "home", path: ROUTES.home, label: "Inicio" },
  { key: "empresa", path: ROUTES.empresa, label: "Empresa" },
  { key: "soluciones", path: ROUTES.soluciones, label: "Soluciones" },
  { key: "academy", path: ROUTES.academy, label: "Academy" },
  { key: "media", path: ROUTES.media, label: "Media" },
  { key: "blog", path: ROUTES.blog, label: "Blog" },
  { key: "contacto", path: ROUTES.contacto, label: "Contacto" },
  { key: "privacidad", path: ROUTES.privacidad, label: "Privacidad" },
  { key: "terminos", path: ROUTES.terminos, label: "Términos" },
] as const;
