import type { RoutePath } from "@/types/routes";

export type PageSeo = {
  title: string;
  description: string;
};

export type SeoMap = Record<RoutePath, PageSeo>;
