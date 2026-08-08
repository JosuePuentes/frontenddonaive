import type { PaginatedResponse } from "@/types/api";
import type { Service, ServiceCategory, ServicePackage } from "@/types/services";
import { DEFAULT_SERVICE_CATEGORIES } from "@/types/services";

/**
 * Catalog service scaffold.
 * Typed stubs only — no HTTP, fetch, or persistence.
 */
export const servicesService = {
  async getServices(): Promise<PaginatedResponse<Service>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  },

  async getService(_id: string): Promise<Service | null> {
    return null;
  },

  async createService(_input: Partial<Service>): Promise<Service | null> {
    return null;
  },

  async updateService(
    _id: string,
    _input: Partial<Service>,
  ): Promise<Service | null> {
    return null;
  },

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return DEFAULT_SERVICE_CATEGORIES;
  },

  async getServicePackages(): Promise<ServicePackage[]> {
    return [];
  },
};
