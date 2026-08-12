import { apiGetJson, type ApiResult } from "@/services/apiClient";

/**
 * TEMPORAL — solo para prueba de integración frontend → API → PostgreSQL.
 * NO es autenticación real. NO usar donaive_admin.
 * Eliminar/reemplazar cuando exista sesión/JWT.
 */
export const DEV_TEST_USER_ID = "00000000-0000-4000-8000-00000000dead";

export type ProjectsListResponse = {
  data: unknown[];
};

export const projectsService = {
  async getProjects(): Promise<ApiResult<ProjectsListResponse>> {
    return apiGetJson<ProjectsListResponse>("/api/v1/projects", {
      headers: {
        "X-User-Id": DEV_TEST_USER_ID,
        "X-User-Roles": "project_user",
      },
    });
  },
};
