export const DASHBOARD_ROUTES = {
  root: "/dashboard",
  usuarios: "/dashboard/usuarios",
  roles: "/dashboard/roles",
  blog: "/dashboard/blog",
  academy: "/dashboard/academy",
  media: "/dashboard/media",
  productos: "/dashboard/productos",
  servicios: "/dashboard/servicios",
  servicioNuevo: "/dashboard/servicios/nuevo",
  servicioDetail: "/dashboard/servicios/:id",
  casos: "/dashboard/casos",
  archivos: "/dashboard/archivos",
  configuracion: "/dashboard/configuracion",
  perfil: "/dashboard/perfil",
  crm: "/dashboard/crm",
  crmLeads: "/dashboard/crm/leads",
  crmLeadDetail: "/dashboard/crm/leads/:id",
  crmOportunidades: "/dashboard/crm/oportunidades",
  crmDiagnosticos: "/dashboard/crm/diagnosticos",
  crmDiagnosticoNuevo: "/dashboard/crm/diagnosticos/nuevo",
  crmDiagnosticoDetail: "/dashboard/crm/diagnosticos/:id",
  crmPropuestas: "/dashboard/crm/propuestas",
  crmPropuestaNueva: "/dashboard/crm/propuestas/nueva",
  crmPropuestaDetail: "/dashboard/crm/propuestas/:id",
  crmProyectos: "/dashboard/crm/proyectos",
} as const;

export type DashboardRouteKey = keyof typeof DASHBOARD_ROUTES;
export type DashboardRoutePath =
  (typeof DASHBOARD_ROUTES)[DashboardRouteKey];

export type DashboardNavIcon =
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
  | "settings"
  | "crm"
  | "leads"
  | "pipeline"
  | "diagnosis"
  | "proposals"
  | "projects";

export type DashboardNavItem = {
  key: string;
  label: string;
  to: string;
  icon: DashboardNavIcon;
  end?: boolean;
};

export type DashboardNavGroup = {
  key: string;
  label: string;
  icon: DashboardNavIcon;
  items: DashboardNavItem[];
};

export const dashboardNavItems: DashboardNavItem[] = [
  { key: "root", label: "Dashboard", to: DASHBOARD_ROUTES.root, icon: "layout", end: true },
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

export const crmNavGroup: DashboardNavGroup = {
  key: "crm",
  label: "CRM",
  icon: "crm",
  items: [
    {
      key: "crm-dashboard",
      label: "Dashboard",
      to: DASHBOARD_ROUTES.crm,
      icon: "crm",
      end: true,
    },
    {
      key: "crm-leads",
      label: "Leads",
      to: DASHBOARD_ROUTES.crmLeads,
      icon: "leads",
    },
    {
      key: "crm-oportunidades",
      label: "Oportunidades",
      to: DASHBOARD_ROUTES.crmOportunidades,
      icon: "pipeline",
    },
    {
      key: "crm-diagnosticos",
      label: "Diagnósticos",
      to: DASHBOARD_ROUTES.crmDiagnosticos,
      icon: "diagnosis",
    },
    {
      key: "crm-propuestas",
      label: "Propuestas",
      to: DASHBOARD_ROUTES.crmPropuestas,
      icon: "proposals",
    },
    {
      key: "crm-proyectos",
      label: "Proyectos",
      to: DASHBOARD_ROUTES.crmProyectos,
      icon: "projects",
    },
  ],
};

export function crmLeadDetailPath(id: string) {
  return `/dashboard/crm/leads/${id}`;
}

export function crmDiagnosticoDetailPath(id: string) {
  return `/dashboard/crm/diagnosticos/${id}`;
}

export function crmDiagnosticoNuevoPath(leadId?: string) {
  if (!leadId) return DASHBOARD_ROUTES.crmDiagnosticoNuevo;
  return `${DASHBOARD_ROUTES.crmDiagnosticoNuevo}?leadId=${encodeURIComponent(leadId)}`;
}

export function servicioDetailPath(id: string) {
  return `/dashboard/servicios/${id}`;
}

export function crmPropuestaDetailPath(id: string) {
  return `/dashboard/crm/propuestas/${id}`;
}

export function crmPropuestaNuevaPath(options?: {
  diagnosisId?: string;
  opportunityId?: string;
}) {
  const params = new URLSearchParams();
  if (options?.diagnosisId) params.set("diagnosisId", options.diagnosisId);
  if (options?.opportunityId) {
    params.set("opportunityId", options.opportunityId);
  }
  const query = params.toString();
  return query
    ? `${DASHBOARD_ROUTES.crmPropuestaNueva}?${query}`
    : DASHBOARD_ROUTES.crmPropuestaNueva;
}
