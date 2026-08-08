import type { RouteKey, RoutePath } from "@/constants/routes";

export type { RouteKey, RoutePath };

export type NavLinkItem = {
  label: string;
  to: RoutePath;
};
