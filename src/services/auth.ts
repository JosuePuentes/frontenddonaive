import type { AuthSession } from "@/types/auth";

/**
 * Auth service scaffold.
 * No network calls are performed in this stage.
 */
export const authService = {
  async getSession(): Promise<AuthSession> {
    return {
      user: null,
      isAuthenticated: false,
    };
  },
};
