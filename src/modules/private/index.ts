/**
 * Private module entrypoint.
 * Scaffold only — no business logic yet.
 */

export {
  DASHBOARD_ROUTES,
  crmNavGroup,
  dashboardNavItems,
} from "@/constants/dashboard-routes";
export { ROLES, PERMISSIONS, rolePermissions } from "@/constants/permissions";
export { queryKeys } from "@/constants/query-keys";
export { canAccess } from "@/types/permissions";
export * from "@/modules/private/crm";
