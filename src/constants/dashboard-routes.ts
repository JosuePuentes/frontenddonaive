export const DASHBOARD_ROUTES = {
  root: "/dashboard",
  usuarios: "/dashboard/usuarios",
  roles: "/dashboard/roles",
  blog: "/dashboard/blog",
  academy: "/dashboard/academy",
  media: "/dashboard/media",
  productos: "/dashboard/productos",
  servicios: "/dashboard/servicios",
  casos: "/dashboard/casos",
  archivos: "/dashboard/archivos",
  configuracion: "/dashboard/configuracion",
  perfil: "/dashboard/perfil",
} as const;

export type DashboardRouteKey = keyof typeof DASHBOARD_ROUTES;
export type DashboardRoutePath =
  (typeof DASHBOARD_ROUTES)[DashboardRouteKey];

export type DashboardNavItem = {
  key: DashboardRouteKey;
  label: string;
  to: DashboardRoutePath;
  icon:
    | "layout"
    | "users"
    | "shield"
    | "blog"
    | "academy"
    | "media"
    | "products"
    | "services"
    | "cases"
    | "files"
    | "settings";
};

export const dashboardNavItems: DashboardNavItem[] = [
  { key: "root", label: "Dashboard", to: DASHBOARD_ROUTES.root, icon: "layout" },
  { key: "usuarios", label: "Usuarios", to: DASHBOARD_ROUTES.usuarios, icon: "users" },
  { key: "roles", label: "Roles", to: DASHBOARD_ROUTES.roles, icon: "shield" },
  { key: "blog", label: "Blog", to: DASHBOARD_ROUTES.blog, icon: "blog" },
  { key: "academy", label: "Academy", to: DASHBOARD_ROUTES.academy, icon: "academy" },
  { key: "media", label: "Media", to: DASHBOARD_ROUTES.media, icon: "media" },
  {
    key: "productos",
    label: "Productos",
    to: DASHBOARD_ROUTES.productos,
    icon: "products",
  },
  {
    key: "servicios",
    label: "Servicios",
    to: DASHBOARD_ROUTES.servicios,
    icon: "services",
  },
  {
    key: "casos",
    label: "Casos de éxito",
    to: DASHBOARD_ROUTES.casos,
    icon: "cases",
  },
  {
    key: "archivos",
    label: "Archivos",
    to: DASHBOARD_ROUTES.archivos,
    icon: "files",
  },
  {
    key: "configuracion",
    label: "Configuración",
    to: DASHBOARD_ROUTES.configuracion,
    icon: "settings",
  },
];
