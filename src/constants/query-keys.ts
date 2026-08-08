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
} as const;
