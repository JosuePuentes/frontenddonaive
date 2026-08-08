export const authConfig = {
  // Future auth endpoints / strategies will be defined here.
  strategy: "jwt" as const,
  storageKey: "donaive-auth",
  enabled: false,
} as const;
