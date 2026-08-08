export const queryKeys = {
  auth: {
    root: ["auth"] as const,
    session: ["auth", "session"] as const,
  },
  dashboard: {
    root: ["dashboard"] as const,
    overview: ["dashboard", "overview"] as const,
  },
  users: {
    root: ["users"] as const,
    list: ["users", "list"] as const,
  },
  blog: {
    root: ["blog"] as const,
    list: ["blog", "list"] as const,
  },
  academy: {
    root: ["academy"] as const,
    list: ["academy", "list"] as const,
  },
  media: {
    root: ["media"] as const,
    list: ["media", "list"] as const,
  },
  products: {
    root: ["products"] as const,
    list: ["products", "list"] as const,
  },
  services: {
    root: ["services"] as const,
    list: ["services", "list"] as const,
  },
  cases: {
    root: ["cases"] as const,
    list: ["cases", "list"] as const,
  },
  analytics: {
    root: ["analytics"] as const,
    overview: ["analytics", "overview"] as const,
  },
  crm: {
    root: ["crm"] as const,
    overview: ["crm", "overview"] as const,
  },
  leads: {
    root: ["leads"] as const,
    list: ["leads", "list"] as const,
    detail: (id: string) => ["leads", "detail", id] as const,
  },
  contacts: {
    root: ["contacts"] as const,
    list: ["contacts", "list"] as const,
  },
  organizations: {
    root: ["organizations"] as const,
    list: ["organizations", "list"] as const,
  },
  opportunities: {
    root: ["opportunities"] as const,
    list: ["opportunities", "list"] as const,
  },
  diagnostics: {
    root: ["diagnostics"] as const,
    list: ["diagnostics", "list"] as const,
  },
  proposals: {
    root: ["proposals"] as const,
    list: ["proposals", "list"] as const,
  },
  projects: {
    root: ["projects"] as const,
    list: ["projects", "list"] as const,
  },
  interactions: {
    root: ["interactions"] as const,
    list: ["interactions", "list"] as const,
  },
} as const;
