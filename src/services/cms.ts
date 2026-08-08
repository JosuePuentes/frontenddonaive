import type { CmsContentItem } from "@/types/cms";
import type { PaginatedResponse } from "@/types/api";

/**
 * CMS service scaffold.
 * Prepared for future API integration.
 */
export const cmsService = {
  async list(): Promise<PaginatedResponse<CmsContentItem>> {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
  },
};
