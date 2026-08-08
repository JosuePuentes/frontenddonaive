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
  diagnoses: {
    root: ["diagnoses"] as const,
    list: ["diagnoses", "list"] as const,
  },
  diagnosis: {
    root: ["diagnosis"] as const,
    detail: (id: string) => ["diagnosis", "detail", id] as const,
  },
  observations: {
    root: ["observations"] as const,
    byDiagnosis: (id: string) => ["observations", "diagnosis", id] as const,
  },
  problems: {
    root: ["problems"] as const,
    byDiagnosis: (id: string) => ["problems", "diagnosis", id] as const,
  },
  causes: {
    root: ["causes"] as const,
    byDiagnosis: (id: string) => ["causes", "diagnosis", id] as const,
  },
  impacts: {
    root: ["impacts"] as const,
    byDiagnosis: (id: string) => ["impacts", "diagnosis", id] as const,
  },
  processes: {
    root: ["processes"] as const,
    current: (id: string) => ["processes", "current", id] as const,
    proposed: (id: string) => ["processes", "proposed", id] as const,
  },
  automation: {
    root: ["automation"] as const,
    byDiagnosis: (id: string) => ["automation", "diagnosis", id] as const,
  },
  solutions: {
    root: ["solutions"] as const,
    byDiagnosis: (id: string) => ["solutions", "diagnosis", id] as const,
  },
  recommendations: {
    root: ["recommendations"] as const,
    byDiagnosis: (id: string) => ["recommendations", "diagnosis", id] as const,
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
