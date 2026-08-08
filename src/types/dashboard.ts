export type DashboardModuleId =
  | "activity"
  | "content"
  | "clients"
  | "services"
  | "resources";

export type DashboardModule = {
  id: DashboardModuleId;
  title: string;
  description: string;
};

export type BreadcrumbItem = {
  label: string;
  to?: string;
};
