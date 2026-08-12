import { apiGetJson, type ApiResult } from "@/services/apiClient";

export type HealthLiveResponse = {
  status: "ok";
  service: string;
  check: "live";
  timestamp: string;
};

export const healthService = {
  async getLive(): Promise<ApiResult<HealthLiveResponse>> {
    return apiGetJson<HealthLiveResponse>("/health/live");
  },
};

