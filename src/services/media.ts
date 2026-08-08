import type { MediaAsset } from "@/types/media";
import type { PaginatedResponse } from "@/types/api";

/**
 * Media service scaffold.
 * Prepared for future API integration.
 */
export const mediaService = {
  async list(): Promise<PaginatedResponse<MediaAsset>> {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
  },
};
